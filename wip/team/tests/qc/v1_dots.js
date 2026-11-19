/* LAUNCH_CHECKLIST.md F2: the burrow page dots must not cover the squirrel at the burrow door on screens under 700px tall, and they are
   hidden while the squirrel carries coins in (a coin trip). The squirrel sits by the door, in the lower part of the screen, so on short
   screens the dots move to the top strip, clear of the card and the Back home sign. Made-up numbers.
   Run: node tests/qc/v1_dots.js */
let bad = 0; const ck = (n, c, x) => { console.log(c ? 'PASS' : 'FAIL', n, c ? '' : (x || '')); if (!c) bad++; };
const L = require('./lib_r12.js'); const R = L.R; const w = R.w;
const over = (a, b) => a && b && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
(async () => {
  for (const [W, H] of [[390, 640], [360, 600], [390, 690]]) {
    const { b, p, errs } = await L.start({ w: W, h: H, dpr: 1, mobile: true, keep: true });
    await L.base(p, {});
    await p.evaluate(() => { __t.S.ui.done = { pay: true, bills: true, goals: true }; __t.persist(); __t.restructure(); });
    await L.tab(p, 'tab-month'); await L.tab(p, 'tab-home'); await w(600);
    await p.evaluate(() => document.querySelector('#hBur [data-b]').click()); await w(1500);
    const r = await p.evaluate(() => { const q = s => { const e = document.querySelector(s); if (!e) return null; const x = e.getBoundingClientRect(); return { left: x.left, right: x.right, top: x.top, bottom: x.bottom, vis: getComputedStyle(e).visibility !== 'hidden' && !e.hidden }; };
      return { dots: q('.bv-dots'), pop: q('.bv-pop'), sign: q('.bv-sign'), H: innerHeight }; });
    const tag = W + 'x' + H;
    ck(tag + ' F2 the dots sit in the top third, away from the door where the squirrel stops', r.dots && r.dots.vis && r.dots.bottom <= r.H / 3, JSON.stringify(r.dots));
    ck(tag + ' F2 the dots cover neither the card nor the Back home sign', !over(r.dots, r.pop) && !over(r.dots, r.sign), JSON.stringify(r));
    ck(tag + ' F2 the dots are still on screen', r.dots && r.dots.top >= 0);
    /* a coin trip: Add money, an amount, Add */
    await p.evaluate(() => { const bt = document.querySelector('.bv-pop .bv-add'); bt && bt.click(); }); await w(500);
    await p.evaluate(() => { const c = document.querySelector('.bv-pop .chip'); c && c.click(); }); await w(300);
    await p.evaluate(() => { const bt = [...document.querySelectorAll('.bv-pop button')].find(x => /^Add\b/.test(x.textContent.trim()) && !x.classList.contains('chip')); bt && bt.click(); }); await w(700);
    const trip = await p.evaluate(() => ({ pop: document.querySelector('.bv-pop').innerText, dots: getComputedStyle(document.querySelector('.bv-dots')).visibility }));
    ck(tag + ' F2 a coin trip started ("' + trip.pop.replace(/\n/g, ' ') + '")', /Going in/.test(trip.pop), trip.pop);
    ck(tag + ' F2 the dots are hidden during the coin trip', trip.dots === 'hidden', trip.dots);
    await w(9000);
    const after = await p.evaluate(() => ({ pop: document.querySelector('.bv-pop').innerText, dots: getComputedStyle(document.querySelector('.bv-dots')).visibility }));
    ck(tag + ' F2 the dots come back when the trip is over', /Added/.test(after.pop) && after.dots === 'visible', JSON.stringify(after));
    ck(tag + ' no page errors', errs.length === 0, errs.join(' | '));
    await b.close();
  }
  console.log(bad ? 'V1 DOTS FAIL ' + bad : 'V1 DOTS PASS'); process.exit(bad ? 1 : 0);
})();
