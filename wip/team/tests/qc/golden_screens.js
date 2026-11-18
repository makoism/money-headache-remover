/* Golden screens: the words and numbers on every tab, for a fixed set of random plans, receipts and dates.
   Use it around any change that is NOT meant to change what people see (moving maths into the model, tidying, speed work):
     node tests/qc/golden_screens.js record /tmp/golden_before.json      before the change (on the old build)
     node tests/qc/golden_screens.js compare /tmp/golden_before.json     after the change (on the new build)
   compare prints every place the screen text differs and exits 1 if there is any. A difference is either a bug or an intended
   change; an intended change is listed in the release notes and the baseline is recorded again.
   Env: N (plans, default 14), SEED (default 7), PAGE (the built page). Needs tests/setup_env.sh to have run. */
const fs = require('fs');
const { phone, w } = require('/tmp/v39/real.js');
const { M, randomState, setSeed, pick, ri } = require('/tmp/v25/oracle.js');
const MODE = process.argv[2], FILE = process.argv[3];
if (!/^(record|compare)$/.test(MODE || '') || !FILE) { console.log('usage: golden_screens.js record|compare <file>'); process.exit(2); }
const N = +(process.env.N || 14); setSeed(+(process.env.SEED || 7));
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
const TABS = ['home', 'receipts', 'goals', 'month', 'months', 'basics'];

function makeState(t) {
  const S = randomState();
  if (t % 5 === 1) S.ui.cur = '¥'; if (t % 7 === 3) S.ui.cur = 'CHF';
  const ym = pick(M.MONTHS.slice(0, 12)), day = pick([1, 3, 10, 15, 22, 27, 28]), today = ym + '-' + String(day).padStart(2, '0');
  const keys = S.plan.lines.map(l => l.key).concat(['other']);
  S.receipts = [];
  /* receipts in the month on screen and in the months before it, so overspending, piles and month-end questions all appear */
  const months = M.MONTHS.slice(0, M.MONTHS.indexOf(ym) + 1).slice(-4);
  months.forEach((mm, k) => {
    const nr = pick([0, 2, 5, 9]);
    for (let i = 0; i < nr; i++) { const c = pick(keys), l = S.plan.lines.find(x => x.key === c); S.receipts.push({ id: 'r' + k + '_' + i, d: mm + '-' + String(ri(1, mm === ym ? day : 28)).padStart(2, '0'), a: S.ui.cur === '¥' ? pick([120, 980, 4000, 12000, ri(1, 90000)]) : Math.round(pick([0.5, 19.99, 250, 1234.56, 4000, ri(1, 900000) / 100]) * 100) / 100, c: l ? c : 'other', cn: l ? l.name : 'Other', n: '' }); }
  });
  if (t % 3 === 0) { S.plan.debts = []; for (let i = 0; i < ri(1, 2); i++) S.plan.debts.push({ id: 'd' + i, name: 'Debt ' + i, kind: pick(['card', 'loan', 'personal']), balance: pick([500, 5000, 60000, ri(1000, 900000)]), apr: pick([0, 12, 24, 36]), min: pick([0, 100, 3000, ri(0, 20000)]), extra: pick([0, 0, 1000, ri(0, 9000)]) }); }
  if (t % 2 === 0) S.ui.limits = true;
  /* some past months already answered: kept in the bank, or put toward a goal */
  if (t % 4 === 1 && months.length > 1) { S.ui.sweep = S.ui.sweep || {}; S.ui.sweep[months[0]] = { amt: 500, to: 'bank' }; }
  if (t % 4 === 2 && months.length > 1 && S.plan.goals[0]) { S.ui.sweep = S.ui.sweep || {}; S.ui.sweep[months[0]] = { amt: 300, id: S.plan.goals[0].id }; }
  S.ui = Object.assign(S.ui, { toured: true, setup: true, sampleHidden: true, done: { pay: true, bills: true, goals: true, receipts: true }, seen: { home: true, month: true, goals: true, receipts: true, basics: true } });
  return { S, ym, today };
}

(async () => {
  const out = {};
  for (let t = 0; t < N; t++) {
    const { S, ym, today } = makeState(t);
    const { b, p, errs } = await phone({ w: 1100, h: 900, dpr: 1 });
    /* the assistant relay's health check is refused every time: through this container's proxy it sometimes answered, so the Receipts screen flickered between two wordings */
    await p.setRequestInterception(true); p.on('request', r => { const u = r.url(); if ((r.isNavigationRequest() && r.frame() === p.mainFrame() && !/^(file|data|blob|about):/.test(u)) || /\/api\//.test(u)) r.abort().catch(() => { }); else r.continue().catch(() => { }); });
    await p.evaluateOnNewDocument(st => { localStorage.setItem('money-map-template-v2', st); }, JSON.stringify(S));
    /* a fixed clock and fixed dice, so two runs of the same build always give the same words */
    await p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(); class D extends real { constructor(...a) { if (!a.length) super(fixed); else super(...a); } static now() { return fixed; } } window.Date = D; let s = 42; Math.random = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296; }, today + 'T10:00:00');
    await p.goto('file://' + PAGE + '#' + ym); await w(1300);
    const key = '#' + t + ' ' + S.ui.cur + ' ' + today; out[key] = {};
    for (const tab of TABS) {
      await p.evaluate(tb => { const e = document.querySelector(`[data-tab="${tb}"]`); if (e) e.click(); }, tab); await w(450);
      out[key][tab] = await p.evaluate(() => { const main = document.querySelector('.wrap') || document.body; return main.innerText.replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim(); });
    }
    /* the windows that explain a number, opened from Home */
    out[key].why = await p.evaluate(async () => { const e = document.querySelector('[data-tab="home"]'); if (e) e.click(); await new Promise(r => setTimeout(r, 300)); const res = []; const btns = [...document.querySelectorAll('[data-why]')].slice(0, 6); for (const bt of btns) { bt.click(); await new Promise(r => setTimeout(r, 200)); const d = document.querySelector('#why'); res.push((bt.dataset.why || '') + ': ' + (d ? d.innerText.replace(/\s+/g, ' ').trim() : '(none)')); const c = d && d.querySelector('[data-close], .close, button'); if (c) c.click(); await new Promise(r => setTimeout(r, 120)); } return res.join('\n'); });
    out[key].errors = errs.join(' | ');
    await b.close();
  }
  if (MODE === 'record') { fs.writeFileSync(FILE, JSON.stringify(out, null, 1)); console.log('recorded', Object.keys(out).length, 'plans x', TABS.length + 1, 'screens to', FILE); process.exit(0); }
  const base = JSON.parse(fs.readFileSync(FILE, 'utf8')); let diffs = 0, shown = 0;
  Object.keys(base).forEach(k => {
    if (!out[k]) { diffs++; console.log('MISSING plan', k); return; }
    Object.keys(base[k]).forEach(tab => {
      const a = base[k][tab] || '', c = out[k][tab] || ''; if (a === c) return;
      const al = a.split('\n'), cl = c.split('\n');
      /* show the lines that changed, not the whole screen */
      const setA = new Set(al), setC = new Set(cl), gone = al.filter(x => !setC.has(x)), came = cl.filter(x => !setA.has(x));
      diffs++; if (shown < 60) { shown++; console.log(`DIFF ${k} [${tab}]`); gone.slice(0, 6).forEach(x => console.log('   was: ' + x.slice(0, 300))); came.slice(0, 6).forEach(x => console.log('   now: ' + x.slice(0, 300))); if (!gone.length && !came.length) console.log('   (same lines, different order)'); }
    });
  });
  console.log(`golden screens: ${Object.keys(base).length} plans, ${diffs} screens differ`);
  console.log(diffs ? 'FAIL the screens changed' : 'PASS no screen changed');
  process.exit(diffs ? 1 : 0);
})();
