import {v2 as cloudinary} from 'cloudinary'
import fs from "fs"
import path from "path";

const isProduction = process.env.NODE_ENV === "production";

          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret:process.env.CLOUDINARY_API_SECRET,
  secure: true
});


const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath || !fs.existsSync(localFilePath)) {
      console.error("File does not exist:", localFilePath);
      return null;
    }

    console.log("Uploading file:", localFilePath);

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      chunk_size: 6000000, // Recommended for large files
      folder: "videos", // Organize files in Cloudinary
    });

    console.log("File uploaded successfully:", response.secure_url);

    // Cleanup: Delete local file safely
    if (!isProduction && fs.existsSync(localFilePath)) {
      fs.unlink(localFilePath, (err) => {
        if (err) console.error("Error deleting local file:", err);
      });
    }

    return response;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);

    // Cleanup local file safely in case of failure
    if (!isProduction && fs.existsSync(localFilePath)) {
      fs.unlink(localFilePath, (err) => {
        if (err) console.error("Error deleting local file:", err);
      });
    }

    return null;
  }
};  


// Extract public ID from URL
const getPublicIdFromUrl = (url) => {
  try {
    if (!url) throw new Error("URL is empty or undefined");

    // Ensure URL contains '/upload/' before processing
    const urlParts = url.split("/upload/");
    if (urlParts.length < 2) throw new Error("Invalid Cloudinary URL format");

    // Extract public ID without version and without file extension
    const filename = urlParts[1].split("/").pop(); // Get last part after '/'
    const publicId = filename.split(".")[0]; // Remove file extension

    return publicId;
  } catch (error) {
    console.error("Error extracting public ID:", error.message);
    return null;
  }
};

// Delete from Cloudinary (With Cache Invalidation)
const deleteFromCloudinary = async (url, resourceType = "image") => {
  try {
    const publicId = getPublicIdFromUrl(url);
    if (!publicId) {
      console.error("Invalid URL, cannot extract public ID.");
      return null;
    }
    //console.log("Public ID:", publicId);
    // Attempt to delete the resource
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType, // Ensures deletion of correct asset type
      invalidate: true, // Forces cache invalidation
    });

    console.log("Delete Response:", result);

    if (result.result !== "ok") {
      console.warn("Cloudinary did not delete the asset. Check public ID & resource type.");
    }

    return result;
  } catch (error) {
    console.error("Error deleting asset:", error);
    return null;
  }
};


export {uploadOnCloudinary,deleteFromCloudinary}