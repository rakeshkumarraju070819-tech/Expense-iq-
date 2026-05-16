import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "⊞", path: "/dashboard" },
  { id: "analitics", label: "Analytics", icon: "📊", path: "/analitics" },
  { id: "calendar", label: "Calendar", icon: "📅", path: "/calendar" },
  { id: "subscriptions", label: "Subscriptions", icon: "🔄", path: "/subscriptions" },
  { id: "emergency", label: "Emergency Fund", icon: "🛡️", path: "/emergency" },
  { id: "reminders", label: "Reminders", icon: "🔔", path: "/reminders" },
  { id: "stocks", label: "Stock Assets", icon: "📈", path: "/stocks" },
];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function Sidebar({ totalExpenses, collapsed, onToggle, onLogout }) {
  const { user } = useAuth();
  const location = useLocation();
  const curMonth = new Date().getMonth();

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <aside
      className={`${collapsed ? "w-16" : "w-52"} bg-dark flex flex-col transition-all duration-300 min-h-screen flex-shrink-0`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 p-4 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex-shrink-0 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
          </svg>
        </div>
        {!collapsed && <span className="text-white font-bold text-sm">ExpenseIQ</span>}
        <button onClick={onToggle} className="ml-auto text-gray-400 hover:text-white text-lg leading-none">
          {collapsed ? "›" : "‹"}
        </button>
      </div>

      {/* Monthly total */}
      {!collapsed && (
        <div className="mx-3 mt-4 mb-2 bg-indigo-600 rounded-xl p-3">
          <p className="text-indigo-200 text-xs">Total Monthly</p>
          <p className="text-white text-xl font-bold">
            ₹{totalExpenses.toLocaleString("en-IN")}
          </p>
          <div className="mt-2 bg-indigo-800 rounded-full h-1.5">
            <div
              className="bg-white rounded-full h-1.5 transition-all"
              style={{ width: `${Math.min((totalExpenses / 10000) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path && (item.path === "/dashboard" ? item.id === "dashboard" : true);
          return (
            <Link
              to={item.path}
              key={item.id}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                active
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Month picker */}
      {!collapsed && (
        <div className="px-4 pb-4">
          <p className="text-xs text-gray-500 mb-2">Current Period</p>
          <div className="grid grid-cols-3 gap-1">
            {MONTHS.map((m, i) => (
              <button
                key={m}
                className={`text-xs py-1 rounded-lg transition ${
                  i === curMonth
                    ? "bg-indigo-600 text-white font-bold"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* User */}
      <div className="p-4 border-t border-white/10 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-indigo-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {initials}
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.name || "User"}</p>
            <p className="text-indigo-300 text-xs">Premium User</p>
          </div>
        )}
        {!collapsed && (
          <button onClick={onLogout} title="Logout" className="text-gray-500 hover:text-red-400 text-xs transition">
            ⏻
          </button>
        )}
      </div>
    </aside>
  );
}
