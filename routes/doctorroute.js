import express from"express"
import { doctorList ,loginDoctor,appointmentsDoctor} from "../controllers/doctor_controller.js"
import { authDoctor } from "../middleware/authDoctor.js"

 export const doctorRouter=express.Router()
doctorRouter.get("/list",doctorList)
doctorRouter.post("/login",loginDoctor)
//doctor login
//email:doctorr@gmail.com
//password:doctor@1

doctorRouter.get("/appointments",authDoctor,appointmentsDoctor)
