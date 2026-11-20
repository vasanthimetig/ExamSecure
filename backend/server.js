import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";

// Route Imports
import authRoutes from "./routes/authRoutes.js";
import examRoutes from "./routes/examRoutes.js";
import examSessionRoutes from "./routes/examSessionRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";

// Load Environment Variables
dotenv.config();

// ✅ Connect to MongoDB
connectDB();

// 1. INITIALIZE APP FIRST (Fixes ReferenceError)
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 2. DYNAMIC CORS SETUP (MOBILE COMPATIBLE) ---
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

app.use(express.json());

// --- 3. AUTOMATIC FOLDER CREATION ---
const uploadDir = path.resolve(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("📁 Created 'uploads' folder at:", uploadDir);
}

// --- 4. SERVE STATIC FILES ---
app.use("/uploads", express.static(uploadDir));

// --- 5. API ROUTES (Mounted after app initialization) ---
app.get("/", (req, res) => {
  res.send("✅ Exam Portal API is running...");
});

// Primary API Endpoints
app.use("/api/auth", authRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/sessions", examSessionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/uploads", uploadRoutes); // Changed to unique path to avoid conflict
app.use("/api/support", supportRoutes); // ✅ Support routes now correctly mounted

// --- 6. GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
  console.error("❌ Global Error:", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// --- 7. START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Local Network Access: http://192.168.43.147:${PORT}`);
});
