/* ===== UI ===== */
(function () {
'use strict';
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const KEY = 'money-map-template-v2';
const PAGE_URL = 'https://claude.ai/artifact/Ksf1kNTW7KRsd7ZHmiVC1w';
/* what the person would like this page to help with (chosen on the welcome screens; the keys are the only values ever stored) */
const HOPES = { see: ['See where it goes', 'see where your money goes'], save: ['Save for a goal', 'save for a goal'], calm: ['Less money stress', 'feel calm about money'], owe: ['Pay down debt', 'pay down debt'] };
const cleanName = v => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 24);
const cleanSubName = v => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 30);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const fullLabel = ym => FULL[+ym.slice(5) - 1] + ' ' + ym.slice(0, 4);
const TABS = ['home', 'month', 'months', 'goals', 'receipts', 'basics'];
/* the tab bar, in the order people reach for them; 'months' is opened from a link */
const TAB_BAR = ['home', 'receipts', 'goals', 'month', 'basics'];

let S = freshState(), C = null, sel = START, tab = 'home', openId = null, editRow = null, editGoal = null, editRc = null;
let saveTimer = null, raf = 0, itemsSig = '', geom = null, FIELDS = [];

/* ---------- small helpers ---------- */
const sym = () => { const c = (S.ui && S.ui.cur) || '₱'; return c === 'none' ? '' : c; };
const pre = () => { const c = sym(); return /^[A-Za-z]{2,}$/.test(c) ? c + ' ' : c; };
function fmt(n) { n = Math.round(n); const neg = n < 0, a = Math.abs(n); return (neg ? '−' : '') + pre() + a.toLocaleString('en-US'); }
/* receipts keep their centavos */
function fmt2(n) { if (Math.abs(n - Math.round(n)) < 0.005) return fmt(n); return (n < 0 ? '−' : '') + pre() + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtAxis(n) { return n >= 1e6 ? +(n / 1e6).toFixed(2) + 'M' : n >= 1000 ? +(n / 1000).toFixed(1) + 'K' : String(n); }
const niceUp = x => { if (x <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(x))); for (const k of [1, 1.5, 2, 3, 4, 5, 6, 8, 10]) if (k * p >= x - 1e-9) return k * p; return 10 * p; };
const stepOf = x => { const p = Math.pow(10, Math.floor(Math.log10(Math.max(x, 1)))); for (const k of [1, 2, 5, 10]) if (k * p >= x) return k * p; return 10 * p; };
const payScale = () => Math.max(1000, val(S, 'a', sel) + val(S, 'b', sel) + val(S, 'side', sel));
const roundTo = x => { const u = x >= 1000 ? 100 : x >= 60 ? 10 : 1; return Math.round(x / u) * u; };
const setIdle = (el, v) => { if (el && document.activeElement !== el) el.value = v; };
const IC = {
  ok: '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="currentColor" opacity=".2"/><path d="M5.8 10.3l2.9 2.9 5.5-6.2" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  warn: '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 2.8l8 14H2z" fill="currentColor" opacity=".2" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M10 8v4M10 14.4v.1" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  bad: '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="currentColor" opacity=".25"/><path d="M6.5 6.5l7 7M13.5 6.5l-7 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  clock: '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.8"/><path d="M10 5.5V10l3 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  chev: '<svg class="chev" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 8l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
const dateLabel = d => (+d.slice(8, 10)) + ' ' + MONTH_NAMES[+d.slice(5, 7) - 1] + ' ' + d.slice(0, 4);
const timeLabel = t => { const c = clockParts(t), h = c.h % 12 || 12; return h + ':' + pad2(c.mi) + (c.h < 12 ? ' am' : ' pm'); };
/* today as YYYY-MM-DD, kept inside the months the page covers */
function todayStr() {
  const d = new Date(), s = d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  return s.slice(0, 7) < START ? START + '-01' : s.slice(0, 7) > END ? END + '-01' : s;
}

/* a line Claude wrote about a goal is kept only if it is short, plain text with no numbers or markup in it */
const cleanWin = t => { t = String(t).replace(/\s+/g, ' ').trim().replace(/[.!\s]+$/, ''); return t.length >= 4 && t.length <= 70 && !/[<>&"`{}\[\]\\\d$€£¥₱%]/.test(t) && !/https?:|www\./i.test(t) ? t : ''; };
/* ---------- state load / save ---------- */
function normalize(d) {
  const f = freshState(); if (!d || typeof d !== 'object') return f;
  /* every amount in a saved or imported copy is checked: a text, a negative number or a broken list never reaches the sums */
  f.steps = cleanSteps(d.steps); f.once = cleanOnce(d.once); f.items = cleanItems(d.items); f.cfg = cleanCfg(d.cfg);
  if (d.ui && typeof d.ui === 'object') f.ui = Object.assign(f.ui, d.ui);
  const u = f.ui;
  if (!(d.ui && typeof d.ui.preset === 'string') || Object.keys(SAMPLES).concat(['blank', 'legacy']).indexOf(u.preset) < 0) u.preset = 'legacy';
  if (u.cleared !== true) delete u.cleared;
  if (typeof u.cur !== 'string' || u.cur.length > 4 || /[<>&"'`]/.test(u.cur)) u.cur = '₱';
  if (typeof u.name !== 'string' || !cleanName(u.name)) delete u.name; else u.name = cleanName(u.name);
  if (typeof u.hope !== 'string' || !Object.prototype.hasOwnProperty.call(HOPES, u.hope)) delete u.hope;
  if (!(u.rcDay >= 0 && u.rcDay <= 6)) delete u.rcDay;
  if (typeof u.rcTime !== 'string' || !/^\d{2}:\d{2}$/.test(u.rcTime)) delete u.rcTime;
  if (!REMIND_FREQS.some(x => x[0] === u.rcFreq)) delete u.rcFreq;
  if (!(Number.isInteger(u.rcDom) && (u.rcDom === DOM_LAST || (u.rcDom >= 1 && u.rcDom <= 28)))) delete u.rcDom;
  if (typeof u.rcCat !== 'string' || !/^[A-Za-z0-9:_-]{1,40}$/.test(u.rcCat)) delete u.rcCat;
  if (!u.done || typeof u.done !== 'object') delete u.done;
  ['setup', 'gset'].forEach(k => { if (u[k] !== true) delete u[k]; });
  if (typeof u.tourAt !== 'string' || !/^[a-z0-9-]{1,30}$/.test(u.tourAt)) delete u.tourAt;
  if (!Array.isArray(u.sb)) delete u.sb; else u.sb = u.sb.filter(x => typeof x === 'string' && SAFE_ID.test(x)).slice(0, MAX_LINES);
  if (!u.seen || typeof u.seen !== 'object' || Array.isArray(u.seen)) delete u.seen; else { const sn = {}; TABS.forEach(t => { if (u.seen[t] === true) sn[t] = true; }); u.seen = sn; }
  f.rev = +d.rev || 0;
  if (!Array.isArray(u.subs)) delete u.subs; else u.subs = u.subs.filter(x => typeof x === 'string' && /^[a-z0-9]{2,14}$/.test(x)).slice(0, 40);
  delete u.loanMode; delete u.loanTotal;
  if (u.mute !== true) delete u.mute;
  delete u.subsX;
  const cents = v => Math.round(v * 100) / 100;
  if (!(u.cardT > 0 && u.cardT < 1e9)) delete u.cardT; else u.cardT = cents(u.cardT);
  if (!(u.cardB > 0 && u.cardB < 1e9)) delete u.cardB; else u.cardB = cents(u.cardB);
  if (!Array.isArray(u.subO)) delete u.subO; else { const o = u.subO.slice(0, 12).map(x => (x && typeof x === 'object' ? { n: cleanSubName(x.n), a: x.a > 0 && x.a < 1e9 ? cents(x.a) : 0 } : null)).filter(x => x && (x.n || x.a)); if (o.length) u.subO = o; else delete u.subO; }
  const idMap = (o, ok) => { if (!o || typeof o !== 'object' || Array.isArray(o)) return null; const r = {}; Object.keys(o).slice(0, 80).forEach(k => { if (SAFE_ID.test(k)) { const v = ok(o[k]); if (v !== undefined) r[k] = v; } }); return Object.keys(r).length ? r : null; };
  { const l = idMap(u.loans, v => (v && typeof v === 'object' ? (() => { const r = {}; if (v.m === 'total') r.m = 'total'; if (v.t > 0 && v.t < 1e12) r.t = Math.round(v.t); return Object.keys(r).length ? r : undefined; })() : undefined)); if (l) u.loans = l; else delete u.loans; }
  { const l = idMap(u.subP, v => (v > 0 && v < 1e9 ? cents(v) : undefined)); if (l) u.subP = l; else delete u.subP; }
  { const l = idMap(u.more, v => (v === 'loan' || v === 'ins' ? v : undefined)); if (l) u.more = l; else delete u.more; }
  { const l = idMap(u.gk, v => (typeof v === 'string' && /^[a-z0-9]{2,14}$/.test(v) ? v : undefined)); if (l) u.gk = l; else delete u.gk; }
  { const l = idMap(u.ms, v => (v >= 0 && v <= 4 ? Math.round(v) : undefined)); if (l) u.ms = l; else delete u.ms; }
  { const l = idMap(u.bd, v => (v === true ? true : undefined)); if (l) u.bd = l; else delete u.bd; }
  if (typeof u.main !== 'string' || !SAFE_ID.test(u.main)) delete u.main;
  { const l = idMap(u.win, v => (v && typeof v === 'object' && typeof v.n === 'string' && typeof v.t === 'string' ? (() => { const t = cleanWin(v.t); return t && v.n.length <= 60 ? { n: v.n, t } : undefined; })() : undefined)); if (l) u.win = l; else delete u.win; }
  if (!Array.isArray(u.wk)) delete u.wk; else u.wk = Array.from(new Set(u.wk.filter(x => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x)))).sort().slice(-160);
  f.plan = cleanPlan(d.plan, f.cfg);
  { const cl = f.plan && f.plan.lines && f.plan.lines.find(l => l.id === 'card'), nw = LINE_DEFS.find(l => l.id === 'card');
    if (cl && nw) { if (cl.name === CARD_OLD.name) cl.name = nw.name; if (cl.note === CARD_OLD.note) cl.note = nw.note; } }
  /* the play line was once called "Spending money"; an untouched old name follows the new one */
  { const sl = f.plan && f.plan.lines && f.plan.lines.find(l => l.id === 'spend'); if (sl && sl.name === 'Spending money') sl.name = 'Play money'; }
  f.receipts = cleanReceipts(d.receipts);
  return f;
}
/* Changing the currency swaps in that currency's sample (or zeros) only while the numbers are still untouched.
   Once someone has typed their own, only the symbol changes. */
const stable = o => JSON.stringify(o, (k, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.keys(v).sort().reduce((a, x) => (a[x] = v[x], a), {}) : v);
const dataSig = x => stable({ plan: x.plan, steps: x.steps, once: x.once, items: x.items, cfg: x.cfg, receipts: x.receipts });
/* a few of the examples are Philippine, so they show only when the currency is the peso */
const LOCAL_SWAPS = [
  ['include your own SSS, PhilHealth and Pag-IBIG payments', 'include your own public pension and health insurance payments'],
  ['Commute, Grab, fuel', 'Commute, taxis, fuel'],
  ['Pag-IBIG MP2, a UITF, an index fund, any retirement plan', 'An index fund, any retirement plan'],
  ['E-wallets: the history in GCash, Maya or similar.', 'E-wallets: the history in your wallet app.'],
];
const localize = t => (S && S.ui && S.ui.cur !== '₱') ? LOCAL_SWAPS.reduce((x, [a, b]) => x.split(a).join(b), t) : t;
function presetIsUntouched() {
  const key = presetKey(S);
  if (!(SAMPLES[key] || key === 'blank') || S.ui.cleared) return false;
  const mine = dataSig(normalize(JSON.parse(JSON.stringify(S))));
  return [false, true].some(v1 => mine === dataSig(normalize(presetState(key === 'blank' ? '$' : key, v1))));
}
/* the original sample (35,000 pesos) that older saved copies still have */
const legacyState = v1 => ({ v: 1, rev: 0, steps: {}, once: {}, items: {}, cfg: {}, ui: { cur: '₱', preset: 'legacy' }, plan: basePlan({}, v1), receipts: [] });
const INCOME_KEYS = ['a', 'b', 'side'];
/* Are the bills and goals still exactly the loaded sample's? Typing a pay, a balance or a receipt does not count against that.
   Editing a line or a goal, or changing one month's bill, does. */
function planIsSample(st) {
  if (!st || !st.ui || st.ui.cleared) return false;
  const key = presetKey(st);
  if (!(key === 'legacy' || SAMPLES[key] || key === 'blank')) return false;
  if (Object.keys(st.steps || {}).some(k => INCOME_KEYS.indexOf(k) < 0)) return false;
  if (Object.keys(st.once || {}).some(ym => Object.keys(st.once[ym] || {}).some(k => INCOME_KEYS.indexOf(k) < 0))) return false;
  if (Object.keys(st.items || {}).length) return false;
  const mine = stable(normalize(JSON.parse(JSON.stringify(st))).plan);
  return [false, true].some(v1 => {
    const ref = key === 'legacy' ? legacyState(v1) : presetState(key === 'blank' ? '$' : key, v1);
    ref.cfg = JSON.parse(JSON.stringify(st.cfg || {}));
    return mine === stable(normalize(ref).plan);
  });
}
function swapPlanTo(st, cur) { const p = presetState(cur); st.plan = p.plan; st.ui.preset = p.ui.preset; }
/* An older saved copy in a currency that is not the peso still has the peso-sized bills. Bring them to this currency's sample
   (or to zero), and keep everything the person typed. */
function upgradeLegacy(st) { if (st && st.ui && presetKey(st) === 'legacy' && st.ui.cur !== '₱' && planIsSample(st)) swapPlanTo(st, st.ui.cur); return st; }
/* Returns 'all' when the whole sample was swapped, 'plan' when only the bills and goals were (the pay and balances typed stay), or false. */
function changeCurrency(v) {
  if (v === S.ui.cur) return false;
  const all = presetIsUntouched(), planOnly = !all && planIsSample(S);
  S.ui.cur = v;
  if (all) {
    const p = presetState(v);
    S.plan = p.plan; S.steps = p.steps; S.once = p.once; S.items = p.items; S.cfg = p.cfg; S.ui.preset = p.ui.preset;
  } else if (planOnly) swapPlanTo(S, v);
  if (all || planOnly) { editRow = null; editGoal = null; editRc = null; itemsSig = ''; }
  persist();
  return all ? 'all' : planOnly ? 'plan' : false;
}
/* appearance: Auto follows the device. The choice is about this browser, so it is kept apart from the plan and does not travel with a backup. */
const THEME_KEY = 'money-map-theme';
const themePref = () => { try { const v = localStorage.getItem(THEME_KEY); return v === 'light' || v === 'dark' ? v : 'auto'; } catch (e) { return 'auto'; } };
function applyTheme() {
  const t = themePref(), root = document.documentElement;
  if (t === 'auto') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', t);
  $$('#themeSeg [data-theme-set]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.themeSet === t)));
  /* an installed copy also colours the phone's top bar */
  $$('meta[name="theme-color"]').forEach(m => {
    if (m.dataset.media === undefined) { m.dataset.media = m.getAttribute('media') || ''; m.dataset.content = m.getAttribute('content') || ''; }
    if (t === 'auto') { if (m.dataset.media) m.setAttribute('media', m.dataset.media); m.setAttribute('content', m.dataset.content); } else { m.removeAttribute('media'); m.setAttribute('content', t === 'dark' ? '#000000' : '#fbfbfd'); }
  });
}
function setTheme(t) { try { if (t === 'light' || t === 'dark') localStorage.setItem(THEME_KEY, t); else localStorage.removeItem(THEME_KEY); } catch (e) { /* no storage: it lasts until the page closes */ } applyTheme(); }
/* what loadLocal found: 'ok' (saved numbers read), 'none' (nothing saved yet) or 'bad' (storage blocked or the saved text is damaged). Anything but 'ok' lets ui43.js look for the second copy. */
let LS_STATE = 'none';
function loadLocal() { applyTheme(); try { const raw = localStorage.getItem(KEY); if (raw) { S = upgradeLegacy(normalize(JSON.parse(raw))); LS_STATE = 'ok'; } } catch (e) { LS_STATE = 'bad'; /* no storage, or damaged */ } }
function setSave(kind) {
  const el = $('#save'), t = $('#saveTxt'); el.className = 'save ' + (kind === 'ok' ? 'ok' : kind === 'busy' ? 'busy' : '');
  t.textContent = { ok: 'Saved', busy: 'Saving…', device: 'Saved in this browser', error: 'Not saved. Save a copy in Settings.' }[kind] || '';
}
function persist() { S.rev = Date.now(); setSave('busy'); clearTimeout(saveTimer); saveTimer = setTimeout(flush, 500); }
function flush() { let ok = true; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { ok = false; } setSave(ok ? 'device' : 'error'); mirrorOut(m => { if (!ok && m) setSave('device'); }); vaultQueue(); }
/* first steps the page walks a new person through; each ticks off when they do it */
function markDone(k, quiet) { if (!k) return; const d = S.ui.done = S.ui.done || {}, was = !!d[k]; d[k] = true; if (!was && !quiet) afterDone(k); }
const doneFor = key => (key === 'a' || key === 'b' || key === 'side' ? 'pay' : key.slice(0, 5) === 'goal:' ? 'goals' : (lineByKey(S, key) && lineByKey(S, key).jar === 'nec' ? 'bills' : null));

/* ---------- edits ---------- */
/* Every change applies to the open month only. "Keep for later months" turns it into the plan from this month on. */
function onSet(key, v) { v = clampAmt(v); setVal(S, key, sel, v, 'once'); markDone(doneFor(key)); persist(); schedule(); }
function onCfg(k, v) { S.cfg[k] = clampAmt(v); persist(); schedule(); }
function select(ym) {
  sel = ym; itemsSig = ''; try { history.replaceState(null, '', '#' + ym); } catch (e) { /* sandboxed */ }
  render();
}
function schedule() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; render(); }); }
/* the value a key would have this month without this month's own change */
function fstate(key) {
  const o = S.once[sel]; if (!o || o[key] === undefined || ONCE_KEYS.has(key)) return null;
  const ov = o[key]; delete o[key]; const u = val(S, key, sel); o[key] = ov;
  return ov !== u ? { ov, u } : null;
}
const undoKey = key => undoOnce(S, sel, key);

/* a button that needs a second tap before it does something that cannot be undone */
let armedKey = null, armedTimer = 0;
function disarm() { clearTimeout(armedTimer); if (armedKey !== null) { const b = document.querySelector('[data-orig]'); if (b) { b.textContent = b.dataset.orig; delete b.dataset.orig; } } armedKey = null; }
function confirmClick(btn, text, run) {
  const key = btn.dataset.armkey || btn.id;
  if (armedKey === key) { clearTimeout(armedTimer); armedKey = null; delete btn.dataset.orig; run(); return; }
  disarm(); armedKey = key; btn.dataset.orig = btn.textContent; btn.textContent = text; armedTimer = setTimeout(disarm, 4000);
}
