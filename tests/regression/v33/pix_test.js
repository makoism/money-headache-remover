// Pixel plants and the peek guys: every seat is placed once, never covers words or controls, survives a redraw, and the
// axolotl / ocelot show on big / medium celebrations and leave again. Phone and laptop, dark and light.
const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL', m); } };
const near = (a, b, m) => a.width && b.width && a.left < b.right + m && a.right > b.left - m && a.top < b.bottom + m && a.bottom > b.top - m;
async function seatsClean(p, label) {
  const bad = await p.evaluate(() => {
    const out = [];
    for (const c of document.querySelectorAll('.pixc')) {
      const host = c.parentElement; if (!host.offsetParent || c.classList.contains('off')) continue;
      const r = c.getBoundingClientRect(); if (!r.width) continue;
      const rg = document.createRange(), walk = document.createTreeWalker(host, NodeFilter.SHOW_TEXT); let n;
      while ((n = walk.nextNode())) { if (!n.textContent.trim() || c.contains(n)) continue; rg.selectNodeContents(n); for (const q of rg.getClientRects()) if (q.width && q.left < r.right && q.right > r.left && q.top < r.bottom && q.bottom > r.top) out.push(host.id + ' text: ' + n.textContent.trim().slice(0, 24)); }
      for (const el of host.querySelectorAll('button, input, select, a')) { const q = el.getBoundingClientRect(); if (q.width && q.left < r.right && q.right > r.left && q.top < r.bottom && q.bottom > r.top) out.push(host.id + ' control: ' + (el.textContent || el.id).trim().slice(0, 24)); }
    }
    return out;
  });
  ok(!bad.length, label + ' sprite over content: ' + bad.join(' | '));
}
async function run(width, scheme) {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage(); await p.setViewport({ width, height: 844 });
  await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: scheme }]);
  const L = `${width}px ${scheme}`;
  await p.goto('http://127.0.0.1:8788/?sfxtest#2026-11', { waitUntil: 'load' }); await w(800);
  await runTour(p, P.b); await w(1500);
  // seats exist once each, on the hosts that are on the page
  const seats = await p.evaluate(() => [...document.querySelectorAll('.pixc')].map(c => c.parentElement.id || c.parentElement.className));
  const dupes = await p.evaluate(() => { const ps = [...document.querySelectorAll('.pixc')].map(c => c.parentElement); return ps.filter((x, i) => ps.indexOf(x) !== i).length; });
  ok(dupes === 0, L + ' one sprite box per host: ' + seats.join(','));
  ok(seats.includes('hHero') && seats.includes('hStreak') && seats.includes('hDeep'), L + ' home seats present: ' + seats.join(','));
  await p.evaluate(() => { document.querySelector('#hMore').open = true; }); await w(300);
  await seatsClean(p, L + ' home');
  // hero redraw keeps its flowers (put() re-seats)
  await p.evaluate(() => { const el = document.querySelector('#hHero'); el.__h = ''; el.innerHTML = ''; __pix.renderHome(); }); await w(200);
  ok(await p.evaluate(() => !!document.querySelector('#hHero > .pixc')), L + ' hero keeps its flowers after a redraw');
  // narrow hero: a long line must hide the sprite rather than sit under it
  const hid = await p.evaluate(() => { const c = document.querySelector('#hHero > .pixc'); const k = document.querySelector('#hHero .hwin-k, #hHero .k, #hHero small, #hHero p'); if (!k) return 'nok'; const was = c.classList.contains('off'); const old = k.textContent; k.textContent = 'A very long caption that runs right across the whole width of the card and then some more words'; __pix.pixFitAll(); const r = c.classList.contains('off'); k.textContent = old; __pix.pixFitAll(); return r + ':' + (c.classList.contains('off') === was); });
  ok(hid === 'true:true' || hid === 'nok', L + ' long line hides the flowers and the old one brings the old state back: ' + hid);
  for (const t of ['receipts', 'goals', 'month', 'basics']) { await p.evaluate(t => (document.querySelector(`[data-tab="${t}"]`) || document.querySelector(`[data-tab-go="${t}"]`)).click(), t); await w(500); await seatsClean(p, L + ' ' + t); }
  await p.evaluate(() => document.querySelector('[data-tab="home"]').click()); await w(400);
  // peek guys
  await p.evaluate(() => __pix.celebrate('med', 'Test')); await w(900);
  let pk = await p.evaluate(() => { const b = document.querySelector('#peek'); return { hidden: b.hidden, cls: b.className, kind: b.querySelector('.pix') && b.querySelector('.pix').className, r: b.getBoundingClientRect().toJSON() }; });
  ok(!pk.hidden && /up/.test(pk.cls) && /pix-ocelot/.test(pk.kind || ''), L + ' medium celebration brings the ocelot: ' + JSON.stringify([pk.hidden, pk.cls, pk.kind]));
  ok(pk.r.left >= 0 && pk.r.left < width - 40 && pk.r.right > width, L + ' ocelot peeks in from the right edge, head on screen: ' + Math.round(pk.r.left) + '..' + Math.round(pk.r.right));
  await w(3200);
  pk = await p.evaluate(() => document.querySelector('#peek').hidden);
  ok(pk === true, L + ' ocelot leaves again');
  await p.evaluate(() => __pix.celebrate('big', 'Test')); await w(900);
  pk = await p.evaluate(() => { const b = document.querySelector('#peek'); return { hidden: b.hidden, cls: b.className, kind: b.querySelector('.pix') && b.querySelector('.pix').className, r: b.getBoundingClientRect().toJSON() }; });
  ok(!pk.hidden && /up/.test(pk.cls) && /pix-axolotl/.test(pk.kind || ''), L + ' big celebration brings the axolotl');
  ok(pk.r.top > 844 - 70 && pk.r.top < 844 - 30 && pk.r.left >= 0, L + ' axolotl peeks up from the bottom edge, head on screen: ' + Math.round(pk.r.top));
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('#peek')).pointerEvents === 'none'), L + ' peek box lets taps through');
  await w(4300);
  ok(await p.evaluate(() => document.querySelector('#peek').hidden), L + ' axolotl leaves again');
  // reduced motion: no peek at all
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }, { name: 'prefers-color-scheme', value: scheme }]);
  await p.evaluate(() => __pix.celebrate('big', 'Test')); await w(500);
  ok(await p.evaluate(() => document.querySelector('#peek').hidden), L + ' reduced motion: nobody peeks');
  const errs = await p.evaluate(() => window.__errs || []);
  await b.close();
}
(async () => {
  for (const [wd, sc] of [[390, 'dark'], [390, 'light'], [1280, 'dark'], [1280, 'light']]) await run(wd, sc);
  console.log(`PIX: ${pass} pass, ${fail} fail`); process.exit(fail ? 1 : 0);
})().catch(e => { console.log('CRASH', e); process.exit(1); });
