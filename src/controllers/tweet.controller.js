import mongoose,{isValidObjectId} from "mongoose";
import {Tweet} from '../models/tweet.model.js'
import {User} from '../models/user.model.js'
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {ApiError} from "../utils/ApiError.js";

const createTweet = asyncHandler(async (req, res) => {

});

const getUserTweets = asyncHandler(async (req, res) => {

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