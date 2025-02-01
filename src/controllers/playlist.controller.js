import mongoose,{isValidObjectId} from "mongoose";
import {Playlist} from '../models/playlist.model.js'
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {ApiError} from "../utils/ApiError.js";
import {Video} from "../models/video.model.js"

const createPlaylist=asyncHandler(async(req,res)=>{
    const {name,description=""}=req.body
    if(!name){
        throw new ApiError(400,"name is required")
    }
    const user=req.user?._id;
    if(!user){
        throw new ApiError(400,"User not found")
    }
    const playList=await Playlist.create({
        name,
        description,
        owner:user
    })
    if(!playList){
        throw new ApiError(500,"Internal Server error due to create playList")
    }
    return res.status(200).json(
        new ApiResponse(200,playList,"PlayList Create SuccessFully")
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Validate user ID
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    // Use aggregation pipeline to match user playlists and populate videos
    const userPlaylists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId) // Match playlists by owner
            }
        },
        {
            $lookup: {
                from: "videos", // Name of the Video collection
                localField: "videos", // Field in Playlist collection that references videos
                foreignField: "_id", // Field in Video collection to match
                as: "videos" // Name of the new array with populated video documents
            }
        },
        {
            $sort: { createdAt: -1 } // Optional: Sort playlists by createdAt
        }
    ]);

    if (!userPlaylists || userPlaylists.length === 0) {
        throw new ApiError(404, "No playlists found");
    }

    // Respond with the populated playlists
    return res.status(200).json(
        new ApiResponse(
            200,
            userPlaylists,
            "User playlists fetched successfully"
        )
    );
});

const getPlaylistById=asyncHandler(async(req,res)=>{
    const {playListId}=req.params;
    if(!isValidObjectId(playListId)){
        throw new ApiError(400,"Invalid playlist id")
    }
    try {
        const playlist=await Playlist.findById(playListId)
            .populate({
                path:"videos",
                populate:{
                    path:"owner",
                    select:"username fullName avatar",
                },
            });

        if(!playlist){
            throw new ApiError(404,"PlayList Not Found")
        }

        return res.status(200).json(
            new ApiResponse(200,playlist,"PlayList fatched Successfully")
        )
    } catch (error) {
        
    }
});

const addVideoToPlaylist=asyncHandler(async(req,res)=>{
    const {videoId,playlistId}=req.params;
    if(!isValidObjectId(videoId) || !isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid video or playList id")
    }
    const video=await Video.findById(videoId);
    if(!video){
        throw new ApiError(404,"Video not found")
    }
    const playlist =await PlayList.findOne({
        _id:playlistId,
        videos:videoId
    });
    if(playlist){
        return res.status(200).json(
            new ApiResponse(400,{},"Video Already exists in the playList")
        )
    }

    const updatePlaylist=await PlayList.findByIdAndUpdate(playlistId,
        {
            $addToSet:{
                videos:video
            } 
        },
        {
            new :true
        }
    );
    if(!updatePlaylist){
        throw new ApiError(500,"Internal Server error,Unable to add video in playlist")
    }
    return res.status(200).json(
        new ApiResponse(200,updatePlaylist,"Video added to playList successfully")
    )
});

const removeVideoFromPlaylist=asyncHandler(async(req,res)=>{
    const {videoId,playlistId}=req.params;
    if(!isValidObjectId(videoId) || !isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid PlayList or video ids")
    }
    const updatePlaylist=await PlayList.findByIdAndUpdate(
        {_id:playlistId,videos:videoId},
        { $pull :{ videos:new mongoose.Types.ObjectId(videoId) } },
        { new: true }
    );

    const playlistExists=await PlayList.exists({ _id:playlistId});
    if(!playlistExists){
        throw new ApiError(404,"PlayList Not found")
    }

    if(!updatePlaylist){
        throw new ApiError(400,"Video not Found in playList")
    }
    return res.status(200).json(
        new ApiResponse(200,updatePlaylist,"Video remove from playlist Successfully")
    )
});

const deletePlaylist=asyncHandler(async(req,res)=>{
    try {
        const {playlistId}=req.params;
        if(!isValidObjectId(playlistId)){
            throw new ApiError(400,"Invalid Playlist Id")
        }
        const deletePlayList=await PlayList.findByIdAndDelete(playlistId)
    
        if(!deletePlayList){
            throw new ApiError(500,"Internal Server Error")
        }
        return res.status(200).json(
            new ApiResponse(200,deletePlayList,"PlayList Deleted SuccessFully")
        )
    } catch (error) {
        return new ApiError(500,"Internal Server Issue",error)
    }
});

const updatePlaylist=asyncHandler(async(req,res)=>{
    const {playlistId}=req.params;
    const {name , description=""}=req.body;

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"invalid playList id")
    }
    if(!name){
        throw new ApiError(400,"Name are required")
    }

    const updatePlaylist=await PlayList.findByIdAndUpdate(playlistId,
        {
            $set:{
                name,
                description
            }
        },
        {
            new :true
        }
    )

    if(!updatePlaylist){
        throw new ApiError(500,"iNternal Server Error");
    }
    return res.status(200).json(
        new ApiResponse(200,updatePlaylist,"PlayList Updated SuccessfUlly")
    )
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}


//not efficieant give only one playlist
// const getUserPlaylists=asyncHandler(async(req,res)=>{
//     const {userId}=req.params;
//     if(!isValidObjectId(userId)){
//         throw new ApiError(400,"Invalid user Id");
//     }
//     const userPlayList=await Playlist.aggregate([
//         {
//             $match:{
//                 owner : new mongoose.Types.ObjectId(userId)
//             } 
//         },
//         {
//             $lookup:{
//                 from:"videos",
//                 foreignField:"_id",
//                 localField:"video",
//                 as:"videos",
//                 pipeline:[
//                     {
//                         $lookup:{
//                             from:"users",
//                             foreignField:"_id",
//                             localField:"owner",
//                             as:"user",
//                             pipeline:[
//                                 {
//                                     $project:{
//                                         username:1,
//                                         avatar:1,
//                                         fullName:1
//                                     }
//                                 }
//                             ]
//                         }
//                     },
//                     {
//                         $addFields:{
//                             owner:{
//                                 $first:"$user"
//                             }
//                         }
//                     }
//                 ]
//             }
//         },
//         {
//             $addFields:{
//                 video:"$videos",
//                 owner:req.user
//             }
//         }
//     ])

//     return res.status(200).json(
//         new ApiResponse(200,userPlayList[0],"PlayLists fetched successFully")
//     )
// });
