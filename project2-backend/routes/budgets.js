const express = require("express");

const { getBudgetByMonth, upsertBudget } = require("../db/budgetsRepository");

const router = express.Router();

function parseMonthKey(raw) {
  if (typeof raw !== "string" || !/^\d{4}-\d{2}$/.test(raw)) return null;
  return raw;
}

function validateBudgetPayload(body) {
  if (!body || typeof body !== "object") {
    return { ok: false, errors: ["Request body must be a JSON object."] };
  }

  let amount;
  if (typeof body.amount === "number") amount = body.amount;
  else amount = typeof body.amount === "string" ? Number(body.amount) : NaN;

  if (!Number.isFinite(amount) || amount < 0) {
    return { ok: false, errors: ["amount must be a number greater than or equal to 0."] };
  }

  return { ok: true, value: { amount } };
}

// GET /budgets/:monthKey
router.get("/:monthKey", (req, res) => {
  const monthKey = parseMonthKey(req.params.monthKey);
  if (!monthKey) {
    return res.status(400).json({
      error: "Bad Request",
      details: { message: "Invalid month key. Use YYYY-MM." },
    });
  }

  const budget = getBudgetByMonth(monthKey);
  return res.status(200).json(budget);
});

// PUT /budgets/:monthKey
router.put("/:monthKey", (req, res) => {
  const monthKey = parseMonthKey(req.params.monthKey);
  if (!monthKey) {
    return res.status(400).json({
      error: "Bad Request",
      details: { message: "Invalid month key. Use YYYY-MM." },
    });
  }

  const validation = validateBudgetPayload(req.body);
  if (!validation.ok) {
    return res.status(400).json({
      error: "Bad Request",
      details: { errors: validation.errors },
    });
  }

  const saved = upsertBudget(monthKey, validation.value.amount);
  return res.status(200).json(saved);
});

module.exports = router;
