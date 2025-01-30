import {asyncHandler} from '../utils/asyncHandler.js';
import {Video} from '../models/video.model.js';

const getAllVideos= asyncHandler(async (req, res) => {
    //get all videos based on query,sort,paginate

});

const publishVideo= asyncHandler(async (req, res) => {
    //get vedio,upload to cloudinary,create video in db

});

const getVideoById= asyncHandler(async (req, res) => {
    //get video by id

})

const updateVideo= asyncHandler(async (req, res) => {
    //update video details like title,description,thumbnail

})

const deleteVideo= asyncHandler(async (req, res) => {
    //delete video

});

const toglePublishStatus= asyncHandler(async (req, res) => {
    //toggle publish status of video

});

export {
    getAllVideos,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    toglePublishStatus
};
