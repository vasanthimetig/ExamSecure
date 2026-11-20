import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ element, allowedRoles }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  // 1. Check if session exists
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // 🕵️ DEBUG LOGS: Check these in your browser console (F12)
  console.log("Current User Role:", user.role);
  console.log("Allowed Roles for this page:", allowedRoles);

  /** * 🛠️ THE FIX: Standardize roles to lowercase to prevent "HOD" vs "hod" mismatch.
   * Your current code fails if one is uppercase and the other is lowercase.
   */
  const userRole = user.role.toLowerCase();
  const allowed = allowedRoles.map(role => role.toLowerCase());

  if (!allowed.includes(userRole)) {
    alert("Session expired or access denied. Redirecting to login...");
    // Clear potentially invalid session data to prevent loops
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

  // ✅ Authorized access
  return element;
};

export default ProtectedRoute;