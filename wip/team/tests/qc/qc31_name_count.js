/* QC round 11 layout 2: the goal name box stops at 60 letters and cut "...celebration abroad" to "...celebration abro" with no word, and the cut
   name showed in the toast, on the tile and in the legend. From 50 letters a line under Name says how many; at 60 it says the name is
   full. Run: node tests/qc/qc31_name_count.js */
let bad = 0; const ck = (n, c, x) => { console.log(c ? 'PASS' : 'FAIL', n, c ? '' : JSON.stringify(x === undefined ? '' : x).slice(0, 300)); if (!c) bad++; };
const L = require('./lib_r12.js'), w = L.R.w;
(async () => {
  const { b, p, errs } = await L.start({ w: 320, h: 640, dpr: 1, mobile: true });
  await p.evaluate(() => { const t = document.getElementById('tab-goals') || document.getElementById('tab-month'); t && t.click(); }); await w(500);
  await p.evaluate(() => document.getElementById('addGoalBtn').click()); await w(500);
  await p.evaluate(() => [...document.querySelectorAll('[data-kind]')].find(b => /A trip/.test(b.textContent)).click()); await w(300);
  await p.tap('#gwName'); await w(300);
  const c0 = await p.$eval('#gwNameN', e => e.textContent.trim()).catch(() => null);
  ck('a short name shows no count', c0 === '', c0);
  await p.keyboard.type("Grandmother Wilhelmina's ninetieth birthday celebration"); await w(200);
  const c1 = await p.$eval('#gwNameN', e => e.textContent.trim()).catch(() => null);
  ck('from 50 letters it says how many ("55 of 60 letters.")', /^5\d of 60 letters\.$/.test(c1 || ''), c1);
  await p.keyboard.type(' abroad and more'); await w(200);
  const c2 = await p.$eval('#gwNameN', e => [e.textContent.trim(), e.getBoundingClientRect().height > 4]).catch(() => null);
  ck('at 60 it says the name is full, and the line is on screen', !!c2 && c2[0] === '60 of 60 letters. The name is full.' && c2[1], c2);
  ck('no page errors', errs.length === 0, errs);
  await b.close(); console.log(bad ? 'qc31_name_count: ' + bad + ' FAIL' : 'qc31_name_count: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed ' + e.stack); console.log('qc31_name_count: FAIL'); process.exit(1); });
