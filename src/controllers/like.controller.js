import mongoose,{isValidObjectId} from "mongoose";
import {Like} from "../models/like.model.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {ApiError} from "../utils/ApiError.js";

const toggleVideoLike= asyncHandler(async (req, res) => {
    const {videoId}=req.params;
    const {userId}=req.user;
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video id");
    }
    const like=await Like.findOne({video:videoId,user:userId});
    if(like){
        await like.remove();
        return res.json(new ApiResponse(200,"Video unliked",null));
    }
    await Like.create({video:videoId,user:userId});
    return res.json(new ApiResponse(200,"Video liked",null));
});

const toggleCommentLike= asyncHandler(async (req, res) => {
    const {commentId}=req.params;
    const {userId}=req.user;
    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid comment id");
    }
    const like=await Like.findOne({comment:commentId,user:userId});
    if(like){
        await like.remove();
        return res.json(new ApiResponse(200,"Comment unliked",null));
    }
    await Like.create({comment:commentId,user:userId});
    return res.json(new ApiResponse(200,"Comment liked",null));
});

const toggleTweetLike=asyncHandler(async(req,res)=>{
    const {tweetId} =req.params
})

const getLikedVideo=asyncHandler(async(req,res)=>{
    //getAll liked video
})

export {
    toggleCommentLike,
    toggleVideoLike,
    toggleTweetLike,
    getLikedVideo
}