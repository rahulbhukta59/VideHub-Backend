import mongoose, {isValidObjectId} from "mongoose"
import User from "../Models/User.Models.js"
import subscription from "../Models/Subscription.Models.js"


export const toggleSubscription = async (req, res) => {
 try {
        const { channelId } = req.params;
        const subscriberId = req.user._id;
        if (!isValidObjectId(channelId)) {
            return res.status(400).json({ message: "Invalid channel id" });
        }
        // if (channelId === subscriberId.toString()) {
        //     return res.status(400).json({ message: "You cannot subscribe to yourself" });
        // }
        const channelExists = await User.exists({ _id: channelId });
        if (!channelExists) {
            return res.status(404).json({ message: "Channel not found" });
        }
        const existing = await subscription.findOne({
            subscriber: subscriberId,
            channel: channelId
        });
        if (existing) {
            await subscription.findByIdAndDelete(existing._id);

            return res.status(200).json({
                subscribed: false,
                message: "Unsubscribed successfully"
            });
        }
        await subscription.create({
            subscriber: subscriberId,
            channel: channelId
        });
        return res.status(200).json({
            subscribed: true,
            message: "Subscribed successfully"
        });
    } catch (error) {
        console.error("Toggle Subscription Error:", error);
        return res.status(500).json({ message: "Internal server error" });
    } 
}


export const getUserChannelSubscribers = async (req, res) => {
    try {
        const { channelId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        if (!isValidObjectId(channelId)) {
            return res.status(400).json({ message: "Invalid channel id" });
        }
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const skip = (pageNumber - 1) * limitNumber;
        const channelExists = await User.exists({ _id: channelId });
        if (!channelExists) {
            return res.status(404).json({ message: "Channel not found" });
        }
        const subscribers = await subscription.find({ channel: channelId })
            .populate("subscriber", "username email")
            .skip(skip)
            .limit(limitNumber)
            //lean() used for convert to json
            .lean();
        const totalSubscribers = await subscription.countDocuments({
            channel: channelId
        });
        return res.status(200).json({
            totalSubscribers,
            currentPage: pageNumber,
            totalPages: Math.ceil(totalSubscribers / limitNumber),
            subscribers
        });
    } catch (error) {
        console.error("Get Subscribers Error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};


export const getSubscribedChannels = async (req, res) => {
   try {
        const subscriberId = req.user._id;
        const { page = 1, limit = 10 } = req.query;
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const skip = (pageNumber - 1) * limitNumber;
        const channels = await subscription.find({ subscriber: subscriberId })
            .populate("channel", "username profileimage")
            .skip(skip)
            .limit(limitNumber)
            .lean();
        const totalSubscriptions = await subscription.countDocuments({
            subscriber: subscriberId
        });
        return res.status(200).json({
            totalSubscriptions,
            currentPage: pageNumber,
            totalPages: Math.ceil(totalSubscriptions / limitNumber),
            channels
        });
    } catch (error) {
        console.error("Get Subscribed Channels Error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
