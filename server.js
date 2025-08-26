import app from './app.js';
import dotenv from "dotenv";
import { connectMongoDatabase } from './config/db.js';
import { v2 as cloudinary } from 'cloudinary';
import Razorpay from 'razorpay';

// Load env
dotenv.config({ path: './config/config.env' }); // correct relative path from backend folder


// DB connection
connectMongoDatabase();
// Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.log(`Error : ${err.message}`);
    console.log(`Server is shutting down due to uncaught exception`);
    process.exit(1);
});

// Razorpay instance
export const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

console.log("Razorpay Key:", process.env.RAZORPAY_KEY_ID);

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`Server is running on PORT ${port}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.log(`Error: ${err.message}`);
    console.log(`Server is shutting down due to unhandled promise rejection`);
    server.close(() => process.exit(1));
});
