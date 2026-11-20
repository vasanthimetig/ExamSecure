// backend/controllers/uploadController.js
import QuestionPaper from "../models/QuestionPaper.js";
import path from "path";

export const uploadPaper = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded!" });
    }

    // ✅ FIX: Remove leading slash. Store as "uploads/filename.pdf"
    const filePath = `uploads/${req.file.filename}`;

    const { title, stream, durationMins, department } = req.body;

    const newPaper = new QuestionPaper({
      title: title || req.file.originalname,
      stream,
      department: department || req.user.department,
      durationMins: durationMins || 60,
      uploadedBy: req.user._id,
      filePath,
      originalName: req.file.originalname,
      status: "pending",
    });

    await newPaper.save();

    res.json({
      message: "File uploaded successfully!",
      filePath,
      paper: newPaper
    });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ message: "Server error during file upload" });
  }
};