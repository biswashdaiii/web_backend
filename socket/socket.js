import {
  handleSendMessage,
  handleTyping,
  handleMarkAsRead,
  handleUserDisconnection,
  getOnlineUsers
} from "./handlers.js"; // If you split those helpers

export const setupSocket = (io) => {
  global.io = io;
  global.onlineUsers = new Map();

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    
    if (userId) {
      global.onlineUsers.set(userId, socket.id);
      socket.broadcast.emit("user_status", { userId, status: "online" });
      io.emit("getOnlineUsers", getOnlineUsers());
    }

    // Message sending
    socket.on("sendMessage", (messageData) => handleSendMessage(socket, messageData));

    // Typing event
    socket.on("typing", (data) => handleTyping(socket, data));

    // Mark as read
    socket.on("markAsRead", (data) => handleMarkAsRead(socket, data));

    // Disconnect
    socket.on("disconnect", () => {
      handleUserDisconnection(socket, userId);
    });
  });
};
