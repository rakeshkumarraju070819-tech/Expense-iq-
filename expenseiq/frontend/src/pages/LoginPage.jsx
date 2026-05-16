import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth, getLocalUsers, makeToken } from "../context/AuthContext";
import { AuthCard, Logo, GoogleBtn, Divider } from "../components/ui";
import GoogleAccountPicker from "../components/GoogleAccountPicker";

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

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showGooglePicker, setShowGooglePicker] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (!username.trim()) { setError("Please enter your username"); return; }
    if (!password) { setError("Please enter your password"); return; }
    setError("");
    setLoading(true);

    setTimeout(() => {
      const users = getLocalUsers();
      const found = users.find(
        (u) => u.username === username.trim().toLowerCase() && u.password === password
      );
      setLoading(false);
      if (!found) { setError("Invalid username or password."); return; }
      const { password: _pw, ...safeUser } = found;
      login(makeToken(found.id), safeUser);
      navigate("/dashboard");
    }, 600);
  };

  const handleGoogleSelect = (account) => {
    setShowGooglePicker(false);
    const users = getLocalUsers();
    let existing = users.find(
      (u) => u.googleId === account.googleId || u.email === account.email
    );
    if (!existing) {
      existing = {
        id: "g_" + Date.now(),
        name: account.name,
        email: account.email,
        googleId: account.googleId,
        avatar: account.avatar,
        color: account.color,
        username: account.email.split("@")[0],
        monthlyBudget: 10000,
        dailyBudget: 400,
      };
      users.push(existing);
      localStorage.setItem("expenseiq_users", JSON.stringify(users));
    }
    const { password: _pw, ...safeUser } = existing;
    login(makeToken(existing.id), safeUser);
    navigate("/dashboard");
  };

  return (
    <>
      <AuthCard>
        <Logo />
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-1">Login to Your Account</h1>
        <p className="text-sm text-gray-400 text-center mb-6">Welcome back to ExpenseIQ</p>

        <GoogleBtn onClick={() => { setError(""); setShowGooglePicker(true); }} />
        <Divider label="or login with credentials" />

        <label className="text-sm font-medium text-gray-600 mb-2 block">Username</label>
        <input
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          className="input-field mb-4"
          autoComplete="username"
        />

        <label className="text-sm font-medium text-gray-600 mb-2 block">Password</label>
        <div className="relative mb-2">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="input-field pr-12"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
          >
            {showPassword ? <EyeOff /> : <EyeOpen />}
          </button>
        </div>

        <div className="flex justify-end mb-4">
          <button className="text-xs text-indigo-500 hover:underline">Forgot password?</button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={!username.trim() || !password || loading}
          className="btn-primary"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Logging in...
            </span>
          ) : <>Login <span>→</span></>}
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">
          Don't have an account?{" "}
          <Link to="/signup" className="text-indigo-500 font-semibold hover:underline">Sign Up</Link>
        </p>
        <p className="text-xs text-gray-300 text-center mt-3">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </AuthCard>

      {showGooglePicker && (
        <GoogleAccountPicker onSelect={handleGoogleSelect} onClose={() => setShowGooglePicker(false)} />
      )}
    </>
  );
}
