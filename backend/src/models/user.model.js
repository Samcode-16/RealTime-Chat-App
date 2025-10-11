import mongoose from "mongoose";

//Create a schema for user which may include name,etc
const userSchema = new mongoose.Schema( 
    {
        email: {
            type: String,
            required: true,
            unique: true,
        },
        fullName: {
            type: String,
            required: true,
        },
        password: {
           type: String,
           required: true,
            minlength: 6,
        },
        profilePic: {
            type: String,
            default: ""
        },
    },
    { timestamps: true }
);

//schema is built, now creating model out of this
const User = mongoose.model("User", userSchema);   //upercase mongoose wants first case as uppercase

export default User;