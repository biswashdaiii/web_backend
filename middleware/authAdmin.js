import jwt from 'jsonwebtoken';

export const authAdmin = async (req, res, next) => {
  try {
    const atoken = req.headers['atoken'];
    if (!atoken) {
      return res.json({ success: false, message: "not authorized login again" });
    }
    const token_decode = jwt.verify(atoken, process.env.SECRET);
    if (token_decode !== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
      return res.json({ success: false, message: "not authorized login again" });
    }
    next(); 
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};
