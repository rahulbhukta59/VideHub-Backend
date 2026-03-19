import mongoose, { isValidObjectId } from "mongoose";
import User from "../Models/User.Models.js";
import { Video } from "../Models/Video.Models.js";
import { v2 as cloudinary } from "cloudinary";
import uploadOnCloudinary from "../Middlewares/Cloudinary.js";
import fs from "fs";
import { exec } from "child_process";
import path from "path";
import Like from "../Models/Like.Models.js";
import { v4 as uuid } from "uuid";

export const uploadvideo = async (req, res) => {
  try {
    const { title, description, isPublished } = req.body;

    if (!title || !description) {
      return res
        .status(400)
        .json({ message: "Title and description are required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Video not sent!" });
    }
    const publishStatus = isPublished === "false" ? false : true;

    // const videoId = uuid();
    const videoId = new mongoose.Types.ObjectId().toString();
    const inputPath = req.file.path;
    const outputRoot = path.join(process.cwd(), "hls-output", videoId);

    const resolutions = [
      { name: "360p", width: 640, height: 360, bitrate: "800k" },
      { name: "480p", width: 854, height: 480, bitrate: "1400k" },
      { name: "720p", width: 1280, height: 720, bitrate: "2800k" },
      { name: "1080p", width: 1920, height: 1080, bitrate: "5000k" },
    ];

    fs.mkdirSync(outputRoot, { recursive: true });

    const runCommand = (cmd) =>
      new Promise((resolve, reject) => {
        exec(cmd, (error, stdout) => {
          if (error) reject(error);
          else resolve(stdout);
        });
      });

    // duration
    const durationCommand = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`;
    const durationOutput = await runCommand(durationCommand);
    const parsedDuration = parseFloat(durationOutput);
    const duration = isNaN(parsedDuration) ? 0 : Math.floor(parsedDuration);

    const thumbnailPath = path.join(outputRoot, "thumbnail.jpg");
    await runCommand(
      `ffmpeg -i "${inputPath}" -ss 00:00:02 -vframes 1 "${thumbnailPath}"`,
    );

    for (const r of resolutions) {
      const outputDir = path.join(outputRoot, r.name);
      fs.mkdirSync(outputDir, { recursive: true });

      const command = `ffmpeg -i "${inputPath}" -vf scale=${r.width}:${r.height} -c:v libx264 -b:v ${r.bitrate} -c:a aac -b:a 128k -f hls -hls_time 10 -hls_playlist_type vod -hls_segment_filename "${outputDir}/segment%03d.ts" "${outputDir}/index.m3u8"`;

      await runCommand(command);
    }

    const masterPlaylistPath = path.join(outputRoot, "master.m3u8");
    console.log("Writing master playlist at:", masterPlaylistPath);
    let masterContent = "#EXTM3U\n";

    for (const r of resolutions) {
      masterContent += `#EXT-X-STREAM-INF:BANDWIDTH=${parseInt(r.bitrate) * 1000},RESOLUTION=${r.width}x${r.height}\n`;
      masterContent += `${r.name}/index.m3u8\n`;
    }

    fs.writeFileSync(masterPlaylistPath, masterContent);

    const uploadedThumbnail = await uploadOnCloudinary(thumbnailPath);
    if (!uploadedThumbnail) {
      return res.status(500).json({
        success: false,
        message: "Thumbnail upload failed",
      });
    }
    const uploadedMaster = await uploadOnCloudinary(masterPlaylistPath);

    // for (const r of resolutions) {
    //   const dir = path.join(outputRoot, r.name);
    //   const files = fs.readdirSync(dir);

    //   for (const file of files) {
    //     await uploadOnCloudinary(path.join(dir, file));
    //   }
    // }
    const newVideo = await Video.create({
      _id: videoId,
      title,
      description,
      videoFile: `/streams/${videoId}/master.m3u8`,
      thumbnail: uploadedThumbnail,
      duration,
      owner: req.user._id,
      isPublished: publishStatus,
    });

    // if (fs.existsSync(outputRoot)) {
    //   fs.rmSync(outputRoot, { recursive: true, force: true });
    // }

    if (fs.existsSync(inputPath)) {
      fs.unlinkSync(inputPath);
    }

    return res.status(201).json({
      success: true,
      video: newVideo,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Video processing failed",
      error: error.message,
    });
  }
};

const getAllVideos = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      query,
      sortBy = "createdAt",
      sortType = "desc",
      userId,
    } = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    const matchStage = { isPublished: true };
    
     if (req.query.userOnly === "true" && req.user) {
  matchStage.owner = req.user._id;
}

    if (query) {
      matchStage.$or = [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ];
    }

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      matchStage.owner = new mongoose.Types.ObjectId(userId);
    }

    const sortStage = {
      [sortBy]: sortType === "asc" ? 1 : -1,
    };

    const aggregate = Video.aggregate([
      { $match: matchStage },

      {
        $lookup: {
          from: "users",
          let: { ownerId: "$owner" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$ownerId"] } } },
            {
              $project: {
                username: 1,
                name: 1,
                profileimage: 1,
              },
            },
          ],
          as: "owner",
        },
      },
      {
        $unwind: {
          path: "$owner",
          preserveNullAndEmptyArrays: true,
        },
      },

      { $sort: sortStage },
    ]);

    const options = {
      page: pageNumber,
      limit: limitNumber,
    };

    const videos = await Video.aggregatePaginate(aggregate, options);

    return res.status(200).json({
      success: true,
      videos: videos.docs,
      totalDocs: videos.totalDocs,
      totalPages: videos.totalPages,
      page: videos.page,
      limit: videos.limit,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch videos",
      error: error.message,
    });
  }
};

const getVideoById = async (req, res) => {
  try {
    const videoId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({ message: "Invalid video ID" });
    }

    const video = await Video.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(videoId),
        },
      },
      {
        $lookup: {
          from: "users",
          let: { ownerId: "$owner" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$ownerId"] } } },
            {
              $project: {
                username: 1,
                name: 1,
                profileimage: 1,
              },
            },
          ],
          as: "owner",
        },
      },
      {
        $unwind: {
          path: "$owner",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    if (!video.length) {
      return res.status(404).json({ message: "Video not found" });
    }

    const likesCount = await Like.countDocuments({
      video: videoId,
      type: "like",
    });

    const dislikesCount = await Like.countDocuments({
      video: videoId,
      type: "dislike",
    });

    await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });

    // SAVE WATCH HISTORY
    if (req.user && req.user._id) {
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { watchHistory: videoId },
      });
    }

    return res.status(200).json({
      success: true,
      video: video[0],
      likesCount,
      dislikesCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch video",
      error: error.message,
    });
  }
};

const updateVideo = async (req, res) => {
  try {
    const videoId = req.params.id;

    const { title, description, isPublished } = req.body;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({ message: "Invalid video ID" });
    }

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }
    // console.log(video.owner);
    // console.log("REQ USER:", req.user);

    if (!video.owner) {
      return res.status(400).json({ message: "Video owner not found" });
    }

    if (video.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    let updatedThumbnail = video.thumbnail;

    const thumbnailLocalPath = req.file?.path;
    // if (thumbnailLocalPath && !req.file.mimetype.startsWith("image/")) {
    // return res.status(400).json({ message: "Invalid file type" });
    // }

    if (thumbnailLocalPath) {
      if (video.thumbnail) {
        const parts = video.thumbnail.split("/");
        const publicId = parts
          .slice(parts.indexOf("videos"))
          .join("/")
          .split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      }

      const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
      if (!uploadedThumbnail) {
        return res.status(400).json({ message: "Thumbnail upload failed" });
      }

      updatedThumbnail = uploadedThumbnail;
    }

    let publishStatus = video.isPublished;
    if (typeof isPublished !== "undefined") {
      publishStatus = isPublished === "true";
    }

    if (
      !title &&
      !description &&
      typeof isPublished === "undefined" &&
      !thumbnailLocalPath
    ) {
      return res.status(400).json({ message: "No fields provided to update" });
    }

    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      {
        $set: {
          title: title || video.title,
          description: description || video.description,
          thumbnail: updatedThumbnail,
          isPublished: publishStatus,
        },
      },
      { new: true },
    );

    return res.status(200).json({
      success: true,
      message: "Video updated successfully",
      video: updatedVideo,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update video",
      error: error.message,
    });
  }
};

const deleteVideo = async (req, res) => {
  try {
    const videoId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({ message: "Invalid video ID" });
    }

    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    if (!video.owner) {
      return res.status(400).json({
        message: "Video has no owner. It was created without authentication.",
      });
    }

    if (video.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await Video.findByIdAndDelete(videoId);

    return res.status(200).json({
      success: true,
      message: "Video deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete video",
      error: error.message,
    });
  }
};

export const searchvideos = async (req, res) => {
  try {
    const { query } = req.query;
    const videos = await Video.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    });
    return res.status(200).json({
      success: true,
      videos: videos,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch videos",
      error: error.message,
    });
  }
};

export { getAllVideos, getVideoById, updateVideo, deleteVideo };
