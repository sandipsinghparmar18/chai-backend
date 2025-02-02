import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params;
    let {page = 1, limit = 5} = req.query;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid Video Id");
    }

    page=Math.max(1,parseInt(page));
    limit=Math.max(1,parseInt(limit));

    const [comments,totalComments]=await Promise.all([
        Comment.aggregate([
            {
                $match:{
                    video:new mongoose.Types.ObjectId(videoId)
                }
            },
            {
                $sort:{
                    createdAt:-1  //sort comment newly first
                }
            },
            {
                $skip:(page-1)*limit
            },
            {
                $limit:limit
            },
            {
                $project:{
                    _id:1,
                    content:1,
                    createdAt:1,
                    owner:1
                }
            }
        ]),
        Comment.countDocuments({video:videoId})
    ]);

    if(totalComments===0){
        return res.status(200).json(
            new ApiResponse(200,[],"No commnet found for this video")
        )
    }
    const totalPages=Math.ceil(totalComments/limit);
    const hasNextPage=page<totalPages;
    const hasPreviousPage=page>1;

    return res.status(200).json(
        new ApiResponse(200,{
            totalComments,
            currentPage:page,
            limit,
            totalPages,
            hasNextPage,
            hasPreviousPage
            ,comments
        }, "Comments Fetched SuccesssFully"
        )
    )

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId}=req.params;
    const {content} =req.body;

    if(!isValidObjectId(videoId) || !await Video.exists(new mongoose.Types.ObjectId(videoId))){
        return new ApiError(400,"Video Id is Invalid");
    }
    if(!content?.trim()){
        throw new ApiError(400,"Content is required")
    }
    const comment=await Comment.create({
        content,
        video: new mongoose.Types.ObjectId(videoId),
        owner:req.user?._id
    })
    if(!comment){
        new ApiError(500,"Internal Server Error while creating Comment")
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200,comment,"Comment created SuccessFully")
        )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId}=req.params;
    const {content}=req.body;

    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid Comment Id")
    }
    if(!content?.trim()){
        throw new ApiError(400,"Content is required")
    }
    const updatedComment=await Comment.findByIdAndUpdate(commentId,{
        $set:{
            content
        }
    },{new:true})
    if(!updateComment){
        throw new ApiError(500,"internal server error while updating the comment")
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200,{updateComment},"Comment updated Succesfully")
        )

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId}=req.params;
    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid Comment ID")
    }
    const deletedComment=await Comment.findByIdAndDelete(new mongoose.Types.ObjectId(commentId))
    if(!deletedComment){
        throw new ApiError(500,"Internal server error when delete Comment")
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200,deletedComment,"Comment deleted Successfully")
        )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}