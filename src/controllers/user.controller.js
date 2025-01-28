import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'

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
    console.log("email: ",email)

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
    const coverImageLocalPath= req.files?.coverImage[0]?.path;

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

export {registerUser}