import express from "express";
import Support from "../models/Support.js";
import authMiddleware, {
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// 🚨 1. PUBLIC: Student sends a help request
router.post("/request", async (req, res) => {
  try {
    const { studentName, email, message } = req.body;
    const newRequest = new Support({ studentName, email, message });
    await newRequest.save();
    res.status(201).json({ msg: "Support alert sent to Admin!" });
  } catch (err) {
    res.status(500).json({ msg: "Error sending alert" });
  }
});

// 🛡️ 2. PRIVATE: Admin fetches all active tickets
router.get(
  "/all",
  authMiddleware,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const tickets = await Support.find({ resolved: false }).sort({
        createdAt: -1,
      });
      res.json(tickets);
    } catch (err) {
      res.status(500).json({ msg: "Error fetching tickets" });
    }
  }
);

// ✅ 3. PRIVATE: Admin marks a ticket as resolved
router.delete(
  "/resolve/:id",
  authMiddleware,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      await Support.findByIdAndDelete(req.params.id);
      res.json({ msg: "Ticket resolved and removed" });
    } catch (err) {
      res.status(500).json({ msg: "Error resolving ticket" });
    }
  }
);

export default router;
