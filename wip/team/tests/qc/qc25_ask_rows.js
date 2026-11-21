/* QC round 8 wording, confusing 2: the Ask proposed-change table used its own words, "Left over" and "Balance, end of Nov", where
   the rest of the page says "Not placed yet" and "Bank at month end" (the glossary). The table now uses the glossary words, and the
   month no longer changes the label. Works out the table rows in the page for a made-up change. Made-up numbers only.
   Run: PAGE=/abs/money-map-team.html node tests/qc/qc25_ask_rows.js */
const fs = require('fs'), d = __dirname + '/../../';
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const src = fs.readFileSync(d + 'ui4a.js', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
ck('ui4a.js has no "Balance, end of"', !/Balance, end of/.test(src));
ck('ui4a.js has no \'Left over\' row label', !/\['Left over'/.test(src));
(async () => {
  const L = require('./lib_r12.js'), w = L.R.w;
  const { b, p, errs } = await L.start({ w: 390, h: 844, dpr: 1, mobile: true });
  await w(400);
  const labels = await p.evaluate(() => { try { return window.__asst.asstDelta([]).rows.map(r => r[0]); } catch (e) { return 'error ' + e.message; } });
  ck('the table rows can be worked out', Array.isArray(labels), labels);
  const ls = Array.isArray(labels) ? labels : [];
  ck('a row is called "Not placed yet"', ls.includes('Not placed yet'), ls);
  ck('a row is called "Bank at month end"', ls.includes('Bank at month end'), ls);
  ck('no row is called "Left over" or "Balance, end of ..."', !ls.some(l => l === 'Left over' || /^Balance, end of/.test(l)), ls);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc25_ask_rows: ${bad} FAIL` : 'qc25_ask_rows: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc25_ask_rows: FAIL'); process.exit(1); });
