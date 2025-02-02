import mongoose, {isValidObjectId} from "mongoose"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params;
    //console.log("chanell Id",channelId);
    // TODO: toggle subscription
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Invalid Channel Id")
    }
    const userId=req.user?._id;

    const isSubscribed=await Subscription.findOne({
        channel:channelId,
        subscriber:userId
    })
    console.log(isSubscribed)
    if(isSubscribed){
        await Subscription.findByIdAndDelete(isSubscribed._id)

        return res.status(200).json(
            new ApiResponse(200,{},"UnsubCribe SuccessFully")
        )
    }
    const subscribed=await Subscription.create({
        channel:channelId,
        subscriber:userId
    })
    if(!subscribed){
        throw new ApiError(500,"Something went wrong while subscribing")
    }
    return res.status(200).json(
        new ApiResponse(200,subscribed,"Subscribed SuccessFully")
    )
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params;
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Invalid Channel Id")
    }
    const subscriberList=await Subscription.aggregate([
        {
            $match:{
                channel:new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from:"users",
                foreignField:"_id",
                localField:"subscriber",
                as:"user",
                pipeline:[
                    {
                        $project:{
                            _id:1,
                            username:1,
                            fullName:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                subscriber:{
                    $first:"$user"
                }
            }
        },
    ])
    return res.status(200).json(
        new ApiResponse(200,subscriberList || {},"Channel Subscriber Fetched SuccessFully")
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    //console.log(channelId)
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Invalid subscription Id")
    }
    const subscribedChannelList=await Subscription.aggregate([
        {
            $match:{
                subscriber:new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from:"users",
                foreignField:"_id",
                localField:"channel",
                as:"channel",
                pipeline:[
                    {
                        $project:{
                            _id:1,
                            username:1,
                            fullName:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                channel:{
                    $first:"$channel"
                }
            }
        },
    ])

    return res.status(200).json(
        new ApiResponse(200,subscribedChannelList || {},"Subscribed Channel Fetch SuccessFully")
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}