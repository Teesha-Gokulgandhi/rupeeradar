# RupeeRadar API

REST API for [RupeeRadar](../README.md) — *Track every rupee. Miss nothing.*

## Setup

```bash
npm install
npm run dev
```

| Script | Command | Description |
|--------|---------|-------------|
| Dev | `npm run dev` | Nodemon with auto-restart |
| Prod | `npm start` | Plain Node server |

Default URL: `http://localhost:3000`

Optional: copy `.env.example` to `.env` and set `PORT`.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/expenses` | List all expenses |
| POST | `/expenses` | Create expense |
| GET | `/expenses/:id` | Get one expense |
| PUT | `/expenses/:id` | Replace expense |
| DELETE | `/expenses/:id` | Delete expense |

Query params for `GET /expenses`:

- `month=YYYY-MM`
- `category=Food` (etc.)

Full documentation: [API.md](./API.md)

## Example requests

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

## Notes

- Data is stored in memory and resets when the server restarts.
- Do not commit `.env` files; use environment variables for secrets in production.
