import React, { useEffect, useState } from "react";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";
import { useNavigate } from "react-router-dom"; // Added for better navigation

const LecturerDashboard = () => {
  const [papers, setPapers] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedQR, setSelectedQR] = useState(null);

  const navigate = useNavigate();

  // 🛠️ USE YOUR LAPTOP IP FOR MOBILE TESTING
  const API_BASE_URL = "http://192.168.43.147:5000/api/exams";

  useEffect(() => {
    const fetchPapers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/mypapers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPapers(res.data);
      } catch (err) {
        setMessage("❌ Failed to load your papers");
      } finally {
        setLoading(false);
      }
    };
    fetchPapers();
  }, [API_BASE_URL]);

  // Function to show QR for an approved paper
  const handleGenerateQR = (paperId) => {
    setSelectedQR(paperId);
  };

  if (loading)
    return <h3 style={{ textAlign: "center" }}>Loading your dashboard...</h3>;

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>🧑‍🏫 Lecturer Dashboard</h2>
      <p style={{ color: "#666" }}>
        Manage your uploads and generate Exam QR codes for students.
      </p>

      {message && <p style={{ color: "red", fontWeight: "bold" }}>{message}</p>}

      {/* --- QR Code Modal/Section --- */}
      {selectedQR && (
        <div
          style={{
            background: "#fff",
            padding: "20px",
            border: "2px solid #333",
            borderRadius: "10px",
            marginBottom: "20px",
            textAlign: "center",
            boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Exam QR Code</h3>
          <QRCodeCanvas value={selectedQR} size={200} />
          <p style={{ margin: "10px 0" }}>
            <strong>Paper ID:</strong> {selectedQR}
          </p>
          <p style={{ color: "#555" }}>Scan this to start the exam</p>
          <button
            onClick={() => setSelectedQR(null)}
            style={{
              padding: "8px 16px",
              background: "#f44336",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Close QR
          </button>
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table
          border="1"
          width="100%"
          cellPadding="10"
          style={{ borderCollapse: "collapse", minWidth: "600px" }}
        >
          <thead>
            <tr style={{ backgroundColor: "#eee" }}>
              <th>Title</th>
              <th>Stream</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {papers.length > 0 ? (
              papers.map((p) => (
                <tr key={p._id}>
                  <td>{p.title}</td>
                  <td>{p.stream}</td>
                  <td>{p.durationMins}m</td>
                  <td
                    style={{
                      fontWeight: "bold",
                      color:
                        p.status === "approved"
                          ? "green"
                          : p.status === "rejected"
                          ? "red"
                          : "orange",
                    }}
                  >
                    {p.status.toUpperCase()}
                  </td>
                  <td>
                    {p.status === "approved" ? (
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          onClick={() => handleGenerateQR(p._id)}
                          style={{
                            backgroundColor: "#4CAF50",
                            color: "white",
                            cursor: "pointer",
                            border: "none",
                            padding: "8px 12px",
                            borderRadius: "4px",
                          }}
                        >
                          Generate QR
                        </button>
                        <button
                          onClick={() => navigate(`/attendance/${p._id}`)}
                          style={{
                            backgroundColor: "#2196F3",
                            color: "white",
                            cursor: "pointer",
                            border: "none",
                            padding: "8px 12px",
                            borderRadius: "4px",
                          }}
                        >
                          Monitor
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: "13px", color: "#888" }}>
                        {p.status === "pending"
                          ? "Awaiting HOD Approval"
                          : "Paper Rejected"}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  style={{ textAlign: "center", padding: "20px" }}
                >
                  No papers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LecturerDashboard;
