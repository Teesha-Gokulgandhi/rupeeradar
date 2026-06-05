const allowedCategories = ["Food", "Transport", "Shopping", "Bills", "Health", "Other"];

let nextId = 1;
/** @type {Array<{id:number, amount:number, category:string, date:string, note:string}>} */
let expenses = [];

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
  // isoDate expected to be "YYYY-MM-DD"
  return isoDate.slice(0, 7);
}

function isIsoDate(dateStr) {
  return typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

function validateExpensePayload(body) {
  const errors = [];

  // Gatekeeper: ensure body is an object
  if (!body || typeof body !== "object") {
    return { ok: false, errors: ["Request body must be a JSON object."] };
  }

  // amount (number > 0)
  let amount;
  if (typeof body.amount === "number") amount = body.amount;
  else amount = typeof body.amount === "string" ? Number(body.amount) : NaN;
  if (!Number.isFinite(amount) || amount <= 0) {
    errors.push("amount must be a number greater than 0.");
  }

  // category
  const category = typeof body.category === "string" ? body.category.trim() : "";
  if (!category) errors.push("category is required.");
  else if (!allowedCategories.includes(category)) errors.push("category is not allowed.");

  // date (YYYY-MM-DD)
  const date = typeof body.date === "string" ? body.date.trim() : "";
  if (!isIsoDate(date)) errors.push("date must be in YYYY-MM-DD format.");
  else {
    const d = new Date(`${date}T00:00:00`);
    if (Number.isNaN(d.getTime())) errors.push("date must be a valid calendar date.");

    // Lightweight semantic validation: disallow dates too far in the future.
    // (This can be relaxed later, but it's enough to show "gatekeeper" behavior.)
    const now = new Date();
    const maxFuture = new Date(now);
    maxFuture.setDate(now.getDate() + 365);
    if (!errors.length && d > maxFuture) {
      errors.push("date must not be more than 365 days in the future.");
    }
  }

  // note (optional)
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
  // If month not provided => "all months"
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

  let result = [...expenses];

  // newest first
  result.sort((a, b) => {
    // date first, then id
    if (a.date === b.date) return b.id - a.id;
    return b.date.localeCompare(a.date);
  });

  if (monthKey !== undefined) {
    result = result.filter((e) => monthKeyFromIsoDate(e.date) === monthKey);
  }

  if (category !== undefined) {
    if (typeof category !== "string" || !allowedCategories.includes(category.trim())) {
      throw httpError(400, "Invalid category filter", { category });
    }
    result = result.filter((e) => e.category === category.trim());
  }

  return result;
}

function createExpense(value) {
  const expense = {
    id: nextId++,
    amount: value.amount,
    category: value.category,
    date: value.date,
    note: value.note || "",
  };

  // Store newest first (optional); ordering is enforced in listExpenses anyway.
  expenses.push(expense);
  return expense;
}

function getExpenseById(id) {
  return expenses.find((e) => e.id === id) || null;
}

function updateExpenseById(id, value) {
  const idx = expenses.findIndex((e) => e.id === id);
  if (idx === -1) return null;

  expenses[idx] = {
    id,
    amount: value.amount,
    category: value.category,
    date: value.date,
    note: value.note || "",
  };
  return expenses[idx];
}

function deleteExpenseById(id) {
  const before = expenses.length;
  expenses = expenses.filter((e) => e.id !== id);
  return expenses.length !== before;
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

