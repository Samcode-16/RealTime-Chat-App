import { Server } from "socket.io"; // Socket.IO for real-time communication
import http from "http"; // Node.js HTTP module
import express from "express"; // Express framework

// Create Express app
const app = express();

// Create HTTP server using Express app
const server = http.createServer(app);

// Initialize Socket.IO server with CORS configuration
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173"], // Allow frontend to connect
    },
});

// HELPER FUNCTION: Get socket ID for a specific user
// Used to send real-time messages to specific users
export function getReceiverSocketId(userId) {
    return userSocketMap[userId]; // Returns socket ID or undefined
}

// MAP: Store online users - maps user ID to their socket ID
// Format: {userId: socketId}
const userSocketMap = {};

// SOCKET EVENT: Listen for new socket connections
io.on("connection", (socket) => {
    console.log("A user connected", socket.id);

    // Get user ID from connection query (sent from frontend)
    const userId = socket.handshake.query.userId;
    
    // If user ID exists, store their socket ID in map
    if (userId) userSocketMap[userId] = socket.id

    // Broadcast updated list of online users to ALL connected clients
    // Object.keys() converts the map to an array of user IDs
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // SOCKET EVENT: Listen for disconnection
    socket.on("disconnect", () => {
        console.log("A user disconnected", socket.id);
        
        // Remove user from online users map
        delete userSocketMap[userId];
        
        // Broadcast updated list of online users to ALL clients
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

// Export socket instance, app, and server for use in other files
export { io, app, server };