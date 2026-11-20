import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import authMiddleware, {
  authorizeRoles,
} from "../middleware/authMiddleware.js";
import {
  uploadQuestion,
  getMyPapers,
  deleteQuestion,
  getPendingPapers,
  updatePaperStatus,
  getApprovedByStream,
  getAllPapers,
  previewQuestion,
  downloadQuestion,
  getLiveAttendance,
  blockStudentSession,
} from "../controllers/examController.js";

const router = express.Router();

// --- 👨‍🏫 Lecturer Routes ---
// Upload a new paper (PDF/Image)
router.post(
  "/upload",
  authMiddleware,
  authorizeRoles("lecturer"),
  upload.single("file"),
  uploadQuestion
);

// View only the papers uploaded by the logged-in lecturer
router.get(
  "/mypapers",
  authMiddleware,
  authorizeRoles("lecturer"),
  getMyPapers
);

// Delete a paper (only if status is still 'pending')
router.delete(
  "/delete/:id",
  authMiddleware,
  authorizeRoles("lecturer"),
  deleteQuestion
);

/** * 🛠️ THE QR & MONITORING SHIFT:
 * Lecturers provide the rotating QR code and monitor the session.
 */
// 📊 Live Attendance: View students currently taking a specific exam
router.get(
  "/attendance/:paperId",
  authMiddleware,
  authorizeRoles("lecturer", "hod", "admin"),
  getLiveAttendance
);

// 🚫 Security: Terminate/Block a student's active exam session
router.patch(
  "/block-session/:sessionId",
  authMiddleware,
  authorizeRoles("lecturer", "hod", "admin"),
  blockStudentSession
);

// --- 🎓 HOD Routes ---
// Get papers awaiting approval (filtered by HOD's department)
router.get(
  "/pending",
  authMiddleware,
  authorizeRoles("hod", "admin"),
  getPendingPapers
);

// Change status to 'approved' or 'rejected'
router.put(
  "/status/:id",
  authMiddleware,
  authorizeRoles("hod"),
  updatePaperStatus
);

/** * 🛠️ THE HOD STATS FIX:
 * HOD Dashboard calls '/students' to load the monitoring table.
 */
router.get(
  "/students",
  authMiddleware,
  authorizeRoles("hod", "admin"),
  getAllPapers
);

// --- 👨‍🎓 Student Routes ---
// View only 'approved' papers belonging to the student's specific stream
router.get(
  "/approved",
  authMiddleware,
  authorizeRoles("student"),
  getApprovedByStream
);

// --- ⚙️ Admin & Shared Routes ---
// Global view for Admins; Departmental view for HODs
router.get(
  "/all",
  authMiddleware,
  authorizeRoles("admin", "hod"),
  getAllPapers
);

/**
 * 👁️ PREVIEW: Shared access for all roles.
 * 🛡️ SECURITY: Admin can now preview papers directly without a QR scan.
 * For students, the controller still validates the 30s QR timestamp (qrt).
 */
router.get(
  "/preview/:id",
  authMiddleware,
  authorizeRoles("hod", "admin", "lecturer", "student"),
  previewQuestion
);

// 📥 DOWNLOAD: Restricted to staff only
router.get(
  "/download/:id",
  authMiddleware,
  authorizeRoles("hod", "admin", "lecturer"),
  downloadQuestion
);

export default router;
