import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctor_model.js";
import { appointmentModel } from "../models/appointmentModel.js";

const JWT_SECRET = "your_secret_key";

const registerUser = async (req, res) => {
  const { name, email, password, gender, dob, phone, address } = req.body;

  try {
    const existingUser = await userModel.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = await userModel.create({
      name,
      email,
      password: hashedPassword,
     
    });
    const newUSer=new userModel(userData)
    const user=await newUSer.save()

    const token = jwt.sign({ id: userData._id }, JWT_SECRET, { expiresIn: "1h" });

    res.status(201).json({ token, user: { id: userData._id, name: userData.name } });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await userModel.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({ token, user: { id: user._id, name: user.name } });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
 const getUsers = async (req, res) => {
  try {
    const users = await userModel.find({}, '-password'); // exclude password from results
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};





//Api to book appointment
const bookAppointment = async (req, res) => {
  try {
    const { userId, docId, slotDate, slotTime } = req.body;

    console.log("📥 Request body:", req.body);

    if (!userId || !docId || !slotDate || !slotTime) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const docData = await doctorModel.findById(docId).select("-password");
    if (!docData) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    console.log("✅ Doctor found:", docData.name);

    if (!docData.available) {
      return res.json({ success: false, message: "Doctor not available" });
    }

    const userData = await userModel.findById(userId).select("-password");
    if (!userData) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    console.log("✅ User found:", userData.name);

    // Slot handling
    let slots_booked = docData.slots_booked || {};
    if (!slots_booked[slotDate]) {
      slots_booked[slotDate] = [];
    }
    if (slots_booked[slotDate].includes(slotTime)) {
      return res.json({ success: false, message: "Slot already booked" });
    }
    slots_booked[slotDate].push(slotTime);

    // Create appointment data
    const appointmentData = {
      userId: userId.toString(),
      docId: docId.toString(),
      userData: userData.toObject(),
      docData: docData.toObject(),
      amount: docData.fee.toString(),
      slotDate,
      slotTime,
      date: new Date().toISOString(), // <-- FIXED: previously `data` with a typo
      cancelled: false,
      isCompleter: false,
      payment: docData.fee.toString(), // if you're keeping payment
    };

    console.log("📝 Appointment to save:", appointmentData);

    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();

    // Save slots
    await doctorModel.findByIdAndUpdate(docId,{$set:{ slots_booked }} );

    res.json({ success: true, message: "Appointment booked successfully" });

  } catch (error) {
    console.error("❌ Booking error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};




export { registerUser, loginUser ,getUsers ,bookAppointment};
