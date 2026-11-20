/* A hyphen with spaces used as a dash in words people read ("isn't a bill - it comes out"). Plain words, no dashes (Mako's rule; QC10
   round 2 north-star notes). Reads the built page's text; code subtraction ("a - b") is one word either side and is not matched.
   Run: node tests/qc/qc10_no_hyphen_dash.js */
const fs = require('fs'), path = require('path');
const page = fs.readFileSync(process.env.PAGE || path.resolve(__dirname, '../../../money-map-team.html'), 'utf8');
const re = /[A-Za-z']{2,}[.,]? - [a-z]{2,} [a-z]{2,} [a-z]{2,}/g, hits = (page.match(re) || []).filter(h => !/Math|=>|\.length/.test(h));
console.log(hits.length ? 'FAIL hyphen used as a dash: ' + hits.slice(0, 12).join(' | ') : 'PASS no hyphen used as a dash');
console.log(hits.length ? 'qc10_no_hyphen_dash: FAIL' : 'qc10_no_hyphen_dash: ALL PASS'); process.exit(hits.length ? 1 : 0);
