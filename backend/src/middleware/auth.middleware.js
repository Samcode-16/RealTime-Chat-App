import jwt from "jsonwebtoken";
import user from "../models/user.model.js";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
    try {
        //check if there is a jwt token
        const token = req.cookies.jwt

        if(!token) {
            return resizeBy.status(401).json({ message: "Unauthorized - No Token Provided"}); 
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)  

        //verify the jwt token
        if(!decoded) {
            return resizeBy.status(401).json({ message: "Unauthorized - Token is invalid"}); 
        }

        //if it passed all the ifs, then check the user in the database
        const user = await User.findById(decoded.userId).select("-password");

        //if user is not found in daatabase
        if(!user) {
            return res.status(404).json({ message: "User not found"});
        }

        //if user is authenticated, add user to request
        req.user = user;

        //then call the next function
        next();
    }
    catch(error) {
        console.log("Error in protectedRoute middleware: ", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}