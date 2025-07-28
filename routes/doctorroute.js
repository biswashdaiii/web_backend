import express from"express"
import { doctorList ,loginDoctor,appointmentsDoctor,getDoctorProfile} from "../controllers/doctor_controller.js"
import { authDoctor } from "../middleware/authDoctor.js"
import { cancelAppointmentDoctor } from "../controllers/doctor_controller.js"

 export const doctorRouter=express.Router()
doctorRouter.get("/list",doctorList)
doctorRouter.post("/login",loginDoctor)
//doctor login
//email:doctorr@gmail.com
//password:doctor@1
doctorRouter.get("/test", (req, res) => res.json({ message: "Doctor route works" }));


doctorRouter.get("/appointments",authDoctor,appointmentsDoctor)
doctorRouter.post("/cancel-appointment", authDoctor, cancelAppointmentDoctor);
doctorRouter.get("/me", authDoctor, getDoctorProfile);

