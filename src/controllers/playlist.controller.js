import mongoose,{isValidObjectId} from "mongoose";
import {PlayList} from '../models/playlist.model.js'
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {ApiError} from "../utils/ApiError.js";

const createPlaylist=asyncHandler(async(req,res)=>{
    const {name,description}=req.body

})

const getUserPlaylists=asyncHandler(async(req,res)=>{

});

const getPlaylistById=asyncHandler(async(req,res)=>{

});

const addVideoToPlaylist=asyncHandler(async(req,res)=>{

});

const removeVideoFromPlaylist=asyncHandler(async(req,res)=>{

});

const deletePlaylist=asyncHandler(async(req,res)=>{

});

const updatePlaylist=asyncHandler(async(req,res)=>{

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