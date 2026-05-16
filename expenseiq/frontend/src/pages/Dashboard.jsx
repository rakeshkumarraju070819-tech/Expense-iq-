import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import AddExpenseModal from "../components/AddExpenseModal";
import SpendingChart from "../components/SpendingChart";

// ── Local expense storage per user ────────────────────────────────────────────
const getExpenseKey = (userId) => `expenseiq_expenses_${userId}`;

function loadExpenses(userId) {
  try { return JSON.parse(localStorage.getItem(getExpenseKey(userId)) || "[]"); }
  catch { return []; }
}
function saveExpenses(userId, expenses) {
  localStorage.setItem(getExpenseKey(userId), JSON.stringify(expenses));
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 2,
  }).format(n || 0);

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [expenses, setExpenses]       = useState([]);
  const [showModal, setShowModal]     = useState(false);
  const [collapsed, setCollapsed]     = useState(false);
  const [activeRange, setActiveRange] = useState("Today");

  // Load expenses for this user from localStorage
  useEffect(() => {
    if (user?.id) setExpenses(loadExpenses(user.id));
  }, [user?.id]);

  const persist = (updated) => {
    setExpenses(updated);
    if (user?.id) saveExpenses(user.id, updated);
  };

  // ── Derived stats ─────────────────────────────────────────────────────────
  const now       = new Date();
  const dateStr   = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const isThisMonth = (e) => {
    const d = new Date(e.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  };
  const isToday = (e) => {
    const d = new Date(e.date);
    return d.toDateString() === now.toDateString();
  };

  const monthlyExpenses = expenses.filter(isThisMonth);
  const todayExpenses   = expenses.filter(isToday);

  const monthlyTotal  = monthlyExpenses.reduce((s, e) => s + e.amount, 0);
  const todayTotal    = todayExpenses.reduce((s, e) => s + e.amount, 0);
  const todayHighest  = todayExpenses.length ? Math.max(...todayExpenses.map((e) => e.amount)) : 0;
  const todayLowest   = todayExpenses.length ? Math.min(...todayExpenses.map((e) => e.amount)) : 0;

  const monthlyBudget = user?.monthlyBudget || 10000;
  const dailyBudget   = user?.dailyBudget   || 400;
  const budgetPct     = Math.min((monthlyTotal / monthlyBudget) * 100, 100).toFixed(1);

  // ── Add / delete ──────────────────────────────────────────────────────────
  const handleAdd = (data) => {
    const newExp = { id: "e_" + Date.now(), ...data, amount: parseFloat(data.amount) };
    persist([newExp, ...expenses]);
    setShowModal(false);
  };

  const handleDeleteAll = () => {
    if (window.confirm("Delete all transactions? This cannot be undone.")) persist([]);
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  // ── Initials for sidebar user badge ──────────────────────────────────────
  const displayName = user?.name || "User";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        totalExpenses={monthlyTotal}
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        onLogout={handleLogout}
      />

      <main className="flex-1 overflow-auto min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-sm text-gray-400 mt-0.5">{dateStr}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:block">
              Welcome, <span className="font-semibold text-gray-700">{displayName}</span>
            </span>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Top cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Total Monthly Balance</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{fmt(monthlyBudget - monthlyTotal)}</p>
              <p className="text-xs text-gray-400 mt-1">Across all accounts</p>
            </div>
            <div className="bg-emerald-500 rounded-2xl p-5 shadow-sm">
              <p className="text-sm text-emerald-100">Total Income</p>
              <p className="text-3xl font-bold text-white mt-1">{fmt(monthlyBudget)}</p>
              <p className="text-xs text-emerald-100 mt-1">This month</p>
            </div>
            <div className="bg-amber-400 rounded-2xl p-5 shadow-sm">
              <p className="text-sm text-amber-100">Total Expenses</p>
              <p className="text-3xl font-bold text-white mt-1">{fmt(monthlyTotal)}</p>
              <p className="text-xs text-amber-100 mt-1">This month</p>
            </div>
          </div>

          {/* Budget progress */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-semibold text-gray-700">Monthly Budget Progress</p>
                <p className="text-xs text-gray-400">
                  {now.toLocaleString("en-US", { month: "long", year: "numeric" })}
                </p>
              </div>
              <span className="text-lg font-bold text-gray-700">{budgetPct}%</span>
            </div>
            <div className="bg-gray-100 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all duration-700 ${
                  parseFloat(budgetPct) > 80 ? "bg-red-500" : "bg-gray-800"
                }`}
                style={{ width: `${budgetPct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {fmt(monthlyTotal)} of {fmt(monthlyBudget)} budget used
            </p>
          </div>

          {/* Chart */}
          <div className="bg-[#111827] rounded-2xl p-5 shadow-sm">
            <p className="text-gray-300 text-sm font-semibold mb-1">Recent Spending</p>
            <p className="text-white text-2xl font-bold">{fmt(todayTotal)}</p>
            <p className="text-gray-400 text-xs mb-4">
              {dateStr} · Last 30 days Budget: {fmt(dailyBudget * 30)}
            </p>
            <div className="h-44">
              <SpendingChart expenses={expenses} />
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {["Today", "7 Days", "1 Month", "3 Months", "1 Year"].map((l) => (
                <button
                  key={l}
                  onClick={() => setActiveRange(l)}
                  className={`text-xs px-3 py-1.5 rounded-full transition ${
                    activeRange === l
                      ? "bg-indigo-500 text-white"
                      : "text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Spending Trends",  val: fmt(monthlyTotal / Math.max(monthlyExpenses.length, 1)) },
              { label: "Highest Today",    val: fmt(todayHighest) },
              { label: "Lowest Today",     val: fmt(todayLowest) },
              { label: "Midway Average",   val: fmt(monthlyTotal / 2) },
              { label: "Budget Left",      val: fmt(monthlyBudget - monthlyTotal) },
            ].map(({ label, val }) => (
              <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                <p className="text-base font-bold text-gray-800">{val}</p>
              </div>
            ))}
          </div>

          {/* Budget alert */}
          {todayTotal > dailyBudget * 0.8 && todayTotal > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <span className="text-red-400 text-lg flex-shrink-0">⚠</span>
              <div>
                <p className="text-red-600 font-semibold text-sm">Budget Alert</p>
                <p className="text-red-500 text-xs mt-0.5">
                  You are close to today's budget limit. Current spending: {fmt(todayTotal)} / Daily budget: {fmt(dailyBudget)}
                </p>
              </div>
            </div>
          )}

          {/* Transactions */}
          {expenses.length > 0 ? (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <p className="font-semibold text-gray-700">Recent Transactions</p>
                <span className="text-xs text-gray-400">{expenses.length} total</span>
              </div>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {expenses.map((exp) => (
                  <div key={exp.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{exp.title}</p>
                      <p className="text-xs text-gray-400">
                        {exp.category} ·{" "}
                        {new Date(exp.date).toLocaleDateString("en-IN", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-red-500">-{fmt(exp.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center py-12">
              <p className="text-4xl mb-3">💸</p>
              <p className="text-gray-600 font-semibold">No expenses yet</p>
              <p className="text-gray-400 text-sm mt-1">Click "Add Expense" to start tracking</p>
            </div>
          )}
        </div>
      </main>

      {/* Action buttons */}
      <div className={`fixed bottom-6 transition-all duration-300 flex gap-3 ${collapsed ? "left-20" : "left-56"}`}>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-semibold shadow-lg text-sm flex items-center gap-2 transition"
        >
          + Add Expense
        </button>
        {expenses.length > 0 && (
          <button
            onClick={handleDeleteAll}
            className="bg-white hover:bg-red-50 text-red-500 border border-red-200 px-4 py-3 rounded-xl font-semibold shadow-lg text-sm transition"
          >
            🗑 Delete All
          </button>
        )}
      </div>

      {showModal && (
        <AddExpenseModal
          onAdd={handleAdd}
          onClose={() => setShowModal(false)}
          loading={false}
        />
      )}
    </div>
  );
}
