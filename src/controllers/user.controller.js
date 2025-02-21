import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary,deleteFromCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'
import mongoose from "mongoose"

const generateAcessAndRefreshTokens=async(userId)=>{
    try {
        //console.log("userId: ",userId);
        const user=await User.findById(userId);
        const accessToken=user.generateAccessToken();
        const refreshToken=user.generateRefreshToken();
        //console.log("accessToken: ",accessToken)
        //console.log("refreshToken: ",refreshToken)
        user.refreshToken=refreshToken
        await user.save({ validateBeforeSave:false})

        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating the access and refresh token")
    }
}

const registerUser =asyncHandler(async (req,res)=>{
    //get user detials from frontend 
    //validation
    //check if user already exits: username,email
    //check for images,check for avtar
    //upload them to cloudinary,avtar
    //create user object-create entry in db
    //remove password and refress token field from response
    //return response

    const {fullName,email,username,password}=req.body
    //console.log("email: ",email)

    if(
        [fullName,username,email,password].some((field)=>
        field?.trim()==="")
    ){
        throw new ApiError(400,"All fields are required")
    }

    const existedUser = await User.findOne({
        $or:[{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409,"User with email or username already exists")
    }

    const avatarLocalPath= req.files?.avatar[0]?.path;
    //const coverImageLocalPath= req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath=req.files.coverImage[0].path
    }
    // if(!avatarLocalPath){
    //     throw new ApiError(400,"Avatar file is required")
    // }

    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    // if(!avatar){
    //     throw new ApiError(400,"Avatar is required")
    // }

    const user= await User.create({
        fullName,
        avatar:avatar?.url || "",
        coverImage:coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser= await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registerd SuccessFully")
    )


    //this is used for checking perpuse
    // res.status(200).json({
    //     message:"ok chai pio"
    // })
})

const loginUser =asyncHandler( async (req,res)=>{
    //req body->data
    //username or email
    //find the user
    //password check
    //access and refress token 
    //send cookie


    const {username,email,password}= req.body;
    //console.log("email: ",email);

    if(!(username || email)){
        throw new ApiError(400,"username or email is required")
    }

    const user= await User.findOne({
        $or:[{username},{email}]
    })

    if(!user) {
        throw new ApiError(404, "User not found")
    }

    const isPasswordValid= await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid username or password")
    }

    const {accessToken,refreshToken}= await generateAcessAndRefreshTokens(user._id)
    //console.log("accessToken: ",accessToken)
    //console.log("refreshToken: ",refreshToken)
    const loggedInUser=await User.findById(user._id).select("-password -refreshToken")

    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                loggedInUser,accessToken,refreshToken
            },
            "User logged in Succesfully"
        )
    )

})


const logoutUser = asyncHandler(async (req, res) => {
    if (!req.user) {
        return res.status(401).json(new ApiResponse(401, {}, "Unauthorized request"));
    }

    await User.findByIdAndUpdate(req.user._id, {
        $unset: { refreshToken: "" } // Properly remove refreshToken
    });

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Secure only in production
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});


const refreshAcessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken;
    //console.log("incomingRefreshToken: ",incomingRefreshToken);
    if(!incomingRefreshToken){
        throw new ApiError(401,"authorization reuiest")
    }

   try {
     const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
 
     const user=await User.findById(decodedToken?._id)
 
     if(!user){
         throw new ApiError(401,"Invalid refresh token")
     }
 
     if(user.refreshToken!==incomingRefreshToken){
         throw new ApiError(401,"refresh token is expired or used")
     }
 
     const options={
         httpOnly:true,
         secure:true
     }
 
     const {accessToken,refreshToken} =await generateAcessAndRefreshTokens(user._id)
 
     return res
     .status(200)
     .cookie("accessToken",accessToken,options)
     .cookie("refreshToken",refreshToken,options)
     .json(
         new ApiResponse(200,{accessToken,refreshToken},"New access token generated")
     )
   } catch (error) {
       throw new ApiError(401, error?.message || "Invalid refresh token")
   }

})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body;
    // if(!oldPassword || !newPassword){
    //     throw new ApiError(400,"Old password and new password are required")
    // }

    const user=await User.findById(req.user?._id)
    // if(!user){
    //     throw new ApiError(404,"User does not find")
    // }

    const isPasswordValid= await user.isPasswordCorrect(oldPassword)

    if(!isPasswordValid){
        throw new ApiError(400,"Invalid old password")
    }

    user.password=newPassword;
    //user.refreshToken=undefined;
    await user.save({validateBeforeSave:false})

    return res.status(200).json(
        new ApiResponse(200,{}, "Password changed successfully")
    )
})

const getCurrentUser=asyncHandler(async(req,res)=>{
    return res.status(200).json(
        new ApiResponse(200,req.user,"User fetched successfully")
    )
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {username ,email}=req.body;

    if(!(username || email)){
        throw new ApiError(400,"username and email are required")
    }

    const user=await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                username,
                email:email.toLowerCase()
            }
        },
        {
            new:true
        }
    ).select("-password -refreshToken")

    return res.status(200).json(
        new ApiResponse(200,user,"User details updated successfully")
    )

})

const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path;
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    //upload new avatar on cloudinary
    const avatar=await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400,"Error while uploading the avatar on cloudinary")
    }

    //take old avatar url from db and delete it from cloudinary
    const existingUser = await User.findById(req.user?._id).select("avatar");
    // Store the old avatar URL
    const oldAvatar = existingUser?.avatar;
    const deleteResponse = await deleteFromCloudinary(oldAvatar);
    console.log("deleteResponse: ",deleteResponse);

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {
            new:true
        }
    ).select("-password -refreshToken")

    return res.status(200).json(
        new ApiResponse(200,user,"Avatar updated successfully")
    )
})

const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path;
    if(!coverImageLocalPath){
        throw new ApiError(400,"cover file is required")
    }

    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading the coverImage on cloudinary")
    }

    //take old coverImage url from db and delete it from cloudinary
    const existingUser = await User.findById(req.user?._id).select("coverImage");
    // Store the old coverImage URL
    const oldCoverImage = existingUser?.coverImage;
    const deleteResponse = await deleteFromCloudinary(oldCoverImage);
    console.log("deleteResponse: ",deleteResponse);

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {
            new:true
        }
    ).select("-password -refreshToken")

    return res.status(200).json(
        new ApiResponse(200,user,"coverImage updated successfully")
    )
})

const getUserChannelProfile=asyncHandler(async(req,res)=>{
    const {username}=req.params;
    if(!username?.trim()){
        throw new ApiError(400,"username is missing")
    }
    const channel=await User.aggregate([
        {
            $match:{
                username:username.toLowerCase()
            }
        },{
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },{
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscriberCount:{
                    $size:"$subscribers"
                },
                channelSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{
                            $in:[req.user?._id,"$subscribers.subscriber"]
                        },
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullName:1,
                username:1,
                avatar:1,
                coverImage:1,
                subscriberCount:1,
                channelSubscribedToCount:1,
                isSubscribed:1,
                email:1
            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "Channel does not exist");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"User Channel fetched successfully")
    )
})

const getWatchHistory=asyncHandler(async(req,res)=>{
    const user=await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                                //$arrayElemAt:["$owner",0]
                            }
                        }
                    }
                ]
            }
        },
        
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200,user[0]?.watchHistory || [],"Watch history fetched successfully")
    )
})

export {
    registerUser, 
    loginUser,
    logoutUser,
    refreshAcessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}