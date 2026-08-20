const mongoose = require("mongoose");

const contributionSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: true, timestamps: false }
);

const savingsGoalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    goalName: {
      type: String,
      required: [true, "Goal name is required"],
      trim: true,
    },
    targetAmount: {
      type: Number,
      required: [true, "Target amount is required"],
      min: [1, "Target must be at least 1"],
    },
    savedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    monthlySavingTarget: {
      type: Number,
      default: 0,
    },
    targetDate: {
      type: Date,
      default: null,
    },
    contributions: [contributionSchema],
  },
  { timestamps: true }
);

savingsGoalSchema.index({ user: 1 });

module.exports = mongoose.model("SavingsGoal", savingsGoalSchema);
