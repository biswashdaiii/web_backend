import express from "express";
import { registerUser, loginUser,bookAppointment ,cancelAppointment,getUsers, getProfile,updateUserProfile,listAppointments} from "../controllers/userController.js"; 
import { authUser } from "../middleware/authUser.js";
import upload from "../middleware/multer.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/all", getUsers);
userRouter.post("/book-appointment", bookAppointment);
userRouter.get('/get-profile',authUser,getProfile)
// userRouter.post('/update-profile',upload.single('image'),authUser,updateUserProfile);
userRouter.put('/update-profile', upload.single('image'), authUser, updateUserProfile);
userRouter.get('/my-appointments', authUser, listAppointments);
userRouter.post('/cancel-appointment', authUser, cancelAppointment);

export default userRouter;
