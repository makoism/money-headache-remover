/* QC round 11 north-star S7: at 385x730 the toast "Badge: First burrow." covered the Bills and basics row on the Setup done screen.
   A badge earned during setup waits until setup is closed, then shows. Made-up numbers. Run: node tests/qc/qc31_badge_setup.js */
let bad = 0; const ck = (n, c, x) => { console.log(c ? 'PASS' : 'FAIL', n, c ? '' : JSON.stringify(x === undefined ? '' : x).slice(0, 500)); if (!c) bad++; };
const R = require('/tmp/v39/real.js'); const w = R.w;
const PAGE = 'file://' + (process.env.BUILD || process.env.PAGE || '/home/claude/work/money-map-team.html') + '?sfxtest';
const run = async o => {
  const { b, p, errs } = await R.phone({ w: 385, h: 730, dpr: 1, mobile: true });
  await p.goto(PAGE); await w(2500);
  const typ = async (sel, v) => { if (v === undefined) return; await p.click(sel, { count: 3 }); await p.keyboard.press('Backspace'); await p.type(sel, String(v)); };
  let done = ''; const toasts = [], after = [];
  for (let i = 0; i < 24; i++) {
    const flat = await p.evaluate(() => { const t = document.querySelector('#tour'); return t && t.getClientRects().length && document.querySelector('#tourNext') ? t.innerText.replace(/\n+/g, ' / ') : null; });
    if (!flat) break;
    if (/^Setup done|\/ Setup done/.test(flat) || /Setup done/.test(await p.evaluate(() => (document.getElementById('tourTitle') || {}).textContent || ''))) { done = flat; for (let k = 0; k < 12; k++) { await w(400); const c = await p.evaluate(() => { const e = document.getElementById('cheer'); return e && e.classList.contains('on') ? e.textContent : ''; }); if (c) toasts.push(c); } await p.click('#tourNext'); await w(800); for (let k = 0; k < 15; k++) { await w(400); const c = await p.evaluate(() => { const e = document.getElementById('cheer'); return e && e.classList.contains('on') ? e.textContent : ''; }); if (c) after.push(c); } break; }
    if (/Currency/.test(flat)) { await p.evaluate(c => { const r = [...document.querySelectorAll('#tour input[type=radio]')].find(x => x.value === c); r && r.click(); }, o.cur); await w(300); }
    if (await p.$('#tourPay')) { await typ('#tourPay', o.pay); await typ('#tourBank', o.bank); }
    if (await p.$('#tourAmt')) { const name = flat.split(' / ')[4]; await typ('#tourAmt', o.bills[name]); }
    try { await p.click('#tourNext'); } catch (e) { break; } await w(800);
  }
  await b.close(); return { done: done.replace(/\u2060/g, ''), errs, toasts, after };
};
(async () => {
  const r = await run({ cur: '$', pay: '5000', bank: '9000', bills: { 'Rent or mortgage': '1200', 'Food and groceries': '500' } });
  ck('Setup done was reached', !!r.done, r.done);
  ck('no badge toast while Setup done is on screen', !r.toasts.some(t => /Badge|badges:/.test(t)), r.toasts);
  ck('the badge shows once setup is closed', r.after.some(t => /Badge|badges:/.test(t)), r.after);
  ck('no page errors', r.errs.length === 0, r.errs);
  console.log(bad ? 'qc31_badge_setup: ' + bad + ' FAIL' : 'qc31_badge_setup: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed ' + e.stack); console.log('qc31_badge_setup: FAIL'); process.exit(1); });
