import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken'
import { generateToken } from "../lib/utils.js";


//signup function logic
export const signup = async (req ,res) => {
    const {fullName, email,password} = req.body;
   try {

    //check if all fields are provided
    if(!fullName || !email || !password) {
        return res.status(400).json({ message: "All fields are required!"});
     
    }

    //check length of password
    if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters"});
    }

    const user = await User.findOne({email});

    //check if the user already exists in the database
    if (user) return res.status(400).json({ message: "Email already exists"});

    //hash the password - using bcrypt
    const salt = await bcrypt.genSalt(10);    //salt is a random string added to your password 
                                             // before storing in the database, The number 10 is 
                                             //the salt rounds, controlling how complex the salt is.
                                             // Higher numbers make hashing slower but more secure.
    const hashedPassword = await bcrypt.hash(password, salt);

    //creating new user
    const newUser = new User({
        fullName,
        email,
        password: hashedPassword
    });


    //If we were succesful in creating the user account
    if(newUser) {
        await newUser.save();
        //generate JWT token here - which we can create in "../lib/utils.js"
        generateToken(newUser._id, res);  //MONGODB user _id to store

        res.status(201).json({
            _id: newUser._id,
            fullName: newUser.fullName,
            email: newUser.email,
            profilePic: newUser.profilePic,
        });
    } else {
        res.status(400).json({message: "Invalid user data"});

    }
   } catch (error) {
        console.log("Error in signup controller", error.message);
        res.status(500).json({message: "Internal Server Error"});
   } 
};

//login function logic
export const login = async (req ,res) => {
    const { email, password } = req.body
    try {
        //check if the user exists in the database
        const user = await User.findOne({email});

        //If user not found in database
        if(!user) {
            return res.status(400).json({message: "Invalid credentials!"});
        }

        //check if password is correct if email exists in db
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if(!isPasswordCorrect) {
            return res.status(400).json({message: "Invalid credentials!"});
        }
        
        generateToken(user._id, res);

        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
        });
    }
    catch(error) {
        console.log("Error in login controller", error.message);
        res.status(500).json({ message: "Internal Server Error"});
    }
};

export const logout = (req ,res) => {
    try {
       res.cookie("jwt", "", {maxAge:0}) 
       res.status(200).json({ message: "Logged out successfully"});
    }
    catch (error) {
        console.log("Error in logout controller", error.message);
        res.status(500).json({ message: "Internal Server Error"});
    }
};

// check current auth status
export const check = async (req, res) => {
    try {
        const token = req.cookies?.jwt;
        if (!token) return res.status(401).json({ message: 'Not authenticated' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
        });
    } catch (error) {
        console.log('Error in check controller', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

