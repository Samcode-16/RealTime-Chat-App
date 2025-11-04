import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";

export const getUsersForSidebar = async(req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find({_id: {$ne: loggedInUserId}}).select("-password");

        res.status(200).json(filteredUsers);
    }
    catch (error) {
        console.error("Error in getUsersForSidebar: ", error.message);
        res.status(500).json({ error: "Internal server error"});
    }
};

export const getMessages = async(req, res) => {
    try {
        const {id: userToChatId} = req.params
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                {senderId:myId, receiverId: userToChatId},
                {senderId:userToChatId, receiverId:myId}
            ]
        })

        res.status(200).json(messages)
    }
    catch (error) {
        console.log("Error in getMessages controller: ", error.message);
        res.status(500).json({ error: "Internal server error"});
    }
}

export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        let imageUrl = null;
        if (image) {
            try {
                //upload base64 image to cloudinary
                console.log("Uploading image to Cloudinary...");
                const uploadResponse = await cloudinary.uploader.upload(image, {
                    folder: "chat-app-messages",
                });
                imageUrl = uploadResponse.secure_url;
                console.log("Image uploaded successfully:", imageUrl);
            } catch (uploadError) {
                console.error("Cloudinary upload error:", uploadError);
                return res.status(500).json({ error: "Failed to upload image" });
            }
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl,
        });

        await newMessage.save();

        //todo: realtime functionality goes here => socket.io

        res.status(201).json(newMessage)
    }
    catch (error) {
        console.log("Error in sendMessage controller: ", error.message);
        console.error("Full error:", error);
        res.status(500).json({error: "Internal server error"});
    }
}