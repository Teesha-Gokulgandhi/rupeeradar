const fs = require("fs");
const path = require("path");

const Database = require("better-sqlite3");
const { initializeDatabase } = require("./init");

const defaultPath = path.join(__dirname, "..", "data", "rupeeradar.db");
const dbPath = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : defaultPath;

let db = null;

function initDatabase() {
  if (db) return db;

  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma("foreign_keys = ON");
  initializeDatabase(db);
  return db;
}

function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return db;
}

module.exports = { initDatabase, getDb };
