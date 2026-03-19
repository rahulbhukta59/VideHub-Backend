import multer from "multer";
import fs from "fs";
import path from "path";

// Create Uploads folder path
const uploadDir = path.join(process.cwd(), "Uploads");

// Create folder if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // save files inside Uploads folder
  },

  filename: function (req, file, cb) {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 500 // 500MB
  }
});
