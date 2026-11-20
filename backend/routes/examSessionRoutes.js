// routes/examSessionRoutes.js
import express from "express";
import ExamSession from "../models/ExamSession.js";
import QuestionPaper from "../models/QuestionPaper.js";
import authMiddleware, {
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// 🎯 Start an Exam (Student)
router.post(
  "/start/:paperId",
  authMiddleware,
  authorizeRoles("student"),
  async (req, res) => {
    try {
      const paper = await QuestionPaper.findById(req.params.paperId);
      if (!paper || paper.status !== "approved") {
        return res
          .status(400)
          .json({ message: "Paper not found or not approved yet" });
      }

      const startTime = new Date();
      const duration = paper.durationMins || 30;
      const endTime = new Date(startTime.getTime() + duration * 60000);

      const exam = await ExamSession.create({
        student: req.user._id,
        questionPaper: paper._id,
        startTime,
        endTime,
        status: "active",
      });

      res.json({
        message: "Exam started successfully",
        exam: {
          id: exam._id,
          startTime,
          endTime,
          status: exam.status,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error starting exam" });
    }
  }
);

// 📄 Fetch active exam
router.get(
  "/active",
  authMiddleware,
  authorizeRoles("student"),
  async (req, res) => {
    try {
      const session = await ExamSession.findOne({
        student: req.user._id,
        status: "active",
      }).populate("questionPaper");

      if (!session) return res.json({ message: "No active exam found" });
      res.json({ session });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error fetching active exam" });
    }
  }
);

// 🕒 Auto-expire old sessions
router.post("/expire", authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const expired = await ExamSession.updateMany(
      { endTime: { $lt: now }, status: "active" },
      { $set: { status: "expired" } }
    );

    res.json({
      message: "Expired sessions updated",
      expiredCount: expired.modifiedCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error expiring sessions" });
  }
});

export default router;
