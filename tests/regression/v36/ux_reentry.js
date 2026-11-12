const { w, P, runTour, launch } = require('/tmp/v22/lib.js');
const fs = require('fs'); let n = 0;
(async () => {
  const { b, p, errs } = await launch(390, 844, 'dark');
  const shot = async (name) => { n++; await p.screenshot({ path: `/tmp/v36/r/re-${String(n).padStart(2, '0')}-${name}.png` }); };
  const title = () => p.$eval('#tourTitle', e => e.textContent).catch(() => null);
  const go = async (t) => { await p.evaluate(t => { const b = document.querySelector(`[data-tab="${t}"]`) || document.querySelector(`[data-tab-go="${t}"]`); b && b.click(); }, t); await w(450); };
  // 1. finish later at the bills step
  let hit = false; await runTour(p, P.a, async () => { if ((await title()) === 'Monthly bills') { hit = true; throw new Error('stop'); } }).catch(() => {});
  await p.evaluate(() => document.querySelector('#tourSkip').click()); await w(700);
  console.log('after Finish later: tour hidden', await p.evaluate(() => document.querySelector('#tour').hidden), 'tab', await p.evaluate(() => [...document.querySelectorAll('[role=tab]')].find(t => t.getAttribute('aria-selected') === 'true').textContent));
  await shot('finish-later-landing');
  const cards = await p.evaluate(() => [...document.querySelectorAll('#hStatus, #hNext, #hBk')].filter(e => !e.hidden).map(e => e.id + ': ' + e.innerText.replace(/\s+/g, ' ').slice(0, 220))); console.log(cards);
  await p.evaluate(() => sessionStorage.setItem('__keep', '1')); await p.reload({ waitUntil: 'load' }); await w(900);
  console.log('after reload: tour open?', !(await p.evaluate(() => document.querySelector('#tour').hidden)), 'title', await title());
  await shot('finish-later-reload');
  if (!(await p.evaluate(() => document.querySelector('#tour').hidden))) { await p.evaluate(() => document.querySelector('#tourSkip').click()); await w(500); }
  const cards2 = await p.evaluate(() => [...document.querySelectorAll('#hStatus, #hNext, #hBk')].filter(e => !e.hidden).map(e => e.id + ': ' + e.innerText.replace(/\s+/g, ' ').slice(0, 220))); console.log('home after reload', cards2);
  // the Next card's button: does it resume the setup where it stopped?
  const resumed = await p.evaluate(() => { const b = document.querySelector('#hNext .btn'); if (!b) return 'no button'; b.click(); return b.textContent; }); await w(600);
  console.log('Next card button:', resumed, '-> tour open', !(await p.evaluate(() => document.querySelector('#tour').hidden)), 'at', await title());
  await shot('resume');
  await p.evaluate(() => { const t = document.querySelector('#tour'); if (!t.hidden) document.querySelector('#tourSkip').click(); }); await w(300);
  // 11. hide the Next card, then look for a way back
  await go('home'); const hid = await p.evaluate(() => { const h = document.querySelector('[data-hidenext]'); if (!h) return false; h.click(); return true; }); await w(400);
  console.log('hid next card', hid, 'hNext hidden now', await p.evaluate(() => document.querySelector('#hNext').hidden));
  await go('basics'); console.log('showStart visible?', await p.evaluate(() => { const e = document.querySelector('#showStart'); return e && !e.hidden; }));
  // 2. Zero all: what Home says after
  await p.evaluate(() => { const b = document.querySelector('#blankBtn'); b.scrollIntoView({ block: 'center' }); b.click(); }); await w(200); await p.evaluate(() => document.querySelector('#blankBtn').click()); await w(700);
  await go('home'); await shot('after-zero-all');
  console.log('after zero all:', await p.evaluate(() => [...document.querySelectorAll('#hStatus, #hNext, #hHero')].filter(e => !e.hidden).map(e => e.id + ': ' + e.innerText.replace(/\s+/g, ' ').slice(0, 200))));
  // 7. month arrows at the ends
  await go('month'); await p.evaluate(() => { const s = document.querySelector('#monthSel'); s.value = '2028-10'; s.dispatchEvent(new Event('change', { bubbles: true })); }); await w(300);
  console.log('at END: nextM disabled?', await p.$eval('#nextM', e => e.disabled), 'month', await p.$eval('#monthTxt', e => e.textContent));
  await p.evaluate(() => document.querySelector('#nextM').click()); await w(300); console.log('after tapping next at END:', await p.$eval('#monthTxt', e => e.textContent));
  await p.evaluate(() => { const s = document.querySelector('#monthSel'); s.value = '2026-11'; s.dispatchEvent(new Event('change', { bubbles: true })); }); await w(300);
  console.log('at START: prevM disabled?', await p.$eval('#prevM', e => e.disabled)); await p.evaluate(() => document.querySelector('#prevM').click()); await w(300); console.log('after tapping prev at START:', await p.$eval('#monthTxt', e => e.textContent));
  console.log('errs', errs);
  await b.close();
})();
