import mongoose,{isValidObjectId} from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { View } from "../models/view.model.js";
import { User } from "../models/user.model.js";
import {Video} from "../models/video.model.js";


const addVideoView=asyncHandler(async(req,res)=>{
    const {videoId}=req.params;
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video Id");
    }

    const userId=req.user?._id;
    if(!userId){
        throw new ApiError(401,"User Not authenticate");
    }
    const addedViews=await View.updateOne(
        {
            video:videoId,
            viewer:userId
        },
        {
            $setOnInsert:{
                video:videoId,
                viewer:userId,
                createdAt:new Date()
            }
        },
        {
            upsert:true
        }
    );

    const wasNew= !!addedViews.upsertedCount;
    
    await User.findByIdAndUpdate(
        userId,
        { $addToSet:{ watchHistory:videoId }},
        {new :true}
    );

    if(wasNew){
        await Video.findByIdAndUpdate(videoId,
            {
                $inc:{ views:1},
            },
            {
                new :true
            }
        )
    }

    const message=wasNew
        ? "Video is viwes for the First time"
        : "Video has already been viewed"

    return res.status(200).json(
        new ApiResponse(200,{},message)
    )
})

const getVideoViews=asyncHandler(async(req,res)=>{
    const {videoId} =req.params;
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video id")
    }
    const views=await View.countDocuments({ video:videoId})

    if(!views){
        return new ApiResponse(200,{},"No Views Yet")
    }
    return res.status(200).json(
        new ApiResponse(200,views,"Views Fetched SuccesFully")
    )
})

const removeView=asyncHandler(async(req,res)=>{
    
        const {videoId} =req.params;
        if(!isValidObjectId(videoId)){
            throw new ApiError(400,"Invalid Video Id")
        }
        const userId=req.user?._id;
        if(!userId){
            throw new ApiError(401,"user was not authenticate")
        }
        const removeView = await View.findOneAndDelete({
            video: videoId,
            viewer: userId
        });        
        if(!removeView){
            return res.status(200).json(
                new ApiResponse(200,null,"No view Found to remove")
            )
        }
        const removeFromWatchHistory=await User.findByIdAndUpdate(userId,
            {
                $pull:{
                    watchHistory:videoId
                }
            },
            {
                new :true
            }
        )
        if(!removeFromWatchHistory){
            throw new ApiError(400,"cannot remove from Watch History")
        }
        return res.status(200).json(
            new ApiResponse(200,removeView,"remove The View")
        )
})

export {
    addVideoView,
    getVideoViews, 
    removeView
}