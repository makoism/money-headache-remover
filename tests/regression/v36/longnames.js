const { w, P, runTour, launch } = require('/tmp/v22/lib.js');
(async () => {
  const { b, p, errs } = await launch(390, 844, 'dark');
  await p.goto('file:///home/claude/work/money-map-team.html?sfxtest#2026-11', { waitUntil: 'load' }); await w(600);
  const pr = JSON.parse(JSON.stringify(P.a)); pr.g.travel.name = 'Save for the wedding of my sister in Cebu next year'; pr.cur = 'NZ$'; pr.pay = 12345678; pr.bank = 98765432; Object.keys(pr.amt).forEach(k => pr.amt[k] *= 20);
  await runTour(p, pr); await w(1000);
  await p.evaluate(() => { window.__t.updateGoal(window.__t.S, window.__t.S.plan.goals[0].id, { why: 'Because she was there for me every single time it mattered and I promised' }); window.__t.persist(); window.__t.restructure(); }); await w(500);
  await p.evaluate(() => document.querySelector('[data-tab="home"]').click()); await w(500);
  const ov = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, wide: [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 && r.width > 0 && getComputedStyle(e).position !== 'fixed'; }).slice(0, 8).map(e => e.tagName + '.' + e.className + ' ' + Math.round(e.getBoundingClientRect().right)) }));
  console.log('home overflow:', ov);
  await p.screenshot({ path: '/tmp/v36/t/long-home.png' });
  await p.evaluate(() => scrollBy(0, 800)); await p.screenshot({ path: '/tmp/v36/t/long-home-2.png' });
  for (const t of ['month', 'goals', 'months', 'receipts']) { await p.evaluate(t => document.querySelector(`[data-tab="${t}"], [data-tab-go="${t}"]`).click(), t); await w(400); const o = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, wide: [...document.querySelectorAll('.wrap *')].filter(e => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 && r.width > 0; }).slice(0, 6).map(e => e.tagName + '.' + e.className + ' ' + Math.round(e.getBoundingClientRect().right)) })); console.log(t, 'overflow:', o); await p.screenshot({ path: `/tmp/v36/t/long-${t}.png` }); }
  console.log(errs);
  await b.close();
})();
