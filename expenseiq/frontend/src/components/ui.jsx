import { useRef } from "react";

// ── Logo ──────────────────────────────────────────────────────────────────────
export function Logo() {
  return (
    <div className="flex items-center gap-2 justify-center mb-6">
      <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center shadow-md shadow-indigo-200">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
        </svg>
      </div>
      <span className="text-xl font-bold text-gray-800">ExpenseIQ</span>
    </div>
  );
}

// ── Auth Card wrapper ─────────────────────────────────────────────────────────
export function AuthCard({ children }) {
  return (
    <div className="min-h-screen bg-dark flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">{children}</div>
      <p className="text-gray-500 text-sm mt-6">Smart Personal Finance & Investment Management</p>
    </div>
  );
}

// ── Google Button ─────────────────────────────────────────────────────────────
export function GoogleBtn({ onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 px-4 bg-white hover:bg-gray-50 transition font-medium text-gray-700 text-sm shadow-sm disabled:opacity-50"
    >
      <svg width="18" height="18" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.7 0 6.7 1.3 9.1 3.4l6.8-6.8C35.8 2.5 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.2 17.8 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17z" />
        <path fill="#FBBC05" d="M10.6 28.6A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.1.7-4.6L2.3 13.3A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.7 10.7l7.9-6.1z" />
        <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.2 1.5-5 2.3-8.4 2.3-6.2 0-11.5-3.7-13.4-9.1l-7.9 6.1C6.6 42.6 14.6 48 24 48z" />
      </svg>
      {loading ? "Connecting..." : "Continue with Google"}
    </button>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ label = "or continue with phone" }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-gray-100" />
      <span className="text-xs text-gray-400">{label}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

// ── Country Code Select + Phone ───────────────────────────────────────────────
const COUNTRY_CODES = [
  { code: "IN", dial: "+91" },
  { code: "US", dial: "+1" },
  { code: "GB", dial: "+44" },
  { code: "AE", dial: "+971" },
  { code: "SG", dial: "+65" },
];

export function PhoneInput({ phone, onPhoneChange, country, onCountryChange }) {
  return (
    <div className="flex gap-2">
      <select
        value={country}
        onChange={(e) => onCountryChange(e.target.value)}
        className="border border-gray-200 rounded-xl px-3 py-3 text-sm font-medium text-gray-700 bg-white focus:outline-none focus:border-indigo-400 cursor-pointer"
      >
        {COUNTRY_CODES.map((c) => (
          <option key={c.code} value={c.dial}>
            {c.code} {c.dial}
          </option>
        ))}
      </select>
      <input
        type="tel"
        placeholder="Enter 10-digit number"
        value={phone}
        onChange={(e) => onPhoneChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
        className="flex-1 input-field"
      />
    </div>
  );
}

// ── OTP Input (6 boxes) ───────────────────────────────────────────────────────
export function OTPInput({ value, onChange }) {
  const inputs = useRef([]);
  const digits = value.split("").concat(Array(6).fill("")).slice(0, 6);

  const handleKey = (e, i) => {
    if (e.key === "Backspace") {
      const next = [...digits];
      next[i] = "";
      onChange(next.join("").trim());
      if (i > 0) inputs.current[i - 1]?.focus();
    } else if (/^\d$/.test(e.key)) {
      const next = [...digits];
      next[i] = e.key;
      onChange(next.join("").trim());
      if (i < 5) inputs.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={() => {}}
          onKeyDown={(e) => handleKey(e, i)}
          onPaste={handlePaste}
          className="w-11 h-12 text-center text-lg font-semibold border-2 rounded-xl focus:outline-none focus:border-indigo-400 bg-white text-gray-800 border-gray-200 transition"
        />
      ))}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = "sm" }) {
  const s = size === "sm" ? "w-4 h-4" : "w-8 h-8";
  return <div className={`${s} border-2 border-white border-t-transparent rounded-full animate-spin`} />;
}
