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

**Accounts, funds and wealth overview**
- Any number of checking accounts, each with its own balance, updated by every income and outflow.
- Each account or fund has an optional opening balance with a date. Income and outflows up to that date are already in the balance and are not counted, so you can type today's balance without double counting your history. Monthly reports still show the full history.
- Each allocation destination is a fund with its own balance and opening balance. Mark a fund as "can pay expenses" (for example a "Fixed costs" fund fed with 50 per month).
- Income can be paid into any account or fund. Transfers move money between any two accounts or funds, in any direction.
- When you add an expense, choose the payment source. An expense paid from a fund lowers that fund, not the checking account, and stays out of the month's Expenses and Net balance.
- Any account or fund can go below zero. You get a warning when it happens, and the overview shows it in red, so you can see whether what you set aside covers the year.
- Moving money between accounts and funds never changes total wealth. Only income that goes into a fund counts as allocated, together with transfers from an account to a fund.
- The Overview tab shows total wealth, the account and every fund. The monthly donut stays on Home.

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

## Credits

The "SPET" lettering in the app header is drawn from outlines of the [Outfit](https://github.com/Outfitio/Outfit-Fonts) typeface, © The Outfit Project Authors, used under the SIL Open Font License 1.1 (see `OFL-Outfit.txt`). It is embedded as inline SVG, so the app loads no web fonts.

## Disclaimer

SPET is a personal bookkeeping tool, not financial advice. It is provided as is, without warranty of any kind.
