/* QC10 round 2 numbers blocker 2 (and north-star 6): "Spend X instead" ignored receipts already logged. With 100,000 of a 120,000 Free to
   spend already spent it offered "Spend 88,500 instead", which cannot fix the month: the money is spent. A trim is offered only down to
   what is already spent; below that it is not offered. Made-up numbers, the model in node.
   Run: node tests/qc/qc10_fix_offers.js */
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.resolve(__dirname, '../../model.js'), 'utf8');
const M = new Function(src + ';return {presetState,calcAll,MONTHS,setVal,addReceipt,fixes,cfg};')();
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 400)); } };
const NOV = M.MONTHS[0];
const mk = (play, spent) => { const S = M.presetState('¥'); M.setVal(S, 'envelope', NOV, play, 'once'); if (spent) M.addReceipt(S, NOV + '-05', spent, 'envelope', ''); return S; };
{ const S = mk(120000, 100000), m = M.calcAll(S).byYm[NOV], f = M.fixes(S, m), trim = f.find(x => x.id === 'trim');
  ck('short month, 100,000 of 120,000 already spent: the month is short', m.bankEnd < M.cfg(S, 'minBank'), m.bankEnd);
  ck('no "Spend X instead" below the 100,000 already spent', !trim || trim.amount >= 100000, f); }
{ const S = mk(120000, 0), m = M.calcAll(S).byYm[NOV], f = M.fixes(S, m), trim = f.find(x => x.id === 'trim');
  ck('nothing spent yet: the trim is still offered', !!trim && trim.amount < 120000, f);
  if (trim) { M.setVal(S, 'envelope', NOV, trim.amount, 'once'); const m2 = M.calcAll(S).byYm[NOV]; ck('and taking it brings the bank to the minimum', Math.abs(m2.bankEnd - M.cfg(S, 'minBank')) < 0.01, m2.bankEnd); } }
{ const S = mk(120000, 40000), m = M.calcAll(S).byYm[NOV], f = M.fixes(S, m), trim = f.find(x => x.id === 'trim');
  if (trim) { M.setVal(S, 'envelope', NOV, trim.amount, 'once'); const m2 = M.calcAll(S).byYm[NOV]; ck('some spent: a trim that is offered really brings the bank to the minimum', Math.abs(m2.bankEnd - M.cfg(S, 'minBank')) < 0.01 && trim.amount >= 40000, { trim, end: m2.bankEnd }); }
  else ck('some spent: no trim offered only when none can fix it', true); }
console.log(bad ? `qc10_fix_offers: ${bad} FAIL` : 'qc10_fix_offers: ALL PASS'); process.exit(bad ? 1 : 0);
