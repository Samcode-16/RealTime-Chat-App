import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";


// CONTROLLER: Get all users except the logged-in user (for sidebar)
// Called by: GET /api/messages/users
export const getUsersForSidebar = async(req, res) => {
    try {
        // Get logged-in user's ID from auth middleware
        const loggedInUserId = req.user._id;
        
        // Find all users except current user, exclude password field
        // $ne = "not equal" in MongoDB
        const filteredUsers = await User.find({_id: {$ne: loggedInUserId}}).select("-password");

        // Send users array as JSON response
        res.status(200).json(filteredUsers);
    }
    catch (error) {
        console.error("Error in getUsersForSidebar: ", error.message);
        res.status(500).json({ error: "Internal server error"});
    }
};

// CONTROLLER: Get all messages between two users
// Called by: GET /api/messages/:id (where id is the other user's ID)
export const getMessages = async(req, res) => {
    try {
        // Extract user ID from URL parameter
        const {id: userToChatId} = req.params
        
        // Get logged-in user's ID from auth middleware
        const myId = req.user._id;

        // Find messages where either:
        // 1. I sent to them, OR
        // 2. They sent to me
        const messages = await Message.find({
            $and: [
                {
                    $or: [
                        { senderId: myId, receiverId: userToChatId },
                        { senderId: userToChatId, receiverId: myId },
                    ],
                },
                { hiddenFor: { $ne: myId } },
            ],
        })

        // Send messages array as JSON response
        res.status(200).json(messages)
    }
    catch (error) {
        console.log("Error in getMessages controller: ", error.message);
        res.status(500).json({ error: "Internal server error"});
    }
}

// CONTROLLER: Send a new message (text and/or image)
// Called by: POST /api/messages/send/:id (where id is receiver's ID)
export const sendMessage = async (req, res) => {
    try {
        // Extract message data from request body
        const { text, image } = req.body;
        
        // Extract receiver ID from URL parameter
        const { id: receiverId } = req.params;
        
        // Get sender ID from auth middleware
        const senderId = req.user._id;

        let imageUrl = null;
        
        // If message includes an image, upload it to Cloudinary
        if (image) {
            try {
                console.log("Uploading image to Cloudinary...");
                
                // Upload base64 image to Cloudinary cloud storage
                const uploadResponse = await cloudinary.uploader.upload(image, {
                    folder: "chat-app-messages", // Organize in folder
                });
                
                // Get secure URL of uploaded image
                imageUrl = uploadResponse.secure_url;
                console.log("Image uploaded successfully:", imageUrl);
            } catch (uploadError) {
                console.error("Cloudinary upload error:", uploadError);
                return res.status(500).json({ error: "Failed to upload image" });
            }
        }

        // Create new message document in database
        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl, // URL from Cloudinary or null
        });

        // Save message to MongoDB
        await newMessage.save();

        // REAL-TIME: Send message to receiver via Socket.io (if they're online)
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            // Emit "newMessage" event to specific user's socket
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }
        
        // Send saved message back to sender as confirmation
        res.status(201).json(newMessage)
    }
    catch (error) {
        console.log("Error in sendMessage controller: ", error.message);
        console.error("Full error:", error);
        res.status(500).json({error: "Internal server error"});
    }
}

// CONTROLLER: Delete a message
// DELETE /api/messages/:id?for=me | ?for=all
export const deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const scope = (req.query.for || "").toLowerCase();
        const userId = req.user._id;

        const msg = await Message.findById(id);
        if (!msg) return res.status(404).json({ message: "Message not found" });

        if (scope === "me") {
            const alreadyHidden = (msg.hiddenFor || []).some((u) => String(u) === String(userId));
            if (!alreadyHidden) {
                msg.hiddenFor = [...(msg.hiddenFor || []), userId];
                await msg.save();
            }
            return res.status(200).json({ ok: true, messageId: id });
        }

        if (scope === "all") {
            // Only sender can delete for everyone
            if (String(msg.senderId) !== String(userId)) {
                return res.status(403).json({ message: "Only sender can delete for everyone" });
            }
            msg.deletedForEveryone = true;
            msg.text = "";
            msg.image = undefined;
            await msg.save();

            // Notify both parties via socket (if online)
            const { io, getReceiverSocketId } = await import("../lib/socket.js");
            try {
                const receiverSocketId = getReceiverSocketId(String(msg.receiverId));
                if (receiverSocketId) io.to(receiverSocketId).emit("messageDeletedForEveryone", { messageId: id });
                const senderSocketId = getReceiverSocketId(String(msg.senderId));
                if (senderSocketId) io.to(senderSocketId).emit("messageDeletedForEveryone", { messageId: id });
            } catch (e) {
                console.error("Emit messageDeletedForEveryone failed:", e?.message);
            }

            return res.status(200).json({ ok: true, messageId: id });
        }

        return res.status(400).json({ message: "Invalid query. Use ?for=me or ?for=all" });
    } catch (error) {
        console.error("Error in deleteMessage controller:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}