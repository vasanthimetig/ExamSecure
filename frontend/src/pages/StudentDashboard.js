import React, { useEffect, useState } from "react";
import API from "../api/axios"; // ✅ Centralized API instance
import { useNavigate } from "react-router-dom";

// --- 1. COUNTDOWN HELPER COMPONENT ---
const Countdown = ({ expiryTime, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const distance = new Date(expiryTime).getTime() - now;

      if (distance <= 0) {
        setTimeLeft("EXPIRED");
        setIsExpired(true);
        if (onExpire) onExpire();
        return;
      }

      const h = Math.floor(distance / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${h}h ${m}m ${s}s`);
    };

    const timer = setInterval(calculateTime, 1000);
    calculateTime();

    return () => clearInterval(timer);
  }, [expiryTime, onExpire]);

  return (
    <span
      className={`font-mono font-bold ${
        isExpired ? "text-red-500" : "text-amber-400 animate-pulse"
      }`}
    >
      {timeLeft}
    </span>
  );
};

const StudentDashboard = () => {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);

  const navigate = useNavigate();

  // --- 2. AUTH & INITIAL DATA FETCHING ---
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");

    if (!storedUser || !token) {
      navigate("/login");
      return;
    }
    setUser(storedUser);

    const fetchPapers = async () => {
      try {
        const res = await API.get("/exams/approved");
        setPapers(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Fetch papers failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPapers();
  }, [navigate]);

  // --- 3. LIVE SECURITY POLLING (Every 10 seconds) ---
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await API.get("/exams/my-session-status");
        // Update: Check for "Blocked" status from examController.js
        if (res.data.status === "Blocked") {
          setIsBlocked(true);
        }
      } catch (err) {
        console.error("Security status check failed");
      }
    };

    const token = localStorage.getItem("token");
    if (token && !isBlocked) {
      const interval = setInterval(checkStatus, 10000);
      return () => clearInterval(interval);
    }
  }, [isBlocked]);

  // --- 4. PREVIEW HANDLER WITH QR VALIDATION ---
  const handlePreview = async (paperId) => {
    try {
      // Security: Sending current timestamp to match backend's 30s rotation
      const qrt = Date.now();
      const res = await API.get(`/exams/preview/${paperId}?qrt=${qrt}`, {
        responseType: "blob",
      });

      const fileURL = URL.createObjectURL(res.data);
      window.open(fileURL, "_blank");
      // Revoke after 10s to keep memory clean
      setTimeout(() => URL.revokeObjectURL(fileURL), 10000);
    } catch (err) {
      console.error("Preview access denied or QR expired");
      alert("Access Denied: QR pattern expired or session blocked.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="relative min-h-screen bg-slate-950 flex flex-col items-center py-10 px-4 text-white overflow-x-hidden">
      {/* --- 🛡️ SECURITY OVERLAY (Disqualification UI) --- */}
      {isBlocked && (
        <div className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 text-center">
          <div className="max-w-md bg-white p-10 rounded-[3rem] shadow-[0_0_60px_rgba(220,38,38,0.5)] border-4 border-red-600 animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter uppercase">
              Access Revoked
            </h2>
            <p className="text-slate-600 font-semibold leading-relaxed mb-10">
              Your exam session has been{" "}
              <span className="text-red-600">terminated</span>. Access to
              question papers is now permanently disabled.
            </p>
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg active:scale-95"
            >
              Exit Portal
            </button>
          </div>
        </div>
      )}

      {/* --- DASHBOARD CONTENT --- */}
      <div
        className={`w-full max-w-2xl transition-all duration-1000 ${
          isBlocked ? "opacity-10 blur-xl pointer-events-none" : "opacity-100"
        }`}
      >
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl">
          <div className="flex justify-between items-start mb-8">
            <div className="text-left">
              <h1 className="text-4xl font-black mb-1 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                Exam Center
              </h1>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Monitoring Enabled
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-slate-800 hover:bg-red-600 text-white px-6 py-2 rounded-xl text-[10px] font-black transition-all border border-white/10 uppercase"
            >
              Logout
            </button>
          </div>

          <div className="flex gap-3 mb-8">
            <div className="px-4 py-2 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold text-[10px] uppercase">
              {user?.stream || "General"}
            </div>
            <div className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold text-[10px] uppercase">
              Hall: {user?.roomNo || "Verified"}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center py-20 space-y-4">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-indigo-300 text-[10px] font-black uppercase animate-pulse">
                Establishing Secure Link...
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {papers.map((paper) => {
                const startTime = new Date(paper.createdAt).getTime();
                const expiryTime = new Date(
                  startTime + paper.durationMins * 60000
                );
                const isStillValid = new Date().getTime() < expiryTime;

                return (
                  <div
                    key={paper._id}
                    className="group bg-slate-900/40 border border-white/5 p-6 rounded-3xl hover:bg-indigo-500/5 transition-all"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="text-left">
                        <h3 className="text-xl font-bold text-white mb-1">
                          {paper.title}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          Faculty: {paper.uploadedBy?.name}
                        </p>
                      </div>
                      <div className="text-right bg-black/50 px-4 py-2 rounded-2xl border border-white/5">
                        <p className="text-[8px] font-black text-slate-500 uppercase mb-1">
                          Time Left
                        </p>
                        <Countdown expiryTime={expiryTime} />
                      </div>
                    </div>

                    <button
                      onClick={() => handlePreview(paper._id)}
                      disabled={!isStillValid}
                      className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl ${
                        isStillValid
                          ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 active:scale-[0.98]"
                          : "bg-slate-800 text-slate-600 cursor-not-allowed"
                      }`}
                    >
                      {isStillValid
                        ? "Access Question Paper"
                        : "Exam Window Closed"}
                    </button>
                  </div>
                );
              })}
              {papers.length === 0 && (
                <p className="text-center text-slate-600 py-10 italic text-sm">
                  No active exam papers found for your stream.
                </p>
              )}
            </div>
          )}
        </div>

        <footer className="mt-12 text-center">
          <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.5em]">
            Identity Verified • System Authenticated • 2025
          </p>
        </footer>
      </div>
    </div>
  );
};

export default StudentDashboard;
