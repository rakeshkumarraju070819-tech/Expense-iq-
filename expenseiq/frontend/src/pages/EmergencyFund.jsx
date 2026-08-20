import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import AddFundsModal from "../components/AddFundsModal";
import AdjustGoalModal from "../components/AdjustGoalModal";
import SavingsGoalModal from "../components/SavingsGoalModal";
import GoalSelectorModal from "../components/GoalSelectorModal";
import { getSavingsGoals, createSavingsGoal, updateSavingsGoal, addContribution } from "../api/savingsGoal.api";

// ── Local storage helper for persisting states ──────────────────────────────
const getStoreKey = (userId) => `expenseiq_emergency_${userId}`;

function loadEmergencyData(userId) {
  try {
    const data = JSON.parse(localStorage.getItem(getStoreKey(userId)));
    if (data) return data;
  } catch { /* ignore */ }
  return { currentBalance: 0, targetGoal: 0, monthlyContribution: 5000 };
}
function saveEmergencyData(userId, data) {
  localStorage.setItem(getStoreKey(userId), JSON.stringify(data));
}

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(n || 0);

export default function EmergencyFund() {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const [currentBalance, setCurrentBalance] = useState(0);
  const [targetGoal, setTargetGoal] = useState(0);
  const [monthlyContribution, setMonthlyContribution] = useState(5000);

  useEffect(() => {
    if (user?.id) {
       const data = loadEmergencyData(user.id);
       setCurrentBalance(data.currentBalance || 0);
       setTargetGoal(data.targetGoal || 0);
       setMonthlyContribution(data.monthlyContribution || 5000);
    }
  }, [user?.id]);

  const persist = (bal, goal, cont) => {
    setCurrentBalance(bal);
    setTargetGoal(goal);
    if (user?.id) saveEmergencyData(user.id, { currentBalance: bal, targetGoal: goal, monthlyContribution: cont });
  };

  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [showAdjustGoalModal, setShowAdjustGoalModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showGoalSelectorModal, setShowGoalSelectorModal] = useState(false);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [savingsGoal, setSavingsGoal] = useState(null);

  const loadGoals = useCallback(async () => {
    try {
      const res = await getSavingsGoals();
      const goals = res.goals || [];
      setSavingsGoals(goals);
      const active = goals.length > 0 ? goals[0] : null;
      setSavingsGoal(active);
      if (active) {
        setCurrentBalance(active.savedAmount || 0);
        setTargetGoal(active.targetAmount || 0);
        setMonthlyContribution(active.monthlySavingTarget || 0);
      } else if (user?.id) {
        const data = loadEmergencyData(user.id);
        setCurrentBalance(data.currentBalance || 0);
        setTargetGoal(data.targetGoal || 0);
        setMonthlyContribution(data.monthlyContribution || 5000);
      }
    } catch { /* ignore */ }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) loadGoals();
  }, [user?.id, loadGoals]);

  const handleAddFunds = useCallback(async (goalId, data) => {
    try {
      await addContribution(goalId, data);
      await loadGoals();
    } catch (err) { console.error("Failed to add funds:", err); }
    setShowAddFundsModal(false);
  }, [loadGoals]);

  const handleAdjustGoal = useCallback(async (data) => {
    if (!savingsGoal?._id) return;
    try {
      await updateSavingsGoal(savingsGoal._id, data);
      await loadGoals();
    } catch (err) { console.error("Failed to adjust goal:", err); }
    setShowAdjustGoalModal(false);
  }, [savingsGoal, loadGoals]);

  const handleAdjustGoalClick = () => {
    if (savingsGoals.length === 0) {
      setShowGoalModal(true);
    } else if (savingsGoals.length === 1) {
      setSavingsGoal(savingsGoals[0]);
      setShowAdjustGoalModal(true);
    } else {
      setShowGoalSelectorModal(true);
    }
  };

  const handleCreateGoal = useCallback(async (goalData) => {
    try {
      await createSavingsGoal(goalData);
      await loadGoals();
    } catch (err) { console.error("Failed to create goal:", err); }
    setShowGoalModal(false);
  }, [loadGoals]);

  const monthlyExpenses = user?.monthlyBudget || 25000;
  
  // Math logic securely bounded
  let remainingAmount = targetGoal - currentBalance;
  if (remainingAmount < 0) remainingAmount = 0;
  
  let progressPct = 0;
  if (targetGoal > 0) {
     progressPct = (currentBalance / targetGoal) * 100;
     if (progressPct > 100) progressPct = 100;
  }

  let timeToGoal = 0;
  if (remainingAmount > 0 && monthlyContribution > 0) {
     timeToGoal = Math.ceil(remainingAmount / monthlyContribution);
     if (!isFinite(timeToGoal)) timeToGoal = 0;
  }

  return (
    <div className="flex min-h-screen bg-[#fafafa] font-sans">
      <Sidebar
        totalExpenses={0} 
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        onLogout={() => logout()}
      />

      <main className="flex-1 overflow-auto p-6 md:p-8 min-w-0">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Emergency Fund</h1>
          <p className="text-sm text-gray-400 mt-0.5">Build and track your emergency savings goal</p>
        </div>

        {/* Top Summaries */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
           <div className="bg-white rounded-[1.25rem] p-6 shadow-sm border border-gray-100/50 relative overflow-hidden">
             <p className="text-xs font-semibold text-gray-400 mb-2.5">Current Balance</p>
             <h2 className="text-3xl font-bold text-gray-800 tracking-tight">{fmt(currentBalance)}</h2>
             <p className="text-[11px] font-medium text-gray-400 mt-1">Available for emergencies</p>
             <div className="absolute top-5 right-5 w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
             </div>
           </div>

           <div className="bg-[#5978fc] text-white rounded-[1.25rem] p-6 shadow-md shadow-indigo-200 relative overflow-hidden">
             <p className="text-xs font-semibold text-indigo-100 mb-2.5">Target Goal</p>
             <h2 className="text-3xl font-bold tracking-tight">{fmt(targetGoal)}</h2>
             <p className="text-[11px] font-medium text-indigo-100 mt-1">6 months of expenses</p>
             <div className="absolute top-5 right-5 w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
             </div>
           </div>

           <div className="bg-[#1fc69c] text-white rounded-[1.25rem] p-6 shadow-md shadow-emerald-200 relative overflow-hidden">
             <p className="text-xs font-semibold text-emerald-100 mb-2.5">Progress</p>
             <h2 className="text-3xl font-bold tracking-tight">{progressPct.toFixed(0)}%</h2>
             <p className="text-[11px] font-medium text-emerald-100 mt-1">{fmt(remainingAmount)} remaining</p>
             <div className="absolute top-5 right-5 w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
             </div>
           </div>
        </div>

        {/* Emergency Fund Progress Section */}
        <div className="bg-white rounded-[1.25rem] p-6 shadow-sm border border-gray-100/50 mb-8">
           <h2 className="text-[15px] font-bold text-gray-800 tracking-tight mb-4">Emergency Fund Progress</h2>
           
           <div className="flex justify-between items-end mb-2">
             <span className="text-[11px] text-gray-500">{fmt(currentBalance)} saved</span>
             <span className="text-[11px] text-gray-500">{fmt(targetGoal)} goal</span>
           </div>
           
           <div className="w-full bg-[#f3f4f6] rounded-full h-3 mb-3 shrink-0 overflow-hidden">
              <div 
                className="bg-[#1fc69c] h-3 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressPct}%` }}
              ></div>
           </div>

           <p className="text-[11px] text-gray-400">Keep saving {fmt(monthlyContribution)} per month to reach your goal in {timeToGoal} months</p>
        </div>

        {/* Why Emergency Fund? Section */}
        <div className="bg-gradient-to-r from-[#8165f9] to-[#5978fc] text-white rounded-[1.25rem] p-6 shadow-md shadow-indigo-200 mb-8">
           <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div>
                 <h2 className="text-[15px] font-bold tracking-tight">Why Emergency Fund?</h2>
                 <p className="text-[11px] text-indigo-100 mt-0.5">Protection against unexpected expenses</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-xl p-4">
                 <p className="text-[10px] text-indigo-100 mb-1 font-semibold tracking-wide">Recommended</p>
                 <p className="text-xl font-bold tracking-tight">3-6 months</p>
                 <p className="text-[10px] text-indigo-100 mt-1">of expenses</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                 <p className="text-[10px] text-indigo-100 mb-1 font-semibold tracking-wide">Monthly Expenses</p>
                 <p className="text-xl font-bold tracking-tight">{fmt(monthlyExpenses)}</p>
                 <p className="text-[10px] text-indigo-100 mt-1">average spending</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                 <p className="text-[10px] text-indigo-100 mb-1 font-semibold tracking-wide">Time to Goal</p>
                 <p className="text-xl font-bold tracking-tight">{timeToGoal} months</p>
                 <p className="text-[10px] text-indigo-100 mt-1">at current rate</p>
              </div>
           </div>
        </div>

         {/* Quick Actions */}
        <div className="bg-white rounded-[1.25rem] p-6 shadow-sm border border-gray-100/50">
           <h2 className="text-[15px] font-bold text-gray-800 tracking-tight mb-5">Quick Actions</h2>
           <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => savingsGoals.length > 0 ? setShowAddFundsModal(true) : setShowGoalModal(true)}
                className="flex-1 bg-[#1fc69c] hover:bg-[#1bb890] text-white py-3 rounded-xl font-bold text-[13px] shadow-md shadow-emerald-100 transition flex justify-center items-center gap-2"
              >
                + Add Funds
              </button>
              <button
                onClick={handleAdjustGoalClick}
                className="flex-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 py-3 rounded-xl font-bold text-[13px] transition flex justify-center items-center gap-2 shadow-sm"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                Adjust Goal
              </button>
           </div>
        </div>

        {showAddFundsModal && (
          <AddFundsModal
            goals={savingsGoals}
            onSubmit={handleAddFunds}
            onClose={() => setShowAddFundsModal(false)}
          />
        )}

        {showAdjustGoalModal && savingsGoal && (
          <AdjustGoalModal
            goal={savingsGoal}
            onSubmit={handleAdjustGoal}
            onClose={() => setShowAdjustGoalModal(false)}
          />
        )}

        {showGoalModal && (
          <SavingsGoalModal
            onSave={handleCreateGoal}
            onClose={() => setShowGoalModal(false)}
            existingGoal={null}
          />
        )}

        {showGoalSelectorModal && (
          <GoalSelectorModal
            goals={savingsGoals}
            onSelect={(selected) => {
              setSavingsGoal(selected);
              setShowGoalSelectorModal(false);
              setShowAdjustGoalModal(true);
            }}
            onClose={() => setShowGoalSelectorModal(false)}
          />
        )}
      </main>
    </div>
  );
}
