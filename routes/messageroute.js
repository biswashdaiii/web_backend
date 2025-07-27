import express from 'express';
import { authUser } from '../middleware/authUser.js';
import { getUsersForSidebar, getMessages, sendMessage } from '../controllers/message.controller.js';

const router = express.Router();

router.get("/users", authUser, getUsersForSidebar);
router.get("/:id", authUser, getMessages);
router.post("/send/:id", authUser, sendMessage);



export default router;
