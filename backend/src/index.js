import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import {connectDB} from "./lib/db.js";        //to connect to MONGODB database

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT

app.use(express.json());  //helps us extract json data out of body
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);      //endpoint for messages


app.listen(PORT, () => {
    console.log("Server is running on PORT" + PORT);
    connectDB()
});