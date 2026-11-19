/* LAUNCH_CHECKLIST.md v1 points in setup, on the built page. Made-up numbers.
   D2  No sample money in sentences during setup: walking setup without typing anything, no visible sentence (setup card, the band and
       the dock behind it) shows an amount of money. Amounts come only from what the person typed.
   D3  The emergency fund step says plainly what to do with money already saved, without "take it out of that number".
   Run: node tests/qc/v1_setup.js */
let bad = 0; const ck = (n, c, x) => { console.log(c ? 'PASS' : 'FAIL', n, c ? '' : (x || '')); if (!c) bad++; };
const R = require('/tmp/v39/real.js'); const w = R.w;
const PAGE = 'file://' + (process.env.BUILD || '/home/claude/work/money-map-team.html') + '?sfxtest';
const MONEY = /[¥₱$€£]\s?\d[\d,]*(\.\d+)?/;
const seen = () => {
  const vis = e => !!e && !e.hidden && (e.offsetParent || e.getClientRects().length) && getComputedStyle(e).visibility !== 'hidden';
  const out = [];
  /* sentences only: inputs and their typed values are not sentences */
  const tour = document.querySelector('#tour, .tour'); if (vis(tour)) out.push(['setup', tour.innerText]);
  ['mgBand', 'dock', 'hStatus'].forEach(id => { const e = document.getElementById(id); if (vis(e)) { const r = e.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + Math.min(r.height / 2, 10);
    const top = y >= 0 && y < innerHeight ? document.elementFromPoint(x, y) : null; if (top && e.contains(top)) out.push([id, e.innerText]); } });
  return out;
};
(async () => {
  const { b, p, errs } = await R.phone({ w: 390, h: 844, dpr: 1, mobile: true });
  await p.goto(PAGE); await w(1500);
  const found = []; let emerg = '';
  for (let i = 0; i < 12; i++) {
    const s = await p.evaluate(seen);
    s.forEach(([where, t]) => { const m = t.match(MONEY); if (m) found.push('step ' + i + ' ' + where + ': ' + (t.match(new RegExp('.{0,50}' + m[0].replace(/[$.]/g, '\\$&') + '.{0,40}')) || [m[0]])[0].replace(/\n/g, ' ')); });
    const t = await p.evaluate(() => { const e = document.querySelector('#tour, .tour'); return e ? e.innerText : ''; });
    if (/Emergency fund/.test(t) && /Already saved/.test(t)) emerg = t;
    if (/Setup done/.test(t)) break;
    const ok = await p.evaluate(() => { const n = document.getElementById('tourNext'); if (n && n.offsetParent) { n.click(); return true; } return false; }); if (!ok) break; await w(800);
  }
  ck('D2 no amount of sample money in any sentence during setup, nothing typed (' + found.length + ')', found.length === 0, found.join(' || '));
  ck('D3 the emergency fund step was reached', !!emerg);
  ck('D3 no "take it out of that number" wording', !/take it out of that number|counted twice/.test(emerg), (emerg.match(/If this money.{0,120}/) || [''])[0]);
  ck('D3 says plainly what to do when the savings sit in the same account as the balance', /same (bank )?account/.test(emerg) && /lower/i.test(emerg), (emerg.match(/Already saved[^]{0,260}/) || [''])[0]);
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();
  console.log(bad ? 'V1 SETUP FAIL ' + bad : 'V1 SETUP PASS'); process.exit(bad ? 1 : 0);
})();
