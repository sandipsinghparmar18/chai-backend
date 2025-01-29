import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'

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
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar is required")
    }

    const user= await User.create({
        fullName,
        avatar:avatar.url,
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
        throw new ApiError(404,"User does not find")
    }

    const isPasswordValid= await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credenatial")
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
                user:loggedInUser,accessToken,refreshToken
            },
            "User logged in Succesfully"
        )
    )

})


const logoutUser=asyncHandler(async (req,res)=>{
        await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )
    const options={
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(200,{}, "User logged out successfully")
    )
})

const refreshAcessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken;

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
 
     const {accessToken,newRefreshToken} =await generateAcessAndRefreshTokens(user._id)
 
     return res
     .status(200)
     .cookie("accessToken",accessToken,options)
     .cookie("refreshToken",newRefreshToken,options)
     .json(
         new ApiResponse(200,{accessToken,newRefreshToken},"New access token generated")
     )
   } catch (error) {
       throw new ApiError(401, error?.message || "Invalid refresh token")
   }

})

export {registerUser, loginUser,logoutUser,refreshAcessToken}