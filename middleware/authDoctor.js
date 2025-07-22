import jwt from "jsonwebtoken";

export const authDoctor = async (req, res, next) => {
  try {
    const dToken = req.headers["dToken"];
    if (!dToken) {
      return res.status(401).json({ success: false, message: "Not authorized, login again" });
    }

    // Use same secret as login
    const secret = process.env.mysupersercret || "defaultSecret";

    // Verify and decode token
    const token_decode = jwt.verify(dToken, secret);

    if (!token_decode || !token_decode.id) {
      return res.status(401).json({ success: false, message: "Not authorized, login again" });
    }

    // Attach doctor id to req.body for downstream controllers
    req.body.docId = token_decode.id;

    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({ success: false, message: error.message });
  }
};
