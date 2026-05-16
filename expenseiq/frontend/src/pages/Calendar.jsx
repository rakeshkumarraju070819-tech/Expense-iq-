import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";

// ── Local expense storage per user ────────────────────────────────────────────
const getExpenseKey = (userId) => `expenseiq_expenses_${userId}`;

function loadExpenses(userId) {
  try { return JSON.parse(localStorage.getItem(getExpenseKey(userId)) || "[]"); }
  catch { return []; }
}

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(n || 0);

export default function CalendarPage() {
  const { user, logout } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (user?.id) setExpenses(loadExpenses(user.id));
  }, [user?.id]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeDateStr, setActiveDateStr] = useState(null);

  // Month navigation
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // Calendar logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const monthName = currentDate.toLocaleString("en-US", { month: "long" });

  const getExpensesForDate = (dateStr) => expenses.filter(e => {
    const d = new Date(e.date);
    return d.toDateString() === new Date(dateStr).toDateString();
  });

  const getDailyTotal = (dateStr) => {
    return getExpensesForDate(dateStr).reduce((sum, e) => sum + e.amount, 0);
  };

  const getColorClass = (total) => {
    if (total < 500) return "bg-emerald-500"; // Low
    if (total < 800) return "bg-amber-500";   // Medium (Orange)
    return "bg-red-500";                      // High
  };

  const days = [];
  // Prefix empty cells
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-32 rounded-xl" />);
  }

  // Days
  for (let d = 1; d <= daysInMonth; d++) {
    const fullDate = new Date(year, month, d);
    const dateStr = fullDate.toDateString();
    
    // For visual similarity, if 0 show 0 and green as "Low spending"
    // The user requirement: "Initially, all values should be 0"
    const total = getDailyTotal(fullDate);
    const colorClass = getColorClass(total);
    const isSelected = activeDateStr === dateStr;

    days.push(
      <div 
        key={d} 
        onClick={() => setActiveDateStr(dateStr)}
        className={`h-32 rounded-2xl p-3 cursor-pointer transition flex flex-col text-white ${colorClass} ${isSelected ? "ring-4 ring-indigo-500 ring-offset-2 scale-[1.02]" : "hover:scale-[1.02] shadow-sm"}`}
      >
        <span className="text-xs font-semibold opacity-90">{d.toString().padStart(2, "0")}</span>
        <span className="text-xl font-bold mt-1 tracking-tight">{fmt(total)}</span>
      </div>
    );
  }

  const activeDateObj = activeDateStr ? new Date(activeDateStr) : null;
  const activeExpenses = activeDateStr ? getExpensesForDate(activeDateStr) : [];
  
  // Fake expenses formatting
  const timeStr = activeDateObj ? "4:00 PM" : ""; // static time mapping for visuals

  const monthlyTotal = expenses.reduce((s, e) => {
    const d = new Date(e.date);
    if(d.getFullYear() === year && d.getMonth() === month) return s + e.amount;
    return s;
  }, 0);

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar
        totalExpenses={monthlyTotal}
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        onLogout={() => logout()}
      />

      <main className="flex-1 overflow-auto p-6 md:p-8 min-w-0">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Calendar View</h1>
          <p className="text-sm text-gray-400 mt-0.5">Track your daily spending patterns</p>
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 mb-8 max-w-6xl mx-auto">
          {/* Calendar Header */}
          <div className="flex justify-between items-center mb-6 px-2">
             <h2 className="text-xl font-semibold text-gray-800">{monthName} {year}</h2>
             <div className="flex gap-4 text-gray-400">
                <button onClick={prevMonth} className="hover:text-gray-800 transition text-lg">&lt;</button>
                <button onClick={nextMonth} className="hover:text-gray-800 transition text-lg">&gt;</button>
             </div>
          </div>

          {/* Weekdays */}
          <div className="grid grid-cols-7 mb-3">
             {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
               <div key={day} className="text-center text-xs text-gray-500 font-medium">
                  {day}
               </div>
             ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-3">
             {days}
          </div>
        </div>

        {/* Selected Date Details Panel */}
        {activeDateObj && (
          <div className="bg-indigo-500/95 rounded-2xl p-6 shadow-md max-w-6xl mx-auto text-white">
            <div className="mb-6">
               <h3 className="text-xl font-bold">
                 {activeDateObj.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
               </h3>
               <p className="text-sm text-indigo-200">
                 {activeDateObj.toLocaleString('en-US', { weekday: 'long' })}
               </p>
            </div>

            {/* Placeholder Layout (3 small, 2 long) matching screenshot */}
            <div className="space-y-3 mb-6">
               <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/10 rounded-lg h-20"></div>
                  <div className="bg-white/10 rounded-lg h-20"></div>
                  <div className="bg-white/10 rounded-lg h-20"></div>
               </div>
               <div className="bg-white/10 rounded-lg h-12"></div>
               <div className="bg-white/10 rounded-lg h-12"></div>
            </div>

            {/* List */}
            <div className="space-y-2">
              {activeExpenses.length > 0 ? (
                activeExpenses.map(exp => (
                  <div key={exp.id} className="bg-white/10 rounded-xl p-4 flex justify-between items-center">
                    <div>
                       <p className="font-semibold text-sm">{exp.title}</p>
                       <p className="text-xs text-indigo-200 mt-1">{exp.category} • {new Date(exp.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                    <span className="font-bold text-sm">₹{exp.amount}</span>
                  </div>
                ))
              ) : (
                <div className="bg-white/10 rounded-xl p-4 flex justify-between items-center opacity-75">
                  <div>
                    <p className="font-semibold text-sm">No expenses</p>
                    <p className="text-xs text-indigo-200 mt-1">Free day • Enjoy</p>
                  </div>
                  <span className="font-bold text-sm">₹0</span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
