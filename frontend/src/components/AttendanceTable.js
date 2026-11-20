import React, { useEffect, useState } from "react";
import axios from "axios";

const AttendanceTable = ({ paperId, token }) => {
  const [attendance, setAttendance] = useState([]);

  // 🛠️ USE YOUR LAPTOP IP FOR MOBILE TESTING
  const API_BASE_URL = "http://192.168.43.147:5000/api/exams";

  const fetchAttendance = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/attendance/${paperId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAttendance(res.data);
    } catch (err) {
      console.error("Error fetching attendance:", err);
    }
  };

  // 🚫 New function to block a student session
  const handleBlock = async (sessionId) => {
    if (!window.confirm("Are you sure you want to block this student?")) return;
    try {
      await axios.patch(
        `${API_BASE_URL}/block-session/${sessionId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchAttendance(); // Refresh table after blocking
    } catch (err) {
      alert("Failed to block student");
    }
  };

  useEffect(() => {
    fetchAttendance();
    const interval = setInterval(fetchAttendance, 10000); // Auto-refresh every 10s
    return () => clearInterval(interval);
  }, [paperId]);

  return (
    <div className="mt-6 bg-white rounded-2xl shadow-inner overflow-x-auto border border-gray-100">
      <table className="w-full text-left border-collapse min-w-[600px]">
        <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-widest">
          <tr>
            <th className="p-4">Student</th>
            <th className="p-4">Roll No</th>
            <th className="p-4">Started At</th>
            <th className="p-4">Status</th>
            <th className="p-4 text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {attendance.map((session) => {
            const isExpired = new Date() > new Date(session.endTime);
            const isBlocked = session.status === "Blocked";

            return (
              <tr
                key={session._id}
                className="hover:bg-indigo-50/30 transition"
              >
                <td className="p-4 font-bold text-slate-700">
                  {session.studentId?.name}
                </td>
                <td className="p-4 text-slate-500 font-mono text-sm">
                  {session.studentId?.rollNo}
                </td>
                <td className="p-4 text-xs text-slate-400">
                  {new Date(session.loginTime).toLocaleTimeString()}
                </td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      isBlocked
                        ? "bg-black text-white"
                        : isExpired
                        ? "bg-red-100 text-red-600"
                        : "bg-green-100 text-green-600 animate-pulse"
                    }`}
                  >
                    {isBlocked
                      ? "Blocked"
                      : isExpired
                      ? "Time Over"
                      : "Writing"}
                  </span>
                </td>
                <td className="p-4 text-center">
                  {!isBlocked && !isExpired && (
                    <button
                      onClick={() => handleBlock(session._id)}
                      className="bg-red-500 text-white text-[10px] px-3 py-1 rounded-md font-bold hover:bg-red-700"
                    >
                      Block
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {attendance.length === 0 && (
        <p className="p-10 text-center text-slate-400 italic text-sm">
          No students have joined this exam yet.
        </p>
      )}
    </div>
  );
};

export default AttendanceTable;
