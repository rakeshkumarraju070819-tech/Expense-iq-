import { useState, useEffect } from "react";

const CATEGORIES = [
  { id: "Loan", label: "Loan", icon: "🏠", color: "bg-teal-500" },
  { id: "Fees", label: "Fees", icon: "📄", color: "bg-purple-500" },
  { id: "Bills", label: "Bills", icon: "🔔", color: "bg-orange-500" },
  { id: "EMI", label: "EMI", icon: "💳", color: "bg-blue-500" },
  { id: "Other", label: "Other", icon: "💲", color: "bg-pink-500" }
];

const REPEAT_CYCLES = ["One-time", "Monthly", "Yearly"];

export default function AddReminderModal({ onAdd, onClose, editData }) {
  const [formData, setFormData] = useState(
    editData || {
      title: "",
      amount: "",
      dueDate: "",
      category: "Loan",
      repeat: "One-time",
      notes: "",
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount || !formData.dueDate) return;
    onAdd(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-xl font-bold text-gray-800">{editData ? "Edit" : "Add"} Reminder</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title</label>
              <input
                type="text"
                placeholder="e.g., Home Loan EMI"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-400">₹</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <div className="grid grid-cols-3 gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat.id })}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition ${
                      formData.category === cat.id
                        ? "border-blue-500 bg-blue-50/50"
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl ${cat.color} text-white flex items-center justify-center text-lg mb-2`}>
                      {cat.icon}
                    </div>
                    <span className="text-xs font-semibold text-gray-700">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Repeat</label>
              <div className="grid grid-cols-3 gap-3">
                {REPEAT_CYCLES.map((cycle) => (
                  <button
                    key={cycle}
                    type="button"
                    onClick={() => setFormData({ ...formData, repeat: cycle })}
                    className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition ${
                      formData.repeat === cycle
                        ? "border-blue-500 bg-blue-50 text-blue-600"
                        : "border-gray-100 text-gray-600 hover:border-gray-200"
                    }`}
                  >
                    {cycle}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes (Optional)</label>
              <textarea
                placeholder="Add additional notes..."
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition h-24 resize-none"
              />
            </div>
          </div>
          <div className="mt-8 pt-5 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl text-gray-700 font-bold bg-gray-50 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 rounded-xl text-white font-bold bg-indigo-600 hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
            >
              {editData ? "Update Reminder" : "Add Reminder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
