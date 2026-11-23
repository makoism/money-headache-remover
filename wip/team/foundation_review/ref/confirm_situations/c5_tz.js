// moved_records with the times as 38.31 really stores them: with an offset (Mako in Japan, +09:00), figure typed at 07:00 JST.
const { lookahead } = require('/home/user/money-headache-remover/wip/team/foundation_review/ref/lookahead_ref.js');
const sc = JSON.parse(JSON.stringify(require('/home/user/money-headache-remover/wip/team/foundation_review/scenarios/moved_records.json')));
sc.accounts[0].opening.told = '2026-11-22T07:00+09:00';
sc.events = sc.events.filter(e => e.id === 'm03');   // 5,000 receipt dated 22 Nov, no time: start of its day, inside the figure (J2)
sc.moved_copy.saved = '2026-11-24T08:00+09:00';
console.log('bank on 24 Nov (hand: 300,000, the receipt is inside the figure):', lookahead(sc, '2026-11-24').accounts.bank.bank);
sc.accounts[0].opening.told = '2026-11-22T07:00';
console.log('same with no offset:', lookahead(sc, '2026-11-24').accounts.bank.bank);
