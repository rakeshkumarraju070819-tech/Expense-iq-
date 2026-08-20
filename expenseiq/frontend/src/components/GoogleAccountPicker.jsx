import { useState, useEffect } from "react";

// Simulated Google accounts stored in localStorage to persist across sessions
const STORAGE_KEY = "expenseiq_google_accounts";

const DEFAULT_ACCOUNTS = [
  {
    googleId: "google_uid_001",
    name: "Rahul Sharma",
    email: "rahul.sharma@gmail.com",
    avatar: "RS",
    color: "#4285F4",
  },
  {
    googleId: "google_uid_002",
    name: "Priya Nair",
    email: "priya.nair@gmail.com",
    avatar: "PN",
    color: "#EA4335",
  },
  {
    googleId: "google_uid_003",
    name: "Arjun Mehta",
    email: "arjun.mehta@gmail.com",
    avatar: "AM",
    color: "#34A853",
  },
];

function getStoredAccounts() {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_ACCOUNTS;
  } catch {
    return DEFAULT_ACCOUNTS;
  }
}

export default function GoogleAccountPicker({ onSelect, onClose }) {
  const [accounts] = useState(getStoredAccounts);
  const [selecting, setSelecting] = useState(null);
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [step, setStep] = useState("pick"); // "pick" | "add"

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleSelect = async (account) => {
    setSelecting(account.googleId);
    // Simulate brief auth delay (like real Google OAuth)
    await new Promise((r) => setTimeout(r, 900));
    onSelect(account);
  };

  const handleAddNew = () => {
    if (!newName.trim() || !newEmail.trim()) return;
    const colors = ["#4285F4", "#EA4335", "#FBBC05", "#34A853", "#9C27B0"];
    const initials = newName.trim().split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    const newAccount = {
      googleId: "google_uid_" + Date.now(),
      name: newName.trim(),
      email: newEmail.trim(),
      avatar: initials,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
    // Persist and select
    const updated = [...accounts, newAccount];
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    handleSelect(newAccount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Google header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <svg width="74" height="24" viewBox="0 0 74 24" fill="none">
              <path d="M9.24 8.19v2.46h5.88c-.18 1.38-.64 2.39-1.34 3.1-.86.86-2.2 1.8-4.54 1.8-3.62 0-6.45-2.92-6.45-6.54s2.83-6.54 6.45-6.54c1.95 0 3.38.77 4.43 1.76L15.4 2.5C13.94 1.08 11.98 0 9.24 0 4.28 0 .11 4.04.11 9s4.17 9 9.13 9c2.68 0 4.7-.88 6.28-2.52 1.62-1.62 2.13-3.91 2.13-5.75 0-.57-.04-1.1-.13-1.54H9.24z" fill="#4285F4"/>
              <path d="M25 6.19c-3.21 0-5.83 2.44-5.83 5.81 0 3.34 2.62 5.81 5.83 5.81s5.83-2.46 5.83-5.81c0-3.37-2.62-5.81-5.83-5.81zm0 9.33c-1.76 0-3.28-1.45-3.28-3.52 0-2.09 1.52-3.52 3.28-3.52s3.28 1.43 3.28 3.52c0 2.07-1.52 3.52-3.28 3.52z" fill="#EA4335"/>
              <path d="M53.58 7.49h-.09c-.57-.68-1.67-1.3-3.06-1.3C47.53 6.19 45 8.72 45 12c0 3.26 2.53 5.81 5.43 5.81 1.39 0 2.49-.62 3.06-1.32h.09v.81c0 2.22-1.19 3.41-3.1 3.41-1.56 0-2.53-1.12-2.93-2.07l-2.22.92c.64 1.54 2.33 3.43 5.15 3.43 2.99 0 5.52-1.76 5.52-6.05V6.49h-2.42v1zm-2.93 8.03c-1.76 0-3.1-1.5-3.1-3.52 0-2.05 1.34-3.52 3.1-3.52 1.74 0 3.1 1.49 3.1 3.54.01 2.03-1.36 3.5-3.1 3.5z" fill="#4285F4"/>
              <path d="M38 6.19c-3.21 0-5.83 2.44-5.83 5.81 0 3.34 2.62 5.81 5.83 5.81s5.83-2.46 5.83-5.81c0-3.37-2.62-5.81-5.83-5.81zm0 9.33c-1.76 0-3.28-1.45-3.28-3.52 0-2.09 1.52-3.52 3.28-3.52s3.28 1.43 3.28 3.52c0 2.07-1.52 3.52-3.28 3.52z" fill="#FBBC05"/>
              <path d="M58.11 0h2.51v17.47h-2.51z" fill="#34A853"/>
              <path d="M65.09 14.48c-.82 0-1.4-.37-1.78-1.1l4.91-2.03-.17-.41c-.31-.84-1.27-2.39-3.22-2.39-1.93 0-3.54 1.52-3.54 3.81 0 2.14 1.59 3.81 3.73 3.81 1.72 0 2.72-.95 3.14-1.5l-1.28-.85c-.43.63-1.01 1.05-1.79 1.05zm-.12-4.7c.66 0 1.22.33 1.41.81l-3.38 1.4c-.04-2.01 1.44-2.21 1.97-2.21z" fill="#EA4335"/>
            </svg>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {step === "pick" ? (
            <>
              <h2 className="text-lg font-semibold text-gray-800">Choose an account</h2>
              <p className="text-sm text-gray-500 mt-0.5">to continue to <span className="font-medium">ExpenseIQ</span></p>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-800">Add account</h2>
              <p className="text-sm text-gray-500 mt-0.5">Sign in to continue to ExpenseIQ</p>
            </>
          )}
        </div>

        {step === "pick" ? (
          <>
            {/* Account list */}
            <div className="py-2 max-h-64 overflow-y-auto">
              {accounts.map((account) => (
                <button
                  key={account.googleId}
                  onClick={() => handleSelect(account)}
                  disabled={!!selecting}
                  className="w-full flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition text-left disabled:opacity-60 group"
                >
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: account.color }}
                  >
                    {selecting === account.googleId ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      account.avatar
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{account.name}</p>
                    <p className="text-xs text-gray-500 truncate">{account.email}</p>
                  </div>
                  <svg
                    width="16" height="16"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    className="text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>

            {/* Add account */}
            <div className="border-t border-gray-100 py-2">
              <button
                onClick={() => setStep("add")}
                className="w-full flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition text-left"
              >
                <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Use another account</p>
                </div>
              </button>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center">
                To continue, Google will share your name, email address, and profile picture with ExpenseIQ.
              </p>
            </div>
          </>
        ) : (
          /* Add new account form */
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1.5 block">Full Name</label>
              <input
                type="text"
                placeholder="Your name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1.5 block">Email or phone</label>
              <input
                type="email"
                placeholder="your@gmail.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddNew()}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep("pick")}
                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                onClick={handleAddNew}
                disabled={!newName.trim() || !newEmail.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-2.5 text-sm font-semibold transition"
              >
                Next
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center">
              <span className="text-blue-500 cursor-pointer hover:underline">Create account</span>
              {" · "}
              <span className="text-blue-500 cursor-pointer hover:underline">Forgot email?</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
