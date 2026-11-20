import User from "../models/User.js";

/* ============================================================
   ✅ GET PENDING USERS (lecturer / hod awaiting approval)
   ============================================================ */
export const getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({
      verified: false,
      role: { $in: ["lecturer", "hod"] },
    }).select("-password"); // hide password
    res.json(users);
  } catch (err) {
    console.error("Error fetching pending users:", err);
    res.status(500).json({ message: "Error fetching pending users" });
  }
};

/* ============================================================
   ✅ APPROVE USER (Admin verifies lecturer/HOD)
   ============================================================ */
export const verifyUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.verified = true;
    await user.save();

    res.json({ message: "✅ User approved successfully", user });
  } catch (err) {
    console.error("Error approving user:", err);
    res.status(500).json({ message: "Error approving user" });
  }
};

/* ============================================================
   ✅ GET APPROVED USERS
   ============================================================ */
export const getApprovedUsers = async (req, res) => {
  try {
    const users = await User.find({
      verified: true,
      role: { $in: ["lecturer", "hod"] },
    }).select("-password");
    res.json(users);
  } catch (err) {
    console.error("Error fetching approved users:", err);
    res.status(500).json({ message: "Error fetching approved users" });
  }
};
