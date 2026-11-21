/* QC round 8 wording polish: times were written "PM" in some places (cloud copy times) and "pm" in others (the receipt reminder), and
   months "Jun" in most places but "June" in others (month pickers, Receipts title, month-end questions). One way each, the one used
   most on screen: "6:00 PM" and "Jun" ("18 Nov" in VOICE.md is the short month too). The cloud copy times come from the browser's
   own clock words ("3:05 PM"), so the reminder now matches them. Reads the source, then checks the page.
   Run: PAGE=/abs/money-map-team.html node tests/qc/qc26_time_month.js */

const fs = require('fs'), d = __dirname + '/../../';
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const FULLRE = /\b(January|February|March|April|June|July|August|September|October|November|December)\b/;
/* screen code without comments; ui46.js is the help text Claude reads and the Ask box (another helper's), so it is left out */
const files = fs.readdirSync(d).filter(f => /^ui.*\.js$/.test(f) && f !== 'ui46.js').concat(['body.html', 'model.js', 'burrows.js']);
const src = files.map(f => fs.readFileSync(d + f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/^\s*\/\/.*$/gm, '')).join('\n');
ck('no full month names in screen words', !FULLRE.test(src), (src.match(new RegExp('.{50}' + FULLRE.source + '.{20}')) || [])[0]);
ck('no lower case "am" or "pm" times built in the source', !/' (am|pm)'/.test(src), (src.match(/.{40}' (am|pm)'.{10}/) || [])[0]);
(async () => {
  const L = require('./lib_r12.js'), w = L.R.w;
  const { b, p, errs } = await L.start({ w: 390, h: 844, dpr: 1, mobile: true });
  /* what the person sees: every main page and Settings */
  const all = await L.dump(p, 'r8');
  await L.settings(p);
  const rest = await L.txt(p);
  await p.evaluate(() => document.getElementById('gearBtn').click()); await w(300);
  const seen = (all + '\n' + rest).match(new RegExp('.{0,40}' + FULLRE.source + '.{0,20}', 'g'));
  ck('no full month names on Home, Plan, Receipts or Settings', !seen, seen && seen.slice(0, 4));
  const low = (all + '\n' + rest).match(/.{0,30}\d (am|pm)\b.{0,10}/g);
  ck('no lower case am or pm on screen', !low, low && low.slice(0, 4));
  for (const [hm, want] of [['18:00', '6:00 PM'], ['09:05', '9:05 AM']]) {
    await p.evaluate(hm => { __t.S.ui.rcTime = hm; __t.S.ui.rcFreq = 'weekly'; __t.persist(); }, hm);
    await L.tab(p, 'tab-home'); await L.tab(p, 'tab-receipts');
    const rw = await p.evaluate(() => { const e = document.getElementById('rcWhen'); return e ? e.textContent : null; });
    ck(`the Receipts reminder line says "${want}"`, !!rw && rw.includes(' at ' + want), rw);
  }
  const t = await p.evaluate(() => document.getElementById('rcTitle').textContent);
  ck('the Receipts title uses the short month', /^Receipts, [A-Z][a-z]{2} \d{4}$/.test(t), t);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc26_time_month: ${bad} FAIL` : 'qc26_time_month: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc26_time_month: FAIL'); process.exit(1); });
