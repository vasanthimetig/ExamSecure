import mongoose from "mongoose";

const questionPaperSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    stream: {
      type: String,
      required: true,
      trim: true,
    },

    durationMins: {
      type: Number,
      required: true,
    },

    filePath: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Prevent OverwriteModelError during nodemon hot-reload
const QuestionPaper =
  mongoose.models.QuestionPaper ||
  mongoose.model("QuestionPaper", questionPaperSchema);

export default QuestionPaper;
