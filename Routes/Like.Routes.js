import express from "express"
import { getLikedVideos, toggleCommentLike, toggleVideoLike } from "../Controllers/Like.Controllers.js";
import isAuth from "../Middlewares/isAuth.js";

const likerouter = express.Router();

likerouter.post("/video/:videoId", isAuth,toggleVideoLike)
likerouter.post("/comment/:commentId", isAuth,toggleCommentLike)
likerouter.get("/likedvideos", isAuth,getLikedVideos)  

export default likerouter;
