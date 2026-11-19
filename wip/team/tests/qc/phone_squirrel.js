/* F1: the corner squirrel (squirrel.js SQ.stash) plays on every screen size, phones included, and its panel sits clear of every control that stays on screen
   (Ask, Help, the tab bar, anything fixed or sticky that can be tapped), inside the screen. With reduced motion it does not play (by design).
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
    const ok = await p.evaluate(() => window.__sq.stash());
    await L.w(1400);
    const r = await p.evaluate(() => {
      const cv = [...document.querySelectorAll('body > canvas')].find(c => c.style.zIndex === '70');
      if (!cv) return { shown: false };
      const a = cv.getBoundingClientRect();
      const fixedUp = e => { for (let n = e; n && n !== document.body; n = n.parentElement) { const ps = getComputedStyle(n).position; if (ps === 'fixed' || ps === 'sticky') return true; } return false; };
      const vis = e => { const q = e.getBoundingClientRect(), cs = getComputedStyle(e); return q.width > 0 && q.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !e.closest('[hidden]'); };
      const hits = [...document.querySelectorAll('button, a[href], input, select, textarea, [role=button], [tabindex]:not([tabindex="-1"])')].filter(e => vis(e) && fixedUp(e)).map(e => ({ e, q: e.getBoundingClientRect() }))
        .filter(({ q }) => q.left < a.right && q.right > a.left && q.top < a.bottom && q.bottom > a.top)
        .map(({ e, q }) => `${e.id || e.className || e.tagName} (${Math.round(q.left)},${Math.round(q.top)} ${Math.round(q.width)}x${Math.round(q.height)})`);
      return { shown: true, rect: [a.left, a.top, a.width, a.height].map(Math.round), inside: a.left >= 0 && a.top >= 0 && a.right <= innerWidth && a.bottom <= innerHeight, hits };
    });
    const tag = `${d0} ${L.DEVS[dev].w}x${L.DEVS[dev].h}`;
    console.log(`${tag}: stash ${ok ? 'agreed' : 'refused'}, panel ${r.shown ? r.rect.join(' ') : 'not shown'}${r.hits && r.hits.length ? ', covers ' + r.hits.join('; ') : ''}`);
    if (!ok || !r.shown) fails.push(`${tag}: the corner squirrel did not play`);
    else { if (!r.inside) fails.push(`${tag}: panel ${r.rect.join(' ')} is not fully on screen`); if (r.hits.length) fails.push(`${tag}: panel covers ${r.hits.join('; ')}`); }
    const again = await p.evaluate(() => window.__sq.stash()); if (again) fails.push(`${tag}: a second call right after played again (150 s rule)`);
    if (errs.length) fails.push(`${tag}: ${errs.join(' | ').slice(0, 200)}`);
    await b.close();
  }
  { const { b, p } = await L.open({ dev: 'iphone13', query: 'sqtest', reduced: true }); const ok = await p.evaluate(() => window.__sq.stash()); if (ok) fails.push('reduced motion: the corner squirrel played'); await b.close(); }
  if (fails.length) { fails.forEach(f => console.log('FAIL ' + f)); console.log('PHONE SQUIRREL FAIL'); process.exit(1); }
  console.log('PHONE SQUIRREL PASS');
})().catch(e => { console.log('FAIL ' + e.message); process.exit(1); });
