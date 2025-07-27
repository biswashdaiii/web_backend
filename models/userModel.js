import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema({
  line1: { type: String, default: "" },
  line2: { type: String, default: "" },
}, { _id: false });

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    address: { type: AddressSchema, default: () => ({}) },
    gender: { type: String, default: "Not Selected" },
    dob: { type: String, default: "Not selected" },
    phone: { type: String, default: "0000000000" },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

const userModel = mongoose.models.User || mongoose.model("User", UserSchema);

export default userModel;
