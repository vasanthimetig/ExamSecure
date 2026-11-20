import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["student", "lecturer", "hod", "admin"],
      required: true,
    },

    /**
     * STREAM: Required for Student, Lecturer, and HOD.
     */
    stream: {
      type: String,
      required: function () {
        return ["student", "lecturer", "hod"].includes(this.role);
      },
    },

    /**
     * ROLL NUMBER: Required only for Students.
     */
    rollNo: {
      type: String,
      required: function () {
        return this.role === "student";
      },
    },

    /**
     * DEPARTMENT: Required for staff members (Lecturer/HOD).
     */
    department: {
      type: String,
      required: function () {
        return this.role === "lecturer" || this.role === "hod";
      },
    },

    verified: {
      type: Boolean,
      default: false,
    },

    /**
     * 📧 PASSWORD RESET FIELDS:
     * Added to store the Gmail reset token and its expiry time.
     */
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
  },
  { timestamps: true }
);

/**
 * 🛡️ THE HOD LOCK: Unique Compound Index
 * Prevents multiple HODs in the same stream (e.g., only 1 HOD for 'CSE').
 */
userSchema.index(
  { role: 1, stream: 1 },
  {
    unique: true,
    partialFilterExpression: { role: "hod" },
  }
);

/**
 * 👑 THE ADMIN LOCK: Global Unique Index
 * Prevents multiple Admins in the entire system.
 */
userSchema.index(
  { role: 1 },
  {
    unique: true,
    partialFilterExpression: { role: "admin" },
  }
);

// Prevent re-compilation of the model if it already exists
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
