import express from"express"
import { doctorList } from "../controllers/doctor_controller.js"

 export const doctorRouter=express.Router()
doctorRouter.get("/list",doctorList)