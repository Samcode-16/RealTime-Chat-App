import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            //senderId is the reference to the user model
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        text: {
            type: String,
        },
        image: {
            type: String,
        },
        fileUrl: {
            type: String,
        },
        fileName: {
            type: String,
        },
        fileType: {
            type: String,
        },
        delivered: {
            type: Boolean,
            default: false,
        },
        read: {
            type: Boolean,
            default: false,
        },
        deletedForEveryone: {
            type: Boolean,
            default: false,
        },
        hiddenFor: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    { timestamps: true }  
);

const Message = mongoose.model("Message", messageSchema); 

export default Message;