const { getDb } = require("./connection");

const EXPENSE_SELECT = `
  SELECT e.id, e.amount, c.name AS category, e.date, e.note
  FROM expenses e
  JOIN categories c ON c.id = e.category_id
`;

function mapRow(row) {
  return {
    id: row.id,
    amount: row.amount,
    category: row.category,
    date: row.date,
    note: row.note || "",
  };
}

function listExpenses({ month, category } = {}) {
  const db = getDb();
  let sql = `${EXPENSE_SELECT} WHERE 1=1`;
  const params = [];

  if (month !== undefined) {
    sql += " AND substr(e.date, 1, 7) = ?";
    params.push(month);
  }

  if (category !== undefined) {
    sql += " AND c.name = ?";
    params.push(category);
  }

  sql += " ORDER BY e.date DESC, e.id DESC";

  return db.prepare(sql).all(...params).map(mapRow);
}

function createExpense(value) {
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO expenses (amount, category_id, date, note)
       VALUES (?, (SELECT id FROM categories WHERE name = ?), ?, ?)`
    )
    .run(value.amount, value.category, value.date, value.note || "");

  return getExpenseById(info.lastInsertRowid);
}

function getExpenseById(id) {
  const db = getDb();
  const row = db.prepare(`${EXPENSE_SELECT} WHERE e.id = ?`).get(id);
  return row ? mapRow(row) : null;
}

function updateExpenseById(id, value) {
  const db = getDb();
  const info = db
    .prepare(
      `UPDATE expenses
       SET amount = ?,
           category_id = (SELECT id FROM categories WHERE name = ?),
           date = ?,
           note = ?
       WHERE id = ?`
    )
    .run(value.amount, value.category, value.date, value.note || "", id);

  if (info.changes === 0) return null;
  return getExpenseById(id);
}

function deleteExpenseById(id) {
  const db = getDb();
  const info = db.prepare("DELETE FROM expenses WHERE id = ?").run(id);
  return info.changes > 0;
}

module.exports = {
  listExpenses,
  createExpense,
  getExpenseById,
  updateExpenseById,
  deleteExpenseById,
};
