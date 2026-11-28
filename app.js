/* SPET 1.6.0 - Simple Personal Expense Tracker
 * App a pagina singola. Nessuna dipendenza, nessun server.
 * Dati in localStorage, importi in centesimi interi, date come YYYY-MM-DD locali. */
(function () {
  'use strict';

  // ---------------------------------------------------------------- costanti

  var APP_VERSION = '1.6.0';
  var STORAGE_KEY = 'spet:data';
  var LEGACY_KEY = 'wealthtrack:data'; // nome della prima versione: serve solo a migrare i dati
  var DB_VERSION = 4;
  // Destinazioni predefinite: non pagano spese finche l utente non lo sceglie.
  var LOCKED_SYS = ['deposit', 'pension', 'etf'];
  var MONTHS_SHORT = { it: ['G', 'F', 'M', 'A', 'M', 'G', 'L', 'A', 'S', 'O', 'N', 'D'], en: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'] };
  var TYPE_LABEL = { expense: 'Spesa', income: 'Entrata', saving: 'Trasferimento' };
  var NONE_REF = { id: '__none', name: 'Eliminata', icon: '❔', color: '#AFC0D6' };
  // Palette di base: toni morbidi, senza viola come base. Nel disegno ogni tinta passa da tc() (vedi sotto).
  var COLORS = ['#F59E9E', '#F7B27E', '#F4D675', '#CBE08A', '#9ED8A0', '#7FD6B8', '#6FD0D4', '#7CC6F2', '#7FA8F0', '#9CB6F7', '#B6A9F0', '#EBA3D3', '#F2A0B8', '#AFC0D6', '#D98080', '#E0966A', '#CDB052', '#A9BD66', '#7FBB86', '#60B89B', '#55B3BE', '#5FA9D9', '#5F8FD9', '#5A84CE', '#8F82D6', '#CB86B8', '#D8869C', '#8798B0'];
  // Libreria emoji a gruppi. L'ordine dei gruppi cambia con il tipo di voce che si sta modificando.
  var EMOJI_GROUPS = [
    { id: 'home', it: 'Casa e utenze', en: 'Home & utilities', list: ['🏡', '🏠', '🛋️', '🛏️', '🪴', '🔑', '🧹', '🧺', '🚿', '🛁', '💡', '🔌', '🔥', '💧', '🌡️', '📶', '🗑️', '🔧', '🧰', '🪟', '🔒'] },
    { id: 'food', it: 'Cibo e ristoranti', en: 'Food & dining', list: ['🛒', '🥑', '🥦', '🍎', '🥖', '🧀', '🥩', '🍝', '🍕', '🍔', '🍣', '🥗', '🍽️', '☕', '🧋', '🍺', '🍷', '🍰', '🍦', '🥐', '🍿'] },
    { id: 'transport', it: 'Trasporti e auto', en: 'Transport & car', list: ['🚗', '⛽', '🔋', '🚌', '🚆', '🚇', '🚕', '🚲', '🛵', '🏍️', '🅿️', '🛣️', '🚧', '🚦', '✈️', '⛴️'] },
    { id: 'health', it: 'Salute e benessere', en: 'Health & wellness', list: ['💊', '🩺', '🏥', '🦷', '👓', '🧘', '🏋️', '🏃', '💆', '💇', '💅', '🧴', '🩹', '🧠'] },
    { id: 'shopping', it: 'Shopping e stile di vita', en: 'Shopping & lifestyle', list: ['👕', '👗', '👟', '👜', '💄', '💍', '🎁', '📦', '🛍️', '🕶️', '⌚', '🧸', '🐶', '🐱', '🐾', '🍼', '👶', '🌷', '🧵', '✂️'] },
    { id: 'leisure', it: 'Svago e viaggi', en: 'Leisure & travel', list: ['🎬', '🎮', '🎵', '🎟️', '🎭', '🎨', '📚', '🎉', '🎂', '🏖️', '🏕️', '🧳', '🗺️', '⛷️', '⚽', '🎣', '🎻', '🎤', '🏨', '🎢'] },
    { id: 'work', it: 'Lavoro, studio e servizi', en: 'Work, study & services', list: ['💼', '🖥️', '💻', '📱', '🎓', '📖', '✏️', '🧾', '📄', '📮', '🖨️', '📺'] },
    { id: 'finance', it: 'Finanza e risparmio', en: 'Finance & savings', list: ['💶', '💰', '🏦', '🪙', '💳', '📈', '📊', '🧓', '🏆', '🎯', '🛡️', '⚖️', '🧮', '🏧', '💸', '🤝', '🌱', '📑', '🔐', '⭐'] }
  ];
  var GROUP_FIRST = { expense: [], income: ['finance', 'work'], saving: ['finance'], account: ['finance'], pocket: ['finance'] };
  function groupsFor(kind) {
    var first = GROUP_FIRST[kind] || [];
    var head = [], tail = [];
    EMOJI_GROUPS.forEach(function (g) { (first.indexOf(g.id) >= 0 ? head : tail).push(g); });
    head.sort(function (a, b) { return first.indexOf(a.id) - first.indexOf(b.id); });
    return head.concat(tail);
  }
  var EMOJIS = [].concat.apply([], EMOJI_GROUPS.map(function (g) { return g.list; }));

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
    'Data;Tipo;Categoria o destinazione;Importo EUR;Note;Conto o fondo': 'Date;Type;Category or destination;Amount EUR;Notes;Account or fund',
    'Totale entrate': 'Total income', 'Totale spese': 'Total expenses', 'Totale accantonato': 'Total allocated',
    '  di cui {n}': '  of which {n}', 'Risparmio totale (Entrate - Spese)': 'Total savings (Income - Expenses)',
    'Saldo netto (Entrate - Spese - Accantonamenti)': 'Net balance (Income - Expenses - Allocations)',
    'Impossibile leggere il file.': 'Unable to read the file.', 'Importazione annullata: {m}': 'Import cancelled: {m}', 'file non valido': 'invalid file',
    'Sostituire i dati attuali con quelli del file? Il file contiene {m} movimenti, {c} categorie e {d} destinazioni.': 'Replace the current data with the file’s data? The file contains {m} transactions, {c} categories and {d} destinations.',
    'Dati importati.': 'Data imported.',
    'Eliminare TUTTI i dati? Questa azione non si può annullare. Esporta prima un backup.': 'Delete ALL data? This cannot be undone. Export a backup first.',
    'Ultima conferma: cancello movimenti, categorie e destinazioni.': 'Final confirmation: I will erase transactions, categories and destinations.',
    'Dati eliminati.': 'Data deleted.', 'Te lo ricordo tra 7 giorni.': 'I will remind you in 7 days.',
    'Nuova versione installata. Riapri l’app per usarla.': 'New version installed. Reopen the app to use it.',
    // conti, fondi, fonte di pagamento, sintesi patrimonio
    'Sintesi': 'Overview', 'Sintesi Patrimonio': 'Wealth overview', 'Patrimonio totale': 'Total wealth',
    'Conto più fondi. I trasferimenti non lo cambiano.': 'Account plus funds. Transfers do not change it.',
    'Nei fondi e risparmi': 'In funds and savings', 'Conto': 'Account', 'Fondi e risparmi': 'Funds and savings',
    'Conto corrente': 'Checking account', 'Modifica conto': 'Edit account', 'In negativo': 'Overdrawn',
    'Entrate {a} · Uscite {b}': 'Income {a} · Outflows {b}', 'Versato {a} · Prelevato {b}': 'Paid in {a} · Withdrawn {b}',
    'Saldo iniziale in euro (facoltativo)': 'Opening balance in euro (optional)', 'Il saldo iniziale non è valido.': 'The opening balance is not valid.',
    'Usabile per pagare spese': 'Can pay expenses', 'per spese': 'for expenses',
    'Pagato da': 'Paid from', 'Da': 'From', 'Fonte del pagamento': 'Payment source', 'Fonte': 'Source',
    'La fonte e la destinazione coincidono.': 'Source and destination are the same.', 'da {n}': 'from {n}',
    'Spese pagate dai fondi': 'Expenses paid from funds',
    'Non incidono su Spese e Saldo netto del periodo.': 'They do not affect Expenses and Net balance for the period.',
    '⚠️ {name}: saldo in negativo ({b}).': '⚠️ {name}: balance below zero ({b}).',
    'Colore personalizzato': 'Custom color', 'Totale spese pagate da fondi': 'Total expenses paid from funds',
    'Il saldo di “{n}” ({b}) non verrà più conteggiato nel patrimonio.': 'The balance of “{n}” ({b}) will no longer count towards your wealth.',
    // v1.4: piu conti, trasferimenti ovunque, destinazione delle entrate, data del saldo iniziale
    'Trasferimento': 'Transfer', 'Trasferimenti': 'Transfers', 'Modifica trasferimento': 'Edit transfer',
    'Nuovo trasferimento': 'New transfer', 'Trasferimento aggiunto: {m}': 'Transfer added: {m}',
    'Conti': 'Accounts', 'Nuovo conto': 'New account', '+ Aggiungi conto': '+ Add account',
    'Versato su': 'Paid into', 'su {n}': 'to {n}',
    'Data del saldo iniziale (facoltativa)': 'Opening balance date (optional)',
    'Le entrate e le uscite fino a questa data (inclusa) sono già nel saldo e non vengono contate.': 'Income and outflows up to this date (included) are already in the balance and are not counted.',
    'La data non è valida.': 'The date is not valid.',
    ' Il movimento collegato non incide più sui saldi.': ' The linked transaction no longer affects balances.',
    ' I {u} movimenti collegati non incidono più sui saldi.': ' The {u} linked transactions no longer affect balances.',
    'Nessun altro conto o fondo. Aggiungine uno dal tab Sintesi.': 'No other account or fund. Add one from the Overview tab.',
    // v1.6: salvadanai dentro i conti
    'Nuovo salvadanaio': 'New piggy bank', 'Modifica salvadanaio': 'Edit piggy bank', '+ Aggiungi salvadanaio': '+ Add piggy bank',
    'Salvadanaio': 'Piggy bank', 'Disponibile {a} · Salvadanai {b}': 'Available {a} · Piggy banks {b}',
    'Nei salvadanai': 'In piggy banks',
    'Parte del saldo del conto messa da parte. Resta liquidità e fa parte del conto, ma non è nel disponibile. Non va sotto zero: se non basta, il resto esce dal conto. Vale la data del saldo iniziale del conto.': 'Part of the account balance set aside. It stays liquid cash inside the account but is not in the available amount. It never goes below zero: if it is not enough, the rest comes out of the account. The account opening date applies.',
    '⚠️ Salvadanaio “{n}” non sufficiente a coprire la spesa: {m} presi dal conto.': '⚠️ Piggy bank “{n}” not enough to cover the payment: {m} taken from the account.',
    'Movimenti della categoria': 'Category transactions',
    '⚠️ Credito del salvadanaio insufficiente: {m} presi dal conto.': '⚠️ Not enough credit in the piggy bank: {m} taken from the account.',
    'Il saldo del salvadanaio non può essere negativo.': 'The piggy bank balance cannot be negative.',
    'Saldo iniziale del salvadanaio in euro (facoltativo)': 'Piggy bank opening balance in euro (optional)',
    ' Il saldo del salvadanaio ({b}) torna nel conto e i movimenti passano al conto.': ' The piggy bank balance ({b}) goes back to the account and its transactions move to the account.',
    ' Verranno eliminati anche i suoi {n} salvadanai.': ' Its {n} piggy banks will be deleted too.'
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
    etf: { k: 'saving', it: 'ETF/Investimenti', en: 'ETF/Investments' },
    main: { k: 'account', it: 'Conto corrente', en: 'Checking account' }
  };
  var ADDED = { expense: 'Spesa aggiunta: {m}', income: 'Entrata aggiunta: {m}', saving: 'Trasferimento aggiunto: {m}' };
  var EDIT_TITLE = { expense: 'Modifica spesa', income: 'Modifica entrata', saving: 'Modifica trasferimento' };
  var NEW_TITLE = { expense: 'Nuova spesa', income: 'Nuova entrata', saving: 'Nuovo trasferimento' };

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
  // Tinte per tema (solo disegno: i dati salvati non cambiano). Scuro: vive ma non sature. Chiaro: piu profonde, 3:1 sul bianco.
  var TC = {"light": {"#f59e9e": "#EF6767", "#f7b27e": "#EC6E0F", "#f4d675": "#B78F0F", "#cbe08a": "#819D2A", "#9ed8a0": "#42A546", "#7fd6b8": "#35A67F", "#6fd0d4": "#32A2A6", "#7cc6f2": "#1B9CE8", "#7fa8f0": "#5F92EC", "#9cb6f7": "#6890F3", "#b6a9f0": "#9986EA", "#eba3d3": "#DE68B7", "#f2a0b8": "#EB6A90", "#afc0d6": "#7996BA", "#d98080": "#D77878", "#e0966a": "#D87B44", "#cdb052": "#AF9233", "#a9bd66": "#889D44", "#7fbb86": "#58A561", "#60b89b": "#48A284", "#55b3be": "#419EA9", "#5fa9d9": "#469CD3", "#5f8fd9": "#5F8FD9", "#5a84ce": "#5A84CE", "#8f82d6": "#8F82D6", "#cb86b8": "#C67BB2", "#d8869c": "#D3778F", "#8798b0": "#8495AE"}, "dark": {"#f59e9e": "#F47A86", "#f7b27e": "#F29C5A", "#f4d675": "#F1CA4D", "#cbe08a": "#B1D856", "#9ed8a0": "#57CE7F", "#7fd6b8": "#3CC9A0", "#6fd0d4": "#30C3CB", "#7cc6f2": "#4CB2F0", "#7fa8f0": "#679EF3", "#9cb6f7": "#85A7F5", "#b6a9f0": "#AA96F6", "#eba3d3": "#EE88CD", "#f2a0b8": "#F584AB", "#afc0d6": "#93A6C0", "#d98080": "#E46173", "#e0966a": "#E78544", "#cdb052": "#D5AE11", "#a9bd66": "#94C03A", "#7fbb86": "#3FB76D", "#60b89b": "#2AAD8A", "#55b3be": "#22ADBA", "#5fa9d9": "#399DE1", "#5f8fd9": "#4D86E7", "#5a84ce": "#568BE4", "#8f82d6": "#9176EB", "#cb86b8": "#D669B7", "#d8869c": "#E56B93", "#8798b0": "#768AA8"}};
  var TC_LEGACY = {"#ef4444": "#f59e9e", "#f97316": "#f7b27e", "#f59e0b": "#f4d675", "#eab308": "#f4d675", "#84cc16": "#cbe08a", "#22c55e": "#9ed8a0", "#14b8a6": "#6fd0d4", "#06b6d4": "#7cc6f2", "#3b82f6": "#7fa8f0", "#6366f1": "#9cb6f7", "#8b5cf6": "#9cb6f7", "#d946ef": "#b6a9f0", "#ec4899": "#f2a0b8", "#64748b": "#afc0d6", "#b91c1c": "#d98080", "#c2410c": "#e0966a", "#b45309": "#cdb052", "#a16207": "#a9bd66", "#4d7c0f": "#7fbb86", "#15803d": "#60b89b", "#0f766e": "#55b3be", "#0e7490": "#5fa9d9", "#1d4ed8": "#5f8fd9", "#4338ca": "#9cb6f7", "#6d28d9": "#8f82d6", "#a21caf": "#cb86b8", "#be185d": "#d8869c", "#475569": "#8798b0", "#94a3b8": "#afc0d6", "#16a34a": "#7fd6b8"};
  function tc(c) {
    var k = String(c).toLowerCase(), t = TC[document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'];
    return t[k] || t[TC_LEGACY[k]] || c;
  }
  function textOn(hex) {
    function lin(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
    var L = 0.2126 * lin(parseInt(hex.slice(1, 3), 16)) + 0.7152 * lin(parseInt(hex.slice(3, 5), 16)) + 0.0722 * lin(parseInt(hex.slice(5, 7), 16));
    var ink = 0.0101; // luminanza di #0C1A2E
    return (L + 0.05) / (ink + 0.05) >= 1.05 / (L + 0.05) ? '#0C1A2E' : '#ffffff';
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

  // Saldo iniziale: vuoto vale 0 e il segno meno e ammesso. Ritorna NaN se non valido.
  function parseOpening(s) {
    s = String(s || '').replace(/\s|€/g, '');
    if (!s) { return 0; }
    var neg = /^[-−]/.test(s);
    if (neg) { s = s.slice(1); }
    if (/^0+([.,]0{1,2})?$/.test(s)) { return 0; }
    var v = parseMoneyInput(s);
    return v === null || isNaN(v) ? NaN : (neg ? -v : v);
  }

  // Importo con segno in centesimi come testo per un campo ("-12,5").
  function signedStr(c) { return (c < 0 ? '-' : '') + centsToStr(Math.abs(c)).replace(',', DEC); }

  function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    var a = s * Math.min(l, 1 - l);
    function f(n) {
      var k = (n + h / 30) % 12;
      var c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
      return ('0' + Math.round(255 * c).toString(16)).slice(-2);
    }
    return '#' + f(0) + f(8) + f(4);
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

  // Il primo conto corrente: e il conto predefinito di ogni movimento.
  function makeAccount() {
    return { id: uid(), sys: 'main', name: SYS.main.it, icon: '💳', color: '#9CB6F7', opening: 0, openingDate: '' };
  }

  function defaultData() {
    return {
      version: DB_VERSION,
      settings: { theme: 'auto', lang: 'it', lastBackup: '', backupSnooze: '', guideSeen: false, lastWallet: { expense: '', income: '', saving: '' } },
      accounts: [makeAccount()],
      categories: [
        makeCat('expense', 'home', '🏡', '#9CB6F7'),
        makeCat('expense', 'groceries', '🥑', '#9ED8A0'),
        makeCat('expense', 'transport', '🚌', '#7CC6F2'),
        makeCat('expense', 'dining', '🍝', '#F7B27E'),
        makeCat('expense', 'health', '🩺', '#F59E9E'),
        makeCat('expense', 'leisure', '🎬', '#B6A9F0'),
        makeCat('expense', 'shopping', '🛍️', '#F2A0B8'),
        makeCat('expense', 'bills', '💡', '#F4D675'),
        makeCat('income', 'salary', '💼', '#7FD6B8'),
        makeCat('income', 'refunds', '🧾', '#6FD0D4'),
        makeCat('income', 'extra', '🎁', '#CBE08A')
      ],
      destinations: [
        { id: uid(), sys: 'deposit', name: SYS.deposit.it, icon: '🏦', color: '#7FA8F0', opening: 0, spendable: false },
        { id: uid(), sys: 'pension', name: SYS.pension.it, icon: '🌳', color: '#5F8FD9', opening: 0, spendable: false },
        { id: uid(), sys: 'etf', name: SYS.etf.it, icon: '📈', color: '#55B3BE', opening: 0, spendable: false }
      ],
      pockets: [],
      transactions: []
    };
  }

  // Valida e ripulisce un oggetto dati. Lancia un errore se il formato non e usabile.
  function sanitizeDB(raw) {
    if (!raw || typeof raw !== 'object') { throw new Error('Il file non contiene dati validi.'); }
    var v = Number(raw.version);
    if (!isFinite(v) || v < 1) { throw new Error('Versione dati mancante.'); }
    if (v > DB_VERSION) { throw new Error('Il file viene da una versione più recente di SPET.'); }
    // v1 -> v2: saldi iniziali e fonte dei movimenti prendono i valori predefiniti qui sotto.
    // v2 -> v3: il conto unico raw.account diventa il primo di raw.accounts. I movimenti senza
    // fonte passano da quel conto, e le entrate vi arrivano.
    // v3 -> v4: nascono i salvadanai (raw.pockets), vuoti nei dati vecchi.
    // Migrazioni future: if (v < 5) { ... }

    var refSeen = {}, txSeen = {};
    function refId(id) {
      id = typeof id === 'string' && id ? id.slice(0, 40) : uid();
      while (refSeen[id] || id === NONE_REF.id) { id = uid(); }
      refSeen[id] = 1;
      return id;
    }
    function color(c) { return /^#[0-9a-fA-F]{6}$/.test(c) ? String(c).toLowerCase() : '#64748b'; }
    function icon(i) { return Array.from(String(i || '')).slice(0, 4).join('') || '🏷️'; }
    function name(n) { return String(n || '').trim().slice(0, 30) || 'Senza nome'; }
    function cents(x) { var n = Math.round(Number(x)); return isFinite(n) && Math.abs(n) < 1e11 ? n : 0; }
    function wid(x) { return typeof x === 'string' ? x.slice(0, 40) : ''; }
    function odate(x) { return isValidISO(x) ? x : ''; }

    var rawAcc = asArray(raw.accounts).filter(function (a) { return a && typeof a === 'object'; });
    if (!rawAcc.length && raw.account && typeof raw.account === 'object') { rawAcc = [raw.account]; }
    var hasMain = false;
    var accounts = rawAcc.slice(0, 30).map(function (a) {
      var o = { id: refId(a.id) };
      if (a.sys === 'main' && !hasMain) { o.sys = 'main'; hasMain = true; }
      o.name = name(a.name || (o.sys ? SYS.main.it : ''));
      o.icon = icon(a.icon || '💳'); o.color = color(a.color || '#9CB6F7');
      o.opening = cents(a.opening); o.openingDate = odate(a.openingDate);
      return o;
    });
    if (!accounts.length) { accounts.push({ id: refId(), sys: 'main', name: SYS.main.it, icon: '💳', color: '#9CB6F7', opening: 0, openingDate: '' }); }
    var defAcc = accounts[0].id;

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
      o.opening = cents(d.opening); o.openingDate = odate(d.openingDate);
      o.spendable = typeof d.spendable === 'boolean' ? d.spendable : LOCKED_SYS.indexOf(sy) < 0;
      return o;
    });

    var pockets = asArray(raw.pockets).filter(function (p) { return p && typeof p === 'object'; }).slice(0, 100).map(function (p) {
      return {
        id: refId(p.id),
        accountId: accounts.some(function (a) { return a.id === p.accountId; }) ? p.accountId : defAcc,
        name: name(p.name), icon: icon(p.icon || '🐷'), color: color(p.color || '#9CB6F7'), opening: Math.max(0, cents(p.opening))
      };
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
        src: t.type !== 'income' ? (wid(t.src) || defAcc) : '',
        dst: t.type === 'income' ? (wid(t.dst) || defAcc) : '',
        note: String(t.note || '').slice(0, 200), createdAt: Number(t.createdAt) || Date.now()
      };
    });

    var st = raw.settings && typeof raw.settings === 'object' ? raw.settings : {};
    var lw = st.lastWallet && typeof st.lastWallet === 'object' ? st.lastWallet : {};
    return {
      version: DB_VERSION,
      settings: {
        theme: st.theme === 'light' || st.theme === 'dark' ? st.theme : 'auto',
        lang: st.lang === 'en' ? 'en' : 'it',
        lastBackup: isValidISO(st.lastBackup) ? st.lastBackup : '',
        backupSnooze: isValidISO(st.backupSnooze) ? st.backupSnooze : '',
        guideSeen: st.guideSeen === true,
        lastWallet: { expense: wid(lw.expense), income: wid(lw.income), saving: wid(lw.saving) }
      },
      accounts: accounts, pockets: pockets, categories: categories, destinations: destinations, transactions: transactions
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
    var list = type === 'saving' ? db.destinations.concat(db.accounts, db.pockets) : db.categories;
    for (var i = 0; i < list.length; i++) { if (list[i].id === id) { return list[i]; } }
    return null;
  }

  // Un portafoglio e un conto corrente oppure un fondo. Gli id sono unici tra i due gruppi.
  function findAccount(id) {
    for (var i = 0; i < db.accounts.length; i++) { if (db.accounts[i].id === id) { return db.accounts[i]; } }
    return null;
  }
  function findFund(id) {
    for (var i = 0; i < db.destinations.length; i++) { if (db.destinations[i].id === id) { return db.destinations[i]; } }
    return null;
  }
  function findPocket(id) {
    for (var i = 0; i < db.pockets.length; i++) { if (db.pockets[i].id === id) { return db.pockets[i]; } }
    return null;
  }
  function pocketsOf(accId) { return db.pockets.filter(function (p) { return p.accountId === accId; }); }
  // Conti con i loro salvadanai subito dopo, poi i fondi.
  function walletsAll() {
    var out = [];
    db.accounts.forEach(function (a) { out.push(a); pocketsOf(a.id).forEach(function (p) { out.push(p); }); });
    return out.concat(db.destinations);
  }
  function walletName(id) {
    var w = findAccount(id) || findPocket(id) || findFund(id);
    return w ? nm(w) : T('Eliminata');
  }

  // Da dove parte un movimento e dove arriva. Un valore vuoto e il primo conto (dati vecchi).
  function srcOf(t) { return t.type === 'income' ? '' : (t.src || db.accounts[0].id); }
  function dstOf(t) { return t.type === 'income' ? (t.dst || db.accounts[0].id) : t.type === 'saving' ? t.refId : ''; }
  function fromFund(t) { return !!findFund(srcOf(t)); }

  // Testo con il conto o il fondo coinvolto. Compare solo quando serve: piu conti oppure un fondo.
  function srcLabel(t) {
    var id = t.type === 'income' ? dstOf(t) : srcOf(t);
    if (db.accounts.length < 2 && !findFund(id) && !findPocket(id)) { return ''; }
    return T(t.type === 'income' ? 'su {n}' : 'da {n}', { n: walletName(id) });
  }

  // Conto o fondo per la colonna del CSV: dove e entrato il denaro per le entrate, da dove e uscito per il resto.
  function srcName(t) { return walletName(t.type === 'income' ? dstOf(t) : srcOf(t)); }

  // Come un movimento entra nei totali di un periodo. Ogni voce ha k = income, expense, fund o saved.
  // Entrate: ogni incasso, su un conto o su un fondo. Spese: pagate da un conto, contano nei limiti.
  // Spese da fondo: a parte. Accantonato: denaro che entra in un fondo da un conto o da un incasso.
  // Spostamenti tra conti, da un fondo o tra fondi sono interni e restano fuori dai totali.
  function flowParts(t) {
    var parts, ref, df;
    if (t.type === 'income') {
      parts = [{ k: 'income' }];
      df = findFund(dstOf(t));
      if (df) { parts.push({ k: 'saved', key: df.id }); }
      return parts;
    }
    if (t.type === 'expense') {
      df = findFund(srcOf(t));
      if (df) { return [{ k: 'fund', key: df.id }]; }
      ref = findRef(t.refId, 'expense');
      return [{ k: 'expense', key: ref ? ref.id : NONE_REF.id }];
    }
    if (findFund(srcOf(t))) { return []; }
    df = findFund(t.refId);
    if (df) { return [{ k: 'saved', key: df.id }]; }
    return findAccount(t.refId) || findPocket(t.refId) ? [] : [{ k: 'saved', key: NONE_REF.id }];
  }

  // Saldi di conti e fondi. I saldi possono andare sotto zero. Un conto o un fondo eliminato non conta piu.
  // Il saldo iniziale vale alla sua data: i movimenti fino a quel giorno (incluso) ci sono gia dentro.
  // Un salvadanaio non va sotto zero: se non basta, va a zero e il resto esce dalla parte libera del conto.
  // I movimenti si rileggono in ordine di data, cosi il risultato non dipende da quando li hai inseriti.
  // sf (facoltativo) raccoglie, per ogni movimento, quanto e stato preso dal conto perche il salvadanaio non bastava.
  function balances(sf) {
    var b = {};
    function slot(w) { b[w.id] = { opening: w.opening, date: w.openingDate || '', inn: 0, out: 0, balance: w.opening }; }
    function move(id, t, dir) {
      var s = b[id];
      if (!s || (s.date && t.date <= s.date)) { return; }
      if (dir > 0) { s.inn += t.amount; } else { s.out += t.amount; }
      s.balance += dir * t.amount;
    }
    db.accounts.forEach(slot);
    db.destinations.forEach(slot);
    // Un salvadanaio e una parte del conto: stessa data del saldo iniziale.
    db.pockets.forEach(function (p) {
      var a = findAccount(p.accountId);
      b[p.id] = { opening: p.opening, date: a ? a.openingDate || '' : '', inn: 0, out: 0, balance: p.opening };
    });
    var order = db.transactions.map(function (t, i) { return { t: t, i: i }; }).sort(function (x, y) {
      if (x.t.date !== y.t.date) { return x.t.date < y.t.date ? -1 : 1; }
      return (x.t.createdAt - y.t.createdAt) || (x.i - y.i);
    });
    order.forEach(function (o) {
      var t = o.t, from, pk, s0, take, rest, acc;
      if (t.type === 'income') { move(dstOf(t), t, 1); return; }
      from = srcOf(t); pk = findPocket(from);
      if (pk) {
        s0 = b[from];
        if (s0 && !(s0.date && t.date <= s0.date)) {
          take = Math.min(t.amount, Math.max(s0.balance, 0));
          rest = t.amount - take;
          s0.out += take; s0.balance -= take;
          acc = b[pk.accountId];
          if (rest > 0) {
            if (sf) { sf[t.id] = rest; }
            if (acc) { acc.out += rest; acc.balance -= rest; }
          }
        }
      } else { move(from, t, -1); }
      if (t.type === 'saving' && t.refId) { move(t.refId, t, 1); }
    });
    return b;
  }

  // Conto con salvadanai. Il saldo del conto da solo e la parte libera.
  // Totale = libero + salvadanai. Disponibile = libero + i salvadanai in rosso, che il conto copre.
  function totalOf(accId, b) {
    var v = b[accId].balance;
    pocketsOf(accId).forEach(function (p) { v += b[p.id].balance; });
    return v;
  }
  function availOf(accId, b) {
    var v = b[accId].balance;
    pocketsOf(accId).forEach(function (p) { if (b[p.id].balance < 0) { v += b[p.id].balance; } });
    return v;
  }
  // Livello da confrontare con lo zero: il disponibile per un conto, il saldo per il resto.
  function levelOf(id, b) {
    if (!b[id]) { return 0; }
    return findAccount(id) ? availOf(id, b) : b[id].balance;
  }

  // Colore nuovo: il primo della palette non usato, poi tinte generate senza fine.
  function nextColor() {
    var used = {};
    db.categories.concat(db.destinations, db.accounts, db.pockets).forEach(function (x) { used[String(x.color).toLowerCase()] = 1; });
    for (var i = 0; i < COLORS.length; i++) { if (!used[COLORS[i]]) { return COLORS[i]; } }
    return hslToHex(Math.round(((db.categories.length + db.destinations.length + db.accounts.length + db.pockets.length) * 137.508) % 360), 62, 46);
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
    var income = 0, expense = 0, saved = 0, exp = {}, sav = {}, fund = {}, fundTotal = 0;
    db.transactions.filter(inPeriod).forEach(function (t) {
      flowParts(t).forEach(function (p) {
        if (p.k === 'income') { income += t.amount; }
        else if (p.k === 'expense') { expense += t.amount; exp[p.key] = (exp[p.key] || 0) + t.amount; }
        else if (p.k === 'saved') { saved += t.amount; sav[p.key] = (sav[p.key] || 0) + t.amount; }
        else { fund[p.key] = (fund[p.key] || 0) + t.amount; fundTotal += t.amount; }
      });
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

    var fundItems = [];
    db.destinations.forEach(function (d) {
      if (fund[d.id]) { fundItems.push({ id: d.id, name: nm(d), icon: d.icon, color: d.color, amount: fund[d.id] }); }
    });
    fundItems.sort(function (a, b) { return b.amount - a.amount; });

    return {
      income: income, expense: expense, saved: saved,
      surplus: income - expense, net: income - expense - saved,
      expItems: expItems, savItems: savItems, fundItems: fundItems, fundTotal: fundTotal
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
      if (t.type === 'expense' && !fromFund(t) && t.refId === tx.refId && t.date.slice(0, 7) === ym && t.id !== tx.id) { before += t.amount; }
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

  // Movimenti del periodo che compongono una categoria di spesa (stessi criteri dei totali).
  function catTxList(id) {
    var txs = sortedTx(db.transactions.filter(function (t) {
      if (!inPeriod(t)) { return false; }
      return flowParts(t).some(function (p) { return p.k === 'expense' && p.key === id; });
    }));
    if (!txs.length) { return ''; }
    return '<div class="tx-group cat-tx" role="region" aria-label="' + esc(T('Movimenti della categoria')) + '">' +
      txs.map(function (t) { return txRow(t, true); }).join('') + '</div>';
  }

  function catRow(it, total, showLimit) {
    var pct = total ? Math.round(it.amount * 100 / total) : 0;
    var s = '<button type="button" class="cat-row' + (ui.selected === it.id ? ' selected' : '') + '" data-action="sel-cat" data-ref="' + esc(it.id) + '" aria-expanded="' + (ui.selected === it.id) + '">' +
      '<span class="row-top"><span class="chip" style=\"background:' + tc(it.color) + ';color:' + textOn(tc(it.color)) + '">' + esc(it.icon) + '</span>' +
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
      circles += '<circle class="seg" data-action="sel-cat" data-ref="' + esc(it.id) + '" role="button" tabindex="0" aria-label="' + esc(it.name) + ' ' + pct + '%" cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="' + tc(it.color) +
        '" stroke-width="' + (sel ? 46 : 36) + '" stroke-dasharray="' + seg.toFixed(2) + ' ' + (C - seg).toFixed(2) + '" stroke-dashoffset="' + (-offset).toFixed(2) + '" transform="rotate(-90 130 130)"/>';
      if (it.amount / total >= 0.07) {
        var ang = (offset + len / 2) / C * 2 * Math.PI - Math.PI / 2;
        var x = cx + R * Math.cos(ang), y = cy + R * Math.sin(ang), fg = textOn(tc(it.color));
        var dk = document.documentElement.getAttribute('data-theme') === 'dark', pw = String(pct).length * 6.2 + 12;
        labels += '<text x="' + x.toFixed(1) + '" y="' + (y - 8).toFixed(1) + '" text-anchor="middle" dominant-baseline="central" font-size="15" fill="' + fg + '">' + esc(it.icon) + '</text>' +
          (dk ? '<rect x="' + (x - pw / 2).toFixed(1) + '" y="' + (y + 5).toFixed(1) + '" width="' + pw.toFixed(1) + '" height="13" rx="6.5" fill="#06142E" fill-opacity=".62"/>' : '') +
          '<text x="' + x.toFixed(1) + '" y="' + (y + 11.5).toFixed(1) + '" text-anchor="middle" dominant-baseline="central" font-size="9.5" fill="' + (dk ? '#FFFFFF' : fg) + '">' + pct + '%</text>';
      }
      offset += len;
    });
    return '<svg class="donut" viewBox="0 0 260 260" role="group" aria-label="' + T('Distribuzione delle spese') + '">' + circles + labels + '</svg>';
  }

  function yearChart() {
    var data = [], i;
    for (i = 0; i < 12; i++) { data.push({ income: 0, expense: 0, saving: 0 }); }
    db.transactions.forEach(function (t) {
      if (t.date.slice(0, 4) === String(ui.year)) {
        var m = data[+t.date.slice(5, 7) - 1];
        flowParts(t).forEach(function (p) {
          if (p.k === 'income') { m.income += t.amount; } else if (p.k === 'expense') { m.expense += t.amount; } else if (p.k === 'saved') { m.saving += t.amount; }
        });
      }
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
      '<div class="hero-main"><span class="lbl">' + T('Saldo netto') + '</span><strong class="big' + (c.net < 0 ? ' neg' : '') + '">' + money(c.net) + '</strong><span class="hint">' + T('Entrate − Spese − Accantonamenti') + '</span>' +
      '<div class="hero-pill"><span>' + T('Risparmio totale') + '</span><strong' + (c.surplus < 0 ? ' class="neg"' : '') + '>' + money(c.surplus) + '</strong></div></div></section>';
    out += '<section class="tiles" aria-label="' + T('Totali') + '">' + tile('income', 'Entrate', c.income) + tile('expense', 'Spese', c.expense) + tile('saving', 'Accantonato', c.saved) + '</section>';

    if (c.savItems.length) {
      out += '<section class="panel"><h2>' + T('Accantonato per destinazione') + '</h2>';
      c.savItems.forEach(function (it) {
        out += '<div class="dest-row"><span class="chip" style=\"background:' + tc(it.color) + ';color:' + textOn(tc(it.color)) + '">' + esc(it.icon) + '</span><span class="name">' + esc(it.name) + '</span><span class="amt">' + money(it.amount) + '</span></div>';
      });
      out += '</section>';
    }

    if (c.fundItems.length) {
      out += '<section class="panel"><h2>' + T('Spese pagate dai fondi') + '</h2>';
      c.fundItems.forEach(function (it) {
        out += '<div class="dest-row"><span class="chip" style=\"background:' + tc(it.color) + ';color:' + textOn(tc(it.color)) + '">' + esc(it.icon) + '</span><span class="name">' + esc(it.name) + '</span><span class="amt out">' + money(it.amount) + '</span></div>';
      });
      out += '<p class="hint">' + T('Non incidono su Spese e Saldo netto del periodo.') + '</p></section>';
    }

    var sel = null;
    c.expItems.forEach(function (it) { if (it.id === ui.selected) { sel = it; } });
    if (!sel) { ui.selected = null; }

    out += '<section class="panel panel-donut"><h2>' + T('Distribuzione delle spese') + '</h2><div class="donut-wrap">' + donut(c.expItems, c.expense) + '<div class="donut-center">';
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
      c.expItems.forEach(function (it) {
        out += catRow(it, c.expense, ui.mode === 'month');
        if (ui.selected === it.id) { out += catTxList(it.id); }
      });
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
    var hay = norm([nm(ref), t.note || '', typeLabel(t.type), srcLabel(t), fmtDate(t.date), eur(t.amount), money(t.amount)].join(' '));
    for (var i = 0; i < tokens.length; i++) { if (hay.indexOf(tokens[i]) < 0) { return false; } }
    return true;
  }

  function queryTokens() {
    var q = norm(ui.query).trim();
    return q ? q.split(/\s+/) : [];
  }

  // Quanto ogni movimento ha preso dal conto perche il salvadanaio non bastava. Ricalcolato a ogni render().
  var shortMap = {};

  function txRow(t, showDate) {
    var ref = findRef(t.refId, t.type) || NONE_REF;
    var sign = t.type === 'expense' ? '−' : t.type === 'income' ? '+' : '→';
    var from = srcLabel(t);
    var sub = (showDate ? fmtDate(t.date) + ' · ' : '') + (t.note || typeLabel(t.type)) + (from ? ' · ' + from : '');
    var warn = shortMap[t.id] ? '<small class="tx-warn">' + esc(T('⚠️ Salvadanaio “{n}” non sufficiente a coprire la spesa: {m} presi dal conto.', { n: walletName(srcOf(t)), m: money(shortMap[t.id]) })) + '</small>' : '';
    return '<button type="button" class="tx-row" data-action="edit-tx" data-id="' + esc(t.id) + '">' +
      '<span class="chip" style=\"background:' + tc(ref.color) + ';color:' + textOn(tc(ref.color)) + '">' + esc(ref.icon) + '</span>' +
      '<span class="tx-main"><b>' + esc(nm(ref)) + '</b><small>' + esc(sub) + '</small>' + warn + '</span>' +
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
    var filters = [['all', T('Tutti')], ['expense', T('Spese')], ['income', T('Entrate')], ['saving', T('Trasferimenti')]];
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
      var sub = kind === 'expense' ? (c.limit ? T('Limite mensile {l}', { l: money(c.limit) }) : T('Nessun limite')) : kind === 'income' ? T('Entrata') : T('Destinazione') + (c.spendable ? ' · ' + T('per spese') : '');
      var chip = '<span class="chip" style=\"background:' + tc(c.color) + ';color:' + textOn(tc(c.color)) + '">' + esc(c.icon) + '</span>';
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

  function balCell(n) { return '<span class="bal' + (n < 0 ? ' neg' : '') + '">' + money(n) + '</span>'; }

  function wealthRow(ref, bal, flows, attrs, cls) {
    var neg = bal.warn !== undefined ? bal.warn : bal.balance < 0;
    var sub = (neg ? '⚠️ ' + T('In negativo') + ' · ' : '') + flows;
    return '<button type="button" class="item-row' + (cls ? ' ' + cls : '') + '" ' + attrs + '>' +
      '<span class="chip" style=\"background:' + tc(ref.color) + ';color:' + textOn(tc(ref.color)) + '">' + esc(ref.icon) + '</span>' +
      '<span class="grow"><b>' + esc(nm(ref)) + '</b><small>' + esc(sub) + '</small></span>' +
      balCell(bal.balance) + '<span class="chev" aria-hidden="true">›</span></button>';
  }

  // Tab Sintesi Patrimonio: stato di conto e fondi su tutto lo storico, non sul periodo scelto.
  function renderWealth() {
    var b = balances(), total = 0, funds = 0, pk = 0;
    Object.keys(b).forEach(function (k) { total += b[k].balance; if (findFund(k)) { funds += b[k].balance; } if (findPocket(k)) { pk += b[k].balance; } });
    var out = '<h2 class="section-title">' + T('Sintesi Patrimonio') + '</h2>' +
      '<section class="hero" aria-label="' + T('Sintesi Patrimonio') + '">' +
      '<div class="hero-main"><span class="lbl">' + T('Patrimonio totale') + '</span><strong class="big' + (total < 0 ? ' neg' : '') + '">' + money(total) + '</strong><span class="hint">' + T('Conto più fondi. I trasferimenti non lo cambiano.') + '</span>' +
      '<div class="hero-pill"><span>' + T('Nei fondi e risparmi') + '</span><strong' + (funds < 0 ? ' class="neg"' : '') + '>' + money(funds) + '</strong></div>' +
      (db.pockets.length ? '<div class="hero-pill"><span>' + T('Nei salvadanai') + '</span><strong' + (pk < 0 ? ' class="neg"' : '') + '>' + money(pk) + '</strong></div>' : '') +
      '</div></section>';
    out += '<h2 class="section-title">' + T('Conti') + '</h2><div class="list-card">';
    db.accounts.forEach(function (a) {
      var s = b[a.id], ps = pocketsOf(a.id);
      if (!ps.length) {
        out += wealthRow(a, s, T('Entrate {a} · Uscite {b}', { a: money(s.inn), b: money(s.out) }), 'data-action="edit-account" data-id="' + esc(a.id) + '"');
      } else {
        var av = availOf(a.id, b), tot = totalOf(a.id, b);
        out += wealthRow(a, { balance: tot, warn: av < 0 }, T('Disponibile {a} · Salvadanai {b}', { a: money(av), b: money(tot - s.balance) }), 'data-action="edit-account" data-id="' + esc(a.id) + '"');
        ps.forEach(function (p) {
          var q = b[p.id];
          out += wealthRow(p, q, T('Entrate {a} · Uscite {b}', { a: money(q.inn), b: money(q.out) }), 'data-action="edit-cat" data-kind="pocket" data-id="' + esc(p.id) + '"', 'pocket-row');
        });
      }
      out += '<button type="button" class="add-btn pocket-add" data-action="add-cat" data-kind="pocket" data-acc="' + esc(a.id) + '">' + T('+ Aggiungi salvadanaio') + '</button>';
    });
    out += '<button type="button" class="add-btn" data-action="add-cat" data-kind="account">' + T('+ Aggiungi conto') + '</button></div>';
    out += '<h2 class="section-title">' + T('Fondi e risparmi') + '</h2><div class="list-card">';
    db.destinations.forEach(function (d) {
      var s = b[d.id];
      out += wealthRow(d, s, T('Versato {a} · Prelevato {b}', { a: money(s.inn), b: money(s.out) }), 'data-action="edit-cat" data-kind="saving" data-id="' + esc(d.id) + '"');
    });
    return out + '<button type="button" class="add-btn" data-action="add-cat" data-kind="saving">' + T('+ Aggiungi destinazione') + '</button></div>';
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
    if (meta) { meta.setAttribute('content', dark ? '#0A1F45' : '#EAF1FA'); }
    var btn = $('#theme-btn');
    if (btn) { btn.textContent = dark ? '☀️' : '🌙'; }
  }

  function applyChrome() {
    var showActions = ui.tab === 'home' || ui.tab === 'list' || ui.tab === 'wealth';
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
    shortMap = {}; balances(shortMap);
    var html = ui.tab === 'home' ? renderHome() : ui.tab === 'list' ? renderList() : ui.tab === 'wealth' ? renderWealth() : ui.tab === 'cats' ? renderCats() : renderSettings();
    $('#view').innerHTML = html;
    $('#view').setAttribute('data-tab', ui.tab);
    if (ui.tab === 'settings') { updateStorageInfo(); }
  }

  // --------------------------------------------------------- foglio inserimento

  function refsFor(type) {
    return type === 'saving' ? db.destinations : db.categories.filter(function (c) { return c.type === type; });
  }

  // Conti e fondi scelti per il movimento. Spese: i conti e i fondi usabili. Entrate e trasferimenti: tutti.
  function walletOptions(type, cur) {
    var list = [];
    db.accounts.forEach(function (a) {
      list.push({ id: a.id, ref: a });
      pocketsOf(a.id).forEach(function (p) { list.push({ id: p.id, ref: p, acc: a }); });
    });
    db.destinations.forEach(function (d) {
      if (type !== 'expense' || d.spendable || d.id === cur) { list.push({ id: d.id, ref: d }); }
    });
    return list;
  }

  // Ultimo conto o fondo usato per quel tipo di movimento, altrimenti il primo conto.
  function defaultWallet(type) {
    var id = db.settings.lastWallet && db.settings.lastWallet[type];
    var ok = walletOptions(type, '').some(function (o) { return o.id === id; });
    return ok ? id : db.accounts[0].id;
  }

  function existingWallet(tx) {
    var id = tx.type === 'income' ? dstOf(tx) : srcOf(tx);
    return findAccount(id) || findPocket(id) || findFund(id) ? id : db.accounts[0].id;
  }

  function openEntry(type, tx) {
    entry = tx
      ? { mode: 'edit', id: tx.id, type: tx.type, amountStr: centsToStr(tx.amount), refId: tx.refId, wal: existingWallet(tx), note: tx.note || '', date: tx.date, createdAt: tx.createdAt }
      : { mode: 'new', id: null, type: type, amountStr: '', refId: null, wal: defaultWallet(type), note: '', date: todayISO(), createdAt: Date.now() };
    sheetOpened();
    renderEntry();
  }

  function dateText(iso) { return iso === todayISO() ? T('Oggi') : fmtDate(iso); }

  // Griglia di scelta: categorie per spese ed entrate, conti e fondi (tranne la partenza) per i trasferimenti.
  function gridHtml() {
    var refs = entry.type === 'saving' ? walletsAll().filter(function (w) { return w.id !== entry.wal; }) : refsFor(entry.type);
    var h = '';
    if (!refs.length) {
      h += '<p class="empty" style="grid-column:1/-1">' + T(entry.type === 'saving' ? 'Nessun altro conto o fondo. Aggiungine uno dal tab Sintesi.' : 'Nessuna voce. Creane una dal tab Categorie.') + '</p>';
    }
    refs.forEach(function (r) {
      h += '<button type="button" class="cat-tile' + (entry.refId === r.id ? ' on' : '') + '" data-action="pick-ref" data-ref="' + esc(r.id) + '">' +
        '<span class="ci" style=\"background:' + tc(r.color) + ';color:' + textOn(tc(r.color)) + '">' + esc(r.icon) + '</span><span class="cn">' + esc(nm(r)) + '</span></button>';
    });
    return h;
  }

  function renderEntry() {
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
    h += '</div>' + srcRowHtml() + '<div class="grid-title">' + T(entry.type === 'saving' ? 'Destinazione' : 'Categoria') + (entry.mode === 'new' ? T(': tocca per salvare') : '') + '</div><div class="cat-grid">';
    h += gridHtml() + '</div>';
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

  // Riga dei conti e fondi: da dove esce il denaro (spese, trasferimenti) o dove entra (entrate).
  function srcRowHtml() {
    var opts = walletOptions(entry.type, entry.wal);
    if (opts.length < 2) { return ''; }
    var b = balances();
    var title = T(entry.type === 'income' ? 'Versato su' : entry.type === 'saving' ? 'Da' : 'Pagato da');
    var h = '<div class="grid-title">' + title + '</div><div class="src-row" role="group" aria-label="' + title + '">';
    opts.forEach(function (o) {
      var bal = levelOf(o.id, b), on = entry.wal === o.id;
      h += '<button type="button" class="src-chip' + (on ? ' on' : '') + '" data-action="pick-src" data-src="' + esc(o.id) + '" aria-pressed="' + on + '">' +
        '<span class="si" style=\"background:' + tc(o.ref.color) + ';color:' + textOn(tc(o.ref.color)) + '">' + esc(o.ref.icon) + '</span>' +
        '<span class="st"><span class="sn">' + esc(nm(o.ref)) + '</span>' + (o.acc ? '<small class="sa">' + esc(nm(o.acc)) + '</small>' : '') + '<small class="' + (bal < 0 ? 'neg' : '') + '">' + money(bal) + '</small></span></button>';
    });
    return h + '</div>';
  }

  function pickSrc(id) {
    entry.wal = id;
    if (entry.type === 'saving') {
      // La partenza non puo essere anche l arrivo: aggiorna la griglia delle destinazioni.
      if (entry.refId === id) { entry.refId = null; }
      var grid = $('.cat-grid');
      if (grid) { grid.innerHTML = gridHtml(); }
    }
    Array.prototype.forEach.call(document.querySelectorAll('.src-chip'), function (b) {
      var on = b.getAttribute('data-src') === id;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on);
    });
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
    if (entry.type === 'saving' && entry.wal === entry.refId) { toast(T('La fonte e la destinazione coincidono.'), 'warn', 2400); return; }
    var tx = { id: entry.id || uid(), type: entry.type, amount: cents, refId: entry.refId, src: entry.type === 'income' ? '' : entry.wal, dst: entry.type === 'income' ? entry.wal : '', date: entry.date, note: String(entry.note || '').trim().slice(0, 200), createdAt: entry.createdAt };
    var before = balances();
    var alertInfo = tx.type === 'expense' && !fromFund(tx) ? budgetAlert(tx) : null;
    if (entry.mode === 'edit') {
      db.transactions = db.transactions.map(function (t) { return t.id === tx.id ? tx : t; });
    } else {
      db.transactions.push(tx);
    }
    var wasEdit = entry.mode === 'edit';
    // Un fondo o il conto che passa sotto zero con questo movimento: avviso, ma il movimento resta.
    var sf = {}, after = balances(sf), negMsg = null, shortMsg = null;
    var from = srcOf(tx), negs = [];
    if (tx.type !== 'income' && before[from]) {
      var chk = [from], pf = findPocket(from);
      if (pf) { chk.push(pf.accountId); }
      chk.forEach(function (id) {
        var lb = levelOf(id, before), la = levelOf(id, after);
        if (la < 0 && lb >= 0) { negs.push(T('⚠️ {name}: saldo in negativo ({b}).', { name: walletName(id), b: money(la) })); }
      });
      if (negs.length) { negMsg = negs.join(' '); }
    }
    if (sf[tx.id]) { shortMsg = T('⚠️ Credito del salvadanaio insufficiente: {m} presi dal conto.', { m: money(sf[tx.id]) }); }
    db.settings.lastWallet[tx.type] = entry.wal;
    var saved = save();
    ui.year = +tx.date.slice(0, 4);
    ui.month = +tx.date.slice(5, 7) - 1;
    ui.selected = null;
    closeSheet();
    render();
    if (alertInfo) { toast(alertInfo.text, alertInfo.level); }
    if (shortMsg) { toast(shortMsg, 'warn'); }
    if (negMsg) { toast(negMsg, 'warn'); }
    if (!alertInfo && !negMsg && !shortMsg && (saved || memoryOnly)) { toast(wasEdit ? T('Modifica salvata: {m}', { m: money(cents) }) : T(ADDED[tx.type], { m: money(cents) }), 'ok'); }
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

  // Evidenzia il colore scelto: uno della palette oppure quello personalizzato.
  function syncSwatches() {
    var custom = COLORS.indexOf(editor.color) < 0;
    Array.prototype.forEach.call(document.querySelectorAll('.swatches button'), function (b) {
      var on = b.getAttribute('data-c') === editor.color;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on);
    });
    var lab = $('.swatch-custom'), inp = $('#ed-color');
    if (lab) { lab.classList.toggle('on', custom); lab.style.background = custom ? editor.color : ''; }
    if (inp && inp.value !== editor.color) { inp.value = editor.color; }
  }

  function openEditor(kind, id, accId) {
    sheetOpened();
    var ex = null;
    if (kind === 'account') { ex = id ? findAccount(id) : null; }
    else if (kind === 'pocket') { ex = id ? findPocket(id) : null; }
    else if (id) { ex = kind === 'saving' ? findRef(id, 'saving') : findRef(id, kind); }
    editor = {
      kind: kind, id: id || null,
      acc: ex && kind === 'pocket' ? ex.accountId : (accId || ''),
      color: ex ? ex.color : nextColor(),
      icon: ex ? ex.icon : (kind === 'account' ? '💳' : kind === 'pocket' ? '🐷' : EMOJIS[0])
    };
    var h = '<div class="sheet-backdrop" data-action="close-sheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="' + T('Editor') + '" tabindex="-1">' +
      '<div class="sheet-grip"></div><div class="sheet-head"><strong>' + T(kind === 'account' ? (ex ? 'Modifica conto' : 'Nuovo conto') : kind === 'pocket' ? (ex ? 'Modifica salvadanaio' : 'Nuovo salvadanaio') : (ex ? 'Modifica ' : 'Nuova ') + (kind === 'saving' ? 'destinazione' : 'categoria')) + '</strong>' +
      '<button type="button" class="icon-btn" data-action="close-sheet" aria-label="' + T('Chiudi') + '">✕</button></div>' +
      '<label class="field-label" for="ed-name">' + T('Nome') + '</label><input class="field-input" id="ed-name" type="text" maxlength="30" value="' + esc(ex ? nm(ex) : '') + '" autocomplete="off">' +
      '<label class="field-label" for="ed-icon">' + T('Icona o emoji') + '</label><input class="field-input" id="ed-icon" type="text" maxlength="8" value="' + esc(editor.icon) + '" autocomplete="off">' +
      '<div class="emoji-grid">';
    groupsFor(kind).forEach(function (g) {
      h += '<span class="emoji-group">' + g[lang] + '</span>';
      g.list.forEach(function (e) { h += '<button type="button" data-action="emoji-pick" data-e="' + e + '" aria-label="' + T('Icona {e}', { e: e }) + '">' + e + '</button>'; });
    });
    h += '</div><span class="field-label">' + T('Colore') + '</span><div class="swatches">';
    COLORS.forEach(function (c) { h += '<button type="button" data-action="color-pick" data-c="' + c + '" class="' + (c === editor.color ? 'on' : '') + '" style="background:' + tc(c) + '" aria-label="' + T('Colore {c}', { c: c }) + '"></button>'; });
    h += '<label class="swatch-custom"><input type="color" id="ed-color" value="' + editor.color + '" aria-label="' + T('Colore personalizzato') + '"><span aria-hidden="true">🎨</span></label></div>';
    if (kind === 'expense') {
      h += '<label class="field-label" for="ed-limit">' + T('Limite di spesa mensile in euro (facoltativo)') + '</label><input class="field-input" id="ed-limit" type="text" inputmode="decimal" placeholder="' + T('Nessun limite') + '" value="' + (ex && ex.limit ? centsToStr(ex.limit).replace(',', DEC) : '') + '" autocomplete="off">';
    }
    if (kind === 'saving' || kind === 'account') {
      h += '<label class="field-label" for="ed-opening">' + T('Saldo iniziale in euro (facoltativo)') + '</label><input class="field-input" id="ed-opening" type="text" inputmode="decimal" placeholder="0" value="' + (ex && ex.opening ? signedStr(ex.opening) : '') + '" autocomplete="off">' +
        '<label class="field-label" for="ed-opening-date">' + T('Data del saldo iniziale (facoltativa)') + '</label><input class="field-input" id="ed-opening-date" type="date" value="' + (ex ? (ex.openingDate || '') : todayISO()) + '">' +
        '<p class="hint">' + T('Le entrate e le uscite fino a questa data (inclusa) sono già nel saldo e non vengono contate.') + '</p>';
    }
    if (kind === 'pocket') {
      h += '<label class="field-label" for="ed-opening">' + T('Saldo iniziale del salvadanaio in euro (facoltativo)') + '</label><input class="field-input" id="ed-opening" type="text" inputmode="decimal" placeholder="0" value="' + (ex && ex.opening ? signedStr(ex.opening) : '') + '" autocomplete="off">' +
        '<p class="hint">' + T('Parte del saldo del conto messa da parte. Resta liquidità e fa parte del conto, ma non è nel disponibile. Non va sotto zero: se non basta, il resto esce dal conto. Vale la data del saldo iniziale del conto.') + '</p>';
    }
    if (kind === 'saving') {
      h += '<label class="check-row"><input type="checkbox" id="ed-spend"' + (!ex || ex.spendable ? ' checked' : '') + '><span>' + T('Usabile per pagare spese') + '</span></label>';
    }
    h += '<div class="err" id="ed-err" role="alert"></div><div class="sheet-foot">' +
      (ex && (kind !== 'account' || db.accounts.length > 1) ? '<button type="button" class="btn danger" data-action="delete-cat">' + T('Elimina') + '</button>' : '<button type="button" class="btn" data-action="close-sheet">' + T('Annulla') + '</button>') +
      '<button type="button" class="btn primary" data-action="save-cat">' + T('Salva') + '</button></div></div>';
    $('#sheet-root').innerHTML = h;
    document.body.classList.add('sheet-open');
    syncSwatches();
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
    var opening = 0;
    if (editor.kind === 'saving' || editor.kind === 'account' || editor.kind === 'pocket') {
      opening = parseOpening($('#ed-opening').value);
      if (isNaN(opening)) { err.textContent = T('Il saldo iniziale non è valido.'); return; }
      if (editor.kind === 'pocket' && opening < 0) { err.textContent = T('Il saldo del salvadanaio non può essere negativo.'); return; }
    }
    var odate = '';
    if (editor.kind === 'saving' || editor.kind === 'account') {
      odate = $('#ed-opening-date').value;
      if (odate && !isValidISO(odate)) { err.textContent = T('La data non è valida.'); return; }
    }
    if (editor.kind === 'account') {
      var a = editor.id ? findAccount(editor.id) : null;
      if (a) { a.name = name; a.icon = icon; a.color = editor.color; a.opening = opening; a.openingDate = odate; }
      else { db.accounts.push({ id: uid(), name: name, icon: icon, color: editor.color, opening: opening, openingDate: odate }); }
    } else if (editor.kind === 'pocket') {
      var pk = editor.id ? findPocket(editor.id) : null;
      if (pk) { pk.name = name; pk.icon = icon; pk.color = editor.color; pk.opening = opening; }
      else { db.pockets.push({ id: uid(), accountId: editor.acc || db.accounts[0].id, name: name, icon: icon, color: editor.color, opening: opening }); }
    } else if (editor.kind === 'saving') {
      var spend = $('#ed-spend').checked;
      var d = editor.id ? findRef(editor.id, 'saving') : null;
      if (d) { d.name = name; d.icon = icon; d.color = editor.color; d.opening = opening; d.openingDate = odate; d.spendable = spend; }
      else { db.destinations.push({ id: uid(), name: name, icon: icon, color: editor.color, opening: opening, openingDate: odate, spendable: spend }); }
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
    var wal = kind === 'saving' || kind === 'account';
    var ref = kind === 'account' ? findAccount(id) : kind === 'pocket' ? findPocket(id) : kind === 'saving' ? findRef(id, 'saving') : findRef(id, kind);
    if (kind === 'account' && db.accounts.length < 2) { return; }
    if (kind === 'pocket') { deletePocket(id); return; }
    var used = db.transactions.filter(function (t) { return t.refId === id || (wal && (t.src === id || t.dst === id)); }).length;
    var msg = T('Eliminare “{n}”?', { n: ref ? nm(ref) : '' });
    if (kind === 'account' && pocketsOf(id).length) { msg += T(' Verranno eliminati anche i suoi {n} salvadanai.', { n: pocketsOf(id).length }); }
    if (used) {
      msg += wal ? (used === 1 ? T(' Il movimento collegato non incide più sui saldi.') : T(' I {u} movimenti collegati non incidono più sui saldi.', { u: used }))
        : (used === 1 ? T(' Il movimento collegato resta, ma senza categoria.') : T(' I {u} movimenti collegati restano, ma senza categoria.', { u: used }));
    }
    if (wal) {
      var bb = balances()[id];
      if (bb && bb.balance !== 0) { msg += ' ' + T('Il saldo di “{n}” ({b}) non verrà più conteggiato nel patrimonio.', { n: ref ? nm(ref) : '', b: money(bb.balance) }); }
    }
    if (!window.confirm(msg)) { return; }
    if (kind === 'account') {
      db.accounts = db.accounts.filter(function (a) { return a.id !== id; });
      db.pockets = db.pockets.filter(function (p) { return p.accountId !== id; });
    }
    else if (kind === 'saving') { db.destinations = db.destinations.filter(function (d) { return d.id !== id; }); }
    else { db.categories = db.categories.filter(function (c) { return c.id !== id; }); }
    save();
    closeSheet();
    render();
    toast(T('Eliminata.'), 'info');
  }

  // Elimina un salvadanaio senza perdere patrimonio: saldo e movimenti rientrano nel conto.
  function deletePocket(id) {
    var p = findPocket(id), acc = p ? findAccount(p.accountId) : null;
    if (!p || !acc) { return; }
    var bal = balances()[id].balance;
    var msg = T('Eliminare “{n}”?', { n: nm(p) }) + T(' Il saldo del salvadanaio ({b}) torna nel conto e i movimenti passano al conto.', { b: money(bal) });
    if (!window.confirm(msg)) { return; }
    db.transactions.forEach(function (t) {
      if (t.src === id) { t.src = acc.id; }
      if (t.dst === id) { t.dst = acc.id; }
      if (t.type === 'saving' && t.refId === id) { t.refId = acc.id; }
    });
    // Spostamenti conto -> conto stesso: non servono piu.
    db.transactions = db.transactions.filter(function (t) { return !(t.type === 'saving' && t.refId === acc.id && srcOf(t) === acc.id); });
    acc.opening += p.opening;
    db.pockets = db.pockets.filter(function (q) { return q.id !== id; });
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
    var payload = JSON.stringify({ app: 'SPET', exportedAt: new Date().toISOString(), version: db.version, settings: db.settings, accounts: db.accounts, pockets: db.pockets, categories: db.categories, destinations: db.destinations, transactions: db.transactions }, null, 2);
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
    var rows = [T('Data;Tipo;Categoria o destinazione;Importo EUR;Note;Conto o fondo').split(';')];
    txs.forEach(function (t) {
      var ref = findRef(t.refId, t.type) || NONE_REF;
      rows.push([fmtDate(t.date), typeLabel(t.type), nm(ref), eur(t.amount), t.note, srcName(t)]);
    });
    if (scope !== 'all') {
      var c = compute();
      rows.push([]);
      rows.push([T('Periodo'), periodLabel()]);
      rows.push([T('Totale entrate'), '', '', eur(c.income)]);
      rows.push([T('Totale spese'), '', '', eur(c.expense)]);
      rows.push([T('Totale accantonato'), '', '', eur(c.saved)]);
      c.savItems.forEach(function (it) { rows.push([T('  di cui {n}', { n: it.name }), '', '', eur(it.amount)]); });
      rows.push([T('Totale spese pagate da fondi'), '', '', eur(c.fundTotal)]);
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
      case 'pick-src': if (entry) { pickSrc(el.getAttribute('data-src')); } break;
      case 'edit-account': openEditor('account', el.getAttribute('data-id')); break;
      case 'save-edit': if (entry) { commitEntry(); } break;
      case 'delete-tx': deleteTx(); break;
      case 'close-sheet': closeSheet(); break;
      case 'add-cat': openEditor(el.getAttribute('data-kind'), null, el.getAttribute('data-acc') || ''); break;
      case 'edit-cat': openEditor(el.getAttribute('data-kind'), el.getAttribute('data-id')); break;
      case 'emoji-pick': $('#ed-icon').value = el.getAttribute('data-e'); break;
      case 'color-pick':
        editor.color = el.getAttribute('data-c');
        syncSwatches();
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
    if (e.target && e.target.id === 'ed-color' && editor) { editor.color = e.target.value; syncSwatches(); return; }
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
