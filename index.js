import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import 'dotenv/config';

import authRoutes from "./routes/userRoutes.js";
import { connectDB } from "./config/mongodb.js";
import adminRouter from "./routes/adminRoute.js";
import { doctorRouter } from "./routes/doctorroute.js";
import userRouter from "./routes/userRoutes.js";

import { EsewaInitiatePayment, paymentStatus } from './controllers/esewa.controller.js';
import messageRouter from "./routes/messageroute.js";
import doctorMessageRouter from "./routes/doctorMessageroute.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Connect to MongoDB
connectDB();

// Create Express app
const app = express();

// Middleware
app.use(express.json());
console.log("Loaded SECRET env:", process.env.SECRET);
app.use(cors({
origin: ["http://localhost:5173", "http://localhost:5174"],

  credentials: true
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/admin', adminRouter);
app.use('/api/doctor', doctorRouter);
app.use('/api/user', userRouter);
app.use("/api/auth", authRoutes); 
app.use("/messages",messageRouter)
app.use("/api/doctor/messages", doctorMessageRouter);

// Esewa Routes
app.post("/initiate-payment", EsewaInitiatePayment);
app.post("/payment-status", paymentStatus);

// Health Check Route
app.get("/", (req, res) => res.send("Backend API running"));

export default app;
