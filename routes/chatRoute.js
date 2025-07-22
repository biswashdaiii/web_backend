import express from 'express';
import { getChatRoom,getMessages } from '../controllers/chat_controller';

import { auth } from '../middleware/auth.js';

const router=express.Router();

router.get('/messages', auth, getMessages);
router.get('/chat-rooms', auth, getChatRoom);

export default router;