/* QC round 10 wording, the items with one right answer:
   1. Receipts, Explain this tab said "Claude reads your receipt photos" right above "Photos can't be read here. Use an AI app below."
   9. The plan summary Ask sends to Claude said "Jars" and "unassigned" (retired words Claude can repeat): "Places", "not placed yet".
   Polish: Restore with an empty box says "Paste a backup first, or tap Choose file."; Utilities "Hot and cold months can cost more."
   Reads the source.  Run: node tests/qc/qc28_words_r10.js */
const fs = require('fs'), d = __dirname + '/../../';
const r = f => fs.readFileSync(d + f, 'utf8');
let bad = 0; const ck = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) bad++; };
const ex = r('ui48.js'), ask = r('ui4a.js'), ui5 = r('ui5.js'), model = r('model.js');
ck('Explain this tab on Receipts does not say Claude reads photos here', !/Claude reads your receipt photos/.test(ex));
ck('...it says to send them to an AI app and paste its reply', /Send your receipt photos to an AI app, paste its reply here, and check each one before it is added\./.test(ex));
ck('Ask summary: no "Jars (" and no "unassigned"', !/Jars \(/.test(ask) && !/unassigned/.test(ask));
ck('Ask summary: "Places (" and "not placed yet"', /Places \(amount, share of pay, usual share\)/.test(ask) && /; not placed yet \$\{n\(J\.rest\)\}/.test(ask));
ck('Restore with an empty box: "Paste a backup first, or tap Choose file."', /Paste a backup first, or tap Choose file\./.test(ui5));
ck('Utilities: "Hot and cold months can cost more."', /Hot and cold months can cost more\./.test(model) && !/Hot and rainy/.test(model));
console.log(bad ? `qc28_words_r10: ${bad} FAIL` : 'qc28_words_r10: ALL PASS'); process.exit(bad ? 1 : 0);
