const User = require("../models/user.model");

// ── GET /api/users/profile ────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// ── PUT /api/users/profile ────────────────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, monthlyBudget, dailyBudget } = req.body;
    const user = req.user;

    if (name) user.name = name;
    if (monthlyBudget) user.monthlyBudget = parseFloat(monthlyBudget);
    if (dailyBudget) user.dailyBudget = parseFloat(dailyBudget);

    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};
