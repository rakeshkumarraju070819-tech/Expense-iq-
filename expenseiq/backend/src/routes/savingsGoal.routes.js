const express = require("express");
const router = express.Router();
const {
  getSavingsGoals,
  createSavingsGoal,
  updateSavingsGoal,
  addContribution,
  deleteSavingsGoal,
} = require("../controllers/savingsGoal.controller");
const { protect } = require("../middleware/auth.middleware");

// All routes protected
router.use(protect);

router.get("/", getSavingsGoals);
router.post("/", createSavingsGoal);
router.put("/:id", updateSavingsGoal);
router.post("/:id/contribute", addContribution);
router.delete("/:id", deleteSavingsGoal);

module.exports = router;
