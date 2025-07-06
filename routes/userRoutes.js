import express from "express";
import { registerUser, loginUser,bookAppointment ,getUsers} from "../controllers/userController.js"; 

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/all", getUsers);
userRouter.post("/book-appointment", bookAppointment);


export default userRouter;
