import express from "express"
import { addComment, deleteComment, getVideoComments, updateComment } from "../Controllers/Comment.Controllers.js";
import isAuth from "../Middlewares/isAuth.js";

const commentrouter = express.Router();

commentrouter.get("/video/:videoId", getVideoComments);
commentrouter.post("/add/:videoId", isAuth, addComment);
commentrouter.post("/update/:commentId", isAuth, updateComment);
commentrouter.delete("/delete/:commentId", isAuth, deleteComment);

export default commentrouter;
