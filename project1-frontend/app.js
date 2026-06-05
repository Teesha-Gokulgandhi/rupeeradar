(() => {
  "use strict";

  /* ─── Constants ─────────────────────────────────────────────── */
  const API_BASE = "http://localhost:3000";
  const TOAST_DURATION = 3000;

  const CATEGORIES = [
    { name: "Food",      icon: "🍔", color: "#e67e22" },
    { name: "Transport", icon: "🚌", color: "#2a6f97" },
    { name: "Shopping",  icon: "🛍️",  color: "#8e44ad" },
    { name: "Bills",     icon: "🧾", color: "#c0392b" },
    { name: "Health",    icon: "💊", color: "#1a7f5a" },
    { name: "Other",     icon: "📦", color: "#7f8c8d" },
  ];

  const categoryMap = Object.fromEntries(CATEGORIES.map(c => [c.name, c]));

  /* ─── State ──────────────────────────────────────────────────── */
  /** @type {Array<{id:number,amount:number,category:string,date:string,note:string}>} */
  let expenses  = [];
  let budget    = 0;
  let pendingDeleteId = null;
  let selectedMonthKey = "";
  let apiReady = false;
  let requestInFlight = false;

  let filterSearch   = "";
  let filterCategory = "";
  let filterSort     = "newest";

  /* ─── Element refs ───────────────────────────────────────────── */
  const $  = id => document.getElementById(id);
  const el = {
    form:            $("expenseForm"),
    formError:       $("formError"),
    amount:          $("amount"),
    categoryHidden:  $("category"),
    categoryPills:   $("categoryPills"),
    date:            $("date"),
    note:            $("note"),
    noteCount:       $("noteCount"),

    expenseList:     $("expenseList"),
    apiLoading:      $("apiLoadingState"),
    apiError:        $("apiErrorState"),
    emptyState:      $("emptyState"),
    noResults:       $("noResultsState"),

    summaryTotal:    $("summaryTotal"),
    summaryCount:    $("summaryCount"),
    summaryBiggestCat:$("summaryBiggestCategory"),
    summaryAvg:      $("summaryAvg"),
    monthBadge:      $("monthBadge"),
    expTotalBadge:   $("expensesTotalBadge"),

    budgetForm:      $("budgetForm"),
    budgetInput:     $("budgetInput"),
    editBudgetBtn:   $("editBudgetBtn"),
    cancelBudgetBtn: $("cancelBudgetBtn"),
    budgetBarFill:   $("budgetBarFill"),
    budgetBar:       $("budgetBar"),
    budgetSpent:     $("budgetSpent"),
    budgetRemaining: $("budgetRemaining"),

    breakdownChart:  $("breakdownChart"),
    breakdownEmpty:  $("breakdownEmpty"),

    filterSearch:    $("filterSearch"),
    filterCategory:  $("filterCategory"),
    filterSort:      $("filterSort"),
    clearFiltersBtn: $("clearFiltersBtn"),

    toastContainer:  $("toastContainer"),
    deleteModal:     $("deleteModal"),
    modalConfirm:    $("modalConfirm"),
    modalCancel:     $("modalCancel"),

    // Analytics
    analyticsMonthSelect: $("analyticsMonthSelect"),
    exportCsvBtn:         $("exportCsvBtn"),
    kpiTotal:             $("kpiTotal"),
    kpiCount:             $("kpiCount"),
    kpiAvg:               $("kpiAvg"),
    kpiHighest:           $("kpiHighest"),
    kpiBudgetPct:         $("kpiBudgetPct"),
    compareThis:          $("compareThis"),
    compareLast:          $("compareLast"),
    compareDelta:         $("compareDelta"),
    trendChart:           $("trendChart"),
    trendChartEmpty:      $("trendChartEmpty"),
    insightsList:         $("insightsList"),
    insightsEmpty:        $("insightsEmpty"),
  };

  /* ─── Utilities ──────────────────────────────────────────────── */
  const pad2 = n => String(n).padStart(2, "0");

  function currentMonthKey() {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
  }

  function monthKeyFromDate(iso) { return iso.slice(0, 7); }

  function formatDate(iso) {
    const d = new Date(`${iso}T00:00:00`);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }

  function monthLabelFromKey(key) {
    const [y, m] = key.split("-").map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  }

  function monthShortLabel(key) {
    const [y, m] = key.split("-").map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString("en-IN", { month: "short" });
  }

  function daysInMonth(monthKey) {
    const [y, m] = monthKey.split("-").map(Number);
    return new Date(y, m, 0).getDate();
  }

  function getLastMonthKey(monthKey) {
    const [y, m] = monthKey.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
  }

  function shiftMonthKey(monthKey, delta) {
    const [y, m] = monthKey.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
  }

  const fmt = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

  /* ─── Analytics helpers ──────────────────────────────────────── */
  function getExpensesForMonth(monthKey) {
    return expenses.filter(e => monthKeyFromDate(e.date) === monthKey);
  }

  function groupByCategory(list) {
    const map = {};
    list.forEach(e => { map[e.category] = (map[e.category] ?? 0) + e.amount; });
    return map;
  }

  function getMonthTotal(monthKey) {
    return getExpensesForMonth(monthKey).reduce((s, e) => s + e.amount, 0);
  }

  function getMonthTotalsForRange(endMonthKey, count = 6) {
    const result = [];
    for (let i = count - 1; i >= 0; i--) {
      const key = shiftMonthKey(endMonthKey, -i);
      result.push({ monthKey: key, total: getMonthTotal(key) });
    }
    return result;
  }

  function percentChange(current, previous) {
    if (previous === 0 && current === 0) return { pct: 0, dir: "neutral" };
    if (previous === 0) return { pct: 100, dir: "up" };
    const pct = ((current - previous) / previous) * 100;
    return { pct: Math.abs(pct), dir: pct > 0 ? "up" : pct < 0 ? "down" : "neutral" };
  }

  function buildAvailableMonths() {
    const keys = new Set(expenses.map(e => monthKeyFromDate(e.date)));
    keys.add(currentMonthKey());
    keys.add(selectedMonthKey);
    return [...keys].sort((a, b) => b.localeCompare(a));
  }

  function populateMonthSelect() {
    const months = buildAvailableMonths();
    const prev = el.analyticsMonthSelect.value;
    el.analyticsMonthSelect.innerHTML = "";
    months.forEach(key => {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = monthLabelFromKey(key);
      el.analyticsMonthSelect.appendChild(opt);
    });
    if (months.includes(prev)) el.analyticsMonthSelect.value = prev;
    else if (months.includes(selectedMonthKey)) el.analyticsMonthSelect.value = selectedMonthKey;
    else if (months.length) el.analyticsMonthSelect.value = months[0];
  }

  /* ─── API client ───────────────────────────────────────────── */
  async function apiRequest(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });

    if (res.status === 204) return null;

    let data = null;
    const text = await res.text();
    if (text) {
      try { data = JSON.parse(text); }
      catch { throw new Error("Invalid JSON response from API."); }
    }

    if (!res.ok) {
      const msg = data?.details?.message
        || data?.details?.errors?.[0]
        || data?.error
        || `Request failed (${res.status})`;
      throw new Error(msg);
    }

    return data;
  }

  function normalizeExpense(row) {
    return {
      id: Number(row.id),
      amount: Number(row.amount),
      category: String(row.category ?? ""),
      date: String(row.date ?? ""),
      note: String(row.note ?? ""),
    };
  }

  async function fetchExpenses() {
    const rows = await apiRequest("/expenses");
    if (!Array.isArray(rows)) return [];
    return rows
      .map(normalizeExpense)
      .filter(x => x.id && x.date && isFinite(x.amount) && x.category);
  }

  async function fetchBudget(monthKey) {
    const data = await apiRequest(`/budgets/${encodeURIComponent(monthKey)}`);
    const amount = Number(data?.amount);
    return isFinite(amount) && amount > 0 ? amount : 0;
  }

  async function createExpenseApi(payload) {
    const created = await apiRequest("/expenses", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return normalizeExpense(created);
  }

  async function deleteExpenseApi(id) {
    await apiRequest(`/expenses/${id}`, { method: "DELETE" });
  }

  async function saveBudgetApi(monthKey, amount) {
    await apiRequest(`/budgets/${encodeURIComponent(monthKey)}`, {
      method: "PUT",
      body: JSON.stringify({ amount }),
    });
  }

  function setApiLoading(loading) {
    el.apiLoading.hidden = !loading;
    if (loading) el.apiError.hidden = true;
  }

  function setApiError(visible) {
    el.apiError.hidden = !visible;
    if (visible) el.apiLoading.hidden = true;
    el.form.querySelectorAll("input, button, select, textarea").forEach(node => {
      node.disabled = visible;
    });
  }

  function setFormDisabled(disabled) {
    requestInFlight = disabled;
    el.form.querySelector('[type="submit"]')?.toggleAttribute("disabled", disabled);
  }

  /* ─── Toast ──────────────────────────────────────────────────── */
  function toast(message, type = "") {
    const div = document.createElement("div");
    div.className = `toast${type ? ` toast--${type}` : ""}`;
    div.textContent = message;
    el.toastContainer.appendChild(div);
    setTimeout(() => {
      div.classList.add("toast--out");
      div.addEventListener("animationend", () => div.remove(), { once: true });
    }, TOAST_DURATION);
  }

  /* ─── Modal ──────────────────────────────────────────────────── */
  function openDeleteModal(id) {
    pendingDeleteId = id;
    el.deleteModal.hidden = false;
    el.modalConfirm.focus();
  }

  function closeDeleteModal() {
    pendingDeleteId = null;
    el.deleteModal.hidden = true;
  }

  /* ─── Category pills ─────────────────────────────────────────── */
  function buildCategoryPills() {
    CATEGORIES.forEach(cat => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "category-pill";
      btn.dataset.value = cat.name;
      btn.textContent = `${cat.icon} ${cat.name}`;
      btn.setAttribute("aria-pressed", "false");
      btn.addEventListener("click", () => {
        el.categoryHidden.value = cat.name;
        document.querySelectorAll(".category-pill").forEach(p => {
          const active = p.dataset.value === cat.name;
          p.classList.toggle("selected", active);
          p.setAttribute("aria-pressed", String(active));
        });
      });
      el.categoryPills.appendChild(btn);
    });
  }

  /* ─── Validation ─────────────────────────────────────────────── */
  function validate({ amountStr, category, dateStr, note }) {
    if (!amountStr || isNaN(Number(amountStr)) || Number(amountStr) <= 0)
      return "Amount must be a positive number.";
    if (!category) return "Please choose a category.";
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || isNaN(new Date(`${dateStr}T00:00:00`).getTime()))
      return "Please select a valid date.";
    if (note.length > 200) return "Note must be 200 characters or less.";
    return null;
  }

  /* ─── Summary (uses selectedMonthKey) ────────────────────────── */
  function renderSummary() {
    const key = selectedMonthKey;
    const month = getExpensesForMonth(key);
    const total = month.reduce((s, e) => s + e.amount, 0);

    el.summaryTotal.textContent = fmt.format(total);
    el.summaryCount.textContent = String(month.length);
    el.monthBadge.textContent     = monthLabelFromKey(key);

    const days = daysInMonth(key);
    el.summaryAvg.textContent = fmt.format(month.length ? total / days : 0);

    const byCategory = groupByCategory(month);
    const top = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
    el.summaryBiggestCat.textContent = top
      ? `${categoryMap[top[0]]?.icon ?? ""} ${top[0]}`
      : "—";

    renderBudget(total);
    renderBreakdown(byCategory, total);
  }

  /* ─── Budget ─────────────────────────────────────────────────── */
  function renderBudget(spent) {
    if (!budget) {
      el.budgetBarFill.style.width = "0%";
      el.budgetBar.setAttribute("aria-valuenow", 0);
      el.budgetSpent.textContent     = fmt.format(spent) + " spent";
      el.budgetRemaining.textContent = "No budget set";
      return;
    }

    const pct = Math.min((spent / budget) * 100, 100);
    el.budgetBarFill.style.width = `${pct}%`;
    el.budgetBar.setAttribute("aria-valuenow", Math.round(pct));
    el.budgetBarFill.classList.toggle("over", spent > budget);
    el.budgetBarFill.classList.toggle("near", spent >= budget * 0.8 && spent <= budget);
    el.budgetSpent.textContent     = `${fmt.format(spent)} spent`;
    el.budgetRemaining.textContent = spent > budget
      ? `${fmt.format(spent - budget)} over budget!`
      : `${fmt.format(budget - spent)} remaining`;
  }

  /* ─── Breakdown chart (with % share) ─────────────────────────── */
  function renderBreakdown(byCategory, monthTotal) {
    el.breakdownChart.innerHTML = "";
    const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

    if (!entries.length) {
      el.breakdownEmpty.hidden = false;
      el.breakdownChart.hidden = true;
      return;
    }

    el.breakdownEmpty.hidden = true;
    el.breakdownChart.hidden = false;

    const max = entries[0][1];
    entries.forEach(([name, amount]) => {
      const cat  = categoryMap[name] ?? { icon: "📦", color: "#7f8c8d" };
      const barPct = max > 0 ? (amount / max) * 100 : 0;
      const sharePct = monthTotal > 0 ? Math.round((amount / monthTotal) * 100) : 0;

      const row = document.createElement("div");
      row.className = "breakdown-row";

      const header = document.createElement("div");
      header.className = "breakdown-row-header";

      const left = document.createElement("span");
      left.innerHTML = `${cat.icon} ${name}<span class="breakdown-pct">${sharePct}%</span>`;

      const right = document.createElement("span");
      right.textContent = fmt.format(amount);

      header.appendChild(left);
      header.appendChild(right);

      const track = document.createElement("div");
      track.className = "breakdown-bar-track";

      const fill = document.createElement("div");
      fill.className = "breakdown-bar-fill";
      fill.style.cssText = `width:${barPct}%; background:${cat.color};`;

      track.appendChild(fill);
      row.appendChild(header);
      row.appendChild(track);
      el.breakdownChart.appendChild(row);
    });
  }

  /* ─── Analytics Dashboard ────────────────────────────────────── */
  function renderAnalytics() {
    const month = getExpensesForMonth(selectedMonthKey);
    const total = month.reduce((s, e) => s + e.amount, 0);
    const days  = daysInMonth(selectedMonthKey);

    // KPIs
    el.kpiTotal.textContent = fmt.format(total);
    el.kpiCount.textContent = String(month.length);
    el.kpiAvg.textContent   = fmt.format(month.length ? total / days : 0);

    const highest = month.length ? month.reduce((a, b) => b.amount > a.amount ? b : a) : null;
    el.kpiHighest.textContent = highest ? fmt.format(highest.amount) : "—";

    if (budget > 0) {
      const pct = Math.round((total / budget) * 100);
      el.kpiBudgetPct.textContent = `${pct}%`;
    } else {
      el.kpiBudgetPct.textContent = "—";
    }

    // Month comparison
    const lastKey   = getLastMonthKey(selectedMonthKey);
    const lastTotal = getMonthTotal(lastKey);
    el.compareThis.textContent = fmt.format(total);
    el.compareLast.textContent = fmt.format(lastTotal);

    const change = percentChange(total, lastTotal);
    el.compareDelta.className = `delta-badge ${change.dir}`;
    if (change.dir === "neutral") {
      el.compareDelta.textContent = "No change";
    } else {
      const arrow = change.dir === "up" ? "↑" : "↓";
      el.compareDelta.textContent = `${arrow} ${change.pct.toFixed(1)}%`;
    }

    // Trend chart
    const trendData = getMonthTotalsForRange(selectedMonthKey, 6);
    drawTrendChart(el.trendChart, trendData, selectedMonthKey);

    // Insights
    renderInsights(month, total, lastTotal, byCategoryFromMonth(month));
  }

  function byCategoryFromMonth(month) {
    return groupByCategory(month);
  }

  function renderInsights(month, total, lastTotal, byCategory) {
    el.insightsList.innerHTML = "";
    const insights = [];

    if (!month.length) {
      el.insightsEmpty.hidden = false;
      el.insightsList.hidden = true;
      return;
    }

    el.insightsEmpty.hidden = true;
    el.insightsList.hidden = false;

    const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
    if (entries.length) {
      const [topCat, topAmt] = entries[0];
      const share = total > 0 ? Math.round((topAmt / total) * 100) : 0;
      const icon = categoryMap[topCat]?.icon ?? "";
      insights.push(`${icon} ${topCat} is your top category (${share}% of spending).`);
    }

    const diff = total - lastTotal;
    if (lastTotal > 0) {
      if (diff > 0) insights.push(`You spent ${fmt.format(diff)} more than last month.`);
      else if (diff < 0) insights.push(`You saved ${fmt.format(Math.abs(diff))} compared to last month.`);
      else insights.push("Your spending is the same as last month.");
    }

    if (budget > 0) {
      const pct = (total / budget) * 100;
      if (pct >= 100) insights.push(`Budget exceeded! You are ${fmt.format(total - budget)} over your limit.`);
      else if (pct >= 80) insights.push(`Budget warning: ${Math.round(pct)}% of your monthly budget is used.`);
      else insights.push(`${Math.round(100 - pct)}% of your budget remains (${fmt.format(budget - total)}).`);
    }

    const highest = month.reduce((a, b) => b.amount > a.amount ? b : a);
    if (highest) {
      insights.push(`Biggest expense: ${fmt.format(highest.amount)} on ${formatDate(highest.date)} (${highest.category}).`);
    }

    insights.forEach(text => {
      const li = document.createElement("li");
      li.textContent = text;
      el.insightsList.appendChild(li);
    });
  }

  /* ─── Canvas trend chart ─────────────────────────────────────── */
  function drawTrendChart(canvas, monthTotals, highlightKey) {
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth || 600;
    const H = 220;

    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + "px";
    canvas.style.height = H + "px";
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, W, H);

    const hasData = monthTotals.some(m => m.total > 0);
    el.trendChartEmpty.hidden = hasData;
    canvas.hidden = !hasData;

    if (!hasData) {
      canvas.setAttribute("aria-label", "No spending data for this period.");
      return;
    }

    const padding = { top: 20, right: 16, bottom: 36, left: 56 };
    const chartW = W - padding.left - padding.right;
    const chartH = H - padding.top - padding.bottom;

    const maxVal = Math.max(...monthTotals.map(m => m.total), 1);
    const barCount = monthTotals.length;
    const gap = 12;
    const barW = (chartW - gap * (barCount - 1)) / barCount;

    // Y-axis grid lines
    ctx.strokeStyle = "rgba(164,117,81,0.15)";
    ctx.lineWidth = 1;
    ctx.font = "11px Roboto, sans-serif";
    ctx.fillStyle = "#6b6b6b";
    ctx.textAlign = "right";

    for (let i = 0; i <= 4; i++) {
      const val = (maxVal / 4) * i;
      const y = padding.top + chartH - (val / maxVal) * chartH;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(W - padding.right, y);
      ctx.stroke();
      ctx.fillText(fmt.format(val), padding.left - 6, y + 4);
    }

    // Bars
    monthTotals.forEach((m, i) => {
      const barH = maxVal > 0 ? (m.total / maxVal) * chartH : 0;
      const x = padding.left + i * (barW + gap);
      const y = padding.top + chartH - barH;
      const isHighlight = m.monthKey === highlightKey;

      ctx.fillStyle = isHighlight ? "#2a6f97" : "#a47551";
      ctx.globalAlpha = isHighlight ? 1 : 0.55;
      if (typeof ctx.roundRect === "function") {
        ctx.beginPath();
        ctx.roundRect(x, y, barW, barH, 4);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, barW, barH);
      }
      ctx.globalAlpha = 1;

      // X label
      ctx.fillStyle = isHighlight ? "#2a6f97" : "#6b6b6b";
      ctx.font = isHighlight ? "bold 11px Inter, sans-serif" : "11px Roboto, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(monthShortLabel(m.monthKey), x + barW / 2, H - padding.bottom + 16);

      // Value on top of bar
      if (m.total > 0) {
        ctx.fillStyle = "#2d2d2d";
        ctx.font = "10px Roboto, sans-serif";
        ctx.fillText(fmt.format(m.total), x + barW / 2, y - 4);
      }
    });

    const summary = monthTotals.map(m => `${monthShortLabel(m.monthKey)}: ${fmt.format(m.total)}`).join(", ");
    canvas.setAttribute("aria-label", `Spending trend for last 6 months. ${summary}`);
  }

  /* ─── CSV Export ─────────────────────────────────────────────── */
  function exportCsv(monthKey) {
    const rows = getExpensesForMonth(monthKey);
    if (!rows.length) {
      toast("No expenses to export for this month.", "error");
      return;
    }

    const header = "date,category,amount,note";
    const body = rows.map(e => {
      const note = `"${(e.note || "").replace(/"/g, '""')}"`;
      return `${e.date},${e.category},${e.amount},${note}`;
    }).join("\n");

    const blob = new Blob([header + "\n" + body], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `expenses-${monthKey}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`Exported ${rows.length} expense(s) for ${monthLabelFromKey(monthKey)}.`, "success");
  }

  /* ─── Expense list rendering ─────────────────────────────────── */
  function filteredExpenses() {
    let list = [...expenses];
    if (filterCategory) list = list.filter(e => e.category === filterCategory);
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      list = list.filter(e => e.note.toLowerCase().includes(q) || e.category.toLowerCase().includes(q));
    }
    switch (filterSort) {
      case "oldest":      list.sort((a, b) => a.date.localeCompare(b.date)); break;
      case "amount-high": list.sort((a, b) => b.amount - a.amount); break;
      case "amount-low":  list.sort((a, b) => a.amount - b.amount); break;
      default:            list.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
    }
    return list;
  }

  function renderExpenses() {
    el.expenseList.innerHTML = "";

    if (!apiReady) {
      el.emptyState.hidden = true;
      el.noResults.hidden = true;
      el.clearFiltersBtn.hidden = true;
      el.expTotalBadge.textContent = "";
      return;
    }

    const list = filteredExpenses();
    const hasExpenses = expenses.length > 0;
    const hasResults  = list.length > 0;

    el.emptyState.hidden = hasExpenses;
    el.noResults.hidden  = !hasExpenses || hasResults;
    el.expTotalBadge.textContent = hasExpenses ? `${expenses.length} total` : "";

    const hasFilter = filterSearch || filterCategory || filterSort !== "newest";
    el.clearFiltersBtn.hidden = !hasFilter;

    list.forEach(expense => el.expenseList.appendChild(createItem(expense)));
  }

  function createItem(expense) {
    const cat = categoryMap[expense.category] ?? { icon: "📦", color: "#7f8c8d" };
    const li  = document.createElement("li");
    li.className = "expense-item";
    li.dataset.id = expense.id;

    const top = document.createElement("div");
    top.className = "expense-top";

    const left = document.createElement("div");
    left.className = "expense-left";

    const icon = document.createElement("div");
    icon.className = "expense-cat-icon";
    icon.textContent = cat.icon;
    icon.setAttribute("aria-hidden", "true");

    const meta = document.createElement("div");
    meta.className = "expense-meta";

    const catEl = document.createElement("p");
    catEl.className = "expense-category";
    catEl.textContent = expense.category;

    const dateEl = document.createElement("p");
    dateEl.className = "expense-date";
    dateEl.textContent = formatDate(expense.date);

    meta.appendChild(catEl);
    meta.appendChild(dateEl);
    left.appendChild(icon);
    left.appendChild(meta);

    const right = document.createElement("div");
    right.className = "expense-right";

    const amountEl = document.createElement("p");
    amountEl.className = "expense-amount";
    amountEl.style.color = cat.color;
    amountEl.textContent = fmt.format(expense.amount);

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "delete-button";
    delBtn.innerHTML = "🗑";
    delBtn.setAttribute("aria-label", `Delete ${expense.category} expense of ${fmt.format(expense.amount)}`);
    delBtn.addEventListener("click", () => openDeleteModal(expense.id));

    right.appendChild(amountEl);
    right.appendChild(delBtn);
    top.appendChild(left);
    top.appendChild(right);
    li.appendChild(top);

    if (expense.note?.trim()) {
      const note = document.createElement("p");
      note.className = "expense-note";
      note.textContent = expense.note;
      li.appendChild(note);
    }

    return li;
  }

  /* ─── Master render ──────────────────────────────────────────── */
  function renderAll() {
    populateMonthSelect();
    renderSummary();
    renderAnalytics();
    renderExpenses();
  }

  /* ─── Form submit ────────────────────────────────────────────── */
  async function onSubmit(e) {
    e.preventDefault();
    if (!apiReady || requestInFlight) return;
    el.formError.textContent = "";

    const amountStr = el.amount.value.trim();
    const category  = el.categoryHidden.value;
    const dateStr   = el.date.value;
    const note      = el.note.value;

    const err = validate({ amountStr, category, dateStr, note });
    if (err) {
      el.formError.textContent = "⚠ " + err;
      return;
    }

    setFormDisabled(true);
    try {
      const created = await createExpenseApi({
        amount: Number(amountStr),
        category,
        date: dateStr,
        note: note.trim().slice(0, 200),
      });
      expenses = [created, ...expenses];
      renderAll();
      clearForm();
      toast(`${categoryMap[category]?.icon ?? ""} Expense added!`, "success");
      el.amount.focus({ preventScroll: true });
    } catch (error) {
      el.formError.textContent = "⚠ " + (error.message || "Could not save expense.");
      toast(error.message || "Could not save expense.", "error");
    } finally {
      setFormDisabled(false);
    }
  }

  function clearForm() {
    el.amount.value = "";
    el.categoryHidden.value = "";
    el.note.value = "";
    el.noteCount.textContent = "0 / 200";
    document.querySelectorAll(".category-pill").forEach(p => {
      p.classList.remove("selected");
      p.setAttribute("aria-pressed", "false");
    });
    el.formError.textContent = "";
    setDefaultDate();
  }

  /* ─── Delete flow ────────────────────────────────────────────── */
  el.modalConfirm.addEventListener("click", async () => {
    if (!pendingDeleteId || !apiReady || requestInFlight) return;
    const id = pendingDeleteId;
    closeDeleteModal();
    setFormDisabled(true);
    try {
      await deleteExpenseApi(id);
      expenses = expenses.filter(e => e.id !== id);
      renderAll();
      toast("Expense deleted.", "");
    } catch (error) {
      toast(error.message || "Could not delete expense.", "error");
    } finally {
      setFormDisabled(false);
    }
  });

  el.modalCancel.addEventListener("click", closeDeleteModal);
  el.deleteModal.addEventListener("click", e => { if (e.target === el.deleteModal) closeDeleteModal(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !el.deleteModal.hidden) closeDeleteModal(); });

  /* ─── Budget form ────────────────────────────────────────────── */
  el.editBudgetBtn.addEventListener("click", () => {
    el.budgetInput.value = budget || "";
    el.budgetForm.hidden = false;
    el.budgetInput.focus();
  });

  el.cancelBudgetBtn.addEventListener("click", () => { el.budgetForm.hidden = true; });

  el.budgetForm.addEventListener("submit", async e => {
    e.preventDefault();
    if (!apiReady || requestInFlight) return;
    const v = Number(el.budgetInput.value);
    if (!isFinite(v) || v <= 0) { toast("Please enter a valid budget amount.", "error"); return; }
    setFormDisabled(true);
    try {
      await saveBudgetApi(selectedMonthKey, v);
      budget = v;
      el.budgetForm.hidden = true;
      renderAll();
      toast(`Budget set to ${fmt.format(budget)}!`, "success");
    } catch (error) {
      toast(error.message || "Could not save budget.", "error");
    } finally {
      setFormDisabled(false);
    }
  });

  /* ─── Filters ────────────────────────────────────────────────── */
  el.filterSearch.addEventListener("input", () => { filterSearch = el.filterSearch.value.trim(); renderExpenses(); });
  el.filterCategory.addEventListener("change", () => { filterCategory = el.filterCategory.value; renderExpenses(); });
  el.filterSort.addEventListener("change", () => { filterSort = el.filterSort.value; renderExpenses(); });
  el.clearFiltersBtn.addEventListener("click", () => {
    filterSearch = filterCategory = "";
    filterSort = "newest";
    el.filterSearch.value = el.filterCategory.value = "";
    el.filterSort.value = "newest";
    renderExpenses();
  });

  /* ─── Analytics events ───────────────────────────────────────── */
  el.analyticsMonthSelect.addEventListener("change", async () => {
    selectedMonthKey = el.analyticsMonthSelect.value;
    if (apiReady) {
      try {
        budget = await fetchBudget(selectedMonthKey);
      } catch {
        toast("Could not load budget for this month.", "error");
      }
    }
    renderSummary();
    renderAnalytics();
  });

  el.exportCsvBtn.addEventListener("click", () => exportCsv(selectedMonthKey));

  window.addEventListener("resize", () => {
    const trendData = getMonthTotalsForRange(selectedMonthKey, 6);
    drawTrendChart(el.trendChart, trendData, selectedMonthKey);
  });

  /* ─── Note char counter ──────────────────────────────────────── */
  el.note.addEventListener("input", () => {
    el.noteCount.textContent = `${el.note.value.length} / 200`;
  });

  function setDefaultDate() {
    const d = new Date();
    el.date.value = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }

  /* ─── Init ───────────────────────────────────────────────────── */
  async function init() {
    selectedMonthKey = currentMonthKey();
    buildCategoryPills();
    setDefaultDate();
    el.form.addEventListener("submit", onSubmit);

    setApiLoading(true);
    setApiError(false);
    apiReady = false;

    try {
      const [loadedExpenses, loadedBudget] = await Promise.all([
        fetchExpenses(),
        fetchBudget(selectedMonthKey),
      ]);
      expenses = loadedExpenses;
      budget = loadedBudget;
      apiReady = true;
      setApiLoading(false);
      renderAll();
    } catch {
      setApiLoading(false);
      setApiError(true);
      toast("Cannot reach RupeeRadar API. Start the backend with npm run dev in project2-backend.", "error");
    }
  }

  init();
})();
