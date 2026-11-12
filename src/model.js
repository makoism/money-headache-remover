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
const round2 = x => Math.round(x * 100) / 100;

/* ---- Settings under Basics (S.cfg overrides these). The original sample, in Philippine pesos; SAMPLES below has the current ones. ---- */
const CFG = {
  bankStart: 15000,        // what you have in the bank (and cash) at the start of the first month
  minBank: 3000,           // lowest balance you are comfortable with
  ceiling: 5000,           // most you want to spend in a month
};

/* ---- The six jars (T. Harv Eker's system). "usual" is Eker's usual share of pay for each jar. It is only a guide: the page never shows it as a target, and the shares it does show always come from the real amounts. ---- */
const JARS = [
  { id: 'nec',  name: 'Necessities',                    usual: 0.55, about: 'Rent, food, utilities and every other bill.' },
  { id: 'lts',  name: 'Long-Term Savings for Spending', usual: 0.10, about: 'Saved now, spent later: a big purchase, a trip, a rainy day, a surprise. Savings goals live here.' },
  { id: 'play', name: 'Play',                           usual: 0.10, about: 'Fun for you and your family, no guilt. Spend all of it every month.' },
  { id: 'edu',  name: 'Education',                      usual: 0.10, about: 'Courses, books, coaching, skill building.' },
  { id: 'ffa',  name: 'Financial Freedom',              usual: 0.10, about: 'Financial Freedom Account: investments you never spend. They grow and eventually pay you.' },
  { id: 'give', name: 'Give',                           usual: 0.05, about: 'Charity, donations and gifts.' },
];
const LINE_JARS = ['nec', 'play', 'edu', 'ffa', 'give'];
/* a few words for each jar, shown under its name wherever the split is listed */
const JARTAG = { nec: 'Bills', lts: 'Goals', play: 'Fun, no guilt', edu: 'Courses and books', ffa: 'Never spent', give: 'Charity and gifts' };

/* ---- The starting plan: lines you pay every month, and savings goals. All of it can be renamed, removed or added to. ---- */
const LINE_DEFS = [
  { id: 'rent',   key: 'bill:rent',  jar: 'nec', name: 'Rent or mortgage', def: 7000, note: 'Biggest bill. Use the full amount, even if someone shares it (put their share under Money in).' },
  { id: 'util',   key: 'bill:util',  jar: 'nec', name: 'Utilities', def: 1750, note: 'Electricity and water. Hot and rainy months can cost more.' },
  { id: 'food',   key: 'bill:food',  jar: 'nec', name: 'Food and groceries', def: 5500, note: 'Groceries and everyday meals. Eating out for fun goes under Play.' },
  { id: 'net',    key: 'bill:net',   jar: 'nec', name: 'Internet', def: 1200 },
  { id: 'phone',  key: 'bill:phone', jar: 'nec', name: 'Phone', def: 500, note: 'Postpaid plan, or the load you usually buy in a month.' },
  { id: 'ins',    key: 'bill:ins',   jar: 'nec', name: 'Insurance and contributions', def: 1000, note: 'Health or life insurance. Not on payroll: include your own SSS, PhilHealth and Pag-IBIG payments. Monthly amount.' },
  { id: 'subs',   key: 'bill:subs',  jar: 'nec', name: 'Subscriptions', def: 500, note: 'Streaming, apps, software, gym.' },
  { id: 'gas',    key: 'bill:gas',   jar: 'nec', name: 'Transport', def: 1800, note: 'Commute, Grab, fuel, parking, tolls.' },
  { id: 'loan',   key: 'bill:loan',  jar: 'nec', name: 'Loan or debt payment', def: 0, note: 'Car loan, personal loan, card installments. Pick the last payment month; its money can then move to your emergency fund.' },
  { id: 'card',   key: 'card',       jar: 'nec', name: 'Other card spending', def: 0, note: 'Optional. Card spending not already in a line above, like shopping or household items. Fun spending goes under Play.' },
  { id: 'spend',  key: 'envelope',   jar: 'play', name: 'Play money', def: 3500 },
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
const CARD_OLD = { name: 'Spending on credit cards', note: 'Optional. Anything you put on a credit card and pay off each month that is not already in a line above. Fun spending belongs under Play.' };
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
const freshState = () => presetState('₱');
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
const capOf = g => (g.emergency ? Math.max(g.stretch || 0, g.target) : g.target);
/* the split a person chose in setup, as shares of pay. Only the setup steps read it, as their starting point; nothing on screen shows it. */
const aimsOf = S => { const a = (S.cfg && S.cfg.aims) || {}, o = {}; JARS.forEach(j => { const v = a[j.id]; o[j.id] = typeof v === 'number' && v >= 0 && v <= 1 ? v : j.usual; }); return o; };
const allKeys = S => ['a', 'b', 'side'].concat(S.plan.lines.map(l => l.key), S.plan.goals.map(g => 'goal:' + g.id));

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
  const rem = Math.max(0, g.target - g.start); if (rem <= 0) return 0;
  const u = roundUnit(S); return Math.ceil(rem / 12 / u) * u;
}
const BASE_DEF = { b: 0, side: 0, draw: 0 };
function defOf(S, key, ym) {
  if (key === 'a') return payDef(S);
  if (BASE_DEF[key] !== undefined) return BASE_DEF[key];
  const l = lineByKey(S, key); if (l) return l.def;
  if (key.slice(0, 5) === 'goal:') { const g = goalById(S, key.slice(5)); if (g) return goalDefault(S, g, ym); }
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
const clampAmt = v => { v = Math.round(+v); return isFinite(v) ? Math.max(0, Math.min(MAX_AMT, v)) : 0; };
function setVal(S, key, ym, v, scope) {
  v = clampAmt(v);
  if (scope === 'once' || ONCE_KEYS.has(key)) { (S.once[ym] = S.once[ym] || {})[key] = v; return; }
  if (S.once[ym]) delete S.once[ym][key];
  const arr = (S.steps[key] = S.steps[key] || []).filter(s => s.from < ym);
  arr.push({ from: ym, v }); S.steps[key] = arr;
}
function undoOnce(S, ym, key) { const o = S.once[ym]; if (o) { delete o[key]; if (!Object.keys(o).length) delete S.once[ym]; } }
function resetMonth(S, ym) {
  delete S.once[ym]; delete S.items[ym];
  for (const k of Object.keys(S.steps)) { S.steps[k] = S.steps[k].filter(s => s.from !== ym); if (!S.steps[k].length) delete S.steps[k]; }
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
  if (amount > 0) setVal(S, l.key, START, Math.round(amount), 'after');
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
function blankState(S) {
  const f = freshState(); f.ui = Object.assign({}, S.ui, { sampleHidden: true }); f.receipts = (S.receipts || []).slice();
  f.plan = { lines: S.plan.lines.map(l => Object.assign({}, l, { def: 0 })), goals: S.plan.goals.map(g => { const o = Object.assign({}, g, { target: 0, start: 0 }); delete o.monthly; if (o.emergency) o.stretch = 0; return o; }) };
  ['a', 'b', 'side'].forEach(k => { f.steps[k] = [{ from: START, v: 0 }]; });
  MONEY_CFG.forEach(k => { f.cfg[k] = 0; });
  if (S.cfg && S.cfg.aims) f.cfg.aims = Object.assign({}, S.cfg.aims);
  return f;
}

function calcAll(S) {
  const months = [], byYm = {}, reached = {};
  const goals = goalsOf(S), lines = linesOf(S), eg = emergencyGoal(S);
  let bank = cfg(S, 'bankStart');
  const bal = {}; goals.forEach(g => { bal[g.id] = g.start; });
  const redirects = lines.filter(l => l.ends && l.redirect).map(l => ({ l, amt: val(S, l.key, l.ends) }));
  for (const ym of MONTHS) {
    const m = { ym };
    m.a = val(S, 'a', ym); m.b = val(S, 'b', ym); m.side = val(S, 'side', ym);
    m.draw = eg ? Math.min(val(S, 'draw', ym), Math.max(0, bal[eg.id])) : 0;
    m.lines = lines.map(l => { const on = !l.ends || ym <= l.ends; return { id: l.id, key: l.key, jar: l.jar, name: l.name, on, v: on ? val(S, l.key, ym) : 0 }; });
    m.jar = { nec: 0, play: 0, edu: 0, ffa: 0, give: 0 };
    m.lines.forEach(x => { m.jar[x.jar] += x.v; });
    m.billsTotal = m.jar.nec;
    m.items = itemsFor(S, ym); m.itemsTotal = sum(m.items.map(i => +i.amount || 0));
    m.jar.nec += m.itemsTotal;
    m.balBefore = Object.assign({}, bal);
    const freed = redirects.reduce((acc, r) => acc + (ym > r.l.ends ? r.amt : 0), 0);
    const g = {};
    goals.forEach(gl => {
      const isE = !!(eg && gl.id === eg.id), planned = val(S, 'goal:' + gl.id, ym) + (isE ? freed : 0);
      const room = Math.max(0, capOf(gl) - bal[gl.id]);
      /* money borrowed from the emergency fund this month is never put straight back: a deposit only fills the room the fund had before the draw */
      g[gl.id] = { planned, actual: Math.min(planned, room) };
      if (isE) g[gl.id].loan = freed;
    });
    m.g = g;
    m.goalsTotal = sum(goals.map(gl => g[gl.id].actual));
    /* one pot: everything that comes in, everything that goes out */
    m.inflow = m.a + m.b + m.side + m.draw;
    m.out = m.jar.nec + m.jar.play + m.jar.edu + m.jar.ffa + m.jar.give + m.goalsTotal;
    m.pool = { in: m.inflow, out: m.out }; m.pool.left = m.pool.in - m.pool.out;
    m.left = m.pool.left;
    m.bankStart = bank; bank += m.left; m.bankEnd = bank;
    goals.forEach(gl => { bal[gl.id] += g[gl.id].actual - (eg && gl.id === eg.id ? m.draw : 0); });
    goals.forEach(gl => { if (gl.target > 0 && reached[gl.id] === undefined && bal[gl.id] >= gl.target) reached[gl.id] = ym; });
    m.spent = {};
    goals.forEach(gl => {
      m.spent[gl.id] = 0;
      if (gl.due && gl.target > 0 && ym === dueYm(gl)) { m.spent[gl.id] = Math.min(bal[gl.id], gl.target); bal[gl.id] -= m.spent[gl.id]; }
    });
    m.bal = Object.assign({}, bal);
    months.push(m); byYm[ym] = m;
  }
  return { months, byYm, reached };
}

/* whole percents that always add up to 100: every share is rounded down, then the biggest remainders get the spare points.
   A share of nothing stays 0, so an empty jar never shows a percent. Used everywhere a set of percents is shown together. */
function wholePercents(vals, base) {
  /* whole numbers all the way through, so two shares that are truly equal are a tie, never a rounding accident */
  const v = vals.map(x => Math.max(0, Math.round(+x || 0))), sum = v.reduce((a, b) => a + b, 0), bs = Math.round(base);
  if (!(bs > 0) || !(sum > 0)) return v.map(() => 0);
  const den = Math.min(sum, bs), total = Math.floor((den * 200 + bs) / (2 * bs));
  const out = v.map(x => Math.floor(x * total / den)), rem = v.map((x, i) => x * total - out[i] * den);
  const left = total - out.reduce((a, b) => a + b, 0);
  v.map((x, i) => i).filter(i => v[i] > 0).sort((i, j) => rem[j] - rem[i] || i - j).slice(0, Math.max(0, left)).forEach(i => { out[i]++; });
  return out;
}
/* How a month's money splits across the six jars. One idea: all of your pay goes into the jars, and each percent is that jar's amount divided by your pay.
   "rest" is pay that has no jar yet. When the plan spends more than comes in there is no rest, "short" says by how much, and the percents are shares of
   what the plan spends, so they still add up to 100. */
function jarsOf(S, m) {
  const inn = m.pool.in, out = m.pool.out, rest = Math.max(0, inn - out), short = Math.max(0, out - inn), base = short > 0 ? out : inn;
  const vals = { nec: m.jar.nec, lts: m.goalsTotal, play: m.jar.play, edu: m.jar.edu, ffa: m.jar.ffa, give: m.jar.give };
  const pcts = wholePercents(JARS.map(j => vals[j.id]).concat([rest]), base);
  return { income: base, inn, out, rest, short, over: short > 0, restPct: pcts[6],
    list: JARS.map((j, i) => ({ id: j.id, name: j.name, usual: Math.round(j.usual * 100), v: vals[j.id], pct: pcts[i] })) };
}

const statusOf = (S, m) => (m.bankEnd < cfg(S, 'minBank') ? 'short' : (m.pool.left < 0 ? 'tight' : 'good'));

function goalInfo(S, C, id, ym) {
  const g = goalById(S, id), m = C.byYm[ym], target = g.target, bal = m.bal[id];
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
  return { id, target, bal, pct: target > 0 ? Math.min(1, bal / target) : 0, reached, readyBy: rb, state, need, slack, had };
}

/* a rounding step that fits the size of the number */
const niceStepFor = x => (x >= 20000 ? 1000 : x >= 3000 ? 100 : 10);

/* what to do when a month is short */
function fixes(S, m) {
  const out = []; const floor = cfg(S, 'minBank'), play = m.jar.play;
  const gap = Math.max(0, floor - m.bankEnd);
  const st = niceStepFor(Math.max(play, gap));
  if (gap > 0) { const ne = Math.floor((play - gap) / st) * st; if (ne >= 0 && ne < play) out.push({ id: 'trim', amount: ne }); }
  const eg = emergencyGoal(S), room = eg ? Math.max(0, m.balBefore[eg.id] - m.draw) : 0;
  if (gap > 0 && room > 0) out.push({ id: 'borrow', amount: Math.min(room, Math.ceil(gap / st) * st) });
  return out;
}
/* make the Play jar add up to "target" for one month, taking from the first line first */
function trimPlay(S, m, ym, target) {
  let need = m.jar.play - target;
  m.lines.filter(x => x.jar === 'play' && x.on).forEach(x => { if (need <= 0) return; const cut = Math.min(x.v, need); setVal(S, x.key, ym, x.v - cut, 'once'); need -= cut; });
}

/* ---- receipts ---- */
const catName = (S, r) => { if (r.c === 'other') return 'Other'; const l = lineByKey(S, r.c); return l ? l.name : (r.cn || 'Other'); };
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
function addReceipt(S, d, a, c, n) {
  a = round2(+a); if (!(a > 0) || a > 1e9 || !validDate(d)) return null;
  const l = lineByKey(S, c), key = l ? c : 'other';
  const r = { id: newId(S, 'r', x => (S.receipts || []).some(q => q.id === x)), d, a, c: key, cn: l ? l.name : 'Other', n: (n || '').trim().slice(0, 80) };
  (S.receipts = S.receipts || []).push(r); return r.id;
}
function updateReceipt(S, id, d, a, c, n) {
  const r = (S.receipts || []).find(x => x.id === id); a = round2(+a); if (!r || !(a > 0) || a > 1e9 || !validDate(d)) return false;
  const l = lineByKey(S, c); r.d = d; r.a = a; r.c = l ? c : 'other'; r.cn = l ? l.name : 'Other'; r.n = (n || '').trim().slice(0, 80); return true;
}
function removeReceipt(S, id) { const n = (S.receipts || []).length; S.receipts = (S.receipts || []).filter(x => x.id !== id); return S.receipts.length < n; }
const validDate = d => { if (typeof d !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return false; const t = new Date(d + 'T00:00:00Z'); return !isNaN(t) && t.toISOString().slice(0, 10) === d; };

/* ===== THE VIEWS =====
   Everything a screen shows is worked out here, from calcAll and goalInfo, as plain numbers and words. The screens only draw what these return,
   so there is one set of numbers in the whole page. They have their own test against an independent recomputation. ===== */
const wholePct = (v, t) => (t > 0 ? (v >= t ? 100 : Math.min(99, Math.max(0, Math.floor(v * 100 / t)))) : 0);
const GOAL_DEFAULT_NAME = { rainy: 'Emergency fund', travel: 'Trip', moving: 'Home or move', buy: 'Big purchase', car: 'Yearly cost', other: 'Something else' };
const PURPOSE_OF_KIND = { rainy: 'Emergencies covered', travel: 'Trip paid for', moving: 'Move paid for', buy: 'Paid in cash', car: 'Yearly bill covered', other: '' };
const PURPOSE_VERBS = /^(buy|get|build|start|take|go|pay|visit|learn|fix|move|plan|book|host|open|join|make|finish|upgrade|replace|renew|fund|cover|see|send|adopt|rent|own|throw|celebrate|travel|clear|write|launch|hire|support|invest|surf|ride|run|swim|climb|dive|drive|fly|marry|study|train|enrol|enroll|treat|gift|surprise|retire|quit)\b/i;
const kindOfGoal = (S, g) => { if (g.emergency) return 'rainy'; const gk = (S.ui && S.ui.gk) || {}; return gk[g.id] || (Object.prototype.hasOwnProperty.call(PURPOSE_OF_KIND, g.id) ? g.id : 'other'); };
/* the plain sentence under a goal: what the money will let the person do. Built-in wording here; a line written by Claude for a custom goal replaces it on screen. */
function purposeOf(S, g) {
  const name = String(g.name || '').replace(/\s+/g, ' ').trim(), kind = kindOfGoal(S, g);
  if (kind === 'rainy') return PURPOSE_OF_KIND.rainy;
  if (PURPOSE_OF_KIND[kind] && (!name || name === GOAL_DEFAULT_NAME[kind])) return PURPOSE_OF_KIND[kind];
  if (!name) return 'Goal covered';
  if (PURPOSE_VERBS.test(name)) return 'Ready to ' + name.charAt(0).toLowerCase() + name.slice(1);
  return name.charAt(0).toUpperCase() + name.slice(1) + ' covered';
}
function goalRows(S, C, ym) {
  const ix = ymIdx(ym);
  return S.plan.goals.map(g => {
    const gi = goalInfo(S, C, g.id, ym), live = g.target > 0 && gi.state !== 'paid' && gi.state !== 'short';
    return { id: g.id, name: g.name, slot: g.slot, kind: kindOfGoal(S, g), emergency: !!g.emergency, target: g.target, saved: gi.bal, pct: wholePct(gi.bal, g.target), state: gi.state,
      reached: gi.reached, months: gi.reached ? Math.max(0, ymIdx(gi.reached) - ix) : null, need: gi.need, slack: gi.slack, due: g.due || null, readyBy: gi.readyBy, had: gi.had, live };
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
  const play = { planned: planPlay, spent: spentPlay, left: leftPlay, over: leftPlay < 0, count: rs.count, daysLeft, dim, dayN,
    frac: planPlay > 0 ? Math.min(1, spentPlay / planPlay) : 1, dayFrac: Math.min(1, dayN / dim), ahead: leftPlay >= 0 && spentPlay > pace * 1.15 + 1,
    perWeek: daysLeft >= 4 ? Math.max(0, leftPlay) / (daysLeft / 7) : null };
  const goalsSaved = sum(Object.keys(m.bal).map(id => m.bal[id]));
  let ffaSoFar = 0; for (const x of MONTHS) { if (x > ym) break; ffaSoFar += C.byYm[x].jar.ffa; }
  const buckets = JARS.map(j => {
    if (j.id === 'lts') return { id: j.id, name: j.name, kind: 'save', planned: m.goalsTotal, spent: 0, left: null, total: goalsSaved };
    if (j.id === 'ffa') return { id: j.id, name: j.name, kind: 'save', planned: m.jar.ffa, spent: 0, left: null, total: ffaSoFar };
    const planned = m.jar[j.id], spent = rs.byJar[j.id] || 0;
    return { id: j.id, name: j.name, kind: 'spend', planned, spent, left: round2(planned - spent), total: null };
  });
  return { ym, main, goals, live: goals.filter(r => r.live).length, play, buckets, otherSpent: rs.byJar.other || 0,
    month: { inflow: m.inflow, out: m.out, left: m.left, bankEnd: m.bankEnd, status: statusOf(S, m) } };
}
/* the whole plan as one table, a row for each month: what you could open in Google Sheets or Excel to check every number */
function sheetRows(S, C) {
  const head = ['Month', 'Money in', 'Necessities', 'Savings goals', 'Play', 'Education', 'Financial Freedom', 'Give', 'Money out', 'Left over', 'Balance at start', 'Balance at end'];
  S.plan.goals.forEach(g => { head.push(g.name + ': added', g.name + ': saved so far'); });
  const rows = C.months.map(m => {
    const r = [m.ym, m.inflow, m.jar.nec, m.goalsTotal, m.jar.play, m.jar.edu, m.jar.ffa, m.jar.give, m.out, m.left, m.bankStart, m.bankEnd];
    S.plan.goals.forEach(g => { r.push(m.g[g.id].actual, m.bal[g.id]); });
    return r;
  });
  return [head].concat(rows);
}
const csvCell = v => { let s = typeof v === 'number' ? String(Math.round(v)) : String(v == null ? '' : v); if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = "'" + s; return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
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
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//M.H.R.2000 The Money Headache Remover 2000//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
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
const cleanAmt = v => (typeof v === 'number' && isFinite(v) && v >= 0 ? clampAmt(v) : null);
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
  Object.keys(raw).forEach(ym => {
    if (MONTHS.indexOf(ym) < 0 || !isMap(raw[ym])) return;
    const o = {}; Object.keys(raw[ym]).slice(0, 150).forEach(k => { if (!SAFE_KEY.test(k)) return; const v = cleanAmt(raw[ym][k]); if (v !== null) o[k] = v; });
    if (Object.keys(o).length) out[ym] = o;
  });
  return out;
}
function cleanItems(raw) {
  const out = {}; if (!isMap(raw)) return out;
  Object.keys(raw).forEach(ym => {
    if (MONTHS.indexOf(ym) < 0 || !Array.isArray(raw[ym])) return;
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
function cleanCfg(raw) {
  const out = {}; if (!isMap(raw)) return out;
  CFG_AMOUNTS.forEach(k => { const v = cleanAmt(raw[k]); if (v !== null) out[k] = v; });
  if (typeof raw.loanLast === 'string' && MONTHS.indexOf(raw.loanLast) >= 0) out.loanLast = raw.loanLast;
  if (typeof raw.redirectLoan === 'boolean') out.redirectLoan = raw.redirectLoan;
  if (typeof raw.moveMonth === 'string' && YM_FORM.test(raw.moveMonth)) out.moveMonth = raw.moveMonth;
  if (typeof raw.carDue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.carDue)) out.carDue = raw.carDue;
  if (isMap(raw.aims)) { const a = {}; JARS.forEach(j => { const v = raw.aims[j.id]; if (typeof v === 'number' && isFinite(v) && v >= 0 && v <= 1) a[j.id] = v; }); if (Object.keys(a).length) out.aims = a; }
  return out;
}

/* ---- cleaning up anything loaded from a saved copy ---- */
function cleanPlan(raw, legacy) {
  const base = basePlan(legacy);
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.lines) || !Array.isArray(raw.goals)) return base;
  const str = (v, n) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n) : '');
  const num = v => (typeof v === 'number' && isFinite(v) && v >= 0 ? Math.min(Math.round(v), 1e9) : 0);
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
    if (typeof g.monthly === 'number' && isFinite(g.monthly) && g.monthly >= 0) o.monthly = Math.round(g.monthly);
    if (g.emergency && !hasE) { hasE = true; o.emergency = true; o.stretch = num(g.stretch); }
    goals.push(o);
  });
  return { lines, goals };
}
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
    out.push(rc);
  });
  return out;
}
