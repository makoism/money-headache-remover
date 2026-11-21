/* A real-life-shaped yen plan, with MADE-UP numbers (Mako's decision 9: no real figures in the repo). Replaces good1.js and mako_scenario.js,
   whose helpers (build.js, joyfull2.js) never reached the repo and which carried real figures. Mako tests version one with his own numbers;
   this keeps the same shape in every release: a month that plans more than the pay, a small bank, Free to spend in the tens of thousands,
   one bill logged past its plan, and a healthy variant that must say "You are okay".
   Every expected figure below is worked out by hand from the plan in this file, not by the app.
   Run: node tests/qc/scenario_yen.js */
const { phone, w } = require('/tmp/v39/real.js');
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html', KEY = 'money-map-template-v2';
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; console.log('     saw ' + JSON.stringify(saw).slice(0, 300)); } };

/* the plan (made up). Bills and basics 98,000 + 14,000 + 62,000 + 5,500 + 3,900 + 18,000 + 4,600 + 9,000 = 215,000.
   Free to spend 28,000, Education 10,000, Investing 30,000, Giving 5,000, goals 30,000 + 18,000 = 48,000.
   Out = 215,000 + 28,000 + 10,000 + 30,000 + 5,000 + 48,000 = 336,000. */
const LINES = { 'bill:rent': 98000, 'bill:util': 14000, 'bill:food': 62000, 'bill:net': 5500, 'bill:phone': 3900, 'bill:ins': 18000, 'bill:subs': 4600, 'bill:gas': 9000, 'bill:loan': 0, card: 0, envelope: 28000, education: 10000, invest: 30000, give: 5000 };
function plan(pay) {
  const lines = [['rent', 'bill:rent', 'nec', 'Rent or mortgage'], ['util', 'bill:util', 'nec', 'Utilities'], ['food', 'bill:food', 'nec', 'Food and groceries'], ['net', 'bill:net', 'nec', 'Internet'], ['phone', 'bill:phone', 'nec', 'Phone'], ['ins', 'bill:ins', 'nec', 'Insurance and contributions'], ['subs', 'bill:subs', 'nec', 'Subscriptions'], ['gas', 'bill:gas', 'nec', 'Transport'], ['loan', 'bill:loan', 'nec', 'Loan or debt payment'], ['card', 'card', 'nec', 'Other card spending'], ['spend', 'envelope', 'play', 'Free to spend'], ['learn', 'education', 'edu', 'Courses and books'], ['invest', 'invest', 'ffa', 'Investing'], ['give', 'give', 'give', 'Giving']]
    .map(([id, key, jar, name]) => ({ id, key, jar, name, def: LINES[key] }));
  const goals = [{ id: 'rainy', name: 'Emergency fund', target: 600000, start: 120000, due: '', monthly: 30000, emergency: true, stretch: 0, slot: 7 }, { id: 'travel', name: 'Trip', target: 150000, start: 0, due: '', monthly: 18000, slot: 5 }];
  return { v: 1, rev: 3, steps: { a: [{ from: '2026-11', v: pay }] }, once: {}, items: {}, cfg: { bankStart: 52000, minBank: 10000 }, plan: { lines, goals },
    ui: { cur: '¥', preset: '¥', toured: true, setup: true, sampleHidden: true, done: { pay: true, bills: true, goals: true, receipts: true }, seen: { home: true, month: true, goals: true, receipts: true, basics: true } },
    /* November: food logged 64,500 (2,500 past its plan of 62,000), Free to spend logged 3,000 */
    receipts: [{ id: 'r1', d: '2026-11-04', a: 40000, c: 'bill:food', cn: 'Food and groceries', n: '' }, { id: 'r2', d: '2026-11-18', a: 24500, c: 'bill:food', cn: 'Food and groceries', n: '' }, { id: 'r3', d: '2026-11-09', a: 3000, c: 'envelope', cn: 'Free to spend', n: '' }] };
}
async function open(st) {
  const o = await phone({ w: 390, h: 844, dpr: 1, mobile: true });
  await o.p.evaluateOnNewDocument((k, v) => { localStorage.setItem(k, v); }, KEY, JSON.stringify(st));
  await o.p.evaluateOnNewDocument(() => { const real = Date, fixed = new real('2026-11-20T10:00:00').getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; });
  await o.p.goto('file://' + PAGE + '?sfxtest#2026-11'); await w(1500);
  return o;
}
const read = p => p.evaluate(() => {
  const t = s => { const e = document.querySelector(s); return e ? e.textContent.replace(/\s+/g, ' ').trim() : null; };
  const li = [...document.querySelectorAll('#hMap .mp-nums .mp-n')].map(x => [x.querySelector('.mp-l').textContent.trim(), x.querySelector('b').textContent.trim()]);
  document.getElementById('tab-month').click();
  return { left: t('#leftTotal'), hero: t('#heroNum'), mapBank: ((/^Bank (\S+) \+/.exec(t('#hMap .mp-proof') || '')) || [])[1],   /* version one: the bank figure is in the proof line (the old "In the bank" tile became the four numbers) */ status: t('#hStatus'), proofBad: !!document.querySelector('#hMap .mp-bad'), errlog: localStorage.getItem('mhr-errlog') };
});
(async () => {
  /* the tight month. Left over = 300,000 - 336,000 = -36,000. Planned bank end = 52,000 - 36,000 = 16,000.
     Food past plan 2,500 comes out of the bank: 13,500. That is above the 10,000 minimum, so nothing is held back:
     Free to spend safe = 28,000 - 3,000 = 25,000. */
  { const { b, p, errs } = await open(plan(300000)); const R = await read(p);
    ck('tight month: left over is -36,000', R.left.replace(/\u2060/g, '') === '−¥36,000', R.left);
    ck('tight month: the bank ends at 13,500 (16,000 planned, less 2,500 spent past the food plan)', R.mapBank === '¥13,500', R.mapBank);
    ck('tight month: Free to spend still safe is 25,000', R.hero === '¥25,000', R.hero);
    ck('tight month: the proof holds (no "do not add up")', !R.proofBad, R.proofBad);
    ck('tight month: no page errors and an empty error log', errs.length === 0 && (!R.errlog || R.errlog === '[]'), [errs, R.errlog]);
    await b.close(); }
  /* the healthy month. Pay 360,000 and spending inside the plan (food 58,000 of 62,000): left over = 360,000 - 336,000 = +24,000;
     bank 52,000 + 24,000 = 76,000, above the minimum, nothing past plan. */
  const healthy = plan(360000); healthy.receipts = [{ id: 'h1', d: '2026-11-04', a: 58000, c: 'bill:food', cn: 'Food and groceries', n: '' }, { id: 'h2', d: '2026-11-09', a: 3000, c: 'envelope', cn: 'Free to spend', n: '' }];
  { const { b, p, errs } = await open(healthy); const R = await read(p);
    ck('healthy month: Home says "You are okay"', /You are okay/.test(R.status || ''), R.status);
    ck('healthy month: left over is 24,000', R.left === '¥24,000', R.left);
    ck('healthy month: the bank ends at 76,000', R.mapBank === '¥76,000', R.mapBank);
    ck('healthy month: no page errors and an empty error log', errs.length === 0 && (!R.errlog || R.errlog === '[]'), [errs, R.errlog]);
    await b.close(); }
  console.log(bad ? 'SCENARIO FAILED ' + bad : 'SCENARIO ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('CRASH', e.stack); process.exit(2); });
