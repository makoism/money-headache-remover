/* F1: the corner squirrel (squirrel.js SQ.stash) plays on every screen size, phones included, and its panel sits clear of every control that stays on screen
   or any number (text with a digit), at any frame of the play, with the Home "This month" card in view. Where no spot is free it may show smaller or not at all. With reduced motion it does not play (by design).
   Run: node tests/qc/phone_squirrel.js   (DEVS=iphone13,iphoneSE to pick sizes) */
const L = require('./phone_lib.js');
const DEVS = (process.env.DEVS || 'iphoneSE,iphone13,pixel5,big,land8,land,tablet,desktop,iphoneSE+bar,iphone13+bar').split(',');
(async () => {
  const fails = [];
  for (const d0 of DEVS) {
    const bar = /\+bar$/.test(d0), dev = d0.replace(/\+bar$/, '');
    const { b, p, errs } = await L.open({ dev, query: 'sqtest' });
    /* DEVS entries ending in +bar get a fixed button across the bottom left, where Ask and Help sat on 38.28 phones: the panel must move above it */
    if (bar) await p.evaluate(() => { const e = document.createElement('button'); e.id = 'testBar'; e.textContent = 'Ask'; e.style.cssText = 'position:fixed;left:0;bottom:66px;width:300px;height:44px;z-index:40'; document.body.append(e); });
    /* the Home "This month" card in view, then the squirrel; every 250 ms through the whole play, nothing with a digit and no control may be under the panel */
    await p.evaluate(() => { const m = document.querySelector('#hMap:not([hidden])') || document.querySelector('#hero'); if (m) m.scrollIntoView({ block: 'start' }); }); await L.w(500);
    const ok = await p.evaluate(() => window.__sq.stash());
    const under = () => p.evaluate(() => {
      const cv = [...document.querySelectorAll('body > canvas')].find(c => c.style.zIndex === '70'); if (!cv) return null;
      const a = cv.getBoundingClientRect(), hit = q => q.width > 0 && q.height > 0 && q.left < a.right && q.right > a.left && q.top < a.bottom && q.bottom > a.top, out = [];
      const vis = e => !e.checkVisibility || e.checkVisibility({ visibilityProperty: true, opacityProperty: true });
      document.querySelectorAll('button, a[href], input, select, textarea, [role=button], summary').forEach(e => { if (!cv.contains(e) && hit(e.getBoundingClientRect()) && vis(e)) out.push('control ' + (e.id || e.className || e.tagName)); });
      const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), rg = document.createRange();
      for (let n = tw.nextNode(); n; n = tw.nextNode()) { if (!/\d/.test(n.nodeValue) || !n.parentElement || n.parentElement.closest('script, style, [hidden]')) continue; rg.selectNodeContents(n); if (hit(rg.getBoundingClientRect()) && vis(n.parentElement)) out.push('number "' + n.nodeValue.trim().slice(0, 20) + '"'); }
      return { rect: [a.left, a.top, a.width, a.height].map(Math.round), inside: a.left >= 0 && a.top >= 0 && a.right <= innerWidth && a.bottom <= innerHeight, out };
    });
    let shown = null; const covered = new Set(); let outside = false;
    for (let t = 0; t < 7400; t += 250) { await L.w(250); const r = await under(); if (!r) continue; shown = shown || r.rect; if (!r.inside) outside = true; r.out.forEach(x => covered.add(x)); }
    const tag = `${d0} ${L.DEVS[dev].w}x${L.DEVS[dev].h}`;
    console.log(`${tag}: stash ${ok ? 'agreed' : 'refused'}, panel ${shown ? shown.join(' ') : 'not shown (no free spot)'}${covered.size ? ', covers ' + [...covered].join('; ') : ''}`);
    if (!ok) fails.push(`${tag}: the corner squirrel refused to play`);
    if (outside) fails.push(`${tag}: panel not fully on screen`);
    if (covered.size) fails.push(`${tag}: panel covers ${[...covered].join('; ')}`);
    if (dev === 'desktop' && !bar && !shown) fails.push(`${tag}: no panel at all on a wide screen`);
    const again = await p.evaluate(() => window.__sq.stash()); if (again) fails.push(`${tag}: a second call right after played again (150 s rule)`);
    if (errs.length) fails.push(`${tag}: ${errs.join(' | ').slice(0, 200)}`);
    await b.close();
  }
  { const { b, p } = await L.open({ dev: 'iphone13', query: 'sqtest', reduced: true }); const ok = await p.evaluate(() => window.__sq.stash()); if (ok) fails.push('reduced motion: the corner squirrel played'); await b.close(); }
  if (fails.length) { fails.forEach(f => console.log('FAIL ' + f)); console.log('PHONE SQUIRREL FAIL'); process.exit(1); }
  console.log('PHONE SQUIRREL PASS');
})().catch(e => { console.log('FAIL ' + e.message); process.exit(1); });
