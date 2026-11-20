import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import User from "../models/User.js";
import authMiddleware, {
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/* ============================================================
    🔍 SMART UI CHECK: Fetch Role by Email
   ============================================================ */
router.get("/check-role/:email", async (req, res) => {
  try {
    const emailLower = req.params.email.toLowerCase();

    if (emailLower === "admin@example.com") {
      return res.json({ role: "admin" });
    }

    const user = await User.findOne({ email: emailLower }).select("role");

    if (!user) {
      return res.json({ role: "student" });
    }

    res.json({ role: user.role.toLowerCase() });
  } catch (err) {
    console.error("Role check error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

/* ============================================================
    📝 REGISTER USER (With Gmail & Confirm Password Logic)
   ============================================================ */
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      role,
      stream,
      department,
      rollNo,
    } = req.body;

    const emailLower = email.toLowerCase();
    const roleLower = role.toLowerCase();

    if (!emailLower.endsWith("@gmail.com")) {
      return res
        .status(400)
        .json({ msg: "Only Gmail accounts (@gmail.com) are allowed." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ msg: "Passwords do not match." });
    }

    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser)
      return res.status(400).json({ msg: "User already exists" });

    if (roleLower === "admin") {
      const adminExists = await User.findOne({ role: "admin" });
      if (adminExists)
        return res.status(403).json({ msg: "Admin already exists." });
    }

    if (roleLower === "hod") {
      const existingHOD = await User.findOne({
        role: "hod",
        stream: department || stream,
      });
      if (existingHOD) {
        return res
          .status(400)
          .json({ msg: `An HOD for ${department || stream} already exists.` });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let userData = {
      name,
      email: emailLower,
      password: hashedPassword,
      role: roleLower,
      verified: roleLower === "student" || roleLower === "admin",
    };

    if (roleLower === "student") {
      userData.stream = stream;
      userData.rollNo = rollNo;
    }

    if (roleLower === "lecturer" || roleLower === "hod") {
      userData.department = department;
      userData.stream = department;
    }

    const newUser = new User(userData);
    await newUser.save();

    res.status(201).json({
      msg:
        roleLower === "student" || roleLower === "admin"
          ? "Registration successful!"
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
    const { email, password, qrVerified } = req.body;
    const emailLower = email.toLowerCase();

    if (emailLower === "admin@example.com" && password === "admin123") {
      const token = jwt.sign(
        { id: "static-admin-id", role: "admin", stream: "All" },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );
      return res.json({
        token,
        user: {
          name: "Super Admin",
          email: emailLower,
          role: "admin",
          stream: "All",
          verified: true,
        },
      });
    }

    const user = await User.findOne({ email: emailLower });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    if ((user.role === "lecturer" || user.role === "hod") && !user.verified) {
      return res
        .status(403)
        .json({ msg: "Access denied. Pending admin approval." });
    }

    if (user.role === "student" && !qrVerified) {
      return res
        .status(403)
        .json({ msg: "QR Verification failed. You must scan the hall QR." });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, stream: user.stream },
      process.env.JWT_SECRET,
      { expiresIn: "4h" }
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
    📧 PASSWORD RESET LOGIC
   ============================================================ */

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ msg: "User not found" });

    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      to: user.email,
      subject: "🔐 Password Reset Request - College Exam Portal",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
          <div style="background-color: #4f46e5; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Exam Portal</h1>
          </div>
          <div style="padding: 30px; background-color: white;">
            <h2 style="color: #1e293b; margin-top: 0;">Password Reset Request</h2>
            <p style="color: #64748b; line-height: 1.6;">Hello <strong>${user.name}</strong>,</p>
            <p style="color: #64748b; line-height: 1.6;">We received a request to reset the password for your account. Click the button below to set a new password. This link is valid for <strong>60 minutes</strong>.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://192.168.43.147:3000/reset-password/${resetToken}" 
                 style="background-color: #4f46e5; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                Reset Password Now
              </a>
            </div>
            
            <p style="color: #94a3b8; font-size: 12px; line-height: 1.6;">If you did not request this, please ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;">
            <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">© 2026 College Exam Management System</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ msg: "Reset link sent to your email!" });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ msg: "Error sending reset email" });
  }
});

// ✅ RESET PASSWORD: With Automatic Success Confirmation Email
router.post("/reset-password/:token", async (req, res) => {
  const { password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ msg: "Passwords do not match." });
  }

  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ msg: "Token is invalid or has expired." });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Send Success Confirmation Email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const successMailOptions = {
      to: user.email,
      subject: "✅ Password Successfully Changed - Exam Portal",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
          <div style="background-color: #10b981; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Security Alert</h1>
          </div>
          <div style="padding: 30px; background-color: white;">
            <h2 style="color: #1e293b; margin-top: 0;">Password Updated</h2>
            <p style="color: #64748b; line-height: 1.6;">Hello <strong>${
              user.name
            }</strong>,</p>
            <p style="color: #64748b; line-height: 1.6;">This is a confirmation that your password has been successfully changed.</p>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #475569; margin: 0; font-size: 13px;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              <p style="color: #475569; margin: 5px 0 0; font-size: 13px;"><strong>Status:</strong> Password Changed Successfully</p>
            </div>
            
            <p style="color: #ef4444; font-weight: bold; line-height: 1.6;">If you did not make this change, please contact the Admin immediately.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://192.168.43.147:3000/login" 
                 style="background-color: #10b981; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                Go to Login
              </a>
            </div>
            
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;">
            <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">© 2026 College Exam Management System</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(successMailOptions);

    res.json({
      msg: "Password successfully updated! A confirmation email has been sent.",
    });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ msg: "Error updating password" });
  }
});

/* ============================================================
    👑 ADMIN ROUTES
   ============================================================ */
router.get(
  "/users",
  authMiddleware,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const users = await User.find({ role: { $ne: "admin" } }).select(
        "-password"
      );
      res.json(users);
    } catch (err) {
      res.status(500).json({ msg: "Error fetching users" });
    }
  }
);

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
      res.status(500).json({ msg: "Error fetching pending users" });
    }
  }
);

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
      res.status(500).json({ msg: "Error verifying user" });
    }
  }
);

router.get("/admin-exists", async (req, res) => {
  const admin = await User.findOne({ role: "admin" });
  res.json({ exists: !!admin });
});

export default router;
