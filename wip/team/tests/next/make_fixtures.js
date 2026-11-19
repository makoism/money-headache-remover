/* MAKES the migration fixtures in tests/next/fixtures/ (side session C, 2026-11-19). Not a test: run it once when the list of old builds changes.
   Run: bash tests/setup_env.sh && node tests/next/make_fixtures.js
   For every old released build in /tmp/v35/old (tests/fixtures/old_builds.txt, rebuilt by setup_env.sh) it opens the REAL old page,
   types a name, a pay and three receipts through its own screens (as tests/regression/v35/upgrade_test.js does), then sets a bank
   start, goal starts and one single-month change through that build's OWN functions (setVal, updateGoal), and lets that build's own
   save code write its saved copy. The saved copy is written to fixtures/v<version>.json exactly as the build stored it.
   Made-up numbers only (DECISIONS.md decision 9). The numbers set are in TYPED below and in each fixture's "typed" field. */
const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const fs = require('fs'), path = require('path');
const OLD = '/tmp/v35/old', OUT = path.join(__dirname, 'fixtures'), KEY = 'money-map-template-v2';
const w = ms => new Promise(r => setTimeout(r, ms));
/* made-up numbers; whole units, because every old build stored whole units */
const TYPED = { name: 'Aiko', pay: 41000, bankStart: 23400, goalStarts: [6100, 2750], receipts: [120, 350, 80], once: { key: 'bill:food', ym: '2027-02', v: 4321 } };
const files = fs.readdirSync(OLD).filter(f => /^v[\d.]+\.html$/.test(f))
  .sort((a, b) => { const p = s => s.slice(1, -5).split('.').map(Number); const x = p(a), y = p(b); return x[0] - y[0] || (x[1] || 0) - (y[1] || 0); });
if (!files.length) { console.log('no old builds in ' + OLD + ': run bash tests/setup_env.sh first'); process.exit(2); }
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  let made = 0, bad = 0;
  for (const f of files) {
    const ver = f.slice(1, -5), ctx = await b.createBrowserContext(), errs = []; let p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message));
    await p.setViewport({ width: 390, height: 844 });
    await p.goto('file://' + OLD + '/' + f + '#2026-11', { waitUntil: 'load' }); await w(900);
    for (let i = 0; i < 3; i++) { const sk = await p.$('#tourSkip'); if (!sk) break; if (!(await p.evaluate(e => !!e.offsetParent, sk))) break; await sk.click().catch(() => {}); await w(400); }
    await p.evaluate(() => { const t = document.querySelector('#tour'); if (t && !t.hidden) { const x = document.querySelector('#tourSkip, #tourClose'); if (x) x.click(); } }); await w(300);
    const got = { name: false, pay: false, receipts: [] };
    const fire = (sel, v) => p.evaluate((sel, v) => { const e = document.querySelector(sel); if (!e) return false; e.focus(); e.value = v; ['input', 'change'].forEach(t => e.dispatchEvent(new Event(t, { bubbles: true }))); e.blur(); return true; }, sel, v);
    got.name = await fire('#nameIn', TYPED.name);
    got.pay = await fire('#h-a', String(TYPED.pay));
    await p.evaluate(() => { const t = document.querySelector('[data-tab="receipts"]'); if (t) t.click(); }); await w(300);
    for (const a of TYPED.receipts) {
      if (!(await p.$('#rcAmt'))) break;
      await p.evaluate(() => { const d = document.querySelector('#rcDate'); if (d && !d.value) { d.value = '2026-11-05'; ['input', 'change'].forEach(t => d.dispatchEvent(new Event(t, { bubbles: true }))); } const c = document.querySelector('#rcCat'); if (c && c.options.length) { c.selectedIndex = 0; c.dispatchEvent(new Event('change', { bubbles: true })); } });
      await fire('#rcAmt', String(a));
      const before = await p.evaluate(() => document.querySelectorAll('#rcList .rc').length);
      await p.click('#rcSave').catch(() => {}); await w(350);
      if ((await p.evaluate(() => document.querySelectorAll('#rcList .rc').length)) > before) got.receipts.push(a);
    }
    /* the money already there. Builds before 36 keep their state out of reach, so for every build alike: put the made-up bank start,
       goal starts and one single-month change into the copy this build just saved, reload the SAME old page so its own load code reads
       it, then type the name again so its own save code writes the copy that becomes the fixture */
    await w(900);
    const first = await p.evaluate(k => localStorage.getItem(k), KEY);
    const set = { bankStart: null, goals: [], once: false };
    let d = null; try { d = JSON.parse(first); } catch (e) {}
    if (d) {
      d.cfg = d.cfg || {}; d.cfg.bankStart = TYPED.bankStart;
      const gs = (d.plan && d.plan.goals) || []; TYPED.goalStarts.forEach((v, i) => { if (gs[i]) gs[i].start = v; });
      d.once = d.once || {}; (d.once[TYPED.once.ym] = d.once[TYPED.once.ym] || {})[TYPED.once.key] = TYPED.once.v;
      /* the old page saves itself when it closes, so the copy is put in place before a NEW page's scripts run, once */
      await p.close(); p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.setViewport({ width: 390, height: 844 });
      await p.evaluateOnNewDocument((k, v) => { try { if (!sessionStorage.getItem('__fx')) { localStorage.setItem(k, v); sessionStorage.setItem('__fx', '1'); } } catch (e) {} }, KEY, JSON.stringify(d));
      await p.goto('file://' + OLD + '/' + f + '#2026-11', { waitUntil: 'load' }); await w(900);
      await p.evaluate(() => { const t = document.querySelector('#tour'); if (t && !t.hidden) { const x = document.querySelector('#tourSkip, #tourClose'); if (x) x.click(); } }); await w(300);
      await fire('#nameIn', TYPED.name + ' '); await w(200); await fire('#nameIn', TYPED.name); await w(1200);
      let back = null; try { back = JSON.parse(await p.evaluate(k => localStorage.getItem(k), KEY)); } catch (e) {}
      if (back) {
        if (back.cfg && back.cfg.bankStart === TYPED.bankStart) set.bankStart = TYPED.bankStart;
        ((back.plan && back.plan.goals) || []).forEach((g, i) => { if (i < TYPED.goalStarts.length && g.start === TYPED.goalStarts[i]) set.goals.push({ id: g.id, name: g.name, start: g.start }); });
        set.once = !!(back.once && back.once[TYPED.once.ym] && back.once[TYPED.once.ym][TYPED.once.key] === TYPED.once.v);
        set.resaved = back.rev !== d.rev;
      }
    }
    const raw = await p.evaluate(k => localStorage.getItem(k), KEY);
    await ctx.close();
    let ok = false; try { ok = !!JSON.parse(raw); } catch (e) {}
    if (!ok) { bad++; console.log('NO SAVED COPY ' + ver + ' ' + JSON.stringify(errs.slice(0, 2))); continue; }
    const fx = { build: ver, from: 'tests/fixtures/old_builds.txt', key: KEY, made: '2026-11-19 by tests/next/make_fixtures.js',
      typed: { name: got.name ? TYPED.name : null, pay: got.pay ? TYPED.pay : null, receipts: got.receipts, bankStart: set.bankStart, goals: set.goals, once: set.once ? TYPED.once : null, resavedByOldBuild: !!set.resaved },
      pageErrors: errs.slice(0, 5), saved: raw };
    fs.writeFileSync(path.join(OUT, 'v' + ver + '.json'), JSON.stringify(fx, null, 1) + '\n');
    made++; console.log('v' + ver + ': ' + raw.length + ' chars, receipts ' + got.receipts.length + ', goals ' + set.goals.length + ', once ' + set.once + ', resaved ' + !!set.resaved + (errs.length ? ', page errors ' + errs.length : ''));
  }
  await b.close();
  console.log('fixtures made ' + made + ', failed ' + bad); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('CRASH', e.stack); process.exit(2); });
