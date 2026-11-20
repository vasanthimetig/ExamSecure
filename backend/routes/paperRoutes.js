import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authorizeRoles } from "../middleware/authMiddleware.js";
import QuestionPaper from "../models/QuestionPaper.js";

const router = express.Router();

// === File upload setup ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// === Lecturer: Upload Question Paper ===
router.post(
  "/upload",
  authorizeRoles("lecturer"),
  upload.single("file"),
  async (req, res) => {
    try {
      const { title, stream, durationMins } = req.body;

      const paper = new QuestionPaper({
        title,
        stream,
        durationMins,
        filePath: req.file.path,
        status: "pending",
      });

      await paper.save();
      res.status(201).json({ message: "Uploaded successfully", paper });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error uploading paper" });
    }
  }
);

// === HOD: Approve Paper ===
router.post("/:id/approve", authorizeRoles("hod"), async (req, res) => {
  try {
    const paper = await QuestionPaper.findById(req.params.id);
    if (!paper) return res.status(404).json({ message: "Paper not found" });
    paper.status = "approved";
    await paper.save();
    res.json({ message: "Paper approved", paper });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error approving paper" });
  }
});

// === HOD: List all papers ===
router.get("/all", authorizeRoles("hod"), async (req, res) => {
  try {
    const papers = await QuestionPaper.find();
    res.json({ papers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching papers" });
  }
});

// === Student: Get approved papers by stream (case-insensitive) ===
router.get("/stream/:stream", authorizeRoles("student"), async (req, res) => {
  try {
    const stream = req.params.stream.toLowerCase();

    const papers = await QuestionPaper.find({
      status: "approved",
      stream: { $regex: new RegExp(`^${stream}$`, "i") },
    });

    res.json({ papers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching papers" });
  }
});

export default router;
