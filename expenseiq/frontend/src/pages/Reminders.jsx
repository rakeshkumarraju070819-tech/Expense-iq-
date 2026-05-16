import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import AddReminderModal from "../components/AddReminderModal";

// ── Local storage for reminders per user ──────────────────────────────
const getRemindersKey = (userId) => `expenseiq_reminders_${userId}`;

function loadReminders(userId) {
  try { return JSON.parse(localStorage.getItem(getRemindersKey(userId)) || "[]"); }
  catch { return []; }
}
function saveReminders(userId, data) {
  localStorage.setItem(getRemindersKey(userId), JSON.stringify(data));
}

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(n || 0);

export default function Reminders() {
  const { user, logout } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  useEffect(() => {
    if (user?.id) setReminders(loadReminders(user.id));
  }, [user?.id]);

  const persist = (updated) => {
    setReminders(updated);
    if (user?.id) saveReminders(user.id, updated);
  };

  const handleAddOrEdit = (data) => {
    if (editItem) {
       persist(reminders.map(r => r.id === editItem.id ? { ...data, id: editItem.id, amount: parseFloat(data.amount) } : r));
    } else {
       const newReminder = { id: "rem_" + Date.now(), ...data, amount: parseFloat(data.amount) };
       persist([...reminders, newReminder]);
    }
    setShowModal(false);
    setEditItem(null);
  };

  const handleDelete = (id) => {
     if (window.confirm("Delete this payment reminder?")) {
         persist(reminders.filter(r => r.id !== id));
     }
  };

  const openEdit = (item) => {
     setEditItem(item);
     setShowModal(true);
  };

  // Groupings Arrays
  const overdue = [];
  const dueToday = [];
  const upcoming = [];

  let overdueSum = 0;
  let dueTodaySum = 0;
  let upcomingSum = 0;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  reminders.forEach(rm => {
     const dueDate = new Date(rm.dueDate);
     dueDate.setHours(0, 0, 0, 0);
     
     const diffTime = dueDate - now;
     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

     // Validating specific bounds constraints
     if (diffDays < 0) {
       overdue.push({ ...rm, diffDays });
       overdueSum += rm.amount;
     } else if (diffDays === 0) {
       dueToday.push({ ...rm, diffDays });
       dueTodaySum += rm.amount;
     } else {
       upcoming.push({ ...rm, diffDays });
       upcomingSum += rm.amount;
     }
  });

  const getDayLabel = (diff) => {
     if (diff === 0) return "Due Today";
     if (diff === -1) return "Overdue by 1 days";
     if (diff < -1) return `Overdue by ${Math.abs(diff)} days`;
     return `Due in ${diff} days`;
  };

  const Card = ({ item, status }) => {
     const isOverdue = status === 'overdue';
     const isDueToday = status === 'today';
     
     let dotColor = "bg-gray-400";
     let badgeClass = "bg-gray-50 border-gray-100 text-gray-500";
     
     if (isOverdue) {
        dotColor = "bg-red-500";
        badgeClass = "bg-red-50 border-red-100 text-red-500";
     } else if (isDueToday) {
        dotColor = "bg-amber-500";
        badgeClass = "bg-amber-50 border-amber-100 text-amber-600";
     } else {
        dotColor = "bg-blue-500";
        badgeClass = "bg-blue-50 border-blue-100 text-blue-600";
     }

     return (
       <div className="bg-white rounded-[1.25rem] p-5 border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col justify-between h-full min-h-[160px]">
          <div className="flex justify-between items-start mb-4">
             <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                   ${isOverdue ? 'bg-red-50 text-red-500' : isDueToday ? 'bg-amber-50 text-amber-500' : 'bg-gray-50 text-gray-800'}`}
                >
                   <span className="text-xl">🔔</span>
                </div>
                <div>
                   <h4 className="font-bold text-gray-800 tracking-tight leading-tight">{item.title}</h4>
                   <p className="text-[11px] text-gray-400 mt-0.5">{item.category}</p>
                   <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-semibold tracking-wide ${badgeClass}`}>
                     <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></div>
                     {getDayLabel(item.diffDays)}
                   </div>
                </div>
             </div>
             <div className="flex gap-2">
                <button onClick={() => openEdit(item)} className="text-gray-400 hover:text-indigo-500 transition">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </button>
                <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-500 transition">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
             </div>
          </div>
          <div className="flex justify-between items-end mt-4">
             <span className="text-xs text-gray-400">Amount</span>
             <span className="text-xl font-bold tracking-tight text-gray-800">{fmt(item.amount)}</span>
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
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Payment Reminders</h1>
            <p className="text-sm text-gray-400 mt-0.5">Manage your upcoming payments and bills</p>
          </div>
          <button
            onClick={() => { setEditItem(null); setShowModal(true); }}
            className="bg-[#5978fc] hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-indigo-200 text-sm flex items-center gap-2 transition"
          >
            + Add Reminder
          </button>
        </div>

        {/* Top Summaries */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
           <div className="bg-white rounded-[1.25rem] p-6 shadow-sm border border-gray-100/50 relative overflow-hidden h-32 flex flex-col justify-between">
             <p className="text-xs font-semibold text-gray-400">Upcoming</p>
             <div>
                <h2 className="text-3xl font-bold text-gray-800 tracking-tight">{upcoming.length}</h2>
                <p className="text-[11px] font-medium text-gray-400 mt-1">{fmt(upcomingSum)}</p>
             </div>
             <div className="absolute top-5 right-5 w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
               <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
             </div>
           </div>

           <div className="bg-[#f59e35] text-white rounded-[1.25rem] p-6 shadow-md shadow-orange-200 relative overflow-hidden h-32 flex flex-col justify-between">
             <p className="text-xs font-semibold text-orange-100">Due Today</p>
             <div>
               <h2 className="text-3xl font-bold tracking-tight">{dueToday.length}</h2>
               <p className="text-[11px] font-medium text-orange-100 mt-1">{fmt(dueTodaySum)}</p>
             </div>
             <div className="absolute top-5 right-5 w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white">
               <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
             </div>
           </div>

           <div className="bg-[#f05c60] text-white rounded-[1.25rem] p-6 shadow-md shadow-red-200 relative overflow-hidden h-32 flex flex-col justify-between">
             <p className="text-xs font-semibold text-red-100">Overdue</p>
             <div>
               <h2 className="text-3xl font-bold tracking-tight">{overdue.length}</h2>
               <p className="text-[11px] font-medium text-red-100 mt-1">{fmt(overdueSum)}</p>
             </div>
             <div className="absolute top-5 right-5 w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white">
               <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
             </div>
           </div>
        </div>

        {/* Empty State vs Lists */}
        {reminders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100 text-center mt-10">
             <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🔔</div>
             <p className="text-xl font-bold text-gray-800 mb-1">No payment reminders added</p>
             <p className="text-sm text-gray-400">Add your first reminder to track upcoming payments</p>
          </div>
        ) : (
          <div className="space-y-8 pb-10">
            {overdue.length > 0 && (
              <section>
                <h3 className="text-[15px] font-bold text-[#b0222a] mb-4">Overdue</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                  {overdue.map(r => <Card key={r.id} item={r} status="overdue" />)}
                </div>
              </section>
            )}

            {dueToday.length > 0 && (
              <section>
                <h3 className="text-[15px] font-bold text-[#a66a1e] mb-4">Due Today</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                  {dueToday.map(r => <Card key={r.id} item={r} status="today" />)}
                </div>
              </section>
            )}

            {upcoming.length > 0 && (
              <section>
                <h3 className="text-[15px] font-bold text-gray-800 mb-4">Upcoming</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                  {upcoming.map(r => <Card key={r.id} item={r} status="upcoming" />)}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {showModal && (
        <AddReminderModal
          onAdd={handleAddOrEdit}
          onClose={() => setShowModal(false)}
          editData={editItem}
        />
      )}
    </div>
  );
}
