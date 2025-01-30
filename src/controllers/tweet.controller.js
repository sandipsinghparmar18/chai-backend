import mongoose,{isValidObjectId} from "mongoose";
import {Tweet} from '../models/tweet.model.js'
import {User} from '../models/user.model.js'
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {ApiError} from "../utils/ApiError.js";

const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body;
    const {userId} = req.user;
    const tweet =await Tweet.create({content, user: userId});
    //await tweet.save();
    res.status(201).json(new ApiResponse(201, {tweet}));
});

const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params;
    if(!isValidObjectId(userId)){
        throw new ApiError(400, 'Invalid user id');
    }
    const user = await User.findById(userId);
    if(!user){
        throw new ApiError(404, 'User not found');
    }
    const tweets = await Tweet.find({user: userId});
    res.json(new ApiResponse(200, {tweets}));
});

const updateTweet = asyncHandler(async (req, res) => {

});

const deleteTweet = asyncHandler(async (req, res) => {

});

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}