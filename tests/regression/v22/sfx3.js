const { w, P, launch, runTour } = require('./lib.js');
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? ' ' + x : '')); if (!c) fails++; };
(async () => {
  const { b, p, errs } = await launch(390, 844, 'light');
  await p.goto('file:///home/claude/work/money-map-team.html?sfxtest#2026-11', { waitUntil: 'load' }); await w(700);
  await runTour(p, P.a); await w(900);
  for (let i = 0; i < 3; i++) { if (await p.evaluate(() => { const c = document.querySelector('#co'); return !!c && !c.hidden; })) { await p.click('#coSkip'); await w(400); } }
  await p.evaluate(() => { window.__played = []; Object.keys(window.__sfx).forEach(k => { const f = window.__sfx[k]; window.__sfx[k] = function () { window.__played.push(k); return f.apply(this, arguments); }; }); });
  const take = async () => { const r = await p.evaluate(() => { const x = window.__played.slice(); window.__played.length = 0; return x; }); return r; };
  await take();
  // 1. logging a receipt from Home: one progress sound, no tap
  await p.evaluate(() => document.querySelector('.tabs [data-tab=home]').click()); await w(700); await take();
  await p.type('#hAmt', '1200'); await p.evaluate(() => document.querySelector('#hForm').requestSubmit()); await w(600);
  const a = await take(); ok('logging a receipt plays a progress whoosh', a.some(n => ['coin', 'sparkle', 'fanfare'].includes(n)), JSON.stringify(a));
  ok('and no extra tap under it', !a.includes('tap'), JSON.stringify(a));
  // 2. switching tab: whoosh
  await p.evaluate(() => document.querySelector('.tabs [data-tab=receipts]').click()); await w(600);
  const t = await take(); ok('changing tab plays a whoosh', t.includes('whoosh'), JSON.stringify(t));
  // 3. a plain button: only the faint tap (after a short wait)
  await w(300); await p.evaluate(() => { const s = document.querySelector('#p-receipts summary'); if (s) s.click(); }); await w(400);
  const q = await take(); ok('a plain button makes only the faint tap', q.length <= 1 && (q.length === 0 || q[0] === 'tap'), JSON.stringify(q));
  // 4. weekly reminder button: forward whoosh
  const cal = await p.$('#p-receipts button[data-cal]'); if (cal) { await take(); await p.evaluate(() => document.querySelector('#p-receipts button[data-cal]').click()); await w(400); const c = await take(); ok('a calendar button plays a forward whoosh', c.includes('next') && !c.includes('tap'), JSON.stringify(c)); } else ok('calendar button found', false);
  // 5. plan fix button
  await p.evaluate(() => document.querySelector('.tabs [data-tab=month]').click()); await w(700); await take();
  const fx = await p.$('#fixBtns [data-fx]'); if (fx) { await p.evaluate(() => document.querySelector('#fixBtns [data-fx]').click()); await w(400); const f = await take(); ok('a plan fix button plays a whoosh', f.includes('next') || f.includes('back'), JSON.stringify(f)); } else console.log('note: no fix button in this month (plan is on track)');
  // 6. muted: nothing at all
  await p.evaluate(() => document.querySelector('.tabs [data-tab=basics]').click()); await w(800);
  for (let i = 0; i < 3; i++) { if (await p.evaluate(() => { const c = document.querySelector('#co'); return !!c && !c.hidden; })) { await p.click('#coSkip'); await w(400); } }
  await p.evaluate(() => document.querySelector('#setSnd').scrollIntoView({ block: 'center' })); await w(200);
  await p.click('#setSnd'); await w(400); await take();
  await p.evaluate(() => document.querySelector('.tabs [data-tab=home]').click()); await w(600);
  await p.type('#hAmt', '300'); await p.evaluate(() => document.querySelector('#hForm').requestSubmit()); await w(600);
  const m = await take(); ok('muted means silent', m.length === 0, JSON.stringify(m));
  ok('no page errors', errs.length === 0, JSON.stringify(errs));
  console.log(fails ? 'FAILED ' + fails : 'ALL PASS'); await b.close();
})();
