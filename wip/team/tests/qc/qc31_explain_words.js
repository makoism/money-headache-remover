/* QC round 11 wording (confusing 3 and polish): the "Explain this tab" tips said things the screen does not: "Tap a room" (a word used
   nowhere else), "Manual entry" and "Plan vs spend" (not the names on screen), "Hover over a colour" on a phone, "six places" when the
   bar has seven or eight, and "enter a new amount ... unless you choose Keep for later months" where the screen says an amount changes
   this month only. Some had no full stop. The tips now use the screen's own words. Run: node tests/qc/qc31_explain_words.js */
let bad = 0; const ck = (n, c, x) => { console.log(c ? 'PASS' : 'FAIL', n, c ? '' : (x || '')); if (!c) bad++; };
const h = require('fs').readFileSync(process.env.BUILD || require('path').resolve(__dirname, '../../../money-map-team.html'), 'utf8');
for (const old of ['Tap a room', "'Manual entry'", "'Plan vs spend'", 'Hover over a colour', 'Hover over a month', 'Your pay split into six places', 'unless you choose Keep for later months', "what\\'s left in each category'", "the goal amount and the date'"])
  ck('the tips no longer say ' + old, !h.includes(old));
for (const now of ["'Log spend', 'Type the date", "'Plan and spending'", 'Tap a colour to see its amount.', 'Tap an amount to change it for this month only. Tap a name to open it.', 'Tap Bills and basics or Free to spend to see how it is worked out.'])
  ck('the tips say ' + now, h.includes(now));
console.log(bad ? 'qc31_explain_words: ' + bad + ' FAIL' : 'qc31_explain_words: ALL PASS'); process.exit(bad ? 1 : 0);
