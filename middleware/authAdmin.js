import jwt from 'jsonwebtoken';

export const authAdmin = async (req, res, next) => {
  try {
    const atoken = req.headers['atoken'];
    if (!atoken) {
      return res.json({ success: false, message: "not authorized login again" });
    }
    const decoded = jwt.verify(atoken, process.env.SECRET);

    // decoded is an object like { email: "biswash@gmail.com", iat: ..., exp: ... }
    if (decoded.email !== process.env.ADMIN_EMAIL) {
      return res.json({ success: false, message: "not authorized login again" });
    }

    next();
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};
