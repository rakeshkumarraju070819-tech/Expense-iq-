import { useState } from "react";

export default function GoalSelectorModal({ goals, onSelect, onClose }) {
  const [selectedGoalId, setSelectedGoalId] = useState("");

  const handleSubmit = () => {
    if (selectedGoalId) {
      const selected = goals.find((g) => g._id === selectedGoalId);
      if (selected) onSelect(selected);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-gray-800">Select Goal</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition text-xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
              Which goal would you like to adjust?
            </label>
            <select
              value={selectedGoalId}
              onChange={(e) => setSelectedGoalId(e.target.value)}
              className="input-field"
            >
              <option value="">Choose a goal...</option>
              {goals.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.goalName} - Remaining: ₹{Math.max(0, g.targetAmount - g.savedAmount).toLocaleString("en-IN")}
                </option>
              ))}
            </select>
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
            disabled={!selectedGoalId}
            className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-3 text-sm font-semibold transition flex items-center justify-center gap-2"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
