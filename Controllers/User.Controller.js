import User from "../Models/User.Models.js"
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose"
import uploadOnCloudinary from "../Middlewares/Cloudinary.js";

//purpose of this function is to get the current user.current user means the user who is logged in.
export const getcurrentUser = async(req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        if(!user){
            return res.status(404).json({message: "User not found"});
        }
        return res.status(200).json({message:"Current user fetched successfully", user});
    
    } catch (error) {
        return res.status(400).json({message: "Error fetching user data", error: error.message});
    }
}


export const updateAccountDetails = async (req, res) => {
  try {
    const { username, email } = req.body;

    const profileImageLocalPath = req.file?.path;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    let newProfileImage = user.profileimage;
    
    if (profileImageLocalPath) {
      const uploadedImage = await uploadOnCloudinary(profileImageLocalPath);

      if (!uploadedImage) {
        return res.status(400).json({
          message: "Error uploading image",
        });
      }

      newProfileImage = uploadedImage;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          username: username || user.username,
          email: email || user.email,
          profileimage: newProfileImage,
        },
      },
      { returnDocument: "after" }
    ).select("-password");

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error updating account",
      error: error.message,
    });
  }
};


export const getChannelStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const videosCount = await mongoose.model("Video").countDocuments({
      owner: userId,
    });

    const subscribersCount = await mongoose
      .model("Subscription")
      .countDocuments({
        channel: userId,
      });

      // total views
    const viewsData = await mongoose.model("Video").aggregate([
      {
        $match: { owner: userId }
      },
      {
        $group: {
          _id: null,
          totalViews: { $sum: "$views" }
        }
      }
    ]);

    const totalViews = viewsData.length > 0 ? viewsData[0].totalViews : 0;

    return res.status(200).json({
      videosCount,
      subscribersCount,
      totalViews
    });

    return res.status(200).json({
      videosCount,
      subscribersCount,
      totalViews
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching channel stats",
      error: error.message,
    });
  }
};

export const getUserChannelProfile = async(req, res) => {
    try {
         const {username} = req.params
    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }
    const channel = await User.aggregate([
        {
            //$match is used to filter the documents in the collection based on the specified condition
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscription",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            //project used for selecting the fields that we want to return in the response
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
    ])

    if (!channel?.length) {
        throw new Error("Channel not found")
    }

    return res.status(200).json({message: "User channel fetched successfully", channel: channel[0]});
    } catch (error) {
        return res.status(500).json({message: "Error fetching user channel profile", error: error.message});
    }
}


export const removeFromHistory = async(req, res) => {
  try {
     const userId = req.user._id;
  const { videoId } = req.params;

  await User.findByIdAndUpdate(userId, {
    $pull: { watchHistory: videoId },
  });

  res.json({ message: "Removed from history" });
}
  catch (error) {
    return res.status(500).json({message: "Error removing from history", error: error.message});
  }
}


export const getWatchHistory = async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    return res.status(200).json(
        user[0].watchHistory);
}