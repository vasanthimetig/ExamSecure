import axios from "axios";

const API = axios.create({
  // ✅ Hardcoded your Local IP so the mobile app can find the server
  // Change "5000" if your backend is running on a different port
  baseURL: "http://192.168.43.147:5000/api",
});

// 1. Request Interceptor: Automatically attach token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. Response Interceptor: Global Error Handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      alert("Session expired or access denied. Redirecting to login...");
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default API;
