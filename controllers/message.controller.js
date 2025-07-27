import { appointmentModel } from "../models/appointmentModel.js";
import usermModel from "../models/userModel.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId,io } from "../socket/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // 1. Find all appointments made by the user
    const appointments = await appointmentModel.find({ userId: loggedInUserId });

    // 2. Extract unique doctor ObjectIds
    const doctorIdSet = new Set(appointments.map(appt => appt.docId.toString()));
    const doctorIds = Array.from(doctorIdSet);

    // 3. Fetch doctor users by IDs, exclude password
    const doctors = await userModel.find({ _id: { $in: doctorIds } }).select("-password");

    res.status(200).json(doctors);
  } catch (error) {
    console.error("Error in getUsersForSidebar:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const userToChatId = req.params.id.toString();
    const myId = req.user._id.toString();

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 }).lean();

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const receiverId = req.params.id.toString();
    const senderId = req.user._id.toString();

    if (!text && !image) {
      return res.status(400).json({ error: "Message must contain text or image." });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image, // store base64 directly
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
