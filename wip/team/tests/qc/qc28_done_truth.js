/* QC round 10 north-star F1: Setup done said "On plan" and "Free to spend $205 a month, and it's yours to spend on whatever you want"
   for a plan whose bank starts at -150; one tap later Home said Free to spend $0, below zero today, and Plan said Short. Setup done now
   uses the model's status and safe-to-spend figure, as Home does: no "On plan", no "yours to spend", and it says how much is safe now.
   A plan that is fine still says "On plan". Run: BUILD=/abs/money-map-team.html node tests/qc/qc28_done_truth.js */
let bad = 0; const ck = (n, c, x) => { console.log(c ? 'PASS' : 'FAIL', n, c ? '' : JSON.stringify(x === undefined ? '' : x).slice(0, 500)); if (!c) bad++; };
const R = require('/tmp/v39/real.js'); const w = R.w;
const PAGE = 'file://' + (process.env.BUILD || process.env.PAGE || '/home/claude/work/money-map-team.html') + '?sfxtest';
const run = async o => {
  const { b, p, errs } = await R.phone({ w: 412, h: 915, dpr: 1, mobile: true });
  await p.goto(PAGE); await w(2500);
  const typ = async (sel, v) => { if (v === undefined) return; await p.click(sel, { count: 3 }); await p.keyboard.press('Backspace'); await p.type(sel, String(v)); };
  let done = '';
  for (let i = 0; i < 24; i++) {
    const flat = await p.evaluate(() => { const t = document.querySelector('#tour'); return t && t.getClientRects().length && document.querySelector('#tourNext') ? t.innerText.replace(/\n+/g, ' / ') : null; });
    if (!flat) break;
    if (/^Setup done|\/ Setup done/.test(flat) || /Setup done/.test(await p.evaluate(() => (document.getElementById('tourTitle') || {}).textContent || ''))) { done = flat; break; }
    if (/Currency/.test(flat)) { await p.evaluate(c => { const r = [...document.querySelectorAll('#tour input[type=radio]')].find(x => x.value === c); r && r.click(); }, o.cur); await w(300); }
    if (await p.$('#tourPay')) { await typ('#tourPay', o.pay); await typ('#tourBank', o.bank); }
    if (await p.$('#tourAmt')) { const name = flat.split(' / ')[4]; await typ('#tourAmt', o.bills[name]); }
    try { await p.click('#tourNext'); } catch (e) { break; } await w(800);
  }
  await b.close(); return { done: done.replace(/\u2060/g, ''), errs };
};
(async () => {
  const neg = await run({ cur: '$', pay: '2600', bank: '-150', bills: { 'Rent or mortgage': '1200', 'Food and groceries': '500' } });
  ck('below-zero plan: Setup done was reached', !!neg.done, neg.done);
  ck('below-zero plan: no "On plan"', !!neg.done && !/On plan/.test(neg.done), neg.done);
  ck('below-zero plan: Free to spend is not "yours to spend on whatever you want"', !!neg.done && !/yours to spend/.test(neg.done), neg.done);
  ck('below-zero plan: it says how much is safe to spend now', /safe to spend/.test(neg.done), neg.done);
  const fine = await run({ cur: '$', pay: '5000', bank: '9000', bills: { 'Rent or mortgage': '1200', 'Food and groceries': '500' } });
  ck('a plan that is fine still says "On plan"', /On plan/.test(fine.done), fine.done);
  ck('no page errors', neg.errs.concat(fine.errs).length === 0, neg.errs.concat(fine.errs));
  console.log(bad ? 'qc28_done_truth: ' + bad + ' FAIL' : 'qc28_done_truth: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed ' + e.stack); console.log('qc28_done_truth: FAIL'); process.exit(1); });
