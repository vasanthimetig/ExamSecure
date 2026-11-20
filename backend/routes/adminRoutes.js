import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import authMiddleware, {
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/* ============================================================
   📝 REGISTER USER
   ============================================================ */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, stream, department, rollNo } =
      req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ msg: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // 🧠 Students are auto-verified; lecturers/HODs need admin approval
    const isStudent = role === "student";

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      stream: isStudent ? stream : "",
      department: !isStudent ? department : "",
      rollNo: isStudent ? rollNo : undefined,
      verified: isStudent, // ✅ auto-verify students only
    });

    await newUser.save();
    res.status(201).json({
      msg: isStudent
        ? "Student registered successfully!"
        : "Registration successful! Please wait for admin approval.",
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ msg: "Error registering user" });
  }
});

/* ============================================================
   🔐 LOGIN USER
   ============================================================ */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    // 🚫 Block unverified lecturer/HOD login
    if ((user.role === "lecturer" || user.role === "hod") && !user.verified) {
      return res
        .status(403)
        .json({ msg: "Access denied. Please wait for admin approval." });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        stream: user.stream,
        department: user.department,
        verified: user.verified,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Error logging in" });
  }
});

/* ============================================================
   👑 ADMIN ROUTES — Manage Verification
   ============================================================ */

// 🧾 Fetch all unverified users (lecturers/HODs)
router.get(
  "/pending",
  authMiddleware,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const pendingUsers = await User.find({
        verified: false,
        role: { $in: ["lecturer", "hod"] },
      });
      res.json(pendingUsers);
    } catch (err) {
      console.error("Error fetching pending users:", err);
      res.status(500).json({ msg: "Error fetching pending users" });
    }
  }
);

// ✅ Approve user
router.put(
  "/verify/:id",
  authMiddleware,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ msg: "User not found" });

      user.verified = true;
      await user.save();

      res.json({ msg: `${user.role} verified successfully!`, user });
    } catch (err) {
      console.error("Error verifying user:", err);
      res.status(500).json({ msg: "Error verifying user" });
    }
  }
);

export default router;
