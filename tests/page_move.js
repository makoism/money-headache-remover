/* Moving numbers from the Claude link to the app's address through the link hash: an empty page loads them, a page with data asks first. */
const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
const BASE = process.env.BASE || 'http://127.0.0.1:8788';
let pass = 0, fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); c ? pass++ : fail++; };
const coach = async p => { for (let i = 0; i < 12; i++) { const vis = await p.evaluate(() => { const c = document.querySelector('#co'); return !!c && !c.hidden && getComputedStyle(c).display !== 'none' && c.getBoundingClientRect().width > 0; }); if (!vis) return; await p.click('#coNext').catch(() => {}); await w(450); } };
const b64u = s => Buffer.from(s, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  // make a real state in one browser context
  const p = await b.newPage(); const errs = []; await p.setViewport({ width: 390, height: 844 });
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await p.evaluateOnNewDocument(() => { try { localStorage.clear(); indexedDB.deleteDatabase('money-map-safe'); } catch (e) {} });
  await p.goto(BASE + '/?m=1#2026-11', { waitUntil: 'load' }); await w(800);
  await runTour(p, P.b); await w(1000); await coach(p);
  const json = await p.evaluate(() => localStorage.getItem('money-map-template-v2'));
  const link = BASE + '/#move=' + b64u(json);
  ok(link.length > 2000, 'a move link carries the whole state in the hash (' + link.length + ' chars)');
  // a fresh browser context opens it
  const ctx = await b.createBrowserContext(); const q = await ctx.newPage(); await q.setViewport({ width: 390, height: 844 });
  q.on('pageerror', e => errs.push('PAGEERR2 ' + e.message));
  await q.goto(link, { waitUntil: 'load' }); await w(1500);
  const st = await q.evaluate(() => ({ hash: location.hash, tour: document.querySelector('#tour').hidden, hasName: /Dana|Sam|Aiko/.test(document.body.innerText), cheer: document.querySelector('#cheer').textContent, saved: (localStorage.getItem('money-map-template-v2') || '').length }));
  ok(st.hash === '' && st.saved > 500 && st.tour, 'an empty page loads the arriving numbers at once, clears the hash and skips the setup: ' + JSON.stringify(st));
  ok(/Your numbers are here/.test(st.cheer), 'and says so');
  const same = await q.evaluate(() => JSON.parse(localStorage.getItem('money-map-template-v2')).steps);
  ok(JSON.stringify(same) === JSON.stringify(JSON.parse(json).steps), 'the numbers match the source exactly');
  // the same page with data: another arrival asks first
  const json2 = JSON.parse(json); json2.ui.name = 'Rhea'; json2.steps.a = [{ from: '2026-11', v: 99999 }];
  await q.goto(BASE + '/#move=' + b64u(JSON.stringify(json2)), { waitUntil: 'load' }); await w(1500);
  await coach(q);
  const card = await q.evaluate(() => ({ hid: document.querySelector('#hBk').hidden, t: document.querySelector('#hBk').textContent.replace(/\s+/g, ' ') }));
  ok(!card.hid && /already has numbers of its own/.test(card.t), 'a page with its own numbers asks before replacing: ' + card.t.slice(0, 80));
  ok((await q.evaluate(() => JSON.parse(localStorage.getItem('money-map-template-v2')).steps.a[0].v)) !== 99999, 'nothing replaced yet');
  await q.click('#hBk [data-move-load]'); await w(800);
  const after = await q.evaluate(() => { const S = JSON.parse(localStorage.getItem('money-map-template-v2')); return { pay: S.steps.a[0].v, name: S.ui.name }; });
  ok(after.pay === 99999 && after.name === 'Rhea', 'Replace loads the arrived numbers: ' + JSON.stringify(after));
  // a bad hash is ignored
  await q.goto(BASE + '/#move=notbase64!!', { waitUntil: 'load' }); await w(800);
  ok(await q.evaluate(() => document.querySelector('#hBk').hidden || !/arrived/.test(document.querySelector('#hBk').textContent)), 'a bad hash is ignored quietly');
  ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 3)));
  await b.close();
  console.log(`PAGE MOVE: ${pass} pass, ${fail} fail`); process.exit(fail ? 1 : 0);
})().catch(e => { console.log('CRASH', e.stack); process.exit(2); });
