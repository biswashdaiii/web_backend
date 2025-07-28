import { appointmentModel } from "../models/appointmentModel.js";
import userModel from "../models/userModel.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

export const getUsersForSidebarForDoctor = async (req, res) => {
  try {
    const loggedInDoctorId = req.user._id;

    const appointments = await appointmentModel.find({ docId: loggedInDoctorId });
    const userIdSet = new Set(appointments.map((appt) => appt.userId.toString()));
    const userIds = Array.from(userIdSet);

    const users = await userModel.find({ _id: { $in: userIds } }).select("-password");

    res.status(200).json(users);
  } catch (error) {
    console.error("Error in getUsersForSidebarForDoctor:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    console.log("req.docId:", req.docId); // debug
    const userToChatId = req.params.id?.toString();
    const myId = req.docId?.toString();

    if (!myId) {
      return res.status(401).json({ error: "Doctor ID missing" });
    }
    if (!userToChatId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    })
      .sort({ createdAt: 1 })
      .lean();

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const receiverId = req.params.id?.toString();
    const senderId = req.docId?.toString();

    if (!senderId) {
      return res.status(401).json({ error: "Doctor ID missing" });
    }
    if (!text && !image) {
      return res.status(400).json({ error: "Message must contain text or image." });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

