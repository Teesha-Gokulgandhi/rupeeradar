const fs = require("fs");
const path = require("path");

const SEED_CATEGORIES = ["Food", "Transport", "Shopping", "Bills", "Health", "Other"];

function initializeDatabase(db) {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");
  db.exec(schema);

  const { n } = db.prepare("SELECT COUNT(*) AS n FROM categories").get();
  if (n === 0) {
    const insert = db.prepare("INSERT INTO categories (name) VALUES (?)");
    const insertMany = db.transaction((names) => {
      for (const name of names) {
        insert.run(name);
      }
    });
    insertMany(SEED_CATEGORIES);
  }
}

module.exports = { initializeDatabase, SEED_CATEGORIES };
