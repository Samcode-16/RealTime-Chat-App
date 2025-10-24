import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors"

import {connectDB} from "./lib/db.js"         //to connect to MONGODB database
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";

dotenv.config();
const app = express();

const PORT = process.env.PORT;

app.use(express.json()); 
app.use(cookieParser());
// Accept requests from the dev frontend origin. In development we reflect the request origin
// so Vite's port (which can change) is allowed while still sending credentials.
app.use(
    cors({
        origin: true, // reflect request origin
        credentials: true,
    })
);


app.use("/api/auth", authRoutes);
app.use("/api/message", messageRoutes);

app.listen(PORT, () => {
    console.log("Server is running on PORT" + PORT);
    connectDB()
});