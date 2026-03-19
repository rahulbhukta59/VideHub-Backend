import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../Models/Playlist.Models.js"
import { Video } from "../Models/Video.Models.js"

export const createPlaylist =async(req, res) => {
    try {
        const {name, description} = req.body
        if(!name || !description){
            return res.status(400).json({message:"name and description are required"})
        }
        const playlist = await Playlist.create({
            name,
            description,
            owner:req.user._id
        })
        return res.status(201).json({message:"playlist created successfully", playlist})
    } catch (error) {
        return res.status(500).json({message:"internal server error"})
    }
}

export const getUserPlaylists =async(req, res) => {
     try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                message: "Unauthorized access"
            });
        }

        const playlists = await Playlist.find({
            owner: req.user._id
        })
        .populate("videos")
        .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: playlists.length,
            playlists
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export const getPlaylistById =async(req, res) => {
     try {
        const { playlistId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(playlistId)) {
            return res.status(400).json({ message: "Invalid playlist id" });
        }
        const playlist = await Playlist.findById(playlistId)
            .populate("videos")
            .populate("owner", "username email");

        if (!playlist) {
            return res.status(404).json({ message: "Playlist not found" });
        }
        return res.status(200).json({ playlist });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const addVideoToPlaylist = async(req, res) => {
    try {
        const {playlistId, videoId} = req.params 
        const video = await Video.findById(videoId)
        const playlist = await Playlist.findById(playlistId)
        if(!playlist){
            return res.status(400).json({message:"playlist not found"})
        }
        if(!video){
            return res.status(400).json({message:"video not found"})
        }
        if (playlist.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "You are not authorized to modify this playlist"
            });
        }
        if(playlist.videos.includes(videoId)){
            return res.status(400).json({message:"video already exists in playlist"})
        }
        await Playlist.findByIdAndUpdate(
            playlistId,
            { $addToSet: { videos: videoId } }, 
            { new: true }
        );
        // await playlist.save()
        return res.status(200).json({message:"video added to playlist successfully"})
    } 
    catch (error) {
        return res.status(500).json({message:"internal server error"})
    }
}


export const removeVideoFromPlaylist = async(req, res) => {
    try {
        const { playlistId, videoId } = req.params;
        const playlist = await Playlist.findById(playlistId);
        if (!playlist) {
            return res.status(404).json({ message: "Playlist not found" });
        }
        if (playlist.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "You are not authorized to modify this playlist"
            });
        }

        await Playlist.findByIdAndUpdate(
            playlistId,
            { $pull: { videos: videoId } },
            { new: true }
        );

        return res.status(200).json({
            message: "Video removed from playlist successfully"
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

export const deletePlaylist = async(req, res) => {
     try {
        const { playlistId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(playlistId)) {
            return res.status(400).json({ message: "Invalid playlist id" });
        }

        const playlist = await Playlist.findById(playlistId);
        if (!playlist) {
            return res.status(404).json({ message: "Playlist not found" });
        }

        if (playlist.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "Not authorized to delete this playlist"
            });
        }

        await Playlist.findByIdAndDelete(playlistId);

        return res.status(200).json({
            message: "Playlist deleted successfully"
        });

    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const updatePlaylist = async(req, res) => {
   try {
     const {playlistId} = req.params
     const {name, description} = req.body
     const playlist = await Playlist.findById(playlistId)
     if(!playlist){
       return res.status(404).json({message:"playlist not found"})
    }
     if(playlist.owner.toString() !== req.user._id.toString()){
       return res.status(403).json({message:"You are not authorized to update this playlist"})
    }
    if (name) playlist.name = name;
    if (description) playlist.description = description;
     await Playlist.findByIdAndUpdate(playlistId, {
       $set:{
         name,
         description
       }
     })
     return res.status(200).json({message:"playlist updated successfully"},playlist)
   } catch (error) {
    return res.status(500).json({message:"internal server error"})
   }
}
