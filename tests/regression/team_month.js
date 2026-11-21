// Last month's unspent Free to spend on Home: no question before the first receipt (S1), then the month-end question with the few-receipts line
// (decision 3), Decide later only for this visit, still asked after the 10th. (Was the finish-last-month nudge until 38.30.)
const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
let pass = 0, fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); c ? pass++ : fail++; };
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
async function open(b, iso, keep) {
  const p = await b.newPage(); const errs = []; await p.setViewport({ width: 390, height: 844 });
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await p.evaluateOnNewDocument((iso, keep) => {
    try { if (!keep) { localStorage.clear(); indexedDB.deleteDatabase('money-map-safe'); } } catch (e) {}
    const real = Date, fixed = new real(iso).getTime(), start = real.now();
    class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } }
    window.Date = D;
  }, iso, !!keep);
  await p.goto('file://' + PAGE + '?m=' + Math.random() + '#2026-12', { waitUntil: 'load' }); await w(800);
  return { p, errs };
}
const coach = async p => { for (let i = 0; i < 12; i++) { const vis = await p.evaluate(() => { const c = document.querySelector('#co'); return !!c && !c.hidden && c.getBoundingClientRect().width > 0; }); if (!vis) break; await p.click('#coNext').catch(() => {}); await w(250); } };
const nextCard = p => p.evaluate(() => { const e = document.querySelector('#hNext'); return { hid: e.hidden, t: e.textContent.replace(/\s+/g, ' ') }; });
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  /* Since 69a9e13 (L) the plan starts in the setup month, so setup runs in late November and the page is reopened in December:
     November is then a lived month the question can ask about (MAIN 12). */
  let { p, errs } = await open(b, '2026-11-25T10:00:00');
  await runTour(p, P.a); await w(1200); await coach(p);
  await p.close();
  ({ p, errs } = await open(b, '2026-12-03T10:00:00', true)); await coach(p);
  ok(await p.evaluate(() => document.body.textContent.includes('Dec')), 'the page runs on the faked date (December)');
  let c = await nextCard(p); ok(!c.hid && /log (a receipt|spend)/.test(c.t), 'before any receipt, the first-steps card still leads: ' + c.t.slice(0, 50));
  await p.type('#hAmt', '350'); await p.click('#hLog').catch(async () => { await p.keyboard.press('Enter'); }); await w(900);
  /* 38.30 replaced the "finish last month" nudge with the month-end question (DECISIONS.md: unspent money is a question, never assumed).
     Decision 3 (Mako, 2026-11-18): asked even with fewer than four receipts, saying so; "Decide later" is kept. */
  c = await nextCard(p); ok(!c.hid && /Nov: .* of Free to spend isn't logged as spent/.test(c.t) && /No receipts are logged, so this may be spending you haven't logged yet/.test(c.t), 'after the first receipt, early December asks about November and says nothing is logged for it: ' + c.t.slice(0, 160));
  ok(/Open Nov receipts/.test(c.t) && /Decide later/.test(c.t), 'with a way to the November receipts and Decide later');
  await p.evaluate(() => document.querySelector('#hNext [data-sweephide]').click()); await w(500);
  c = await nextCard(p); ok(c.hid || !/Nov: /.test(c.t), 'Decide later puts it away for now');
  await p.close();
  ({ p, errs } = await open(b, '2026-12-03T10:00:00', true)); await coach(p);
  c = await nextCard(p); ok(!c.hid && /Nov: /.test(c.t), 'Decide later is not a dismissal: the question is back after a reload (38.30 rule)');
  await p.close();
  ({ p, errs } = await open(b, '2026-12-14T10:00:00', true)); await coach(p);
  c = await nextCard(p); ok(!c.hid && /Nov: /.test(c.t), 'after the 10th it is still asked: unspent money never drops out silently (DECISIONS.md)');
  ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 3)));
  await b.close();
  console.log(`MONTH NUDGE: ${pass} pass, ${fail} fail`); process.exit(fail ? 1 : 0);
})().catch(e => { console.log('CRASH', e.stack); process.exit(2); });
