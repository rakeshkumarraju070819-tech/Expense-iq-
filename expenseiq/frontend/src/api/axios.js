import axios from "axios";

const defaultBaseUrl = import.meta.env.PROD ? "https://expense-iq-7o2i.onrender.com/api" : "/api";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : defaultBaseUrl,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("expenseiq_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear token and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("expenseiq_token");
      localStorage.removeItem("expenseiq_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
