import mongoose from "mongoose";

const LikeSchema = new mongoose.Schema({
    video: {
        type: mongoose.Schema.Types.ObjectId,   
        ref: "Video"
    },
    comment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    },
    likedBy: 
        {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
        },
    type: {
    type: String,
    enum: ["like", "dislike"],
    default: "like"
  }
}, {timestamps: true})

const Like = mongoose.model("Like", LikeSchema);

export default Like;
