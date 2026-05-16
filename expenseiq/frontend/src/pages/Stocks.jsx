import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import AddStockModal from "../components/AddStockModal";

const getStocksKey = (userId) => `expenseiq_stocks_${userId}`;

function loadStocks(userId) {
  try { return JSON.parse(localStorage.getItem(getStocksKey(userId)) || "[]"); }
  catch { return []; }
}
function saveStocks(userId, data) {
  localStorage.setItem(getStocksKey(userId), JSON.stringify(data));
}

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 2,
  }).format(n || 0);

export default function Stocks() {
  const { user, logout } = useAuth();
  const [stocks, setStocks] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (user?.id) setStocks(loadStocks(user.id));
  }, [user?.id]);

  const persist = (updated) => {
    setStocks(updated);
    if (user?.id) saveStocks(user.id, updated);
  };

  const handleAdd = (data) => {
    const q = parseFloat(data.quantity) || 0;
    const c = parseFloat(data.currentPrice) || 0;
    const b = parseFloat(data.purchasePrice) || 0;
    
    const newStock = { 
      id: "stk_" + Date.now(), 
      name: data.name,
      symbol: data.symbol,
      quantity: q,
      currentPrice: c,
      purchasePrice: b,
      purchaseDate: data.purchaseDate || ""
    };
    persist([...stocks, newStock]);
    setShowModal(false);
  };

  const handleDelete = (id) => {
     if (window.confirm("Delete this stock asset?")) {
         persist(stocks.filter(s => s.id !== id));
     }
  };

  // Calculations
  let totalPortfolioValue = 0;
  let totalCostBase = 0;

  stocks.forEach(stk => {
     totalPortfolioValue += (stk.quantity * stk.currentPrice);
     totalCostBase += (stk.quantity * stk.purchasePrice);
  });

  let todayGainPct = 0;
  if (totalCostBase > 0) {
     todayGainPct = ((totalPortfolioValue - totalCostBase) / totalCostBase) * 100;
     if (!isFinite(todayGainPct)) todayGainPct = 0;
  }

  const isPositive = todayGainPct >= 0;

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
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Stock Assets</h1>
            <p className="text-sm text-gray-400 mt-0.5">Track your stock portfolio performance</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#5978fc] hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-indigo-200 text-sm flex items-center gap-2 transition"
          >
            + Add Stock
          </button>
        </div>

        {/* Global Summary Card */}
        <div className="bg-[#1c222b] text-white rounded-3xl p-8 shadow-lg mb-8 relative overflow-hidden">
           <p className="text-xs font-medium text-gray-400 mb-2">Total Stock Assets</p>
           <h2 className="text-4xl font-bold tracking-tight mb-4">{fmt(totalPortfolioValue)}</h2>
           
           <div className="flex items-center gap-3">
              <div className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 ${isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {isPositive ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
                )}
                {isPositive ? '+' : ''}{todayGainPct.toFixed(1)}%
              </div>
              <span className="text-xs text-gray-400">Today's gain</span>
           </div>
        </div>

        {/* Table & Lists */}
        {stocks.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100 text-center">
             <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">📈</div>
             <p className="text-xl font-bold text-gray-800 mb-1">No stock assets added</p>
             <p className="text-sm text-gray-400">Add your first stock to track portfolio performance</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-4 px-6 text-xs font-semibold text-gray-400 whitespace-nowrap">Stock Name</th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-400 whitespace-nowrap text-right">Quantity</th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-400 whitespace-nowrap text-right">Current Price</th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-400 whitespace-nowrap text-right">Total Value</th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-400 whitespace-nowrap text-right">Gain/Loss</th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-400 whitespace-nowrap text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {stocks.map(stk => {
                     const val = stk.quantity * stk.currentPrice;
                     let gain = 0;
                     if (stk.purchasePrice > 0) {
                       gain = ((stk.currentPrice - stk.purchasePrice) / stk.purchasePrice) * 100;
                     }
                     const pos = gain >= 0;

                     return (
                       <tr key={stk.id} className="hover:bg-gray-50/50 transition">
                         <td className="py-5 px-6">
                           <div className="font-semibold text-[13px] text-gray-800">{stk.name}</div>
                         </td>
                         <td className="py-4 px-6 text-[13px] text-gray-600 text-right">{stk.quantity}</td>
                         <td className="py-4 px-6 text-[13px] text-gray-600 text-right">{fmt(stk.currentPrice)}</td>
                         <td className="py-4 px-6 text-[13px] font-bold text-gray-800 text-right">{fmt(val)}</td>
                         <td className={`py-4 px-6 text-[13px] font-bold text-right ${pos ? 'text-emerald-500' : 'text-red-500'}`}>
                           {pos ? '+' : ''}{gain.toFixed(1)}%
                         </td>
                         <td className="py-4 px-6 text-center">
                           <button onClick={() => handleDelete(stk.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition inline-flex items-center justify-center">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                           </button>
                         </td>
                       </tr>
                     );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {showModal && (
        <AddStockModal
          onAdd={handleAdd}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
