import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../Models/Video.Models.js"
import Comment from "../Models/Comment.Models.js"
import Like from "../Models/Like.Models.js"

export const toggleVideoLike = async (req, res) => {
  try {

    const { videoId } = req.params;
    const { type } = req.body; // like or dislike

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({ message: "Invalid video id" });
    }

    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    const existingReaction = await Like.findOne({
      likedBy: req.user._id,
      video: videoId
    });

    // USER ALREADY REACTED
    if (existingReaction) {

      // same reaction → remove it
      if (existingReaction.type === type) {

        await Like.findByIdAndDelete(existingReaction._id);

      } 
      // different reaction → update it
      else {

        existingReaction.type = type;
        await existingReaction.save();

      }

    } 
    // NO REACTION → CREATE
    else {

      await Like.create({
        video: videoId,
        likedBy: req.user._id,
        type
      });

    }

    const likesCount = await Like.countDocuments({
      video: videoId,
      type: "like"
    });

    const dislikesCount = await Like.countDocuments({
      video: videoId,
      type: "dislike"
    });

    return res.status(200).json({
      likesCount,
      dislikesCount
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      message: "Internal server error"
    });

  }
};

export const toggleCommentLike = async (req, res) => {
     try {
        const { commentId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(commentId)) {
            return res.status(400).json({ message: "Invalid comment id" });
        }
        const commentExists = await Comment.findById(commentId);
        if (!commentExists) {
            return res.status(404).json({ message: "Comment not found" });
        }
        const existingLike = await Like.findOne({
            likedBy: req.user._id,
            comment: commentId
        });
        if (existingLike) {
            await Like.findByIdAndDelete(existingLike._id);
            return res.status(200).json({
                message: "Comment unliked successfully",
                liked: false
            });
        }
        await Like.create({
            comment: commentId,
            likedBy: req.user._id
        });

        return res.status(200).json({
            message: "Comment liked successfully",
            liked: true
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
        
        
    }
}

export const getLikedVideos = async (req, res) => {
    try {
        const likedvideos = await Like.find({
            likedBy:req.user._id,
            video:{$exists:true}
        }).sort({createdAt:-1})
        return res.status(200).json({
            count:likedvideos.length,
            likedvideos
        })
    } catch (error) {
        return res.status(500).json({message:"internal server error"})
    }
}
