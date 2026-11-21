/* QC round 6 data safety C2: Remove goal said "Tap again: removes Emergency fund, its ¥60,000 saved ..." and then Home's total
   dropped by ¥60,000 with no word that it would. The two-step text now says the saved money stops being counted and what to do if
   it's still there: "Its ¥60,000 saved stops being counted. Move it to another burrow first if you still have it." The amount is the
   goal's saved now, in the app's own money format (fmt2). The planned-this-month part stays.  Reads the source.
   Run: node tests/qc/qc13_remove_goal_saved.js */
const s = require('fs').readFileSync(__dirname + '/../../ui5.js', 'utf8');
let bad = 0; const ck = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) bad++; };
const line = (s.split('\n').find(l => l.includes('[data-gdel]') && l.includes('const gd')) || '') + '\n' + (s.split('\n').find(l => l.includes('confirmClick(gd,')) || '');
ck('the saved sentence uses the saved-now amount in fmt2', line.includes(' Its ${fmt2(saved0)} saved stops being counted. Move it to another burrow first if you still have it.'));
ck('saved0 is the goal\'s saved now', /saved0 = r0 && r0\.savedNow > 0 \? r0\.savedNow : 0/.test(line));
ck('the saved sentence shows only when something is saved', /saved0 > 0 \? ` Its \$\{fmt2\(saved0\)\} saved stops being counted\./.test(line));
ck('the planned this month part stays', line.includes('planned this month'));
ck('no "its ... saved" said twice (gone from the first sentence)', !/, its \$\{fmt2\(r0\.savedNow\)\} saved/.test(line));
ck('ends with the undo days', /You can undo for \$\{KEEP_DAYS\} days\.`/.test(line));
console.log(bad ? `qc13_remove_goal_saved: ${bad} FAIL` : 'qc13_remove_goal_saved: ALL PASS'); process.exit(bad ? 1 : 0);
