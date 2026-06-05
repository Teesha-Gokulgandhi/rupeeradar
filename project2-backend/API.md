# RupeeRadar API Reference

## Base URL

`http://localhost:3000`

## Common Response Errors

For invalid input (HTTP 400):

```json
{
  "error": "Bad Request",
  "details": {
    "errors": ["..."]
  }
}
```

For not found (HTTP 404):

```json
{ "error": "Not Found" }
```

For unexpected server failures (HTTP 500):

```json
{ "error": "Internal Server Error" }
```

---

## GET `/expenses`

Retrieves a list of expenses (optionally filtered).

### Query Parameters

Optional:
- `month`: `YYYY-MM` (example: `2026-06`)
- `category`: one of:
  `Food`, `Transport`, `Shopping`, `Bills`, `Health`, `Other`

### Success Response

HTTP 200 with JSON array of expenses:

```json
[
  {
    "id": 1,
    "amount": 120.5,
    "category": "Food",
    "date": "2026-06-05",
    "note": "Lunch"
  }
]
```

Example:
`GET /expenses?month=2026-06&category=Food`

---

## POST `/expenses`

Creates a new expense.

### Request Body

Content-Type: `application/json`

```json
{
  "amount": 120.5,
  "category": "Food",
  "date": "2026-06-05",
  "note": "Lunch"
}
```

Validation rules:
- `amount` must be a number > 0
- `category` must be one of the allowed categories
- `date` must be `YYYY-MM-DD`
- `note` is optional, max 200 characters
- `date` must not be more than 365 days in the future

### Success Response

HTTP 201 with the created object:

```json
{
  "id": 1,
  "amount": 120.5,
  "category": "Food",
  "date": "2026-06-05",
  "note": "Lunch"
}
```

### Validation Error Response

HTTP 400:

```json
{
  "error": "Bad Request",
  "details": {
    "errors": ["amount must be a number greater than 0."]
  }
}
```

---

## GET `/expenses/:id`

Fetch a single expense by id.

### Success Response

HTTP 200:

```json
{
  "id": 1,
  "amount": 120.5,
  "category": "Food",
  "date": "2026-06-05",
  "note": "Lunch"
}
```

### Not Found

HTTP 404:
`{ "error": "Not Found" }`

---

## PUT `/expenses/:id`

Replaces an expense (full update).

### Request Body

Same JSON shape as `POST /expenses`.

### Success Response

HTTP 200 with the updated object.

### Not Found

HTTP 404:
`{ "error": "Not Found" }`

### Validation Error

HTTP 400:

`{ "error": "Bad Request", "details": { "errors": ["..."] } }`

---

## DELETE `/expenses/:id`

Deletes an expense.

### Success Response

HTTP 204 (No Content)

### Not Found

HTTP 404:
`{ "error": "Not Found" }`

### Invalid id

HTTP 400:

```json
{
  "error": "Bad Request",
  "details": { "message": "Invalid expense id." }
}
```

---

## GET `/health`

Health check for API and database connectivity.

### Success Response

HTTP 200:

```json
{ "ok": true, "db": "connected" }
```

---

## GET `/budgets/:monthKey`

Retrieves the monthly budget for a given month.

### Path Parameters

- `monthKey`: `YYYY-MM` (example: `2026-06`)

### Success Response

HTTP 200:

```json
{
  "monthKey": "2026-06",
  "amount": 15000
}
```

If no budget is set for the month, `amount` is `0`.

### Invalid month key

HTTP 400:

```json
{
  "error": "Bad Request",
  "details": { "message": "Invalid month key. Use YYYY-MM." }
}
```

---

## PUT `/budgets/:monthKey`

Creates or updates the monthly budget for a given month.

### Path Parameters

- `monthKey`: `YYYY-MM`

### Request Body

Content-Type: `application/json`

```json
{
  "amount": 15000
}
```

Validation rules:
- `amount` must be a number >= 0

### Success Response

HTTP 200:

```json
{
  "monthKey": "2026-06",
  "amount": 15000
}
```

### Validation Error Response

HTTP 400:

```json
{
  "error": "Bad Request",
  "details": {
    "errors": ["amount must be a number greater than or equal to 0."]
  }
}
```

