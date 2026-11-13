const L = require('/tmp/v22/lib.js'); const { w, P, runTour } = L;
let pass = 0, fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); c ? pass++ : fail++; };
(async () => {
  const { b, p, errs } = await L.launch(390, 844, 'dark');
  await p.goto('file:///home/claude/work/money-map-team.html?sfxtest#2026-11', { waitUntil: 'load' }); await w(600);
  await runTour(p, P.a); await w(900);
  const before = await p.evaluate(() => JSON.stringify(window.__t.S.plan));
  for (const [btn, txt] of [['#blankBtn', 'All numbers zeroed.'], ['#bkReset', 'Samples restored.']]) {
    await p.evaluate(() => document.querySelector('#gearBtn').click()); await w(300);
    await p.evaluate(s => { const b = document.querySelector(s); b.scrollIntoView({ block: 'center' }); b.click(); }, btn); await w(150);
    await p.evaluate(s => document.querySelector(s).click(), btn); await w(600);
    ok(await p.evaluate(() => !document.querySelector('#undoBar').hidden) && (await p.$eval('#undoTxt', e => e.textContent)) === txt, `${btn}: Undo offered ("${txt}")`);
    ok((await p.evaluate(() => JSON.stringify(window.__t.S.plan))) !== before, `${btn}: numbers changed`);
    await p.evaluate(() => document.querySelector('#undoGo').click()); await w(800);
    ok((await p.evaluate(() => JSON.stringify(window.__t.S.plan))) === before, `${btn}: Undo brings the plan back exactly`);
    ok(await p.evaluate(() => JSON.parse(localStorage.getItem('money-map-template-v2')).plan.goals[0].name === 'Japan trip'), `${btn}: and it is saved`);
    ok(await p.evaluate(() => document.querySelector('#undoBar').hidden), `${btn}: the bar goes away`);
  }
  ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs));
  console.log(`\nUNDO: ${pass} pass, ${fail} fail`); if (fail) process.exitCode = 1;
  await b.close();
})();
