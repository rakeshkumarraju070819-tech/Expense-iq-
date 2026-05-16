import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { verifyOTP } from "../api/auth.api";
import { sendOTP } from "../api/auth.api";
import { AuthCard, Logo, OTPInput } from "../components/ui";

export default function OTPPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const { phone, name, isLogin } = location.state || {};

  const [otp, setOtp] = useState("");
  const [seconds, setSeconds] = useState(30);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");

  // Redirect if arrived without state
  useEffect(() => {
    if (!phone) navigate("/login");
  }, [phone, navigate]);

  // Countdown timer
  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const handleVerify = async () => {
    if (otp.length < 6) { setError("Enter the 6-digit OTP"); return; }
    setError("");
    setLoading(true);
    try {
      const data = await verifyOTP(phone, otp);
      login(data.token, data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    try {
      await sendOTP(phone, name);
      setSeconds(30);
      setOtp("");
    } catch (err) {
      setError("Failed to resend OTP.");
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthCard>
      <Logo />
      <h1 className="text-2xl font-bold text-gray-800 text-center mb-1">Login to Your Account</h1>
      <p className="text-sm text-gray-400 text-center mb-6">Secure access using phone verification</p>

      {/* Phone display */}
      <div className="bg-indigo-50 rounded-xl p-4 text-center mb-6">
        <p className="text-sm text-gray-600 font-medium">OTP sent to {phone}</p>
        <Link
          to={isLogin ? "/login" : "/signup"}
          className="text-indigo-500 text-sm font-semibold hover:underline mt-1 block"
        >
          Change number
        </Link>
      </div>

      <p className="text-sm font-semibold text-gray-700 text-center mb-4">Enter 6-Digit OTP</p>
      <OTPInput value={otp} onChange={setOtp} />

      {error && <p className="text-red-500 text-xs text-center mt-3">{error}</p>}

      {/* Resend */}
      <p className="text-sm text-gray-400 text-center mt-4">
        {seconds > 0 ? (
          <>
            Resend OTP in{" "}
            <span className="text-orange-400 font-semibold">{seconds}s</span>
          </>
        ) : (
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-indigo-500 font-semibold hover:underline disabled:opacity-50"
          >
            {resending ? "Resending..." : "Resend OTP"}
          </button>
        )}
      </p>

      <button
        onClick={handleVerify}
        disabled={otp.length < 6 || loading}
        className="btn-primary mt-6"
      >
        {loading ? "Verifying..." : <>Verify & Login <span>→</span></>}
      </button>

      <p className="text-xs text-gray-300 text-center mt-4">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>
    </AuthCard>
  );
}
