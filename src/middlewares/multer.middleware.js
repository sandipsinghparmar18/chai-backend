import multer from "multer";
import path from "path";
import fs from "fs";

const isProduction = process.env.NODE_ENV === "production";
const tempDir = path.join(process.cwd(), "public/temp");

// Ensure `public/temp` exists in development
if (!isProduction && !fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, isProduction ? "/tmp" : tempDir); // Use `/tmp` in production (ephemeral storage)
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
  
export const upload = multer({ 
    storage
})