import {v2 as cloudinary} from 'cloudinary';
import fs from "fs";

          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = async (filePath) => {
  try {
    if(!filePath) return null;
    //upload to cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type:"auto"
    });
    //successful upload
    // console.log("File is uploaded to cloudinary", result.url);
    //delete the file from temp folder
    fs.unlinkSync(filePath);
    return result;
   
  } catch (error) {
    fs.unlinkSync(filePath);//delete the file from temp folder if it was not uploaded
    console.log("Error uploading to cloudinary", error);
    return null;
  }
};

export  {uploadToCloudinary};