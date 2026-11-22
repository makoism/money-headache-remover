/* QC round 12 north star smaller 5: Plan Details called the bills "Monthly bills"; everywhere else, and in the glossary, they are
   "Bills and basics". One word per thing: no screen text says "Monthly bills". Reads the source. Run: node tests/qc/qc32_bills_name.js */
const fs = require('fs'), path = require('path'), dir = path.resolve(__dirname, '../..');
let bad = 0; const ck = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (c ? '' : ' ' + (x || ''))); if (!c) bad++; };
const files = fs.readdirSync(dir).filter(f => /^(ui[\w]*|model|actions|card)\.js$|^body\.html$/.test(f));
const hits = [];
files.forEach(f => fs.readFileSync(path.join(dir, f), 'utf8').split('\n').forEach((l, i) => { const code = l.replace(/\/\*.*?\*\//g, ''); if (/Monthly bills/.test(code)) hits.push(f + ':' + (i + 1)); }));
ck('no screen text says "Monthly bills" (' + files.length + ' files read)', hits.length === 0, hits.join(', '));
ck('the Plan Details section is called Bills and basics', /id: 'nec', jar: 'nec', name: 'Bills and basics'/.test(fs.readFileSync(path.join(dir, 'ui1.js'), 'utf8')));
console.log(bad ? `qc32_bills_name: ${bad} FAIL` : 'qc32_bills_name: ALL PASS'); process.exit(bad ? 1 : 0);
