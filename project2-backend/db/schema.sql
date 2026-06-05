PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS expenses (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  amount      REAL NOT NULL CHECK (amount > 0),
  category_id INTEGER NOT NULL REFERENCES categories(id),
  date        TEXT NOT NULL,
  note        TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);

CREATE TABLE IF NOT EXISTS budgets (
  month_key TEXT PRIMARY KEY,
  amount    REAL NOT NULL CHECK (amount >= 0)
);
