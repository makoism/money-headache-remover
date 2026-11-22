/* QC round 10 layout confusing 1: in an empty money box (Home, Check your bank), a 10th digit wiped the nine already typed.
   Now an empty box keeps what was typed and refuses only the digit that makes it too big. A box that had an amount when it was tapped
   still puts that amount back (typo_big.js: typing onto 2,500 never saves 250,025,000). Made-up numbers.
   Run: BUILD=/abs/money-map-team.html node tests/qc/qc28_big_keep.js */
let bad = 0; const ck = (n, c, x) => { console.log(c ? 'PASS' : 'FAIL', n, c ? '' : JSON.stringify(x === undefined ? '' : x).slice(0, 300)); if (!c) bad++; };
const L = require('./lib_r12.js'), R = L.R, w = R.w;
(async () => {
  const { b, p, errs } = await R.phone({ w: 390, h: 844, dpr: 1, mobile: true });
  await p.goto('file://' + (process.env.BUILD || process.env.PAGE || '/home/claude/work/money-map-team.html') + '?sfxtest'); await w(1300);
  for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); }
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '$'; });
  await L.base(p, { pay: 3000, bank: 2500, min: 0 });
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); });
  await L.tab(p, 'tab-home'); await w(400);
  await p.evaluate(() => { const c = document.getElementById('mpCheck'); c && c.click(); }); await w(600);
  const empty = await p.$eval('#mpBankIn', e => e.value);
  ck('the Check your bank box starts empty', empty === '', empty);
  await p.focus('#mpBankIn'); await w(200);
  for (const c of '1234567891') { await p.keyboard.type(c); await w(40); }
  await w(300);
  const v = await p.$eval('#mpBankIn', e => e.value.replace(/[^\d]/g, ''));
  ck('the nine digits typed stay, only the 10th is refused', v === '123456789', v);
  const msg = await p.evaluate(() => (document.getElementById('cheer') || {}).textContent || '');
  ck('it says the amount is too big', /too big/.test(msg), msg);
  ck('...and not "Type it again"', !/Type it again/.test(msg), msg);
  ck('no page errors', errs.length === 0, errs);
  await b.close();
  console.log(bad ? 'qc28_big_keep: ' + bad + ' FAIL' : 'qc28_big_keep: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed ' + e.stack); console.log('qc28_big_keep: FAIL'); process.exit(1); });
