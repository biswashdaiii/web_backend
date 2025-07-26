// CREATE THIS FILE: backend/models/message.model.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: function() {
        return !this.image; // Text required if no image
      }
    },
    image: {
      type: String,
      required: function() {
        return !this.text; // Image required if no text
      }
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'file'],
      default: 'text'
    }
  },
  { timestamps: true }
);

// Indexes for better performance
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, isRead: 1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;