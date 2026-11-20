import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { uploadPaper } from "../controllers/uploadController.js";
import authMiddleware from "../middleware/authMiddleware.js"; // ✅ fixed import

const router = express.Router();

// ✅ ES module path fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Storage engine for multer
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// ✅ File type check
function checkFileType(file, cb) {
  const filetypes = /pdf|doc|docx|jpg|jpeg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, DOC, and image files allowed!"));
  }
}

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => checkFileType(file, cb),
});

// ✅ Route for uploading paper (with auth)
router.post("/", authMiddleware, upload.single("file"), uploadPaper);

export default router;
