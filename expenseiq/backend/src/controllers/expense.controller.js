const Expense = require("../models/expense.model");

// ── GET /api/expenses ─────────────────────────────────────────────────────────
exports.getExpenses = async (req, res, next) => {
  try {
    const { month, year, category, limit = 100, page = 1 } = req.query;

    const filter = { user: req.user._id };

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);
      filter.date = { $gte: start, $lt: end };
    }

    if (category) filter.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [expenses, total] = await Promise.all([
      Expense.find(filter).sort({ date: -1 }).limit(parseInt(limit)).skip(skip),
      Expense.countDocuments(filter),
    ]);

    res.json({ success: true, expenses, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/expenses ────────────────────────────────────────────────────────
exports.createExpense = async (req, res, next) => {
  try {
    const { title, amount, category, date, note } = req.body;

    const expense = await Expense.create({
      user: req.user._id,
      title,
      amount: parseFloat(amount),
      category: category || "Other",
      date: date ? new Date(date) : new Date(),
      note: note || "",
    });

    res.status(201).json({ success: true, expense });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/expenses/:id ─────────────────────────────────────────────────────
exports.updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });
    if (!expense) return res.status(404).json({ success: false, message: "Expense not found" });

    const { title, amount, category, date, note } = req.body;
    if (title) expense.title = title;
    if (amount) expense.amount = parseFloat(amount);
    if (category) expense.category = category;
    if (date) expense.date = new Date(date);
    if (note !== undefined) expense.note = note;

    await expense.save();
    res.json({ success: true, expense });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/expenses/:id ──────────────────────────────────────────────────
exports.deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!expense) return res.status(404).json({ success: false, message: "Expense not found" });
    res.json({ success: true, message: "Expense deleted" });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/expenses (all) ────────────────────────────────────────────────
exports.deleteAllExpenses = async (req, res, next) => {
  try {
    await Expense.deleteMany({ user: req.user._id });
    res.json({ success: true, message: "All expenses deleted" });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/expenses/summary ─────────────────────────────────────────────────
exports.getSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [monthlyTotal, todayTotal, categoryBreakdown] = await Promise.all([
      Expense.aggregate([
        { $match: { user: req.user._id, date: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Expense.aggregate([
        { $match: { user: req.user._id, date: { $gte: todayStart } } },
        { $group: { _id: null, total: { $sum: "$amount" }, highest: { $max: "$amount" }, lowest: { $min: "$amount" } } },
      ]),
      Expense.aggregate([
        { $match: { user: req.user._id, date: { $gte: monthStart } } },
        { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
    ]);

    res.json({
      success: true,
      summary: {
        monthlyTotal: monthlyTotal[0]?.total || 0,
        todayTotal: todayTotal[0]?.total || 0,
        todayHighest: todayTotal[0]?.highest || 0,
        todayLowest: todayTotal[0]?.lowest || 0,
        categoryBreakdown,
      },
    });
  } catch (err) {
    next(err);
  }
};
