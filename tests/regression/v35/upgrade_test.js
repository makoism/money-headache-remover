// Updating from any older version: numbers typed into a real old build (from git history) open in the current build unchanged.
const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const fs = require('fs');
const { w } = require('/tmp/v22/lib.js');
let pass = 0, fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); c ? pass++ : fail++; };
const NEW = '/home/claude/work/money-map-team.html';
const KEY = 'money-map-template-v2';
const OLD = fs.readdirSync('/tmp/v35/old').filter(f => /^v[\d.]+\.html$/.test(f)).sort((a, b) => parseFloat(a.slice(1)) - parseFloat(b.slice(1)));
async function fresh(b) { const ctx = await b.createBrowserContext(); const p = await ctx.newPage(); await p.setViewport({ width: 390, height: 844 }); const errs = []; p.on('pageerror', e => errs.push(e.message)); return { ctx, p, errs }; }
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  for (const f of OLD) {
    const ver = f.replace('.html', '');
    const { ctx, p, errs } = await fresh(b);
    await p.goto('file:///tmp/v35/old/' + f + '#2026-11', { waitUntil: 'load' }); await w(900);
    // put the first-open setup away
    for (let i = 0; i < 3; i++) { const sk = await p.$('#tourSkip'); if (!sk) break; const vis = await p.evaluate(e => !!(e.offsetParent), sk); if (!vis) break; await sk.click().catch(() => {}); await w(400); }
    await p.evaluate(() => { const t = document.querySelector('#tour'); if (t && !t.hidden) { const b = document.querySelector('#tourSkip, #tourClose'); if (b) b.click(); } });
    await w(300);
    // name, pay (the Salary box on the Plan or This month tab), three receipts
    const got = { name: false, pay: false, rc: 0 };
    if (await p.$('#nameIn')) { await p.evaluate(() => { const e = document.querySelector('#nameIn'); e.value = 'Aiko'; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }); got.name = true; }
    const payIn = await p.$('#h-a'); if (payIn) { await p.evaluate(() => { const e = document.querySelector('#h-a'); e.focus(); e.value = '35000'; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); e.blur(); }); got.pay = true; }
    await p.evaluate(() => { const t = document.querySelector('[data-tab="receipts"]'); if (t) t.click(); }); await w(300);
    for (const a of [120, 350.5, 80]) {
      if (!(await p.$('#rcAmt'))) break;
      await p.evaluate(a => { const d = document.querySelector('#rcDate'); if (d && !d.value) { d.value = '2026-11-05'; d.dispatchEvent(new Event('input', { bubbles: true })); d.dispatchEvent(new Event('change', { bubbles: true })); }
        const amt = document.querySelector('#rcAmt'); amt.focus(); amt.value = String(a); amt.dispatchEvent(new Event('input', { bubbles: true })); amt.dispatchEvent(new Event('change', { bubbles: true }));
        const cat = document.querySelector('#rcCat'); if (cat && cat.options.length) { cat.selectedIndex = 0; cat.dispatchEvent(new Event('change', { bubbles: true })); } }, a);
      const before = await p.evaluate(() => document.querySelectorAll('#rcList .rc').length);
      await p.click('#rcSave').catch(() => {}); await w(350);
      const after = await p.evaluate(() => document.querySelectorAll('#rcList .rc').length);
      if (after > before) got.rc++; else console.log(`  (${ver}: a receipt did not take: ${await p.evaluate(() => (document.querySelector('#rcMsg') || {}).textContent)})`);
    }
    await w(900);
    const saved = await p.evaluate(k => localStorage.getItem(k), KEY);
    await p.evaluate(() => { try { document.dispatchEvent(new Event('visibilitychange')); } catch (e) {} }); await w(300);
    const saved2 = await p.evaluate(k => localStorage.getItem(k), KEY) || saved;
    let old; try { old = JSON.parse(saved2); } catch (e) { old = null; }
    ok(!!old && typeof old === 'object', `${ver}: the old build saved a state (${saved2 ? saved2.length : 0} chars)`);
    const oldRc = old && Array.isArray(old.receipts) ? old.receipts.length : 0;
    await ctx.close();
    if (!old) continue;
    // open the current build on that saved state
    const n = await fresh(b);
    await n.p.evaluateOnNewDocument((k, v) => { try { localStorage.setItem(k, v); sessionStorage.setItem('__keep', '1'); } catch (e) {} }, KEY, saved2);
    await n.p.goto('file://' + NEW + '?sfxtest#2026-11', { waitUntil: 'load' }); await w(1500);
    const r = await n.p.evaluate(() => { const S = __t.S, C = __t.calcAll(S); const first = Object.keys(C.byYm).sort()[0]; const m = C.byYm[first];
      return { name: S.ui.name, rc: (S.receipts || []).length, rcSum: Math.round((S.receipts || []).reduce((a, r) => a + (+r.a || 0), 0) * 100) / 100, goals: S.plan.goals.length, lines: S.plan.lines.length, pay: m.a, payIn: m.pool.in, cur: S.ui.cur, tourOpen: !document.querySelector('#tour').hidden, heroTxt: (document.querySelector('#hHero') || {}).textContent || '', status: (document.querySelector('#hStatus') || {}).textContent || '', ver: (document.querySelector('#verFoot') || {}).textContent }; });
    ok(!got.name || r.name === 'Aiko', `${ver} -> now: the name came through (${r.name})`);
    ok(r.rc === oldRc && r.rc === got.rc, `${ver} -> now: ${r.rc} receipts came through (old build had ${oldRc})`);
    const want = [120, 350.5, 80].slice(0, got.rc).reduce((a, b) => a + b, 0);
    ok(Math.abs(r.rcSum - want) < .001, `${ver} -> now: receipt amounts intact (${r.rcSum} of ${want})`);
    ok(!got.pay || r.pay === 35000, `${ver} -> now: the typed pay came through (${r.pay})`);
    ok(r.goals >= 1 && r.lines >= 3, `${ver} -> now: the plan is intact (${r.goals} goals, ${r.lines} lines, pay in ${r.payIn}, ${r.cur})`);
    ok(r.heroTxt.length > 10 || r.tourOpen, `${ver} -> now: Home drew (${r.tourOpen ? 'setup resumed' : r.heroTxt.slice(0, 40)})`);
    ok(!n.errs.length, `${ver} -> now: no page errors ${JSON.stringify(n.errs)}`);
    await n.ctx.close();
  }
  await b.close();
  console.log(`UPGRADE: ${pass} pass, ${fail} fail`); process.exit(fail ? 1 : 0);
})().catch(e => { console.log('CRASH', e.stack); process.exit(2); });
