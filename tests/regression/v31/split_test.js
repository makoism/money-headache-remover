// Split the rest: each slider moves on its own; what is taken away waits as unassigned; Spread it and Give it to; the goal split the same way
const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) pass++; else fail++; console.log((c ? 'PASS ' : 'FAIL ') + n + (c ? '' : ' ' + JSON.stringify(x || ''))); };
const sum = a => a.reduce((x, y) => x + y, 0);
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.setViewport({ width: 390, height: 844 });
  await p.goto((process.env.PAGE_URL || 'file:///home/claude/work/money-map-team.html') + '?s=1#2026-11', { waitUntil: 'load' }); await w(900);
  let here = false;
  await runTour(p, P.b, async () => { const t = await p.$eval('#tourTitle', e => e.textContent); if (!here && t === 'Split the rest') { here = true; throw new Error('stop'); } }).catch(() => {});
  ok('reached Split the rest', (await p.$eval('#tourTitle', e => e.textContent)) === 'Split the rest');
  const vals = () => p.$$eval('#jarSplit input[type=range]', es => es.map(e => +e.value));
  const total = await p.$eval('#jarSplit input[type=range]', e => +e.max);
  const pool = () => p.$eval('#jarPool', e => ({ has: e.classList.contains('has'), t: e.textContent.replace(/\s+/g, ' ').trim() }));
  const slide = (i, v) => p.evaluate((i, v) => { const r = document.querySelectorAll('#jarSplit input[type=range]')[i]; r.value = v; r.dispatchEvent(new Event('input', { bubbles: true })); }, i, v);
  const v0 = await vals(); ok('starts with every share given out', sum(v0) === total && !(await pool()).has, { v0, pool: await pool() });
  ok('pool says all given out', /All of it is given out/.test((await pool()).t));
  // lower one: only it changes, the difference becomes unassigned
  await slide(1, v0[1] - 5); await w(150); let v = await vals();
  ok('lowering one share changes only that share', v[1] === v0[1] - 5 && v.every((x, k) => k === 1 || x === v0[k]), { v0, v });
  let pl = await pool(); ok('the 5% waits as unassigned, with the money', pl.has && /Unassigned 5%/.test(pl.t) && /Spread it/.test(pl.t), pl);
  ok('why line explains the move', /−5%.*Unassigned now 5%/.test(await p.$eval('#jarWhy', e => e.textContent)), await p.$eval('#jarWhy', e => e.textContent));
  // raise another: it takes from the unassigned part and stops when that is gone
  await slide(3, v[3] + 20); await w(150); const v2 = await vals();
  ok('raising one takes only what is unassigned', v2[3] === v[3] + 5 && sum(v2) === total && v2.every((x, k) => k === 3 || x === v[k]), { v, v2 });
  ok('why line says it stopped', /all that was unassigned|can only take what is unassigned/.test(await p.$eval('#jarWhy', e => e.textContent)), await p.$eval('#jarWhy', e => e.textContent));
  ok('pool is empty again', !(await pool()).has);
  // percent box obeys the same rule
  await p.evaluate(() => { const i = document.querySelector('[data-jrow="0"] .pctp input'); i.value = '0'; i.dispatchEvent(new Event('input', { bubbles: true })); }); await w(150);
  const v3 = await vals(); ok('typing 0 frees that share', v3[0] === 0 && sum(v3) === total - v2[0], { v2, v3 });
  pl = await pool(); ok('pool shows the freed part', pl.has && new RegExp('Unassigned ' + v2[0] + '%').test(pl.t), pl);
  // Spread it: shared by the current shares, nothing left
  await p.click('[data-spread="jar"]'); await w(250); const v4 = await vals();
  ok('Spread it gives the unassigned part out by the current shares', sum(v4) === total && v4[0] === 0 && v4.every((x, k) => x >= v3[k]), { v3, v4 });
  // Give it to: all of it into one
  await slide(2, v4[2] - 4); await w(120);
  await p.select('[data-give="jar"]', '0'); await w(250); const v5 = await vals();
  ok('Give it to puts all of it in that one', v5[0] === 4 && sum(v5) === total && v5[2] === v4[2] - 4, { v4, v5 });
  ok('the Give it to picker resets', (await p.$eval('[data-give="jar"]', e => e.value)) === '');
  // the usual amounts reset
  await p.click('#jarReset'); await w(250); const v6 = await vals();
  ok('Use the usual amounts fills everything again', sum(v6) === total && !(await pool()).has, v6);
  // leave with something unassigned: the plan shows it as left over, not as a jar's money
  await slide(1, v6[1] - 10); await w(120); const money = await p.$eval('[data-jrow="1"] .split-m', e => e.textContent);
  await p.click('#tourNext'); await w(500);
  const left = await p.evaluate(() => (localStorage.getItem('money-map-template-v2') || '').length > 0);
  ok('moved on with 10% unassigned (saved)', left);
  // goal split: the same pool
  here = false;
  await runTour(p, P.b, async () => { const t = await p.$eval('#tourTitle', e => e.textContent); if (!here && t === 'Split goal money') { here = true; throw new Error('stop'); } }).catch(() => {});
  if ((await p.$eval('#tourTitle', e => e.textContent)) === 'Split goal money') {
    const gv = () => p.$$eval('#goalSplit input[type=range]', es => es.map(e => +e.value));
    const g0 = await gv(); ok('goal shares start fully given out', sum(g0) === 100 && !(await p.$eval('#goalPool', e => e.classList.contains('has'))), g0);
    await p.evaluate(() => { const r = document.querySelectorAll('#goalSplit input[type=range]')[0]; r.value = +r.value - 7; r.dispatchEvent(new Event('input', { bubbles: true })); }); await w(150);
    const g1 = await gv(); ok('a goal share moves on its own too', g1[0] === g0[0] - 7 && g1.slice(1).every((x, k) => x === g0[k + 1]), { g0, g1 });
    ok('goal pool shows the unassigned part', /Unassigned 7%/.test(await p.$eval('#goalPool', e => e.textContent)));
    await p.click('[data-spread="goal"]'); await w(200); ok('Spread it works for goals', sum(await gv()) === 100);
  } else console.log('note: only one goal for this persona, the goal split screen did not show');
  ok('no page errors', errs.length === 0, errs);
  console.log(`SPLIT: ${pass} pass, ${fail} fail`); await b.close();
})();
