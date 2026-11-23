const M = require('/home/user/money-headache-remover/wip/team/foundation_review/rules/merge_ref.js');
const sid = 'k7qzpa-m2xq7ab9zt-44', bank = 'k7qzpa-m2xq7ab9zt-2';
function sched(rules, at, by) { return { id: sid, kind: 'bill', name: 'Car insurance', acct: bank, rules, steps: [{ from: '2026-01-01', amount: 60000, at: '2026-01-01T09:00:00.000+09:00', by: 'phn001' }], told: '2026-01-01T09:00:00.000+09:00', at, by }; }
const r0 = { from: '2026-01-01', rule: { every: 'year', date: '05-31' }, at: '2026-01-01T09:00:00.000+09:00', by: 'phn001' };
const r1 = { from: '2027-05-01', rule: { every: 'year', date: '06-15' }, at: '2027-06-01T08:00:00.000+09:00', by: 'phn001' };
const set = { id: 'set:' + sid + '@2027-05-31', k: 'spend', sub: 'bill', date: '2027-05-31', acct: bank, a: 60000, settles: [{ s: sid, due: '2027-05-31' }], told: '2027-05-31T20:00:00.000+09:00', at: '2027-05-31T20:00:00.000+09:00', by: 'dsk001' };
const mine = { schedules: [sched([r0, r1], r1.at, 'phn001')], events: [] };
const theirs = { schedules: [sched([r0], r0.at, 'phn001')], events: [set] };
const r = M.afterMerge({ mine, theirs, now: '2027-06-01T09:00:00.000+09:00', by: 'phn001' });
console.log('yearly: rules after merge', JSON.stringify(r.copy.schedules[0].rules.map(x => [x.from, x.rule, !!x.gone])), 'notices', r.notices.length);
// last working day pay changed to the 25th from 1 Dec, desktop ticked 30 Nov... use Dec: lastWorkday 31 Dec ticked; change from 1 Dec to 25th
const p0 = { from: '2026-01-01', rule: { every: 'lastWorkday' }, at: '2026-01-01T09:00:00.000+09:00', by: 'phn001' };
const p1 = { from: '2026-12-01', rule: { every: 'month', days: [25] }, at: '2027-01-02T08:00:00.000+09:00', by: 'phn001' };
const setp = Object.assign({}, set, { id: 'set:' + sid + '@2026-12-31', date: '2026-12-31', settles: [{ s: sid, due: '2026-12-31' }] });
const r2 = M.afterMerge({ mine: { schedules: [sched([p0, p1], p1.at, 'phn001')], events: [] }, theirs: { schedules: [sched([p0], p0.at, 'phn001')], events: [setp] }, now: '2027-01-02T09:00:00.000+09:00', by: 'phn001' });
console.log('lastWorkday -> 25th: rules after merge', JSON.stringify(r2.copy.schedules[0].rules.map(x => [x.from, x.rule.every, !!x.gone])), 'notices', r2.notices.length);
// pay on the 25th changed offline to the last working day from 1 Dec; the desktop ticked the 25 Dec pay
const q0 = { from: '2026-01-01', rule: { every: 'month', days: [25] }, at: '2026-01-01T09:00:00.000+09:00', by: 'phn001' };
const q1 = { from: '2026-12-01', rule: { every: 'lastWorkday' }, at: '2026-12-26T08:00:00.000+09:00', by: 'phn001' };
const setq = Object.assign({}, set, { id: 'set:' + sid + '@2026-12-25', date: '2026-12-25', settles: [{ s: sid, due: '2026-12-25' }] });
const r3 = M.afterMerge({ mine: { schedules: [sched([q0, q1], q1.at, 'phn001')], events: [] }, theirs: { schedules: [sched([q0], q0.at, 'phn001')], events: [setq] }, now: '2026-12-26T09:00:00.000+09:00', by: 'phn001' });
console.log('25th -> lastWorkday: rules after merge', JSON.stringify(r3.copy.schedules[0].rules.map(x => [x.from, x.rule.every, !!x.gone])), 'notices', r3.notices.length);
