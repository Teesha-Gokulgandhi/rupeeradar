require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { initDatabase } = require("./db/connection");
const expensesRouter = require("./routes/expenses");
const budgetsRouter = require("./routes/budgets");

initDatabase();

const app = express();

app.use(cors());
app.use(express.json({ limit: "50kb" }));

app.get("/health", (req, res) => {
  res.status(200).json({ ok: true, db: "connected" });
});

app.use("/expenses", expensesRouter);
app.use("/budgets", budgetsRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err && (err.type === "entity.parse.failed" || err.status === 400)) {
    return res.status(400).json({
      error: "Bad Request",
      details: { message: "Malformed JSON body." },
    });
  }

  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`RupeeRadar API listening on http://localhost:${PORT}`);
});
