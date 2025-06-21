 import mongoose from "mongoose";
 const USerSchema = new mongoose.Schema(
     {
         
         name: { type: String,required: true},
         email: { type: String,required: true,unique:true},
         password: { type: String,required: true},
         address: { type: Object,default:{line1:'',line2:''}},
         gender:{type:String,default:"Not Selected"},
         dob:{type:String,default:"Not selected"},
         phone:{type:String,default:"0000000000"}
         
             
             
        
     },
     
     {
         timestamps: true,
     }
 )
const usermodel = mongoose.models.user || mongoose.model('user', USerSchema)

 export default usermodel