'use strict';
// engine/match.js against the frozen matching rules: every case of foundation_review/rules/matching.json, the same
// question and the same hand-worked answer, compared with keys sorted (as run_rules.js compares). Then a few checks of
// what the port adds: it runs in a browser (no require of the rules folder) and a holiday moves a posting window.
const fs = require('fs'), path = require('path');
const { t, done, eq, ok } = require('./t.js');
const M = require('../match.js');

function canon(x) {
  if (Array.isArray(x)) {
    const byId = x.length > 1 && x.every(i => i && typeof i === 'object' && typeof i.id === 'string');
    return '[' + (byId ? x.slice().sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0) : x).map(canon).join(',') + ']';
  }
  if (x && typeof x === 'object') return '{' + Object.keys(x).sort().map(k => JSON.stringify(k) + ':' + canon(x[k])).join(',') + '}';
  return JSON.stringify(x);
}
const spec = JSON.parse(fs.readFileSync(path.join(__dirname, '../../foundation_review/rules/matching.json'), 'utf8'));
let n = 0;
for (const c of spec.cases) {
  n++;
  t(c.id + ' ' + c.title, () => {
    const input = JSON.parse(JSON.stringify(Object.assign({}, spec.defaults || {}, c.input)));
    let got;
    try { got = M.ask(c.question, input); } catch (e) { got = { threw: e.message }; }
    eq(canon(got), canon(c.expected));
  });
}
t('every case of matching.json was run (' + n + ')', () => ok(n === spec.cases.length && n > 50));
t('the port needs nothing outside the engine folder', () => {
  const src = fs.readFileSync(path.join(__dirname, '../match.js'), 'utf8');
  ok(!/require\(/.test(src.replace(/typeof module/g, '')), 'match.js requires a file');
});
t('a holiday inside the window pushes its far end one working day out', () => {
  const acct = 'k7qzpa-m2xq7ab9zt-4';
  const typed = { id: 'k7qzpa-m2xq7ab9zt-9', acct, dir: 'out', a: 1200, date: '2026-11-20', src: 'typed' };
  const line = { id: 'imp:' + acct + ':2026-11-24:1200:out:1', date: '2026-11-24', a: 1200, dir: 'out' };
  const run = holidays => M.ask('import', { accounts: { [acct]: { kind: 'bank' } }, holidays, lines: [typed], imports: [{ id: 'i1', acct, src: 'statement', lines: [line] }] });
  // Fri 20 Nov, one working day either side: Mon 23 is the far end, so Tue 24 is outside
  eq(run([]).gone, {});
  // with Mon 23 a holiday the far end is Tue 24, so the statement line replaces the typed one
  eq(run(['2026-11-23']).gone, { [typed.id]: line.id });
});
done('match.test.js');
