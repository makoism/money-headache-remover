/* QC round 10 numbers should-fix 8: the Undo bar went stale after an edit. Log ¥50,000, edit it to ¥5,000: the bar still said "Logged
   ¥50,000" and its Undo removed the ¥5,000 receipt. After an edit the bar now names what Undo does now (puts back the amount from before
   the edit), and Undo does exactly that: the receipt stays. Made-up numbers.
   Run: BUILD=/abs/wip/money-map-team.html node tests/qc/qc29_undo_edit.js   Ends with "qc29_undo_edit: ALL PASS". */
let bad = 0; const ck = (n, c, x) => { console.log(c ? 'PASS' : 'FAIL', n, c ? '' : JSON.stringify(x === undefined ? '' : x).slice(0, 400)); if (!c) bad++; };
const L = require('./lib_r12.js'), R = L.R, w = R.w;
const BUILD = process.env.BUILD || process.env.PAGE || '/home/claude/work/money-map-team.html';
(async () => {
  const { b, p, errs } = await R.phone({ w: 390, h: 844, dpr: 1, mobile: true });
  await p.goto('file://' + BUILD + '?sfxtest'); await w(1300);
  for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(300); }
  await L.zero(p); await L.base(p, { pay: 300000, bank: 250000, min: 20000 });
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); }); await w(700);
  const bar = () => p.evaluate(() => { const e = document.getElementById('undoBar'); return e && !e.hidden ? document.getElementById('undoTxt').textContent : ''; });
  const amounts = () => p.evaluate(() => __t.S.receipts.filter(r => r.n === 'Made-up big').map(r => r.a));
  await L.rc(p, 50000, 'envelope', null, 'Made-up big');
  const b0 = await bar();
  ck(`logging offers Undo ("${b0}")`, /^Logged\. ¥50,000/.test(b0), b0);
  /* edit it to 5,000 while the bar is up */
  const id = await p.evaluate(() => __t.S.receipts.find(r => r.n === 'Made-up big').id);
  await p.evaluate(id => document.querySelector(`#rcList [data-rcedit="${id}"]`).click(), id); await w(400);
  await p.focus('#rcAmt'); await p.evaluate(() => { const e = document.getElementById('rcAmt'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(e, ''); }); await p.keyboard.type('5000');
  await p.click('#rcSave'); await w(600);
  ck('the edit saved 5,000', JSON.stringify(await amounts()) === '[5000]', await amounts());
  const b1 = await bar();
  ck(`the bar no longer says "Logged ¥50,000" ("${b1}")`, !/Logged/.test(b1) && !/^.{0,12}¥50,000:/.test(b1), b1);
  ck(`the bar names what Undo does now: puts back ¥50,000 ("${b1}")`, b1 === '' || /¥5,000/.test(b1) && /Undo puts back ¥50,000/.test(b1), b1);
  if (b1) {
    await p.evaluate(() => document.getElementById('undoGo').click()); await w(700);
    ck('Undo puts the amount from before the edit back, and the receipt stays', JSON.stringify(await amounts()) === '[50000]', await amounts());
  }
  /* a second edit while that bar is up: the bar follows again */
  await L.rc(p, 7000, 'envelope', null, 'Made-up small');
  const id2 = await p.evaluate(() => __t.S.receipts.find(r => r.n === 'Made-up small').id);
  await p.evaluate(id => document.querySelector(`#rcList [data-rcedit="${id}"]`).click(), id2); await w(400);
  await p.focus('#rcAmt'); await p.evaluate(() => { const e = document.getElementById('rcAmt'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(e, ''); }); await p.keyboard.type('700');
  await p.click('#rcSave'); await w(600);
  await p.evaluate(id => document.querySelector(`#rcList [data-rcedit="${id}"]`).click(), id2); await w(400);
  await p.focus('#rcAmt'); await p.evaluate(() => { const e = document.getElementById('rcAmt'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(e, ''); }); await p.keyboard.type('750');
  await p.click('#rcSave'); await w(600);
  const b2 = await bar();
  ck(`after a second edit the bar names that one ("${b2}")`, b2 === '' || /¥750/.test(b2) && /Undo puts back ¥700/.test(b2), b2);
  if (b2) { await p.evaluate(() => document.getElementById('undoGo').click()); await w(700);
    ck('Undo puts back 700, the receipt stays', await p.evaluate(() => __t.S.receipts.filter(r => r.n === 'Made-up small').map(r => r.a).join()) === '700'); }
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc29_undo_edit: ${bad} FAIL` : 'qc29_undo_edit: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc29_undo_edit: FAIL'); process.exit(1); });
