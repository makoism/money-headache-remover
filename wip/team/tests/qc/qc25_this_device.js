/* QC round 8 data safety, polish 2: the screen said "this phone" in some places and "this device" in others. One word on screen:
   "this device". Reads the source without comments (only words that can reach the screen count), then checks the Settings page text.
   Code names and comments are not changed. Made-up numbers only.
   Run: PAGE=/abs/money-map-team.html node tests/qc/qc25_this_device.js */
const fs = require('fs'), d = __dirname + '/../../';
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const files = fs.readdirSync(d).filter(f => /\.js$/.test(f)).concat(['body.html']);
const hits = [];
for (const f of files) {
  const s = fs.readFileSync(d + f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/^\s*\/\/.*$/gm, '');
  const re = /.{0,40}\bthis phone\b.{0,20}/gi; let m; while ((m = re.exec(s))) hits.push(f + ': ' + m[0]);
}
ck('no "this phone" in screen words', hits.length === 0, hits);
const all = files.map(f => fs.readFileSync(d + f, 'utf8')).join('\n');
ck('the cloud Undo words say "this device"', /The numbers this device had are kept for/.test(all) && /Undo also stops sharing the cloud copy on this device\./.test(all) && /This device no longer shares the cloud copy/.test(all), null);
ck('the welcome back words say "this device now shares the cloud copy"', /this device now shares the cloud copy/.test(all));
(async () => {
  const L = require('./lib_r12.js'), w = L.R.w;
  const { b, p, errs } = await L.start({ w: 390, h: 844, dpr: 1, mobile: true });
  await L.settings(p); await w(400);
  const t = await p.evaluate(() => document.body.innerText);
  ck('Settings shows no "this phone"', !/this phone/i.test(t), (t.match(/.{40}this phone.{20}/i) || [])[0]);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc25_this_device: ${bad} FAIL` : 'qc25_this_device: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc25_this_device: FAIL'); process.exit(1); });
