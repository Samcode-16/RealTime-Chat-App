import { Server } from "socket.io";

// Socket.IO instance will be assigned when initialized with a server
let io;

// MAP: Store online users - maps user ID to their socket ID
// Format: {userId: socketId}
const userSocketMap = {};

// Initialize Socket.IO with an existing HTTP server
export function initSocket(server) {
    io = new Server(server, {
        cors: {
            origin: [process.env.FRONTEND_URL || "http://localhost:5173"],
            credentials: true,
        },
    });

    // SOCKET EVENT: Listen for new socket connections
    io.on("connection", (socket) => {
        console.log("A user connected", socket.id);

        // Get user ID from connection query (sent from frontend)
        const userId = socket.handshake.query?.userId;

        // If user ID exists, store their socket ID in map
        if (userId) userSocketMap[userId] = socket.id;

        // Broadcast updated list of online users to ALL connected clients
        io.emit("getOnlineUsers", Object.keys(userSocketMap));

        // SOCKET EVENT: Listen for disconnection
        socket.on("disconnect", () => {
            console.log("A user disconnected", socket.id);
            // Remove user from online users map
            if (userId) delete userSocketMap[userId];
            // Broadcast updated list of online users to ALL clients
            io.emit("getOnlineUsers", Object.keys(userSocketMap));
        });
    });
}

// HELPER: Get socket ID for a specific user
export function getReceiverSocketId(userId) {
    return userSocketMap[userId];
}

// Export the io reference (may be undefined until initSocket is called)
export { io };