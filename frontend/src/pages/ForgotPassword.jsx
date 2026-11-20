import React, { useState } from "react";
import API from "../api/axios"; // ✅ Ensure this path matches your axios config
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post("/auth/forgot-password", { email });
      alert("Check your email! A reset link has been sent.");
      navigate("/login");
    } catch (err) {
      alert(
        err.response?.data?.msg ||
          "Failed to send email. Ensure the email is registered."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="bg-white/95 backdrop-blur-sm p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-indigo-600 uppercase tracking-tighter">
            Reset Password
          </h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">
            Enter your email to receive a link
          </p>
        </div>
        <form onSubmit={handleSend} className="space-y-4">
          <input
            type="email"
            placeholder="student@college.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-400 font-medium"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 disabled:bg-slate-400"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
        <div className="mt-6 text-center">
          <span
            onClick={() => navigate("/login")}
            className="text-indigo-600 cursor-pointer text-sm font-bold hover:underline"
          >
            Back to Login
          </span>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
