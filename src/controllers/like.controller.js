import mongoose,{isValidObjectId} from "mongoose";
import {Like} from "../models/like.model.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {ApiError} from "../utils/ApiError.js";

const toggleVideoLike= asyncHandler(async (req, res) => {
    const {videoId}=req.params;
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video id");
    }

    const userId=req.user?._id;

    const ifLiked = await Like.exists({ video: new mongoose.Types.ObjectId(videoId), likedBy: userId })

    if (!ifLiked) {
        const like = await Like.create({
            video: new mongoose.Types.ObjectId(videoId),
            likedBy: userId
        })
        if (!like) {
            throw new ApiError(400, "Could not like")
        }
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    ifLiked,
                    "Video liked"
                )
            )
    }
    else {
        const unlike = await Like.findByIdAndDelete(ifLiked._id)
        if (!unlike) {
            throw new ApiError(400, "Could not like")
        }
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    ifLiked,
                    "Video unliked"
                )
            )
    }
});

const toggleCommentLike= asyncHandler(async (req, res) => {
    const {commentId}=req.params;
    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid comment id");
    }
    const likedComment=await Like.findOne({
        comment:commentId,
        likedBy:req.user?._id
    });
    if(likedComment){
        await Like.findByIdAndDelete(likedComment._id);

        return res.status(200).json(
            new ApiResponse(200,"Comment unliked",null)
        );
    }else{
        const like=await Like.create({
            comment:commentId,
            likedBy:req.user?._id
        })
        if(!like){
            throw new ApiError(500,"Internal Server Error while adding like in comment")
        }
        return res.status(200).json(
            new ApiResponse(200,like ||{},"Like added Successfully")
        )
    }
});

const toggleTweetLike=asyncHandler(async(req,res)=>{
    const {tweetId} =req.params;
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid Tweet Id")
    }
    const likedTweet=await Like.findOne({
        tweet:tweetId,
        likedBy:req.user?._id
    })
    if(likedTweet){
        await Like.findByIdAndDelete(likedTweet._id);
        return res.status(200).json(
            new ApiResponse(200,{},"Liked remove SuccessFully")
        )
    }else{
        const like=await Like.create({
            tweet:tweetId,
            likedBy:req.user?._id
        })
        if(!like){
            throw new ApiError(500,"Internal Server Error during adding like on tweet")
        }
        return res.status(200).json(
            new ApiResponse(200,like || {},"Like added Successfully")
        )
    }

})

const getLikedVideo=asyncHandler(async(req,res)=>{
    //getAll liked video by user
    const userId=req.user?._id;
    if(!isValidObjectId(userId)){
        throw new ApiError(400,"Unauthenticate User")
    }
    const likedVideos=await Like.aggregate([
        {
            $match:{ likedBy:userId }
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"videoDetails",
                pipeline:[
                    {
                        $project:{
                            _id:1,
                            title:1,
                            owner:1
                        }
                    }
                ]
            }
        },
        {
            $unwind:"$videoDetails"
        },
        {
            $project:{
                _id:0,
                videoDetails:1
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            likedVideos.length > 0 ? likedVideos :[],
            likedVideos.length ? "Liked Videos fetched Successfully" : "No liked videos found"
        )
    )
})

const userLikeStatus =asyncHandler(async(req,res)=>{
    const {videoId}=req.params;
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video Id")
    }
    const userId=req.user?._id;
    if(!isValidObjectId(userId)){
        throw new ApiError(401,"User not authenticate")
    }
    const likedData=await Like.aggregate([
        {
            $match:{
                video:new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $group:{
                _id:null,
                likesOnVideo:{
                    $sum:1
                },
                userLiked:{
                    $sum:{
                        $cond: [{$eq:["$likedBy",userId]},1,0]
                    }
                }
            }
        }
    ]);

    const likesOnVideo=likedData.length>0 ? likedData[0].likesOnVideo: 0;
    const statusOfLike=likedData.length>0 && likedData[0].userLiked>0;

    return res.status(200).json(
        new ApiResponse(200,{likesOnVideo,statusOfLike},"Like status fetch successfully")
    )
})

export {
    toggleCommentLike,
    toggleVideoLike,
    toggleTweetLike,
    getLikedVideo,
    userLikeStatus 
}