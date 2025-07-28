import app from "./index.js";  // Your main Express app
import http from "http";
import dotenv from "dotenv";
import { initSocket } from "./socket/socket.js";

dotenv.config();

const PORT = process.env.PORT || 5050;

const server = http.createServer(app);

// Initialize socket.io with the same HTTP server
initSocket(server);

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
