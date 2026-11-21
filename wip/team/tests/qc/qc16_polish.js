/* QC round 7 wording polish: four comma splices and a missing full stop, "Tap a name to open." with no "it", and the Settings minus hint
   that differed from setup's. Each is fixed; the Settings hint is now the same as setup's. Reads the source.
   Run: node tests/qc/qc16_polish.js */
const fs = require('fs'), d = __dirname + '/../../', src = ['ui1.js', 'ui2.js', 'ui45s.js', 'ui6.js'].map(f => fs.readFileSync(d + f, 'utf8')).join('\n');
let bad = 0; const ck = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) bad++; };
const pairs = [
  ['Yours for fun, spend it', "'Yours for fun. Spend it on whatever you want.'"],
  ['whatever you want, it starts fresh each month', 'Spend this on whatever you want. It starts fresh each month.</p>'],
  ['No streak yet, log one receipt', "'No streak yet. Log one receipt this week to start one.'"],
  ['with an AI app, screenshots of the bank app work too, and', "'Bring in 2 or 3 months of statements with an AI app. Screenshots of the bank app work too. The numbers become exact and your history fills in.'"],
  ['Upload 2 or 3 months of statements, screenshots', "'Upload 2 or 3 months of statements. Screenshots of the bank app work too. The numbers become exact and your history fills in.'"],
  ["' Tap a name to open.'", "' Tap a name to open it.'"],
  ["If you\\'re overdrawn type a minus, like -400.", 'Overdrawn? Type a minus first, like −400.'],
];
for (const [old, now] of pairs) { ck('gone: "' + old + '"', !src.includes(old)); ck('now: "' + now + '"', src.includes(now)); }
ck('setup and Settings give the same minus hint', /Overdrawn\? Type a minus first, like −200\./.test(src) && /Overdrawn\? Type a minus first, like −400\./.test(src));
console.log(bad ? `qc16_polish: ${bad} FAIL` : 'qc16_polish: ALL PASS'); process.exit(bad ? 1 : 0);
