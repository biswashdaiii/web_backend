import jwt from 'jsonwebtoken';

export const authDoctor = async (req, res, next) => {
  try {
    const dToken = req.headers['dToken'];
    if (!dToken) {
      return res.json({ success: false, message: "not authorized login again" });
    }
    const token_decode = jwt.verify(dToken, process.env.SECRET);
    if (token_decode !== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
      return res.json({ success: false, message: "not authorized login again" });
    }
    next(); 
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};
