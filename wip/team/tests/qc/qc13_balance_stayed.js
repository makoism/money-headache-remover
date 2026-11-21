/* QC round 6 numbers gate should-fix 5: Receipts > Last month said "The balance went up ¥0, from ¥100,000 to ¥100,000." when the
   balance didn't move. When the change shows as zero it says "The balance stayed at ¥100,000." Other months keep "went up" or
   "went down" with the change and both ends.  Reads the source, then runs the line on made-up numbers.
   Run: node tests/qc/qc13_balance_stayed.js */
const s = require('fs').readFileSync(__dirname + '/../../ui7.js', 'utf8');
let bad = 0; const ck = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (x !== undefined) console.log('     saw ' + x); } };
const m = s.match(/\$\{fmt2\(b\.logged\)\} logged\. (\$\{[^\n]*?\})<\/p>/);
ck('the Last month line is found', !!m);
if (m) {
  const fmt2 = v => '¥' + Math.round(v).toLocaleString('en-US');
  const say = b => new Function('b', 'fmt2', 'return `' + m[1] + '`;')(b, fmt2);
  const z = say({ left: 0, change: 0, bankStart: 100000, bankEnd: 100000 });
  ck('no change: "The balance stayed at ¥100,000."', z === 'The balance stayed at ¥100,000.', z);
  const u = say({ left: 5000, change: 5000, bankStart: 100000, bankEnd: 105000 });
  ck('up: "The balance went up ¥5,000, from ¥100,000 to ¥105,000."', u === 'The balance went up ¥5,000, from ¥100,000 to ¥105,000.', u);
  const d = say({ left: -15000, change: 15000, bankStart: 100000, bankEnd: 85000 });
  ck('down: "The balance went down ¥15,000, from ¥100,000 to ¥85,000."', d === 'The balance went down ¥15,000, from ¥100,000 to ¥85,000.', d);
  const t = say({ left: 0.3, change: 0.3, bankStart: 100000, bankEnd: 100000.3 });
  ck('a change that shows as ¥0 also says stayed', /^The balance stayed at /.test(t), t);
}
console.log(bad ? `qc13_balance_stayed: ${bad} FAIL` : 'qc13_balance_stayed: ALL PASS'); process.exit(bad ? 1 : 0);
