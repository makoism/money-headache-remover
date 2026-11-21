/* QC round 7 wording, confusing 7: the month-end card said "Put it toward the goal" next to a choice of goals, and "Count ¥20,000 in the
   bank". Now "Put it toward a goal" when more than one goal can be picked (one goal still uses its name), and "Keep ¥20,000 in the bank",
   with the card's words naming the same "Keep it in the bank". Reads the source.  Run: node tests/qc/qc16_sweep_keep.js */
const fs = require('fs'), d = __dirname + '/../../', src = fs.readFileSync(d + 'ui6.js', 'utf8');
let bad = 0; const ck = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) bad++; };
ck('more than one goal: "Put it toward a goal"', src.includes("sw.goals.length === 1 ? 'Put it toward ' + esc(sw.main.name) : 'Put it toward a goal'"));
ck('"Put it toward the goal" is gone', !src.includes('Put it toward the goal'));
ck('the bank button says "Keep X in the bank"', src.includes('`Keep ${fmt2(sw.left)} in the bank`'));
ck('the words say "Keep it in the bank", as the button does', src.includes("'Keep it in the bank or put it toward a goal. You can undo either one.' : 'Keep it in the bank. You can undo it.'"));
ck('"Count ... in the bank" is gone', !/Count (\$\{fmt2\(sw\.left\)\}|it) in the bank/.test(src));
console.log(bad ? `qc16_sweep_keep: ${bad} FAIL` : 'qc16_sweep_keep: ALL PASS'); process.exit(bad ? 1 : 0);
