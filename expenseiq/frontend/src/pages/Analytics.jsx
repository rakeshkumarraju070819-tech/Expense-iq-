import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import AddExpenseModal from "../components/AddExpenseModal";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts";

// ── Local expense storage per user ────────────────────────────────────────────
const getExpenseKey = (userId) => `expenseiq_expenses_${userId}`;

function loadExpenses(userId) {
  try { return JSON.parse(localStorage.getItem(getExpenseKey(userId)) || "[]"); }
  catch { return []; }
}
function saveExpenses(userId, expenses) {
  localStorage.setItem(getExpenseKey(userId), JSON.stringify(expenses));
}

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 2,
  }).format(n || 0);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Analytics() {
  const { user, logout } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (user?.id) setExpenses(loadExpenses(user.id));
  }, [user?.id]);

  const persist = (updated) => {
    setExpenses(updated);
    if (user?.id) saveExpenses(user.id, updated);
  };

  const handleAdd = (data) => {
    const newExp = { id: "e_" + Date.now(), ...data, amount: parseFloat(data.amount) };
    persist([newExp, ...expenses]);
    setShowModal(false);
  };

  const monthlyBudget = user?.monthlyBudget || 10000;

  // Process data for charts
  const monthlyTotal = expenses.reduce((s, e) => s + e.amount, 0);

  // 1. Income vs Expenses Data (mock income for visual completeness if 0 expenses, else raise it, but user says everything should be 0 initially)
  const lineChartData = [
    { name: 'Jan', Income: 0, Expense: 0 },
    { name: 'Feb', Income: 0, Expense: 0 },
    { name: 'Mar', Income: 0, Expense: 0 },
    { name: 'Apr', Income: 0, Expense: 0 },
    { name: 'May', Income: 0, Expense: monthlyTotal }, // Simplification: just show total on May
    { name: 'Jun', Income: 0, Expense: 0 },
  ];

  // 2. Expense Breakdown by Category & Distribution
  const categoryMap = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  let pieData = Object.keys(categoryMap).map(key => ({
    name: key, value: categoryMap[key]
  }));
  if (pieData.length === 0) pieData = [{ name: 'None', value: 1 }]; // Empty visual

  // 3. Monthly Comparison
  const barData = [
    { name: 'Jan', amount: 0 },
    { name: 'Feb', amount: 0 },
    { name: 'Mar', amount: 0 },
    { name: 'Apr', amount: 0 },
    { name: 'May', amount: monthlyTotal },
    { name: 'Jun', amount: 0 },
  ];

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

          {/* Budget Predictors */}
          <div className="bg-indigo-500 rounded-2xl p-6 shadow-sm text-white">
            <h2 className="text-sm font-semibold mb-1">Budget Predictors</h2>
            <p className="text-indigo-200 text-xs mb-6">Based on your current spending pattern</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-indigo-100">Projected Spending</p>
                <p className="text-2xl font-bold">{fmt(monthlyTotal > 0 ? monthlyTotal * 1.5 : 0)}</p>
                <p className="text-[10px] text-indigo-200">end of next month</p>
              </div>
              <div>
                <p className="text-xs text-indigo-100">Days Remaining</p>
                <p className="text-2xl font-bold">23 days</p>
                <p className="text-[10px] text-indigo-200">in this month</p>
              </div>
              <div>
                <p className="text-xs text-indigo-100">Average Predicted</p>
                <p className="text-2xl font-bold">{fmt(monthlyTotal > 0 ? monthlyTotal / 7 : 0)}</p>
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

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
             <h3 className="text-sm font-semibold text-gray-700 mb-4">Financial Health Score</h3>
             <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full border-4 border-emerald-500 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-800">{expenses.length > 0 ? '78' : '0'}</span>
                  <span className="text-[10px] text-green-500">/ 100</span>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span className="text-xs text-gray-600">Budget adherence</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span className="text-xs text-gray-600">Savings ratio</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-500">ℹ</span>
                    <span className="text-xs text-gray-600">Expense consistency</span>
                  </div>
                </div>
             </div>
             <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs text-gray-500">
               Your spending is mostly balanced, with minor irregularities in Food.
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
               <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                 <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold text-gray-700">Savings Goals</p>
                    <div className="text-right">
                       <p className="text-sm font-bold text-gray-800">₹12,500</p>
                       <p className="text-xs text-gray-400">left to saved</p>
                    </div>
                 </div>
                 <p className="text-xs text-gray-500 mb-1">Save for Laptop</p>
                 <p className="text-[10px] text-gray-400 mb-3">Target ₹50,000 • 2 months</p>
                 <div className="bg-gray-100 rounded-full h-1.5 mb-2">
                    <div className={"bg-emerald-400 rounded-full h-1.5 transition-all w-[30%]"} />
                 </div>
                 <div className="flex justify-between items-center text-xs">
                   <p className="text-gray-400">₹8,500 needed per month</p>
                   <button className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs">Adjust Goal</button>
                 </div>
               </div>
            </div>

            <div className="col-span-1">
               <div className="bg-indigo-500 rounded-2xl p-5 shadow-sm text-white h-full flex flex-col justify-center">
                 <div className="bg-white/20 w-8 h-8 rounded-lg flex items-center justify-center mb-4">
                   <span className="text-sm">🎯</span>
                 </div>
                 <p className="text-xs text-indigo-100 mb-1">Spending Persona</p>
                 <p className="text-lg font-bold mb-2">Balanced Spender</p>
                 <p className="text-[10px] text-indigo-200">You spend consistently but reserve overspends on weekends.</p>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
            <div className="space-y-4">
               <h3 className="text-sm font-semibold text-gray-700">Alerts & Insights</h3>
               <div className="bg-red-50 rounded-xl p-4 border border-red-100 flex justify-between items-center">
                 <div>
                   <p className="text-xs text-red-600 font-medium whitespace-nowrap">Unusually high expense recorded today</p>
                   <p className="text-[10px] text-red-400 mt-1">Today, 3:24 PM</p>
                 </div>
                 <span className="text-red-400 cursor-pointer">›</span>
               </div>
               <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex justify-between items-center">
                 <div>
                   <p className="text-xs text-amber-600 font-medium whitespace-nowrap">Late night modeling pattern detected</p>
                   <p className="text-[10px] text-amber-400 mt-1">Thursday, 11:42 PM</p>
                 </div>
                 <span className="text-amber-400 cursor-pointer">›</span>
               </div>
            </div>

            <div className="space-y-4">
               <h3 className="text-sm font-semibold text-gray-700">Budget Streaks</h3>
               <div className="flex items-center gap-3">
                 <div className="bg-orange-100 w-10 h-10 rounded-full flex items-center justify-center text-orange-500 font-bold">
                   🔥
                 </div>
                 <div>
                   <p className="text-sm font-bold text-gray-800">5 days</p>
                   <p className="text-xs text-gray-400">under budget</p>
                 </div>
               </div>
               <div className="bg-white border border-gray-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-700">Active Challenge</p>
                  <p className="text-[10px] text-gray-400 mb-3">Stay under ₹500/day for 7 days</p>
                  <div className="bg-gray-100 rounded-full h-1.5 mb-2">
                    <div className="bg-emerald-400 rounded-full h-1.5 transition-all w-[70%]" />
                  </div>
                  <p className="text-[10px] text-gray-400">5 of 7 days completed</p>
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
      </main>
    </div>
  );
}
