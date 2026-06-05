# RupeeRadar API

REST API for [RupeeRadar](../README.md) — *Track every rupee. Miss nothing.*

## Setup

```bash
npm install
cp .env.example .env   # optional — defaults work for local dev
npm run dev
```

| Script | Command | Description |
|--------|---------|-------------|
| Dev | `npm run dev` | Nodemon with auto-restart |
| Prod | `npm start` | Plain Node server |

Default URL: `http://localhost:3000`

Environment variables (see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP port |
| `DATABASE_PATH` | `./data/rupeeradar.db` | SQLite database file |

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | API and database health check |
| GET | `/expenses` | List all expenses |
| POST | `/expenses` | Create expense |
| GET | `/expenses/:id` | Get one expense |
| PUT | `/expenses/:id` | Replace expense |
| DELETE | `/expenses/:id` | Delete expense |
| GET | `/budgets/:monthKey` | Get monthly budget (`YYYY-MM`) |
| PUT | `/budgets/:monthKey` | Set monthly budget |

Query params for `GET /expenses`:

- `month=YYYY-MM`
- `category=Food` (etc.)

Full documentation: [API.md](./API.md)

## Database (Project 3)

Data is stored in **SQLite** with three tables:

| Table | Purpose |
|-------|---------|
| `categories` | Reference categories (seeded on first run) |
| `expenses` | Expense records with foreign key to `categories` |
| `budgets` | Monthly budget per `YYYY-MM` month key |

All SQL uses **parameterized queries** (`?` bindings) to prevent SQL injection.

The database file is created automatically on first startup. It is gitignored (`*.db`).

## Example requests

**Health check**

```bash
curl http://localhost:3000/health
```

**Create expense**

```bash
curl -X POST http://localhost:3000/expenses \
  -H "Content-Type: application/json" \
  -d "{\"amount\":120.5,\"category\":\"Food\",\"date\":\"2026-06-05\",\"note\":\"Lunch\"}"
```

**List expenses for a month**

```bash
curl "http://localhost:3000/expenses?month=2026-06"
```

**Set monthly budget**

```bash
curl -X PUT http://localhost:3000/budgets/2026-06 \
  -H "Content-Type: application/json" \
  -d "{\"amount\":15000}"
```

## Notes

- Do not commit `.env` files or `*.db` database files.
- Restart the server after changing `DATABASE_PATH`.
