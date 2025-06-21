import fs from 'fs';
import multer from 'multer';

const uploadPath = 'uploads';

// Automatically create the folder if it doesn't exist
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });
export default upload;
