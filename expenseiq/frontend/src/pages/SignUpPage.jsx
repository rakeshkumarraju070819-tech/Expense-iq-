import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { registerWithPassword, googleLogin, sendOTP, verifyOTP } from "../api/auth.api";
import { AuthCard, Logo, Divider, PhoneInput, OTPInput } from "../components/ui";
import { GoogleLogin } from "@react-oauth/google";

const EyeOpen = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const EyeOff = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

export default function SignUpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const googlePrefilledEmail = location.state?.googleEmail || "";
  const isGoogleEmail = !!googlePrefilledEmail;

  const [name, setName]                 = useState("");
  const [email, setEmail]               = useState(googlePrefilledEmail);
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone]               = useState("");
  const [country, setCountry]           = useState("+91");
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");

  // OTP flow states
  const [showOTP, setShowOTP]           = useState(false);
  const [otp, setOtp]                   = useState("");
  const [seconds, setSeconds]           = useState(0);
  const [verifying, setVerifying]       = useState(false);
  const [resending, setResending]       = useState(false);

  // Countdown timer for Resend OTP
  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const fullPhone = country + phone;
  const canSubmit = name.trim() && email.trim() && password.length >= 6 && phone.length === 10 && !loading;

  // Mask email for user privacy
  const maskEmail = (val) => {
    const parts = val.split("@");
    if (parts.length !== 2) return val;
    const n = parts[0];
    const d = parts[1];
    return n[0] + "*".repeat(Math.max(n.length - 1, 5)) + "@" + d;
  };

  // ── Step 1: Request OTP ──────────────────────────────────────────────────────
  const handleSignUp = async () => {
    if (!name.trim())        { setError("Please enter your full name"); return; }
    if (!email.trim())       { setError("Please enter your email address"); return; }
    
    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }
    
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (phone.length !== 10) { setError("Enter a valid 10-digit phone number"); return; }

    setError("");
    setLoading(true);
    try {
      console.log("[SignUpPage] Requesting OTP send...");
      const data = await sendOTP(email.trim().toLowerCase());
      if (data?.success) {
        console.log("[SignUpPage] OTP sent successfully");
        setShowOTP(true);
        setSeconds(30);
      } else {
        setError(data?.message || "Unable to send OTP. Please try again.");
      }
    } catch (err) {
      console.error("[SignUpPage] OTP request failed:", err);
      const msg = err?.response?.data?.message;
      if (err?.code === "ERR_NETWORK") {
        setError("Can't reach the server. Is the backend running?");
      } else {
        setError(msg || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP + Register Account ─────────────────────────
  const handleVerifyOTP = async () => {
    if (otp.length < 6) {
      setError("Please enter the 6-digit OTP");
      return;
    }

    setError("");
    setVerifying(true);
    try {
      console.log("[SignUpPage] Verifying OTP...");
      const verifyRes = await verifyOTP(email.trim().toLowerCase(), otp);
      if (!verifyRes?.success) {
        setError(verifyRes?.message || "Invalid OTP");
        setOtp(""); // Clear incorrect OTP
        setVerifying(false);
        return;
      }

      console.log("[SignUpPage] OTP verified successfully. Completing account registration...");
      const regRes = await registerWithPassword({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: fullPhone,
      });

      if (!regRes?.success) {
        setError(regRes?.message || "Could not create account. Try again.");
        setVerifying(false);
        return;
      }

      console.log("[SignUpPage] Account created successfully");
      login(regRes.token, regRes.user);
      navigate("/dashboard");
    } catch (err) {
      console.error("[SignUpPage] Verification/registration failed:", err);
      const msg = err?.response?.data?.message;
      setError(msg || "Something went wrong. Please try again.");
      setOtp(""); // Clear incorrect OTP on failure
    } finally {
      setVerifying(false);
    }
  };

  // ── Step 3: Resend OTP ───────────────────────────────────────────────────────
  const handleResendOTP = async () => {
    setResending(true);
    setError("");
    try {
      console.log("[SignUpPage] Resending OTP...");
      const data = await sendOTP(email.trim().toLowerCase());
      if (data?.success) {
        console.log("[SignUpPage] OTP resent successfully");
        setSeconds(30);
        setOtp("");
      } else {
        setError(data?.message || "Failed to resend OTP.");
      }
    } catch (err) {
      console.error("[SignUpPage] Resend OTP failed:", err);
      setError(err?.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setResending(false);
    }
  };

  // ── Google sign-up ────────────────────────────────────────────────────────────
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const data = await googleLogin({ credential: credentialResponse.credential });
      if (data?.success) {
        if (data.exists) {
          login(data.token, data.user);
          navigate("/dashboard");
        } else {
          // It's a new account, pre-fill email
          setEmail(data.email);
        }
      } else {
        setError(data?.message || "Google sign-up failed. Try again.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Google sign-up failed. Try again.");
    }
  };

  if (showOTP) {
    return (
      <>
        <AuthCard>
          <Logo />
          <h1 className="text-2xl font-bold text-gray-800 text-center mb-1">Verify Your Email</h1>
          <p className="text-sm text-gray-400 text-center mb-6">We've sent a 6-digit OTP to</p>

          {/* Email display and edit option */}
          <div className="bg-indigo-50 rounded-xl p-4 text-center mb-6">
            <p className="text-sm text-gray-700 font-semibold">{maskEmail(email)}</p>
            {!isGoogleEmail && (
              <button
                onClick={() => { setShowOTP(false); setOtp(""); setError(""); }}
                className="text-indigo-500 text-xs font-semibold hover:underline mt-1 block w-full text-center"
              >
                Change email
              </button>
            )}
          </div>

          <p className="text-sm font-semibold text-gray-700 text-center mb-4">Enter 6-Digit OTP</p>
          <OTPInput value={otp} onChange={setOtp} />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mt-4">
              <p className="text-red-500 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Resend Action */}
          <p className="text-sm text-gray-400 text-center mt-6">
            {seconds > 0 ? (
              <>
                Didn't receive the code? Resend in{" "}
                <span className="text-orange-400 font-semibold">{seconds}s</span>
              </>
            ) : (
              <button
                onClick={handleResendOTP}
                disabled={resending}
                className="text-indigo-500 font-semibold hover:underline disabled:opacity-50"
              >
                {resending ? "Resending..." : "Resend OTP"}
              </button>
            )}
          </p>

          <button
            onClick={handleVerifyOTP}
            disabled={otp.length < 6 || verifying}
            className="btn-primary mt-6"
          >
            {verifying ? (
              <span className="flex items-center gap-2 justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying...
              </span>
            ) : <>Verify OTP <span>→</span></>}
          </button>
        </AuthCard>
      </>
    );
  }

  return (
    <>
      <AuthCard>
        <Logo />
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-1">Create Your Account</h1>
        <p className="text-sm text-gray-400 text-center mb-6">Join ExpenseIQ to manage your finances</p>

        {!isGoogleEmail && (
          <>
            <div className="flex justify-center mb-6">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  setError("Google authentication failed");
                }}
                text="signup_with"
                width="100%"
              />
            </div>
            <Divider label="or sign up with details" />
          </>
        )}

        {/* Full Name */}
        <label className="text-sm font-medium text-gray-600 mb-2 block">Full Name</label>
        <input
          type="text"
          placeholder="Enter your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-field mb-4"
          autoComplete="name"
        />

        {/* Email */}
        <label className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
          Email Address
          {isGoogleEmail && (
            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold">
              Verified by Google
            </span>
          )}
        </label>
        <input
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => !isGoogleEmail && setEmail(e.target.value)}
          readOnly={isGoogleEmail}
          className={`input-field mb-4 ${isGoogleEmail ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
          autoComplete="email"
        />

        {/* Password */}
        <label className="text-sm font-medium text-gray-600 mb-2 block">Password</label>
        <div className="relative mb-4">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Create a password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field pr-12"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
          >
            {showPassword ? <EyeOff /> : <EyeOpen />}
          </button>
        </div>

        {/* Phone */}
        <label className="text-sm font-medium text-gray-600 mb-2 block">Phone Number</label>
        <PhoneInput
          phone={phone}
          onPhoneChange={setPhone}
          country={country}
          onCountryChange={setCountry}
        />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mt-3">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleSignUp}
          disabled={!canSubmit}
          className="btn-primary mt-4"
        >
          {loading ? (
            <span className="flex items-center gap-2 justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Sending OTP...
            </span>
          ) : <>Create Account <span>→</span></>}
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-500 font-semibold hover:underline">Login</Link>
        </p>
        <p className="text-xs text-gray-300 text-center mt-3">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </AuthCard>
    </>
  );
}
