import mongoose from "mongoose";

const studentSessionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ExamSession",
    required: true,
  },
  loginTime: { type: Date, default: Date.now },
  status: { type: String, enum: ["Present", "Absent"], default: "Present" },
  ipAddress: { type: String },
});

export default mongoose.model("StudentSession", studentSessionSchema);
