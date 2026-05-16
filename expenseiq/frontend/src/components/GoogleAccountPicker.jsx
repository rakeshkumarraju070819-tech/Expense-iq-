import { useEffect } from "react";

const CLIENT_ID =
  "705346478351-sutam8cssaiqc2cp2jaqu1m3fnvkqe15.apps.googleusercontent.com";

export default function GoogleAccountPicker({ onSelect, onClose }) {
  // Lock body scroll while overlay is shown
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Trigger real Google OAuth as soon as the component mounts
  useEffect(() => {
    const startOAuth = () => {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: "openid profile email",
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            onClose();
            return;
          }
          try {
            // Fetch real user profile from Google
            const res = await fetch(
              "https://www.googleapis.com/oauth2/v3/userinfo",
              {
                headers: {
                  Authorization: `Bearer ${tokenResponse.access_token}`,
                },
              }
            );
            const profile = await res.json();
            const initials = profile.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);
            onSelect({
              googleId: profile.sub,
              name: profile.name,
              email: profile.email,
              avatar: initials,
              color: "#4285F4",
            });
          } catch {
            onClose();
          }
        },
      });
      client.requestAccessToken();
    };

    if (window.google?.accounts?.oauth2) {
      startOAuth();
    } else {
      // GSI script not loaded yet — poll until ready
      const interval = setInterval(() => {
        if (window.google?.accounts?.oauth2) {
          clearInterval(interval);
          startOAuth();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [onSelect, onClose]);

  // Loading overlay while the Google popup is opening
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-8 flex flex-col items-center gap-5">
        {/* Google logo */}
        <svg width="74" height="24" viewBox="0 0 74 24" fill="none">
          <path
            d="M9.24 8.19v2.46h5.88c-.18 1.38-.64 2.39-1.34 3.1-.86.86-2.2 1.8-4.54 1.8-3.62 0-6.45-2.92-6.45-6.54s2.83-6.54 6.45-6.54c1.95 0 3.38.77 4.43 1.76L15.4 2.5C13.94 1.08 11.98 0 9.24 0 4.28 0 .11 4.04.11 9s4.17 9 9.13 9c2.68 0 4.7-.88 6.28-2.52 1.62-1.62 2.13-3.91 2.13-5.75 0-.57-.04-1.1-.13-1.54H9.24z"
            fill="#4285F4"
          />
          <path
            d="M25 6.19c-3.21 0-5.83 2.44-5.83 5.81 0 3.34 2.62 5.81 5.83 5.81s5.83-2.46 5.83-5.81c0-3.37-2.62-5.81-5.83-5.81zm0 9.33c-1.76 0-3.28-1.45-3.28-3.52 0-2.09 1.52-3.52 3.28-3.52s3.28 1.43 3.28 3.52c0 2.07-1.52 3.52-3.28 3.52z"
            fill="#EA4335"
          />
          <path
            d="M53.58 7.49h-.09c-.57-.68-1.67-1.3-3.06-1.3C47.53 6.19 45 8.72 45 12c0 3.26 2.53 5.81 5.43 5.81 1.39 0 2.49-.62 3.06-1.32h.09v.81c0 2.22-1.19 3.41-3.1 3.41-1.56 0-2.53-1.12-2.93-2.07l-2.22.92c.64 1.54 2.33 3.43 5.15 3.43 2.99 0 5.52-1.76 5.52-6.05V6.49h-2.42v1zm-2.93 8.03c-1.76 0-3.1-1.5-3.1-3.52 0-2.05 1.34-3.52 3.1-3.52 1.74 0 3.1 1.49 3.1 3.54.01 2.03-1.36 3.5-3.1 3.5z"
            fill="#4285F4"
          />
          <path
            d="M38 6.19c-3.21 0-5.83 2.44-5.83 5.81 0 3.34 2.62 5.81 5.83 5.81s5.83-2.46 5.83-5.81c0-3.37-2.62-5.81-5.83-5.81zm0 9.33c-1.76 0-3.28-1.45-3.28-3.52 0-2.09 1.52-3.52 3.28-3.52s3.28 1.43 3.28 3.52c0 2.07-1.52 3.52-3.28 3.52z"
            fill="#FBBC05"
          />
          <path d="M58.11 0h2.51v17.47h-2.51z" fill="#34A853" />
          <path
            d="M65.09 14.48c-.82 0-1.4-.37-1.78-1.1l4.91-2.03-.17-.41c-.31-.84-1.27-2.39-3.22-2.39-1.93 0-3.54 1.52-3.54 3.81 0 2.14 1.59 3.81 3.73 3.81 1.72 0 2.72-.95 3.14-1.5l-1.28-.85c-.43.63-1.01 1.05-1.79 1.05zm-.12-4.7c.66 0 1.22.33 1.41.81l-3.38 1.4c-.04-2.01 1.44-2.21 1.97-2.21z"
            fill="#EA4335"
          />
        </svg>

        <div className="text-center">
          <p className="text-sm font-semibold text-gray-800">
            Opening Google sign-in…
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Allow the pop-up if prompted by your browser
          </p>
        </div>

        {/* Spinner */}
        <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />

        <button
          onClick={onClose}
          className="text-xs text-gray-400 hover:text-gray-600 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
