const { getDb } = require("./connection");

function getBudgetByMonth(monthKey) {
  const db = getDb();
  const row = db
    .prepare("SELECT month_key, amount FROM budgets WHERE month_key = ?")
    .get(monthKey);

  return {
    monthKey,
    amount: row ? row.amount : 0,
  };
}

function upsertBudget(monthKey, amount) {
  const db = getDb();
  db.prepare(
    `INSERT INTO budgets (month_key, amount) VALUES (?, ?)
     ON CONFLICT(month_key) DO UPDATE SET amount = excluded.amount`
  ).run(monthKey, amount);

  return { monthKey, amount };
}

module.exports = { getBudgetByMonth, upsertBudget };
