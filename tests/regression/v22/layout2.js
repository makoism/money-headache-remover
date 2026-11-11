const { w, P, launch, runTour } = require('./lib.js');
const scan = () => {
  const vw = innerWidth, bad = [];
  const inScroller = el => { for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) { const o = getComputedStyle(e).overflowX; if ((o === 'auto' || o === 'scroll' || o === 'hidden') && e.scrollWidth > e.clientWidth + 1) return true; } return false; };
  document.querySelectorAll('body *').forEach(el => {
    if (el.closest('[hidden], [inert]') && !el.closest('#tour, #gw, #co, .dp, #help')) { /* hidden panels */ }
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'fixed' && el.id === 'confetti') return;
    if (el.closest('svg') && el.tagName !== 'svg') return;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
    if (el.offsetParent === null && cs.position !== 'fixed') return;
    if (r.right > vw + 1.5 || r.left < -1.5) { if (!inScroller(el) && !el.classList.contains('dp-native') && !el.closest('.dp-native')) bad.push((el.id ? '#' + el.id : el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0]) + ' ' + Math.round(r.left) + '..' + Math.round(r.right)); }
  });
  return { sw: document.documentElement.scrollWidth, vw, bad: [...new Set(bad)].slice(0, 8) };
};
(async () => {
  const [,, widths = '320,375,390,412,768,1180,1440', schemes = 'light,dark'] = process.argv; let total = 0, fails = 0;
  for (const scheme of schemes.split(',')) for (const wd of widths.split(',')) {
    const vh = +wd < 700 ? 700 : 860;
    const { b, p, errs } = await launch(+wd, vh, scheme);
    const r = await runTour(p, P.a); const tag = `${wd} ${scheme}`;
    const rep = (name, o) => { total++; const ok = o.sw <= o.vw + 1 && !o.bad.length; if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + tag + ' ' + name + (ok ? '' : ' ' + JSON.stringify(o))); };
    total++; if (r.probs.length) { fails++; console.log('FAIL ' + tag + ' tour: ' + r.probs.join('; ')); } else console.log('PASS ' + tag + ' tour (no overflow on any step)');
    await w(900); if (await p.evaluate(() => { const c = document.querySelector('#co'); return !!c && !c.hidden; })) { await p.click('#coSkip'); await w(350); }
    for (const t of ['home', 'receipts', 'goals', 'month', 'basics']) {
      await p.evaluate(tt => document.querySelector(`.tabs [data-tab=${tt}]`).click(), t); await w(800);
      if (await p.evaluate(() => { const c = document.querySelector('#co'); return !!c && !c.hidden; })) { await p.click('#coSkip'); await w(450); }
      rep(t, await p.evaluate(scan));
    }
    // overlays
    await p.evaluate(() => document.querySelector('.tabs [data-tab=home]').click()); await w(500);
    await p.evaluate(() => document.querySelector('#hGoals [data-gw]').click()); await w(600); rep('goal sheet', await p.evaluate(scan));
    await p.keyboard.press('Escape'); await w(400);
    await p.evaluate(() => document.querySelector('#helpBtn').click()); await w(300); rep('help menu', await p.evaluate(scan));
    await p.evaluate(() => document.querySelector('#helpAsk').click()); await w(900); rep('ask panel', await p.evaluate(scan));
    await p.evaluate(() => { const x = document.querySelector('#askClose'); if (x) x.click(); }); await w(300);
    console.log('   page errors:', JSON.stringify(errs));
    await b.close();
  }
  console.log(`TOTAL ${total} checks, ${fails} failing`);
})();
