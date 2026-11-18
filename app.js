/* SPET 1.2.0 - Simple Personal Expense Tracker
 * App a pagina singola. Nessuna dipendenza, nessun server.
 * Dati in localStorage, importi in centesimi interi, date come YYYY-MM-DD locali. */
(function () {
  'use strict';

  // ---------------------------------------------------------------- costanti

  var APP_VERSION = '1.2.0';
  var STORAGE_KEY = 'spet:data';
  var LEGACY_KEY = 'wealthtrack:data'; // nome della prima versione: serve solo a migrare i dati
  var DB_VERSION = 1;
  var MONTHS_SHORT = { it: ['G', 'F', 'M', 'A', 'M', 'G', 'L', 'A', 'S', 'O', 'N', 'D'], en: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'] };
  var TYPE_LABEL = { expense: 'Spesa', income: 'Entrata', saving: 'Accantonamento' };
  var NONE_REF = { id: '__none', name: 'Eliminata', icon: '❔', color: '#94a3b8' };
  var COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#14b8a6',
    '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#64748b'];
  var EMOJIS = ['🏠', '🏡', '🛒', '🚗', '⛽', '🚌', '🚆', '✈️', '🏍️', '🚲', '🍽️', '🍕', '☕', '🍺', '🍷', '🥗',
    '🍔', '🍰', '💊', '🏥', '🦷', '🧴', '💇', '🏋️', '⚽', '🎉', '🎬', '🎮', '🎵', '📚', '🎓', '🖥️',
    '💻', '📱', '📺', '💡', '🔥', '💧', '📶', '📦', '👕', '👟', '👜', '💄', '🎁', '🐾', '🐶', '🐱',
    '👶', '🧸', '🔧', '🧰', '🛠️', '🪴', '🌱', '🏖️', '🏕️', '🧾', '📄', '🛡️', '⚖️', '💼', '💶', '💰',
    '🏦', '🪙', '💳', '📈', '🧓', '🏆', '🎯', '⭐', '❤️', '🙏', '🚿', '🧹', '🧺', '🛏️', '🪑', '🔑',
    '📮', '✂️', '🎂', '🍼', '🚕', '🅿️', '🧳', '🎟️', '🎻', '🩺', '🧘', '🚰'];

  // -------------------------------------------------------------------- lingue
  // Le chiavi sono i testi italiani: T('testo') ritorna l'inglese se la lingua e en,
  // altrimenti il testo com e. I segnaposto {nome} si riempiono con il secondo argomento.
  var lang = 'it', LOCALE = 'it-IT', DEC = ',', THOU = '.', currencyFmt = null;

  var EN = {
    // pagina
    'Periodo': 'Period', 'Mese': 'Month', 'Anno': 'Year', 'Cambia tema': 'Change theme',
    'Periodo precedente': 'Previous period', 'Torna al periodo corrente': 'Back to the current period', 'Periodo successivo': 'Next period',
    '+ Entrata': '+ Income', '− Spesa': '− Expense', '+ Investi/Accantona': '+ Save/Invest',
    'Navigazione': 'Navigation', 'Home': 'Home', 'Movimenti': 'Transactions', 'Categorie': 'Categories', 'Impostazioni': 'Settings',
    'Tracker semplice delle spese personali. Offline, gratuito, senza server.': 'A simple personal expense tracker. Offline, free, no server.',
    // tipi
    'Spesa': 'Expense', 'Entrata': 'Income', 'Accantonamento': 'Allocation', 'Eliminata': 'Deleted',
    // calcolo e dati
    'Importo troppo grande.': 'Amount too large.', 'Non si può dividere per zero.': 'Cannot divide by zero.',
    'Il risultato deve essere maggiore di zero.': 'The result must be greater than zero.',
    'Il file non contiene dati validi.': 'The file does not contain valid data.', 'Versione dati mancante.': 'Data version missing.',
    'Il file viene da una versione più recente di SPET.': 'This file comes from a newer version of SPET.',
    'Archiviazione non disponibile: i dati non verranno conservati.': 'Storage unavailable: your data will not be kept.',
    'I dati salvati erano danneggiati. Ne ho tenuto una copia grezza.': 'Saved data was damaged. A raw copy has been kept.',
    'Salvataggio non riuscito. Esporta subito un backup.': 'Saving failed. Export a backup right away.',
    // budget
    '🚨 {name}: limite mensile superato. {a} su {l} ({p}%).': '🚨 {name}: monthly limit exceeded. {a} of {l} ({p}%).',
    '⚠️ {name}: hai usato il {p}% del limite mensile. {a} su {l}.': '⚠️ {name}: you have used {p}% of the monthly limit. {a} of {l}.',
    'Limite superato: {a} su {l} ({p}%)': 'Limit exceeded: {a} of {l} ({p}%)', '{a} su {l} · {p}%': '{a} of {l} · {p}%',
    'Limite {name}': 'Limit {name}',
    // home
    'Nessuna spesa nel periodo': 'No expenses in this period', 'Distribuzione delle spese': 'Expense breakdown',
    'Entrate, spese e accantonamenti per mese': 'Income, expenses and allocations by month', 'Apri il mese {n}': 'Open month {n}',
    'Entrate': 'Income', 'Spese': 'Expenses', 'Accantonato': 'Allocated',
    'Non hai ancora salvato un backup.': 'You have not saved a backup yet.', 'L’ultimo backup risale a {d} giorni fa.': 'Your last backup was {d} days ago.',
    'Guida rapida': 'Quick guide', 'Come si usa': 'How it works',
    'Tocca <b>− Spesa</b>, scrivi l’importo e scegli la categoria. Fatto.': 'Tap <b>− Expense</b>, enter the amount and pick the category. Done.',
    'Il tastierino fa anche i conti: 12,50 + 3 × 2.': 'The keypad does maths too: 12.50 + 3 × 2.',
    'In <b>Categorie</b> dai un limite mensile a ogni spesa: ti avviso all’80% e al 100%.': 'In <b>Categories</b> set a monthly limit on each expense: you get a warning at 80% and 100%.',
    'Con <b>+ Investi/Accantona</b> sposti denaro verso le tue destinazioni di risparmio.': 'With <b>+ Save/Invest</b> you move money to your savings destinations.',
    'I dati restano solo su questo dispositivo. Salva un backup da <b>Impostazioni</b>.': 'Your data stays only on this device. Save a backup from <b>Settings</b>.',
    'Ho capito': 'Got it', 'Promemoria backup': 'Backup reminder', 'Backup consigliato.': 'Backup recommended.',
    'I dati sono solo su questo dispositivo.': 'Your data is only on this device.', 'Esporta ora': 'Export now', 'Più tardi': 'Later',
    'Saldo': 'Balance', 'Saldo netto': 'Net balance', 'Entrate − Spese − Accantonamenti': 'Income − Expenses − Allocations',
    'Risparmio totale': 'Total savings', 'Entrate − Spese': 'Income − Expenses', 'Totali': 'Totals',
    'Accantonato per destinazione': 'Allocated by destination', '% delle spese': '% of expenses', 'tocca una fetta': 'tap a slice',
    'Nessuna spesa': 'No expenses', 'in questo periodo': 'in this period',
    'Usa “− Spesa” per registrare la prima spesa.': 'Use “− Expense” to record your first expense.', 'Mese per mese': 'Month by month',
    // movimenti
    'Tutti': 'All', 'Accantonamenti': 'Allocations', 'Per data': 'By date', 'Per importo': 'By amount',
    'Cerca per nota, categoria, importo': 'Search by note, category, amount', 'Cerca nei movimenti': 'Search transactions',
    'Filtro': 'Filter', 'Ordine': 'Sort', 'Nessun risultato per “{q}”.': 'No results for “{q}”.',
    'Nessun movimento in questo periodo.': 'No transactions in this period.',
    '{n} risultato in tutto lo storico': '{n} result across all history', '{n} risultati in tutto lo storico': '{n} results across all history',
    // categorie
    'Posizione {n} di {m}': 'Position {n} of {m}', 'Sposta su {name}': 'Move {name} up', 'Sposta giù {name}': 'Move {name} down',
    'Limite mensile {l}': 'Monthly limit {l}', 'Nessun limite': 'No limit', 'Destinazione': 'Destination',
    '+ Aggiungi categoria di spesa': '+ Add expense category', '+ Aggiungi categoria di entrata': '+ Add income category', '+ Aggiungi destinazione': '+ Add destination',
    'Fine riordino': 'Done reordering', 'Riordina': 'Reorder', 'Destinazioni di accantonamento': 'Allocation destinations',
    // impostazioni
    'Lingua': 'Language', 'Tema': 'Theme', 'Chiaro': 'Light', 'Scuro': 'Dark', 'Auto': 'Auto',
    'Backup e trasferimento': 'Backup and transfer',
    'Salva un file JSON e importalo su un altro dispositivo per spostare tutti i dati. Non serve alcun server.': 'Save a JSON file and import it on another device to move all your data. No server needed.',
    'Ultimo backup: {d}.': 'Last backup: {d}.', 'Nessun backup finora.': 'No backup yet.',
    'Esporta backup JSON': 'Export JSON backup', 'Importa backup JSON': 'Import JSON backup', 'Report CSV': 'CSV report',
    'Apribile con Excel e Fogli Google. Il separatore è il punto e virgola.': 'Opens in Excel and Google Sheets. The separator is a comma.',
    'CSV del periodo: {p}': 'CSV for the period: {p}', 'CSV di tutti i movimenti': 'CSV of all transactions',
    'Dati': 'Data', 'Elimina tutti i dati': 'Delete all data', 'dati solo su questo dispositivo': 'data only on this device',
    '{n} movimenti, circa {kb} KB.': '{n} transactions, about {kb} KB.', ' Archiviazione non disponibile.': ' Storage unavailable.',
    ' Archivio protetto dal browser.': ' Storage protected by the browser.',
    ' Il browser potrebbe cancellare i dati: esporta un backup ogni tanto.': ' The browser may erase your data: export a backup now and then.',
    // inserimento
    'Modifica spesa': 'Edit expense', 'Modifica entrata': 'Edit income', 'Modifica accantonamento': 'Edit allocation',
    'Nuova spesa': 'New expense', 'Nuova entrata': 'New income', 'Nuovo accantonamento': 'New allocation',
    'Oggi': 'Today', 'Data': 'Date', 'Chiudi': 'Close', 'Nota (facoltativa)': 'Note (optional)',
    'diviso': 'divided by', 'per': 'times', 'meno': 'minus', 'più': 'plus', 'Cancella': 'Delete',
    'Categoria': 'Category', ': tocca per salvare': ': tap to save', 'Nessuna voce. Creane una dal tab Categorie.': 'No items. Create one in the Categories tab.',
    'Elimina': 'Delete', 'Salva': 'Save', 'Inserisci prima un importo.': 'Enter an amount first.', 'Scegli una categoria.': 'Choose a category.',
    'Modifica salvata: {m}': 'Change saved: {m}', 'Spesa aggiunta: {m}': 'Expense added: {m}', 'Entrata aggiunta: {m}': 'Income added: {m}',
    'Accantonamento aggiunto: {m}': 'Allocation added: {m}',
    'Eliminare questo movimento?': 'Delete this transaction?', 'Movimento eliminato.': 'Transaction deleted.',
    // editor
    'Editor': 'Editor', 'Modifica destinazione': 'Edit destination', 'Modifica categoria': 'Edit category',
    'Nuova destinazione': 'New destination', 'Nuova categoria': 'New category',
    'Nome': 'Name', 'Icona o emoji': 'Icon or emoji', 'Icona {e}': 'Icon {e}', 'Colore': 'Color', 'Colore {c}': 'Color {c}',
    'Limite di spesa mensile in euro (facoltativo)': 'Monthly spending limit in euro (optional)', 'Annulla': 'Cancel',
    'Scrivi un nome.': 'Enter a name.', 'Il limite non è un importo valido.': 'The limit is not a valid amount.', 'Salvato.': 'Saved.',
    'Eliminare “{n}”?': 'Delete “{n}”?',
    ' Il movimento collegato resta, ma senza categoria.': ' The linked transaction stays, but without a category.',
    ' I {u} movimenti collegati restano, ma senza categoria.': ' The {u} linked transactions stay, but without a category.',
    'Eliminata.': 'Deleted.',
    // backup, csv, import
    'Backup pronto.': 'Backup ready.', 'tutto': 'all', 'Report CSV pronto.': 'CSV report ready.',
    'Data;Tipo;Categoria o destinazione;Importo EUR;Note': 'Date;Type;Category or destination;Amount EUR;Notes',
    'Totale entrate': 'Total income', 'Totale spese': 'Total expenses', 'Totale accantonato': 'Total allocated',
    '  di cui {n}': '  of which {n}', 'Risparmio totale (Entrate - Spese)': 'Total savings (Income - Expenses)',
    'Saldo netto (Entrate - Spese - Accantonamenti)': 'Net balance (Income - Expenses - Allocations)',
    'Impossibile leggere il file.': 'Unable to read the file.', 'Importazione annullata: {m}': 'Import cancelled: {m}', 'file non valido': 'invalid file',
    'Sostituire i dati attuali con quelli del file? Il file contiene {m} movimenti, {c} categorie e {d} destinazioni.': 'Replace the current data with the file’s data? The file contains {m} transactions, {c} categories and {d} destinations.',
    'Dati importati.': 'Data imported.',
    'Eliminare TUTTI i dati? Questa azione non si può annullare. Esporta prima un backup.': 'Delete ALL data? This cannot be undone. Export a backup first.',
    'Ultima conferma: cancello movimenti, categorie e destinazioni.': 'Final confirmation: I will erase transactions, categories and destinations.',
    'Dati eliminati.': 'Data deleted.', 'Te lo ricordo tra 7 giorni.': 'I will remind you in 7 days.',
    'Nuova versione installata. Riapri l’app per usarla.': 'New version installed. Reopen the app to use it.'
  };

  // Nomi delle voci predefinite: restano tradotti finche l'utente non li rinomina.
  var SYS = {
    home: { k: 'expense', it: 'Casa', en: 'Home' }, groceries: { k: 'expense', it: 'Spesa', en: 'Groceries' },
    transport: { k: 'expense', it: 'Trasporti', en: 'Transport' }, dining: { k: 'expense', it: 'Ristoranti', en: 'Dining out' },
    health: { k: 'expense', it: 'Salute', en: 'Health' }, leisure: { k: 'expense', it: 'Svago', en: 'Leisure' },
    shopping: { k: 'expense', it: 'Shopping', en: 'Shopping' }, bills: { k: 'expense', it: 'Bollette', en: 'Bills' },
    salary: { k: 'income', it: 'Stipendio', en: 'Salary' }, refunds: { k: 'income', it: 'Rimborsi', en: 'Refunds' },
    extra: { k: 'income', it: 'Extra', en: 'Extra' },
    deposit: { k: 'saving', it: 'Conto Deposito', en: 'Deposit account' }, pension: { k: 'saving', it: 'Fondo Pensione', en: 'Pension fund' },
    etf: { k: 'saving', it: 'ETF/Investimenti', en: 'ETF/Investments' }
  };
  var ADDED = { expense: 'Spesa aggiunta: {m}', income: 'Entrata aggiunta: {m}', saving: 'Accantonamento aggiunto: {m}' };
  var EDIT_TITLE = { expense: 'Modifica spesa', income: 'Modifica entrata', saving: 'Modifica accantonamento' };
  var NEW_TITLE = { expense: 'Nuova spesa', income: 'Nuova entrata', saving: 'Nuovo accantonamento' };

  function T(str, p) {
    var r = str;
    if (lang === 'en' && Object.prototype.hasOwnProperty.call(EN, str)) { r = EN[str]; }
    if (p) { r = r.replace(/\{(\w+)\}/g, function (m, k) { return p[k] !== undefined ? p[k] : m; }); }
    return r;
  }

  // Nome da mostrare: le voci predefinite non rinominate seguono la lingua.
  function nm(x) {
    if (x.sys && SYS[x.sys] && (x.name === SYS[x.sys].it || x.name === SYS[x.sys].en)) { return SYS[x.sys][lang]; }
    return x.id === '__none' ? T(x.name) : x.name;
  }

  function typeLabel(type) { return T(TYPE_LABEL[type]); }

  // Voce predefinita di una categoria importata o vecchia, riconosciuta dal nome italiano.
  function sysOf(raw, nameStr, kind) {
    var k, n = String(nameStr || '').trim();
    if (typeof raw === 'string' && SYS[raw] && SYS[raw].k === kind) { return raw; }
    for (k in SYS) { if (SYS[k].k === kind && SYS[k].it === n) { return k; } }
    return '';
  }

  function translateStatic() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n]'), function (el) { el.textContent = T(el.getAttribute('data-i18n')); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n-aria]'), function (el) { el.setAttribute('aria-label', T(el.getAttribute('data-i18n-aria'))); });
    var md = document.querySelector('meta[name="description"]');
    if (md) { md.setAttribute('content', T('Tracker semplice delle spese personali. Offline, gratuito, senza server.')); }
  }

  function setLang(l) {
    lang = l === 'en' ? 'en' : 'it';
    LOCALE = lang === 'en' ? 'en-GB' : 'it-IT';
    DEC = lang === 'en' ? '.' : ',';
    THOU = lang === 'en' ? ',' : '.';
    // useGrouping "always" mostra 1.490,00 anche con 4 cifre, come il tastierino.
    currencyFmt = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'EUR', useGrouping: 'always' });
    document.documentElement.setAttribute('lang', lang);
    translateStatic();
  }

  // ----------------------------------------------------------------- utility

  function $(sel, root) { return (root || document).querySelector(sel); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pad2(n) { return n < 10 ? '0' + n : String(n); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function asArray(x) { return Array.isArray(x) ? x : []; }

  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function isValidISO(s) {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) { return false; }
    var y = +s.slice(0, 4), m = +s.slice(5, 7), d = +s.slice(8, 10);
    if (y < 1900 || y > 2200) { return false; }
    var dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  }

  function fmtDate(iso) { return iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4); }

  function dayLabel(iso) {
    var d = new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
    return d.toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' });
  }

  function money(cents) { return currencyFmt.format(cents / 100); }

  // Colore del testo leggibile sopra uno sfondo colorato.
  function textOn(hex) {
    var r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62 ? '#0f172a' : '#ffffff';
  }

  // Importo digitato sul tastierino ("12,5") in centesimi.
  function parseAmount(str) {
    if (!str) { return 0; }
    var parts = str.split(',');
    var whole = parseInt(parts[0] || '0', 10) || 0;
    var frac = parseInt(((parts[1] || '') + '00').slice(0, 2), 10) || 0;
    return whole * 100 + frac;
  }

  function centsToStr(c) {
    var whole = Math.floor(c / 100), frac = c % 100;
    return frac ? whole + ',' + pad2(frac).replace(/0$/, '') : String(whole);
  }

  function formatAmountDisplay(str) {
    if (!str) { return '0'; }
    var i = str.indexOf(',');
    var whole = i >= 0 ? str.slice(0, i) : str;
    var rest = i >= 0 ? DEC + str.slice(i + 1) : '';
    return whole.replace(/\B(?=(\d{3})+(?!\d))/g, THOU) + rest;
  }

  // Importo scritto in un campo di testo. Ritorna null se vuoto, NaN se non valido.
  function parseMoneyInput(s) {
    s = String(s || '').replace(/\s|€/g, '');
    if (!s) { return null; }
    if (s.indexOf(',') >= 0 && s.indexOf('.') >= 0) {
      // con entrambi i simboli, l ultimo e il decimale
      s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
    } else if (s.indexOf(',') >= 0) {
      s = lang === 'en' && /^\d{1,3}(,\d{3})+$/.test(s) ? s.replace(/,/g, '') : s.replace(',', '.');
    } else if (lang === 'it' && /^\d{1,3}(\.\d{3})+$/.test(s)) { s = s.replace(/\./g, ''); }
    if (!/^\d+(\.\d{1,2})?$/.test(s)) { return NaN; }
    var v = Math.round(parseFloat(s) * 100);
    return v > 0 && v < 1e11 ? v : NaN;
  }

  // Calcolatrice del tastierino: "12,5+3×2" vale 18,50. Precedenza a × e ÷, importi in centesimi.
  var OPS = '+−×÷';
  function isOp(ch) { return OPS.indexOf(ch) >= 0; }
  function lastSeg(str) { return /[^+−×÷]*$/.exec(str)[0]; }
  function evalExpr(str) {
    var t = str;
    while (t && isOp(t.slice(-1))) { t = t.slice(0, -1); }
    if (!t) { return { v: 0 }; }
    var nums = [], ops = [], cur = '', i, ch;
    for (i = 0; i < t.length; i++) {
      ch = t.charAt(i);
      if (isOp(ch)) { nums.push(parseAmount(cur)); ops.push(ch); cur = ''; } else { cur += ch; }
    }
    nums.push(parseAmount(cur));
    if (!ops.length) { return nums[0] >= 1e11 ? { err: T('Importo troppo grande.') } : { v: nums[0] }; }
    var n2 = [nums[0]], o2 = [], b;
    for (i = 0; i < ops.length; i++) {
      b = nums[i + 1];
      if (ops[i] === '×') { n2[n2.length - 1] = Math.round(n2[n2.length - 1] * b / 100); }
      else if (ops[i] === '÷') {
        if (b === 0) { return { err: T('Non si può dividere per zero.') }; }
        n2[n2.length - 1] = Math.round(n2[n2.length - 1] * 100 / b);
      } else { n2.push(b); o2.push(ops[i]); }
    }
    var v = n2[0];
    for (i = 0; i < o2.length; i++) { v = o2[i] === '+' ? v + n2[i + 1] : v - n2[i + 1]; }
    if (v <= 0) { return { err: T('Il risultato deve essere maggiore di zero.') }; }
    if (v >= 1e11) { return { err: T('Importo troppo grande.') }; }
    return { v: v };
  }
  function formatExpr(str) {
    return str.replace(/[^+−×÷]+/g, function (m) { return formatAmountDisplay(m); }).replace(/([+−×÷])/g, ' $1 ');
  }

  // Giorni passati da una data locale YYYY-MM-DD (negativo se futura).
  function daysSince(iso) {
    if (!isValidISO(iso)) { return Infinity; }
    var a = new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
    var n = new Date();
    n = new Date(n.getFullYear(), n.getMonth(), n.getDate());
    return Math.round((n - a) / 86400000);
  }
  function inDaysISO(days) {
    var d = new Date();
    d.setDate(d.getDate() + days);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  // Ricerca senza maiuscole e senza accenti.
  function norm(str) { return String(str).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  // ------------------------------------------------------------------- dati

  var memoryOnly = false;

  function makeCat(type, sys, icon, color) {
    return { id: uid(), type: type, sys: sys, name: SYS[sys].it, icon: icon, color: color, limit: null };
  }

  function defaultData() {
    return {
      version: DB_VERSION,
      settings: { theme: 'auto', lang: 'it', lastBackup: '', backupSnooze: '', guideSeen: false },
      categories: [
        makeCat('expense', 'home', '🏠', '#6366f1'),
        makeCat('expense', 'groceries', '🛒', '#22c55e'),
        makeCat('expense', 'transport', '🚗', '#06b6d4'),
        makeCat('expense', 'dining', '🍽️', '#f97316'),
        makeCat('expense', 'health', '💊', '#ef4444'),
        makeCat('expense', 'leisure', '🎉', '#d946ef'),
        makeCat('expense', 'shopping', '👕', '#ec4899'),
        makeCat('expense', 'bills', '💡', '#eab308'),
        makeCat('income', 'salary', '💼', '#16a34a'),
        makeCat('income', 'refunds', '🧾', '#14b8a6'),
        makeCat('income', 'extra', '💶', '#84cc16')
      ],
      destinations: [
        { id: uid(), sys: 'deposit', name: SYS.deposit.it, icon: '🏦', color: '#3b82f6' },
        { id: uid(), sys: 'pension', name: SYS.pension.it, icon: '🧓', color: '#8b5cf6' },
        { id: uid(), sys: 'etf', name: SYS.etf.it, icon: '📈', color: '#06b6d4' }
      ],
      transactions: []
    };
  }

  // Valida e ripulisce un oggetto dati. Lancia un errore se il formato non e usabile.
  function sanitizeDB(raw) {
    if (!raw || typeof raw !== 'object') { throw new Error('Il file non contiene dati validi.'); }
    var v = Number(raw.version);
    if (!isFinite(v) || v < 1) { throw new Error('Versione dati mancante.'); }
    if (v > DB_VERSION) { throw new Error('Il file viene da una versione più recente di SPET.'); }
    // Qui vanno le migrazioni future: if (v < 2) { ... }

    var refSeen = {}, txSeen = {};
    function refId(id) {
      id = typeof id === 'string' && id ? id.slice(0, 40) : uid();
      while (refSeen[id] || id === NONE_REF.id) { id = uid(); }
      refSeen[id] = 1;
      return id;
    }
    function color(c) { return /^#[0-9a-fA-F]{6}$/.test(c) ? c : '#64748b'; }
    function icon(i) { return Array.from(String(i || '')).slice(0, 4).join('') || '🏷️'; }
    function name(n) { return String(n || '').trim().slice(0, 30) || 'Senza nome'; }

    var categories = asArray(raw.categories).filter(function (c) {
      return c && (c.type === 'expense' || c.type === 'income');
    }).map(function (c) {
      var lim = Math.round(Number(c.limit));
      var o = { id: refId(c.id), type: c.type };
      var sy = sysOf(c.sys, c.name, c.type);
      if (sy) { o.sys = sy; }
      o.name = name(c.name); o.icon = icon(c.icon); o.color = color(c.color);
      o.limit = c.type === 'expense' && lim > 0 && lim < 1e11 ? lim : null;
      return o;
    });

    var destinations = asArray(raw.destinations).filter(Boolean).map(function (d) {
      var o = { id: refId(d.id) };
      var sy = sysOf(d.sys, d.name, 'saving');
      if (sy) { o.sys = sy; }
      o.name = name(d.name); o.icon = icon(d.icon); o.color = color(d.color);
      return o;
    });

    var transactions = asArray(raw.transactions).filter(function (t) {
      return t && TYPE_LABEL[t.type] && isValidISO(t.date) && Math.round(Number(t.amount)) > 0 && Math.round(Number(t.amount)) < 1e11;
    }).map(function (t) {
      var id = typeof t.id === 'string' && t.id ? t.id.slice(0, 40) : uid();
      while (txSeen[id]) { id = uid(); }
      txSeen[id] = 1;
      return {
        id: id, type: t.type, amount: Math.round(Number(t.amount)),
        refId: typeof t.refId === 'string' ? t.refId : '', date: t.date,
        note: String(t.note || '').slice(0, 200), createdAt: Number(t.createdAt) || Date.now()
      };
    });

    var st = raw.settings && typeof raw.settings === 'object' ? raw.settings : {};
    return {
      version: DB_VERSION,
      settings: {
        theme: st.theme === 'light' || st.theme === 'dark' ? st.theme : 'auto',
        lang: st.lang === 'en' ? 'en' : 'it',
        lastBackup: isValidISO(st.lastBackup) ? st.lastBackup : '',
        backupSnooze: isValidISO(st.backupSnooze) ? st.backupSnooze : '',
        guideSeen: st.guideSeen === true
      },
      categories: categories, destinations: destinations, transactions: transactions
    };
  }

  var pendingNotice = null;
  var lastRaw = null; // ultimo testo letto o scritto in localStorage

  var migrated = false;

  function load() {
    var raw = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) { raw = localStorage.getItem(LEGACY_KEY); migrated = !!raw; }
    }
    catch (e) { memoryOnly = true; pendingNotice = ['Archiviazione non disponibile: i dati non verranno conservati.', 'over']; }
    lastRaw = raw;
    if (!raw) { return defaultData(); }
    try { return sanitizeDB(JSON.parse(raw)); }
    catch (e) {
      try { localStorage.setItem(STORAGE_KEY + ':corrupt', raw); } catch (e2) { /* ignora */ }
      pendingNotice = ['I dati salvati erano danneggiati. Ne ho tenuto una copia grezza.', 'warn'];
      return defaultData();
    }
  }

  var db = load();
  setLang(db.settings.lang);
  if (migrated) { save(); }

  function save() {
    if (memoryOnly) { return false; }
    try {
      var text = JSON.stringify(db);
      localStorage.setItem(STORAGE_KEY, text);
      lastRaw = text;
      return true;
    }
    catch (e) { toast('Salvataggio non riuscito. Esporta subito un backup.', 'over'); return false; }
  }

  // Altra scheda o finestra ha scritto: rileggi, cosi un salvataggio non sovrascrive dati piu nuovi.
  function syncFromStorage() {
    if (memoryOnly) { return; }
    var raw;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { return; }
    if (!raw || raw === lastRaw) { return; }
    try { db = sanitizeDB(JSON.parse(raw)); lastRaw = raw; render(); } catch (e) { /* dati altrui illeggibili: tieni i miei */ }
  }

  // ------------------------------------------------------------------ stato UI

  var now0 = new Date();
  var ui = { tab: 'home', mode: 'month', year: now0.getFullYear(), month: now0.getMonth(), selected: null, filter: 'all', query: '', sort: 'date', reorder: false };
  var entry = null;
  var editor = null;

  // ---------------------------------------------------------------- calcoli

  function inPeriod(t) {
    if (ui.mode === 'year') { return t.date.slice(0, 4) === String(ui.year); }
    return t.date.slice(0, 7) === ui.year + '-' + pad2(ui.month + 1);
  }

  function findRef(id, type) {
    var list = type === 'saving' ? db.destinations : db.categories;
    for (var i = 0; i < list.length; i++) { if (list[i].id === id) { return list[i]; } }
    return null;
  }

  function periodLabel() {
    if (ui.mode === 'year') { return String(ui.year); }
    var s = new Date(ui.year, ui.month, 1).toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function statusOf(spent, limit) {
    if (spent >= limit) { return 'over'; }
    if (spent * 5 >= limit * 4) { return 'warn'; }
    return 'ok';
  }

  function compute() {
    var income = 0, expense = 0, saved = 0, exp = {}, sav = {};
    db.transactions.filter(inPeriod).forEach(function (t) {
      var ref = findRef(t.refId, t.type);
      var key = ref ? ref.id : NONE_REF.id;
      if (t.type === 'income') { income += t.amount; }
      else if (t.type === 'expense') { expense += t.amount; exp[key] = (exp[key] || 0) + t.amount; }
      else { saved += t.amount; sav[key] = (sav[key] || 0) + t.amount; }
    });

    var expItems = [];
    db.categories.forEach(function (c) {
      if (c.type !== 'expense') { return; }
      var amount = exp[c.id] || 0;
      if (amount > 0 || (ui.mode === 'month' && c.limit)) {
        expItems.push({ id: c.id, name: nm(c), icon: c.icon, color: c.color, amount: amount, limit: c.limit });
      }
    });
    if (exp[NONE_REF.id]) { expItems.push({ id: NONE_REF.id, name: nm(NONE_REF), icon: NONE_REF.icon, color: NONE_REF.color, amount: exp[NONE_REF.id], limit: null }); }
    expItems.sort(function (a, b) { return b.amount - a.amount || a.name.localeCompare(b.name, LOCALE); });

    var savItems = [];
    db.destinations.forEach(function (d) {
      if (sav[d.id]) { savItems.push({ id: d.id, name: nm(d), icon: d.icon, color: d.color, amount: sav[d.id] }); }
    });
    if (sav[NONE_REF.id]) { savItems.push({ id: NONE_REF.id, name: nm(NONE_REF), icon: NONE_REF.icon, color: NONE_REF.color, amount: sav[NONE_REF.id] }); }
    savItems.sort(function (a, b) { return b.amount - a.amount; });

    return {
      income: income, expense: expense, saved: saved,
      surplus: income - expense, net: income - expense - saved,
      expItems: expItems, savItems: savItems
    };
  }

  // ------------------------------------------------------------------ toast

  function toast(msg, level, ms) {
    var box = $('#toasts');
    level = level || 'info';
    var d = document.createElement('div');
    d.className = 'toast ' + level;
    d.setAttribute('role', level === 'over' || level === 'warn' ? 'alert' : 'status');
    d.textContent = T(msg);
    d.addEventListener('click', function () { d.remove(); });
    box.appendChild(d);
    while (box.children.length > 3) { box.removeChild(box.firstChild); }
    setTimeout(function () { if (d.parentNode) { d.remove(); } }, ms || (level === 'over' || level === 'warn' ? 6500 : 2600));
    if (navigator.vibrate) { try { navigator.vibrate(level === 'over' ? [80, 60, 80] : level === 'warn' ? 60 : 0); } catch (e) { /* ignora */ } }
  }

  // ----------------------------------------------------------------- budget

  // Calcola se una spesa fa attraversare la soglia dell 80 o del 100 per cento.
  function budgetAlert(tx) {
    var c = findRef(tx.refId, 'expense');
    if (!c || !c.limit) { return null; }
    var ym = tx.date.slice(0, 7), before = 0;
    db.transactions.forEach(function (t) {
      if (t.type === 'expense' && t.refId === tx.refId && t.date.slice(0, 7) === ym && t.id !== tx.id) { before += t.amount; }
    });
    var after = before + tx.amount, lim = c.limit;
    var pct = Math.floor(after * 100 / lim);
    if (after >= lim) {
      return { level: 'over', text: T('🚨 {name}: limite mensile superato. {a} su {l} ({p}%).', { name: nm(c), a: money(after), l: money(lim), p: pct }) };
    }
    if (after * 5 >= lim * 4 && before * 5 < lim * 4) {
      return { level: 'warn', text: T('⚠️ {name}: hai usato il {p}% del limite mensile. {a} su {l}.', { name: nm(c), p: pct, a: money(after), l: money(lim) }) };
    }
    return null;
  }

  // ---------------------------------------------------------------- rendering

  function tile(cls, label, cents) {
    return '<div class="tile ' + cls + '"><span class="lbl">' + T(label) + '</span><strong>' + money(cents) + '</strong></div>';
  }

  function limitText(it) {
    var pct = Math.floor(it.amount * 100 / it.limit);
    if (it.amount >= it.limit) { return T('Limite superato: {a} su {l} ({p}%)', { a: money(it.amount), l: money(it.limit), p: pct }); }
    return T('{a} su {l} · {p}%', { a: money(it.amount), l: money(it.limit), p: pct });
  }

  function catRow(it, total, showLimit) {
    var pct = total ? Math.round(it.amount * 100 / total) : 0;
    var s = '<button type="button" class="cat-row' + (ui.selected === it.id ? ' selected' : '') + '" data-action="sel-cat" data-ref="' + esc(it.id) + '">' +
      '<span class="row-top"><span class="chip" style="background:' + it.color + ';color:' + textOn(it.color) + '">' + esc(it.icon) + '</span>' +
      '<span class="row-name">' + esc(it.name) + '</span>' +
      '<span class="row-amt">' + money(it.amount) + '<small>' + pct + '%</small></span></span>';
    if (showLimit && it.limit) {
      var st = statusOf(it.amount, it.limit);
      var ratio = it.amount * 100 / it.limit;
      s += '<span class="bar ' + st + '" role="progressbar" aria-label="' + esc(T('Limite {name}', { name: it.name })) + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.min(100, Math.floor(ratio)) + '"><i style="width:' + Math.min(100, ratio) + '%"></i></span>' +
        '<span class="limit-text ' + st + '">' + limitText(it) + '</span>';
    }
    return s + '</button>';
  }

  function donut(items, total) {
    var cx = 130, cy = 130, R = 100, C = 2 * Math.PI * R;
    if (!total) {
      return '<svg class="donut" viewBox="0 0 260 260" role="img" aria-label="' + T('Nessuna spesa nel periodo') + '"><circle cx="130" cy="130" r="100" fill="none" stroke="var(--ring-empty)" stroke-width="36"/></svg>';
    }
    var gap = items.length > 1 ? 2.5 : 0, offset = 0, circles = '', labels = '';
    items.forEach(function (it) {
      if (!it.amount) { return; }
      var len = it.amount / total * C;
      var seg = Math.max(len - gap, 0.5);
      var sel = ui.selected === it.id;
      var pct = Math.round(it.amount * 100 / total);
      circles += '<circle class="seg" data-action="sel-cat" data-ref="' + esc(it.id) + '" role="button" tabindex="0" aria-label="' + esc(it.name) + ' ' + pct + '%" cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="' + it.color +
        '" stroke-width="' + (sel ? 46 : 36) + '" stroke-dasharray="' + seg.toFixed(2) + ' ' + (C - seg).toFixed(2) + '" stroke-dashoffset="' + (-offset).toFixed(2) + '" transform="rotate(-90 130 130)"/>';
      if (it.amount / total >= 0.07) {
        var ang = (offset + len / 2) / C * 2 * Math.PI - Math.PI / 2;
        var x = cx + R * Math.cos(ang), y = cy + R * Math.sin(ang), fg = textOn(it.color);
        labels += '<text x="' + x.toFixed(1) + '" y="' + (y - 4).toFixed(1) + '" text-anchor="middle" dominant-baseline="central" font-size="16" fill="' + fg + '">' + esc(it.icon) + '</text>' +
          '<text x="' + x.toFixed(1) + '" y="' + (y + 10).toFixed(1) + '" text-anchor="middle" dominant-baseline="central" font-size="9.5" fill="' + fg + '">' + pct + '%</text>';
      }
      offset += len;
    });
    return '<svg class="donut" viewBox="0 0 260 260" role="group" aria-label="' + T('Distribuzione delle spese') + '">' + circles + labels + '</svg>';
  }

  function yearChart() {
    var data = [], i;
    for (i = 0; i < 12; i++) { data.push({ income: 0, expense: 0, saving: 0 }); }
    db.transactions.forEach(function (t) {
      if (t.date.slice(0, 4) === String(ui.year)) { data[+t.date.slice(5, 7) - 1][t.type] += t.amount; }
    });
    var max = 1;
    data.forEach(function (d) { max = Math.max(max, d.income, d.expense, d.saving); });
    var base = 112, h = 96, out = '<svg class="year-chart" viewBox="0 0 360 134" role="img" aria-label="' + T('Entrate, spese e accantonamenti per mese') + '">';
    out += '<line class="grid" x1="0" x2="360" y1="' + base + '" y2="' + base + '"/>';
    var cols = { income: 'var(--income)', expense: 'var(--expense)', saving: 'var(--saving)' };
    for (i = 0; i < 12; i++) {
      var x0 = 4 + i * 29.5, k = 0;
      ['income', 'expense', 'saving'].forEach(function (key) {
        var bh = data[i][key] / max * h;
        if (bh > 0) { out += '<rect x="' + (x0 + k * 9).toFixed(1) + '" y="' + (base - bh).toFixed(1) + '" width="8" height="' + Math.max(bh, 1.5).toFixed(1) + '" rx="2" fill="' + cols[key] + '"/>'; }
        k++;
      });
      out += '<text x="' + (x0 + 13).toFixed(1) + '" y="127" text-anchor="middle">' + MONTHS_SHORT[lang][i] + '</text>';
      out += '<rect x="' + x0.toFixed(1) + '" y="0" width="28" height="134" fill="transparent" data-action="goto-month" data-m="' + i + '" role="button" tabindex="0" aria-label="' + T('Apri il mese {n}', { n: i + 1 }) + '" style="cursor:pointer"/>';
    }
    return out + '</svg><div class="legend"><span style="--c:var(--income)">' + T('Entrate') + '</span><span style="--c:var(--expense)">' + T('Spese') + '</span><span style="--c:var(--saving)">' + T('Accantonato') + '</span></div>';
  }

  // Messaggio del promemoria backup, oppure null se non serve.
  function backupDue() {
    if (db.transactions.length < 5) { return null; }
    var s = db.settings;
    if (s.backupSnooze && daysSince(s.backupSnooze) <= 0) { return null; }
    if (!s.lastBackup) { return T('Non hai ancora salvato un backup.'); }
    var d = daysSince(s.lastBackup);
    return d >= 30 ? T('L’ultimo backup risale a {d} giorni fa.', { d: d }) : null;
  }

  function renderNotices() {
    var out = '';
    if (!db.transactions.length && !db.settings.guideSeen) {
      out += '<section class="guide" aria-label="' + T('Guida rapida') + '"><h2>' + T('Come si usa') + '</h2><ol>' +
        '<li>' + T('Tocca <b>− Spesa</b>, scrivi l’importo e scegli la categoria. Fatto.') + '</li>' +
        '<li>' + T('Il tastierino fa anche i conti: 12,50 + 3 × 2.') + '</li>' +
        '<li>' + T('In <b>Categorie</b> dai un limite mensile a ogni spesa: ti avviso all’80% e al 100%.') + '</li>' +
        '<li>' + T('Con <b>+ Investi/Accantona</b> sposti denaro verso le tue destinazioni di risparmio.') + '</li>' +
        '<li>' + T('I dati restano solo su questo dispositivo. Salva un backup da <b>Impostazioni</b>.') + '</li></ol>' +
        '<button type="button" class="btn primary" data-action="guide-dismiss">' + T('Ho capito') + '</button></section>';
    }
    var due = backupDue();
    if (due) {
      out += '<section class="banner" aria-label="' + T('Promemoria backup') + '"><p><strong>' + T('Backup consigliato.') + '</strong> ' + due +
        ' ' + T('I dati sono solo su questo dispositivo.') + '</p><div class="banner-actions">' +
        '<button type="button" class="btn primary" data-action="backup-now">' + T('Esporta ora') + '</button>' +
        '<button type="button" class="btn" data-action="backup-later">' + T('Più tardi') + '</button></div></section>';
    }
    return out;
  }

  function renderHome() {
    var c = compute();
    var out = renderNotices() + '<section class="hero" aria-label="' + T('Saldo') + '">' +
      '<div><span class="lbl">' + T('Saldo netto') + '</span><strong class="big' + (c.net < 0 ? ' neg' : '') + '">' + money(c.net) + '</strong><span class="hint">' + T('Entrate − Spese − Accantonamenti') + '</span></div>' +
      '<div><span class="lbl">' + T('Risparmio totale') + '</span><strong class="mid' + (c.surplus < 0 ? ' neg' : '') + '">' + money(c.surplus) + '</strong><span class="hint">' + T('Entrate − Spese') + '</span></div></section>';
    out += '<section class="tiles" aria-label="' + T('Totali') + '">' + tile('income', 'Entrate', c.income) + tile('expense', 'Spese', c.expense) + tile('saving', 'Accantonato', c.saved) + '</section>';

    if (c.savItems.length) {
      out += '<section class="panel"><h2>' + T('Accantonato per destinazione') + '</h2>';
      c.savItems.forEach(function (it) {
        out += '<div class="dest-row"><span class="chip" style="background:' + it.color + ';color:' + textOn(it.color) + '">' + esc(it.icon) + '</span><span class="name">' + esc(it.name) + '</span><span class="amt">' + money(it.amount) + '</span></div>';
      });
      out += '</section>';
    }

    var sel = null;
    c.expItems.forEach(function (it) { if (it.id === ui.selected) { sel = it; } });
    if (!sel) { ui.selected = null; }

    out += '<section class="panel"><h2>' + T('Distribuzione delle spese') + '</h2><div class="donut-wrap">' + donut(c.expItems, c.expense) + '<div class="donut-center">';
    if (sel) {
      out += '<span class="dc-icon">' + esc(sel.icon) + '</span><span class="dc-name">' + esc(sel.name) + '</span><span class="dc-amt">' + money(sel.amount) + '</span><span class="dc-sub">' + Math.round(sel.amount * 100 / c.expense) + T('% delle spese') + '</span>';
    } else if (c.expense) {
      out += '<span class="dc-name">' + T('Spese') + '</span><span class="dc-amt">' + money(c.expense) + '</span><span class="dc-sub">' + T('tocca una fetta') + '</span>';
    } else {
      out += '<span class="dc-name">' + T('Nessuna spesa') + '</span><span class="dc-sub">' + T('in questo periodo') + '</span>';
    }
    out += '</div></div>';

    if (c.expItems.length) {
      out += '<div class="cat-list">';
      c.expItems.forEach(function (it) { out += catRow(it, c.expense, ui.mode === 'month'); });
      out += '</div>';
    } else {
      out += '<p class="empty">' + T('Usa “− Spesa” per registrare la prima spesa.') + '</p>';
    }
    out += '</section>';

    if (ui.mode === 'year') { out += '<section class="panel"><h2>' + T('Mese per mese') + '</h2>' + yearChart() + '</section>'; }
    return out;
  }

  function sortedTx(list) {
    return list.slice().sort(function (a, b) {
      return a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt;
    });
  }

  function matchesQuery(t, tokens) {
    var ref = findRef(t.refId, t.type) || NONE_REF;
    var hay = norm([nm(ref), t.note || '', typeLabel(t.type), fmtDate(t.date), eur(t.amount), money(t.amount)].join(' '));
    for (var i = 0; i < tokens.length; i++) { if (hay.indexOf(tokens[i]) < 0) { return false; } }
    return true;
  }

  function queryTokens() {
    var q = norm(ui.query).trim();
    return q ? q.split(/\s+/) : [];
  }

  function txRow(t, showDate) {
    var ref = findRef(t.refId, t.type) || NONE_REF;
    var sign = t.type === 'expense' ? '−' : t.type === 'income' ? '+' : '→';
    var sub = (showDate ? fmtDate(t.date) + ' · ' : '') + (t.note || typeLabel(t.type));
    return '<button type="button" class="tx-row" data-action="edit-tx" data-id="' + esc(t.id) + '">' +
      '<span class="chip" style="background:' + ref.color + ';color:' + textOn(ref.color) + '">' + esc(ref.icon) + '</span>' +
      '<span class="tx-main"><b>' + esc(nm(ref)) + '</b><small>' + esc(sub) + '</small></span>' +
      '<span class="tx-amt ' + t.type + '">' + sign + ' ' + money(t.amount) + '</span></button>';
  }

  // Risultati: la ricerca guarda tutto lo storico, senza il filtro del periodo.
  function renderListResults() {
    var tokens = queryTokens(), searching = tokens.length > 0;
    var txs = db.transactions.filter(function (t) {
      if (ui.filter !== 'all' && t.type !== ui.filter) { return false; }
      return searching ? matchesQuery(t, tokens) : inPeriod(t);
    });
    if (!txs.length) {
      return '<p class="empty">' + (searching ? esc(T('Nessun risultato per “{q}”.', { q: ui.query.trim() })) : T('Nessun movimento in questo periodo.')) + '</p>';
    }
    var out = searching ? '<p class="hint results-count" role="status">' + T(txs.length === 1 ? '{n} risultato in tutto lo storico' : '{n} risultati in tutto lo storico', { n: txs.length }) + '</p>' : '';
    if (ui.sort === 'amount') {
      txs = txs.slice().sort(function (a, b) { return b.amount - a.amount || (a.date < b.date ? 1 : a.date > b.date ? -1 : 0); });
      return out + '<div class="tx-group">' + txs.map(function (t) { return txRow(t, true); }).join('') + '</div>';
    }
    txs = sortedTx(txs);
    var day = null;
    txs.forEach(function (t, i) {
      if (t.date !== day) {
        if (day !== null) { out += '</div>'; }
        day = t.date;
        out += '<div class="day-head">' + esc(dayLabel(day)) + '</div><div class="tx-group">';
      }
      out += txRow(t, false);
      if (i === txs.length - 1) { out += '</div>'; }
    });
    return out;
  }

  function renderList() {
    var filters = [['all', T('Tutti')], ['expense', T('Spese')], ['income', T('Entrate')], ['saving', T('Accantonamenti')]];
    var sorts = [['date', T('Per data')], ['amount', T('Per importo')]];
    var out = '<div class="search-wrap"><input type="search" id="tx-search" class="field-input search-input" placeholder="' + T('Cerca per nota, categoria, importo') + '" aria-label="' + T('Cerca nei movimenti') + '" value="' + esc(ui.query) + '" autocomplete="off" enterkeyhint="search"></div>';
    out += '<div class="filters" role="group" aria-label="' + T('Filtro') + '">';
    filters.forEach(function (f) { out += '<button type="button" data-action="filter" data-f="' + f[0] + '" aria-pressed="' + (ui.filter === f[0]) + '" class="' + (ui.filter === f[0] ? 'on' : '') + '">' + f[1] + '</button>'; });
    out += '</div><div class="filters" role="group" aria-label="' + T('Ordine') + '">';
    sorts.forEach(function (f) { out += '<button type="button" data-action="sort" data-s="' + f[0] + '" aria-pressed="' + (ui.sort === f[0]) + '" class="' + (ui.sort === f[0] ? 'on' : '') + '">' + f[1] + '</button>'; });
    return out + '</div><div id="list-results">' + renderListResults() + '</div>';
  }

  function moveCat(kind, id, dir) {
    var arr = kind === 'saving' ? db.destinations : db.categories;
    var idxs = [], pos = -1;
    arr.forEach(function (x, i) {
      if (kind === 'saving' || x.type === kind) { if (x.id === id) { pos = idxs.length; } idxs.push(i); }
    });
    var np = pos + dir;
    if (pos < 0 || np < 0 || np >= idxs.length) { return; }
    var a = idxs[pos], b = idxs[np], tmp = arr[a];
    arr[a] = arr[b]; arr[b] = tmp;
    save(); render();
    var btns = Array.prototype.filter.call(document.querySelectorAll('[data-action="cat-move"]'), function (x) { return x.getAttribute('data-id') === id; });
    var want = btns.filter(function (x) { return +x.getAttribute('data-dir') === dir && !x.disabled; })[0] || btns.filter(function (x) { return !x.disabled; })[0];
    if (want) { want.focus(); }
    toast(T('Posizione {n} di {m}', { n: np + 1, m: idxs.length }), 'info', 1500);
  }

  function catSection(title, kind, items) {
    var out = '<h2 class="section-title">' + title + '</h2><div class="list-card">';
    items.forEach(function (c, idx) {
      var sub = kind === 'expense' ? (c.limit ? T('Limite mensile {l}', { l: money(c.limit) }) : T('Nessun limite')) : kind === 'income' ? T('Entrata') : T('Destinazione');
      var chip = '<span class="chip" style="background:' + c.color + ';color:' + textOn(c.color) + '">' + esc(c.icon) + '</span>';
      var name = '<span class="grow"><b>' + esc(nm(c)) + '</b><small>' + sub + '</small></span>';
      if (ui.reorder) {
        var base = ' data-action="cat-move" data-kind="' + kind + '" data-id="' + esc(c.id) + '"';
        out += '<div class="item-row">' + chip + name + '<span class="mv">' +
          '<button type="button" class="mv-btn"' + base + ' data-dir="-1" aria-label="' + esc(T('Sposta su {name}', { name: nm(c) })) + '"' + (idx === 0 ? ' disabled' : '') + '>↑</button>' +
          '<button type="button" class="mv-btn"' + base + ' data-dir="1" aria-label="' + esc(T('Sposta giù {name}', { name: nm(c) })) + '"' + (idx === items.length - 1 ? ' disabled' : '') + '>↓</button></span></div>';
      } else {
        out += '<button type="button" class="item-row" data-action="edit-cat" data-kind="' + kind + '" data-id="' + esc(c.id) + '">' + chip + name + '<span class="chev" aria-hidden="true">›</span></button>';
      }
    });
    if (ui.reorder) { return out + '</div>'; }
    var addLabel = T(kind === 'expense' ? '+ Aggiungi categoria di spesa' : kind === 'income' ? '+ Aggiungi categoria di entrata' : '+ Aggiungi destinazione');
    return out + '<button type="button" class="add-btn" data-action="add-cat" data-kind="' + kind + '">' + addLabel + '</button></div>';
  }

  function renderCats() {
    return '<div class="cats-head"><button type="button" class="btn" data-action="reorder-toggle" aria-pressed="' + ui.reorder + '">' + T(ui.reorder ? 'Fine riordino' : 'Riordina') + '</button></div>' +
      catSection(T('Spese'), 'expense', db.categories.filter(function (c) { return c.type === 'expense'; })) +
      catSection(T('Entrate'), 'income', db.categories.filter(function (c) { return c.type === 'income'; })) +
      catSection(T('Destinazioni di accantonamento'), 'saving', db.destinations);
  }

  function renderSettings() {
    var themes = [['light', T('Chiaro')], ['dark', T('Scuro')], ['auto', T('Auto')]];
    var langs = [['it', 'Italiano'], ['en', 'English']];
    var out = '<h2 class="section-title">' + T('Lingua') + '</h2><div class="seg-full" role="group" aria-label="' + T('Lingua') + '">';
    langs.forEach(function (l) { out += '<button type="button" data-action="set-lang" data-v="' + l[0] + '" lang="' + l[0] + '" aria-pressed="' + (lang === l[0]) + '" class="' + (lang === l[0] ? 'on' : '') + '">' + l[1] + '</button>'; });
    out += '</div><h2 class="section-title">' + T('Tema') + '</h2><div class="seg-full" role="group" aria-label="' + T('Tema') + '">';
    themes.forEach(function (t) { out += '<button type="button" data-action="set-theme" data-v="' + t[0] + '" class="' + (db.settings.theme === t[0] ? 'on' : '') + '">' + t[1] + '</button>'; });
    out += '</div>';
    out += '<h2 class="section-title">' + T('Backup e trasferimento') + '</h2><div class="setting-block">' +
      '<p>' + T('Salva un file JSON e importalo su un altro dispositivo per spostare tutti i dati. Non serve alcun server.') + '</p>' +
      '<p id="backup-info"><strong>' + (db.settings.lastBackup ? T('Ultimo backup: {d}.', { d: fmtDate(db.settings.lastBackup) }) : T('Nessun backup finora.')) + '</strong></p>' +
      '<button type="button" class="btn primary" data-action="export-json">' + T('Esporta backup JSON') + '</button>' +
      '<button type="button" class="btn" data-action="import-json">' + T('Importa backup JSON') + '</button></div>';
    out += '<h2 class="section-title">' + T('Report CSV') + '</h2><div class="setting-block">' +
      '<p>' + T('Apribile con Excel e Fogli Google. Il separatore è il punto e virgola.') + '</p>' +
      '<button type="button" class="btn" data-action="export-csv" data-scope="period">' + esc(T('CSV del periodo: {p}', { p: periodLabel() })) + '</button>' +
      '<button type="button" class="btn" data-action="export-csv" data-scope="all">' + T('CSV di tutti i movimenti') + '</button></div>';
    out += '<h2 class="section-title">' + T('Dati') + '</h2><div class="setting-block">' +
      '<p id="storage-info"></p>' +
      '<button type="button" class="btn danger" data-action="reset-all">' + T('Elimina tutti i dati') + '</button></div>';
    out += '<p class="meta">SPET ' + APP_VERSION + ' · ' + T('dati solo su questo dispositivo') + '</p>' +
      '<p class="meta">Simple Personal Expense Tracker</p>';
    return out;
  }

  function updateStorageInfo() {
    var el = $('#storage-info');
    if (!el) { return; }
    var kb = Math.max(1, Math.round(JSON.stringify(db).length / 1024));
    var txt = T('{n} movimenti, circa {kb} KB.', { n: db.transactions.length, kb: kb });
    if (memoryOnly) { txt += T(' Archiviazione non disponibile.'); el.textContent = txt; return; }
    el.textContent = txt;
    if (navigator.storage && navigator.storage.persisted) {
      navigator.storage.persisted().then(function (p) {
        var e2 = $('#storage-info');
        if (e2) { e2.textContent = txt + T(p ? ' Archivio protetto dal browser.' : ' Il browser potrebbe cancellare i dati: esporta un backup ogni tanto.'); }
      }).catch(function () { /* ignora */ });
    }
  }

  function applyTheme() {
    var t = db.settings.theme;
    var dark = t === 'dark' || (t === 'auto' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) { meta.setAttribute('content', dark ? '#0b1020' : '#f4f6fb'); }
    var btn = $('#theme-btn');
    if (btn) { btn.textContent = dark ? '☀️' : '🌙'; }
  }

  function applyChrome() {
    var showActions = ui.tab === 'home' || ui.tab === 'list';
    var showPeriod = ui.tab === 'home' || (ui.tab === 'list' && !queryTokens().length);
    $('#period-nav').classList.toggle('hidden', !showPeriod);
    $('#mode-switch').classList.toggle('hidden', !showPeriod);
    document.body.classList.toggle('no-actions', !showActions);
    $('#period-label').textContent = periodLabel();
    Array.prototype.forEach.call(document.querySelectorAll('#mode-switch button'), function (b) {
      b.classList.toggle('on', b.getAttribute('data-mode') === ui.mode);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (b) {
      if (b.getAttribute('data-tab') === ui.tab) { b.setAttribute('aria-current', 'page'); } else { b.removeAttribute('aria-current'); }
    });
  }

  function render() {
    if (db.settings.lang !== lang) { setLang(db.settings.lang); }
    applyChrome();
    applyTheme();
    var html = ui.tab === 'home' ? renderHome() : ui.tab === 'list' ? renderList() : ui.tab === 'cats' ? renderCats() : renderSettings();
    $('#view').innerHTML = html;
    if (ui.tab === 'settings') { updateStorageInfo(); }
  }

  // --------------------------------------------------------- foglio inserimento

  function refsFor(type) {
    return type === 'saving' ? db.destinations : db.categories.filter(function (c) { return c.type === type; });
  }

  function openEntry(type, tx) {
    entry = tx
      ? { mode: 'edit', id: tx.id, type: tx.type, amountStr: centsToStr(tx.amount), refId: tx.refId, note: tx.note || '', date: tx.date, createdAt: tx.createdAt }
      : { mode: 'new', id: null, type: type, amountStr: '', refId: null, note: '', date: todayISO(), createdAt: Date.now() };
    sheetOpened();
    renderEntry();
  }

  function dateText(iso) { return iso === todayISO() ? T('Oggi') : fmtDate(iso); }

  function renderEntry() {
    var refs = refsFor(entry.type);
    var keys = ['1', '2', '3', '÷', '4', '5', '6', '×', '7', '8', '9', '−', ',', '0', 'back', '+'];
    var title = T(entry.mode === 'edit' ? EDIT_TITLE[entry.type] : NEW_TITLE[entry.type]);
    var h = '<div class="sheet-backdrop" data-action="close-sheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="' + title + '" tabindex="-1">' +
      '<div class="sheet-grip"></div><div class="sheet-head"><span class="type-pill ' + entry.type + '">' + title + '</span>' +
      '<label class="date-chip"><span id="date-text">' + dateText(entry.date) + '</span><input type="date" id="entry-date" value="' + entry.date + '" aria-label="' + T('Data') + '"></label>' +
      '<button type="button" class="icon-btn" data-action="close-sheet" aria-label="' + T('Chiudi') + '">✕</button></div>' +
      '<div class="amount-display" id="amount-display" aria-live="polite"></div><div class="calc-preview" id="calc-preview" aria-live="polite"></div>' +
      '<input class="note-input" id="entry-note" type="text" maxlength="200" placeholder="' + T('Nota (facoltativa)') + '" value="' + esc(entry.note) + '" autocomplete="off">' +
      '<div class="keypad">';
    var opNames = { '÷': T('diviso'), '×': T('per'), '−': T('meno'), '+': T('più') };
    keys.forEach(function (k) {
      var label = k === 'back' ? T('Cancella') : opNames[k] || '';
      h += '<button type="button" class="key' + (isOp(k) ? ' op' : (k === 'back' || k === ',' ? ' fn' : '')) + '" data-action="key" data-key="' + k + '"' + (label ? ' aria-label="' + label + '"' : '') + '>' + (k === 'back' ? '⌫' : k === ',' ? DEC : k) + '</button>';
    });
    h += '</div><div class="grid-title">' + T(entry.type === 'saving' ? 'Destinazione' : 'Categoria') + (entry.mode === 'new' ? T(': tocca per salvare') : '') + '</div><div class="cat-grid">';
    if (!refs.length) { h += '<p class="empty" style="grid-column:1/-1">' + T('Nessuna voce. Creane una dal tab Categorie.') + '</p>'; }
    refs.forEach(function (r) {
      h += '<button type="button" class="cat-tile' + (entry.refId === r.id ? ' on' : '') + '" data-action="pick-ref" data-ref="' + esc(r.id) + '">' +
        '<span class="ci" style="background:' + r.color + ';color:' + textOn(r.color) + '">' + esc(r.icon) + '</span><span class="cn">' + esc(nm(r)) + '</span></button>';
    });
    h += '</div>';
    if (entry.mode === 'edit') {
      h += '<div class="sheet-foot"><button type="button" class="btn danger" data-action="delete-tx">' + T('Elimina') + '</button><button type="button" class="btn primary" data-action="save-edit">' + T('Salva') + '</button></div>';
    }
    h += '</div>';
    $('#sheet-root').innerHTML = h;
    document.body.classList.add('sheet-open');
    updateAmount();
    var dateInput = $('#entry-date');
    dateInput.addEventListener('change', function () {
      if (isValidISO(dateInput.value)) { entry.date = dateInput.value; $('#date-text').textContent = dateText(entry.date); }
    });
    $('#entry-note').addEventListener('input', function (e) { entry.note = e.target.value; });
    $('.sheet').focus();
  }

  function updateAmount() {
    var el = $('#amount-display');
    if (!el) { return; }
    var str = entry.amountStr;
    el.textContent = '€ ' + (str ? formatExpr(str) : '0');
    el.classList.toggle('empty-amt', !str);
    el.classList.toggle('long', str.length > 11);
    var pv = $('#calc-preview');
    if (pv) {
      if (!/[+−×÷]/.test(str)) { pv.textContent = ''; }
      else { var r = evalExpr(str); pv.textContent = r.err ? r.err : (r.v ? '= ' + money(r.v) : ''); }
    }
  }

  function pressKey(k) {
    var str = entry.amountStr, seg = lastSeg(str), i;
    if (k === 'back') { str = str.slice(0, -1); }
    else if (isOp(k)) {
      if (!str) { return; }
      if (isOp(str.slice(-1))) { str = str.slice(0, -1) + k; }
      else { if (str.length >= 60) { return; } str += k; }
    }
    else if (k === ',') { if (seg.indexOf(',') < 0) { str += (seg === '' ? '0' : '') + ','; } }
    else {
      i = seg.indexOf(',');
      if (i >= 0) { if (seg.length - i - 1 >= 2) { return; } }
      else { if (seg.length >= 9) { return; } if (seg === '0') { str = str.slice(0, -1); } }
      str += k;
    }
    entry.amountStr = str;
    updateAmount();
  }

  function pickRef(id) {
    entry.refId = id;
    if (entry.mode === 'new') { commitEntry(); return; }
    Array.prototype.forEach.call(document.querySelectorAll('.cat-tile'), function (b) {
      b.classList.toggle('on', b.getAttribute('data-ref') === id);
    });
  }

  function commitEntry() {
    var ev = evalExpr(entry.amountStr);
    var cents = ev.v;
    if (ev.err || !cents) {
      var el = $('#amount-display');
      el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
      toast(ev.err || T('Inserisci prima un importo.'), 'warn', 2200);
      return;
    }
    if (!entry.refId) { toast(T('Scegli una categoria.'), 'warn', 2200); return; }
    var tx = { id: entry.id || uid(), type: entry.type, amount: cents, refId: entry.refId, date: entry.date, note: String(entry.note || '').trim().slice(0, 200), createdAt: entry.createdAt };
    var alertInfo = tx.type === 'expense' ? budgetAlert(tx) : null;
    if (entry.mode === 'edit') {
      db.transactions = db.transactions.map(function (t) { return t.id === tx.id ? tx : t; });
    } else {
      db.transactions.push(tx);
    }
    var wasEdit = entry.mode === 'edit';
    var saved = save();
    ui.year = +tx.date.slice(0, 4);
    ui.month = +tx.date.slice(5, 7) - 1;
    ui.selected = null;
    closeSheet();
    render();
    if (alertInfo) { toast(alertInfo.text, alertInfo.level); }
    else if (saved || memoryOnly) { toast(wasEdit ? T('Modifica salvata: {m}', { m: money(cents) }) : T(ADDED[tx.type], { m: money(cents) }), 'ok'); }
  }

  // Un foglio aperto: blocca lo sfondo, ricorda dove era il focus, aggiunge una voce di cronologia
  // cosi il tasto Indietro lo chiude invece di uscire dall app.
  var lastFocus = null, sheetPushed = false, pendingBack = false, afterPop = null;

  function pushSheetState() {
    function push() {
      try { history.pushState({ wtSheet: 1 }, ''); sheetPushed = true; } catch (e) { sheetPushed = false; }
    }
    if (pendingBack) { afterPop = push; } else { push(); }
  }

  function sheetOpened() {
    lastFocus = document.activeElement;
    $('#app').setAttribute('inert', '');
    pushSheetState();
  }

  function sheetClosed() {
    $('#app').removeAttribute('inert');
    var f = lastFocus;
    lastFocus = null;
    if (f && document.contains(f) && f.focus) { f.focus(); } else { var v = $('#view'); if (v) { v.focus(); } }
    if (sheetPushed) {
      sheetPushed = false;
      pendingBack = true;
      try { history.back(); } catch (e) { pendingBack = false; }
      setTimeout(function () {
        if (pendingBack) { pendingBack = false; if (afterPop) { var g = afterPop; afterPop = null; g(); } }
      }, 400);
    }
  }

  window.addEventListener('popstate', function () {
    if (pendingBack) {
      pendingBack = false;
      if (afterPop) { var g = afterPop; afterPop = null; g(); }
      return;
    }
    if (sheetPushed) { sheetPushed = false; closeSheet(); }
  });

  function trapTab(e) {
    var box = $('.sheet');
    if (!box) { return; }
    var f = Array.prototype.filter.call(box.querySelectorAll('button, input'), function (x) { return !x.disabled && x.offsetParent !== null; });
    if (!f.length) { e.preventDefault(); return; }
    var first = f[0], last = f[f.length - 1], cur = document.activeElement;
    if (!box.contains(cur) || cur === box) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
    else if (e.shiftKey && cur === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && cur === last) { e.preventDefault(); first.focus(); }
  }

  function closeSheet() {
    var wasOpen = !!$('#sheet-root').firstChild;
    $('#sheet-root').innerHTML = '';
    document.body.classList.remove('sheet-open');
    entry = null;
    editor = null;
    if (wasOpen) { sheetClosed(); }
  }

  function deleteTx() {
    if (!entry || !entry.id) { return; }
    if (!window.confirm(T('Eliminare questo movimento?'))) { return; }
    var id = entry.id;
    db.transactions = db.transactions.filter(function (t) { return t.id !== id; });
    save();
    closeSheet();
    render();
    toast(T('Movimento eliminato.'), 'info');
  }

  // ------------------------------------------------------- editor categorie

  function openEditor(kind, id) {
    sheetOpened();
    var ex = null;
    if (id) { ex = kind === 'saving' ? findRef(id, 'saving') : findRef(id, kind); }
    editor = {
      kind: kind, id: id || null,
      color: ex ? ex.color : COLORS[(db.categories.length + db.destinations.length) % COLORS.length],
      icon: ex ? ex.icon : EMOJIS[0]
    };
    var h = '<div class="sheet-backdrop" data-action="close-sheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="' + T('Editor') + '" tabindex="-1">' +
      '<div class="sheet-grip"></div><div class="sheet-head"><strong>' + T((ex ? 'Modifica ' : 'Nuova ') + (kind === 'saving' ? 'destinazione' : 'categoria')) + '</strong>' +
      '<button type="button" class="icon-btn" data-action="close-sheet" aria-label="' + T('Chiudi') + '">✕</button></div>' +
      '<label class="field-label" for="ed-name">' + T('Nome') + '</label><input class="field-input" id="ed-name" type="text" maxlength="30" value="' + esc(ex ? nm(ex) : '') + '" autocomplete="off">' +
      '<label class="field-label" for="ed-icon">' + T('Icona o emoji') + '</label><input class="field-input" id="ed-icon" type="text" maxlength="8" value="' + esc(editor.icon) + '" autocomplete="off">' +
      '<div class="emoji-grid">';
    EMOJIS.forEach(function (e) { h += '<button type="button" data-action="emoji-pick" data-e="' + e + '" aria-label="' + T('Icona {e}', { e: e }) + '">' + e + '</button>'; });
    h += '</div><span class="field-label">' + T('Colore') + '</span><div class="swatches">';
    COLORS.forEach(function (c) { h += '<button type="button" data-action="color-pick" data-c="' + c + '" class="' + (c === editor.color ? 'on' : '') + '" style="background:' + c + '" aria-label="' + T('Colore {c}', { c: c }) + '"></button>'; });
    h += '</div>';
    if (kind === 'expense') {
      h += '<label class="field-label" for="ed-limit">' + T('Limite di spesa mensile in euro (facoltativo)') + '</label><input class="field-input" id="ed-limit" type="text" inputmode="decimal" placeholder="' + T('Nessun limite') + '" value="' + (ex && ex.limit ? centsToStr(ex.limit).replace(',', DEC) : '') + '" autocomplete="off">';
    }
    h += '<div class="err" id="ed-err" role="alert"></div><div class="sheet-foot">' +
      (ex ? '<button type="button" class="btn danger" data-action="delete-cat">' + T('Elimina') + '</button>' : '<button type="button" class="btn" data-action="close-sheet">' + T('Annulla') + '</button>') +
      '<button type="button" class="btn primary" data-action="save-cat">' + T('Salva') + '</button></div></div>';
    $('#sheet-root').innerHTML = h;
    document.body.classList.add('sheet-open');
    $('.sheet').focus();
  }

  function saveCat() {
    var name = $('#ed-name').value.trim();
    var icon = Array.from($('#ed-icon').value.trim()).slice(0, 4).join('') || '🏷️';
    var err = $('#ed-err');
    if (!name) { err.textContent = T('Scrivi un nome.'); return; }
    var limit = null;
    if (editor.kind === 'expense') {
      limit = parseMoneyInput($('#ed-limit').value);
      if (limit !== null && isNaN(limit)) { err.textContent = T('Il limite non è un importo valido.'); return; }
    }
    if (editor.kind === 'saving') {
      var d = editor.id ? findRef(editor.id, 'saving') : null;
      if (d) { d.name = name; d.icon = icon; d.color = editor.color; }
      else { db.destinations.push({ id: uid(), name: name, icon: icon, color: editor.color }); }
    } else {
      var c = editor.id ? findRef(editor.id, editor.kind) : null;
      if (c) { c.name = name; c.icon = icon; c.color = editor.color; c.limit = limit; }
      else { db.categories.push({ id: uid(), type: editor.kind, name: name, icon: icon, color: editor.color, limit: limit }); }
    }
    save();
    closeSheet();
    render();
    toast(T('Salvato.'), 'ok');
  }

  function deleteCat() {
    if (!editor || !editor.id) { return; }
    var id = editor.id, kind = editor.kind;
    var ref = kind === 'saving' ? findRef(id, 'saving') : findRef(id, kind);
    var used = db.transactions.filter(function (t) { return t.refId === id; }).length;
    var msg = T('Eliminare “{n}”?', { n: ref ? nm(ref) : '' }) + (used ? (used === 1 ? T(' Il movimento collegato resta, ma senza categoria.') : T(' I {u} movimenti collegati restano, ma senza categoria.', { u: used })) : '');
    if (!window.confirm(msg)) { return; }
    if (kind === 'saving') { db.destinations = db.destinations.filter(function (d) { return d.id !== id; }); }
    else { db.categories = db.categories.filter(function (c) { return c.id !== id; }); }
    save();
    closeSheet();
    render();
    toast(T('Eliminata.'), 'info');
  }

  // ------------------------------------------------------------ backup / CSV

  function stamp() { return todayISO(); }

  function download(name, text, mime) {
    var blob = new Blob([text], { type: mime });
    function anchor() {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    }
    var file = null;
    try { file = new File([blob], name, { type: mime }); } catch (e) { file = null; }
    var touch = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    if (touch && file && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: name }).catch(function (e) { if (!e || e.name !== 'AbortError') { anchor(); } });
    } else {
      anchor();
    }
  }

  function exportJSON() {
    db.settings.lastBackup = todayISO();
    db.settings.backupSnooze = '';
    save();
    var payload = JSON.stringify({ app: 'SPET', exportedAt: new Date().toISOString(), version: db.version, settings: db.settings, categories: db.categories, destinations: db.destinations, transactions: db.transactions }, null, 2);
    download('spet-backup-' + stamp() + '.json', payload, 'application/json');
    render();
    toast(T('Backup pronto.'), 'ok');
  }

  function csvCell(v) {
    v = String(v == null ? '' : v);
    if (/^[=+\-@\t\r]/.test(v)) { v = "'" + v; }
    return '"' + v.replace(/"/g, '""') + '"';
  }

  function eur(c) { return (c / 100).toFixed(2).replace('.', DEC); }

  function exportCSV(scope) {
    var txs = scope === 'all' ? db.transactions.slice() : db.transactions.filter(inPeriod);
    txs.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : a.createdAt - b.createdAt; });
    var rows = [T('Data;Tipo;Categoria o destinazione;Importo EUR;Note').split(';')];
    txs.forEach(function (t) {
      var ref = findRef(t.refId, t.type) || NONE_REF;
      rows.push([fmtDate(t.date), typeLabel(t.type), nm(ref), eur(t.amount), t.note]);
    });
    if (scope !== 'all') {
      var c = compute();
      rows.push([]);
      rows.push([T('Periodo'), periodLabel()]);
      rows.push([T('Totale entrate'), '', '', eur(c.income)]);
      rows.push([T('Totale spese'), '', '', eur(c.expense)]);
      rows.push([T('Totale accantonato'), '', '', eur(c.saved)]);
      c.savItems.forEach(function (it) { rows.push([T('  di cui {n}', { n: it.name }), '', '', eur(it.amount)]); });
      rows.push([T('Risparmio totale (Entrate - Spese)'), '', '', eur(c.surplus)]);
      rows.push([T('Saldo netto (Entrate - Spese - Accantonamenti)'), '', '', eur(c.net)]);
    }
    var sep = lang === 'en' ? ',' : ';';
    var text = '﻿' + rows.map(function (r) { return r.map(csvCell).join(sep); }).join('\r\n');
    var suffix = scope === 'all' ? T('tutto') : ui.mode === 'year' ? String(ui.year) : ui.year + '-' + pad2(ui.month + 1);
    download('spet-' + suffix + '.csv', text, 'text/csv;charset=utf-8');
    toast(T('Report CSV pronto.'), 'ok');
  }

  function importJSON(file) {
    var reader = new FileReader();
    reader.onerror = function () { toast(T('Impossibile leggere il file.'), 'over'); };
    reader.onload = function () {
      var next;
      try { next = sanitizeDB(JSON.parse(String(reader.result))); }
      catch (e) { toast(T('Importazione annullata: {m}', { m: T(e && e.message ? e.message : 'file non valido') }), 'over'); return; }
      var msg = T('Sostituire i dati attuali con quelli del file? Il file contiene {m} movimenti, {c} categorie e {d} destinazioni.', { m: next.transactions.length, c: next.categories.length, d: next.destinations.length });
      if (!window.confirm(msg)) { return; }
      try { localStorage.setItem(STORAGE_KEY + ':before-import', JSON.stringify(db)); } catch (e) { /* ignora */ }
      db = next;
      save();
      var n = new Date();
      ui.year = n.getFullYear(); ui.month = n.getMonth(); ui.selected = null;
      render();
      toast(T('Dati importati.'), 'ok');
    };
    reader.readAsText(file);
  }

  function resetAll() {
    if (!window.confirm(T('Eliminare TUTTI i dati? Questa azione non si può annullare. Esporta prima un backup.'))) { return; }
    if (!window.confirm(T('Ultima conferma: cancello movimenti, categorie e destinazioni.'))) { return; }
    var theme = db.settings.theme, seen = db.settings.guideSeen, lg = db.settings.lang;
    db = defaultData();
    db.settings.theme = theme;
    db.settings.guideSeen = seen;
    db.settings.lang = lg;
    save();
    ui.selected = null;
    render();
    toast(T('Dati eliminati.'), 'info');
  }

  // ----------------------------------------------------------------- eventi

  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-action]') : null;
    if (!el) { return; }
    var a = el.getAttribute('data-action');
    var n;
    switch (a) {
      case 'tab': ui.tab = el.getAttribute('data-tab'); ui.selected = null; ui.query = ''; ui.reorder = false; render(); window.scrollTo(0, 0); break;
      case 'mode': ui.mode = el.getAttribute('data-mode'); ui.selected = null; render(); break;
      case 'nav':
        n = +el.getAttribute('data-delta');
        if (ui.mode === 'year') { ui.year += n; }
        else { ui.month += n; if (ui.month < 0) { ui.month = 11; ui.year--; } else if (ui.month > 11) { ui.month = 0; ui.year++; } }
        ui.selected = null; render(); break;
      case 'today': n = new Date(); ui.year = n.getFullYear(); ui.month = n.getMonth(); ui.selected = null; render(); break;
      case 'goto-month': ui.mode = 'month'; ui.month = +el.getAttribute('data-m'); ui.selected = null; render(); window.scrollTo(0, 0); break;
      case 'theme-toggle': db.settings.theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'; save(); render(); break;
      case 'set-lang': db.settings.lang = el.getAttribute('data-v') === 'en' ? 'en' : 'it'; save(); render(); break;
      case 'set-theme': db.settings.theme = el.getAttribute('data-v'); save(); render(); break;
      case 'sel-cat': n = el.getAttribute('data-ref'); ui.selected = ui.selected === n ? null : n; render(); break;
      case 'filter': ui.filter = el.getAttribute('data-f'); render(); break;
      case 'sort': ui.sort = el.getAttribute('data-s'); render(); break;
      case 'backup-now': exportJSON(); break;
      case 'backup-later':
        db.settings.backupSnooze = inDaysISO(7); save(); render(); $('#view').focus();
        toast(T('Te lo ricordo tra 7 giorni.'), 'info'); break;
      case 'guide-dismiss': db.settings.guideSeen = true; save(); render(); $('#view').focus(); break;
      case 'reorder-toggle': ui.reorder = !ui.reorder; render(); break;
      case 'cat-move': moveCat(el.getAttribute('data-kind'), el.getAttribute('data-id'), +el.getAttribute('data-dir')); break;
      case 'new-tx': openEntry(el.getAttribute('data-type')); break;
      case 'edit-tx':
        n = el.getAttribute('data-id');
        db.transactions.forEach(function (t) { if (t.id === n) { openEntry(t.type, t); } });
        break;
      case 'key': if (entry) { pressKey(el.getAttribute('data-key')); } break;
      case 'pick-ref': if (entry) { pickRef(el.getAttribute('data-ref')); } break;
      case 'save-edit': if (entry) { commitEntry(); } break;
      case 'delete-tx': deleteTx(); break;
      case 'close-sheet': closeSheet(); break;
      case 'add-cat': openEditor(el.getAttribute('data-kind'), null); break;
      case 'edit-cat': openEditor(el.getAttribute('data-kind'), el.getAttribute('data-id')); break;
      case 'emoji-pick': $('#ed-icon').value = el.getAttribute('data-e'); break;
      case 'color-pick':
        editor.color = el.getAttribute('data-c');
        Array.prototype.forEach.call(document.querySelectorAll('.swatches button'), function (b) { b.classList.toggle('on', b === el); });
        break;
      case 'save-cat': saveCat(); break;
      case 'delete-cat': deleteCat(); break;
      case 'export-json': exportJSON(); break;
      case 'export-csv': exportCSV(el.getAttribute('data-scope')); break;
      case 'import-json': $('#import-file').click(); break;
      case 'reset-all': resetAll(); break;
      default: break;
    }
  });

  document.addEventListener('keydown', function (e) {
    var t = e.target;
    // Tastiera sui grafici SVG, che non sono bottoni nativi.
    if ((e.key === 'Enter' || e.key === ' ') && t && t.getAttribute && t.getAttribute('role') === 'button' && t.tagName !== 'BUTTON') {
      e.preventDefault();
      t.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      return;
    }
    if (e.key === 'Escape' && document.body.classList.contains('sheet-open')) { closeSheet(); return; }
    if (e.key === 'Tab' && document.body.classList.contains('sheet-open')) { trapTab(e); return; }
    if (!entry) { return; }
    var typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA');
    if (typing) { if (e.key === 'Enter' && t.id === 'entry-note') { t.blur(); } return; }
    if (/^[0-9]$/.test(e.key)) { pressKey(e.key); }
    else if (e.key === ',' || e.key === '.') { pressKey(','); }
    else if (e.key === 'Backspace') { pressKey('back'); }
    else if (e.key === '+') { pressKey('+'); }
    else if (e.key === '-') { pressKey('−'); }
    else if (e.key === '*' || e.key === 'x' || e.key === 'X') { pressKey('×'); }
    else if (e.key === '/') { e.preventDefault(); pressKey('÷'); }
    else if (e.key === 'Enter' && entry.mode === 'edit') { commitEntry(); }
  });

  document.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'tx-search') {
      ui.query = e.target.value;
      var box = $('#list-results');
      if (box) { box.innerHTML = renderListResults(); }
      applyChrome();
    }
  });

  $('#import-file').addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0];
    if (f) { importJSON(f); }
    e.target.value = '';
  });

  window.addEventListener('storage', function (e) { if (e.key === STORAGE_KEY || e.key === null) { syncFromStorage(); } });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') { syncFromStorage(); } });
  window.addEventListener('pageshow', syncFromStorage);

  if (window.matchMedia) {
    var mq = matchMedia('(prefers-color-scheme: dark)');
    var onScheme = function () { if (db.settings.theme === 'auto') { applyTheme(); } };
    if (mq.addEventListener) { mq.addEventListener('change', onScheme); } else if (mq.addListener) { mq.addListener(onScheme); }
  }

  // ------------------------------------------------------------------- avvio

  render();
  if (pendingNotice) { toast(pendingNotice[0], pendingNotice[1]); }

  if (!memoryOnly && navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch(function () { /* ignora */ });
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      var hadController = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.register('sw.js').catch(function () { /* senza https o file:// non parte */ });
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (hadController) { toast(T('Nuova versione installata. Riapri l’app per usarla.'), 'info', 5000); }
      });
    });
  }
})();
