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
import chatRoutes from "./routes/chatRoute.js";

import { getRoomId } from "./config/chatHelper.js";
import {
  getUserLastSeen,
  updateMessageStatus,
  markMessageAsRead,
  markMessageAsDelivered,
  undeliveredMessages as getUndeliveredMessages,
  updateUserLastSeen,
  createMessage
} from "./Service/chatService.js";

import User from "../backend/models/userModel.js";
import Message from "./models/Message.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

connectDB();
const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: { origin: "*" }
});

app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/admin', adminRouter);
app.use('/api/doctor', doctorRouter);
app.use('/api/user', userRouter);
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);
  let currentUserId = null;

  socket.on('register_user', ({ userId }) => {
    console.log(`register_user event received for userId: ${userId}`);
    if (!userId) return;
    currentUserId = userId;
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} connected with socket: ${socket.id}`);
  });

  socket.on('join_room', async ({ userId, partnerId }) => {
    console.log(`join_room event received: userId=${userId}, partnerId=${partnerId}`);
    if (!userId || !partnerId) return;
    currentUserId = userId;
    onlineUsers.set(userId, socket.id);
    const roomId = getRoomId(userId, partnerId);
    socket.join(roomId);
    console.log(`User ${userId} joined room ${roomId}`);

    try {
      const undeliveredMessages = await getUndeliveredMessages(userId, partnerId);
      const undeliveredCount = await markMessageAsDelivered(userId, partnerId);

      if (undeliveredCount > 0) {
        undeliveredMessages.forEach((msg) => {
          io.to(roomId).emit("message_status", {
            messageId: msg.messageId,
            status: 'delivered',
            sender: msg.sender,
            receiver: msg.receiver
          });
        });
      }

      io.to(roomId).emit("user_status", { userId, status: 'online' });

      if (onlineUsers.has(partnerId)) {
        socket.emit("user_status", { userId: partnerId, status: 'online' });
      } else {
        const lastSeen = await getUserLastSeen(partnerId);
        socket.emit("user_status", {
          userId: partnerId,
          status: 'offline',
          lastSeen: lastSeen || new Date().toISOString()
        });
      }
    } catch (err) {
      console.error("Error joining room:", err);
    }
  });

  socket.on("sent_message", async (message) => {
    console.log("sent_message received:", message);
    const { messageId, sender, receiver, message: text } = message;
    if (!messageId || !sender || !receiver || !text) {
      console.log("sent_message missing required fields");
      return;
    }

    const roomId = getRoomId(sender, receiver);
    try {
      await createMessage({ ...message, status: 'sent', roomId });
      console.log(`Message saved to DB with id ${messageId}`);
    } catch (e) {
      console.error("Error saving message:", e);
    }

    if (onlineUsers.has(receiver)) {
      message.status = 'delivered';
      await updateMessageStatus(messageId, 'delivered');
      console.log(`Message status updated to delivered for messageId ${messageId}`);
    } else {
      message.status = 'sent';
      console.log(`Receiver offline, message status remains sent for messageId ${messageId}`);
    }

    io.to(roomId).emit("message", message);
    console.log(`Message emitted to room ${roomId}`);

    if (onlineUsers.has(receiver)) {
      const receiverSocket = io.sockets.sockets.get(onlineUsers.get(receiver));
      const senderUser = await User.findById(sender).select("username");

      if (receiverSocket && !receiverSocket.rooms.has(roomId)) {
        receiverSocket.emit("notification", {
          senderId: sender,
          senderName: senderUser?.username,
          messageId,
          message: text
        });
        console.log(`Notification sent to receiver socket`);
      }
    }
  });

  socket.on("disconnect", async () => {
    console.log(`Client disconnected: ${socket.id} userId: ${currentUserId}`);
    if (currentUserId) {
      if (onlineUsers.get(currentUserId) === socket.id) {
        onlineUsers.delete(currentUserId);
        console.log(`User ${currentUserId} removed from onlineUsers`);
      }
      const lastSeen = new Date().toISOString();
      await updateUserLastSeen(currentUserId, lastSeen);
      io.emit("user_status", { userId: currentUserId, status: 'offline', lastSeen });
    }
  });
});


app.get("/", (req, res) => res.send("API working"));

export { httpServer };
export default app;
