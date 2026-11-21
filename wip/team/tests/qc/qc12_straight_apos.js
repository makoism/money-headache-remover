/* QC round 5 wording 14: one screen said "partner’s" with a curly apostrophe; every other word uses a straight one. No curly
   apostrophes in the app's words.  QC round 6: the same word came back as the HTML entity &rsquo;, which this test missed, so it
   now also catches the entities (&rsquo; &lsquo; &#8217; &#8216; &#x2019; &#x2018;) and the escapes (’ ‘), in every
   app source file and body.html.  Reads the source.  Run: node tests/qc/qc12_straight_apos.js */
const fs = require('fs'), d = __dirname + '/../../';
let bad = 0; const ck = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (x) console.log('     saw ' + x); } };
const curly = /[‘’]|&[rl]squo;|&#82(?:17|16);|&#x201[89];|\\u201[89]/i;
const files = fs.readdirSync(d).filter(f => /\.js$/.test(f) && f !== 'test_team.js').concat(['body.html']);
for (const f of files) {
  const hits = fs.readFileSync(d + f, 'utf8').split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => curly.test(l));
  ck(f + ': no curly apostrophes', hits.length === 0, hits.map(([n, l]) => { const i = l.search(curly); return n + ': ' + l.slice(Math.max(0, i - 30), i + 12); }).join(' | '));
}
// the test itself catches each form (so it cannot go blind again)
for (const s of ['partner’s', 'partner‘s', 'partner&rsquo;s', 'partner&lsquo;s', 'partner&#8217;s', 'partner&#x2019;s', 'partner\\u2019s'])
  ck('catches ' + JSON.stringify(s), curly.test(s));
ck('a straight apostrophe passes', !curly.test("partner's"));
console.log(bad ? `qc12_straight_apos: ${bad} FAIL` : 'qc12_straight_apos: ALL PASS'); process.exit(bad ? 1 : 0);
