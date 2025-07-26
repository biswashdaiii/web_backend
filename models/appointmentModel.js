import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  docId: { type: mongoose.Schema.Types.ObjectId, required: true },
  slotDate: { type: String, required: true },
  slotTime: { type: String, required: true },
  docData: { type: Object, required: true },
  userData: { type: Object, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  cancelled: { type: Boolean, default: false },
  payment: { type: Number },  // optional, or remove if unused
  isCompleted: { type: Boolean, default: false },
});


 export const appointmentModel=mongoose.models.appointment || mongoose.model("appointment",appointmentSchema)
