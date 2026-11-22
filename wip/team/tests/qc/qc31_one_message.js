/* QC round 11 novice polish: one $500 spend past Free to spend showed three messages at once: the toast "Logged. Free to spend is $127
   over for this month.", the Undo bar "Logged $500: Free to spend. Undo Close", and "Logged $500: Free to spend." again under the form.
   One message shows now: the Undo bar says what was logged and what went over. The line under the form stays for screen readers only.
   Made-up numbers.  Run: node tests/qc/qc31_one_message.js */
let bad = 0; const ck = (n, c, x) => { console.log(c ? 'PASS' : 'FAIL', n, c ? '' : JSON.stringify(x === undefined ? '' : x).slice(0, 400)); if (!c) bad++; };
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
(async () => {
  const { b, p, errs } = await R.phone({ w: 412, h: 915, dpr: 1, mobile: true, keep: true });
  await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '$'; });
  await L.base(p, { pay: 3200, bank: 3000, min: 0, defs: { 'bill:rent': 1200, 'bill:food': 400, envelope: 385, education: 100, invest: 100, give: 50 }, tT: 600, tM: 100, eT: 4500, eS: 0, eM: 300 }); await w(300); await skip(p);
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; delete S.ui.bd; __t.persist(); __t.restructure(); });
  await L.tab(p, 'tab-home'); await w(400);
  await p.focus('#hAmt'); await p.keyboard.type('500'); await p.evaluate(() => document.getElementById('hSave').click()); await w(900);
  const shown = await p.evaluate(() => { const vis = e => { if (!e) return false; const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 4 && r.height > 4 && cs.visibility !== 'hidden' && cs.display !== 'none' && !e.hidden && !e.closest('[hidden]') && +cs.opacity > 0.05; };
    const out = []; const c = document.getElementById('cheer'); if (c && c.classList.contains('on') && vis(c) && c.textContent.trim()) out.push('toast: ' + c.textContent.trim());
    const u = document.getElementById('undoBar'); if (u && vis(u)) out.push('bar: ' + u.innerText.replace(/\n+/g, ' ').trim());
    const m = document.getElementById('hMsg'); if (m && vis(m) && m.textContent.trim()) out.push('line: ' + m.textContent.trim());
    return out.map(s => s.replace(/\u2060/g, '')); });
  ck('one message on screen after the spend', shown.length === 1, shown);
  ck('it says what was logged and what went over', shown.length >= 1 && /Logged \$500/.test(shown[0]) && /over/.test(shown[0]), shown);
  ck('it has Undo', shown.length >= 1 && /Undo/.test(shown[0]), shown);
  const sr = await p.evaluate(() => (document.getElementById('hMsg') || {}).textContent || '');
  ck('the line under the form still holds the words for screen readers', /Logged \$500/.test(sr), sr);
  ck('no page errors', errs.length === 0, errs.slice(0, 3));
  await b.close(); console.log(bad ? 'qc31_one_message: ' + bad + ' FAIL' : 'qc31_one_message: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed ' + e.stack); console.log('qc31_one_message: FAIL'); process.exit(1); });
