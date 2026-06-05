<p align="center">
  <img src="assets/logo.svg" alt="RupeeRadar logo" width="340" />
</p>

<h1 align="center">RupeeRadar</h1>

<p align="center">
  <strong>Track every rupee. Miss nothing.</strong>
</p>

<p align="center">
  A mobile-first expense tracker with budgets and analytics — by <strong>Teesha Gokugandhi</strong> · DecodeLabs Industrial Training (Batch 2026).
</p>

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white" alt="HTML5" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-000000?logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/License-MIT-2a6f97" alt="MIT License" />
</p>

---

## Why RupeeRadar?

**RupeeRadar** puts your spending on the map. Like a radar scanning the skies, it scans your finances — surfacing where money goes, when budgets slip, and which categories need attention. Simple to use, sharp on insights.

| | |
|---|---|
| **Frontend** | Responsive UI with `localStorage` — works offline in the browser |
| **Backend** | REST API with validation and clean HTTP semantics |
| **Design** | Warm earth tones + Ethereal Blue, mobile-first, accessible landmarks |

## Features

### Frontend (`project1-frontend`)

- Mobile-first responsive layout
- Add, list, and delete expenses with `localStorage` persistence
- Monthly budget tracker with visual progress bar
- Search, filter, and sort expenses
- **Analytics dashboard** — month selector, KPIs, 6-month trend chart, insights, month-over-month comparison
- Export selected month to CSV
- Category breakdown with percentage share

### Backend (`project2-backend`)

- RESTful JSON API for `/expenses`
- Input validation and semantic HTTP status codes (400, 404, 500)
- In-memory data store (no database required for internship scope)
- Full API reference in [project2-backend/API.md](project2-backend/API.md)

## Project structure

```
rupeeradar/
├── assets/
│   ├── logo.svg          # Full wordmark logo
│   └── logo-mark.svg     # App icon / favicon
├── project1-frontend/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── ...
├── project2-backend/
│   ├── server.js
│   ├── routes/expenses.js
│   ├── data/expensesStore.js
│   ├── package.json
│   └── API.md
├── LICENSE
├── CONTRIBUTING.md
└── README.md
```

## Prerequisites

- A modern web browser (Chrome, Edge, or Firefox)
- [Node.js](https://nodejs.org/) 18+ (backend only)

## Quick start

### 1 — Frontend

Open the app in your browser — no install step:

```text
project1-frontend/index.html
```

Double-click the file, or use the VS Code **Live Server** extension.

### 2 — Backend API

```bash
cd project2-backend
npm install
npm run dev
```

Server runs at `http://localhost:3000`.

```bash
curl http://localhost:3000/expenses
```

More examples: [project2-backend/README.md](project2-backend/README.md)

## Tech stack

| Layer | Technologies |
|-------|----------------|
| Frontend | HTML5, CSS3 (Grid/Flex), vanilla JavaScript |
| Backend | Node.js, Express, CORS |
| Data | `localStorage` (frontend), in-memory store (API) |

## Push to GitHub

### 1. Create a new repository

On GitHub, click **New repository**:

- Name suggestion: `rupeeradar`
- Visibility: Public (or Private)
- **Do not** initialize with a README — this repo already has one

### 2. Update repository URL (optional)

### 3. Initialize and push

From the project root:

```bash
git init
git add .
git commit -m "Initial commit: RupeeRadar expense tracker"
git branch -M main
git remote add origin https://github.com/Teesha-Gokulgandhi/rupeeradar.git
git push -u origin main
```

> `node_modules/` and `.env` are ignored via `.gitignore` — only source code is committed.

### 4. Polish your GitHub repo (recommended)

- Set the repository **description** to: `Track every rupee. Miss nothing. — full-stack expense tracker`
- Add topics: `expense-tracker`, `budget`, `finance`, `rupee`, `javascript`, `nodejs`, `express`, `decodeLabs`
- Upload `assets/logo-mark.svg` as the repository **social preview** image (Settings → General → Social preview)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) — Copyright © 2026 Teesha Gokugandhi.
