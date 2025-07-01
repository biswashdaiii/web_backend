import mongoose from "mongoose";

const appointmentSchema=new mongoose.Schema({
    userId:{type:String,required:true},
    docId:{type:String,required:true},
    slotDate:{type:String,required:true},
    slotTime:{type:String,required:true},
    docData:{type:Object,required:true},
    userData:{type:Object,required:true},
    amount:{type:String,required:true},
    date:{type:String,required:true},
    cancelled:{type:String,required:true},
    payment:{type:String,required:true},
})

 export const appointmentModel=mongoose.models.appointment || mongoose.model("appointment",appointmentSchema)
