import express from "express"

import { addVideoToPlaylist, createPlaylist, deletePlaylist, getPlaylistById, getUserPlaylists,
     removeVideoFromPlaylist, updatePlaylist } from "../Controllers/Playlist.Controllers.js";

import isAuth from "../Middlewares/isAuth.js";

const playlistrouter = express.Router();
playlistrouter.post("/create",isAuth,createPlaylist)
playlistrouter.get("/get/:id",isAuth,getUserPlaylists)
playlistrouter.get("/getbyid/:playlistId",isAuth,getPlaylistById)
playlistrouter.put("/updateplaylist/:playlistId",isAuth,updatePlaylist)
playlistrouter.delete("/deleteplaylist/:playlistId",isAuth,deletePlaylist)
playlistrouter.post("/addvideo/:playlistId/videos/:videoId",isAuth,addVideoToPlaylist)
playlistrouter.delete("/removevideo/:playlistId/videos/:videoId",isAuth,removeVideoFromPlaylist)

export default playlistrouter;
