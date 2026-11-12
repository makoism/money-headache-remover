const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
const PAGE = '/home/claude/work/money-map-team.html';
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await p.evaluateOnNewDocument(iso => { try { if (!sessionStorage.getItem('__keep')) { localStorage.clear(); indexedDB.deleteDatabase('money-map-safe'); } sessionStorage.setItem('__keep', '1'); } catch (e) {}
    const real = Date, fixed = new real(iso).getTime(), start = real.now();
    class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, '2026-12-03T10:00:00');
  await p.goto('file://' + PAGE + '?sfxtest#2026-12', { waitUntil: 'load' }); await w(800);
  let n = 0;
  await runTour(p, P.a, async () => {
    const t = await p.$eval('#tourTitle', e => e.textContent);
    if (t === 'Trip' && await p.$('#tourGWhy')) { await p.type('#tourGWhy', 'A week in Hokkaido with Mum'); await w(300); await p.screenshot({ path: '/tmp/v34/s_trip.png' }); }
    if (/Setup done/.test(t)) { await w(1200); await p.screenshot({ path: '/tmp/v34/s_done.png' }); await p.evaluate(() => document.querySelector('#tourScroll').scrollBy(0, 400)); await w(300); await p.screenshot({ path: '/tmp/v34/s_done2.png' }); }
  });
  await w(1500);
  const coach = async () => { for (let i = 0; i < 12; i++) { const vis = await p.evaluate(() => { const c = document.querySelector('#co'); return !!c && !c.hidden && c.getBoundingClientRect().width > 0; }); if (!vis) break; await p.click('#coN').catch(() => {}); await w(150); } };
  await coach();
  const tab = t => p.evaluate(t => (document.querySelector(`[data-tab="${t}"]`) || document.querySelector(`[data-tab-go="${t}"]`)).click(), t);
  // receipts for November
  await tab('receipts'); await w(300);
  for (const [d, a] of [['2026-11-04', 4000], ['2026-11-11', 5000], ['2026-11-18', 6000], ['2026-11-25', 4000]]) {
    await p.$eval('#rcDate', (e, v) => { e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); }, d);
    await p.$eval('#rcAmt', e => { e.value = ''; }); await p.type('#rcAmt', String(a)); await p.select('#rcCat', 'envelope'); await p.click('#rcSave'); await w(250);
  }
  await tab('home'); await w(3500);
  await p.evaluate(() => window.scrollTo(0, 0)); await p.screenshot({ path: '/tmp/v34/s_home_offer.png' });
  await p.evaluate(() => { document.querySelector('#hHero').scrollIntoView({ block: 'start' }); window.scrollBy(0, -70); }); await w(300); await p.screenshot({ path: '/tmp/v34/s_hero.png' });
  await p.evaluate(() => window.scrollTo(0, 0)); await p.click('#hNext [data-sweep]'); await w(500); await p.screenshot({ path: '/tmp/v34/s_swept.png' });
  await w(3500);
  await p.evaluate(() => { document.querySelector('#hSpend').scrollIntoView({ block: 'start' }); window.scrollBy(0, -70); }); await w(300); await p.screenshot({ path: '/tmp/v34/s_play.png' });
  await tab('goals'); await w(400); await p.evaluate(() => { document.querySelector('#goalCards').scrollIntoView({ block: 'start' }); window.scrollBy(0, -80); }); await w(300); await p.screenshot({ path: '/tmp/v34/s_goals.png' });
  await p.click('[data-gedit]'); await w(300); await p.screenshot({ path: '/tmp/v34/s_goals_edit.png' }); await p.click('[data-gdone]'); await w(200);
  await tab('month'); await w(400); await p.evaluate(() => { document.querySelector('#legend').scrollIntoView({ block: 'center' }); }); await w(300); await p.screenshot({ path: '/tmp/v34/s_legend.png' });
  await tab('months'); await w(400); await p.evaluate(() => { const r = document.querySelector('#monthTable .mt-g'); if (r) r.closest('tr').scrollIntoView({ block: 'center' }); }); await w(300); await p.screenshot({ path: '/tmp/v34/s_months.png' });
  // two goals: the picker
  await p.evaluate(() => { const { S, addGoal, updateGoal, persist, restructure } = __t; S.ui.sweep = {}; const id = addGoal(S, 'Deposit'); updateGoal(S, id, { target: 500000, start: 0, why: 'Our own place' }); persist(); restructure(); });
  await tab('home'); await w(500); await p.evaluate(() => window.scrollTo(0, 0)); await p.screenshot({ path: '/tmp/v34/s_home_pick.png' });
  await b.close();
})();
