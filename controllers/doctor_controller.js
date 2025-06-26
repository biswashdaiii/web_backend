
import doctorModel from "../models/doctor_model.js"; // ✅ CORRECT

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