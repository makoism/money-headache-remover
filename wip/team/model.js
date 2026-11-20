/* ===== MODEL (pure, no DOM) ===== */
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const START = '2026-11', END = '2028-10', SAVE_FROM = '2026-11', PAYDAY = 15;
const ymIdx = ym => { const p = ym.split('-'); return +p[0] * 12 + (+p[1] - 1); };
const ymFrom = i => { const y = Math.floor(i / 12), m = i % 12 + 1; return y + '-' + (m < 10 ? '0' : '') + m; };
const ymAdd = (ym, n) => ymFrom(ymIdx(ym) + n);
const ymCount = (a, b) => ymIdx(b) - ymIdx(a) + 1;
const MONTHS = []; for (let i = ymIdx(START); i <= ymIdx(END); i++) MONTHS.push(ymFrom(i));
/* how far ahead the page looks, in words. A goal that is not full by the last month is "not full within 2 years", never "by Oct 2028", which would read like a date someone chose. */
const SPAN = MONTHS.length % 12 === 0 ? `${MONTHS.length / 12} years` : `${MONTHS.length} months`;
const monthLabel = (ym, short) => { const p = ym.split('-'); return MONTH_NAMES[+p[1] - 1] + (short ? '' : ' ' + p[0]); };
const pad2 = n => (n < 10 ? '0' : '') + n;
/* the day a person typed their bank balance (Mako, 2026-11-19: Home says "Balance you entered on 18 Nov"). Only set when a balance is entered;
   a copy saved before this has no date and Home shows none, never a guessed one. */
const BANK_AT_FORM = /^\d{4}-\d{2}-\d{2}$/;
/* the bank now (LAUNCH_CHECKLIST A1): what the bank app shows today, typed on Home, with the day. Kept apart from bankStart (the bank at the
   start of the first month), so typing it mid-month changes no planned figure and nothing already past this month is counted twice */
const setBankNow = (T, v, now) => { const d = now || new Date(); T.cfg.bankNow = v; T.cfg.bankNowAt = d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); };
const setBankBalance = (T, v, now) => { const d = now || new Date(); T.cfg.bankStart = v; T.cfg.bankAt = d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); };
const round2 = x => Math.round(x * 100) / 100;
/* round down to whole yen, or to cents for other currencies, so the unspent amount is counted to the last cent */
const flrCur = (S, x) => ((S.ui && S.ui.cur) === '¥' ? Math.floor(x + 1e-9) : Math.floor(x * 100 + 1e-6) / 100);

/* ---- Settings under Basics (S.cfg overrides these). The original sample, in Philippine pesos; SAMPLES below has the current ones. ---- */
const CFG = {
  bankStart: 15000,        // what you have in the bank (and cash) at the start of the first month
  minBank: 3000,           // lowest balance you are comfortable with
  ceiling: 5000,           // most you want to spend in a month
};

/* ---- The six jars (T. Harv Eker's system). "usual" is Eker's usual share of pay for each jar. It is only a guide: the page never shows it as a target, and the shares it does show always come from the real amounts. ---- */
const JARS = [
  { id: 'nec',  name: 'Bills and basics',                    usual: 0.55, about: 'Rent, food, utilities and every other bill.' },
  { id: 'lts',  name: 'Goal burrows', usual: 0.10, about: 'Money you save now and spend later, on a big purchase, a trip or a surprise. Your burrows are in here.' },
  { id: 'play', name: 'Free to spend',                         usual: 0.10, about: 'Fun for you and your family, spend it on whatever you want. What\'s left at month end can go to a goal.' },
  { id: 'edu',  name: 'Education',                      usual: 0.10, about: 'Courses, books, coaching, skill building.' },
  { id: 'ffa',  name: 'Investing',              usual: 0.10, about: 'You never spend this, it grows over time.' },
  { id: 'give', name: 'Giving',                         usual: 0.05, about: 'Charity, donations and gifts.' },
];
/* the usual share of each place as a whole percent, for the screens that name it (they never work it out) */
JARS.forEach(j => { j.usualPct = Math.round(j.usual * 100); });
const LINE_JARS = ['nec', 'play', 'edu', 'ffa', 'give'];
/* a few words for each jar, shown under its name wherever the split is listed */
const JARTAG = { nec: 'Bills', lts: 'Saving toward a goal', play: 'Spend on fun', edu: 'Courses and books', ffa: 'Never spent', give: 'Charity and gifts' };

/* ---- The starting plan: lines you pay every month, and savings goals. All of it can be renamed, removed or added to. ---- */
const LINE_DEFS = [
  { id: 'rent',   key: 'bill:rent',  jar: 'nec', name: 'Rent or mortgage', def: 7000, note: 'Your biggest bill. Use the full amount even if someone shares it, and put their share under Money in.' },
  { id: 'util',   key: 'bill:util',  jar: 'nec', name: 'Utilities', def: 1750, note: 'Electricity and water. Hot and rainy months can cost more.' },
  { id: 'food',   key: 'bill:food',  jar: 'nec', name: 'Food and groceries', def: 5500, note: 'Groceries and everyday meals. Eating out for fun goes under Free to spend.' },
  { id: 'net',    key: 'bill:net',   jar: 'nec', name: 'Internet', def: 1200 },
  { id: 'phone',  key: 'bill:phone', jar: 'nec', name: 'Phone', def: 500, note: 'Postpaid plan, or the prepaid top-up you usually buy in a month.' },
  { id: 'ins',    key: 'bill:ins',   jar: 'nec', name: 'Insurance and contributions', def: 1000, note: 'Health or life insurance, as a monthly amount. If you\'re not on a payroll, include your own SSS, PhilHealth and Pag-IBIG payments.' },
  { id: 'subs',   key: 'bill:subs',  jar: 'nec', name: 'Subscriptions', def: 500, note: 'Streaming, apps, software, gym.' },
  { id: 'gas',    key: 'bill:gas',   jar: 'nec', name: 'Transport', def: 1800, note: 'Commute, Grab, fuel, parking, tolls.' },
  { id: 'loan',   key: 'bill:loan',  jar: 'nec', name: 'Loan or debt payment', def: 0, note: 'Car loan, personal loan, card installments. Pick the month of the last payment, and after that its money can move to your Emergency fund.' },
  { id: 'card',   key: 'card',       jar: 'nec', name: 'Other card spending', def: 0, note: 'Only if you have it. Card spending that isn\'t already in a line above, like shopping or household items. Fun spending goes under Free to spend.' },
  { id: 'spend',  key: 'envelope',   jar: 'play', name: 'Free to spend', def: 3500 },
  { id: 'learn',  key: 'education',  jar: 'edu', name: 'Courses and books', def: 3500 },
  { id: 'invest', key: 'invest',     jar: 'ffa', name: 'Investing', def: 3500 },
  { id: 'give',   key: 'give',       jar: 'give', name: 'Giving', def: 1750 },
];
const BUILTIN = LINE_DEFS;
/* due: a date, or '' when there is no deadline. monthly: a fixed monthly amount for goals with no date. */
const GOAL_DEFS = [
  { id: 'moving', name: 'Home or move',   target: 16000, start: 0, due: '2028-03-01', slot: 4 },
  { id: 'travel', name: 'Trip',           target: 8000,  start: 0, due: '', monthly: 500, slot: 5 },
  { id: 'car',    name: 'Yearly cost',    target: 3500,  start: 0, due: '2027-06-15', slot: 6 },
  { id: 'rainy',  name: 'Emergency fund', target: 57750, start: 25000, due: '', monthly: 1500, emergency: true, stretch: 115500, slot: 7 },
];
const MAX_LINES = 40, MAX_GOALS = 6, SLOTS = [4, 5, 6, 7, 1, 2, 3];
const SAFE_ID = /^[A-Za-z0-9_-]{1,24}$/;

/* Build the plan. "legacy" is the settings object of an older saved copy, so saved numbers keep working. */
/* Earlier copies of the sample had a car loan ending in 2027-08 and other dates and targets for two goals. A saved copy from then is
   still recognised as the unedited sample, so changing the currency keeps swapping it. */
const V1_GOALS = { moving: { target: 18000, due: '2028-05-01' }, car: { target: 4800, due: '2027-08-20' } };
function basePlan(c, v1) {
  c = c || {};
  const lines = LINE_DEFS.map(l => Object.assign({}, l)), goals = GOAL_DEFS.map(g => Object.assign({}, g));
  const loan = lines.find(l => l.id === 'loan');
  if (v1) { Object.assign(loan, { ends: '2027-08', redirect: true }); goals.forEach(g => { if (V1_GOALS[g.id]) Object.assign(g, V1_GOALS[g.id]); }); }
  if (typeof c.loanLast === 'string' && MONTHS.indexOf(c.loanLast) >= 0) loan.ends = c.loanLast;
  if (typeof c.redirectLoan === 'boolean') loan.redirect = c.redirectLoan;
  const g = id => goals.find(x => x.id === id), set = (id, k, v) => { if (typeof v === 'number' && isFinite(v) && v >= 0) g(id)[k] = v; };
  set('moving', 'target', c.moveTarget); set('moving', 'start', c.moveStart);
  set('travel', 'target', c.travelTarget); set('travel', 'start', c.travelStart);
  set('car', 'target', c.carTarget); set('car', 'start', c.carStart);
  set('rainy', 'start', c.rainyStart); set('rainy', 'target', c.rainyTarget); set('rainy', 'stretch', c.rainyStretch);
  if (/^\d{4}-\d{2}$/.test(c.moveMonth || '')) g('moving').due = c.moveMonth + '-01';
  if (/^\d{4}-\d{2}-\d{2}$/.test(c.carDue || '')) g('car').due = c.carDue;
  return { lines, goals };
}

/* ---- Sample numbers by currency ----
   Yen, pesos and euros start with a sample salary and a whole plan worked out from it (bills, jars, goals), so it all adds up.
   Any other currency starts at zero. "preset" in the saved state says which one is loaded; an older saved copy is "legacy" (the original 35,000 peso sample). */
/* the card line used to be called something else; saved copies carry the old words until they are loaded */
const CARD_OLD = { name: 'Spending on credit cards', note: 'Optional. Anything you put on a credit card and pay off each month that is not already in a line above. Fun spending belongs under Free to spend.' };
const SAMPLES = { '₱': { pay: 30000, unit: 50 }, '¥': { pay: 200000, unit: 500 }, '€': { pay: 1650, unit: 5 } };
const BASE_PAY = 35000;   // the pay the LINE_DEFS and GOAL_DEFS above were written for
const nice = (x, digits) => { if (!(x > 0)) return 0; const p = digits === 2 ? Math.pow(10, Math.floor(Math.log10(x)) - 1) : Math.pow(10, Math.floor(Math.log10(x))) / 2; return Math.round(x / p) * p; };
const SAMPLE_CACHE = {};
function sampleOf(cur, v1) {
  const ck = cur + (v1 ? '#1' : '');
  if (SAMPLE_CACHE[ck]) return SAMPLE_CACHE[ck];
  const sm = SAMPLES[cur], pay = sm.pay, u = sm.unit, f = pay / BASE_PAY;
  const r = x => Math.round(x * f / u) * u, share = id => Math.round(pay * JARS.find(j => j.id === id).usual / u) * u;
  const lines = LINE_DEFS.map(l => Object.assign({}, l)), goals = GOAL_DEFS.map(g => Object.assign({}, g));
  const L = id => lines.find(l => l.id === id), G = id => goals.find(g => g.id === id);
  if (v1) { Object.assign(L('loan'), { ends: '2027-08', redirect: true }); goals.forEach(g => { if (V1_GOALS[g.id]) Object.assign(g, V1_GOALS[g.id]); }); }
  lines.filter(l => l.jar === 'nec').forEach(l => { l.def = r(l.def); });
  const necTotal = share('nec');
  L('food').def = Math.max(0, necTotal - lines.filter(l => l.jar === 'nec' && l.id !== 'food').reduce((a, l) => a + l.def, 0));
  L('spend').def = share('play'); L('learn').def = share('edu'); L('invest').def = share('ffa'); L('give').def = share('give');
  G('moving').target = nice((v1 ? 18000 : 16000) * f); G('car').target = nice((v1 ? 4800 : 3500) * f);
  G('rainy').start = nice(25000 * f, 2); G('rainy').target = necTotal * 3; G('rainy').stretch = necTotal * 6;
  const state = { v: 1, rev: 0, steps: {}, once: {}, items: {}, cfg: {}, ui: { cur, preset: cur }, plan: { lines, goals }, receipts: [] };
  /* the Long-Term Savings for Spending jar is whatever the pay leaves after the other jars. The dated goals take what they need
     and the trip and the emergency fund share the rest, so the whole sample adds up to exactly the pay. */
  const jarTotal = pay - lines.reduce((a, l) => a + l.def, 0);
  const dated = goalDefault(state, G('moving'), SAVE_FROM) + goalDefault(state, G('car'), SAVE_FROM);
  const rest = Math.max(0, jarTotal - dated), trip = Math.min(rest, Math.max(u, Math.round(rest / 5 / u) * u));
  G('travel').monthly = trip; G('rainy').monthly = rest - trip;
  G('travel').target = nice(trip * 16);   // about 16 months of saving, like the original sample
  return (SAMPLE_CACHE[ck] = { state, cfg: { bankStart: r(15000), minBank: r(3000), ceiling: r(5000) } });
}
/* a fresh copy of the sample for this currency, or the zero version for a currency with no sample */
function presetState(cur, v1) {
  if (SAMPLES[cur]) return JSON.parse(JSON.stringify(sampleOf(cur, v1).state));
  const f = JSON.parse(JSON.stringify(sampleOf('₱').state));
  f.ui = { cur, preset: 'blank' };
  f.plan.lines.forEach(l => { l.def = 0; });
  f.plan.goals.forEach(g => { g.target = 0; g.start = 0; delete g.monthly; if (g.emergency) g.stretch = 0; });
  return f;
}
const freshState = () => presetState('¥');
/* what the page uses when you have not typed your own: the loaded sample's pay and balances, or zero */
const presetKey = S => (S.ui && S.ui.preset) || 'legacy';
const cfgDef = (S, k) => { const p = presetKey(S); return p === 'blank' ? 0 : SAMPLES[p] ? sampleOf(p).cfg[k] : CFG[k]; };
const payDef = S => { const p = presetKey(S); return p === 'blank' ? 0 : SAMPLES[p] ? SAMPLES[p].pay : BASE_PAY; };
const cfg = (S, k) => (S.cfg && S.cfg[k] !== undefined ? S.cfg[k] : cfgDef(S, k));

/* ---- looking things up in the plan ---- */
const linesOf = S => S.plan.lines, goalsOf = S => S.plan.goals;
const lineById = (S, id) => S.plan.lines.find(l => l.id === id) || null;
const lineByKey = (S, k) => S.plan.lines.find(l => l.key === k) || null;
const goalById = (S, id) => S.plan.goals.find(g => g.id === id) || null;
const emergencyGoal = S => S.plan.goals.find(g => g.emergency) || null;
const dueYm = g => (g.due ? g.due.slice(0, 7) : null);
/* the last month to be saving: a due date after the 15th means pay day that month still counts */
const readyBy = g => { if (!g.due) return null; const ym = g.due.slice(0, 7), day = +g.due.slice(8, 10) || 1; return day > PAYDAY ? ym : ymAdd(ym, -1); };
/* the Emergency fund stops at its target unless the person said yes to the longer goal (stretchOn); they are asked once it is full */

/* ---------- cards and loans: a balance, a yearly rate, a minimum payment, and extra money on top ---------- */
const MAX_DEBTS = 12, DEBT_KINDS = ['card', 'loan', 'personal'];
const debtsOf = S => (S.plan && Array.isArray(S.plan.debts) ? S.plan.debts : []);
const debtById = (S, id) => debtsOf(S).find(d => d.id === id);
const DEBT_KIND_NAME = { card: 'Credit card', loan: 'Loan', personal: 'Owed to a person' };
/* one month: interest is added to what is owed, then the payment comes off. Whole amounts only. */
function debtStep(d, bal, extra) {
  /* owed x rate / 12 / 100, to the nearest whole amount, a half rounding up. The rate is counted in hundredths of a percent as a whole number,
     so an exact half stays exact (20000 at 90.21% is 1503.5, so 1504; in floating point it came out 1503.4999 and rounded down; side B, 2026-11-19) */
  const A = Math.round(d.apr * 100), interest = bal > 0 ? Math.floor((2 * bal * A + 120000) / 240000) : 0;
  const pay = Math.min(bal + interest, d.min + Math.max(0, extra));
  return { start: bal, interest, extra: Math.max(0, extra), pay, bal: bal + interest - pay };
}
/* from a balance with a steady extra: how long, how much interest, or never */
function debtProject(d, bal, extra, startYm) {
  let months = 0, interest = 0, paid = 0;
  while (bal > 0 && months < 600) {
    const st = debtStep(d, bal, extra);
    if (st.pay <= st.interest) return { never: true, months, interest, paid, ym: null };
    interest += st.interest; paid += st.pay; bal = st.bal; months++;
  }
  if (bal > 0) return { never: true, months, interest, paid, ym: null };
  return { never: false, months, interest, paid, ym: months ? ymAdd(startYm, months - 1) : startYm };
}
/* the split a person chose in setup, as shares of pay. Only the setup steps read it, as their starting point; nothing on screen shows it. */
const aimsOf = S => { const a = (S.cfg && S.cfg.aims) || {}, o = {}; JARS.forEach(j => { const v = a[j.id]; o[j.id] = typeof v === 'number' && v >= 0 && v <= 1 ? v : j.usual; }); return o; };
const allKeys = S => ['a', 'b', 'side'].concat(S.plan.lines.map(l => l.key), S.plan.goals.map(g => 'goal:' + g.id), debtsOf(S).map(d => 'debt:' + d.id));

/* rounding step for default monthly amounts: whole tens for small currencies, hundreds for big ones */
const roundUnit = S => { const pay = Math.max(0, ...MONTHS.map(ym => val(S, 'a', ym) + val(S, 'b', ym) + val(S, 'side', ym))); return pay >= 20000 ? 100 : pay >= 5000 ? 10 : 5; };
/* a goal with a date: spread what is still missing evenly over the months before it */
function evenSave(S, g, ym) {
  const t = Math.max(0, g.target - g.start); if (t <= 0) return 0;
  const rb = readyBy(g); if (ym > rb) return 0;
  const n = ymCount(SAVE_FROM, rb); if (n < 1) return 0;
  const u = roundUnit(S); return Math.ceil(t / n / u) * u;
}
function goalDefault(S, g, ym) {
  if (ym < SAVE_FROM) return 0;
  if (g.due) return evenSave(S, g, ym);
  if (typeof g.monthly === 'number') return g.monthly;
  const rem = Math.max(0, capOf(g) - g.start); if (rem <= 0) return 0;
  const u = roundUnit(S); return Math.ceil(rem / 12 / u) * u;
}
/* the Emergency fund stops at its target unless the person said yes to the longer goal (stretchOn) */
/* a yes counts from the month it was said in (stretchFrom, QC8 SF5): months before it stay at the target, as they were. A yes saved
   before this rule has no month and counts from the start, as it did. With no month given, the cap is the one in force now. */
const capOf = (g, ym) => (g.emergency && g.stretchOn === true && !(ym && g.stretchFrom && ym < g.stretchFrom) ? Math.max(g.stretch || 0, g.target) : g.target);
const BASE_DEF = { b: 0, side: 0, draw: 0 };
function defOf(S, key, ym) {
  if (key === 'a') return payDef(S);
  if (BASE_DEF[key] !== undefined) return BASE_DEF[key];
  const l = lineByKey(S, key); if (l) return l.def;
  if (key.slice(0, 5) === 'goal:') { const g = goalById(S, key.slice(5)); if (g) return goalDefault(S, g, ym); }
  if (key.slice(0, 5) === 'debt:') { const d = debtById(S, key.slice(5)); return d ? d.extra : 0; }
  return 0;
}
const ONCE_KEYS = new Set(['draw']);

function val(S, key, ym) {
  /* a goal with a date takes no more money once its last saving month has passed, whatever amount was typed for later months */
  if (key.slice(0, 5) === 'goal:') { const g = goalById(S, key.slice(5)); if (g && g.due && ym > readyBy(g)) return 0; }
  const o = S.once[ym]; if (o && o[key] !== undefined) return o[key];
  const st = S.steps[key];
  if (st) { let best = null; for (const s of st) if (s.from <= ym && (!best || s.from > best.from)) best = s; if (best) return best.v; }
  return defOf(S, key, ym);
}
/* no amount anywhere is bigger than this, typed or loaded, so a screen and a reload always agree */
const MAX_AMT = 1e9;
/* decision 1 (Mako, 2026-11-18): with the plan (S) given, a typed amount keeps its cents, except in yen, which has none.
   Without S (counts, goal targets) it stays a whole number, as before */
const clampAmt = (v, S) => { v = +v; if (!isFinite(v)) return 0; v = S ? wholeAmt(S, v) : Math.round(v); return Math.max(0, Math.min(MAX_AMT, v)); };
/* the bank balance is the one amount that can be below zero: an overdrawn account is real money owed, and storing it as 0 made every bank figure too high (38.31 QC round 3) */
const clampBank = (v, S) => { v = +v; if (!isFinite(v)) return 0; v = S ? wholeAmt(S, v) : Math.round(v); return Math.max(-MAX_AMT, Math.min(MAX_AMT, v)) || 0; };
function setVal(S, key, ym, v, scope) {
  v = clampAmt(v, S);
  if (scope === 'once' || scope === 'month' || ONCE_KEYS.has(key)) { (S.once[ym] = S.once[ym] || {})[key] = v; return; }
  if (S.once[ym]) delete S.once[ym][key];
  const arr = (S.steps[key] = S.steps[key] || []).filter(s => s.from < ym);
  arr.push({ from: ym, v }); S.steps[key] = arr;
}
function undoOnce(S, ym, key) { const o = S.once[ym]; if (o) { delete o[key]; if (!Object.keys(o).length) delete S.once[ym]; } }
/* only this month's one-off edits and extra costs go; amounts kept for later months stay, so the plan is never wiped from the first month */
function resetMonth(S, ym) {
  delete S.once[ym]; delete S.items[ym];
}
const itemsFor = (S, ym) => (S.items[ym] !== undefined ? S.items[ym] : []);
const sum = arr => arr.reduce((a, b) => a + b, 0);

/* ---- changing the plan ---- */
let idSeq = 0;
const newId = (S, prefix, taken) => { let id; do { id = prefix + Date.now().toString(36).slice(-4) + (idSeq++).toString(36); } while (taken(id)); return id; };
function forgetKey(S, key) { delete S.steps[key]; Object.keys(S.once).forEach(ym => undoOnce(S, ym, key)); }
function addLine(S, jar, name, amount) {
  if (LINE_JARS.indexOf(jar) < 0 || S.plan.lines.length >= MAX_LINES) return null;
  const id = newId(S, 'l', x => lineById(S, x)), l = { id, key: 'line:' + id, jar, name: (name || '').trim().slice(0, 60) || 'New line', def: 0 };
  S.plan.lines.push(l);
  if (amount > 0) setVal(S, l.key, START, amount, 'after');   /* setVal keeps the cents (decision 1) */
  return id;
}
function removeLine(S, id) { const l = lineById(S, id); if (!l) return false; S.plan.lines = S.plan.lines.filter(x => x.id !== id); forgetKey(S, l.key); return true; }
function updateLine(S, id, patch) {
  const l = lineById(S, id); if (!l) return false;
  if (typeof patch.name === 'string') l.name = patch.name.trim().slice(0, 60) || l.name;
  if (patch.ends !== undefined) {
    if (patch.ends && MONTHS.indexOf(patch.ends) >= 0) { if (!l.ends) l.redirect = true; l.ends = patch.ends; } else { delete l.ends; delete l.redirect; }
  }
  if (patch.redirect !== undefined && l.ends) l.redirect = !!patch.redirect;
  return true;
}
const validDue = d => (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && MONTHS.indexOf(d.slice(0, 7)) >= 0 && validDate(d) ? d : '');   /* a real calendar day inside the months the page covers */
const pickSlot = S => { const used = S.plan.goals.map(g => g.slot); return SLOTS.find(s => used.indexOf(s) < 0) || SLOTS[S.plan.goals.length % SLOTS.length]; };
const WHY_MAX = 80;
function addGoal(S, name) {
  if (S.plan.goals.length >= MAX_GOALS) return null;
  const id = newId(S, 'g', x => goalById(S, x));
  S.plan.goals.push({ id, name: (name || '').trim().slice(0, 60) || 'New goal', target: 0, start: 0, due: '', slot: pickSlot(S) });
  return id;
}
function removeGoal(S, id) { const g = goalById(S, id); if (!g) return false; S.plan.goals = S.plan.goals.filter(x => x.id !== id); forgetKey(S, 'goal:' + id); return true; }
function updateGoal(S, id, patch) {
  const g = goalById(S, id); if (!g) return false;
  const n = v => Math.max(0, Math.min(1e9, Math.round(+v || 0)));
  if (typeof patch.name === 'string') g.name = patch.name.trim().slice(0, 60) || g.name;
  if (patch.target !== undefined) g.target = n(patch.target);
  if (patch.start !== undefined) g.start = n(patch.start);
  if (patch.due !== undefined) g.due = validDue(patch.due);
  /* the reason, in the person's own words; shown with the goal wherever it appears */
  if (patch.why !== undefined) { const w = typeof patch.why === 'string' ? patch.why.replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, WHY_MAX) : ''; if (w) g.why = w; else delete g.why; }
  if (patch.emergency !== undefined) {
    if (patch.emergency) { S.plan.goals.forEach(x => { if (x.id !== id) { delete x.emergency; delete x.stretch; } }); g.emergency = true; if (g.stretch === undefined) g.stretch = 0; }
    else { delete g.emergency; delete g.stretch; }
  }
  if (patch.stretch !== undefined && g.emergency) g.stretch = n(patch.stretch);
  return true;
}
/* drop a goal's own monthly choices so the suggested amount applies again */
const useSuggested = (S, id) => forgetKey(S, 'goal:' + id);
const hasOwnMonthly = (S, id) => !!(S.steps['goal:' + id] || Object.keys(S.once).some(ym => S.once[ym]['goal:' + id] !== undefined));

/* every amount in the plan can be cleared with "start from zero"; names and structure stay */
const MONEY_CFG = ['bankStart', 'minBank', 'ceiling'];
/* dropGoals: the sample's invented goals go; a person's own goals stay, emptied */
function blankState(S, dropGoals) {
  const f = freshState(); f.ui = Object.assign({}, S.ui); delete f.ui.sampleHidden; delete f.ui.exactHidden; f.receipts = (S.receipts || []).slice(); /* the Next card guides the fresh start */
  const goals = dropGoals ? S.plan.goals.filter(g => g.emergency) : S.plan.goals;
  f.plan = { lines: S.plan.lines.map(l => Object.assign({}, l, { def: 0 })), goals: goals.map(g => { const o = Object.assign({}, g, { target: 0, start: 0 }); delete o.monthly; if (o.emergency) o.stretch = 0; return o; }) };
  ['a', 'b', 'side'].forEach(k => { f.steps[k] = [{ from: START, v: 0 }]; });
  MONEY_CFG.forEach(k => { f.cfg[k] = 0; });
  if (S.cfg && S.cfg.aims) f.cfg.aims = Object.assign({}, S.cfg.aims);
  return f;
}

let CUR_YM = null;   /* the app registers its idea of the current month here (see setCurYm) */
function setCurYm(f) { CUR_YM = f; }
let VIRT_OFF = false;   /* set while a move is made, so it works on the plan's own values */
function calcAll(S) {
  const months = [], byYm = {}, reached = {};
  const goals = goalsOf(S), lines = linesOf(S), eg = emergencyGoal(S);
  let bank = cfg(S, 'bankStart');
  const bal = {}; goals.forEach(g => { bal[g.id] = g.start; });
  const debts = debtsOf(S), dbal = {}; debts.forEach(d => { dbal[d.id] = d.balance; });
  const redirects = lines.filter(l => l.ends && l.redirect).map(l => ({ l, amt: val(S, l.key, l.ends) }));
  for (const ym of MONTHS) {
    const m = { ym };
    m.a = val(S, 'a', ym); m.b = val(S, 'b', ym); m.side = val(S, 'side', ym);
    m.draw = eg ? Math.min(val(S, 'draw', ym), Math.max(0, bal[eg.id])) : 0;
    m.lines = lines.map(l => { const on = !l.ends || ym <= l.ends; return { id: l.id, key: l.key, jar: l.jar, name: l.name, on, v: on ? val(S, l.key, ym) : 0 }; });
    /* free to spend left unspent in a past month: nothing changes until the person answers (m.pendLeft is the open question).
       After "keep it in the bank" or a move to a goal, whatever is still unspent counts in the bank, so the figures match the real bank */
    /* S1 (gate, 38.30): no question before the first receipt is logged. Until then the person has not started logging, so a past month's
       Free to spend is taken as planned, as in any month without an answer, and nothing on Home asks about it */
    if (!VIRT_OFF && CUR_YM && S.ui && S.ui.done && S.ui.done.pay && S.ui.done.bills && S.ui.done.goals && (S.receipts || []).length > 0 && ym < CUR_YM()) {
      const en = sweepAns(S, ym);
      if (!(en && en.hide)) {
        const rs = receiptStats(S, ym);
        let need = flrCur(S, sum(m.lines.filter(x => x.jar === 'play' && x.on).map(x => x.v)) - (rs.byJar.play || 0)); need = Math.max(0, need);
        if (!en) m.pendLeft = need;
        else { m.counted = need; if (en.id && need > 0) m.topup = { id: en.id, amt: Math.min(round2(+en.amt || 0), need), used: 0 }; }   /* the plan lines stay as planned; the answered money is credited to the bank and the goal below */
      }
    }
    m.jar = { nec: 0, play: 0, edu: 0, ffa: 0, give: 0 };
    m.lines.forEach(x => { m.jar[x.jar] += x.v; });
    m.billsTotal = m.jar.nec;
    m.items = itemsFor(S, ym); m.itemsTotal = sum(m.items.map(i => +i.amount || 0));
    m.debts = {}; m.debtPay = 0; m.debtInterest = 0;
    debts.forEach(d => { const st = debtStep(d, dbal[d.id], val(S, 'debt:' + d.id, ym)); dbal[d.id] = st.bal; m.debts[d.id] = st; m.debtPay += st.pay; m.debtInterest += st.interest;
      st.paidPct = d.balance > 0 ? Math.max(0, Math.min(1, 1 - st.bal / d.balance)) : 1; st.paidPctWhole = d.balance > 0 ? Math.max(0, Math.min(100, Math.floor((200 * (d.balance - st.bal) + d.balance) / (2 * d.balance)))) : 100; });   /* 100 x (first - owed) / first, a half rounding up, worked out in whole numbers (40000 first, 36200 owed is 9.5%, so 10%; side B) */   /* how much of the debt is paid off by the end of this month */
    m.debtOwed = sum(debts.map(d => dbal[d.id]));
    /* named amounts for the cards and loans screens: owed at the start of the month, the minimum payments, and what is paid on top of them */
    m.debtStart = sum(debts.map(d => m.debts[d.id].start)); m.debtMin = sum(debts.map(d => Math.min(d.min, m.debts[d.id].start + m.debts[d.id].interest))); m.debtExtra = m.debtPay - m.debtMin;
    m.jar.nec += m.itemsTotal + m.debtPay;
    m.balBefore = Object.assign({}, bal);
    const freed = redirects.reduce((acc, r) => acc + (ym > r.l.ends ? r.amt : 0), 0);
    const g = {};
    goals.forEach(gl => {
      const isE = !!(eg && gl.id === eg.id), planned0 = val(S, 'goal:' + gl.id, ym) + (isE ? freed : 0);
      const room = Math.max(0, capOf(gl, ym) - bal[gl.id]);
      /* money from a month's unspent free to spend that was put toward this goal: only what the goal still has room for */
      const planned = planned0, up = m.topup && m.topup.id === gl.id ? round2(Math.max(0, Math.min(m.topup.amt, room - Math.min(planned0, room)))) : 0;
      if (up > 0) m.topup.used = up;
      /* money borrowed from the emergency fund this month is never put straight back: a deposit only fills the room the fund had before the draw */
      g[gl.id] = { planned, actual: Math.min(planned, room), up };
      if (isE) g[gl.id].loan = freed;
    });
    m.g = g;
    m.goalsTotal = sum(goals.map(gl => g[gl.id].actual));
    /* one pot: everything that comes in, everything that goes out */
    m.inflow = m.a + m.b + m.side + m.draw;
    m.out = m.jar.nec + m.jar.play + m.jar.edu + m.jar.ffa + m.jar.give + m.goalsTotal;
    m.pool = { in: m.inflow, out: m.out }; m.pool.left = m.pool.in - m.pool.out;
    m.left = m.pool.left;
    m.credit = m.counted ? round2(m.counted - ((m.topup && m.topup.used) || 0)) : 0;   /* unspent free to spend the person answered for: what the goal did not take is counted in the bank */
    m.bankStart = bank; bank += m.left + m.credit; m.bankEnd = bank;
    goals.forEach(gl => { bal[gl.id] += g[gl.id].actual + (g[gl.id].up || 0) - (eg && gl.id === eg.id ? m.draw : 0); });
    goals.forEach(gl => { if (gl.target > 0 && reached[gl.id] === undefined && bal[gl.id] >= capOf(gl, ym)) reached[gl.id] = ym; });
    m.spent = {};
    goals.forEach(gl => {
      m.spent[gl.id] = 0;
      if (gl.due && gl.target > 0 && ym === dueYm(gl)) { m.spent[gl.id] = Math.min(bal[gl.id], gl.target); bal[gl.id] -= m.spent[gl.id]; }
    });
    m.bal = Object.assign({}, bal);
    months.push(m); byYm[ym] = m;
  }
  applyOverspend(S, months);
  return { months, byYm, reached };
}
/* Money spent past what a month planned (Bills and basics, Free to spend), and any burrow spent below zero, comes out of the bank and stays out.
   m.overNow is this month's part, m.over the total so far, m.bankPlanned the bank before it. Every screen reads m.bankEnd, so they all agree. */
function applyOverspend(S, months) {
  const st = { edu: 0, give: 0, ffa: 0 }, has = (S.receipts || []).length > 0; let cum = 0;
  for (const m of months) {
    let inc = 0;
    if (has) {
      const rsm = receiptStats(S, m.ym), by = rsm.byJar;
      /* bills are judged line by line: a big grocery bill does not use up the rent that was not logged */
      const nl = (m.lines || []).filter(l => l.jar === 'nec');
      m.overNec = round2(nl.reduce((a, l) => a + Math.max(0, (rsm.byKey[l.key] || 0) - (l.on ? l.v : 0)), 0));
      /* a one-time cost is money already set aside in the plan: what is logged as Other is that cost being paid, and only the part past it is spent past plan */
      const it = m.itemsTotal || 0, otherOver = Math.max(0, (by.other || 0) - it), itemsLeft = Math.max(0, it - (by.other || 0));
      m.billsLeftM = round2(nl.reduce((a, l) => a + Math.max(0, (l.on ? l.v : 0) - (rsm.byKey[l.key] || 0)), 0) + itemsLeft + (m.debtPay || 0));
      /* what went past the plan, place by place; the parts add up to overNow, so a screen can name every place (38.31 number gate round 3: Other was never named) */
      const bits = { nec: m.overNec, play: round2(Math.max(0, (by.play || 0) - m.jar.play)), other: round2(otherOver), ffa: round2(Math.max(0, (by.ffa || 0) - m.jar.ffa)) };
      inc = Math.max(0, (by.play || 0) - m.jar.play) + m.overNec + otherOver + Math.max(0, (by.ffa || 0) - m.jar.ffa);
      m.ovB = {}; Object.keys(st).forEach(j => { st[j] += m.jar[j] - (j === 'ffa' ? 0 : (by[j] || 0)); if (st[j] < -0.004) { inc += -st[j]; m.ovB[j] = round2(-st[j]); bits[j] = round2((bits[j] || 0) - st[j]); st[j] = 0; } });
      m.overBits = {}; Object.keys(bits).forEach(j => { if (bits[j] > 0.004) m.overBits[j] = bits[j]; });
    }
    m.bankPlanned = m.bankEnd; m.overNow = round2(inc); m.bankStart = round2(m.bankStart - cum); cum = round2(cum + inc); m.over = cum; m.bankEnd = round2(m.bankEnd - cum);
  }
}

/* whole percents that always add up to 100: every share is rounded down, then the biggest remainders get the spare points.
   A share of nothing stays 0, so an empty jar never shows a percent. Used everywhere a set of percents is shown together. */
function wholePercents(vals, base) {
  /* whole numbers all the way through, so two shares that are truly equal are a tie, never a rounding accident. The whole numbers are cents
     (decision 1: amounts keep cents), so shares that add up to the base still do after rounding; for whole amounts the result is the same as before */
  const v = vals.map(x => Math.max(0, Math.round((+x || 0) * 100))), sum = v.reduce((a, b) => a + b, 0), bs = Math.round(base * 100);
  if (!(bs > 0) || !(sum > 0)) return v.map(() => 0);
  /* the shares are parts of the base. When they add up to more than the base (a plan paid partly with borrowed money), the whole percents still add up
     to one true figure, the rounded total, instead of each being cut down on its own and adding up to nothing in particular */
  const den = sum, total = Math.floor((den * 200 + bs) / (2 * bs));
  const out = v.map(x => Math.floor(x * total / den)), rem = v.map((x, i) => x * total - out[i] * den);
  const left = total - out.reduce((a, b) => a + b, 0);
  v.map((x, i) => i).filter(i => v[i] > 0).sort((i, j) => rem[j] - rem[i] || i - j).slice(0, Math.max(0, left)).forEach(i => { out[i]++; });
  return out;
}
/* How a month's money splits across the six jars. One idea: all of your pay goes into the jars, and each percent is that jar's amount divided by your pay.
   "rest" is pay that has no jar yet. When the plan spends more than comes in there is no rest, "short" says by how much, and the percents are shares of
   what the plan spends, so they still add up to 100. */
function jarsOf(S, m) {
  const dw0 = m.draw || 0, inn = m.pool.in, out = m.pool.out, rest = Math.max(0, inn - out), short = Math.max(0, out - inn), base = short > 0 ? out : (dw0 > 0 && inn - dw0 > 0 ? inn - dw0 : inn);   /* percents are shares of real pay, never of borrowed money */
  const restCover = Math.min(rest, m.draw || 0), unpR = Math.max(0, rest - restCover), usedOver = Math.min(unpR, m.overNow || 0), restKept = Math.max(0, restCover - Math.max(0, (m.overNow || 0) - unpR));   /* borrowed money not used up by spending past plan stays in the bank */   /* borrowed money that went to overspending, not pay left over */
  const vals = { nec: m.jar.nec, lts: m.goalsTotal, play: m.jar.play, edu: m.jar.edu, ffa: m.jar.ffa, give: m.jar.give };
  const pcts = wholePercents(JARS.map(j => vals[j.id]).concat([rest - restCover - usedOver, usedOver]), base);   /* not placed and used for spending past plan each get their percent, so the shown set adds to 100 (side A, 2026-11-19) */
  /* borrowed money that pays for part of the plan. The places are shown as shares of real pay, so with borrowed money in the plan they add up to more
     than 100: placedPct says how much, and borrowUsedPct is the part past 100. Places + not placed = 100 + borrowed, always. */
  const realPay = inn - dw0, borrowUsed = short > 0 ? 0 : Math.max(0, dw0 - restCover), sumPct = pcts.reduce((a, b) => a + b, 0), restAll = pcts[6] + pcts[7];
  const borrowUsedPct = borrowUsed > 0 && base === realPay ? Math.max(0, sumPct - 100) : 0;
  /* named amounts the screens show (they never work these out themselves) */
  const unplaced = Math.max(0, rest - restCover), unplacedNet = round2(rest - restCover - usedOver), exceedsBy = short + dw0;
  const restSpent = round2(restCover - restKept);   /* borrowed money in the bank that spending past plan has used; restKept + restSpent + borrowUsed = all that was borrowed, each its own row on Plan */
  return { income: base, inn, out, rest, restCover, restKept, restSpent, usedOver, short, draw: m.draw || 0, over: short > 0, restPct: pcts[6], usedOverPct: pcts[7],
    realPay, borrowUsed, borrowUsedPct, placedPct: sumPct - restAll, unplaced, unplacedNet, exceedsBy,
    list: JARS.map((j, i) => ({ id: j.id, name: j.name, usual: Math.round(j.usual * 100), v: vals[j.id], pct: pcts[i] })) };
}

/* Decision 2 (Mako, 2026-11-18): when the bank ends a month below zero, Home says so in one plain amber line, naming the month, the amount and the
   causes the model knows. Each cause is an amount; a screen only picks the words. null when the bank does not end below zero.
     by          how far below zero the bank ends
     startBelow  how far below zero the month starts (0 when it starts at or above zero)
     adds        what the month adds to the bank (0 when it takes away)
     planGap     how much more the month plans to spend than comes in (0 when it does not)
     overNow     spending past the plan this month, which came out of the bank
     overBefore  spending past the plan in earlier months, already in the starting figure
   by = startBelow - adds + (what the month takes away), so the parts always explain the whole. */
function belowZeroOf(m) {
  if (!(m.bankEnd < -0.004)) return null;
  const change = round2(m.bankEnd - m.bankStart);
  return { by: round2(-m.bankEnd), startBelow: m.bankStart < 0 ? round2(-m.bankStart) : 0, adds: change > 0 ? change : 0, takes: change < 0 ? round2(-change) : 0,
    planGap: m.pool.left < 0 ? round2(-m.pool.left) : 0, overNow: m.overNow || 0, overBefore: round2((m.over || 0) - (m.overNow || 0)) };
}
const statusOf = (S, m) => (m.bankEnd < cfg(S, 'minBank') ? 'short' : (m.pool.left < 0 ? 'tight' : 'good'));

function goalInfo(S, C, id, ym) {
  const g = goalById(S, id), m = C.byYm[ym], target = capOf(g, ym), bal = m.bal[id];
  const reached = C.reached[id] || null, rb = readyBy(g);
  let state = 'none', need = null, slack = null, had = null;
  const doneMonth = dueYm(g);
  if (target <= 0) state = 'unset';
  else if (doneMonth && ym >= doneMonth) { had = (C.byYm[doneMonth] && C.byYm[doneMonth].spent[id]) || 0; state = had >= target ? 'paid' : 'short'; }
  else if (rb) {
    state = reached && reached <= rb ? (bal >= target ? 'full' : 'ontrack') : 'behind';
    slack = reached ? ymIdx(rb) - ymIdx(reached) : null;
    if (ym <= rb) need = Math.max(0, Math.ceil((target - m.balBefore[id]) / ymCount(ym, rb)));
  } else state = bal >= target ? 'full' : (reached ? 'eta' : 'noeta');
  /* pctWhole is the one whole percent shown for a goal anywhere: rounded down, and 100 only when it is really full.
     togo counts to the same target as pct (the longer emergency goal once the person said yes to it), so every screen says one amount */
  return { id, target, bal, pct: target > 0 ? Math.min(1, bal / target) : 0, pctWhole: wholePct(bal, target), togo: Math.max(0, target - bal), reached, readyBy: rb, state, need, slack, had };
}

/* a rounding step that fits the size of the number */
const niceStepFor = x => (x >= 20000 ? 1000 : x >= 3000 ? 100 : 10);

/* what to do when a month is short */
function fixes(S, m) {
  const out = []; const floor = cfg(S, 'minBank'), play = m.jar.play;
  const gap = Math.max(0, floor - m.bankEnd);
  /* lowering the plan can only fix the part of the gap the plan causes; money already spent past the plan stays spent */
  /* earlier months' spending past plan is already in this month's starting bank and cannot be undone either: only this month's own past-plan
     spending is added back (38.31 number gate: it added back every month's, so "Spend 235,000 instead" left the bank under the minimum) */
  const planGap = Math.max(0, floor - (m.bankEnd + (m.overNow || 0)));
  /* the exact amount that keeps the bank at the minimum: the same figure Home shows as safe to spend, not a rounder one beside it (38.31 number gate round 4: Home said 88,500, the fix 88,000) */
  if (planGap > 0) { const ne = round2(play - planGap); if (ne >= 0 && ne < play) out.push({ id: 'trim', amount: ne }); }
  const eg = emergencyGoal(S), room = eg ? Math.max(0, m.balBefore[eg.id] - m.draw) : 0;
  if (gap > 0 && room > 0) out.push({ id: 'borrow', amount: round2(Math.min(room, gap)) });
  return out;
}
/* make the Play jar add up to "target" for one month, taking from the first line first */
function trimPlay(S, m, ym, target) {
  let need = m.jar.play - target;
  m.lines.filter(x => x.jar === 'play' && x.on).forEach(x => { if (need <= 0) return; const cut = Math.min(x.v, need); setVal(S, x.key, ym, x.v - cut, 'once'); need -= cut; });
}
/* unspent free to spend of a month put toward a goal: that month's play lines go down by the amount and the goal's deposit goes up by it,
   both for that month only, so the month's money out is unchanged and the goal is simply fuller. Returns what was moved. */
function sweepPlay(S, ym, goalId, amount) {
  VIRT_OFF = true; try { return sweepPlay0(S, ym, goalId, amount); } finally { VIRT_OFF = false; }
}
function sweepPlay0(S, ym, goalId, amount) {
  const g = goalById(S, goalId), m = calcAll(S).byYm[ym]; if (!g || !m) return 0;
  const room = Math.max(0, capOf(g, ym) - m.balBefore[g.id] - (m.g[g.id] ? m.g[g.id].actual : 0));
  let need = Math.max(0, Math.min(flrCur(S, +amount || 0), m.jar.play, room)); const moved = need; if (!(need > 0)) return 0;
  LAST_CUTS = [];
  m.lines.filter(x => x.jar === 'play' && x.on).forEach(x => { if (need <= 0) return; const cut = Math.min(x.v, need); if (cut > 0) LAST_CUTS.push({ key: x.key, cut }); setVal(S, x.key, ym, x.v - cut, 'once'); need -= cut; });
  setVal(S, 'goal:' + g.id, ym, val(S, 'goal:' + g.id, ym) + moved, 'once');
  return moved;
}
/* a goal top-up is only the answer while the plan still looks the way the top-up left it: if the person has since edited those lines
   (or used Undo all), the old answer no longer describes the plan, so the question comes back with the real numbers */
function sweepFp(S, ym, en) { return (en.cuts || []).map(c => val(S, c.key, ym)).join(',') + '|' + val(S, 'goal:' + en.id, ym); }
function sweepAns(S, ym) { const en = S.ui && S.ui.sweep && S.ui.sweep[ym]; if (en && en.id && typeof en.fp === 'string' && sweepFp(S, ym, en) !== en.fp) return null; return en || null; }
let LAST_CUTS = [];   /* what the last sweepPlay took from each free to spend line, so it can be put back exactly */
/* put back only what a sweep moved: later edits to the same lines or goal are kept */
function unsweepPlay(S, ym, goalId, amount, cuts) {
  (cuts || []).forEach(c => { if (lineByKey(S, c.key)) setVal(S, c.key, ym, val(S, c.key, ym) + c.cut, 'once'); });
  if (goalById(S, goalId)) setVal(S, 'goal:' + goalId, ym, Math.max(0, val(S, 'goal:' + goalId, ym) - amount), 'once');
}

/* unspent free to spend of a past month, answered with a choice: kept in the bank, or added to a later month's free to spend.
   That month's play lines go down by the amount (so the bank counts it), and for 'next' the later month's first play line goes up by it. Returns what was moved. */
function releasePlay(S, ym, to, toYm, amount) {
  VIRT_OFF = true; try { return releasePlay0(S, ym, to, toYm, amount); } finally { VIRT_OFF = false; }
}
function releasePlay0(S, ym, to, toYm, amount) {
  const m = calcAll(S).byYm[ym]; if (!m) return 0;
  let need = Math.max(0, Math.min(Math.floor(+amount || 0), m.jar.play)); const moved = need; if (!(need > 0)) return 0;
  let target = null;
  if (to === 'next') { const m2 = calcAll(S).byYm[toYm]; target = m2 && m2.lines.find(x => x.jar === 'play' && x.on); if (!target) return 0; }
  m.lines.filter(x => x.jar === 'play' && x.on).forEach(x => { if (need <= 0) return; const cut = Math.min(x.v, need); setVal(S, x.key, ym, x.v - cut, 'once'); need -= cut; });
  if (target) setVal(S, target.key, toYm, target.v + moved, 'once');
  return moved;
}

/* ---- receipts ---- */
/* the one place a line's shown name is decided: the learning line is called Education wherever money is named (38.31 number gate round 3) */
const shownLine = n => (n === 'Courses and books' ? 'Education' : n);
const catName = (S, r) => { if (r.c === 'other') return 'Other'; const l = lineByKey(S, r.c); return l ? shownLine(l.name) : (r.cn || 'Other'); };
function receiptsFor(S, ym) {
  return (S.receipts || []).filter(r => r.d.slice(0, 7) === ym).sort((x, y) => (x.d === y.d ? (x.id < y.id ? 1 : -1) : (x.d < y.d ? 1 : -1)));
}
function receiptStats(S, ym) {
  const list = receiptsFor(S, ym), byKey = {}, byJar = {}; let total = 0;
  list.forEach(r => {
    total += r.a; byKey[r.c] = (byKey[r.c] || 0) + r.a;
    const l = lineByKey(S, r.c), j = l ? l.jar : 'other'; byJar[j] = (byJar[j] || 0) + r.a;
  });
  Object.keys(byKey).forEach(k => { byKey[k] = round2(byKey[k]); }); Object.keys(byJar).forEach(k => { byJar[k] = round2(byJar[k]); });
  return { list, total: round2(total), count: list.length, byKey, byJar };
}
const RM_IDS = new Set();   /* receipts removed in this tab, so a merge with another tab never brings one back */
const wholeAmt = (S, a) => ((S.ui && S.ui.cur) === '¥' ? Math.round(+a) : round2(+a));
function addReceipt(S, d, a, c, n) {
  a = wholeAmt(S, a); if (!(a > 0) || a > 1e9 || !validDate(d)) return null;
  const l = lineByKey(S, c), key = l ? c : 'other';
  const r = { id: newId(S, 'r', x => (S.receipts || []).some(q => q.id === x)), d, a, c: key, cn: l ? l.name : 'Other', n: (n || '').trim().slice(0, 80) };
  (S.receipts = S.receipts || []).push(r); return r.id;
}
function updateReceipt(S, id, d, a, c, n) {
  const r = (S.receipts || []).find(x => x.id === id); a = wholeAmt(S, a); if (!r || !(a > 0) || a > 1e9 || !validDate(d)) return false;
  const l = lineByKey(S, c); r.d = d; r.a = a; r.c = l ? c : 'other'; r.cn = l ? l.name : 'Other'; r.n = (n || '').trim().slice(0, 80); return true;
}
function removeReceipt(S, id) { RM_IDS.add(id); const n = (S.receipts || []).length; S.receipts = (S.receipts || []).filter(x => x.id !== id); return S.receipts.length < n; }
const validDate = d => { if (typeof d !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return false; const t = new Date(d + 'T00:00:00Z'); return !isNaN(t) && t.toISOString().slice(0, 10) === d; };

/* ===== THE VIEWS =====
   Everything a screen shows is worked out here, from calcAll and goalInfo, as plain numbers and words. The screens only draw what these return,
   so there is one set of numbers in the whole page. They have their own test against an independent recomputation. ===== */
const wholePct = (v, t) => (t > 0 ? (v >= t ? 100 : Math.min(99, Math.max(0, Math.floor(v * 100 / t)))) : 0);
const GOAL_DEFAULT_NAME = { rainy: 'Emergency fund', travel: 'Trip', moving: 'Home or move', buy: 'Big purchase', car: 'Yearly cost', debt: 'Pay off debt', other: 'Something else' };
/* what each kind of goal is for, said as an aim, never as if it were done (38.31 wording round 3: "Emergencies covered" showed at 31%) */
const PURPOSE_OF_KIND = { rainy: 'Saving for emergencies', travel: 'Saving for a trip', moving: 'Saving for a move', buy: 'Saving to pay in cash', car: 'Saving for a yearly bill', debt: 'Paying off a debt', other: '' };
const PURPOSE_VERBS = /^(buy|get|build|start|take|go|pay|visit|learn|fix|move|plan|book|host|open|join|make|finish|upgrade|replace|renew|fund|cover|see|send|adopt|rent|own|throw|celebrate|travel|clear|write|launch|hire|support|invest|surf|ride|run|swim|climb|dive|drive|fly|marry|study|train|enrol|enroll|treat|gift|surprise|retire|quit)\b/i;
const isDebtGoal = (S, id) => { const g = goalById(S, id); return !!g && kindOfGoal(S, g) === 'debt'; };
const kindOfGoal = (S, g) => { if (g.emergency) return 'rainy'; const gk = (S.ui && S.ui.gk) || {}; return gk[g.id] || (Object.prototype.hasOwnProperty.call(PURPOSE_OF_KIND, g.id) ? g.id : 'other'); };
/* the plain sentence under a goal: what the money will let the person do. Built-in wording here; a line written by Claude for a custom goal replaces it on screen. */
/* a debt reads as paid off and still owed, never full or to go (money); times stay as they are */
const debtWords = s => String(s).replace(/Not full/g, 'Not paid off').replace(/not full/g, 'not paid off').replace(/\bFull\b/g, 'Paid off').replace(/\bfull\b/g, 'paid off').replace(/(?<!months?) to go\b/g, ' still owed').replace(/Filling/g, 'Paying').replace(/Saved so far/g, 'Paid off so far').replace(/planned of/g, 'paid off of');
const dw = (S, g, s) => (g && kindOfGoal(S, g) === 'debt') ? debtWords(s) : s;
const dwr = (r, s) => (r && r.kind === 'debt') ? debtWords(s) : s;
function purposeOf(S, g) {
  const name = String(g.name || '').replace(/\s+/g, ' ').trim(), kind = kindOfGoal(S, g);
  if (kind === 'rainy') return PURPOSE_OF_KIND.rainy;
  if (kind === 'debt' && name && name !== GOAL_DEFAULT_NAME.debt && !PURPOSE_VERBS.test(name)) return 'Paying off ' + name;
  if (PURPOSE_OF_KIND[kind] && (!name || name === GOAL_DEFAULT_NAME[kind])) return PURPOSE_OF_KIND[kind];
  if (!name) return 'Saving for a goal';
  if (PURPOSE_VERBS.test(name)) return 'Saving to ' + name.charAt(0).toLowerCase() + name.slice(1);
  return 'Saving for ' + name;   /* an aim, never said as if done (38.31 wording round 3) */
}
function goalRows(S, C, ym) {
  const ix = ymIdx(ym);
  return S.plan.goals.map(g => {
    const gi = goalInfo(S, C, g.id, ym), live = g.target > 0 && gi.state !== 'paid' && gi.state !== 'short';
    return { id: g.id, name: g.name, slot: g.slot, kind: kindOfGoal(S, g), emergency: !!g.emergency, target: gi.target, saved: gi.bal, togo: Math.max(0, gi.target - gi.bal), pct: wholePct(gi.bal, gi.target), state: gi.state,
      reached: gi.reached, months: gi.reached ? Math.max(0, ymIdx(gi.reached) - ix) : null, need: gi.need, slack: gi.slack, due: g.due || null, readyBy: gi.readyBy, had: gi.had, live,
      /* does anything go in before the plan ends? A goal getting nothing is "not growing", never "over 2 years" (38.31 north-star round 4) */
      grows: ((C.months[C.months.length - 1] || { bal: {} }).bal[g.id] || 0) > gi.bal + 0.004 };
  });
}
/* the one main goal: the person's pick if it is still being saved for, otherwise the nearest one (the emergency fund goes last, a finished goal after that) */
function pickMain(S, rows) {
  const all = rows.filter(r => r.target > 0); if (!all.length) return null;
  const want = S.ui && S.ui.main, chosen = want && all.find(r => r.id === want && r.live); if (chosen) return chosen;
  const live = all.filter(r => r.live), pool = live.length ? live : all;
  const score = r => (r.emergency ? 1000 : 0) + (r.pct >= 100 ? 4000 : 0) + (r.reached ? ymIdx(r.reached) - ymIdx(START) : 600);
  return pool.slice().sort((a, b) => score(a) - score(b))[0];
}
/* "today" only decides which day of the month it is; pass a YYYY-MM-DD string */
function viewOf(S, C, ym, today) {
  const m = C.byYm[ym], rs = receiptStats(S, ym), goals = goalRows(S, C, ym), main = pickMain(S, goals);
  const dim = new Date(+ym.slice(0, 4), +ym.slice(5, 7), 0).getDate(), dayN = today && today.slice(0, 7) === ym ? +today.slice(8, 10) : 1, daysLeft = Math.max(1, dim - dayN + 1);
  const planPlay = m.jar.play, spentPlay = rs.byJar.play || 0, leftPlay = round2(planPlay - spentPlay), pace = planPlay * dayN / dim;
  const play = { planned: planPlay, spent: spentPlay, left: leftPlay, over: leftPlay < 0, overBy: leftPlay < 0 ? round2(-leftPlay) : 0, count: rs.count, daysLeft, dim, dayN,
    frac: planPlay > 0 ? Math.min(1, spentPlay / planPlay) : 1, dayFrac: Math.min(1, dayN / dim), ahead: leftPlay >= 0 && spentPlay > pace * 1.15 + 1,
    perWeek: daysLeft >= 4 ? Math.max(0, leftPlay) / (daysLeft / 7) : null };
  const goalsSaved = sum(Object.keys(m.bal).filter(id => !isDebtGoal(S, id)).map(id => m.bal[id]));   /* a debt goal is money paid away, not saved (LAUNCH_CHECKLIST A3) */
  let ffaSoFar = 0; for (const x of MONTHS) { if (x > ym) break; ffaSoFar += C.byYm[x].jar.ffa; }
  const buckets = JARS.map(j => {
    if (j.id === 'lts') return { id: j.id, name: j.name, kind: 'save', planned: m.goalsTotal, spent: 0, left: null, total: goalsSaved };
    if (j.id === 'ffa') return { id: j.id, name: j.name, kind: 'save', planned: m.jar.ffa, spent: 0, left: null, total: ffaSoFar };
    const planned = m.jar[j.id], spent = rs.byJar[j.id] || 0;
    return { id: j.id, name: j.name, kind: 'spend', planned, spent, left: round2(planned - spent), total: null };
  });
  /* bankStart, bankChange and overNow were missing here in 38.30, so Home could never say "Building your cushion" or "went past the plan this month" */
  const month = { inflow: m.inflow, out: m.out, left: m.left, bankStart: m.bankStart, bankEnd: m.bankEnd, bankChange: round2(m.bankEnd - m.bankStart), over: m.over || 0, overNow: m.overNow || 0, overBits: m.overBits || {}, status: statusOf(S, m) };
  month.belowZero = belowZeroOf(m);
  const map = mapOf(S, C, ym, { play, month, goals }), nec = buckets.find(x => x.id === 'nec'), pcl = planCells(S, C, ym), dwv = m.draw || 0;
  /* HOME CELLS: the worked-out amounts Home shows, each defined once here. Screens read them; they never do the sum.
     A pile tile (Education, Giving) spent past this month's amount: how much past, how much of that the bank pays, how much the pile covered. */
  const tileOf = id => { const x = buckets.find(q => q.id === id), br = map.burrows.find(r => r.id === id); if (!x || !(x.left < 0)) return { over: 0, bank: 0, pile: 0 }; const over = round2(-x.left), bank = Math.min(-x.left, br ? (br.overBy || 0) : -x.left); return { over, bank, pile: round2(over - bank) }; };
  const cells = {
    planSpend: -m.left,                                   /* what the plan spends when no pay is entered (shown only then) */
    unplaced: pcl.unplaced, overPay: pcl.overPay,         /* pay with no place; how much more than the pay the month plans */
    billsOverPay: nec.planned - (m.inflow - dwv),         /* how far the pay is under the bills (shown only when it is) */
    freeOver: map.free < 0 ? round2(-map.free) : 0,       /* Free to spend that came out of the bank */
    perWeek: play.perWeek != null ? Math.max(0, map.free) / (play.daysLeft / 7) : null,   /* safe Free to spend a week for the days left */
    perDay: map.free > 0 && play.daysLeft > 0 ? map.free / play.daysLeft : null,
    edu: tileOf('edu'), give: tileOf('give'),
    otherPlaces: m.jar.play + m.jar.edu + m.jar.ffa + m.jar.give, leftAbs: Math.abs(m.left)   /* for the window that explains the month */
  };
  return { ym, main, goals, live: goals.filter(r => r.live).length, play, buckets, otherSpent: rs.byJar.other || 0, month, map, cells };
}
const overspendUpTo = (S, C, ym) => (C.byYm[ym] ? C.byYm[ym].over : 0);
/* Free to spend: the free to spend left, less what is held back so the balance stays above its minimum. One rule, used by every screen that shows the number. */
function freeOf(S, mv, p) {
  /* a short month holds back Free to spend unless the month really adds to the bank (38.31 money accuracy round: a month that starts under the
     minimum and adds nothing showed Free to spend next to "Short") */
  const adds = (mv.bankStart != null ? round2(mv.bankEnd - mv.bankStart) : mv.bankChange) > 0.004;
  const held = mv.status === 'short' && !adds ? Math.min(Math.max(0, p.left), Math.max(0, cfg(S, 'minBank') - mv.bankEnd)) : 0;
  return { held, free: Math.max(p.left < 0 ? p.left : 0, round2(p.left - held)) };
}
/* The burrow map Home draws, from the plan and the receipts (no bank balance yet; real balances come with pay day).
   Bills and basics and Free to spend are this month's money, shown as what is left. Every burrow is money that piles up: the goals, and
   Education, Giving and Investing as running totals from the start of the plan (planned in, minus what was logged). Totals include what is planned for this month. */
function mapOf(S, C, ym, V0) {
  const m = C.byYm[ym], rs = receiptStats(S, ym), p = V0.play, fo = freeOf(S, V0.month, p);
  const planNec = m.jar.nec, billsLeft = m.billsLeftM != null ? m.billsLeftM : Math.max(0, round2(planNec - (rs.byJar.nec || 0)));
  const st = { edu: 0, give: 0, ffa: 0 }, pl = { edu: 0, give: 0, ffa: 0 }, lg = { edu: 0, give: 0, ffa: 0 };
  for (const x of MONTHS) {
    if (x > ym) break;
    const by = x === ym ? rs.byJar : receiptStats(S, x).byJar;
    Object.keys(st).forEach(j => { pl[j] += C.byYm[x].jar[j]; lg[j] += by[j] || 0; st[j] += j === 'ffa' ? Math.max(C.byYm[x].jar[j], by[j] || 0) : C.byYm[x].jar[j] - (by[j] || 0); if (x < ym && st[j] < 0) st[j] = 0; });   /* a burrow overspent in an earlier month was paid from the bank then, so it starts again at zero (never taken twice). Investing is money put in and never spent, so a logged amount is the plan done, not money out */
  }
  const month = [
    { id: 'nec', name: 'Bills and basics', amount: billsLeft, sub: 'left to pay', planned: planNec, fill: planNec > 0 ? Math.min(1, billsLeft / planNec) : 0, overBy: m.overNec != null ? m.overNec : round2(Math.max(0, (rs.byJar.nec || 0) - planNec)) },
    { id: 'play', name: 'Free to spend', amount: Math.max(0, fo.free), sub: 'safe to spend', planned: m.jar.play, fill: m.jar.play > 0 ? Math.max(0, Math.min(1, fo.free / m.jar.play)) : 0, over: fo.free < 0, overBy: fo.free < 0 ? round2(-fo.free) : 0 }
  ];
  const names = { edu: 'Education', give: 'Giving', ffa: 'Investing' }, subs = { edu: 'courses and books', give: 'charity and gifts', ffa: 'never spent' };
  const burrows = ['edu', 'ffa', 'give'].map(id => {
    const bal = round2(st[id]), monthly = m.jar[id];
    return { id, name: names[id], amount: Math.max(0, bal), overBy: bal < -0.004 ? round2(-bal) : 0, sub: subs[id], monthly, planned: round2(pl[id]), logged: round2(lg[id]), loggedPast: round2(round2(lg[id]) - round2(pl[id])), over: bal < -0.004,
      fill: monthly > 0 ? Math.max(0, Math.min(1, bal / (monthly * 6))) : (bal > 0 ? .5 : 0) };
  }).filter(r => r.monthly > 0 || r.amount > 0);
  /* the pile in every room is drawn against the biggest room, so a bigger pile means more money (square root, so the small ones still show) */
  const maxA = Math.max(1, ...month.map(r => r.amount), ...burrows.map(r => r.amount));
  month.concat(burrows).forEach(r => { r.fill = r.amount > 0 ? Math.min(1, Math.sqrt(r.amount / maxA)) : 0; });
  /* money put toward a "Pay off a debt" goal has left: it is paid off, not saved, so it is not in Saved or Total (LAUNCH_CHECKLIST A3) */
  const goalsSaved = round2(sum(Object.keys(m.bal).filter(id => !isDebtGoal(S, id)).map(id => m.bal[id]))), saved = round2(goalsSaved + sum(burrows.map(r => r.amount)));
  /* what is owed at the end of the month: cards and loans still owed, plus what every debt goal still has to pay (LAUNCH_CHECKLIST A4) */
  const owed = round2(sum(Object.keys(m.debts || {}).map(id => Math.max(0, m.debts[id].bal))) + sum((V0.goals || []).filter(g => g.kind === 'debt').map(g => g.togo)));
  /* spending past what was planned comes out of the bank, so the bank and the total stay true to the receipts */
  const overspent = m.over || 0, bankEnd = m.bankEnd;
  /* the pay strip: real pay against what the plan places. Pay with no place is its own piece (less what spending past plan already used); a plan bigger than the pay says by how much */
  const payReal = Math.max(0, m.inflow - (m.draw || 0)), placed = m.out, gap0 = round2(payReal - placed), usedOver = Math.min(Math.max(0, gap0), m.overNow || 0), payGap = round2(gap0 - usedOver), planOver = payGap < -0.5 ? round2(-payGap) : 0;
  return { ym, free: fo.free, held: fo.held, overspent, billsLeft, billsPlanned: planNec, goalsSaved, saved, bankEnd, bankBelow: bankEnd < 0 ? round2(-bankEnd) : 0, total: round2(bankEnd + saved), owed, month, burrows,
    payReal, placed, payGap, usedOver, planOver,
    goalParts: (V0.goals || []).filter(g => g.live !== false || ((m.g[g.id] && m.g[g.id].actual) || 0) > 0).map(g => ({ id: g.id, name: g.name, slot: g.slot, debt: g.kind === 'debt', saved: g.saved, plan: (m.g[g.id] && m.g[g.id].actual) || 0 })),
    split: ['nec', 'lts', 'play', 'edu', 'ffa', 'give'].map(id => ({ id, amount: id === 'lts' ? (m.goalsTotal || 0) : (m.jar[id] || 0) })).filter(x => x.amount > 0) };
}
/* the goal wizard's suggestion: what is still missing, spread evenly over n months and rounded up to the plan's unit (the same rule as evenSave) */
function wizardMonthly(S, cost, saved, n) { const rem = Math.max(0, clampAmt(cost) - clampAmt(saved)), u = roundUnit(S); return n > 0 ? Math.ceil(rem / n / u) * u : 0; }

/* a category spent past its plan: how much past (over), how much of it the bank pays (bank) and how much its own pile covered (pile). Only Education and Giving have a pile. */
function overParts(m, jar, spent, plan) { const over = round2(spent - plan), soft = jar === 'edu' || jar === 'give'; if (!soft) return { over, bank: over, pile: 0, soft }; const bank = round2(Math.min(over, ((m && m.ovB) || {})[jar] || 0)); return { over, bank, pile: round2(over - bank), soft }; }
/* the most that can be moved into a burrow from Free to spend: whole units, no more than is left to spend and no more than the burrow has room for */
const moveCap = (target, saved, left) => Math.max(0, Math.min(Math.floor(left), Math.max(0, Math.ceil(target - saved))));
/* the total of a list of receipts (for the statement review: what the new receipts add up to) */
const receiptsTotal = list => round2(sum((list || []).map(r => +r.a || 0)));
/* what is left of a planned amount after what was logged against it */
const leftOfPlan = (plan, spent) => round2(plan - spent);

/* ---- SETUP CELLS: the amounts the setup tour shows while the plan is made (its figures are the first month's). Screens read these; they never do the sum. ---- */
function setupCells(S) {
  const pay = val(S, 'a', START) + val(S, 'b', START) + val(S, 'side', START);            /* pay in the first month: salary, second and side income */
  const nec = sum(linesOf(S).filter(l => l.jar === 'nec').map(l => val(S, l.key, START)));   /* every bill in the first month */
  const billsFor = {}; [1, 3, 6].forEach(n => { billsFor[n] = n * nec; });                  /* n months of bills: the usual emergency fund sizes */
  const togo = {}; goalsOf(S).forEach(g => { togo[g.id] = Math.max(0, g.target - g.start); });   /* what a goal still needs, from what is already saved */
  return { pay, nec, billsOverPay: nec - pay, payOverBills: pay - nec, billsFor, togo, ltsPct: Math.round(aimsOf(S).lts * 100) };
}
/* what the plan adds up to in a month, for the end of the setup tour. hasPay: the person has entered pay */
function planFactsOf(S, C, ym, hasPay) {
  const m = C.byYm[ym], J = jarsOf(S, m), inc = J.inn, L = m.pool.left, play = m.jar.play;
  const tol = 0.005, bills = m.jar.nec,   /* any pay not placed is named: "all pay is placed" only when it really is (38.31 money accuracy round 3) */ goals = m.goalsTotal, other = m.jar.edu + m.jar.ffa + m.jar.give;
  const st = !hasPay ? 'nopay' : L < 0 ? 'over' : L >= tol ? 'spare' : 'even';
  return { m, J, inc, L, play, tol, bills, goals, other, st, billPct: inc > 0 ? bills / inc : 0,
    pay: m.a + m.b + m.side,          /* pay entered for the month, without borrowed money */
    shortBy: L < 0 ? -L : 0 };        /* how much more the month plans than comes in (shown only when it does) */
}
/* the month-end question, "Put it toward a goal": what moves is last month's unspent Free to spend (m.pendLeft), cut to what the goal still has room
   for after that month's own saving. The same room rule calcAll applies to the stored answer, so the toast and the goal agree */
function topupFit(S, C, pm, id) {
  const m = C.byYm[pm], g = goalById(S, id); if (!m || !g || !m.g[id]) return 0;
  const room = Math.max(0, capOf(g, pm) - m.balBefore[id] - m.g[id].actual);
  return Math.min(flrCur(S, m.pendLeft || 0), round2(room));
}
/* a split being made on a setup screen (percent shares that are not saved yet): the part not given out, and how far the share being moved has gone */
function splitDraft(vals, total, from, i) {
  const free = total - sum(vals), d = i >= 0 ? vals[i] - from : 0;
  return { free, moved: Math.abs(d), up: d > 0, down: d < 0 };
}
/* ---- PLAN CELLS: every worked-out amount the Plan tab and the dock at the foot of the page show. Screens read these; they never do the sum. ---- */
function planCells(S, C, ym) {
  const m = C.byYm[ym], rs = receiptStats(S, ym), dw = m.draw || 0, L = m.pool.left, over = m.overNow || 0;
  const play = m.jar.play, playSpent = rs.byJar.play || 0;
  let dock = dw > 0 ? L - dw : L;                  /* money borrowed from the emergency fund is not pay */
  if (dock > 0) dock = Math.max(0, dock - over);   /* and pay with no place that spending past plan already used is not left */
  return {
    pay: m.pool.in - dw,                           /* real pay this month: what came in, less what was borrowed */
    unplaced: Math.max(0, (L - dw) - over),        /* pay with no place, less what spending past plan already took from it */
    overPay: -(L - dw),                            /* how much more than the pay the month plans to spend (shown in a tight month) */
    bankGap: Math.max(0, cfg(S, 'minBank') - m.bankEnd),   /* how far the bank ends under the safety minimum */
    bankBelowZero: -m.bankEnd,                     /* how far below zero the bank ends (shown only when it is) */
    dock, dockAbs: Math.abs(dock),                 /* the dock number: pay not placed yet, or (when negative) how much more is planned than the pay */
    playOver: round2(playSpent - play)             /* Free to spend logged past its plan (shown only when it is) */
  };
}

/* THE PROOF. Where the money sits must equal where the money came from, less what left. The two sides are worked out apart from each other:
     sits:  the bank + every goal + the Education, Giving and Investing piles at the end of the month (what the screens show, from mapOf)
     came:  what there was at the start + all pay so far - everything that left, added up here from the plan and the raw receipts, in whole cents
   What leaves: bills, one-time costs and debt payments as planned (taken as paid), anything logged past a bill or past the one-time costs,
   Free to spend as planned (taken as spent) plus anything logged past it, less unspent Free to spend the person has answered for (it went back
   to the bank or to a goal), what was logged from Education and Giving, and goal money spent on its date. Investing never leaves; money borrowed
   from the emergency fund only moves. If the two sides differ, a number on a screen is wrong, and the page says so instead of showing it as true. */
function proofOf(S, C, ym, map0) {
  const c = x => Math.round((+x || 0) * 100), goals = goalsOf(S), has = (S.receipts || []).length > 0;
  /* a debt goal's "already paid off" was never money held, and what is put toward it leaves (paid to the lender, LAUNCH_CHECKLIST A3) */
  const part = { start: c(cfg(S, 'bankStart')) + goals.filter(g => !isDebtGoal(S, g.id)).reduce((a, g) => a + c(g.start), 0), debtGoals: 0, pay: 0, planned: 0, past: 0, free: 0, back: 0, piles: 0, goals: 0 };
  let pend = 0; const pendMonths = [];
  for (const x of MONTHS) {
    if (x > ym) break;
    const m = C.byYm[x], byKey = {}, byJar = {};
    if (has) (S.receipts || []).forEach(r => { if (r.d.slice(0, 7) !== x) return; const l = lineByKey(S, r.c), j = l ? l.jar : 'other'; byKey[r.c] = (byKey[r.c] || 0) + c(r.a); byJar[j] = (byJar[j] || 0) + c(r.a); });
    let necPlan = 0, necPast = 0, playPlan = 0;
    m.lines.forEach(l => { const v = l.on ? c(l.v) : 0; if (l.jar === 'nec') { necPlan += v; necPast += Math.max(0, (byKey[l.key] || 0) - v); } else if (l.jar === 'play') playPlan += v; });
    const items = c(m.itemsTotal);
    part.pay += c(m.a) + c(m.b) + c(m.side);
    part.planned += necPlan + items + c(m.debtPay);
    part.past += necPast + Math.max(0, (byJar.other || 0) - items) + Math.max(0, (byJar.play || 0) - playPlan);
    part.free += playPlan; part.back += c(m.counted);
    part.piles += (byJar.edu || 0) + (byJar.give || 0);
    goals.forEach(g => { if (!isDebtGoal(S, g.id)) part.goals += c(m.spent[g.id]); else part.debtGoals += c(m.spent[g.id]); });
    if (m.pendLeft > 0) { pend += c(m.pendLeft); pendMonths.push(x); }
  }
  /* paid toward debt goals: everything that went in after "already paid off" (what is there now, less the start, plus anything taken out on its date) */
  goals.forEach(g => { if (isDebtGoal(S, g.id)) part.debtGoals += c(C.byYm[ym].bal[g.id]) - c(g.start); });
  const came = part.start + part.pay - part.planned - part.past - part.free + part.back - part.piles - part.goals - part.debtGoals;
  const map = map0 || viewOf(S, C, ym).map, sits = c(map.total), sitsParts = c(map.bankEnd) + c(map.goalsSaved) + map.burrows.reduce((a, b) => a + c(b.amount), 0);
  const off = sits - came;
  return { ok: off === 0 && sitsParts === sits, off: off / 100, offBy: Math.abs(off) / 100, sits: sits / 100, came: came / 100, partsOk: sitsParts === sits,
    start: part.start / 100, pay: part.pay / 100, left: (part.planned + part.past + part.free - part.back + part.piles + part.goals + part.debtGoals) / 100,
    pendAmount: pend / 100, pendMonths };
}

/* the whole plan as one table, a row for each month: what you could open in Google Sheets or Excel to check every number */
function sheetRows(S, C) {
  const head = ['Month', 'Money in', 'Bills and basics', 'Savings goals', 'Play', 'Education', 'Investing', 'Giving', 'Money out', 'Left over', 'Balance at start', 'Balance at end'];
  S.plan.goals.forEach(g => { head.push(g.name + ': added', g.name + ': saved so far'); });
  const rows = C.months.map(m => {
    const r = [m.ym, m.inflow, m.jar.nec, m.goalsTotal, m.jar.play, m.jar.edu, m.jar.ffa, m.jar.give, m.out, m.left, m.bankStart, m.bankEnd];
    S.plan.goals.forEach(g => { r.push(m.g[g.id].actual, m.bal[g.id]); });
    return r;
  });
  return [head].concat(rows);
}
/* numbers keep their cents (38.30 bank figures carry cents from receipts), so the spreadsheet agrees with every screen to the cent */
const csvCell = v => { let s = typeof v === 'number' ? String(Math.round(v * 100) / 100 || 0) : String(v == null ? '' : v); if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = "'" + s; return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const sheetCsv = (S, C) => '﻿' + sheetRows(S, C).map(r => r.map(csvCell).join(',')).join('\r\n') + '\r\n';

/* ---- the receipts reminder for the calendar: every day, every week, every two weeks or every month ---- */
const DAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const REMIND_FREQS = [['daily', 'Every day'], ['weekly', 'Every week'], ['biweekly', 'Every two weeks'], ['monthly', 'Every month']];
const DOM_LAST = -1;   // "the last day of the month" for the monthly reminder
const ordinal = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : (['th', 'st', 'nd', 'rd'][n % 10] || 'th'));
/* the next date on or after "today" that falls on weekday "day" (0 = Sunday) */
function nextWeekday(day, today) { const d = new Date(today.getFullYear(), today.getMonth(), today.getDate()); d.setDate(d.getDate() + ((day - d.getDay() + 7) % 7)); return d; }
/* the next date on or after "today" that is day "dom" of a month, or the last day of a month when dom is DOM_LAST */
function nextMonthDay(dom, today) {
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  for (let k = 0; k < 3; k++) {
    const y = t.getFullYear(), m = t.getMonth() + k, c = dom === DOM_LAST ? new Date(y, m + 1, 0) : new Date(y, m, dom);
    if (c >= t) return c;
  }
  return t;
}
function clockParts(time) { const m = /^(\d{1,2}):(\d{2})$/.exec(time || ''); const h = m ? Math.min(23, +m[1]) : 18, mi = m ? Math.min(59, +m[2]) : 0; return { h, mi }; }
/* o: { freq, day, dom, time, today }. A reminder with no freq is the old weekly one. */
function reminderTimesFor(o) {
  const f = o.freq || 'weekly', today = o.today || new Date();
  const d = f === 'daily' ? new Date(today.getFullYear(), today.getMonth(), today.getDate()) : f === 'monthly' ? nextMonthDay(o.dom === undefined ? 1 : o.dom, today) : nextWeekday(o.day, today);
  const c = clockParts(o.time), start = c.h * 60 + c.mi, end = Math.min(start + 30, 24 * 60 - 1);
  const stamp = (mins) => d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + 'T' + pad2(Math.floor(mins / 60)) + pad2(mins % 60) + '00';
  return { start: stamp(start), end: stamp(end) };
}
const reminderTimes = (day, time, today) => reminderTimesFor({ freq: 'weekly', day, time, today });
function rruleOf(o) {
  const f = o.freq || 'weekly';
  return f === 'daily' ? 'FREQ=DAILY' : f === 'monthly' ? 'FREQ=MONTHLY;BYMONTHDAY=' + (o.dom === DOM_LAST ? DOM_LAST : o.dom || 1)
    : f === 'biweekly' ? 'FREQ=WEEKLY;INTERVAL=2;BYDAY=' + DAY_CODES[o.day] : 'FREQ=WEEKLY;BYDAY=' + DAY_CODES[o.day];
}
const REMIND_SPAN = { daily: 'today’s', weekly: 'this week’s', biweekly: 'the last two weeks’', monthly: 'this month’s' };
function gcalUrl(o) {
  const t = reminderTimesFor(o), enc = encodeURIComponent;
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + enc(o.title) + '&details=' + enc(o.details) + '&dates=' + t.start + '/' + t.end + '&recur=' + enc('RRULE:' + rruleOf(o));
}
function outlookUrl(o) {
  const t = reminderTimesFor(o), enc = encodeURIComponent, iso = s => s.slice(0, 4) + '-' + s.slice(4, 6) + '-' + s.slice(6, 8) + 'T' + s.slice(9, 11) + ':' + s.slice(11, 13) + ':' + s.slice(13, 15);
  return 'https://outlook.live.com/calendar/0/deeplink/compose?path=' + enc('/calendar/action/compose') + '&rru=addevent&subject=' + enc(o.title) + '&body=' + enc(o.details) + '&startdt=' + iso(t.start) + '&enddt=' + iso(t.end);
}

function outlook365Url(o) { return outlookUrl(o).replace('https://outlook.live.com/', 'https://outlook.office.com/'); }
function yahooUrl(o) {
  const t = reminderTimesFor(o), enc = encodeURIComponent;
  return 'https://calendar.yahoo.com/?v=60&type=20&title=' + enc(o.title) + '&st=' + t.start + '&dur=0030&desc=' + enc(o.details);
}
/* a calendar file (.ics) that repeats: Apple Calendar, Samsung, Proton, Thunderbird, desktop Outlook and most others open it */
const icsEsc = s => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
function icsText(o) {
  const t = reminderTimesFor(o), now = o.today || new Date();
  const z = d => d.getUTCFullYear() + pad2(d.getUTCMonth() + 1) + pad2(d.getUTCDate()) + 'T' + pad2(d.getUTCHours()) + pad2(d.getUTCMinutes()) + pad2(d.getUTCSeconds()) + 'Z';
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//The Burrow//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
    'UID:receipts-' + (o.freq || 'weekly') + '-' + t.start + '@mhr2000', 'DTSTAMP:' + z(now), 'DTSTART:' + t.start, 'DTEND:' + t.end,
    'RRULE:' + rruleOf(o), 'SUMMARY:' + icsEsc(o.title), 'DESCRIPTION:' + icsEsc(o.details),
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc(o.title), 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'];
  /* a calendar line may be at most 75 bytes, so long lines wrap by bytes, never in the middle of a character */
  const bytes = ch => unescape(encodeURIComponent(ch)).length;
  const fold = l => { let out = '', n = 0; for (const ch of l) { const b = bytes(ch); if (n + b > 72) { out += '\r\n '; n = 1; } out += ch; n += b; } return out; };
  return lines.map(fold).join('\r\n') + '\r\n';
}

/* ---- loans: payments from the first month to the last one ---- */
const loanPayments = ends => (ends && MONTHS.indexOf(ends) >= 0 ? ymCount(START, ends) : 0);
const loanTotalFrom = (monthly, n) => Math.max(0, Math.round(monthly)) * Math.max(0, n);
const loanMonthlyFrom = (total, n) => (n > 0 ? Math.ceil(Math.max(0, Math.round(total)) / n) : 0);

/* ---- cleaning the amounts in a saved copy: only whole, non-negative, sensible numbers get through ---- */
const SAFE_KEY = /^[A-Za-z0-9:_-]{1,40}$/, YM_FORM = /^(20\d\d|21\d\d)-(0[1-9]|1[0-2])$/;
/* a saved amount loads exactly as it was saved, to the cent (decision 1): whole amounts from older versions load unchanged */
const cleanAmt = v => (typeof v === 'number' && isFinite(v) && v >= 0 ? Math.min(MAX_AMT, round2(v)) : null);
const cleanSigned = v => (typeof v === 'number' && isFinite(v) ? Math.max(-MAX_AMT, Math.min(MAX_AMT, round2(v))) || 0 : null);
const isMap = o => !!o && typeof o === 'object' && !Array.isArray(o);
function cleanSteps(raw) {
  const out = {}; if (!isMap(raw)) return out;
  Object.keys(raw).slice(0, 150).forEach(k => {
    if (!SAFE_KEY.test(k) || !Array.isArray(raw[k])) return;
    const by = {};
    raw[k].slice(0, 80).forEach(st => { if (!isMap(st) || typeof st.from !== 'string' || !YM_FORM.test(st.from)) return; const v = cleanAmt(st.v); if (v !== null) by[st.from] = v; });
    const arr = Object.keys(by).sort().map(f => ({ from: f, v: by[f] })); if (arr.length) out[k] = arr;
  });
  return out;
}
function cleanOnce(raw) {
  const out = {}; if (!isMap(raw)) return out;
  Object.keys(raw).slice(0, 2400).forEach(ym => {
    /* E6: the month window is a view only. A month outside it is kept, never trimmed */
    if (!YM_FORM.test(ym) || !isMap(raw[ym])) return;
    const o = {}; Object.keys(raw[ym]).slice(0, 150).forEach(k => { if (!SAFE_KEY.test(k)) return; const v = cleanAmt(raw[ym][k]); if (v !== null) o[k] = v; });
    if (Object.keys(o).length) out[ym] = o;
  });
  return out;
}
function cleanItems(raw) {
  const out = {}; if (!isMap(raw)) return out;
  Object.keys(raw).slice(0, 2400).forEach(ym => {
    if (!YM_FORM.test(ym) || !Array.isArray(raw[ym])) return;
    const list = [], used = new Set();
    raw[ym].slice(0, 60).forEach((it, i) => {
      if (!isMap(it)) return; const amount = cleanAmt(it.amount); if (amount === null) return;
      let id = typeof it.id === 'string' && SAFE_ID.test(it.id) ? it.id : 'x' + i; while (used.has(id)) id += 'x'; used.add(id);
      const label = typeof it.label === 'string' ? it.label.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 60) : '';
      const clean = { id, label: label || 'One-time cost', amount };
      if (typeof it.note === 'string' && it.note.trim()) clean.note = it.note.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 120);
      list.push(clean);
    });
    /* an empty list is kept: it means "no one-time costs this month", which is different from never having touched it */
    out[ym] = list;
  });
  return out;
}
const CFG_AMOUNTS = ['bankStart', 'minBank', 'ceiling', 'moveTarget', 'moveStart', 'travelTarget', 'travelStart', 'carTarget', 'carStart', 'rainyStart', 'rainyTarget', 'rainyStretch'];
/* every setting this version knows; anything else in a saved copy is a newer version's and is kept untouched by the page (ui0.js) */
const CFG_KNOWN = new Set(CFG_AMOUNTS.concat(['bankAt', 'bankNow', 'bankNowAt', 'loanLast', 'redirectLoan', 'moveMonth', 'carDue', 'aims']));   /* a known field the page took away on purpose (an Undo) is never carried back in from the stored copy */
function cleanCfg(raw) {
  const out = {}; if (!isMap(raw)) return out;
  CFG_AMOUNTS.forEach(k => { const v = k === 'bankStart' ? cleanSigned(raw[k]) : cleanAmt(raw[k]); if (v !== null) out[k] = v; });
  if (typeof raw.loanLast === 'string' && MONTHS.indexOf(raw.loanLast) >= 0) out.loanLast = raw.loanLast;
  if (typeof raw.redirectLoan === 'boolean') out.redirectLoan = raw.redirectLoan;
  if (typeof raw.moveMonth === 'string' && YM_FORM.test(raw.moveMonth)) out.moveMonth = raw.moveMonth;
  if (typeof raw.carDue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.carDue)) out.carDue = raw.carDue;
  if (typeof raw.bankAt === 'string' && BANK_AT_FORM.test(raw.bankAt)) out.bankAt = raw.bankAt;
  { const v = cleanSigned(raw.bankNow); if (v !== null) out.bankNow = v; }
  if (typeof raw.bankNowAt === 'string' && BANK_AT_FORM.test(raw.bankNowAt)) out.bankNowAt = raw.bankNowAt;
  if (isMap(raw.aims)) { const a = {}; JARS.forEach(j => { const v = raw.aims[j.id]; if (typeof v === 'number' && isFinite(v) && v >= 0 && v <= 1) a[j.id] = v; }); if (Object.keys(a).length) out.aims = a; }
  return out;
}

/* A5: pay-in-full cards, what is on each now (typed, with the day) and the day it is paid. Not the interest-bearing debts in Cards and loans.
   Shape agreed with the ledger lane: S.cards = [{ id, name, owed, payDay, at }] */
const MAX_CARDS = 12;
function cleanCards(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [], seen = new Set();
  raw.forEach(c => { if (!isMap(c) || out.length >= MAX_CARDS) return; const id = typeof c.id === 'string' && /^[\w-]{1,24}$/.test(c.id) && !seen.has(c.id) ? c.id : 'k' + (out.length + 1) + '_' + seen.size;
    seen.add(id); const owed = cleanAmt(typeof c.owed === 'string' && c.owed.trim() !== '' && isFinite(+c.owed) ? +c.owed : c.owed), pd = Math.round(+c.payDay);
    out.push({ id, name: String(c.name || '').replace(/\s+/g, ' ').trim().slice(0, 40) || 'Card', owed: owed === null ? 0 : owed, payDay: pd >= 1 && pd <= 31 ? pd : null, at: typeof c.at === 'string' && BANK_AT_FORM.test(c.at) ? c.at : null }); });
  return out;
}
/* the "now" block on Home: the bank as typed (bank now, or else the balance typed in setup, each with its day), the cards, and the bank after the
   cards are paid. Typed figures only: nothing planned is mixed in. bank is null when no balance with a day was ever typed */
function nowOf(S) {
  const c = S.cfg || {}, hasNow = typeof c.bankNow === 'number', bank = hasNow ? c.bankNow : (c.bankAt ? cfg(S, 'bankStart') : null), bankAt = hasNow ? (c.bankNowAt || null) : (c.bankAt || null);
  const cards = cleanCards(S.cards), cardsOwed = round2(sum(cards.map(k => k.owed)));
  return { bank, bankAt, typedNow: hasNow, cards, cardsOwed, afterCards: bank === null ? null : round2(bank - cardsOwed) };
}

/* ---- cleaning up anything loaded from a saved copy ---- */
const GOAL_KNOWN = new Set(['id', 'name', 'target', 'start', 'due', 'slot', 'monthly', 'why', 'emergency', 'stretch', 'stretchOn', 'stretchFrom']);
function cleanPlan(raw, legacy) {
  const base = basePlan(legacy);
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.lines) || !Array.isArray(raw.goals)) return base;
  const str = (v, n) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n) : '');
  const num = v => (typeof v === 'number' && isFinite(v) && v >= 0 ? Math.min(round2(v), 1e9) : 0);   /* cents kept on load (decision 1): a goal saved at 300.44 came back as 300 */
  const ids = new Set(), keys = new Set(), lines = [], goals = [];
  raw.lines.slice(0, MAX_LINES).forEach(l => {
    if (!l || typeof l !== 'object' || typeof l.id !== 'string' || !SAFE_ID.test(l.id) || ids.has(l.id) || LINE_JARS.indexOf(l.jar) < 0) return;
    const bi = BUILTIN.find(b => b.id === l.id), key = bi ? bi.key : 'line:' + l.id; if (keys.has(key)) return;
    ids.add(l.id); keys.add(key);
    const o = { id: l.id, key, jar: l.jar, name: str(l.name, 60) || 'Untitled', def: num(l.def) };
    if (bi && bi.note) o.note = bi.note;
    if (typeof l.ends === 'string' && MONTHS.indexOf(l.ends) >= 0) { o.ends = l.ends; if (l.redirect) o.redirect = true; }
    lines.push(o);
  });
  const gids = new Set(), used = new Set(); let hasE = false;
  raw.goals.slice(0, MAX_GOALS).forEach(g => {
    if (!g || typeof g !== 'object' || typeof g.id !== 'string' || !SAFE_ID.test(g.id) || gids.has(g.id)) return;
    gids.add(g.id);
    let slot = SLOTS.indexOf(+g.slot) >= 0 && !used.has(+g.slot) ? +g.slot : (SLOTS.find(s => !used.has(s)) || SLOTS[0]); used.add(slot);
    const o = { id: g.id, name: str(g.name, 60) || 'Untitled', target: num(g.target), start: num(g.start), due: validDue(g.due), slot };
    if (typeof g.monthly === 'number' && isFinite(g.monthly) && g.monthly >= 0) o.monthly = Math.min(MAX_AMT, round2(g.monthly));   /* cents kept (decision 1) */
    const why = str(g.why, WHY_MAX).replace(/\s+/g, ' ').trim(); if (why) o.why = why;
    if (g.emergency && !hasE) { hasE = true; o.emergency = true; o.stretch = num(g.stretch); if (g.stretchOn === true || g.stretchOn === false) o.stretchOn = g.stretchOn; if (typeof g.stretchFrom === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(g.stretchFrom)) o.stretchFrom = g.stretchFrom; }
    /* a newer version's plain fields on a goal are kept, so restoring its backup here and saving loses nothing (38.31 data safety round 3) */
    Object.keys(g).filter(k => !(k in o) && !GOAL_KNOWN.has(k) && /^[A-Za-z][A-Za-z0-9_]{0,39}$/.test(k) && ['string', 'number', 'boolean'].indexOf(typeof g[k]) >= 0).slice(0, 12).forEach(k => { o[k] = typeof g[k] === 'string' ? g[k].slice(0, 200) : g[k]; });
    goals.push(o);
  });
  const out = { lines, goals };
  const debts = cleanDebts(raw.debts, gids, ids); if (debts.length) out.debts = debts;
  const rec = cleanRecurring(raw.recurring, keys); if (rec.length) out.recurring = rec;
  return out;
}
function cleanDebts(raw, gids, lids) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set(), out = [], str = (v, n) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n) : '');
  const whole = v => (typeof v === 'number' && isFinite(v) && v >= 0 ? Math.min(Math.round(v), 1e9) : 0);
  raw.slice(0, MAX_DEBTS).forEach(d => {
    if (!d || typeof d !== 'object' || typeof d.id !== 'string' || !SAFE_ID.test(d.id) || seen.has(d.id)) return;
    seen.add(d.id);
    const apr = typeof d.apr === 'number' && isFinite(d.apr) ? Math.max(0, Math.min(100, Math.round(d.apr * 100) / 100)) : 0;
    out.push({ id: d.id, name: str(d.name, 60) || 'Untitled', kind: DEBT_KINDS.indexOf(d.kind) >= 0 ? d.kind : 'loan', balance: whole(d.balance), apr, min: whole(d.min), extra: whole(d.extra) });
  });
  return out;
}
/* spending that repeats on its own: a weekday every week, or a day of the month. Ends where it is cleared. */
const MAX_RECURRING = 20;
function cleanRecurring(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set(), out = [];
  raw.slice(0, MAX_RECURRING).forEach(r => {
    if (!r || typeof r !== 'object' || typeof r.id !== 'string' || !SAFE_ID.test(r.id) || seen.has(r.id)) return;
    const a = typeof r.a === 'number' ? round2(r.a) : 0; if (!(a > 0) || a > 1e9) return;
    const every = r.every === 'week' ? 'week' : r.every === 'month' ? 'month' : null; if (!every) return;
    const on = Math.round(+r.on); if (every === 'week' ? !(on >= 0 && on <= 6) : !(on >= 1 && on <= 28)) return;
    /* E6: a start before the first month the page covers is kept as typed */
    const from = r.from;
    if (!validDate(from)) return;
    seen.add(r.id);
    const c = typeof r.c === 'string' && /^[A-Za-z0-9:_-]{1,40}$/.test(r.c) ? r.c : 'other';
    out.push({ id: r.id, a, c, n: typeof r.n === 'string' ? r.n.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 80) : '', every, on, from, last: validDate(r.last) ? r.last : '' });
  });
  return out;
}
const RC_KNOWN = new Set(['id', 'd', 'a', 'c', 'cn', 'n', 's']);
function cleanReceipts(raw) {
  if (!Array.isArray(raw)) return [];
  const ids = new Set(), out = [];
  raw.slice(0, 5000).forEach(r => {
    if (!r || typeof r !== 'object' || typeof r.id !== 'string' || !SAFE_ID.test(r.id) || ids.has(r.id) || !validDate(r.d)) return;
    const a = typeof r.a === 'number' ? round2(r.a) : 0; if (!(a > 0) || a > 1e9) return;
    const c = typeof r.c === 'string' && /^[A-Za-z0-9:_-]{1,40}$/.test(r.c) ? r.c : 'other';
    ids.add(r.id);
    const rc = { id: r.id, d: r.d, a, c, cn: typeof r.cn === 'string' ? r.cn.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 60) : '', n: typeof r.n === 'string' ? r.n.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 80) : '' };
    if (typeof r.s === 'string' && r.s.trim()) rc.s = r.s.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 40); /* the account it came from, as the person named it */
    /* a plain field this version does not know (saved by a newer one) is kept as it was; nothing reads it (38.31 data safety round) */
    Object.keys(r).filter(k => !(k in rc) && !RC_KNOWN.has(k) && /^[A-Za-z][A-Za-z0-9_]{0,39}$/.test(k) && ['string', 'number', 'boolean'].indexOf(typeof r[k]) >= 0).slice(0, 12).forEach(k => { rc[k] = typeof r[k] === 'string' ? r[k].slice(0, 200) : r[k]; });
    out.push(rc);
  });
  return out;
}

/* ---------- debts: where each one stands and which gets the extra money first ---------- */
/* payoff: the month the balance reaches 0 inside the page's months, or the projection past them. */
function debtRows(S, C) {
  const last = C.months[C.months.length - 1];
  const rows = debtsOf(S).map(d => {
    let paidYm = null, interest = 0, paid = 0;
    for (const m of C.months) { const x = m.debts[d.id]; interest += x.interest; paid += x.pay; if (paidYm === null && x.bal === 0) { paidYm = m.ym; break; } }
    let proj = null;
    if (paidYm === null) { const lx = last.debts[d.id]; proj = debtProject(d, lx.bal, lx.extra, ymAdd(last.ym, 1)); interest += proj.interest; paid += proj.paid; paidYm = proj.ym; }
    const cur = C.months[0].debts[d.id];
    return { id: d.id, name: d.name, kind: d.kind, balance: d.balance, apr: d.apr, min: d.min, extra: d.extra, payoffYm: paidYm, never: !!(proj && proj.never) || (d.balance > 0 && d.min + d.extra <= cur.interest && paidYm === null),
      totalInterest: interest, totalPaid: paid, pctPaid: 0, first: false, done: d.balance <= 0 };
  });
  /* highest rate first; the same rate, the smaller balance first */
  const open = rows.filter(r => !r.done).sort((a, b) => b.apr - a.apr || a.balance - b.balance || (a.id < b.id ? -1 : 1));
  if (open.length > 1) open[0].first = true;
  return rows;
}
/* where the debts stand at a month end */
function debtOwedAt(C, ym) { return C.byYm[ym].debtOwed; }

/* ---------- extra money (a bonus, a 13th month pay, a refund, a good freelance month) and where it goes ---------- */
const EXTRA_DESTS = ['bank', 'goal', 'play', 'ffa', 'debt'];
/* The amount is added to this month's pay for this month only and the same amount is put where the person chose. Returns what moved and what stayed in the bank. */
function addExtraMoney(S, ym, amount, dest) {
  amount = Math.round(+amount); if (!(amount > 0) || amount > MAX_AMT || MONTHS.indexOf(ym) < 0) return null;
  const C0 = calcAll(S), m0 = C0.byYm[ym]; let placed = 0, key = null, room = amount;
  if (dest && dest.t === 'goal') { const g = goalById(S, dest.id); if (!g || g.target <= 0) return null; key = 'goal:' + g.id; room = Math.max(0, capOf(g, ym) - m0.balBefore[g.id] - m0.g[g.id].actual); if (g.due && ym > readyBy(g)) room = 0; }
  else if (dest && dest.t === 'play') { const l = S.plan.lines.find(x => x.jar === 'play'); if (!l) return null; key = l.key; }
  else if (dest && dest.t === 'ffa') { const l = S.plan.lines.find(x => x.jar === 'ffa'); if (!l) return null; key = l.key; }
  else if (dest && dest.t === 'debt') { const d = debtById(S, dest.id); if (!d) return null; key = 'debt:' + d.id; const st = m0.debts[d.id]; room = Math.max(0, st.start + st.interest - st.pay); }
  else if (dest && dest.t !== 'bank') return null;
  placed = key ? Math.min(amount, room) : 0;
  setVal(S, 'side', ym, val(S, 'side', ym) + amount, 'once');
  if (key && placed > 0) setVal(S, key, ym, val(S, key, ym) + placed, 'once');
  return { amount, placed, toBank: amount - placed };
}

/* ---------- spending limits: each line's plan against what was logged for it ---------- */
function limitsOf(S, C, ym) {
  const m = C.byYm[ym], rs = receiptStats(S, ym), rows = [];
  m.lines.forEach(x => {
    if (!x.on) return;
    const spent = rs.byKey[x.key] || 0, soft = x.jar === 'play' || x.jar === 'edu' || x.jar === 'give';
    if (x.jar === 'ffa') return;
    if (!(soft || spent > 0) || !(x.v > 0 || spent > 0)) return;
    rows.push({ key: x.key, name: shownLine(x.name), jar: x.jar, planned: x.v, spent, left: round2(x.v - spent), over: round2(x.v - spent) < 0, overBy: round2(x.v - spent) < 0 ? round2(spent - x.v) : 0 });
  });
  return { rows, other: rs.byKey.other || 0, total: rs.total };
}

/* ---------- last month in one look ---------- */
function lookBack0(S, C, ym) {
  const m = C.byYm[ym]; if (!m) return null;
  const rs = receiptStats(S, ym), lim = limitsOf(S, C, ym);
  const jars = ['nec', 'play', 'edu', 'give'].map(j => ({ id: j, planned: m.jar[j], spent: rs.byJar[j] || 0, left: round2(m.jar[j] - (rs.byJar[j] || 0)) }));
  return { ym, inflow: m.inflow, out: m.out, left: round2(m.bankEnd - m.bankStart), planLeft: m.left, bankStart: m.bankStart, bankEnd: m.bankEnd, count: rs.count, logged: rs.total, other: rs.byJar.other || 0, jars,
    over: lim.rows.map(r => (r.jar === 'edu' || r.jar === 'give') && r.over ? Object.assign({}, r, { left: -Math.min(-r.left, (m.ovB || {})[r.jar] || 0) }) : r).filter(r => r.over && r.left < -0.004).concat((rs.byJar.other || 0) - (m.itemsTotal || 0) > 0.004 ? [{ name: 'Other', left: -round2((rs.byJar.other || 0) - (m.itemsTotal || 0)), over: true }] : []).sort((a, b) => a.left - b.left), goalsAdded: round2(m.goalsTotal + ((m.topup && m.topup.used) || 0)), debtPaid: m.debtPay, interest: m.debtInterest, owed: m.debtOwed };
}

/* last month with its named amounts: how much the balance moved (change), and for each line over its plan, by how much (overBy) */
function lookBack(S, C, ym) { const b = lookBack0(S, C, ym); if (!b) return b; b.change = Math.abs(round2(b.bankEnd - b.bankStart)); b.over = b.over.map(r => Object.assign({}, r, { overBy: round2(-r.left) })); return b; }

/* ---------- repeating spending: adds the receipts that came due since the last time, never more than 60 at once ---------- */
function dueDates(r, fromExcl, toIncl) {
  const out = [], start = r.last ? r.last : null;
  let t = new Date((start || r.from) + 'T00:00:00Z'); const end = new Date(toIncl + 'T00:00:00Z');
  if (!start) t = new Date(t.getTime() - 86400000);
  for (let i = 0; i < 4000 && out.length < 60; i++) {
    t = new Date(t.getTime() + 86400000); if (t > end) break;
    const iso = t.toISOString().slice(0, 10), dow = t.getUTCDay(), dom = t.getUTCDate();
    if (iso < r.from) continue;
    if (r.every === 'week' ? dow === r.on : dom === r.on) out.push(iso);
  }
  return out;
}
function applyRecurring(S, today) {
  const rec = S.plan && S.plan.recurring; if (!rec || !rec.length || !validDate(today)) return 0;
  let n = 0;
  rec.forEach(r => {
    const ds = dueDates(r, null, today);
    /* E6: a due date outside the months shown is logged too, never skipped and marked done */
    ds.forEach(d => { if (addReceipt(S, d, r.a, r.c, r.n)) n++; });
    if (ds.length) r.last = ds[ds.length - 1];
  });
  return n;
}
