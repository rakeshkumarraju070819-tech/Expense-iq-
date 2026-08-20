import { useState } from "react";

export default function SavingsGoalModal({ onSave, onClose, existingGoal }) {
  const [goalName, setGoalName] = useState(existingGoal?.goalName || "");
  const [targetAmount, setTargetAmount] = useState(existingGoal?.targetAmount || "");
  const [monthlySavingTarget, setMonthlySavingTarget] = useState(existingGoal?.monthlySavingTarget || "");
  const [alreadySaved, setAlreadySaved] = useState(existingGoal?.alreadySaved || "");
  const [targetDate, setTargetDate] = useState(existingGoal?.targetDate || "");

  const handleSubmit = () => {
    const target = parseFloat(targetAmount);
    const saved = parseFloat(alreadySaved) || 0;
    if (!goalName.trim() || isNaN(target) || target <= 0) return;
    onSave({
      goalName: goalName.trim(),
      targetAmount: target,
      monthlySavingTarget: parseFloat(monthlySavingTarget) || 0,
      alreadySaved: saved,
      targetDate: targetDate || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-gray-800">Savings Goal</h2>
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
              Goal Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Save for Laptop"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              className="input-field"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
              Target Amount (₹) *
            </label>
            <input
              type="number"
              placeholder="0.00"
              value={targetAmount}
              min="1"
              step="0.01"
              onChange={(e) => setTargetAmount(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
              Monthly Saving Target (₹)
            </label>
            <input
              type="number"
              placeholder="0.00"
              value={monthlySavingTarget}
              min="0"
              step="0.01"
              onChange={(e) => setMonthlySavingTarget(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
              Already Saved (₹)
            </label>
            <input
              type="number"
              placeholder="0.00"
              value={alreadySaved}
              min="0"
              step="0.01"
              onChange={(e) => setAlreadySaved(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
              Target Date
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
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
            disabled={!goalName.trim() || !targetAmount}
            className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-3 text-sm font-semibold transition flex items-center justify-center gap-2"
          >
            Save Goal
          </button>
        </div>
      </div>
    </div>
  );
}
