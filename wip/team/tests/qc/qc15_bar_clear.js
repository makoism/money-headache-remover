/* After the Undo bar of a big change started to stay across tabs (QC round 6 data safety blocker), at 320 wide it covered Receipts' Log
   button: the page must let a person scroll every control clear of the bar. With the bar up, the page's last controls can sit above it.
   Made-up numbers.  Run: node tests/qc/qc15_bar_clear.js */
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 400)); } };
(async () => {
  for (const [W, H] of [[320, 568], [320, 640], [390, 844]]) {
    const { b, p, errs } = await R.phone({ w: W, h: H, dpr: 1, mobile: true });
    await p.goto('file://' + PAGE + '?sfxtest'); await w(1200);
    for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); }
    await L.settings(p); await p.evaluate(() => document.getElementById('blankBtn').click()); await w(700); await p.evaluate(() => document.getElementById('blankBtn').click()); await w(700);
    await L.tab(p, 'tab-receipts'); await w(500);
    const r = await p.evaluate(() => { const u = document.getElementById('undoBar'), out = [];
      if (u.hidden) return { bar: false };
      for (const id of ['rcSave', 'rcAmt']) { const e = document.getElementById(id); if (!e || !e.getClientRects().length) continue; e.scrollIntoView({ block: 'nearest' });
        const q = e.getBoundingClientRect(), t = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2); if (!(t === e || e.contains(t))) out.push(id + ' under ' + (t && (t.id || t.className))); }
      window.scrollTo(0, document.documentElement.scrollHeight); const last = [...document.querySelectorAll('#v-receipts button, main button')].filter(e => e.getClientRects().length).pop();
      const lq = last && last.getBoundingClientRect(), ub = u.getBoundingClientRect();
      return { bar: true, out, lastClear: !last || lq.bottom <= ub.top + 1 || lq.top >= ub.bottom - 1, last: last && (last.id || last.textContent.trim().slice(0, 30)) }; });
    ck(`${W}x${H}: the reset's Undo bar is still up on Receipts`, r.bar, r);
    ck(`${W}x${H}: Log and the amount box can be brought clear of the bar`, r.bar && r.out.length === 0, r);
    ck(`${W}x${H}: scrolled to the end, the last button is clear of the bar`, r.bar && r.lastClear, r);
    const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e)); ck(`${W}x${H}: no page errors`, e2.length === 0, e2.slice(0, 3));
    await b.close();
  }
  console.log(bad ? `qc15_bar_clear: ${bad} FAIL` : 'qc15_bar_clear: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc15_bar_clear: FAIL'); process.exit(1); });
