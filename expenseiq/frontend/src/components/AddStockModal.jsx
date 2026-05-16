import { useState } from "react";

export default function AddStockModal({ onAdd, onClose, editData }) {
  const [formData, setFormData] = useState(
    editData || {
      name: "",
      symbol: "",
      quantity: "",
      purchasePrice: "",
      currentPrice: "",
      purchaseDate: "",
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.symbol || !formData.quantity || !formData.purchasePrice || !formData.currentPrice) return;
    onAdd(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-xl font-bold text-gray-800">{editData ? "Edit" : "Add"} Stock</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Stock Name</label>
              <input
                type="text"
                placeholder="e.g., Reliance Industries"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Stock Symbol</label>
              <input
                type="text"
                placeholder="E.G., RELIANCE, TCS, INFY"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition uppercase"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Quantity</label>
              <input
                type="number"
                placeholder="Number of shares"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                min="0.0001"
                step="any"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Current Price (₹)</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-400">₹</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.currentPrice}
                  onChange={(e) => setFormData({ ...formData, currentPrice: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Purchase Price (₹)</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-400">₹</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Purchase Date (Optional)</label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              />
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-gray-100 flex sticky bottom-0 bg-white">
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl text-white font-bold bg-[#cbadf9] hover:bg-[#b08dee] transition shadow-md shadow-purple-200 text-sm"
            >
              {editData ? "Update Stock" : "Add Stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
