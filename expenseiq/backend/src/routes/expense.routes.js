const express = require("express");
const router = express.Router();
const {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  deleteAllExpenses,
  getSummary,
} = require("../controllers/expense.controller");
const { protect } = require("../middleware/auth.middleware");

// All routes protected
router.use(protect);

router.get("/summary", getSummary);
router.get("/", getExpenses);
router.post("/", createExpense);
router.put("/:id", updateExpense);
router.delete("/all", deleteAllExpenses);
router.delete("/:id", deleteExpense);

module.exports = router;
