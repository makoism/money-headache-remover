/* J-009: Export spreadsheet in a view that cannot download files (the Claude viewer with no save prompt) gives a real way out.
   Before: the message stopped at "can't download" with nothing to do next. Now the table is copied, tab separated, ready to paste
   into a spreadsheet, and the message says so; when copying fails too the message still names a next step.
   Save file keeps its own pointer to Copy text. Made-up numbers. The test reads ids and the clipboard, not the wording.
   Run: node tests/qc/export_way_out.js */
let bad = 0; const ck = (n, c, x) => { console.log(c ? 'PASS' : 'FAIL', n, c ? '' : (x || '')); if (!c) bad++; };
const L = require('./lib_r12.js'); const R = L.R; const w = R.w;
(async () => {
  const { b, p, errs } = await L.start({ w: 390, h: 844, dpr: 1, mobile: true });
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '¥'; });
  await L.base(p, { pay: 280000, bank: 412000, min: 0, defs: { 'bill:rent': 95000, 'bill:food': 45000, envelope: 30000, education: 0, invest: 10000, give: 0 }, tT: 0, tM: 0, eT: 300000, eS: 0, eM: 20000, noTrip: true });
  await L.settings(p);
  const run = async (clipOk, btn) => p.evaluate(async (clipOk, btn) => {
    window.claude = { use: async () => null };   /* the viewer is there, its save prompt is not */
    window.__clip = null;
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async t => { if (!clipOk) throw new Error('no'); window.__clip = t; } } });
    document.execCommand = () => false;
    const m = document.getElementById('bkMsg'); m.textContent = '';
    document.getElementById(btn).click(); await new Promise(r => setTimeout(r, 500));
    return { msg: m.textContent.trim(), clip: window.__clip };
  }, clipOk, btn);
  const save = await run(true, 'bkSave');
  const base = save.msg.split('.')[0] + '.';
  ck('Save file says it cannot download and points on', save.msg.length > base.length + 5, JSON.stringify(save));
  const a = await run(true, 'bkCsv');
  const rows = (a.clip || '').split('\n');
  ck('Export: the table is copied when it cannot be downloaded', !!a.clip && rows.length > 5, JSON.stringify(a).slice(0, 300));
  ck('Export: the copy is tab separated, one line per row, no stray marks', rows.length > 5 && rows.filter(r => r.includes('\t')).length > 5 && !/\r|﻿/.test(a.clip || ''), JSON.stringify(rows.slice(0, 3)));
  ck('Export: the copy holds the made-up pay', /280000|280,000/.test(a.clip || ''));
  ck('Export: the message says more than "cannot download"', a.msg.startsWith(base) && a.msg.length > base.length + 20, a.msg);
  const c = await run(false, 'bkCsv');
  ck('Export, copy fails too: nothing is said to be copied, a next step is still named', c.msg.startsWith(base) && c.msg.length > base.length + 20 && c.msg !== a.msg, c.msg);
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();
  console.log(bad ? 'EXPORT WAY OUT FAIL ' + bad : 'EXPORT WAY OUT PASS'); process.exit(bad ? 1 : 0);
})();
