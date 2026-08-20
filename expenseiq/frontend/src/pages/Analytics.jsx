import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import AddExpenseModal from "../components/AddExpenseModal";
import SavingsGoalModal from "../components/SavingsGoalModal";
import AddFundsModal from "../components/AddFundsModal";
import AdjustGoalModal from "../components/AdjustGoalModal";
import { getSavingsGoals, createSavingsGoal, updateSavingsGoal, addContribution } from "../api/savingsGoal.api";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts";

// ── Local expense storage per user ────────────────────────────────────────────
const getExpenseKey = (userId) => `expenseiq_expenses_${userId}`;
const getSavingsGoalKey = (userId) => `expenseiq_savings_goal_${userId}`;
const getChallengeKey = (userId) => `expenseiq_challenge_${userId}`;
const getAlertsKey = (userId) => `expenseiq_alerts_${userId}`;

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
}
function saveJSON(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function loadExpenses(userId) { return loadJSON(getExpenseKey(userId), []); }
function saveExpenses(userId, expenses) { saveJSON(getExpenseKey(userId), expenses); }

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 2,
  }).format(n || 0);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// ── Alert timestamp formatter ─────────────────────────────────────────────────
function formatAlertTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const timePart = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  if (d.toDateString() === now.toDateString()) return `Today, ${timePart}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${timePart}`;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) + ", " + timePart;
}

// ── Challenge generator ───────────────────────────────────────────────────────
function generateChallenge(avgDailySpending) {
  // Round limit to nearest ₹50, minimum ₹100
  let limit = Math.max(100, Math.round((avgDailySpending * 0.8) / 50) * 50);
  if (limit < 100) limit = 100;
  return { limit, days: 7, streak: 0, startDate: new Date().toISOString(), dailyLog: {} };
}

// ── Spending persona classifier ───────────────────────────────────────────────
function classifyPersona(monthlyTotal, monthlyBudget, expenses, now) {
  if (expenses.length === 0) return { title: "New User", desc: "Start tracking your expenses to discover your spending persona." };

  const ratio = monthlyTotal / monthlyBudget;

  // Check weekend spending
  const weekendTotal = expenses
    .filter(e => { const d = new Date(e.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && (d.getDay() === 0 || d.getDay() === 6); })
    .reduce((s, e) => s + e.amount, 0);
  const weekendRatio = monthlyTotal > 0 ? weekendTotal / monthlyTotal : 0;

  // Check impulse: average number of expenses per day this month
  const daysPassed = now.getDate();
  const avgExpensesPerDay = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length / Math.max(daysPassed, 1);

  if (ratio < 0.4) return { title: "Saver", desc: "You're very careful with your money. You spend well below your budget." };
  if (ratio > 0.9) return { title: "Budget Struggler", desc: "You're spending close to or above your budget. Consider cutting back on non-essential expenses." };
  if (weekendRatio > 0.5) return { title: "Weekend Spender", desc: "Most of your spending happens on weekends. Try to spread your expenses more evenly." };
  if (avgExpensesPerDay > 3) return { title: "Impulse Buyer", desc: "You make frequent small purchases. Consider consolidating your shopping to save more." };
  return { title: "Balanced Spender", desc: "You spend consistently and maintain a balanced approach to your finances." };
}

// ── Financial Health Score calculator ─────────────────────────────────────────
function calcHealthScore(monthlyTotal, monthlyBudget, monthlyExpenses, now) {
  if (monthlyExpenses.length === 0) return { score: 0, label: "Needs Improvement", desc: "Start tracking expenses to build your financial health score." };

  // Budget Adherence (40%): how much budget is left
  const budgetAdherence = Math.max(0, 1 - monthlyTotal / monthlyBudget) * 40;

  // Savings Ratio (30%): percentage of budget saved
  const savingsRatio = Math.max(0, Math.min(((monthlyBudget - monthlyTotal) / monthlyBudget) * 30, 30));

  // Expense Consistency (20%): low std-dev of daily spending = higher score
  const daysPassed = now.getDate();
  const dailyTotals = {};
  monthlyExpenses.forEach(e => {
    const day = new Date(e.date).getDate();
    dailyTotals[day] = (dailyTotals[day] || 0) + e.amount;
  });
  const dailyValues = [];
  for (let i = 1; i <= daysPassed; i++) dailyValues.push(dailyTotals[i] || 0);
  const mean = dailyValues.reduce((s, v) => s + v, 0) / Math.max(dailyValues.length, 1);
  const variance = dailyValues.reduce((s, v) => s + (v - mean) ** 2, 0) / Math.max(dailyValues.length, 1);
  const stdDev = Math.sqrt(variance);
  // Normalize: if stdDev is 0 = perfect consistency (20), if stdDev > mean = 0
  const consistencyScore = mean > 0 ? Math.max(0, (1 - stdDev / mean)) * 20 : 20;

  // Emergency Buffer (10%): remaining balance relative to 20% of budget
  const remaining = monthlyBudget - monthlyTotal;
  const bufferScore = Math.min(Math.max(remaining, 0) / (monthlyBudget * 0.2), 1) * 10;

  const score = Math.round(budgetAdherence + savingsRatio + consistencyScore + bufferScore);
  const clampedScore = Math.max(0, Math.min(score, 100));

  let label, desc;
  if (clampedScore >= 80) { label = "Excellent"; desc = "Your financial health is outstanding. Keep up the great work!"; }
  else if (clampedScore >= 60) { label = "Good"; desc = "Your spending is mostly balanced with room for minor improvements."; }
  else if (clampedScore >= 40) { label = "Average"; desc = "Consider reducing spending in some categories to improve your score."; }
  else { label = "Needs Improvement"; desc = "Your spending is significantly above budget. Review your expenses carefully."; }

  return { score: clampedScore, label, desc };
}

// ── Alert generator ───────────────────────────────────────────────────────────
function generateAlerts(expenses, existingAlerts, now) {
  const todayExpenses = expenses.filter(e => new Date(e.date).toDateString() === now.toDateString());
  const todayTotal = todayExpenses.reduce((s, e) => s + e.amount, 0);
  const newAlerts = [];
  const ts = now.toISOString();

  // 1. High spending
  if (todayTotal > 1000) {
    newAlerts.push({ id: "high_" + now.toDateString(), type: "danger", msg: "Unusually high expense recorded today", ts });
  }

  // 2. Late night (check most recent expense)
  if (todayExpenses.length > 0) {
    const latestExp = todayExpenses[0]; // expenses are newest-first
    const expTime = new Date(latestExp.date || latestExp.createdAt || ts);
    // If expense was just added and current time is after 10 PM
    if (now.getHours() >= 22) {
      newAlerts.push({ id: "latenight_" + now.toDateString(), type: "warning", msg: "Late night spending pattern detected", ts });
    }
  }

  // 3. Frequent food expenses (>3 food expenses today)
  const foodCount = todayExpenses.filter(e =>
    (e.category || "").toLowerCase().includes("food")
  ).length;
  if (foodCount > 3) {
    newAlerts.push({ id: "food_" + now.toDateString(), type: "warning", msg: "Frequent food expenses detected today", ts });
  }

  // 4. Shopping dominance (>50% of today's spending)
  const shoppingTotal = todayExpenses
    .filter(e => (e.category || "").toLowerCase().includes("shopping"))
    .reduce((s, e) => s + e.amount, 0);
  if (todayTotal > 0 && shoppingTotal / todayTotal > 0.5) {
    newAlerts.push({ id: "shopping_" + now.toDateString(), type: "warning", msg: "Shopping spending is unusually high today", ts });
  }

  // Merge: only add new alerts not already present, keep newest first, max 5
  const existingIds = new Set((existingAlerts || []).map(a => a.id));
  const toAdd = newAlerts.filter(a => !existingIds.has(a.id));
  const merged = [...toAdd, ...(existingAlerts || [])].slice(0, 5);
  return merged;
}


export default function Analytics() {
  const { user, logout } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [activeGoalForFunds, setActiveGoalForFunds] = useState(null);
  const [activeGoalForAdjust, setActiveGoalForAdjust] = useState(null);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [challenge, setChallenge] = useState(null);
  const [alerts, setAlerts] = useState([]);

  const loadGoals = useCallback(async () => {
    try {
      const res = await getSavingsGoals();
      const goals = res.goals || [];
      setSavingsGoals(goals);
    } catch { /* ignore if not logged in yet */ }
  }, []);

  useEffect(() => {
    if (user?.id) {
      setExpenses(loadExpenses(user.id));
      loadGoals();
      setChallenge(loadJSON(getChallengeKey(user.id), null));
      setAlerts(loadJSON(getAlertsKey(user.id), []));
    }
  }, [user?.id, loadGoals]);

  // Cross-tab sync
  useEffect(() => {
    const handler = (e) => {
      if (!user?.id) return;
      if (e.key === getExpenseKey(user.id)) setExpenses(loadJSON(e.key, []));
      if (e.key === getChallengeKey(user.id)) setChallenge(loadJSON(e.key, null));
      if (e.key === getAlertsKey(user.id)) setAlerts(loadJSON(e.key, []));
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [user?.id]);

  const persist = (updated) => {
    setExpenses(updated);
    if (user?.id) saveExpenses(user.id, updated);
  };

  const handleAdd = (data) => {
    const newExp = { id: "e_" + Date.now(), ...data, amount: parseFloat(data.amount), createdAt: new Date().toISOString() };
    const updated = [newExp, ...expenses];
    persist(updated);
    setShowModal(false);
  };

  const monthlyBudget = user?.monthlyBudget || 10000;

  // ── Derived calculations ────────────────────────────────────────────────
  const now = useMemo(() => new Date(), []);
  const monthlyExpenses = useMemo(() => expenses.filter(e => {
    const d = new Date(e.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }), [expenses, now]);

  const todayExpenses = useMemo(() => expenses.filter(e =>
    new Date(e.date).toDateString() === now.toDateString()
  ), [expenses, now]);

  const monthlyTotal = useMemo(() => monthlyExpenses.reduce((s, e) => s + e.amount, 0), [monthlyExpenses]);
  const todayTotal = useMemo(() => todayExpenses.reduce((s, e) => s + e.amount, 0), [todayExpenses]);

  // ── 1. Budget Predictor ─────────────────────────────────────────────────
  const daysInMonth = useMemo(() => new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(), [now]);
  const daysPassed = now.getDate();
  const daysRemaining = daysInMonth - daysPassed + 1;
  const avgDailySpending = daysPassed > 0 ? monthlyTotal / daysPassed : 0;
  const projectedSpending = avgDailySpending * daysInMonth;
  const averagePredicted = daysInMonth > 0 ? projectedSpending / daysInMonth : 0;

  // ── 2. Financial Health Score ───────────────────────────────────────────
  const healthScore = useMemo(() => calcHealthScore(monthlyTotal, monthlyBudget, monthlyExpenses, now), [monthlyTotal, monthlyBudget, monthlyExpenses, now]);

  const healthBorderColor = healthScore.score >= 60 ? "border-emerald-500" : healthScore.score >= 40 ? "border-amber-500" : "border-red-500";
  const healthScoreColor = healthScore.score >= 60 ? "text-green-500" : healthScore.score >= 40 ? "text-amber-500" : "text-red-500";

  // ── 3. Savings Goal ─────────────────────────────────────────────────────
  const calculateGoalProgress = useCallback((goal) => {
    if (!goal) return { progress: 0, remaining: 0, requiredMonthly: 0 };
    const saved = goal.savedAmount || 0;
    const progressRaw = goal.targetAmount > 0 ? (saved / goal.targetAmount) : 0;
    const progress = Math.min(progressRaw, 1);
    const remaining = Math.max(0, goal.targetAmount - saved);
    let requiredMonthly = 0;
    if (goal.targetDate && remaining > 0) {
      const target = new Date(goal.targetDate);
      const diffMs = target.getTime() - now.getTime();
      const monthsLeft = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30)));
      requiredMonthly = remaining / monthsLeft;
    }
    return { progress, remaining, requiredMonthly };
  }, [now]);

  const calculateGoalMonthsText = useCallback((goal) => {
    if (!goal?.targetDate) return "No deadline";
    const target = new Date(goal.targetDate);
    const diffMs = target.getTime() - now.getTime();
    if (diffMs <= 0) return "Deadline passed";
    const months = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30)));
    return `Target: ${target.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} (${months} month${months !== 1 ? 's' : ''})`;
  }, [now]);

  const handleSaveGoal = useCallback(async (goalData) => {
    try {
      await createSavingsGoal(goalData);
      await loadGoals();
    } catch (err) { console.error("Failed to save goal:", err); }
    setShowGoalModal(false);
  }, [loadGoals]);

  const handleAddFunds = useCallback(async (goalId, data) => {
    try {
      await addContribution(goalId, data);
      await loadGoals();
    } catch (err) { console.error("Failed to add funds:", err); }
    setActiveGoalForFunds(null);
  }, [loadGoals]);

  const handleAdjustGoal = useCallback(async (data) => {
    if (!activeGoalForAdjust?._id) return;
    try {
      await updateSavingsGoal(activeGoalForAdjust._id, data);
      await loadGoals();
    } catch (err) { console.error("Failed to adjust goal:", err); }
    setActiveGoalForAdjust(null);
  }, [activeGoalForAdjust, loadGoals]);

  // ── 4. Spending Persona ─────────────────────────────────────────────────
  const persona = useMemo(() => classifyPersona(monthlyTotal, monthlyBudget, expenses, now), [monthlyTotal, monthlyBudget, expenses, now]);

  // ── 5. Active Challenge ─────────────────────────────────────────────────
  // Auto-generate challenge if none exists
  useEffect(() => {
    if (!user?.id) return;
    if (!challenge && expenses.length > 0) {
      const newChallenge = generateChallenge(avgDailySpending);
      setChallenge(newChallenge);
      saveJSON(getChallengeKey(user.id), newChallenge);
    }
  }, [user?.id, challenge, expenses.length, avgDailySpending]);

  // Track challenge streak whenever expenses change
  useEffect(() => {
    if (!user?.id || !challenge) return;
    const todayKey = now.toDateString();
    const todaySpend = todayExpenses.reduce((s, e) => s + e.amount, 0);

    const updatedLog = { ...(challenge.dailyLog || {}) };
    if (todaySpend > 0) {
      updatedLog[todayKey] = todaySpend;
    }

    // Recalculate streak from startDate
    let streak = 0;
    const startDate = new Date(challenge.startDate);
    for (let i = 0; i < challenge.days; i++) {
      const checkDate = new Date(startDate);
      checkDate.setDate(startDate.getDate() + i);
      if (checkDate > now) break;
      const dayKey = checkDate.toDateString();
      const daySpend = updatedLog[dayKey] || 0;
      if (daySpend > 0 && daySpend > challenge.limit) {
        streak = 0; // Reset on overspend
      } else if (daySpend > 0 || checkDate < now) {
        // Day passed within budget (or had no spending = within budget)
        streak++;
      }
    }

    // Check if challenge completed
    if (streak >= challenge.days) {
      const newChallenge = generateChallenge(avgDailySpending);
      setChallenge(newChallenge);
      saveJSON(getChallengeKey(user.id), newChallenge);
      return;
    }

    if (streak !== challenge.streak || JSON.stringify(updatedLog) !== JSON.stringify(challenge.dailyLog)) {
      const updated = { ...challenge, streak, dailyLog: updatedLog };
      setChallenge(updated);
      saveJSON(getChallengeKey(user.id), updated);
    }
  }, [user?.id, todayExpenses, now, avgDailySpending]);

  const challengeProgress = challenge ? Math.min((challenge.streak / challenge.days) * 100, 100) : 0;

  // ── 6. Alerts & Insights ────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    const updated = generateAlerts(expenses, alerts, now);
    if (JSON.stringify(updated) !== JSON.stringify(alerts)) {
      setAlerts(updated);
      saveJSON(getAlertsKey(user.id), updated);
    }
  }, [user?.id, expenses, now]);

  // Process data for charts
  const lineChartData = [
    { name: 'Jan', Income: 0, Expense: 0 },
    { name: 'Feb', Income: 0, Expense: 0 },
    { name: 'Mar', Income: 0, Expense: 0 },
    { name: 'Apr', Income: 0, Expense: 0 },
    { name: 'May', Income: 0, Expense: monthlyTotal },
    { name: 'Jun', Income: 0, Expense: 0 },
  ];

  const categoryMap = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  let pieData = Object.keys(categoryMap).map(key => ({
    name: key, value: categoryMap[key]
  }));
  if (pieData.length === 0) pieData = [{ name: 'None', value: 1 }];

  const barData = [
    { name: 'Jan', amount: 0 },
    { name: 'Feb', amount: 0 },
    { name: 'Mar', amount: 0 },
    { name: 'Apr', amount: 0 },
    { name: 'May', amount: monthlyTotal },
    { name: 'Jun', amount: 0 },
  ];

  // Alert styling helpers
  const alertStyles = {
    danger: { bg: "bg-red-50", border: "border-red-100", text: "text-red-600", sub: "text-red-400", arrow: "text-red-400" },
    warning: { bg: "bg-amber-50", border: "border-amber-100", text: "text-amber-600", sub: "text-amber-400", arrow: "text-amber-400" },
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        totalExpenses={monthlyTotal}
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        onLogout={() => logout()}
      />

      <main className="flex-1 overflow-auto min-w-0">
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
            <p className="text-sm text-gray-400 mt-0.5">Detailed insights into your spending patterns</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Income vs Expenses */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Income vs. Expenses</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                  <RechartsTooltip />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                  <Line type="monotone" dataKey="Income" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Expense" stroke="#EF4444" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expense Breakdown by Category */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Expense Breakdown by Category</h2>
            {expenses.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                  <p className="text-xs text-emerald-600">0% Housing</p>
                  <p className="text-lg font-bold text-gray-800 mt-2">₹0</p>
                 </div>
                 <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                  <p className="text-xs text-amber-600">0% Food</p>
                  <p className="text-lg font-bold text-gray-800 mt-2">₹0</p>
                 </div>
                 <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                  <p className="text-xs text-blue-600">0% Transport</p>
                  <p className="text-lg font-bold text-gray-800 mt-2">₹0</p>
                 </div>
                 <div className="bg-pink-50 rounded-2xl p-4 border border-pink-100">
                  <p className="text-xs text-pink-600">0% Utilities</p>
                  <p className="text-lg font-bold text-gray-800 mt-2">₹0</p>
                 </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Object.entries(categoryMap).map(([cat, amt], idx) => {
                  const pct = ((amt / monthlyTotal) * 100).toFixed(0);
                  const colors = ['bg-emerald-50 border-emerald-100 text-emerald-600', 'bg-amber-50 border-amber-100 text-amber-600', 'bg-blue-50 border-blue-100 text-blue-600', 'bg-pink-50 border-pink-100 text-pink-600'];
                  const cInfo = colors[idx % colors.length];
                  return (
                    <div key={cat} className={`rounded-2xl p-4 border ${cInfo.split(' ')[0]} ${cInfo.split(' ')[1]}`}>
                      <p className={`text-xs ${cInfo.split(' ')[2]}`}>{pct}% {cat}</p>
                      <p className="text-lg font-bold text-gray-800 mt-2">{fmt(amt)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Distribution (Pie) */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Category Distribution</h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={expenses.length === 0 ? '#E5E7EB' : COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    {expenses.length > 0 && <RechartsTooltip />}
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Comparison */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Monthly Comparison</h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                    <RechartsTooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                    <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Budget Predictors — DYNAMIC */}
          <div className="bg-indigo-500 rounded-2xl p-6 shadow-sm text-white">
            <h2 className="text-sm font-semibold mb-1">Budget Predictors</h2>
            <p className="text-indigo-200 text-xs mb-6">Based on your current spending pattern</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-indigo-100">Projected Spending</p>
                <p className="text-2xl font-bold">{fmt(projectedSpending)}</p>
                <p className="text-[10px] text-indigo-200">end of this month</p>
              </div>
              <div>
                <p className="text-xs text-indigo-100">Days Remaining</p>
                <p className="text-2xl font-bold">{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</p>
                <p className="text-[10px] text-indigo-200">in this month</p>
              </div>
              <div>
                <p className="text-xs text-indigo-100">Average Predicted</p>
                <p className="text-2xl font-bold">{fmt(averagePredicted)}</p>
                <p className="text-[10px] text-indigo-200">Per day spending</p>
              </div>
              <button disabled className="bg-white/20 p-2 rounded-full cursor-default">
                🚀
              </button>
            </div>
          </div>

          <div className="space-y-4">
             <h2 className="text-lg font-bold text-gray-800">Insights</h2>
             <p className="text-xs text-gray-400">AI-powered insights to help you manage your finances better.</p>
          </div>

          {/* Financial Health Score — DYNAMIC */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
             <h3 className="text-sm font-semibold text-gray-700 mb-4">Financial Health Score</h3>
             <div className="flex items-center gap-6">
                <div className={`w-20 h-20 rounded-full border-4 ${healthBorderColor} flex flex-col items-center justify-center`}>
                  <span className="text-2xl font-bold text-gray-800">{healthScore.score}</span>
                  <span className={`text-[10px] ${healthScoreColor}`}>/ 100</span>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <span className={healthScore.score >= 60 ? "text-emerald-500" : healthScore.score >= 40 ? "text-amber-500" : "text-red-500"}>
                      {healthScore.score >= 50 ? "✓" : "✗"}
                    </span>
                    <span className="text-xs text-gray-600">Budget adherence</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={monthlyTotal < monthlyBudget * 0.7 ? "text-emerald-500" : "text-amber-500"}>
                      {monthlyTotal < monthlyBudget * 0.7 ? "✓" : "ℹ"}
                    </span>
                    <span className="text-xs text-gray-600">Savings ratio</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-500">ℹ</span>
                    <span className="text-xs text-gray-600">Expense consistency</span>
                  </div>
                </div>
             </div>
             <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs text-gray-500">
               {healthScore.label}: {healthScore.desc}
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
               {/* Savings Goals — MULTIPLE DYNAMIC CARDS */}
               {savingsGoals.length > 0 ? savingsGoals.map((goal) => {
                 const gProgress = calculateGoalProgress(goal);
                 const gTimeText = calculateGoalMonthsText(goal);
                 const isCompleted = gProgress.progress >= 1;
                 
                 return (
                   <div key={goal._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative mb-6">
                     <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-700">{goal.goalName}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{fmt(goal.savedAmount || 0)} saved</p>
                        </div>
                        <div className="text-right">
                           {isCompleted ? (
                             <p className="text-sm font-bold text-emerald-600">Goal Completed</p>
                           ) : (
                             <>
                               <p className="text-sm font-bold text-gray-800">{fmt(gProgress.remaining)}</p>
                               <p className="text-xs text-gray-400">remaining</p>
                             </>
                           )}
                        </div>
                     </div>
                     <div className="flex justify-between items-center mb-1">
                       <p className="text-[10px] text-gray-400">
                         Target {fmt(goal.targetAmount)} • {gTimeText}
                       </p>
                       <p className="text-[10px] font-bold text-gray-700">{(gProgress.progress * 100).toFixed(2)}%</p>
                     </div>
                     <div className="bg-gray-100 rounded-full h-1.5 mb-2 overflow-hidden">
                        <div 
                          className="bg-emerald-400 rounded-full h-1.5 transition-all duration-500 ease-in-out" 
                          style={{ width: `${gProgress.progress * 100}%` }} 
                        />
                     </div>
                     <div className="flex justify-between items-center mt-3">
                       <p className="text-xs text-gray-400">
                         {isCompleted ? "Fully funded" : `${fmt(gProgress.requiredMonthly)} needed per month`}
                       </p>
                       <div className="flex gap-2">
                         {!isCompleted && (
                           <button
                             onClick={() => setActiveGoalForFunds(goal)}
                             className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-600 transition shadow-sm border border-emerald-500"
                           >
                             + Add Funds
                           </button>
                         )}
                         <button
                           onClick={() => setActiveGoalForAdjust(goal)}
                           className="bg-white text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-50 transition shadow-sm"
                         >
                           Edit
                         </button>
                       </div>
                     </div>

                     {/* Contribution History */}
                     {goal.contributions?.length > 0 && (
                       <div className="mt-4 border-t border-gray-100 pt-3">
                         <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Recent Contributions</p>
                         <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                           {[...goal.contributions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10).map((c, idx) => (
                             <div key={c._id || idx} className="flex items-center justify-between text-xs py-0.5">
                               <span className="text-gray-500">
                                 {new Date(c.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                 {c.note ? ` — ${c.note}` : ""}
                               </span>
                               <span className="font-semibold text-emerald-600">+{fmt(c.amount)}</span>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}
                   </div>
                 );
               }) : (
                 <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center py-10 mb-6">
                   <p className="text-sm font-semibold text-gray-700 mb-2">No Savings Goals</p>
                   <p className="text-xs text-gray-400 mb-4">Create a goal to start tracking your savings progress.</p>
                   <button
                     onClick={() => setShowGoalModal(true)}
                     className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition shadow-sm"
                   >
                     Create Savings Goal
                   </button>
                 </div>
               )}
            </div>

            {/* Spending Persona — DYNAMIC */}
            <div className="col-span-1">
               <div className="bg-indigo-500 rounded-2xl p-5 shadow-sm text-white h-full flex flex-col justify-center">
                 <div className="bg-white/20 w-8 h-8 rounded-lg flex items-center justify-center mb-4">
                   <span className="text-sm">🎯</span>
                 </div>
                 <p className="text-xs text-indigo-100 mb-1">Spending Persona</p>
                 <p className="text-lg font-bold mb-2">{persona.title}</p>
                 <p className="text-[10px] text-indigo-200">{persona.desc}</p>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
            {/* Alerts & Insights — DYNAMIC */}
            <div className="space-y-4">
               <h3 className="text-sm font-semibold text-gray-700">Alerts & Insights</h3>
               {alerts.length > 0 ? alerts.map((alert, idx) => {
                 const style = alertStyles[alert.type] || alertStyles.warning;
                 return (
                   <div key={alert.id || idx} className={`${style.bg} rounded-xl p-4 ${style.border} border flex justify-between items-center`}>
                     <div>
                       <p className={`text-xs ${style.text} font-medium whitespace-nowrap`}>{alert.msg}</p>
                       <p className={`text-[10px] ${style.sub} mt-1`}>{formatAlertTime(alert.ts)}</p>
                     </div>
                     <span className={`${style.arrow} cursor-pointer`}>›</span>
                   </div>
                 );
               }) : (
                 <>
                   <div className="bg-red-50 rounded-xl p-4 border border-red-100 flex justify-between items-center">
                     <div>
                       <p className="text-xs text-red-600 font-medium whitespace-nowrap">No alerts yet — start adding expenses</p>
                       <p className="text-[10px] text-red-400 mt-1">{formatAlertTime(now.toISOString())}</p>
                     </div>
                     <span className="text-red-400 cursor-pointer">›</span>
                   </div>
                   <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex justify-between items-center">
                     <div>
                       <p className="text-xs text-amber-600 font-medium whitespace-nowrap">Alerts will appear here based on your spending</p>
                       <p className="text-[10px] text-amber-400 mt-1">{formatAlertTime(now.toISOString())}</p>
                     </div>
                     <span className="text-amber-400 cursor-pointer">›</span>
                   </div>
                 </>
               )}
            </div>

            {/* Budget Streaks & Active Challenge — DYNAMIC */}
            <div className="space-y-4">
               <h3 className="text-sm font-semibold text-gray-700">Budget Streaks</h3>
               <div className="flex items-center gap-3">
                 <div className="bg-orange-100 w-10 h-10 rounded-full flex items-center justify-center text-orange-500 font-bold">
                   🔥
                 </div>
                 <div>
                   <p className="text-sm font-bold text-gray-800">{challenge?.streak || 0} day{(challenge?.streak || 0) !== 1 ? 's' : ''}</p>
                   <p className="text-xs text-gray-400">under budget</p>
                 </div>
               </div>
               <div className="bg-white border border-gray-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-700">Active Challenge</p>
                  <p className="text-[10px] text-gray-400 mb-3">
                    {challenge ? `Stay under ${fmt(challenge.limit)}/day for ${challenge.days} days` : "Add expenses to start a challenge"}
                  </p>
                  <div className="bg-gray-100 rounded-full h-1.5 mb-2">
                    <div className="bg-emerald-400 rounded-full h-1.5 transition-all" style={{ width: `${challengeProgress}%` }} />
                  </div>
                  <p className="text-[10px] text-gray-400">
                    {challenge ? `${challenge.streak} of ${challenge.days} days completed` : "0 of 7 days completed"}
                  </p>
               </div>
            </div>
          </div>
        </div>

        <div className={`fixed bottom-6 transition-all duration-300 flex gap-3 ${collapsed ? "left-20" : "left-56"}`}>
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-semibold shadow-lg text-sm flex items-center gap-2 transition"
          >
            + Add Expense
          </button>
        </div>

        {showModal && (
          <AddExpenseModal
            onAdd={handleAdd}
            onClose={() => setShowModal(false)}
            loading={false}
          />
        )}

        {showGoalModal && (
          <SavingsGoalModal
            onSave={handleSaveGoal}
            onClose={() => setShowGoalModal(false)}
            existingGoal={null}
          />
        )}

        {activeGoalForFunds && (
          <AddFundsModal
            goals={savingsGoals}
            initialGoalId={activeGoalForFunds._id}
            onSubmit={handleAddFunds}
            onClose={() => setActiveGoalForFunds(null)}
          />
        )}

        {activeGoalForAdjust && (
          <AdjustGoalModal
            goal={activeGoalForAdjust}
            onSubmit={handleAdjustGoal}
            onClose={() => setActiveGoalForAdjust(null)}
          />
        )}
      </main>
    </div>
  );
}
