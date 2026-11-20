import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";

const ResetPassword = () => {
  const { token } = useParams(); // Grabs the secret token from the URL
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post(`/auth/reset-password/${token}`, {
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
      alert(res.data.msg || "Password reset successful!");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.msg || "Link expired or invalid.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="bg-white/95 backdrop-blur-sm p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-indigo-600 uppercase tracking-tighter">
            New Password
          </h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">
            Set your secure new login
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">
              New Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-400"
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">
              Confirm New Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-400"
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 disabled:bg-slate-400"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
