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
  getUndeliveredMessages,
  updateUserLastSeen,
  createMessage
} from "./Service/chatService.js";

import User from "./models/User.js";
import Message from "./models/message.js"; // Fixed incorrect import

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
  console.log("New client connected", socket.id);
  let currentUserId = null;

  socket.on('register_user', ({ userId }) => {
    if (!userId) return;
    currentUserId = userId;
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} connected with socket: ${socket.id}`);
  });

  socket.on('join_room', async ({ userId, partnerId }) => {
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
    const { messageId, sender, receiver, message: text } = message;
    if (!messageId || !sender || !receiver || !text) return;

    const roomId = getRoomId(sender, receiver);
    await createMessage({ ...message, status: 'sent', roomId });

    if (onlineUsers.has(receiver)) {
      message.status = 'delivered';
      await updateMessageStatus(messageId, 'delivered');
    } else {
      message.status = 'sent';
    }

    io.to(roomId).emit("message", message);

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
      }
    }
  });

  const typingTimeouts = new Map();

  socket.on("typing_start", ({ userId, receiverId }) => {
    if (!userId || !receiverId) return;
    const roomId = getRoomId(userId, receiverId);
    const key = `${userId}-${receiverId}`;

    if (typingTimeouts.has(key)) {
      clearTimeout(typingTimeouts.get(key));
    }

    io.to(roomId).emit("typing_indicator", { userId, isTyping: true });

    const timeoutId = setTimeout(() => {
      io.to(roomId).emit("typing_indicator", { userId, isTyping: false });
      typingTimeouts.delete(key);
    }, 5000);

    typingTimeouts.set(key, timeoutId);
  });

  socket.on("typing_end", ({ userId, receiverId }) => {
    if (!userId || !receiverId) return;
    const roomId = getRoomId(userId, receiverId);
    const key = `${userId}-${receiverId}`;

    if (typingTimeouts.has(key)) {
      clearTimeout(typingTimeouts.get(key));
      typingTimeouts.delete(key);
    }

    io.to(roomId).emit("typing_indicator", { userId, isTyping: false });
  });

  socket.on("message_delivered", async ({ messageId, senderId, receiverId }) => {
    await updateMessageStatus(messageId, 'delivered');
    const roomId = getRoomId(senderId, receiverId);
    io.to(roomId).emit("message_status", { messageId, status: 'delivered', sender: senderId, receiver: receiverId });
  });

  socket.on("messages_read", async ({ messageIds, senderId, receiverId }) => {
    for (const messageId of messageIds) {
      await updateMessageStatus(messageId, 'read');
    }
    const roomId = getRoomId(senderId, receiverId);
    messageIds.forEach(messageId => {
      io.to(roomId).emit("message_status", { messageId, status: 'read', sender: senderId, receiver: receiverId });
    });
  });

  socket.on("mark_messages_read", async ({ userId, partnerId }) => {
    const count = await markMessageAsRead(userId, partnerId);
    const roomId = getRoomId(userId, partnerId);

    if (count > 0) {
      io.to(roomId).emit("messages_all_read", {
        reader: userId,
        sender: partnerId
      });

      const senderSocket = io.sockets.sockets.get(onlineUsers.get(partnerId));
      if (senderSocket && !senderSocket.rooms.has(roomId)) {
        senderSocket.emit("messages_all_read", {
          reader: userId,
          sender: partnerId
        });
      }
    }
  });

  socket.on("user_status_change", async ({ userId, status, lastSeen }) => {
    if (status === "offline") {
      await updateUserLastSeen(userId, lastSeen);
      if (onlineUsers.get(userId) === socket.id) {
        onlineUsers.delete(userId);
      }
      io.emit("user_status", { userId, status: 'offline', lastSeen });
    } else {
      onlineUsers.set(userId, socket.id);
      io.emit("user_status", { userId, status: 'online' });
    }
  });

  socket.on("disconnect", async () => {
    if (currentUserId) {
      if (onlineUsers.get(currentUserId) === socket.id) {
        onlineUsers.delete(currentUserId);
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
