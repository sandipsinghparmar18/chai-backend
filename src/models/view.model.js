import mongoose from "mongoose";

const viweSchema=new mongoose.Schema({
    viewer:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    video:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
},{timestamps:true})

export const View=mongoose.model("View",viweSchema)