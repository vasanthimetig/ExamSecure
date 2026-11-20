import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [papers, setPapers] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]); // ✅ NEW: Support State
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // 🛠️ NETWORK CONFIG
  const API_BASE_URL = "http://192.168.43.147:5000/api";

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      // Added support tickets to the global fetch
      const [pendingRes, usersRes, papersRes, supportRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/auth/pending`, { headers }),
        axios.get(`${API_BASE_URL}/auth/users`, { headers }),
        axios.get(`${API_BASE_URL}/exams/all`, { headers }),
        axios
          .get(`${API_BASE_URL}/support/all`, { headers })
          .catch(() => ({ data: [] })), // Graceful fail if route not ready
      ]);

      setPendingUsers(pendingRes.data);
      setApprovedUsers(
        usersRes.data.filter((u) => u.verified && u.role !== "admin")
      );
      setPapers(papersRes.data);
      setSupportTickets(supportRes.data);
    } catch (err) {
      console.error("Error loading admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // ✅ Auto-refresh every 30 seconds for live support monitoring
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleVerify = async (id) => {
    if (!window.confirm("Approve this staff member for system access?")) return;
    try {
      await axios.put(
        `${API_BASE_URL}/auth/verify/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("✅ Staff member verified!");
      fetchData();
    } catch (err) {
      alert("Error approving user.");
    }
  };

  // ✅ NEW: Handle Support Ticket Resolution
  const resolveTicket = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/support/resolve/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch (err) {
      alert("Failed to resolve ticket.");
    }
  };

  const handlePreview = async (paperId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/exams/preview/${paperId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );
      const fileURL = URL.createObjectURL(
        new Blob([response.data], { type: response.headers["content-type"] })
      );
      window.open(fileURL, "_blank");
      setTimeout(() => URL.revokeObjectURL(fileURL), 1000);
    } catch (err) {
      alert("Preview failed.");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex justify-center items-center font-bold text-slate-400 animate-pulse">
        Synchronizing Admin Data...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 font-sans">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            🛡️ System Admin
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Real-time Portal Monitoring & Support
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-50 text-red-600 px-6 py-2 rounded-xl hover:bg-red-600 hover:text-white transition-all font-bold shadow-sm"
        >
          Logout
        </button>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-slate-400 text-[10px] uppercase font-black mb-2 tracking-widest">
            Live Help Requests
          </h3>
          <p
            className={`text-4xl font-black ${
              supportTickets.length > 0 ? "text-red-500" : "text-slate-300"
            }`}
          >
            {supportTickets.length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-slate-400 text-[10px] uppercase font-black mb-2 tracking-widest">
            Staff Approval
          </h3>
          <p className="text-4xl font-black text-amber-500">
            {pendingUsers.length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-slate-400 text-[10px] uppercase font-black mb-2 tracking-widest">
            Verified Faculty
          </h3>
          <p className="text-4xl font-black text-emerald-500">
            {approvedUsers.length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-slate-400 text-[10px] uppercase font-black mb-2 tracking-widest">
            Global Papers
          </h3>
          <p className="text-4xl font-black text-indigo-600">{papers.length}</p>
        </div>
      </div>

      {/* ✅ NEW: LIVE SUPPORT TICKETS SECTION */}
      {supportTickets.length > 0 && (
        <section className="bg-white rounded-3xl shadow-xl overflow-hidden mb-10 border-2 border-red-100 animate-in fade-in duration-500">
          <div className="bg-red-500 p-6 text-white font-black flex justify-between items-center">
            <span>🚨 LIVE SUPPORT REQUESTS (URGENT)</span>
            <span className="bg-white text-red-600 px-3 py-1 rounded-full text-xs">
              New
            </span>
          </div>
          <div className="p-6 space-y-4">
            {supportTickets.map((ticket) => (
              <div
                key={ticket._id}
                className="flex justify-between items-center p-4 bg-red-50 rounded-2xl border border-red-100"
              >
                <div>
                  <p className="font-black text-red-700">
                    {ticket.studentName}{" "}
                    <span className="font-normal text-xs text-red-400 ml-2">
                      ({ticket.email})
                    </span>
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                    Issue: <span className="font-bold">{ticket.message}</span>
                  </p>
                </div>
                <button
                  onClick={() => resolveTicket(ticket._id)}
                  className="bg-white text-red-600 px-6 py-2 rounded-xl text-xs font-black hover:bg-red-600 hover:text-white transition shadow-sm"
                >
                  Mark Resolved
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* STAFF REQUESTS */}
      <section className="bg-white rounded-3xl shadow-xl overflow-hidden mb-10">
        <div className="bg-slate-900 p-6 text-white font-black tracking-widest text-xs uppercase">
          🔐 Staff Access Requests
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-400 text-[10px] uppercase border-b bg-slate-50 font-black tracking-widest">
              <th className="p-5">Staff Information</th>
              <th className="p-5">Requested Role</th>
              <th className="p-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingUsers.map((u) => (
              <tr
                key={u._id}
                className="border-b hover:bg-gray-50 transition-colors"
              >
                <td className="p-5 font-bold text-slate-700">
                  {u.name}
                  <br />
                  <span className="text-[10px] font-normal text-slate-400">
                    {u.email}
                  </span>
                </td>
                <td className="p-5">
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-black uppercase tracking-tighter">
                    {u.role}
                  </span>
                </td>
                <td className="p-5 text-right">
                  <button
                    onClick={() => handleVerify(u._id)}
                    className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-black hover:bg-indigo-700 transition shadow-md active:scale-95"
                  >
                    Verify Account
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* GLOBAL PAPER VIEW */}
      <section className="bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-indigo-50 p-6 border-b border-indigo-100 text-indigo-900 font-black text-xs uppercase tracking-widest">
          📄 Global Paper Repository
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {papers.map((paper) => (
            <div
              key={paper._id}
              className="p-5 border border-slate-100 rounded-3xl flex justify-between items-center bg-slate-50 hover:bg-white hover:shadow-lg transition-all group"
            >
              <div>
                <p className="font-black text-slate-800 group-hover:text-indigo-600 transition-colors">
                  {paper.title}
                </p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">
                  {paper.stream} •{" "}
                  <span className="text-emerald-500">{paper.status}</span>
                </p>
              </div>
              <button
                onClick={() => handlePreview(paper._id)}
                className="bg-white text-indigo-600 p-3 rounded-2xl hover:bg-indigo-600 hover:text-white transition shadow-sm border border-indigo-50"
              >
                👁️
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
