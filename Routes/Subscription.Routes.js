import express from "express"
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../Controllers/Subscription.Controllers.js";
import isAuth from "../Middlewares/isAuth.js";

const subscriptionrouter = express.Router();

subscriptionrouter.post("/togglesubscription/:channelId/:subscriberId",isAuth,toggleSubscription)
subscriptionrouter.get("/channelsubscribers/:channelId",getUserChannelSubscribers)
subscriptionrouter.get("/mysubscription",isAuth,getSubscribedChannels)

export default subscriptionrouter;
