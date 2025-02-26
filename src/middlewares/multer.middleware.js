import multer from "multer";
import path from "path";
import fs from "fs";

// Define temp directory for local storage
const tempDir = path.join(process.cwd(), "public/temp");

// Ensure temp directory exists (for localhost)
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
  
export const upload = multer({ 
    storage
})