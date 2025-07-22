import app, { httpServer } from "./index.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
