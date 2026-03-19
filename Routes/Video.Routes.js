import express from "express"
import { deleteVideo, getAllVideos, getVideoById, searchvideos, updateVideo, uploadvideo } from "../Controllers/Video.Controller.js";
import isAuth from "../Middlewares/isAuth.js";
import { upload } from "../Middlewares/Multer.js";

const videorouter = express.Router();
videorouter.post("/uploads",isAuth,upload.single("videoFile"),uploadvideo);
videorouter.get("/all",isAuth, getAllVideos)
videorouter.get("/search",searchvideos)
videorouter.get("/:id",isAuth, getVideoById)
videorouter.put("/update/:id",isAuth,upload.single("thumbnail"),updateVideo);
videorouter.post("/delete/:id", isAuth,deleteVideo)  

export default videorouter;
