/* QC round 10 novice B3: in Add a burrow, tapping "A trip" fills Name with "Trip"; tapping the Name box then put the cursor after
   that word, so typing "Lisbon trip" made "TripLisbon trip". The suggested name is selected when the box is tapped, so typing
   replaces it. A name the person typed is never selected or replaced. Run: BUILD=/abs/money-map-team.html node tests/qc/qc28_goal_name.js */
let bad = 0; const ck = (n, c, x) => { console.log(c ? 'PASS' : 'FAIL', n, c ? '' : JSON.stringify(x === undefined ? '' : x).slice(0, 300)); if (!c) bad++; };
const L = require('./lib_r12.js'), w = L.R.w;
(async () => {
  process.env.BUILD = process.env.BUILD || process.env.PAGE || '/home/claude/work/money-map-team.html';
  const { b, p, errs } = await L.start({ w: 390, h: 844, dpr: 1, mobile: true });
  const open = async () => { await p.evaluate(() => { const t = document.getElementById('tab-goals') || document.getElementById('tab-month'); t && t.click(); }); await w(500); await p.evaluate(() => document.getElementById('addGoalBtn').click()); await w(500); };
  await open();
  await p.evaluate(() => [...document.querySelectorAll('[data-kind]')].find(b => /A trip/.test(b.textContent)).click()); await w(300);
  const pre = await p.$eval('#gwName', e => e.value);
  ck('picking A trip suggests the name Trip', pre === 'Trip', pre);
  await p.tap('#gwName'); await w(300); await p.keyboard.type('Lisbon trip'); await w(200);
  const v1 = await p.$eval('#gwName', e => e.value);
  ck('typing after tapping replaces the suggested name', v1 === 'Lisbon trip', v1);
  /* a name the person typed stays: tap again and add a word at the end */
  await p.evaluate(() => document.activeElement.blur()); await w(200);
  await p.tap('#gwName'); await w(300); await p.keyboard.press('End'); await p.keyboard.type(' 2027'); await w(200);
  const v2 = await p.$eval('#gwName', e => e.value);
  ck('a typed name is not selected or replaced on the next tap', v2 === 'Lisbon trip 2027', v2);
  ck('no page errors', errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e)).length === 0, errs);
  await b.close();
  console.log(bad ? 'qc28_goal_name: ' + bad + ' FAIL' : 'qc28_goal_name: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed ' + e.stack); console.log('qc28_goal_name: FAIL'); process.exit(1); });
