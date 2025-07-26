import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";
import 'dotenv/config';

import authRoutes from "./routes/userRoutes.js";
import { connectDB } from "./config/mongodb.js";
import adminRouter from "./routes/adminRoute.js";
import { doctorRouter } from "./routes/doctorroute.js";
import userRouter from "./routes/userRoutes.js";

import User from "./models/userModel.js";
import { EsewaInitiatePayment, paymentStatus } from './controllers/esewa.controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

connectDB();

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: { 
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/admin', adminRouter);
app.use('/api/doctor', doctorRouter);
app.use('/api/user', userRouter);
app.use("/api/auth", authRoutes); 
// === Socket.io & Online Users ===

const onlineUsers = new Map();

function getReceiverSocketId(receiverId) {
  return onlineUsers.get(receiverId);
}

function getOnlineUsers() {
  return Array.from(onlineUsers.keys());
}

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId && userId !== "undefined") {
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} connected with socket: ${socket.id}`);

    io.emit("getOnlineUsers", getOnlineUsers());
    socket.broadcast.emit("user_status", { userId, status: 'online' });
  }

  socket.on("newMessage", async (messageData) => {
    try {
      const { senderId, receiverId, text, image } = messageData;

      if (!senderId || !receiverId || (!text && !image)) {
        console.log("Invalid message data");
        return;
      }

      const newMessage = new Message({
        senderId,
        receiverId,
        text,
        image
      });

      await newMessage.save();

      await newMessage.populate("senderId", "name username profilePic");
      await newMessage.populate("receiverId", "name username profilePic");

      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage);
      }

      socket.emit("messageDelivered", {
        tempId: messageData.tempId,
        message: newMessage
      });

      console.log(`Message sent from ${senderId} to ${receiverId}`);
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("messageError", {
        tempId: messageData.tempId,
        error: "Failed to send message"
      });
    }
  });

  socket.on("typing", (data) => {
    const { senderId, receiverId, isTyping } = data;
    const receiverSocketId = getReceiverSocketId(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", {
        userId: senderId,
        isTyping
      });
    }
  });

  socket.on("markAsRead", async (data) => {
    try {
      const { userId, partnerId } = data;

      const result = await Message.updateMany(
        {
          senderId: partnerId,
          receiverId: userId,
          isRead: false
        },
        { isRead: true }
      );

      const senderSocketId = getReceiverSocketId(partnerId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messagesRead", {
          userId,
          partnerId,
          count: result.modifiedCount
        });
      }

      console.log(`Messages marked as read between ${userId} and ${partnerId}`);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  });

  socket.on("disconnect", async () => {
    console.log(`Client disconnected: ${socket.id} userId: ${userId}`);

    if (userId && onlineUsers.get(userId) === socket.id) {
      onlineUsers.delete(userId);
      console.log(`User ${userId} removed from onlineUsers`);

      try {
        await User.findByIdAndUpdate(userId, {
          lastSeen: new Date()
        });
      } catch (err) {
        console.error("Error updating last seen:", err);
      }

      io.emit("getOnlineUsers", getOnlineUsers());
      socket.broadcast.emit("user_status", {
        userId,
        status: 'offline',
        lastSeen: new Date().toISOString()
      });
    }
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});

app.set('io', io);

app.get("/", (req, res) => res.send("Chat API working"));
app.post("/initiate-payment", EsewaInitiatePayment);
app.post("/payment-status", paymentStatus);

export { httpServer, io };
export default app;
