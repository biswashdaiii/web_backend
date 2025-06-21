import express from "express";
import mongoose, { connect } from "mongoose";
import cors from "cors";
import authRoutes from "./routes/userRoutes.js";
import { registerUser, loginUser, getUsers } from "./controllers/userController.js";
import adminRouter from "./routes/adminRoute.js";
import 'dotenv/config'
import { connectDB } from "./config/mongodb.js";

//app config
connectDB()
const app = express();
const PORT = process.env.PORT || 5000;

//middlewares
app.use(express.json());
app.use(cors());


//api endpoint

app.use('/api/admin',adminRouter)
//local host  /api.admin/add-doctor
app.get('/',(req,res)=>{
  res.send("Api working")
}

)

app.use("/api/auth", authRoutes);


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));