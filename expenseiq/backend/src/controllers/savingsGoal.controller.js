const SavingsGoal = require("../models/savingsGoal.model");

// ── GET /api/savings-goals ────────────────────────────────────────────────────
exports.getSavingsGoals = async (req, res, next) => {
  try {
    const goals = await SavingsGoal.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, goals });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/savings-goals ───────────────────────────────────────────────────
exports.createSavingsGoal = async (req, res, next) => {
  try {
    const { goalName, targetAmount, monthlySavingTarget, alreadySaved, targetDate } = req.body;
    const initialSaved = parseFloat(alreadySaved) || 0;

    const contributions = [];
    if (initialSaved > 0) {
      contributions.push({
        amount: initialSaved,
        date: new Date(),
        note: "Initial amount already saved",
      });
    }

    const goal = await SavingsGoal.create({
      user: req.user._id,
      goalName,
      targetAmount: parseFloat(targetAmount),
      savedAmount: initialSaved,
      monthlySavingTarget: parseFloat(monthlySavingTarget) || 0,
      targetDate: targetDate || null,
      contributions,
    });

    res.status(201).json({ success: true, goal });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/savings-goals/:id ────────────────────────────────────────────────
exports.updateSavingsGoal = async (req, res, next) => {
  try {
    const goal = await SavingsGoal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) return res.status(404).json({ success: false, message: "Savings goal not found" });

    const { goalName, targetAmount, monthlySavingTarget, targetDate } = req.body;
    if (goalName !== undefined) goal.goalName = goalName;
    if (targetAmount !== undefined) goal.targetAmount = parseFloat(targetAmount);
    if (monthlySavingTarget !== undefined) goal.monthlySavingTarget = parseFloat(monthlySavingTarget);
    if (targetDate !== undefined) goal.targetDate = targetDate || null;

    await goal.save();
    res.json({ success: true, goal });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/savings-goals/:id/contribute ────────────────────────────────────
exports.addContribution = async (req, res, next) => {
  try {
    const goal = await SavingsGoal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) return res.status(404).json({ success: false, message: "Savings goal not found" });

    const { amount, date, note } = req.body;
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: "Amount must be greater than 0" });
    }

    goal.contributions.push({
      amount: parsedAmount,
      date: date ? new Date(date) : new Date(),
      note: note || "",
    });
    goal.savedAmount += parsedAmount;

    await goal.save();
    res.json({ success: true, goal });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/savings-goals/:id ─────────────────────────────────────────────
exports.deleteSavingsGoal = async (req, res, next) => {
  try {
    const goal = await SavingsGoal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!goal) return res.status(404).json({ success: false, message: "Savings goal not found" });
    res.json({ success: true, message: "Savings goal deleted" });
  } catch (err) {
    next(err);
  }
};
