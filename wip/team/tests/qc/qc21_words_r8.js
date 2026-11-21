/* QC round 8 wording polish: one word for the cloud copy on screen ("locked cloud copy", never "encrypted"), "Your numbers stay in
   this browser" (not "data"), and the button under what Claude found says what it adds with the real count ("Add 3 receipts",
   not "Add to my page"). Reads the source, then checks the button in the page.
   Run: PAGE=/abs/money-map-team.html node tests/qc/qc21_words_r8.js */

const fs = require('fs'), d = __dirname + '/../../';
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
/* the source without comments, so only words that can reach the screen (or Claude's notes about the screen) count */
const files = fs.readdirSync(d).filter(f => /^ui.*\.js$/.test(f)).concat(['body.html']);
const src = files.map(f => fs.readFileSync(d + f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '')).join('\n');
ck('no "encrypted cloud copy" or "encrypted copy" in screen words', !/encrypted (cloud )?copy/i.test(src), (src.match(/.{60}encrypted (cloud )?copy.{20}/i) || [])[0]);
ck('"locked cloud copy" is used', /locked cloud copy/.test(src));
ck('no "data stays in this browser"', !/data stays in this browser/i.test(src), (src.match(/.{40}data stays in this browser.{20}/i) || [])[0]);
ck('"Your numbers stay in this browser" is used', /Your numbers stay in this browser/.test(src));
ck('no "Add to my page"', !/Add to my page/.test(src), (src.match(/.{40}Add to my page.{20}/) || [])[0]);
(async () => {
  const L = require('./lib_r12.js'), w = L.R.w;
  const { b, p, errs } = await L.start({ w: 390, h: 844, dpr: 1, mobile: true });
  await L.tab(p, 'tab-receipts');
  await p.evaluate(() => { document.querySelector('#scanPaste').value = 'date,amount,category,note\n2026-11-03,400,Food,Made-up cafe\n2026-11-04,700,Food,Made-up shop\n2026-11-05,200,Other,Made-up bus'; document.querySelector('#scanCheck').click(); }); await w(500);
  const btn = () => p.evaluate(() => { const b = [...document.querySelectorAll('#scanOut2 .msg.card button')].find(x => /^Add/.test(x.textContent)); return b ? b.textContent : null; });
  const tick = i => p.evaluate(i => document.querySelectorAll('#scanOut2 .msg.card li input[type=checkbox]')[i].click(), i);
  const r = { three: await btn() }; await tick(2); r.two = await btn(); await tick(1); r.one = await btn();
  ck('3 ticked: the button says "Add 3 receipts"', r.three === 'Add 3 receipts', r);
  ck('untick one: "Add 2 receipts"', r.two === 'Add 2 receipts', r);
  ck('one left: "Add 1 receipt"', r.one === 'Add 1 receipt', r);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc21_words_r8: ${bad} FAIL` : 'qc21_words_r8: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc21_words_r8: FAIL'); process.exit(1); });
