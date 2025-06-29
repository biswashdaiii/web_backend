import express from"express"
import { doctorList ,loginDoctor} from "../controllers/doctor_controller.js"

 export const doctorRouter=express.Router()
doctorRouter.get("/list",doctorList)
doctorRouter.post("/login",loginDoctor)
//doctor login
//email:doctorr@gmail.com
//password:doctor@1
