const express = require("express");

const {
  allowedCategories,
  listExpenses,
  createExpense,
  getExpenseById,
  updateExpenseById,
  deleteExpenseById,
  validateExpensePayload,
  parseMonthQuery,
} = require("../data/expensesStore");

const router = express.Router();

// GET /expenses?month=YYYY-MM&category=Food
router.get("/", (req, res) => {
  const month = parseMonthQuery(req.query.month);
  if (month === null && req.query.month !== undefined) {
    return res.status(400).json({
      error: "Bad Request",
      details: { message: "Invalid query parameter: month. Use YYYY-MM." },
    });
  }

  const category = req.query.category;
  if (category !== undefined && category !== null && typeof category !== "string") {
    return res.status(400).json({
      error: "Bad Request",
      details: { message: "Invalid query parameter: category." },
    });
  }

  try {
    const normalizedCategory =
      category === undefined || category === null || category === ""
        ? undefined
        : String(category).trim();

    if (
      normalizedCategory !== undefined &&
      !allowedCategories.includes(normalizedCategory)
    ) {
      return res.status(400).json({
        error: "Bad Request",
        details: { message: "Invalid query parameter: category." },
      });
    }

    const expenses = listExpenses({ month, category: normalizedCategory });
    return res.status(200).json(expenses);
  } catch (err) {
    if (err && err.status === 400) {
      return res.status(400).json({
        error: "Bad Request",
        details: err.details ?? { message: "Invalid request." },
      });
    }

    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /expenses
router.post("/", (req, res) => {
  const validation = validateExpensePayload(req.body);
  if (!validation.ok) {
    return res.status(400).json({
      error: "Bad Request",
      details: { errors: validation.errors },
    });
  }

  const created = createExpense(validation.value);
  return res.status(201).json(created);
});

// GET /expenses/:id
router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({
      error: "Bad Request",
      details: { message: "Invalid expense id." },
    });
  }

  const found = getExpenseById(id);
  if (!found) {
    return res.status(404).json({ error: "Not Found" });
  }

  return res.status(200).json(found);
});

// PUT /expenses/:id (replacement)
router.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({
      error: "Bad Request",
      details: { message: "Invalid expense id." },
    });
  }

  const validation = validateExpensePayload(req.body);
  if (!validation.ok) {
    return res.status(400).json({
      error: "Bad Request",
      details: { errors: validation.errors },
    });
  }

  const updated = updateExpenseById(id, validation.value);
  if (!updated) {
    return res.status(404).json({ error: "Not Found" });
  }

  return res.status(200).json(updated);
});

// DELETE /expenses/:id
router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({
      error: "Bad Request",
      details: { message: "Invalid expense id." },
    });
  }

  const ok = deleteExpenseById(id);
  if (!ok) {
    return res.status(404).json({ error: "Not Found" });
  }

  return res.status(204).send();
});

module.exports = router;

