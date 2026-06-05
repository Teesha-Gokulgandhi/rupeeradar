## RupeeRadar Wireframe (Grayscale, Mobile-First)

Mobile layout (single column)

```
┌──────────────────────────────────────────────────────────┐
│ HEADER                                                   │
│  [App Title]                                            │
│  [Optional small tagline / nav text]                   │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ SUMMARY (cards stacked)                                 │
│  ┌───────────────┐   ┌───────────────┐                 │
│  │ This Month     │   │ Biggest Category│               │
│  └───────────────┘   └───────────────┘                 │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Today (optional)                                   │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ ADD EXPENSE (form)                                      │
│  Amount        [number input                     ]      │
│  Category      [select dropdown                   ]      │
│  Date          [date input                       ]      │
│  Note (opt)    [textarea (small)                ]      │
│  [Submit Button: Add Expense]                           │
│  [Inline error text area (if needed)]                  │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ EXPENSE LIST                                             │
│  Title: "Expenses"                                      │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Expense Card (newest first)                       │ │
│  │  Category   Date                                   │ │
│  │  Note (small)                                       │ │
│  │  Amount (right-aligned)                            │ │
│  │  [Delete] (optional)                                │ │
│  └────────────────────────────────────────────────────┘ │
│  (repeat for each expense)                              │
└──────────────────────────────────────────────────────────┘
```

Tablet/Desktop layout (min-width 768/1024)

```
┌──────────────────────────────────────────────────────────┐
│ HEADER                                                   │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────┬───────────────────────┐
│ LEFT COLUMN (summary + form)     │ RIGHT COLUMN         │
│  Summary cards                   │ Expenses list         │
│  Add expense form                │                       │
└──────────────────────────────────┴───────────────────────┘
```

Accessibility notes (grayscale)
- Ensure every form input has a visible `<label>`.
- Buttons and input focus states must be distinct without relying on color alone.
- Use clear typography hierarchy: bold headings, readable body sizes.

