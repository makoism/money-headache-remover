/* QC round 8 wording polish: "mark" meant two things on Free to spend bars. On Home it is how far through the month you are; on Plan
   (and in the Settings hint) it was the Free to spend cap. The cap marker is now called the "cap line" in screen words, and "mark"
   is left for the month's pace only. Reads the source, then checks Plan and Settings in the page.
   Run: PAGE=/abs/money-map-team.html node tests/qc/qc26_cap_line.js */

const fs = require('fs'), d = __dirname + '/../../';
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const files = fs.readdirSync(d).filter(f => /^ui.*\.js$/.test(f)).concat(['body.html']);
const src = files.map(f => fs.readFileSync(d + f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '')).join('\n');
const capMark = src.match(/.{0,60}\bmark\b[^.`'"]{0,40}\b(cap|ceiling)\b.{0,20}|.{0,40}\b(cap|ceiling)\b[^.`'"]{0,40}\bmark\b.{0,20}/g);
ck('no screen words call the cap a "mark"', !capMark, capMark);
ck('the Settings hint does not say "as a mark on"', !/as a mark on/.test(src));
ck('"cap line" is used for it', /cap line/.test(src));
ck('Home\'s pace mark keeps its word ("the mark is how far through the month you are")', /the mark is how far through the month you are/.test(src));
(async () => {
  const L = require('./lib_r12.js'), w = L.R.w;
  const { b, p, errs } = await L.start({ w: 390, h: 844, dpr: 1, mobile: true });
  await p.evaluate(() => { __t.S.cfg.ceiling = 30000; __t.persist(); __t.restructure(); });
  await L.tab(p, 'tab-home'); await L.tab(p, 'tab-month'); await w(400);
  const plan = await p.evaluate(() => { const e = document.querySelector('#p-month') || document.body; return e.textContent.replace(/\s+/g, ' '); });
  const line = (plan.match(/[^.>]*Free to spend cap \(Settings\)\./) || [])[0] || '';
  ck('Plan names the cap marker "cap line"', /cap line/.test(line) && !/\bmark\b/.test(line), line || plan.slice(0, 300));
  await L.settings(p);
  const set = await L.txt(p);
  const hint = (set.match(/[^\n]*most you want Free to spend[^\n]*/) || [])[0] || '';
  ck('the Settings hint says "cap line" too', /cap line/.test(hint) && !/\bmark\b/.test(hint), hint);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc26_cap_line: ${bad} FAIL` : 'qc26_cap_line: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc26_cap_line: FAIL'); process.exit(1); });
