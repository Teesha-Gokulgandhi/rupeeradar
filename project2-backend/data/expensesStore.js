const allowedCategories = ["Food", "Transport", "Shopping", "Bills", "Health", "Other"];

const expensesRepository = require("../db/expensesRepository");

function httpError(status, message, details) {
  const err = new Error(message);
  err.status = status;
  if (details !== undefined) err.details = details;
  return err;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function getCurrentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

function monthKeyFromIsoDate(isoDate) {
  return isoDate.slice(0, 7);
}

function isIsoDate(dateStr) {
  return typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

function validateExpensePayload(body) {
  const errors = [];

  if (!body || typeof body !== "object") {
    return { ok: false, errors: ["Request body must be a JSON object."] };
  }

  let amount;
  if (typeof body.amount === "number") amount = body.amount;
  else amount = typeof body.amount === "string" ? Number(body.amount) : NaN;
  if (!Number.isFinite(amount) || amount <= 0) {
    errors.push("amount must be a number greater than 0.");
  }

  const category = typeof body.category === "string" ? body.category.trim() : "";
  if (!category) errors.push("category is required.");
  else if (!allowedCategories.includes(category)) errors.push("category is not allowed.");

  const date = typeof body.date === "string" ? body.date.trim() : "";
  if (!isIsoDate(date)) errors.push("date must be in YYYY-MM-DD format.");
  else {
    const d = new Date(`${date}T00:00:00`);
    if (Number.isNaN(d.getTime())) errors.push("date must be a valid calendar date.");

    const now = new Date();
    const maxFuture = new Date(now);
    maxFuture.setDate(now.getDate() + 365);
    if (!errors.length && d > maxFuture) {
      errors.push("date must not be more than 365 days in the future.");
    }
  }

  const note = typeof body.note === "string" ? body.note : "";
  if (note.length > 200) errors.push("note must be 200 characters or less.");

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      amount,
      category,
      date,
      note: note ? note.trim() : "",
    },
  };
}

function parseMonthQuery(month) {
  if (month === undefined) return undefined;
  if (month === null) return null;
  if (typeof month !== "string") return null;
  if (!/^\d{4}-\d{2}$/.test(month)) return null;
  return month;
}

function normalizeAndValidateMonth(month) {
  const parsed = parseMonthQuery(month);
  if (parsed === undefined) return undefined;
  if (parsed === null) return null;
  return parsed;
}

function listExpenses({ month, category } = {}) {
  const monthKey = normalizeAndValidateMonth(month);

  if (monthKey === null) {
    throw httpError(400, "Invalid month filter", { month });
  }

  if (category !== undefined) {
    if (typeof category !== "string" || !allowedCategories.includes(category.trim())) {
      throw httpError(400, "Invalid category filter", { category });
    }
  }

  const normalizedCategory =
    category === undefined ? undefined : category.trim();

  return expensesRepository.listExpenses({
    month: monthKey,
    category: normalizedCategory,
  });
}

function createExpense(value) {
  return expensesRepository.createExpense(value);
}

function getExpenseById(id) {
  return expensesRepository.getExpenseById(id);
}

function updateExpenseById(id, value) {
  return expensesRepository.updateExpenseById(id, value);
}

function deleteExpenseById(id) {
  return expensesRepository.deleteExpenseById(id);
}

module.exports = {
  allowedCategories,
  getCurrentMonthKey,
  listExpenses,
  createExpense,
  getExpenseById,
  updateExpenseById,
  deleteExpenseById,
  validateExpensePayload,
  parseMonthQuery,
};
