import validator from "validator"
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken'
import doctorModel from "../models/doctor_model.js";


export const addDoctor = async (req, res) => {
   console.log('Received file:', req.file);


    
  try {
    const {
      name,
      email,
      password,
      speciality,
      degree,
      experience,
      about,
      fee,
      address
    } = req.body;

    const imageFile = req.file;

    console.log("Request Body:", req.body);
    console.log("Request File:", imageFile);

    if (
      !name ||
      !email ||
      !password ||
      !speciality ||
      !degree ||
      !experience ||
      !about ||
      !fee ||
      !address
    ) {
      return res.json({ success: false, message: "missing details" });
    }

    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "please enter a valid email" });
    }

    if (password.length < 8) {
      return res.json({ success: false, message: "please enter a strong password" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const parsedAddress = typeof address === "string" ? JSON.parse(address) : address;

    const newDoctor = new doctorModel({
      name,
      email,
      password: hashedPassword,
      image: imageFile.path,
      speciality,
      degree,
      experience,
      about,
      fee: Number(fee),
      address: parsedAddress,
      date: new Date().toISOString().split('T')[0],
    });

    await newDoctor.save();

    res.json({ success: true, message: "Doctor added", doctor: newDoctor });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

//Api for admin login
export const loginAdmin=async(req,res)=>{
    try {
        const{email,password}=req.body
        if(email === process.env.ADMIN_EMAIL && password===process.env.ADMIN_PASSWORD){
            const token=jwt.sign(email+password,process.env.SECRET)
            res.json({success:true,token})
        }else{
            res.json({success:false,message:"Invalid credeitials for admin"})
        }
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
        
    }
}

