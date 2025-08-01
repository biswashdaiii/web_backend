import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctor_model.js";
import { appointmentModel } from "../models/appointmentModel.js";


// console.log("JWT Secret:", JWT_SECRET);
const registerUser = async (req, res) => {
  const JWT_SECRET = process.env.SECRET?.trim();
  if (!JWT_SECRET) {
    return res.status(500).json({ message: "JWT secret not configured" });
  }

  const { name, email, password, gender, dob, phone, address } = req.body;

  try {
    const existingUser = await userModel.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      name,
      email,
      password: hashedPassword,
      gender,
      dob,
      phone,
      address,
    });

    console.log("Signing JWT with secret:", JWT_SECRET);
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "24h" });
    console.log("Generated token:", token);

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const loginUser = async (req, res) => {
  const JWT_SECRET = process.env.SECRET?.trim();
  if (!JWT_SECRET) {
    return res.status(500).json({ message: "JWT secret not configured" });
  }

  const { email, password } = req.body;

  try {
    const user = await userModel.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    console.log("Signing JWT with secret:", JWT_SECRET);
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "24h" });
    console.log("Generated token:", token);

    res.status(200).json({
      token,
      user: { id: user._id, name: user.name },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


const getUsers = async (req, res) => {
  try {
    const users = await userModel.find({}, "-password");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
const bookAppointment = async (req, res) => {
  console.log("▶️ bookAppointment controller called");
  console.log("🔸 Request body:", req.body);
  console.log("🔸 Authenticated user (req.user):", req.user);

  try {
    const userId = req.user._id;
    const { docId, slotDate, slotTime } = req.body;
      console.log("✅ Extracted fields:", { docId, slotDate, slotTime, userId });
    console.log("Request body:", req.body);


    if (!userId || !docId || !slotDate || !slotTime) {
        console.log("❌ Missing one or more required fields");
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const userData = await userModel.findById(userId).select("-password -someOtherSensitiveFields");
    if (!userData) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const docData = await doctorModel.findById(docId).select("-password");
    if (!docData) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    if (!docData.available) {
      return res.status(400).json({ success: false, message: "Doctor not available" });
    }

    let slots_booked = docData.slots_booked || {};
    if (!slots_booked[slotDate]) {
      slots_booked[slotDate] = [];
    }
    if (slots_booked[slotDate].includes(slotTime)) {
      return res.status(409).json({ success: false, message: "Slot already booked" });
    }

    slots_booked[slotDate].push(slotTime);

    const appointmentData = {
      userId: userId.toString(),
      docId: docId.toString(),
      docData: docData.toObject(),
      userData: userData.toObject(),
      amount: docData.fee,
      slotDate,
      slotTime,
      date: new Date(),
      cancelled: false,
      isCompleted: false,
      payment: docData.fee,
    };
    

    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();

    await doctorModel.findByIdAndUpdate(docId, { slots_booked }, { new: true });

    return res.status(201).json({ success: true, message: "Appointment booked successfully", appointment: newAppointment });
  } catch (error) {
    console.error("❌ Booking error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};



const getProfile = async (req, res) => {
  try {
    const userId = req.user._id;  // fixed here
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized: No user ID" });
    }

    const userData = await userModel.findById(userId).select("-password");
    if (!userData) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json(userData);  // just send the user object directly
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};


const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id; // from auth middleware
    const { name, email, phone, address } = req.body;
    const imageFile = req.file;

    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, message: "Data missing" });
    }

    const updatedFields = {
      name,
      email,
      phone,
      address, // now string
    };

    if (imageFile) {
      updatedFields.profileImage = `uploads/${imageFile.filename}`;
    }

    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      updatedFields,
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

//Api to get user appointment for user pannel my-appointments page
const listAppointments = async (req, res) => {
  try {
    const userId = req.user._id;

    const appointments = await appointmentModel.find({userId})
    res.json({ success: true, appointments });
  } catch (error) { 
    console.error("Error fetching appointments:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

//Api to cancel appointment
const cancelAppointment = async (req, res) => {
  try {
    console.log("Cancel appointment called");
    const userId = req.user?._id;
    const { appointmentId } = req.body;
    console.log("UserId:", userId);
    console.log("AppointmentId:", appointmentId);

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized: no user id found" });
    }
    if (!appointmentId) {
      return res.status(400).json({ success: false, message: "No appointmentId provided" });
    }

    const appointmentData = await appointmentModel.findById(appointmentId);
    if (!appointmentData) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    if (!appointmentData.userId || appointmentData.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to cancel this appointment" });
    }

    await appointmentModel.findByIdAndDelete(appointmentId);

    const { docId, slotDate, slotTime } = appointmentData;
    const doctorData = await doctorModel.findById(docId);
    let slots_booked = doctorData?.slots_booked || {};

    if (Array.isArray(slots_booked[slotDate])) {
      slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime);
    }

    await doctorModel.findByIdAndUpdate(docId, { slots_booked }, { new: true });

    return res.json({ success: true, message: "Appointment cancelled successfully" });

  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};



export {
  registerUser,
  loginUser,
  getUsers,
  bookAppointment,
  getProfile,
  updateUserProfile,
  listAppointments,cancelAppointment
};
