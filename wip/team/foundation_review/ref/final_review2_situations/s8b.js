const { applyImports } = require('/home/user/money-headache-remover/wip/team/foundation_review/rules/matching_ref.js');
const out = applyImports({ accounts: { b: { kind: 'bank' } }, holidays: [], schedules: { pay: { vary: 0.3 } },
  expected: [{ s: 'pay', due: '2027-03-25', lands: '2027-03-25', acct: 'b', dir: 'in', a: 250000 }],
  lines: [],
  imports: [{ id: 'imp1', src: 'statement', acct: 'b', file: 'mar.csv', from: '2027-03-01', to: '2027-03-28', lines: [
    { id: 'i1', date: '2027-03-22', a: 200000, dir: 'in', line: 1 },
    { id: 'i2', date: '2027-03-25', a: 262000, dir: 'in', line: 2 } ] }] });
for (const l of out.lines) console.log(l.id, l.date, l.a, 'settles', JSON.stringify(l.settles));
