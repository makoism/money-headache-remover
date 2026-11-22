/* QC round 11 novice blocker 1: with pay 3,200, bank 1,500 and bills 1,500, Setup done showed the chip "Not safe to spend yet" and
   then "Right now $385 of it is safe to spend"; Home said "$385 left, not safe to spend yet". When the bank does not cover this
   month's bills and Free to spend, Setup done now says it is not safe to spend yet and gives no safe figure, as Home does.
   Run: BUILD=/abs/money-map-team.html node tests/qc/qc31_done_notsafe.js */
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
  const n = await run({ cur: '$', pay: '3200', bank: '1500', bills: { 'Rent or mortgage': '1100', 'Food and groceries': '400' } });
  ck('Setup done was reached', !!n.done, n.done);
  ck('the chip says Not safe to spend yet', /Not safe to spend yet/.test(n.done), n.done);
  ck('no "$385 of it is safe to spend" under that chip', !/\$[\d,.]*[1-9][\d,.]* of it is safe to spend/.test(n.done), n.done);
  ck('it says Free to spend is not safe to spend yet, as Home does', /not safe to spend yet/.test(n.done.replace(/Not safe to spend yet \//, '')), n.done);
  const fine = await run({ cur: '$', pay: '5000', bank: '9000', bills: { 'Rent or mortgage': '1200', 'Food and groceries': '500' } });
  ck('a plan that is fine still says "On plan"', /On plan/.test(fine.done), fine.done);
  ck('no page errors', n.errs.concat(fine.errs).length === 0, n.errs.concat(fine.errs));
  console.log(bad ? 'qc31_done_notsafe: ' + bad + ' FAIL' : 'qc31_done_notsafe: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed ' + e.stack); console.log('qc31_done_notsafe: FAIL'); process.exit(1); });
