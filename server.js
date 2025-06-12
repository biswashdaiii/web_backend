import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import authRoutes from "./routes/userRoutes.js";
import { registerUser, loginUser, getUsers } from "./controllers/userController.js";

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect("mongodb://localhost:27017/gharko_doctordb", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));