import { useState, useEffect, useCallback, useMemo } from "react";

// ── localStorage keys ─────────────────────────────────────────────────────────
const getExpenseKey = (userId) => `expenseiq_expenses_${userId}`;
const getSavingsGoalKey = (userId) => `expenseiq_savings_goal_${userId}`;
const getChallengeKey = (userId) => `expenseiq_challenge_${userId}`;
const getAlertsKey = (userId) => `expenseiq_alerts_${userId}`;

function loadJSON(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
}

function saveJSON(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export default function useExpenseStore(userId) {
  const [expenses, setExpenses] = useState([]);
  const [savingsGoal, setSavingsGoal] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [alerts, setAlerts] = useState([]);

  // Initial load
  useEffect(() => {
    if (!userId) return;
    setExpenses(loadJSON(getExpenseKey(userId), []));
    setSavingsGoal(loadJSON(getSavingsGoalKey(userId), null));
    setChallenge(loadJSON(getChallengeKey(userId), null));
    setAlerts(loadJSON(getAlertsKey(userId), []));
  }, [userId]);

  // Listen for cross-tab / cross-page storage changes
  useEffect(() => {
    const handler = (e) => {
      if (!userId) return;
      if (e.key === getExpenseKey(userId)) setExpenses(loadJSON(e.key, []));
      if (e.key === getSavingsGoalKey(userId)) setSavingsGoal(loadJSON(e.key, null));
      if (e.key === getChallengeKey(userId)) setChallenge(loadJSON(e.key, null));
      if (e.key === getAlertsKey(userId)) setAlerts(loadJSON(e.key, []));
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [userId]);

  // ── Persist helpers ───────────────────────────────────────────────────────
  const persistExpenses = useCallback((updated) => {
    setExpenses(updated);
    if (userId) saveJSON(getExpenseKey(userId), updated);
  }, [userId]);

  const persistSavingsGoal = useCallback((goal) => {
    setSavingsGoal(goal);
    if (userId) saveJSON(getSavingsGoalKey(userId), goal);
  }, [userId]);

  const persistChallenge = useCallback((ch) => {
    setChallenge(ch);
    if (userId) saveJSON(getChallengeKey(userId), ch);
  }, [userId]);

  const persistAlerts = useCallback((a) => {
    const trimmed = a.slice(0, 5);
    setAlerts(trimmed);
    if (userId) saveJSON(getAlertsKey(userId), trimmed);
  }, [userId]);

  // ── Derived date helpers ──────────────────────────────────────────────────
  const now = useMemo(() => new Date(), []);
  const monthlyBudget = 10000; // user?.monthlyBudget fallback

  const isThisMonth = useCallback((e) => {
    const d = new Date(e.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }, [now]);

  const isToday = useCallback((e) => {
    const d = new Date(e.date);
    return d.toDateString() === now.toDateString();
  }, [now]);

  const monthlyExpenses = useMemo(() => expenses.filter(isThisMonth), [expenses, isThisMonth]);
  const todayExpenses = useMemo(() => expenses.filter(isToday), [expenses, isToday]);
  const monthlyTotal = useMemo(() => monthlyExpenses.reduce((s, e) => s + e.amount, 0), [monthlyExpenses]);
  const todayTotal = useMemo(() => todayExpenses.reduce((s, e) => s + e.amount, 0), [todayExpenses]);

  return {
    expenses, persistExpenses,
    savingsGoal, persistSavingsGoal,
    challenge, persistChallenge,
    alerts, persistAlerts,
    monthlyExpenses, todayExpenses,
    monthlyTotal, todayTotal,
    monthlyBudget, now,
    isThisMonth, isToday,
  };
}
