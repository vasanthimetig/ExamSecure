import React, { useEffect, useState } from "react";
import API from "../api/axios"; 
import QRCode from "react-qr-code";

// --- SUB-COMPONENT: LIVE ATTENDANCE TABLE ---
const AttendanceTable = ({ paperId }) => {
  const [attendance, setAttendance] = useState([]);

  const fetchAttendance = async () => {
    try {
      const res = await API.get(`/exams/attendance/${paperId}`);
      setAttendance(res.data);
    } catch (err) {
      console.error("Error fetching attendance:", err);
    }
  };

  useEffect(() => {
    fetchAttendance();
    const interval = setInterval(fetchAttendance, 10000); 
    return () => clearInterval(interval);
  }, [paperId]);

  const handleBlockStudent = async (sessionId) => {
    if (!window.confirm("Block this student? This terminates their exam immediately.")) return;
    try {
      await API.patch(`/exams/block-session/${sessionId}`);
      fetchAttendance();
    } catch (err) {
      alert("Failed to block student.");
    }
  };

  return (
    <div className="mt-6 bg-white rounded-2xl shadow-inner overflow-hidden border border-gray-100">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-widest">
          <tr>
            <th className="p-4">Student</th>
            <th className="p-4">Roll No</th>
            <th className="p-4">Started At</th>
            <th className="p-4">Status</th>
            <th className="p-4">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {attendance.map((session) => {
            const isExpired = new Date() > new Date(session.endTime);
            return (
              <tr key={session._id} className="hover:bg-indigo-50/30 transition">
                <td className="p-4 font-bold text-slate-700">{session.studentId?.name}</td>
                <td className="p-4 text-slate-500 font-mono text-sm">{session.studentId?.rollNo}</td>
                <td className="p-4 text-xs text-slate-400">{new Date(session.loginTime).toLocaleTimeString()}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    isExpired || session.status === "Absent" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600 animate-pulse"
                  }`}>
                    {session.status === "Absent" ? "Blocked" : isExpired ? "Expired" : "Active"}
                  </span>
                </td>
                <td className="p-4">
                  {session.status !== "Absent" && !isExpired && (
                    <button onClick={() => handleBlockStudent(session._id)} className="text-red-500 hover:text-red-700 text-xs font-bold underline">Block</button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// --- MAIN COMPONENT ---
const ApprovePapers = () => {
  const [viewMode, setViewMode] = useState("papers"); 
  const [papers, setPapers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaperForAttendance, setSelectedPaperForAttendance] = useState(null);
  
  const [showQR, setShowQR] = useState(false);
  const [roomNo, setRoomNo] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [seed, setSeed] = useState(Math.floor(Date.now() / 30000));

  const user = JSON.parse(localStorage.getItem("user"));

  // ✅ FINAL ROBUST PREVIEW HANDLER
  const handlePreview = async (paperId) => {
    try {
      const token = localStorage.getItem("token");
      
      const response = await API.get(`/exams/preview/${paperId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob', // Required for binary data
      });

      // Robust check for JSON error hidden inside a Blob
      if (response.data.type === "application/json") {
        const text = await response.data.text();
        const errorData = JSON.parse(text);
        alert(`HOD Error: ${errorData.message || "File missing on server."}`);
        return;
      }

      // Create URL with the actual Content-Type from headers (PDF or Image)
      const file = new Blob([response.data], { type: response.headers['content-type'] });
      const fileURL = URL.createObjectURL(file);
      
      const newWindow = window.open(fileURL, "_blank");
      
      if (!newWindow) {
        alert("Popup blocked! Please allow popups for this site to view the paper.");
      }

      // Memory Management
      setTimeout(() => URL.revokeObjectURL(fileURL), 1000);
    } catch (err) {
      console.error("HOD Preview Error:", err);
      alert("Access Denied or Server Error. Ensure you are authorized to view this paper.");
    }
  };

  // QR Sync Logic
  useEffect(() => {
    let timer;
    if (showQR) {
      timer = setInterval(() => {
        const currentSeed = Math.floor(Date.now() / 30000);
        if (currentSeed !== seed) { setSeed(currentSeed); setTimeLeft(30); }
        else { setTimeLeft((prev) => (prev > 0 ? prev - 1 : 30)); }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showQR, seed]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paperRes, studentRes] = await Promise.all([
        API.get("/exams/all"),
        API.get("/exams/students")
      ]);
      setPapers(paperRes.data.filter(p => p.department === user.department || p.stream === user.stream));
      setStudents(studentRes.data);
    } catch (err) {
      console.error("Data Load Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleStatusUpdate = async (id, newStatus) => {
    if (!window.confirm(`Confirm ${newStatus}?`)) return;
    try {
      await API.put(`/exams/status/${id}`, { status: newStatus });
      fetchData();
    } catch (err) { alert("Action failed."); }
  };

  const qrValue = JSON.stringify({ department: user?.stream, roomNo, seed, type: "EXAM_ENTRY" });

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">HOD Command Center</h1>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">
              Stream: <span className="text-indigo-600">{user?.stream}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowQR(!showQR)} className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${showQR ? "bg-indigo-600 text-white shadow-lg" : "bg-amber-500 text-white"}`}>
              {showQR ? "Close QR" : "📷 Hall Entrance QR"}
            </button>
          </div>
        </div>

        {/* View Toggles */}
        {!showQR && (
          <div className="flex gap-2 mb-8 bg-slate-200/50 p-1.5 rounded-2xl w-fit">
            <button onClick={() => setViewMode("papers")} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${viewMode === "papers" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>EXAM PAPERS</button>
            <button onClick={() => setViewMode("students")} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${viewMode === "students" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>STUDENT INFO</button>
          </div>
        )}

        {showQR ? (
          <div className="flex flex-col items-center py-10">
            <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md border-t-[12px] border-indigo-600 flex flex-col items-center">
              <h3 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-tighter">Generate Hall Entry</h3>
              <input type="text" placeholder="Assign Room (e.g. Hall A)" className="w-full p-4 mb-6 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={roomNo} onChange={(e) => setRoomNo(e.target.value)} />
              {roomNo && (
                <div className="p-4 bg-white border-2 border-slate-100 rounded-3xl shadow-inner">
                  <QRCode value={qrValue} size={240} level="H" />
                  <div className="mt-6 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full transition-all duration-1000 ease-linear" style={{ width: `${(timeLeft / 30) * 100}%` }}></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : viewMode === "papers" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {papers.map((paper) => (
              <div key={paper._id} className="bg-white rounded-3xl shadow-sm p-6 border border-slate-200 flex flex-col hover:shadow-xl transition-all">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-black text-slate-800 leading-tight">{paper.title}</h3>
                  <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${paper.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : paper.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>{paper.status}</span>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Stream: {paper.stream}</p>
                <p className="text-xs text-slate-400 mb-6">Lecturer: {paper.uploadedBy?.name}</p>
                
                <div className="mt-auto flex flex-col gap-2">
                  <button 
                    onClick={() => handlePreview(paper._id)}
                    className="w-full bg-indigo-50 text-indigo-600 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all"
                  >
                    👁️ Preview Question Paper
                  </button>

                  {paper.status === "pending" && (
                    <div className="flex gap-2">
                      <button onClick={() => handleStatusUpdate(paper._id, "approved")} className="flex-1 bg-green-500 text-white py-3 rounded-xl text-[10px] font-black uppercase hover:bg-green-600 transition-colors">Approve</button>
                      <button onClick={() => handleStatusUpdate(paper._id, "rejected")} className="flex-1 bg-red-500 text-white py-3 rounded-xl text-[10px] font-black uppercase hover:bg-red-600 transition-colors">Reject</button>
                    </div>
                  )}

                  {paper.status === "approved" && (
                    <button 
                      onClick={() => setSelectedPaperForAttendance(paper._id)} 
                      className="w-full bg-slate-900 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200 hover:bg-slate-800 transition-colors"
                    >
                      📊 View Attendance
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b">
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="p-6">Student</th>
                  <th className="p-6">Roll No</th>
                  <th className="p-6">Email</th>
                  <th className="p-6">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-xs">{s.name ? s.name[0] : "?"}</div>
                        <span className="font-bold text-slate-800">{s.name}</span>
                      </div>
                    </td>
                    <td className="p-6 font-mono text-sm text-slate-500">{s.rollNo}</td>
                    <td className="p-6 text-slate-500 text-xs">{s.email}</td>
                    <td className="p-6">
                      <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase">Verified</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- ATTENDANCE MODAL --- */}
        {selectedPaperForAttendance && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-4xl rounded-[3rem] p-10 shadow-2xl animate-in zoom-in duration-300">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Live Monitor</h2>
                <button onClick={() => setSelectedPaperForAttendance(null)} className="bg-slate-100 p-2 rounded-full text-slate-400 hover:text-red-500 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <AttendanceTable paperId={selectedPaperForAttendance} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ApprovePapers;