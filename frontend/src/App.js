import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";

// Auth & Protection
import Register from "./components/Register";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import ForgotPassword from "./pages/ForgotPassword"; // ✅ Added
import ResetPassword from "./pages/ResetPassword"; // ✅ Added

// Pages
import StudentDashboard from "./pages/StudentDashboard";
import UploadPaper from "./pages/UploadPaper";
import ApprovePapers from "./pages/ApprovePapers";
import AdminDashboard from "./pages/AdminDashboard";
import ExamPage from "./pages/ExamPage";

/**
 * 🛠️ Functional Component: Navbar
 * Provides global logout and role-based navigation.
 * Mobile UI Optimization: Hide Navbar on Auth and Exam pages.
 */
const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user"));

  // Define paths where Navbar should be hidden
  const hideNavbarOn = ["/login", "/register", "/forgot-password", "/"];
  const isExamPage = location.pathname.startsWith("/exam/");
  const isResetPage = location.pathname.startsWith("/reset-password/");

  if (hideNavbarOn.includes(location.pathname) || isExamPage || isResetPage)
    return null;

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.navBrand}>
        ExamPortal <span style={styles.roleTag}>{user?.role}</span>
      </div>
      <div style={styles.navLinks}>
        {user?.role === "hod" && (
          <button onClick={() => navigate("/approve")} style={styles.navBtn}>
            HOD Center
          </button>
        )}
        {(user?.role === "lecturer" || user?.role === "hod") && (
          <button onClick={() => navigate("/upload")} style={styles.navBtn}>
            Upload
          </button>
        )}
        <button onClick={handleLogout} style={styles.logoutBtn}>
          Logout
        </button>
      </div>
    </nav>
  );
};

const App = () => {
  return (
    <Router>
      <div
        className="app-container"
        style={{ minHeight: "100vh", background: "#f8fafc" }}
      >
        <Navbar />

        <Routes>
          {/* Default Redirection */}
          <Route path="/" element={<Navigate to="/register" replace />} />

          {/* Public Auth Routes */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* 🎓 STUDENT ROUTES */}
          <Route
            path="/student"
            element={
              <ProtectedRoute
                key="student-dashboard"
                element={<StudentDashboard />}
                allowedRoles={["student"]}
              />
            }
          />

          <Route
            path="/exam/:id"
            element={
              <ProtectedRoute
                key="exam-interface"
                element={<ExamPage />}
                allowedRoles={["student"]}
              />
            }
          />

          {/* 📝 STAFF ROUTES */}
          <Route
            path="/upload"
            element={
              <ProtectedRoute
                key="upload-route"
                element={<UploadPaper />}
                allowedRoles={["lecturer", "hod"]}
              />
            }
          />

          {/* 🏛️ HOD ROUTES */}
          <Route
            path="/approve"
            element={
              <ProtectedRoute
                key="hod-command-center"
                element={<ApprovePapers />}
                allowedRoles={["hod"]}
              />
            }
          />

          {/* 👑 ADMIN ROUTES */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute
                key="admin-dashboard"
                element={<AdminDashboard />}
                allowedRoles={["admin"]}
              />
            }
          />

          {/* 🚫 404 & Conflict Resolution */}
          <Route
            path="*"
            element={
              <div style={styles.notFound}>
                <h2>404 - Access Denied 🚫</h2>
                <p style={{ fontSize: "14px", margin: "10px 0 20px" }}>
                  You don't have permission to view this page or it doesn't
                  exist.
                </p>
                <button
                  onClick={() => {
                    localStorage.clear();
                    window.location.href = "/login";
                  }}
                  style={styles.button}
                >
                  Return to Login
                </button>
              </div>
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 25px",
    background: "#fff",
    borderBottom: "1px solid #e2e8f0",
    position: "sticky",
    top: 0,
    zIndex: 1000,
  },
  navBrand: { fontWeight: "900", color: "#1e293b", fontSize: "18px" },
  roleTag: {
    fontSize: "10px",
    background: "#4f46e5",
    color: "#fff",
    padding: "2px 8px",
    borderRadius: "10px",
    marginLeft: "8px",
    textTransform: "uppercase",
  },
  navLinks: { display: "flex", gap: "10px" },
  navBtn: {
    background: "#f1f5f9",
    border: "none",
    padding: "8px 16px",
    borderRadius: "10px",
    fontWeight: "700",
    fontSize: "12px",
    cursor: "pointer",
  },
  logoutBtn: {
    background: "#fee2e2",
    color: "#ef4444",
    border: "none",
    padding: "8px 16px",
    borderRadius: "10px",
    fontWeight: "700",
    fontSize: "12px",
    cursor: "pointer",
  },
  notFound: {
    color: "#fff",
    textAlign: "center",
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    padding: "50px 30px",
    borderRadius: "32px",
    width: "90%",
    maxWidth: "420px",
    margin: "15vh auto",
    boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
    fontFamily: "'Inter', sans-serif",
  },
  button: {
    background: "#fff",
    color: "#4f46e5",
    padding: "14px 28px",
    borderRadius: "16px",
    border: "none",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "1px",
    cursor: "pointer",
    fontSize: "12px",
  },
};

export default App;
