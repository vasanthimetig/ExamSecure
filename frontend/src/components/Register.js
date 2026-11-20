import React, { useState } from "react";
import API from "../api/axios"; // ✅ Use the central API instance
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "", // ✅ Confirm password state
    role: "student",
    stream: "",
    department: "",
    rollNo: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ 1. Email Format Validation (Must be @gmail.com)
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(formData.email.toLowerCase())) {
      alert("Please enter a valid Gmail address (e.g., name@gmail.com)");
      return;
    }

    // ✅ 2. Password Match Validation
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match! Please try again.");
      return;
    }

    // Prepare data based on the selected role
    const finalData = {
      name: formData.name,
      email: formData.email.toLowerCase(), // Ensure email is sent in lowercase
      password: formData.password,
      confirmPassword: formData.confirmPassword, // Sent for backend verification
      role: formData.role,
      stream:
        formData.role === "student"
          ? formData.stream
          : formData.role === "admin"
          ? ""
          : formData.department,
      rollNo: formData.role === "student" ? formData.rollNo : "",
      department:
        formData.role === "lecturer" || formData.role === "hod"
          ? formData.department
          : "",
    };

    try {
      const res = await API.post("/auth/register", finalData);
      alert(res.data.msg || "Registration successful!");
      navigate("/login");
    } catch (err) {
      console.error("Registration Error:", err.response?.data);
      alert(err.response?.data?.msg || "Registration failed. Check console.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 font-sans">
      <div className="bg-white/95 backdrop-blur-sm p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 uppercase tracking-tighter">
            Join the Portal
          </h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">
            Create your secure exam account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              placeholder="John Doe"
              onChange={handleChange}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-400 outline-none transition-all font-medium"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">
              Gmail Address
            </label>
            <input
              type="email"
              name="email"
              placeholder="name@gmail.com"
              onChange={handleChange}
              // ✅ HTML5 validation pattern for Gmail
              pattern=".+@gmail\.com"
              title="Please use a valid @gmail.com address"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-400 outline-none transition-all font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">
                Password
              </label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                onChange={handleChange}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-400 outline-none transition-all"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">
                Confirm
              </label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                onChange={handleChange}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-400 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">
              Select Your Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-400 outline-none cursor-pointer font-bold text-slate-700"
            >
              <option value="student">Student</option>
              <option value="lecturer">Lecturer</option>
              <option value="hod">HOD</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {formData.role === "student" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">
                  Stream
                </label>
                <select
                  name="stream"
                  value={formData.stream}
                  onChange={handleChange}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700"
                  required
                >
                  <option value="">Select Stream</option>
                  <option value="CSE">Computer Science</option>
                  <option value="ECE">Electronics</option>
                  <option value="ME">Mechanical</option>
                  <option value="CE">Civil</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">
                  Roll Number
                </label>
                <input
                  type="text"
                  name="rollNo"
                  placeholder="CS2025001"
                  onChange={handleChange}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium"
                  required
                />
              </div>
            </div>
          )}

          {(formData.role === "lecturer" || formData.role === "hod") && (
            <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">
                Department
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700"
                required
              >
                <option value="">Select Department</option>
                <option value="CSE">CSE Dept</option>
                <option value="ECE">ECE Dept</option>
                <option value="ME">Mechanical Dept</option>
                <option value="CE">Civil Dept</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
          >
            Create Account
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-100 pt-6">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            Already have an account?{" "}
            <span
              onClick={() => navigate("/login")}
              className="text-indigo-600 cursor-pointer hover:underline font-black"
            >
              Login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
