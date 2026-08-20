import api from "./axios";

// ── OTP flow (used from SignUp → OTP page if needed) ──────────────────────────
export const sendOTP = (email) =>
  api.post("/auth/send-otp", { email }).then((r) => r.data);

export const verifyOTP = (email, otp) =>
  api.post("/auth/verify-otp", { email, otp }).then((r) => r.data);

// ── Username + Password login ─────────────────────────────────────────────────
export const loginWithPassword = (username, password) =>
  api.post("/auth/login", { username, password }).then((r) => r.data);

// ── Username + Password register (with phone & email) ─────────────────────────
export const registerWithPassword = ({ name, email, password, phone }) =>
  api.post("/auth/register", { name, email, password, phone }).then((r) => r.data);

// ── Google OAuth ──────────────────────────────────────────────────────────────
export const googleLogin = (payload) =>
  api.post("/auth/google", payload).then((r) => r.data);

// ── Get current user ──────────────────────────────────────────────────────────
export const getMe = () =>
  api.get("/auth/me").then((r) => r.data);
