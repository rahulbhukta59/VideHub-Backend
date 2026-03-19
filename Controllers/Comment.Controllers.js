import mongoose from "mongoose"
import Comment from "../Models/Comment.Models.js"
import { Video } from "../Models/Video.Models.js"

export const getVideoComments = async (req, res) => {
    try {
        const { videoId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        if (!mongoose.Types.ObjectId.isValid(videoId)) {
            return res.status(400).json({ message: "Invalid video id" });
        }
        const video = await Video.findById(videoId);
        if (!video) {
            return res.status(404).json({ message: "Video not found" });
        }
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const comments = await Comment.find({ video: videoId })
            .sort({ createdAt: -1 })
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber)
            .populate("owner", "username avatar");
        const totalComments = await Comment.countDocuments({ video: videoId });
        return res.status(200).json({
            totalComments,
            currentPage: pageNumber,
            totalPages: Math.ceil(totalComments / limitNumber),
            comments
        });

    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const addComment = async (req, res) => {
      try {
        const { videoId } = req.params;
        const { content } = req.body;
        if (!content || content.trim() === "") {
            return res.status(400).json({ message: "Content is required" });
        }
        if (!mongoose.Types.ObjectId.isValid(videoId)) {
            return res.status(400).json({ message: "Invalid video id" });
        }
        const video = await Video.findById(videoId);
        if (!video) {
            return res.status(404).json({ message: "Video not found" });
        }
        const newComment = await Comment.create({
            content,
            video: videoId,
            owner: req.user._id
        });
        return res.status(201).json({
            message: "Comment added successfully",
            comment: newComment
        });

    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const updateComment = async (req, res) => {
     try {
        const { commentId } = req.params;
        const { content } = req.body;

        if (!content || content.trim() === "") {
            return res.status(400).json({ message: "Content is required" });
        }
        if (!mongoose.Types.ObjectId.isValid(commentId)) {
            return res.status(400).json({ message: "Invalid comment id" });
        }
        const existingComment = await Comment.findById(commentId);
        if (!existingComment) {
            return res.status(404).json({ message: "Comment not found" });
        }
        if (existingComment.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized" });
        }
        existingComment.content = content;
        await existingComment.save();

        return res.status(200).json({
            message: "Comment updated successfully",
            comment: existingComment
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const deleteComment = async (req, res) => {
     try {
        const { commentId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(commentId)) {
            return res.status(400).json({ message: "Invalid comment id" });
        }
        const existingComment = await Comment.findById(commentId);
        if (!existingComment) {
            return res.status(404).json({ message: "Comment not found" });
        }
        if (existingComment.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized" });
        }
        await Comment.findByIdAndDelete(commentId);
        return res.status(200).json({
            message: "Comment deleted successfully"
        });

    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}
