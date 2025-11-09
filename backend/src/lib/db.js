import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        // Be defensive: some connection types (SRV) may not populate conn.connection.host
        const host = conn?.connection?.host || mongoose.connection?.host || 'unknown-host';
        const readyState = mongoose.connection?.readyState;
        console.log(`MongoDB connected: ${host} (readyState=${readyState})`);
    } catch (error) {
        console.log("MongoDB connection error!", error);
    }
};

// Add listeners for mongoose connection lifecycle to aid debugging
mongoose.connection.on('connecting', () => {
    console.log('Mongoose event: connecting');
});

mongoose.connection.on('connected', () => {
    console.log('Mongoose event: connected');
});

mongoose.connection.on('open', () => {
    console.log('Mongoose event: open');
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose event: error', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose event: disconnected');
});