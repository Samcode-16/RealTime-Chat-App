import {v2 as cloudinary} from "cloudinary"

import {config} from 'dotenv'

config()

//connects my backend app to my cloudinary account
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImage = async (imagePath) => {
    try {
        const result = await cloudinary.uploader.upload(imagePath, {
            folder: "chat-app-profiles",
            width: 300,
            crop: "scale",
        });
        return result;
    } catch (error) {
        console.error("Error uploading to cloudinary:", error);
        throw new Error("Could not upload image");
    }
};

export default cloudinary;

