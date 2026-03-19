import express from "express";
import { getChannelStats, getcurrentUser, getUserChannelProfile, getWatchHistory, removeFromHistory, updateAccountDetails } from "../Controllers/User.Controller.js";
import isAuth from "../Middlewares/isAuth.js";
import { upload } from "../Middlewares/Multer.js";

const usserrouter = express.Router();

usserrouter.get("/current",isAuth,getcurrentUser)
usserrouter.get("/channel/:username",isAuth,getUserChannelProfile)
usserrouter.get("/watchHistory", isAuth,getWatchHistory)
//DELETE /api/v1/users/removeFromHistory/:videoId
usserrouter.delete("/removeFromHistory/:videoId", isAuth,removeFromHistory)
usserrouter.put("/updateaccount",isAuth,upload.single("profileimage"),updateAccountDetails)
usserrouter.get("/channel-stats", isAuth, getChannelStats);

export default usserrouter;