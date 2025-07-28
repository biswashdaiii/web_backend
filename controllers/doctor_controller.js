
import doctorModel from "../models/doctor_model.js"; // ✅ CORRECT
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { appointmentModel } from "../models/appointmentModel.js";
import userModel from "../models/userModel.js";


export const changeAvailability=async(req,res)=>{
  try {
    const {docId}=req.body
    const docData=await doctorModel.findById(docId)
    await doctorModel.findByIdAndUpdate(docId,{available:!docData.available})
    res.json({success:true,message:"avaiablity changed"})
  } catch (error) {
    console.log(error)
    res.json({success:false,message:error.message})
    
  }   
}
export const getDoctorProfile = async (req, res) => {
  try {
    const doctorId = req.docId;
    const doctor = await doctorModel.findById(doctorId).select("-password");
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }
    res.status(200).json({ doctor });
  } catch (error) {
    console.error("Error in getDoctorProfile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const doctorList=async(req,res)=>{
  try {
    
    const doctors=await doctorModel.find({}).select(["-password,-email"])
    res.json({success:true,doctors})


  } catch (error) {
    
    console.log(error)
    res.json({success:false,message:error.message})
    
  }
  
}


export const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;

    // console.log("Login request:", req.body);

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const doctor = await doctorModel.findOne({ email: email.toLowerCase() });

    if (!doctor) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, doctor.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const secret = process.env.SECRET || "defaultSecret";
    
    console.log("Signing JWT with secret:", JSON.stringify(secret));
    const token = jwt.sign({ id: doctor._id }, secret, { expiresIn: "1d" });

    res.json({ success: true, token });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const appointmentsDoctor = async (req, res) => {
  try {
    const docId = req.docId; // <-- Use req.docId as set by middleware
    console.log("Doctor ID:", docId);
    
    const appointments = await appointmentModel.find({ docId, cancelled: false });
    console.log("Appointments found:", appointments.length);

    res.json({ success: true, appointments });
  } catch (error) {
    console.error("Error fetching doctor appointments:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
export const cancelAppointmentDoctor = async (req, res) => {
  try {
    const docId = req.docId; // doctor ID from auth middleware
    const { appointmentId } = req.body;

    // Find appointment by ID
    const appointmentData = await appointmentModel.findById(appointmentId);
    if (!appointmentData) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    // Verify appointment belongs to this doctor
    if (appointmentData.docId.toString() !== docId.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to cancel this appointment" });
    }

    // Delete appointment
    await appointmentModel.findByIdAndDelete(appointmentId);

    // Update doctor's booked slots to free the cancelled slot
    const { slotDate, slotTime } = appointmentData;
    const doctorData = await doctorModel.findById(docId);
    let slots_booked = doctorData.slots_booked || {};

    if (Array.isArray(slots_booked[slotDate])) {
      slots_booked[slotDate] = slots_booked[slotDate].filter(slot => slot !== slotTime);
    }

    await doctorModel.findByIdAndUpdate(docId, { slots_booked }, { new: true });

    res.json({ success: true, message: "Appointment cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling appointment (doctor):", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
