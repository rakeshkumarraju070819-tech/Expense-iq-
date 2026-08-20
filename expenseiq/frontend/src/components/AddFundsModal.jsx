import { useState } from "react";

export default function AddFundsModal({ goals, onSubmit, onClose, initialGoalId }) {
  const [selectedGoalId, setSelectedGoalId] = useState(
    initialGoalId || (goals.length === 1 ? goals[0]._id : "")
  );
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    if (!selectedGoalId || isNaN(amt) || amt <= 0) return;
    setLoading(true);
    try {
      await onSubmit(selectedGoalId, { amount: amt, date, note: note.trim() });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-gray-800">Add Funds</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition text-xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {goals.length > 1 && !initialGoalId && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                Select Goal *
              </label>
              <select
                value={selectedGoalId}
                onChange={(e) => setSelectedGoalId(e.target.value)}
                className="input-field"
              >
                <option value="">Choose a goal...</option>
                {goals.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.goalName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(goals.length === 1 || initialGoalId) && (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <p className="text-xs text-gray-500">Adding funds to</p>
              <p className="text-sm font-semibold text-gray-800">
                {goals.find((g) => g._id === selectedGoalId)?.goalName || "Unknown Goal"}
              </p>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
              Amount (₹) *
            </label>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              min="1"
              step="0.01"
              onChange={(e) => setAmount(e.target.value)}
              className="input-field"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
              Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Birthday money"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 rounded-xl py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedGoalId || !amount || loading}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-3 text-sm font-semibold transition flex items-center justify-center gap-2"
          >
            {loading ? "Adding..." : "+ Add Funds"}
          </button>
        </div>
      </div>
    </div>
  );
}
