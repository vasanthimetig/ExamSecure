import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// === 1. LOGIN: With Dynamic QR, Room & Stream Validation ===
export const login = async (req, res) => {
  const { email, password, roomNo, qrVerified, verificationPayload } = req.body;

  try {
    // 🛡️ MASTER ADMIN CHECK (Keep for emergency access)
    if (email === "admin@example.com" && password === "admin123") {
      const token = jwt.sign(
        { id: "static-admin-id", role: "admin", stream: "All" },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );
      return res.json({
        token,
        user: {
          name: "Super Admin",
          email: "admin@example.com",
          role: "admin",
          stream: "All",
        },
      });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid Credentials" });

    // 🔒 STUDENT SECURITY: QR & Stream Cross-Check
    if (user.role === "student") {
      if (!qrVerified) {
        return res
          .status(403)
          .json({ msg: "QR Verification required for entry" });
      }

      if (
        verificationPayload &&
        user.stream !== verificationPayload.scannedDept
      ) {
        return res.status(403).json({
          msg: `Unauthorized: This hall is reserved for ${verificationPayload.scannedDept} students. Your stream is ${user.stream}.`,
        });
      }
    }

    // 🔒 STAFF SECURITY: Verification Check
    if (!user.verified && (user.role === "lecturer" || user.role === "hod")) {
      return res.status(401).json({ msg: "Account pending admin approval" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid Credentials" });

    user.roomNo = roomNo || "N/A";
    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        stream: user.stream || "",
        room: user.roomNo,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        stream: user.stream,
        rollNo: user.rollNo,
        roomNo: user.roomNo,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

// === 2. REGISTER: Enforcing Password Confirmation & Staff Limits ===
export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      role,
      stream,
      rollNo,
      department,
    } = req.body;

    // ✅ NEW: Password Match Validation
    if (password !== confirmPassword) {
      return res.status(400).json({ msg: "Passwords do not match." });
    }

    // 1. Basic Email Duplicate Check
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: "User already exists" });

    // 👑 2. GLOBAL ADMIN LOCK: Only 1 Admin per system
    if (role === "admin") {
      const existingAdmin = await User.findOne({ role: "admin" });
      if (existingAdmin) {
        return res.status(400).json({
          msg: "Registration Rejected: A system Admin already exists.",
        });
      }
    }

    // 🛡️ 3. UNIQUE HOD LOCK: Only 1 HOD per specific stream
    if (role === "hod") {
      const targetStream = department || stream;
      const existingHOD = await User.findOne({
        role: "hod",
        stream: targetStream,
      });
      if (existingHOD) {
        return res.status(400).json({
          msg: `Registration Rejected: An HOD for the ${targetStream} stream already exists.`,
        });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      verified: role === "student" || role === "admin" ? true : false,
    });

    if (role === "student") {
      newUser.stream = stream;
      newUser.rollNo = rollNo;
    } else if (role === "lecturer" || role === "hod") {
      newUser.department = department;
      newUser.stream = department; // Align stream with department for filtering
    }

    await newUser.save();
    res
      .status(201)
      .json({ msg: "Registered! Staff accounts must be verified by Admin." });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ msg: "This role or stream is already occupied." });
    }
    console.error(err);
    res.status(500).json({ msg: "Server Error: Registration failed" });
  }
};

// === 3. ADMIN: Approve Staff Members ===
export const verifyUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { verified: true },
      { new: true }
    );
    res.json({ msg: "User verified", user });
  } catch (err) {
    res.status(500).send("Server error");
  }
};

// === 4. ADMIN: Get Staff Waiting for Approval ===
export const getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({
      verified: false,
      role: { $in: ["lecturer", "hod"] },
    });
    res.json(users);
  } catch (err) {
    res.status(500).send("Server error");
  }
};

// === 5. ADMIN: Get All Verified Staff ===
export const getVerifiedUsers = async (req, res) => {
  try {
    const users = await User.find({ verified: true, role: { $ne: "admin" } });
    res.json(users);
  } catch (err) {
    res.status(500).send("Server error");
  }
};
