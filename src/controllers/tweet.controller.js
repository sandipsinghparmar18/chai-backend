import mongoose,{isValidObjectId} from "mongoose";
import {Tweet} from '../models/tweet.model.js'
import {User} from '../models/user.model.js'
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {ApiError} from "../utils/ApiError.js";

const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body;
    if(!content?.trim()){
        throw new ApiError(400, 'tweet cannot be empty');
    }
    const user=await User.findById(req.user?._id);
    const tweet=new Tweet({
        content,
        owner:user._id,
    })
    //console.log(tweet);
    await tweet.save();
    if(!tweet){
        throw new ApiError(400, 'something went wrong while creating tweet');
    }
    return res
        .status(200)
        .json(new ApiResponse(201, {tweet},"Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params;
    
    const tweets=await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(userId)
            },
        },
        {
            $lookup:{
                from:"tweets",
                localField:"_id",
                foreignField:"owner",
                as:"userTweets"
            }
        },
        {
            $project:{
                fullName:1,
                avatar:1,

                userTweets:{
                    $map:{
                        input:"$userTweets",
                        as:"tweet",
                        in:{
                            _id:"$$tweet._id",
                            content:"$$tweet.content",
                            createdAt:"$$tweet.createdAt",
                            updatedAt:"$$tweet.updatedAt",
                        }
                    }
                }
            }
        }
    ])

    return res
        .status(200)
        .json(new ApiResponse(200, {tweets},"User tweets fetched successfully"));
});


const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;
    const {content} = req.body;
    if(!content?.trim()){
        throw new ApiError(400, 'tweet cannot be empty');
    }
    if(!tweetId){
        throw new ApiError(400, 'tweetId is required');
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId,{
        $set:{
            content
        },
    },
        {
            new:true
        }
    );

    if(!updatedTweet){
        throw new ApiError(404, 'Tweet not found');
    }
    return res
        .status(200)
        .json(new ApiResponse(200, {updatedTweet},"Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
    try {
        const {tweetId} = req.params;
        if(!tweetId){
            throw new ApiError(400, 'tweetId is required');
        }
        const tweet=await Tweet.findByIdAndDelete(tweetId);
        if(!tweet){
            throw new ApiError(404, 'Tweet not found');
        }
        res
            .status(200)
            .json(new ApiResponse(200, {tweet},"Tweet deleted successfully"));
    } catch (error) {
        throw new ApiError(500, "Internal Server error ",error.message);
    }
});

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}