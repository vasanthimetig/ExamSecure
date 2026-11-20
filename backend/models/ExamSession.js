import mongoose from "mongoose";

const examSessionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    questionPaper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuestionPaper",
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "completed", "expired"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

const ExamSession = mongoose.model("ExamSession", examSessionSchema);
export default ExamSession;
