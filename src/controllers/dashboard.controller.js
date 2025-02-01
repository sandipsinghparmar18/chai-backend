import mongoose,{isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

// TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
const getChannelStats = asyncHandler(async (req, res) => {
    try {
        const {channelId}=req.params;
        if(!isValidObjectId(channelId)){
            throw new ApiError(400,"Invalid Channel Id");
        }
        const getTotalVideos=await Video.countDocuments({
            owner:channelId
        })
        const getTotalSubscriber=await Subscription.countDocuments({
            channel:channelId
        })
        const getTotalLikesObject=await Video.aggregate([
            {
                $match:{
                    owner:new mongoose.Types.ObjectId(channelId)
                }
            },
            {
                $lookup:{
                    from:"likes",
                    localField:"_id",
                    foreignField:"video",
                    as:"likesOfVideo",
                }
            },
            {
                $group:{
                    _id:null,
                    totalLikes:{
                        $sum:{
                            $size: '$likesOfVideo'
                        }
                    },
                }
            },
            {
                $project:{
                    _id:0,
                    totalLikes:1
                }
            },
        ],
        {maxTimeMS:60000,allowDiskUse:true}
        );
    
        const getTotalLikes=getTotalLikesObject.length>0 ? getTotalLikesObject[0].totalLikes:0;
    
        const getTotalViewsObject=await Video.aggregate(
            [
                {
                    $match:{
                        owner:new mongoose.Types.ObjectId(channelId)
                    }
                },
                {
                    $lookup:{
                        from:'views',
                        localField:"_id",
                        foreignField:"video",
                        as:"viewsOfVideo",
                    }
                },
                {
                    $group:{
                        _id:null,
                        totalViews:{ $sum: { $size: "$viewsOfVideo" } }
                    }
                },
                {
                    $project:{
                        _id:0,
                        totalViews:1
                    }
                }
            ],
            {
                maxTimeMS:60000,
                allowDiskUse:true
            }
        );
    
        const getTotalViews= getTotalViewsObject.length > 0 ? getTotalViewsObject[0].totalViews : 0;
        
        const user=req?.user;
        const subscribed=await Subscription.findOne({
            channel:channelId,
            subcriber:user
        })
        const subscribedStatus= subscribed ? true : false
    
        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    getTotalVideos,
                    getTotalSubscriber,
                    getTotalLikes,
                    getTotalViews,
                    subscribedStatus
                },
                "These are the channel status"
            )
        )
    } catch (error) {
        throw new ApiError(500,"Internal Server Error",error)
    }
})

// TODO: Get all the videos uploaded by the channel
const getChannelVideos = asyncHandler(async (req, res) => {
    try {
        const {channelId}=req.params;
        if(!isValidObjectId(channelId)){
            throw new ApiError(400,"Invalid Channel Id")
        }
        const getAllVideos=await Video.find({
            owner:channelId
        }).populate("owner").sort({
            createdAt:-1
        })
    
        if(!getAllVideos)(
            new ApiResponse(200,"No Videos on this Channel")
        )
        return res.status(200).json(
            new ApiResponse(200,getAllVideos,"Fetched All video SuccessFully")
        )
    } catch (error) {
        throw new ApiError(500,"Internal Server error due to find All VideoS on channel ",error)
    }
})

export {
    getChannelStats, 
    getChannelVideos
    }