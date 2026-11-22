/* QC round 11 wording polish: the same action was called "Load the newer copy" in Settings and "Load it" on the Home notice. The Home
   notice now says "Load the newer copy" too, button and sentence. Run: node tests/qc/qc31_load_name.js */
let bad = 0; const ck = (n, c) => { console.log(c ? 'PASS' : 'FAIL', n); if (!c) bad++; };
const h = require('fs').readFileSync(process.env.BUILD || require('path').resolve(__dirname, '../../../money-map-team.html'), 'utf8');
ck('the Home notice button is "Load the newer copy"', h.includes('data-vault-load>Load the newer copy</button>'));
ck('no "Load it" button or "Tap Load it" left', !h.includes('data-vault-load>Load it<') && !h.includes('Tap Load it'));
console.log(bad ? 'qc31_load_name: ' + bad + ' FAIL' : 'qc31_load_name: ALL PASS'); process.exit(bad ? 1 : 0);
