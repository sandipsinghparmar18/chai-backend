import mongoose,{isValidObjectId} from 'mongoose';
import {asyncHandler} from '../utils/asyncHandler.js';
import {Video} from '../models/video.model.js';
import {uploadOnCloudinary,deleteFromCloudinary} from '../utils/cloudinary.js';
import {User} from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';


const getAllVideos= asyncHandler(async (req, res) => {
    //get all videos based on query,sort,paginate
    const {page=1,limit=10,sortBy="createdAt",sortType="desc",query="",userId}=req.query;
    const filter={};
    if(query){
        filter.title={
            $regex:query,
            $options:"i"
        }
    }
    if(userId){
        filter.owner=mongoose.Types.ObjectId(userId);
    }
    const totalVideos=await Video.countDocuments(filter);

    const videos=await Video.aggregate([
        {
            $match:filter
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
            }
        },
        {
            $unwind:"$owner"
        },
        {
            $project:{
                _id:1,
                title:1,
                description:1,
                videoFile:1,
                thumbnail:1,
                duration:1,
                isPublished:1,
                createdAt:1,
                views:1,
                owner:{
                    _id:1,
                    username:1,
                    fullName:1,
                    email:1,
                    avatar:1
                }
            }
        },
        {
            $sort:{
                [sortBy]:sortType==="asc"?1:-1, //dynamic sorting
            }
        },
        {
            $skip:(page-1)* parseInt(limit)
        },
        {
            $limit:parseInt(limit)
        }
    ]);

    if(!videos.length){
        throw new ApiError(404,"No videos found");
    }

    const hashNextPage=page*limit<totalVideos;
    const hashPrevPage=page>1;

    return res
        .status(200)
        .json(new ApiResponse(200,"Videos found",
            {
                totalVideos,
                currentPage: parseInt(page),
                limit: parseInt(limit),
                nextPage: hashNextPage ? parseInt(page) + 1 : null,
                previousPage: hashPrevPage ? parseInt(page) - 1 : null,
                videos,
            }
        ));
});

const publishVideo = asyncHandler(async (req, res) => {
    // Get video & upload to Cloudinary, then create a video in DB
    const { title, description } = req.body;

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required");
    }

    // Check if files exist
    if (!req.files || !req.files.videoFile || !req.files.thumbnail) {
        throw new ApiError(400, "Video file and thumbnail are required");
    }

    const videoLocalPath = req.files.videoFile[0].path;
    const thumbnailLocalPath = req.files.thumbnail[0].path;

    //console.log(`Uploading video`, videoLocalPath);
    //console.log(`Uploading thumbnail`, thumbnailLocalPath);
    // Upload to Cloudinary
    let video, thumbnail;

    try {
        video = await uploadOnCloudinary(videoLocalPath, "video");
        thumbnail = await uploadOnCloudinary(thumbnailLocalPath, "image");
    } catch (error) {
        throw new ApiError(500, "Error uploading video or thumbnail");
    }

    if (!video || !thumbnail) {
        throw new ApiError(500, "Cloudinary upload failed");
    }

    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const createdVideo = await Video.create({
        title,
        description,
        videoFile: video.url,
        thumbnail: thumbnail.url,
        duration: video.duration,
        owner: req.user._id
    });

    if (!createdVideo) {
        throw new ApiError(500, "Error creating video");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Video created successfully", createdVideo));
});


const getVideoById= asyncHandler(async (req, res) => {
    //get video by id
    //console.log(req.params);
    const {videoId} = req.params;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video id");
    }

    const videoFile=await Video.findById(videoId).populate("owner","username fullName email avatar");
    if(!videoFile){
        throw new ApiError(404,"Video not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200,"Video found",videoFile));
})

const updateVideo= asyncHandler(async (req, res) => {
    //update video details like title,description,thumbnail
    const {videoId} = req.params;
    const {title,description}=req.body;
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video id");
    }
    if(!title?.trim() || !description?.trim()){
        throw new ApiError(400,"Title and description are required");
    }
    const updatedThumbnailLocalPath=req.file?.path;

    if(!updatedThumbnailLocalPath){
        throw new ApiError(400,"Thumbnail is required");
    }
    const updatedThumbnail=await uploadOnCloudinary(updatedThumbnailLocalPath);
    if(!updatedThumbnail){
        throw new ApiError(500,"Error uploading thumbnail");
    }
    //delete old thumbnail from cloudinary
    const existingVideo=await Video.findById(videoId).select("thumbnail");
    const oldThumbnailPublicId=existingVideo?.thumbnail;
    //console.log("oldThumbnailPublicId",oldThumbnailPublicId);
    await deleteFromCloudinary(oldThumbnailPublicId);


    const updatedVideo=await Video.findByIdAndUpdate(videoId,{
        $set:{
            title,
            description,
            thumbnail:updatedThumbnail.url
        }
    }
    ,{
        new:true
    });
    if(!updatedVideo){
        throw new ApiError(500,"Error updating video");
    }
    return res
        .status(200)
        .json(new ApiResponse(200,"Video updated successfully",updatedVideo));
})

const deleteVideo= asyncHandler(async (req, res) => {
    //delete video
    const {videoId} = req.params;
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video id");
    }
    const video=await Video.findByIdAndDelete(videoId);
    if(!video){
        throw new ApiError(404,"Video not found");
    }
    //delete video and thumbnail from cloudinary
    await deleteFromCloudinary(video.videoFile,"video");
    await deleteFromCloudinary(video.thumbnail);
    return res
        .status(200)
        .json(new ApiResponse(200,"Video deleted successfully"));

});

const toglePublishStatus= asyncHandler(async (req, res) => {
    //toggle publish status of video
    const {videoId} = req.params;
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video id");
    }
    const getVideo=await Video.findById(videoId);
    if(!getVideo){
        throw new ApiError(404,"Video not found");
    }
    const updatedVideo=await Video.findByIdAndUpdate(videoId,{
        $set:{
            isPublished:!getVideo.isPublished
        }
    },{
        new:true
    });
    if(!updatedVideo){
        throw new ApiError(500,"Error updating video");
    }
    return res
        .status(200)
        .json(new ApiResponse(200,"Video publish status updated successfully",updatedVideo.isPublished));
});

export {
    getAllVideos,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    toglePublishStatus
};
