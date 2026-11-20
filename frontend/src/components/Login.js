import React, { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import QrScanner from "react-qr-scanner";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    roomNo: "",
    role: "student",
  });

  const [error, setError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [qrVerified, setQrVerified] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [loadingRole, setLoadingRole] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  /**
   * 🔍 Function 1: Smart Auto-Detection & Role Fetching
   */
  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (qrVerified) setQrVerified(false);

    if (name === "email") {
      const emailLower = value.toLowerCase();

      // Quick check for Admin
      if (emailLower === "admin@example.com") {
        setIsStaff(true);
        setFormData((prev) => ({ ...prev, role: "admin" }));
        setLoadingRole(false);
        setError("");
        return;
      }

      // Fetch role from backend if email format is valid
      if (value.includes("@") && value.length > 5) {
        setLoadingRole(true);
        try {
          const res = await API.get(`/auth/check-role/${emailLower}`);
          // Ensure res.data exists before accessing role
          const detectedRole = res.data?.role || "student";

          setIsStaff(detectedRole !== "student");
          setFormData((prev) => ({ ...prev, role: detectedRole }));
          setError("");
        } catch (err) {
          setIsStaff(false);
          setFormData((prev) => ({ ...prev, role: "student" }));
        } finally {
          setLoadingRole(false);
        }
      }
    }
  };

  /**
   * 📷 Function 2: QR Scanner Handler (Fixed "undefined" crash)
   */
  const handleScan = (data) => {
    // FIX: Check if data and data.text exist before parsing
    if (data && data.text) {
      try {
        const qrInfo = JSON.parse(data.text);
        const currentSeed = Math.floor(Date.now() / 30000);

        // Security check for expired QR
        if (Math.abs(qrInfo.seed - currentSeed) > 1) {
          setError("QR Code expired! Scan the latest refreshed code.");
          return;
        }

        // Room number verification
        if (qrInfo.roomNo !== formData.roomNo) {
          setError(
            `Room Mismatch! QR is for ${qrInfo.roomNo}, you entered ${formData.roomNo}`,
          );
          return;
        }

        setFormData((prev) => ({ ...prev, qrDept: qrInfo.department }));
        setQrVerified(true);
        setIsScanning(false);
        setError("");
        alert(
          `✅ QR Verified for ${qrInfo.department} - Room ${qrInfo.roomNo}`,
        );
      } catch (err) {
        // This catches the "undefined" or bad format errors without crashing the app
        setError("Invalid QR format. Please scan a valid Hall QR code.");
      }
    }
  };

  /**
   * 🔓 Function 3: Submit Handler (Fixed LocalStorage crash)
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email.toLowerCase().endsWith("@gmail.com")) {
      setError("Please use a valid @gmail.com address.");
      return;
    }

    setIsSubmitting(true);

    if (!isStaff && !qrVerified && formData.email !== "admin@example.com") {
      setError("Students must scan the Hall QR code at the entrance.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await API.post("/auth/login", {
        ...formData,
        qrVerified: qrVerified || isStaff,
      });

      // FIX: Ensure res.data contains the expected info
      if (res.data && res.data.token && res.data.user) {
        const { token, user } = res.data;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        alert("Login successful!");

        // Navigation logic based on user role
        if (user.role === "student") navigate("/student");
        else if (user.role === "lecturer") navigate("/upload");
        else if (user.role === "hod") navigate("/approve");
        else if (user.role === "admin") navigate("/admin");
      } else {
        throw new Error("Invalid response format from server.");
      }
    } catch (err) {
      setError(
        err.response?.data?.msg ||
          "Login failed. Check credentials and server connection.",
      );
      setQrVerified(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 🚨 Function 4: Trigger Live Admin Alert
   */
  const sendHelpRequest = async () => {
    if (!formData.email.includes("@gmail.com")) {
      alert("Please enter your Gmail first so Admin knows who you are.");
      return;
    }

    try {
      await API.post("/support/request", {
        email: formData.email,
        message: "Student having trouble with Login/QR Scan.",
        studentName: formData.email.split("@")[0],
      });
      alert("🚨 Alert sent! Please wait for Admin assistance.");
    } catch (err) {
      alert("Failed to send live alert. Check your network connection.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 font-sans relative overflow-hidden">
      {isSubmitting && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-indigo-900/60 backdrop-blur-md">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mb-4"></div>
          <p className="text-white font-black uppercase tracking-widest text-sm">
            Verifying Session...
          </p>
        </div>
      )}

      <div className="bg-white/95 backdrop-blur-sm p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white/20 transition-all">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 uppercase tracking-tighter">
            Secure Entry
          </h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">
            Exam Portal Authentication
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 text-[11px] font-bold p-3 rounded-lg mb-4 animate-pulse">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1 relative">
            <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@gmail.com"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-400 outline-none transition-all font-medium"
              disabled={isSubmitting}
              required
            />
            {loadingRole && (
              <div className="absolute right-4 bottom-4 animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
            )}
          </div>

          {!isStaff && (
            <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">
                Hall / Room No
              </label>
              <input
                type="text"
                name="roomNo"
                value={formData.roomNo}
                onChange={handleChange}
                placeholder="e.g. 101"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-400 outline-none transition-all font-medium"
                disabled={isSubmitting}
                required
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-400 outline-none transition-all font-medium"
              disabled={isSubmitting}
              required
            />
            <p
              onClick={() => navigate("/forgot-password")}
              className="text-right text-[10px] font-black text-indigo-600 cursor-pointer hover:underline mt-2 uppercase tracking-widest"
            >
              Forgot Password?
            </p>
          </div>

          <div className="pt-4">
            {!isStaff && !qrVerified ? (
              <button
                type="button"
                onClick={() => setIsScanning(!isScanning)}
                disabled={isSubmitting}
                className="w-full bg-amber-500 text-white p-5 rounded-2xl hover:bg-amber-600 transition-all font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-3 text-xs"
              >
                {isScanning ? "Stop Scanner" : "📷 Step 1: Scan Hall QR"}
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white p-5 rounded-2xl hover:bg-indigo-700 transition-all font-black uppercase tracking-widest shadow-lg text-xs active:scale-95"
              >
                {isStaff ? "🔓 Log In" : "🔓 Step 2: Authenticate Session"}
              </button>
            )}
          </div>
        </form>

        {isScanning && (
          <div className="mt-6 rounded-3xl overflow-hidden border-4 border-indigo-100 shadow-inner relative">
            <QrScanner
              delay={300}
              onScan={handleScan}
              onError={() =>
                setError("Camera access denied. Check browser permissions.")
              }
              style={{ width: "100%" }}
              constraints={{ video: { facingMode: "environment" } }}
            />
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 space-y-4 text-center">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            New Student?{" "}
            <span
              onClick={() => navigate("/register")}
              className="text-indigo-600 cursor-pointer hover:underline font-black ml-1"
            >
              Create Account
            </span>
          </p>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">
              Having Trouble Logging In?
            </p>
            <button
              onClick={sendHelpRequest}
              className="w-full mb-3 bg-red-100 text-red-600 p-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-200 transition-all shadow-sm"
            >
              📢 Send Live Help Alert to Admin
            </button>
            <div className="flex justify-center gap-4 mt-2">
              <a
                href="tel:+919876543210"
                className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter"
              >
                📞 Call
              </a>
              <a
                href="https://wa.me/919876543210"
                className="text-[10px] font-black text-green-500 uppercase tracking-tighter"
              >
                💬 WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
