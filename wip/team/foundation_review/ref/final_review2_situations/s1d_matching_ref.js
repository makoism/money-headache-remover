// S1d: the same ATM transfer fed to rules/matching_ref.js as the bank side of a typed record (money out of b).
const { applyImports } = require('/home/user/money-headache-remover/wip/team/foundation_review/rules/matching_ref.js');
const out = applyImports({ accounts: { b: { kind: 'bank' }, cash: { kind: 'cash' } }, holidays: [], schedules: {}, expected: [],
  lines: [{ id: 't1', k: 'transfer', acct: 'b', acct2: 'cash', date: '2027-01-06', a: 10000, dir: 'out', src: 'typed', told: '2027-01-06T12:00' }],
  imports: [{ id: 'imp', src: 'statement', acct: 'b', file: 'jan.csv', from: '2027-01-01', to: '2027-01-31', lines: [{ id: 'i1', date: '2027-01-06', a: 10000, dir: 'out', line: 4 }] }] });
for (const l of out.lines) console.log(l.id, l.k || '(import line, no kind)', 'gone', !!l.gone, 'goneBy', l.goneBy || '-', 'acct2', l.acct2 || '-');
console.log('the typed transfer is gone and the import line carries no other side: the 10,000 in cash is lost');
