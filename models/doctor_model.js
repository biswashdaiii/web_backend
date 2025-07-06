import mongoose from "mongoose"

const DoctorSchema = new mongoose.Schema(
    {
        
        name: { type: String,required: true},
        email: { type: String,required: true,unique:true},
        password: { type: String,required: true},
        image: { type: String,required: true},
        speciality: { type: String,required: true},
        degree: { type: String,required: true},
        experience: { type: String,required: true},
        available: { type: Boolean,default: true},
        fee: { type: Number,required: true},
        about: { type: String,required: true},
        date: { type: String,required: true},
        address: { type: Object,required: true},
        slots_booked:{type:Object,default:{}}
            
            
       
    },

    {
        timestamps: true,
        minimize:false,//to store empty  object in any data
    }
)
const doctorModel =mongoose.Model.doctor || mongoose.model('doctor',DoctorSchema)
export default doctorModel