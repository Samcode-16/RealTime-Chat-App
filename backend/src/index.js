import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import path from "path";
import http from "http";
import net from "net";

import fileUpload from "express-fileupload";

import { connectDB } from "./lib/db.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";

import { initSocket } from "./lib/socket.js";

dotenv.config();

const app = express();
const DESIRED_PORT = Number(process.env.PORT) || 5001;
const __dirname = path.resolve();

// Create HTTP server and attach socket.io later
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Middlewares
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
}));

// File upload middleware
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/',
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
}));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

if(process.env.NODE_ENV==="production"){
    app.use(express.static(path.join(__dirname,"../frontend/dist")));



    app.get("*",(req, res) => {
        res.sendFile(path.join(__dirname,"../frontend","dist","index.html"));
    })
}

// Initialize socket.io with the HTTP server
initSocket(server);

// Probe for an available port, preferring DESIRED_PORT, then next few
function isPortFree(port) {
    return new Promise((resolve) => {
        const tester = net
            .createServer()
            .once("error", (err) => {
                if (err && (err.code === "EADDRINUSE" || err.code === "EACCES")) {
                    resolve(false);
                } else {
                    resolve(false);
                }
            })
            .once("listening", () => {
                tester.close(() => resolve(true));
            })
            .listen(port, "0.0.0.0");
    });
}

async function choosePort(startPort, attempts = 10) {
    for (let i = 0; i < attempts; i++) {
        const port = startPort + i;
        // eslint-disable-next-line no-await-in-loop
        const free = await isPortFree(port);
        if (free) return port;
    }
    return startPort; // fallback (server.listen will still error if occupied)
}

(async () => {
    const port = await choosePort(DESIRED_PORT, 10);
    if (port !== DESIRED_PORT) {
        console.warn(`Desired port ${DESIRED_PORT} in use. Starting on ${port}.`);
        process.env.PORT = String(port);
    }
    server.listen(port, () => {
        console.log("Server is running on PORT:" + port);
    });
})();