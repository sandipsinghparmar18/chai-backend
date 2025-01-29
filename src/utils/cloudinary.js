import {v2 as cloudinary} from 'cloudinary'
import fs from "fs"

          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret:process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary=async(localFilePath)=>{
    try {
        if(!localFilePath) return null
        //upload file on cloudinary
        const response=await cloudinary.uploader.upload(localFilePath, {
            resource_type:"auto"
        })
        //file has been uploaded successfull
        //console.log("file is uploaded on cloudinary ",response.url)
        fs.unlinkSync(localFilePath)
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) //remove the locally save temporiry file as upload operation as failed
        return null;
    }
}

const deleteFromCloudinary=async(publicId)=>{
    try {
        if(!publicId) return null
        //delete file from cloudinary
        const response=await cloudinary.uploader.destroy(publicId)
        //file has been deleted successfull
        console.log("file is deleted from cloudinary ",response)
        return response;
    } catch (error) {
        console.error("Error deleting file from Cloudinary:", error);
        return null;
    }
}

export {uploadOnCloudinary,deleteFromCloudinary}