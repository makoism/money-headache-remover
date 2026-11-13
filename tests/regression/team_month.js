// The finish-last-month nudge on Home: shows in the first ten days of a month when little was logged, hides per month, stays hidden after a reload.
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
  let { p, errs } = await open(b, '2026-12-03T10:00:00');
  ok(await p.evaluate(() => document.body.textContent.includes('Dec')), 'the page runs on the faked date (December)');
  await runTour(p, P.a); await w(1200); await coach(p);
  let c = await nextCard(p); ok(!c.hid && /log a receipt/.test(c.t), 'before any receipt, the first-steps card still leads: ' + c.t.slice(0, 50));
  await p.type('#hAmt', '350'); await p.click('#hLog').catch(async () => { await p.keyboard.press('Enter'); }); await w(900);
  c = await nextCard(p); ok(!c.hid && /finish November/.test(c.t) && /Nothing logged for November/.test(c.t), 'after the first receipt, early December asks to finish November: ' + c.t.slice(0, 90));
  ok(/Receipts/.test(c.t) && /Hide/.test(c.t), 'with a Receipts button and Hide');
  await p.evaluate(() => document.querySelector('#hNext [data-hidemonth]').click()); await w(500);
  c = await nextCard(p); ok(c.hid || !/finish November/.test(c.t), 'Hide puts it away (the Make it exact card may take the spot)');
  ok(await p.evaluate(() => JSON.parse(localStorage.getItem('money-map-template-v2')).ui.mcSeen === '2026-11'), 'the month is remembered as seen');
  await p.close();
  ({ p, errs } = await open(b, '2026-12-03T10:00:00', true)); await coach(p);
  c = await nextCard(p); ok(c.hid || !/finish November/.test(c.t), 'still hidden after a reload');
  await p.close();
  ({ p, errs } = await open(b, '2026-12-14T10:00:00', true)); await coach(p);
  await p.evaluate(() => { const S = JSON.parse(localStorage.getItem('money-map-template-v2')); delete S.ui.mcSeen; localStorage.setItem('money-map-template-v2', JSON.stringify(S)); });
  await p.reload({ waitUntil: 'load' }); await w(800); await coach(p);
  c = await nextCard(p); ok(c.hid || !/finish/.test(c.t), 'after the 10th of the month the nudge does not show');
  ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 3)));
  await b.close();
  console.log(`MONTH NUDGE: ${pass} pass, ${fail} fail`); process.exit(fail ? 1 : 0);
})().catch(e => { console.log('CRASH', e.stack); process.exit(2); });
