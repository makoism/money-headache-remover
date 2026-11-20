/* QC round 4 wording 1: the Ask guide (sent to Claude with every question, and copied by Copy question) named buttons and places the app
   no longer has: "Goals" on Plan, "Log receipt", "Add goal", jars, Play, Give, Long-Term Savings for Spending, Keep as play, assigned.
   The guide uses today's names only. Reads ui46.js, no browser.  Run: node tests/qc/qc11_ask_guide.js */
const fs = require('fs'), src = fs.readFileSync(__dirname + '/../../ui46.js', 'utf8');
const m = /const ASK_GUIDE = `([\s\S]*?)`;/.exec(src), g = m ? m[1] : '';
let bad = 0; const ck = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (x !== undefined) console.log('     saw ' + JSON.stringify(x).slice(0, 300)); } };
ck('the guide is found', g.length > 2000, g.length);
for (const [name, re] of [['jar', /\bjars?\b/i], ['Play as a place', /\bPlay\b/], ['Give as a place', /\bGive\b/], ['Long-Term Savings', /Long-Term Savings/], ['Keep as play', /Keep as play/],
  ['assigned / unassigned', /\b(un)?assigned\b/i], ['Log receipt', /Log receipt\b/], ['Add goal', /Add goal\b/], ['Goals on the Plan switch', /Month, Goals/], ['em dash', /—/], ['hyphen as a dash', / - /]])
  ck('no ' + name, !re.test(g), (g.match(new RegExp('.{0,60}' + re.source + '.{0,40}', re.flags.replace('g', ''))) || [''])[0]);
for (const label of ['Month, Burrows and All months', 'Log spend', 'Add a burrow', 'Free to spend', 'Goal burrows', 'Giving'])
  ck('names "' + label + '"', g.includes(label));
console.log(bad ? `qc11_ask_guide: ${bad} FAIL` : 'qc11_ask_guide: ALL PASS'); process.exit(bad ? 1 : 0);
