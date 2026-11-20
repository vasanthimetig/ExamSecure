import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

const HodDashboard = () => {
  const [papers, setPapers] = useState([]);
  const [pendingOnly, setPendingOnly] = useState(true);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(null);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // 🛠️ USE YOUR LAPTOP IP FOR MOBILE TESTING
  const API_BASE_URL = "http://192.168.43.147:5000/api/exams";

  const fetchPapers = useCallback(async () => {
    try {
      setLoading(true);
      // HODs see papers for their specific stream/department
      const url = pendingOnly
        ? `${API_BASE_URL}/pending`
        : `${API_BASE_URL}/all`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPapers(res.data);
    } catch (err) {
      setMessage("❌ Failed to load papers. Check if server is running.");
    } finally {
      setLoading(false);
    }
  }, [pendingOnly, token, API_BASE_URL]);

  useEffect(() => {
    fetchPapers();
  }, [fetchPapers]);

  const handleAction = async (id, statusUpdate) => {
    try {
      // Logic: HOD updates paper status (approved/rejected)
      await axios.put(
        `${API_BASE_URL}/status/${id}`,
        { status: statusUpdate },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchPapers(); // Refresh list after approval/rejection
    } catch {
      alert("Status update failed");
    }
  };

  const handleDownload = async (id, title) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/download/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${title}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert("Download failed");
    }
  };

  if (loading)
    return (
      <h3 style={{ textAlign: "center", marginTop: "50px" }}>
        Loading Dashboard...
      </h3>
    );

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <header style={{ borderBottom: "2px solid #eee", marginBottom: "20px" }}>
        <h2>🎓 HOD Dashboard</h2>
        <p>
          <strong>Stream:</strong> {user.stream || "Not Assigned"}
        </p>
      </header>

      <div
        style={{
          marginBottom: "20px",
          background: "#f4f4f4",
          padding: "10px",
          borderRadius: "5px",
        }}
      >
        <label style={{ cursor: "pointer", fontWeight: "bold" }}>
          <input
            type="checkbox"
            checked={pendingOnly}
            onChange={() => setPendingOnly(!pendingOnly)}
          />{" "}
          Show Only Pending Approvals
        </label>
      </div>

      {message && <p style={{ color: "red", fontWeight: "bold" }}>{message}</p>}

      <div style={{ display: "grid", gap: "15px" }}>
        {papers.length > 0 ? (
          papers.map((p) => (
            <div
              key={p._id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "15px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              }}
            >
              <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>{p.title}</h4>
              <p style={{ margin: "5px 0" }}>
                <strong>Lecturer:</strong> {p.uploadedBy?.name || "Unknown"}
              </p>
              <p style={{ margin: "5px 0" }}>
                <strong>Status:</strong>
                <span
                  style={{
                    marginLeft: "5px",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    backgroundColor:
                      p.status === "approved"
                        ? "#d4edda"
                        : p.status === "pending"
                        ? "#fff3cd"
                        : "#f8d7da",
                    color:
                      p.status === "approved"
                        ? "#155724"
                        : p.status === "pending"
                        ? "#856404"
                        : "#721c24",
                  }}
                >
                  {p.status.toUpperCase()}
                </span>
              </p>

              <div
                style={{
                  marginTop: "15px",
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() => setPreview(p._id)}
                  style={{ padding: "8px 12px", cursor: "pointer" }}
                >
                  👁 Preview
                </button>

                <button
                  onClick={() => handleDownload(p._id, p.title)}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  📥 Download
                </button>

                {p.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleAction(p._id, "approved")}
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => handleAction(p._id, "rejected")}
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      ❌ Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <p style={{ textAlign: "center", color: "#666" }}>
            No question papers found for your stream.
          </p>
        )}
      </div>

      {preview && (
        <div
          style={{
            marginTop: "30px",
            padding: "20px",
            border: "2px solid #333",
            borderRadius: "10px",
            background: "#fff",
            position: "relative",
          }}
        >
          <button
            onClick={() => setPreview(null)}
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              padding: "5px 10px",
              background: "red",
              color: "white",
              border: "none",
              borderRadius: "5px",
            }}
          >
            Close Preview
          </button>
          <h3 style={{ marginTop: "0" }}>File Preview</h3>
          <iframe
            src={`${API_BASE_URL}/preview/${preview}`}
            width="100%"
            height="600px"
            title="paper-preview"
            style={{ border: "1px solid #ccc" }}
          />
        </div>
      )}
    </div>
  );
};

export default HodDashboard;
