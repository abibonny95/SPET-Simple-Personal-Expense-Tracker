# SPET — Simple Personal Expense Tracker

A free, offline-first personal finance app that runs entirely in your browser. No account, no server, no tracking: your data stays on your device.

SPET is a Progressive Web App (PWA) built with plain HTML, CSS and JavaScript. There is no build step, no framework and no external dependency, so it can be hosted for free on GitHub Pages and installed on your phone's home screen like a native app.

**Languages:** Italian and English (switch in Settings).

## Features

**Fast entry, one hand**
- Large on-screen keypad with built-in calculator (`+ − × ÷`, with correct operator precedence) and a live result preview.
- Pick the category from a visual grid, add an optional note, done: an expense takes about three taps.
- Three kinds of movement, kept separate:
  - **Expenses** — everyday spending.
  - **Income** — salary, refunds, extra income.
  - **Allocations** — money moved to your own destinations (savings account, pension fund, ETFs/investments, or any destination you create).

**Budgets with alerts**
- Optional monthly limit for each expense category.
- Progress bar per category: green below 80%, orange from 80% to 99%, red at 100% or more.
- An in-app warning appears the moment an expense takes a category past 80% or past 100% of its limit.

**Dashboard**
- Month navigation plus a yearly overview.
- Interactive donut chart of expenses by category, with icons, colours and percentages.
- Always-visible summary:
  - Total income
  - Total expenses
  - Total allocated, broken down by destination
  - **Net balance** = Income − Expenses − Allocations
  - **Total savings** = Income − Expenses

**Your data, your control**
- Everything is saved automatically in the browser (`localStorage`, versioned data format).
- Export and import a full **JSON backup** to move your data between devices.
- Export a **CSV** report (current period or all transactions).
- A reminder suggests a backup when you have at least 5 transactions and the last backup is older than 30 days (or you never made one).

**Comfort**
- Search across all your transactions (note, category, type, date, amount; accent-insensitive), sort by date or amount.
- Custom categories and destinations (name, emoji icon, colour), with reordering.
- Light, dark or automatic theme.
- Short first-run guide.
- Works offline after the first visit.
- Accessible: keyboard navigation, focus kept inside dialogs, Back button closes open sheets, checked with automated accessibility tests.

## Privacy

SPET has no backend, no analytics, no login and makes no network requests of its own besides loading its own files. Your transactions never leave your device unless you export a file yourself.

The flip side: **data lives in your browser's storage**. Clearing the site's data, uninstalling the browser or switching device removes it. Use the JSON export regularly.

## Install on your phone

1. Open the app's address in your browser (see "Publish with GitHub Pages" below).
2. **Android (Chrome):** menu ⋮ → *Install app* (or *Add to Home screen*).
3. **iPhone/iPad (Safari):** Share → *Add to Home Screen*.

After the first load the app works without a connection.

## Disclaimer

SPET is a personal bookkeeping tool, not financial advice. It is provided as is, without warranty of any kind.
