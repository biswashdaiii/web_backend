import express from "express";
import { authDoctor } from "../middleware/authDoctor.js";
import {
  getUsersForSidebarForDoctor,
  getMessages,
  sendMessage,
} from "../controllers/doctor.message.controller.js";

const doctorMessageRouter = express.Router();

// Route to get the list of users (patients) for the doctor's sidebar
doctorMessageRouter.get("/users", authDoctor, getUsersForSidebarForDoctor);

// Route to get messages with a specific user by ID
doctorMessageRouter.get("/:id", authDoctor, getMessages);

// Route to send a message to a specific user by ID
doctorMessageRouter.post("/send/:id", authDoctor, sendMessage);

export default doctorMessageRouter;
