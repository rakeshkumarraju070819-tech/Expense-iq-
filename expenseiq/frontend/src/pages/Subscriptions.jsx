import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import AddSubscriptionModal from "../components/AddSubscriptionModal";

// ── Local storage for subscriptions per user ──────────────────────────────
const getSubsKey = (userId) => `expenseiq_subs_${userId}`;

function loadSubscriptions(userId) {
  try { return JSON.parse(localStorage.getItem(getSubsKey(userId)) || "[]"); }
  catch { return []; }
}
function saveSubscriptions(userId, subs) {
  localStorage.setItem(getSubsKey(userId), JSON.stringify(subs));
}

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(n || 0);

export default function Subscriptions() {
  const { user, logout } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (user?.id) setSubscriptions(loadSubscriptions(user.id));
  }, [user?.id]);

  const persist = (updated) => {
    setSubscriptions(updated);
    if (user?.id) saveSubscriptions(user.id, updated);
  };

  const handleAdd = (data) => {
    const newSub = { id: "s_" + Date.now(), ...data, amount: parseFloat(data.amount) };
    persist([...subscriptions, newSub]);
    setShowModal(false);
  };

  const handleDelete = (id) => {
     if (window.confirm("Delete this subscription?")) {
         persist(subscriptions.filter(s => s.id !== id));
     }
  };

  // Calculations
  const totalMonthlyRecurring = subscriptions.reduce((sum, s) => {
    if (s.cycle === "Monthly") return sum + s.amount;
    if (s.cycle === "Yearly") return sum + (s.amount / 12);
    if (s.cycle === "Quarterly") return sum + (s.amount / 3);
    return sum;
  }, 0);

  const activeCount = subscriptions.length;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let nextSub = null;
  let minDays = Infinity;

  // Groupings Arrays
  const overdue = [];
  const dueSoon = [];
  const upcoming = [];

  subscriptions.forEach(sub => {
     const dueDate = new Date(sub.nextDueDate);
     dueDate.setHours(0, 0, 0, 0);
     
     const diffTime = dueDate - now;
     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

     // Status logic
     if (diffDays < 0) {
       overdue.push({ ...sub, diffDays });
     } else if (diffDays <= 7) {
       dueSoon.push({ ...sub, diffDays });
     } else {
       upcoming.push({ ...sub, diffDays });
     }

     // Calculate Next Upcoming
     if (diffDays >= 0 && diffDays < minDays) {
        minDays = diffDays;
        nextSub = sub;
     }
  });

  const nextUpcomingDays = minDays === Infinity ? 0 : minDays;
  const monthlyIncome = user?.monthlyBudget || 50000; // default income fallback for UI if users haven't set
  const commitmentPct = monthlyIncome > 0 ? ((totalMonthlyRecurring / monthlyIncome) * 100).toFixed(1) : 0;

  const getDayLabel = (diff) => {
     if (diff === 0) return "Due Today";
     if (diff === 1) return "Due in 1 day";
     if (diff === -1) return "Overdue by 1 days";
     if (diff < -1) return `Overdue by ${Math.abs(diff)} days`;
     return `Due in ${diff} days`;
  };

  const Card = ({ sub }) => {
     const isOverdue = sub.diffDays < 0;
     const isDueSoon = sub.diffDays >= 0 && sub.diffDays <= 7;
     let dotColor = "bg-gray-400";
     let badgeClass = "bg-gray-50 border-gray-100 text-gray-500";
     
     if (isOverdue) {
        dotColor = "bg-red-500";
        badgeClass = "bg-red-50 border-red-100 text-red-500";
     } else if (isDueSoon) {
        dotColor = "bg-amber-500";
        badgeClass = "bg-amber-50 border-amber-100 text-amber-600";
     } else {
        dotColor = "bg-emerald-500";
        badgeClass = "bg-emerald-50 border-emerald-100 text-emerald-600";
     }

     return (
       <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition cursor-pointer h-full min-h-[160px]">
          <div className="flex justify-between items-start mb-4">
             <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                   ${isOverdue ? 'bg-red-50 text-red-500' : isDueSoon ? 'bg-amber-50 text-amber-500' : 'bg-gray-50 text-gray-500'}`}
                >
                   {/* Fallback internal icon */}
                   <span className="text-xl">💳</span>
                </div>
                <div>
                   <h4 className="font-bold text-gray-800 tracking-tight leading-tight">{sub.title}</h4>
                   <p className="text-[11px] text-gray-400 mt-0.5">{sub.category} • {sub.cycle.toLowerCase()}</p>
                   <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-semibold tracking-wide ${badgeClass}`}>
                     <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></div>
                     {getDayLabel(sub.diffDays)}
                   </div>
                </div>
             </div>
             <div className="flex gap-2">
                <button className="text-gray-400 hover:text-indigo-500 transition">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(sub.id); }} className="text-gray-400 hover:text-red-500 transition">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
             </div>
          </div>
          <div className="flex justify-between items-end mt-4">
             <span className="text-xs text-gray-400">Amount</span>
             <span className="text-xl font-bold tracking-tight text-gray-800">{fmt(sub.amount)}</span>
          </div>
       </div>
     )
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
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Subscription & Recurring Payments</h1>
            <p className="text-sm text-gray-400 mt-0.5">Track all your recurring expenses and subscriptions</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-indigo-200 text-sm flex items-center gap-2 transition"
          >
            + Add Subscription
          </button>
        </div>

        {/* Top Summaries */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
           <div className="bg-white rounded-[1.25rem] p-6 shadow-sm border border-gray-100/50 relative overflow-hidden">
             <p className="text-xs font-semibold text-gray-400 mb-2.5">Total Monthly Recurring</p>
             <h2 className="text-3xl font-bold text-gray-800 tracking-tight">{fmt(totalMonthlyRecurring)}</h2>
             <p className="text-[11px] font-medium text-gray-400 mt-1">{activeCount} active subscriptions</p>
             <div className="absolute top-5 right-5 w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
             </div>
           </div>

           <div className="bg-[#1fc69c] text-white rounded-[1.25rem] p-6 shadow-md shadow-emerald-200 relative overflow-hidden">
             <p className="text-xs font-semibold text-emerald-100 mb-2.5">Next Upcoming Payment</p>
             <h2 className="text-3xl font-bold tracking-tight">{nextUpcomingDays} days</h2>
             <p className="text-[11px] font-medium text-emerald-100 mt-1">
               {nextSub ? `${nextSub.title} - ${fmt(nextSub.amount)}` : 'No upcoming payments'}
             </p>
             <div className="absolute top-5 right-5 w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
             </div>
           </div>

           <div className="bg-[#5978fc] text-white rounded-[1.25rem] p-6 shadow-md shadow-indigo-200 relative overflow-hidden">
             <p className="text-xs font-semibold text-indigo-100 mb-2.5">Monthly Commitment %</p>
             <h2 className="text-3xl font-bold tracking-tight">{commitmentPct}%</h2>
             <p className="text-[11px] font-medium text-indigo-100 mt-1">of monthly income</p>
             <div className="absolute top-5 right-5 w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-sm">
               %
             </div>
           </div>
        </div>

        {/* Empty State vs Lists */}
        {subscriptions.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100 text-center mt-10">
             <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🔄</div>
             <p className="text-xl font-bold text-gray-800 mb-1">No subscriptions added</p>
             <p className="text-sm text-gray-400">Add your first subscription to track recurring payments</p>
          </div>
        ) : (
          <div className="space-y-8 pb-10">
            {overdue.length > 0 && (
              <section>
                <h3 className="text-[15px] font-bold text-[#b0222a] mb-4">Overdue</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                  {overdue.map(s => <Card key={s.id} sub={s} />)}
                </div>
              </section>
            )}

            {dueSoon.length > 0 && (
              <section>
                <h3 className="text-[15px] font-bold text-[#a66a1e] mb-4">Due Soon</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                  {dueSoon.map(s => <Card key={s.id} sub={s} />)}
                </div>
              </section>
            )}

            {upcoming.length > 0 && (
              <section>
                <h3 className="text-[15px] font-bold text-gray-800 mb-4">Upcoming</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                  {upcoming.map(s => <Card key={s.id} sub={s} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {showModal && (
        <AddSubscriptionModal
          onAdd={handleAdd}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
