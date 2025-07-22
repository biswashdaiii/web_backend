import jwt from "jsonwebtoken";
import 'dotenv/config';

const JWT_SECRET = process.env.SECRET?.trim();

export const authUser = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader)
      return res.status(401).json({ success: false, message: "No token" });

    const token = authHeader.split(' ')[1];
    if (!token)
      return res.status(401).json({ success: false, message: "Invalid token format" });

   
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user id to req.userId or req.user instead of req.body
    req.userId = decoded.id;

    next();
  } catch (error) {
    console.error("JWT error:", error);
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};
