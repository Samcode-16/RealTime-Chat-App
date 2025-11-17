import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import { Readable } from "stream";

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
        const { text, image, file, fileName, fileType } = req.body;
        
        // Extract receiver ID from URL parameter
        const { id: receiverId } = req.params;
        
        // Get sender ID from auth middleware
        const senderId = req.user._id;

        let imageUrl = null;
        let uploadedFileUrl = null;
        
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

        // If message includes a file (non-image), upload as raw to Cloudinary
        if (file) {
            try {
                const uploadResponse = await cloudinary.uploader.upload(file, {
                    folder: "chat-app-files",
                    resource_type: "raw",
                });
                uploadedFileUrl = uploadResponse.secure_url;
            } catch (uploadError) {
                console.error("Cloudinary file upload error:", uploadError);
                return res.status(500).json({ error: "Failed to upload file" });
            }
        }

        // Create new message document in database
        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl, // URL from Cloudinary or null
            fileUrl: uploadedFileUrl || undefined,
            fileName: uploadedFileUrl ? (fileName || "file") : undefined,
            fileType: uploadedFileUrl ? (fileType || "application/octet-stream") : undefined,
        });

        // Save message to MongoDB
        await newMessage.save();

        // REAL-TIME: Send message to receiver via Socket.io (if they're online)
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            // Emit "newMessage" event to specific user's socket
            io.to(receiverSocketId).emit("newMessage", newMessage);

            // Server-side unread tracking: emit updated count for this sender to receiver
            try {
                const unreadCount = await Message.countDocuments({
                    receiverId,
                    senderId,
                    read: false,
                });
                io.to(receiverSocketId).emit("unreadUpdated", { from: senderId.toString(), count: unreadCount });
            } catch (e) {
                console.error("Error computing unread count:", e.message);
            }
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
            msg.fileUrl = undefined;
            msg.fileName = undefined;
            msg.fileType = undefined;
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

// CONTROLLER: Get unread counts per sender for the current user
// GET /api/messages/unread-counts -> { [senderId]: count }
export const getUnreadCounts = async (req, res) => {
    try {
        const myId = req.user._id;
        const pipeline = [
            { $match: { receiverId: myId, read: false } },
            { $group: { _id: "$senderId", count: { $sum: 1 } } },
        ];
        const agg = await Message.aggregate(pipeline);
        const map = {};
        for (const row of agg) {
            map[row._id.toString()] = row.count;
        }
        res.status(200).json(map);
    } catch (error) {
        console.error("Error in getUnreadCounts:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

// CONTROLLER: Securely download an attached file via server proxy
// GET /api/messages/file/download/:id
export const downloadAttachment = async (req, res) => {
    try {
        const { id } = req.params;
        const me = req.user._id;
        const msg = await Message.findById(id);
        if (!msg) return res.status(404).json({ error: "Message not found" });
        if (!msg.fileUrl) return res.status(400).json({ error: "No attachment on this message" });

        // Only participants can download
        const isParticipant = String(msg.senderId) === String(me) || String(msg.receiverId) === String(me);
        if (!isParticipant) return res.status(403).json({ error: "Forbidden" });

        const storageUrl = msg.fileUrl;
        const filename = msg.fileName || "attachment";

        // Use built-in fetch (Node 18+) which follows redirects
        const fileRes = await fetch(storageUrl);
        if (!fileRes.ok) {
            return res.status(fileRes.status).send("Failed to fetch file from storage");
        }

        const contentType = fileRes.headers.get("content-type") || msg.fileType || "application/octet-stream";
        const contentLength = fileRes.headers.get("content-length");

        res.setHeader("Content-Type", contentType);
        if (contentLength) res.setHeader("Content-Length", contentLength);
        // RFC 5987 for UTF-8 filenames
        res.setHeader(
            "Content-Disposition",
            `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`
        );

        // Pipe the web stream to Node response
        const nodeStream = Readable.fromWeb(fileRes.body);
        nodeStream.pipe(res);
    } catch (error) {
        console.error("Error in downloadAttachment:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};