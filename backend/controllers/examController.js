import QuestionPaper from "../models/QuestionPaper.js";
import StudentSession from "../models/StudentSession.js";
import path from "path";
import fs from "fs";

/**
 * 🛠️ THE PATH FIX: Standardizing path resolution for local storage.
 */
const getAbsolutePath = (storedPath) => {
  const __dirname = path.resolve();
  const cleanPath = storedPath.replace(/^[\\/.]+/, "").replace(/\\/g, "/");
  return path.join(__dirname, cleanPath);
};

// === 1. LECTURER: Upload Question Paper ===
export const uploadQuestion = async (req, res) => {
  try {
    const { title, stream, durationMins, department } = req.body;
    if (!req.file)
      return res.status(400).json({ message: "No file uploaded!" });

    const newPaper = new QuestionPaper({
      title,
      stream,
      department: department || req.user.department,
      durationMins,
      uploadedBy: req.user.id,
      filePath: `uploads/${req.file.filename}`,
      status: "pending",
    });

    await newPaper.save();
    res.status(201).json({ message: "Paper uploaded successfully", newPaper });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ message: "Server error during upload" });
  }
};

// === 2. LECTURER: Get My Uploaded Papers ===
export const getMyPapers = async (req, res) => {
  try {
    const papers = await QuestionPaper.find({ uploadedBy: req.user.id }).sort({
      createdAt: -1,
    });
    res.status(200).json(papers);
  } catch (err) {
    res.status(500).json({ message: "Error fetching your papers" });
  }
};

// === 3. LECTURER: Delete Pending Paper ===
export const deleteQuestion = async (req, res) => {
  try {
    const paper = await QuestionPaper.findById(req.params.id);
    if (!paper) return res.status(404).json({ message: "Paper not found" });

    // Safety check: Don't allow deleting already approved papers
    if (paper.status !== "pending" && req.user.role !== "admin")
      return res
        .status(400)
        .json({ message: "Only pending papers can be deleted by lecturers." });

    const fullPath = getAbsolutePath(paper.filePath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);

    await QuestionPaper.findByIdAndDelete(req.params.id);
    res.json({ message: "Paper deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting paper" });
  }
};

// === 4. HOD/ADMIN: Get Pending Papers ===
export const getPendingPapers = async (req, res) => {
  try {
    const userStream = req.user.stream;
    let query = { status: "pending" };

    // HODs only see their stream, Admins see "All"
    if (req.user.role === "hod" && userStream && userStream !== "All") {
      query.stream = userStream;
    }

    const papers = await QuestionPaper.find(query)
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json(papers);
  } catch (err) {
    res.status(500).json({ message: "Error fetching pending papers" });
  }
};

// === 5. HOD/ADMIN: Update Paper Status ===
export const updatePaperStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const paper = await QuestionPaper.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!paper) return res.status(404).json({ message: "Paper not found" });
    res.status(200).json({ message: `Paper ${status} successfully`, paper });
  } catch (err) {
    res.status(500).json({ message: "Error updating status" });
  }
};

// === 6. STUDENT: Get Approved Papers ===
export const getApprovedByStream = async (req, res) => {
  try {
    const papers = await QuestionPaper.find({
      status: "approved",
      stream: req.user.stream,
    }).populate("uploadedBy", "name email");
    res.status(200).json(papers);
  } catch (err) {
    res.status(500).json({ message: "Error fetching papers" });
  }
};

// === 7. ADMIN/HOD: View All Papers ===
export const getAllPapers = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "hod") query = { department: req.user.department };

    const papers = await QuestionPaper.find(query).populate(
      "uploadedBy",
      "name department stream"
    );
    res.status(200).json(papers);
  } catch (err) {
    res.status(500).json({ message: "Error fetching papers" });
  }
};

// === 8. PREVIEW & SECURE ATTENDANCE (STAFF BYPASS INCLUDED) ===
export const previewQuestion = async (req, res) => {
  try {
    const paper = await QuestionPaper.findById(req.params.id);
    if (!paper) return res.status(404).json({ message: "File not found" });

    // 🛡️ SECURITY LOGIC
    if (req.user.role === "student") {
      const { qrt } = req.query; // timestamp from scanned QR
      const scanTime = parseInt(qrt);
      const now = Date.now();

      // 1. Validate 30-second window
      if (!scanTime || now - scanTime > 35000) {
        return res.status(403).json({
          message:
            "Security Error: QR Code expired. Please scan the current code from the lecturer's screen.",
        });
      }

      // 2. Manage Session
      let session = await StudentSession.findOne({
        studentId: req.user.id,
        examId: req.params.id,
      });

      if (!session) {
        const endTime = new Date(now + paper.durationMins * 60000);
        session = new StudentSession({
          studentId: req.user.id,
          examId: req.params.id,
          loginTime: new Date(),
          endTime: endTime,
          status: "Present",
          ipAddress: req.ip,
        });
        await session.save();
      } else if (new Date() > session.endTime || session.status === "Blocked") {
        return res
          .status(403)
          .json({
            message: "Access Denied: Session expired or you have been Blocked.",
          });
      }
    }
    // 👁️ ADMIN/HOD/LECTURER Bypass: No QR needed for staff preview

    const fullPath = getAbsolutePath(paper.filePath);
    if (fs.existsSync(fullPath)) {
      const ext = path.extname(fullPath).toLowerCase();
      const mimeTypes = {
        ".pdf": "application/pdf",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
      };

      res.setHeader(
        "Content-Type",
        mimeTypes[ext] || "application/octet-stream"
      );
      res.setHeader(
        "Content-Disposition",
        "inline; filename=" + path.basename(fullPath)
      );
      return res.sendFile(fullPath);
    } else {
      res
        .status(404)
        .json({ message: "Physical file missing on server storage" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error accessing file" });
  }
};

// === 9. DOWNLOAD ===
export const downloadQuestion = async (req, res) => {
  try {
    const paper = await QuestionPaper.findById(req.params.id);
    if (!paper) return res.status(404).json({ message: "File not found" });
    const fullPath = getAbsolutePath(paper.filePath);
    if (fs.existsSync(fullPath)) {
      res.download(fullPath);
    } else {
      res.status(404).json({ message: "File missing" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error downloading" });
  }
};

// === 10. LECTURER/HOD/ADMIN: Get Live Attendance ===
export const getLiveAttendance = async (req, res) => {
  try {
    const { paperId } = req.params;
    if (req.user.role === "lecturer") {
      const paper = await QuestionPaper.findById(paperId);
      if (paper.uploadedBy.toString() !== req.user.id)
        return res.status(403).json({ message: "Unauthorized" });
    }
    const sessions = await StudentSession.find({ examId: paperId })
      .populate("studentId", "name rollNo stream email")
      .sort({ loginTime: -1 });
    res.status(200).json(sessions);
  } catch (err) {
    res.status(500).json({ message: "Error fetching attendance" });
  }
};

// === 11. LECTURER/HOD/ADMIN: Block Student ===
export const blockStudentSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await StudentSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    if (req.user.role === "lecturer") {
      const paper = await QuestionPaper.findById(session.examId);
      if (paper.uploadedBy.toString() !== req.user.id)
        return res.status(403).json({ message: "Unauthorized" });
    }

    session.status = "Blocked";
    session.endTime = new Date();
    await session.save();
    res.status(200).json({ message: "Student blocked successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error blocking student" });
  }
};

// === 12. STUDENT: Session Status ===
export const getMySessionStatus = async (req, res) => {
  try {
    const session = await StudentSession.findOne({
      studentId: req.user.id,
    }).sort({ loginTime: -1 });
    if (!session) return res.json({ status: "No active session" });
    res.json({
      status: session.status,
      remainingTime: session.endTime - new Date(),
    });
  } catch (err) {
    res.status(500).json({ message: "Error checking status" });
  }
};
