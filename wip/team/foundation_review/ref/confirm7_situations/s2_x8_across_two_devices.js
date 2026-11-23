// Pay on the 10th. The phone, offline since 9 Dec, changes the pay day to the 25th "from 1 Dec" on 11 Dec:
// it has seen no December settle, so X8 allows it (rules/edits_ref changeFrom). The desktop ticked the 10 Dec pay on 10 Dec.
const M = require('/home/user/money-headache-remover/wip/team/foundation_review/rules/merge_ref.js');
const E = require('/home/user/money-headache-remover/wip/team/foundation_review/rules/edits_ref.js');
const pay = 'k7qzpa-m2xq7ab9zt-41';
const phoneAllows = E.ask ? E.ask('change_from', { schedule: pay, wanted: '2026-12-01', settles: [pay + '@2026-11-10'] }) : null;
console.log('phone, X8 on what it has seen:', JSON.stringify(phoneAllows));
const desktopRefuses = E.ask('change_from', { schedule: pay, wanted: '2026-12-01', settles: [pay + '@2026-11-10', pay + '@2026-12-10'] });
console.log('desktop would have refused:', JSON.stringify(desktopRefuses));
const base = { schedules: [{ id: pay, rules: [{ from: '2026-11-01', day: 10, at: '2026-11-01T09:00:00.000+09:00', by: 'phn001' }], at: '2026-11-01T09:00:00.000+09:00', by: 'phn001' }], events: [] };
const phone = JSON.parse(JSON.stringify(base));
phone.schedules[0].rules.push({ from: '2026-12-01', day: 25, at: '2026-12-11T08:00:00.000+09:00', by: 'phn001' });
phone.schedules[0].at = '2026-12-11T08:00:00.000+09:00';
const desk = JSON.parse(JSON.stringify(base));
desk.events.push({ id: 'set:' + pay + '@2026-12-10', k: 'in', a: 250000, settles: pay + '@2026-12-10', told: '2026-12-10T12:00:00.000+09:00', at: '2026-12-10T12:00:00.000+09:00', by: 'dsk001' });
const merged = M.merge(phone, desk);
console.log('merged rules:', JSON.stringify(merged.schedules[0].rules.map(r => r.from + ' day ' + r.day)), ' events:', merged.events.map(e => e.id).join(','));
console.log('The merged copy is exactly scenarios/x8_ordinary_ids.json (x8o-01): the look ahead throws "refused X8". No rule says what the merge or the next open does with it.');
