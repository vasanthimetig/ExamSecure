import React, { useState, useEffect } from "react";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";
import { useNavigate } from "react-router-dom";

const UploadPaper = () => {
  const [formData, setFormData] = useState({
    title: "",
    stream: "",
    durationMins: "",
    file: null,
  });
  const [myPapers, setMyPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // QR, Security & Timer States
  const [selectedQR, setSelectedQR] = useState(null);
  const [qrSalt, setQrSalt] = useState(Date.now());
  const [manualClassroom, setManualClassroom] = useState("");
  const [isClassSet, setIsClassSet] = useState(false); // Mode: Type vs QR
  const [timeLeft, setTimeLeft] = useState(30);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  const API_BASE_URL = "http://192.168.43.147:5000/api/exams";

  const fetchMyPapers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/mypapers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyPapers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setMessage("❌ Failed to load papers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPapers();
  }, [token]);

  // ⏱️ 30-SECOND DYNAMIC QR REFRESH & PROGRESS BAR LOGIC
  useEffect(() => {
    let interval;
    if (selectedQR && isClassSet) {
      setTimeLeft(30);
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setQrSalt(Date.now()); // Changes the QR Pattern securely
            return 30; // Reset bar
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      clearInterval(interval);
      if (!selectedQR) {
        setIsClassSet(false);
        setManualClassroom("");
      }
    };
  }, [selectedQR, isClassSet]);

  const handlePreview = async (paperId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/preview/${paperId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const fileURL = URL.createObjectURL(
        new Blob([response.data], { type: response.headers["content-type"] })
      );
      window.open(fileURL, "_blank");
      setTimeout(() => URL.revokeObjectURL(fileURL), 1000);
    } catch (err) {
      alert("Preview failed. Ensure file exists on server.");
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({ ...prev, [name]: files ? files[0] : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach((key) => data.append(key, formData[key]));
    try {
      await axios.post(`${API_BASE_URL}/upload`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setMessage("✅ Paper uploaded successfully!");
      fetchMyPapers();
      setFormData({ title: "", stream: "", durationMins: "", file: null });
    } catch (err) {
      setMessage("❌ Failed to upload paper");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this paper?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMyPapers();
    } catch (err) {
      alert("Delete failed");
    }
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        Loading Dashboard...
      </div>
    );

  return (
    <div style={styles.container}>
      <h2 style={{ color: "#4b0082" }}>📄 Lecturer Dashboard</h2>
      <div style={styles.userInfo}>
        <p>
          Welcome, <b>{user?.name}</b> | Stream: <b>{user?.stream}</b>
        </p>
      </div>

      {/* 🛡️ DYNAMIC QR POPUP WITH MANUAL ENTRY & BLUE PROGRESS BAR */}
      {selectedQR && (
        <div style={styles.qrPopup}>
          <div style={styles.qrContent}>
            <h3 style={{ color: "#4b0082", marginBottom: "15px" }}>
              Secure Exam Entry
            </h3>

            {!isClassSet ? (
              /* MODE 1: Manual Typing Room Name */
              <div style={{ padding: "10px" }}>
                <p style={{ fontSize: "14px", marginBottom: "10px" }}>
                  Enter Room Name / Number:
                </p>
                <input
                  type="text"
                  placeholder="e.g. Room 302, Hall A"
                  value={manualClassroom}
                  onChange={(e) => setManualClassroom(e.target.value)}
                  style={{
                    ...styles.input,
                    width: "100%",
                    boxSizing: "border-box",
                    marginBottom: "15px",
                  }}
                />
                <button
                  onClick={() => manualClassroom && setIsClassSet(true)}
                  style={{ ...styles.button, width: "100%" }}
                >
                  Generate QR for Room
                </button>
              </div>
            ) : (
              /* MODE 2: QR Code & Blue Progress Bar Tracker */
              <>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: "bold",
                    margin: "0 0 10px 0",
                  }}
                >
                  Classroom:{" "}
                  <span style={{ color: "#4b0082" }}>{manualClassroom}</span>
                </p>

                {/* 🔵 Blue Progress Bar Tracking 30s Countdown */}
                <div style={styles.progressContainer}>
                  <div
                    style={{
                      ...styles.progressBar,
                      width: `${(timeLeft / 30) * 100}%`,
                      transition: "width 1s linear",
                    }}
                  ></div>
                </div>
                <p
                  style={{
                    fontSize: "10px",
                    color: "#666",
                    marginBottom: "15px",
                  }}
                >
                  Security refresh in {timeLeft}s
                </p>

                <QRCodeCanvas
                  value={`${selectedQR._id}_${manualClassroom}_${qrSalt}`}
                  size={240}
                  level="H"
                  includeMargin={true}
                />

                <button
                  onClick={() => setIsClassSet(false)}
                  style={styles.changeBtn}
                >
                  Change Room Name
                </button>
              </>
            )}

            <button onClick={() => setSelectedQR(null)} style={styles.closeBtn}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Upload Form */}
      <form onSubmit={handleSubmit} style={styles.form}>
        <h3 style={{ fontSize: "16px", marginBottom: "10px" }}>
          Upload New Paper
        </h3>
        <input
          type="text"
          name="title"
          placeholder="Paper Title"
          value={formData.title}
          onChange={handleChange}
          required
          style={styles.input}
        />
        <select
          name="stream"
          value={formData.stream}
          onChange={handleChange}
          required
          style={styles.input}
        >
          <option value="">Select Stream</option>
          <option value="CSE">CSE</option>
          <option value="ECE">ECE</option>
          <option value="ME">Mechanical</option>
          <option value="CE">Civil</option>
        </select>
        <input
          type="number"
          name="durationMins"
          placeholder="Duration (Mins)"
          value={formData.durationMins}
          onChange={handleChange}
          required
          style={styles.input}
        />
        <input
          type="file"
          name="file"
          accept=".pdf,image/*"
          onChange={handleChange}
          required
          style={styles.input}
        />
        <button type="submit" style={styles.button}>
          Upload Question Paper
        </button>
      </form>

      {message && (
        <p
          style={{
            fontWeight: "bold",
            color: message.includes("✅") ? "#28a745" : "#dc3545",
            textAlign: "center",
          }}
        >
          {message}
        </p>
      )}

      <h3
        style={{
          marginTop: "30px",
          borderBottom: "2px solid #ddd",
          paddingBottom: "10px",
        }}
      >
        📚 Your Submissions
      </h3>
      <div style={styles.grid}>
        {myPapers.map((paper) => (
          <div key={paper._id} style={styles.card}>
            <h4 style={{ margin: 0 }}>{paper.title}</h4>
            <p style={{ fontSize: "12px", color: "#666" }}>
              {paper.stream} | {paper.durationMins} mins
            </p>
            <p style={{ fontSize: "13px", margin: "10px 0" }}>
              Status:{" "}
              <span
                style={{
                  color:
                    paper.status === "approved"
                      ? "#28a745"
                      : paper.status === "rejected"
                      ? "#dc3545"
                      : "#fd7e14",
                  fontWeight: "900",
                }}
              >
                {paper.status.toUpperCase()}
              </span>
            </p>
            <div style={styles.actionArea}>
              <button
                onClick={() => handlePreview(paper._id)}
                style={styles.previewBtn}
              >
                👁️ Preview
              </button>
              {paper.status === "approved" && (
                <>
                  <button
                    onClick={() => setSelectedQR(paper)}
                    style={styles.qrBtn}
                  >
                    📱 QR Code
                  </button>
                  <button
                    onClick={() => navigate(`/attendance/${paper._id}`)}
                    style={styles.monitorBtn}
                  >
                    📊 Monitor
                  </button>
                </>
              )}
              {paper.status === "pending" && (
                <button
                  onClick={() => handleDelete(paper._id)}
                  style={styles.deleteBtn}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "30px",
    backgroundColor: "#f8f9fa",
    minHeight: "100vh",
    fontFamily: "sans-serif",
  },
  userInfo: { marginBottom: "20px" },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    width: "100%",
    maxWidth: "400px",
    margin: "0 auto 20px auto",
    padding: "20px",
    background: "#fff",
    borderRadius: "15px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
  },
  input: { padding: "10px", border: "1px solid #ddd", borderRadius: "8px" },
  button: {
    padding: "12px",
    backgroundColor: "#4b0082",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "20px",
  },
  card: {
    background: "#fff",
    padding: "20px",
    borderRadius: "15px",
    border: "1px solid #eee",
    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
  },
  actionArea: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "15px",
  },
  previewBtn: {
    backgroundColor: "#e7f1ff",
    color: "#0d6efd",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    fontWeight: "bold",
    fontSize: "11px",
    cursor: "pointer",
  },
  qrBtn: {
    backgroundColor: "#d4edda",
    color: "#155724",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    fontWeight: "bold",
    fontSize: "11px",
    cursor: "pointer",
  },
  monitorBtn: {
    backgroundColor: "#cce5ff",
    color: "#004085",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    fontWeight: "bold",
    fontSize: "11px",
    cursor: "pointer",
  },
  deleteBtn: {
    backgroundColor: "#fff5f5",
    color: "#e03131",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    fontWeight: "bold",
    fontSize: "11px",
    cursor: "pointer",
  },
  qrPopup: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  qrContent: {
    background: "#fff",
    padding: "30px",
    borderRadius: "20px",
    width: "320px",
    textAlign: "center",
    border: "4px solid #4b0082",
  },
  progressContainer: {
    width: "100%",
    height: "8px",
    backgroundColor: "#eee",
    borderRadius: "10px",
    overflow: "hidden",
    marginBottom: "5px",
  },
  progressBar: { height: "100%", backgroundColor: "#0d6efd" },
  changeBtn: {
    marginTop: "10px",
    display: "block",
    width: "100%",
    fontSize: "11px",
    color: "#0d6efd",
    background: "none",
    border: "none",
    cursor: "pointer",
    textDecoration: "underline",
  },
  closeBtn: {
    marginTop: "20px",
    width: "100%",
    padding: "10px",
    backgroundColor: "#dc3545",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};

export default UploadPaper;
