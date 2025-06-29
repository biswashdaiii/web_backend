
import doctorModel from "../models/doctor_model.js"; // ✅ CORRECT
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

export const changeAvailability=async(req,res)=>{
  try {
    const {docId}=req.body
    const docData=await doctorModel.findById(docId)
    await doctorModel.findByIdAndUpdate(docId,{avaiable:!docData.avaiable})
    res.json({success:true,message:"avaiablity changed"})
  } catch (error) {
    console.log(error)
    res.json({success:false,message:error.message})
    
  }   
}

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

    console.log("Login request:", req.body);

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

    const secret = process.env.mysupersercret || "defaultSecret";
    const token = jwt.sign({ id: doctor._id }, secret, { expiresIn: "1d" });

    res.json({ success: true, token });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

//Api to get docotr appointment for docotr pannel
const appointmentsDoctor=async(req,res)=>{
  try {
    
  } catch (error) {
     console.error("Login error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
  
}