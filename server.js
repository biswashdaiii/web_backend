import express from "express";
import mongoose, { connect } from "mongoose";
import cors from "cors";
import authRoutes from "./routes/userRoutes.js";
import { registerUser, loginUser, getUsers } from "./controllers/userController.js";
import adminRouter from "./routes/adminRoute.js";

//app config

const app = express();
const PORT = process.env.PORT || 5000;

//middlewares
app.use(cors());
app.use(express.json());

mongoose
  .connect("mongodb://localhost:27017/gharko_doctordb", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

//api endpoints
app.use('/api/admin',adminRouter)


app.use("/api/auth", authRoutes);


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));