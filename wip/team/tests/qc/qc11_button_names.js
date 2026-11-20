/* QC round 4 money accuracy (confusing) and north-star agent check C2: help texts named buttons and tabs that do not exist: the debt form
   said "use Cards and loans on the Goals tab instead" (the Plan switch is Month, Burrows, All months), and Explain this tab on Home and the
   Next step said "tap Log" (the button says Log spend). Reads the source, no browser.  Run: node tests/qc/qc11_button_names.js */
const fs = require('fs'), dir = __dirname + '/../../';
const files = fs.readdirSync(dir).filter(f => /^ui[0-9a-z]*\.js$/.test(f) && !/\.bak\./.test(f));
let bad = 0; const ck = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (x !== undefined) console.log('     saw ' + JSON.stringify(x).slice(0, 300)); } };
const hits = re => files.flatMap(f => fs.readFileSync(dir + f, 'utf8').split('\n').map((l, i) => re.test(l) ? f + ':' + (i + 1) + ' ' + (l.match(new RegExp('.{0,50}' + re.source + '.{0,30}')) || [''])[0] : null).filter(Boolean));
ck('no text names a "Goals tab"', !hits(/Goals tab/).length, hits(/Goals tab/));
ck('no text says "tap Log." (the button is Log spend)', !hits(/tap Log\b(?! spend)/).length, hits(/tap Log\b(?! spend)/));
console.log(bad ? `qc11_button_names: ${bad} FAIL` : 'qc11_button_names: ALL PASS'); process.exit(bad ? 1 : 0);
