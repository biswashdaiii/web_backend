import jwt from 'jsonwebtoken';

export const authDoctor = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("No authorization header or malformed");
      return res.status(401).json({ success: false, message: "Not authorized, login again" });
    }

    const token = authHeader.split(" ")[1];
    console.log("Received token for verification:", token);

    // Use the correct env variable name here:
    const secret = process.env.SECRET || "defaultSecret";
    console.log("JWT secret being used for verification:", secret);

    const token_decode = jwt.verify(token, secret);
    console.log("Decoded token payload:", token_decode);

    const doctorId = token_decode.id || token_decode._id;
    if (!doctorId) {
      console.log("Doctor ID missing from token payload");
      return res.status(401).json({ success: false, message: "Not authorized, login again" });
    }

    req.docId = doctorId;
    console.log("Doctor ID set on request:", req.docId);

    next();
  } catch (error) {
    console.log("JWT verification error:", error);
    return res.status(401).json({ success: false, message: error.message });
  }
};
