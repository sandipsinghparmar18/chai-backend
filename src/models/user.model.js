import mongoose from "mongoose";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const userSchema=new mongoose.Schema(
    {
        username:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true
        },
        fullName:{
            type:String,
            required:true,
            trim:true,
            index:true
        },
        avatar:{
            type:String, //cloudinary url
        },
        coverImage:{
            type:String  //cloudinary url 
        },
        watchHistory:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        password:{
            type:String,
            required:[true,"PassWord is required"]
        },
        refreshToken:{
            type:String
        }
    }
,{timestamps:true})

//yha pr password encrypt krte h
userSchema.pre("save",async function (next) {
    if(! this.isModified("password")) return next();

    this.password= await bcrypt.hash(this.password,10)
    next();
})

//yha pr user enter password check krte h
userSchema.methods.isPasswordCorrect=async function (password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User=mongoose.model("User",userSchema)


//write diffrence between access token and refresh token
// Access tokens are short-lived tokens that are used to access protected resources on behalf of the user.
// Refresh tokens are long-lived tokens that are used to obtain new access tokens after the current access token expires.
// Access tokens are used to access protected resources on behalf of the user. They are short-lived tokens that expire after a certain period of time.
// Refresh tokens are used to obtain new access tokens after the current access token expires. They are long-lived tokens that can be used to obtain new access tokens multiple times.
// Access tokens are usually sent in the Authorization header of an HTTP request. Refresh tokens are usually stored in a secure cookie or local storage.
// Access tokens are usually issued by an authorization server. Refresh tokens are usually issued by an authorization server along with the access token.
// Access tokens are used to access protected resources. Refresh tokens are used to obtain new access tokens.
// Access tokens are usually JWT tokens. Refresh tokens can be JWT tokens or opaque tokens.
// Access tokens are usually short-lived (e.g., 15 minutes). Refresh tokens are usually long-lived (e.g., 30 days).
// Access tokens are usually sent in the Authorization header of an HTTP request. Refresh tokens are usually sent in a secure cookie or local storage.
// Access tokens are usually signed by the authorization server. Refresh tokens are usually signed by the authorization server.
// Access tokens are usually stored in memory or a database. Refresh tokens are usually stored in a secure cookie or local storage.
// Access tokens are usually sent in the Authorization header of an HTTP request. Refresh tokens are usually sent in a secure cookie or local storage.