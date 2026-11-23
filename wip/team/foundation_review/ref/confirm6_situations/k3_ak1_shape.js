// AK1 says home's fields merge one by one "like the shared ui keys". If home takes the ui shape
// (at/by as maps), every dispatch in merge_ref that keys on `k === 'ui'` or a string `at` misses it.
const M = require('/home/user/money-headache-remover/wip/team/foundation_review/rules/merge_ref.js');
const H = (minA, mb, atMin, atMb, by) => ({ home: { minBank: { a: minA, cur: 'JPY' }, mainBank: mb, at: { minBank: atMin, mainBank: atMb }, by: { minBank: by, mainBank: by } } });
const phone = H(30000, 'bankA', '2026-11-24T10:00:00.000+09:00', '2026-11-20T10:00:00.000+09:00', 'phonea');
const desk = H(20000, 'bankB', '2026-11-20T10:00:00.000+09:00', '2026-11-24T11:00:00.000+09:00', 'deskaa');
console.log('merge:', JSON.stringify(M.merge(phone, desk).home), '\n  hand: minBank 30000 (phone 10:00), mainBank bankB (desk 11:00)');
// far-ahead arrival not held
const fast = H(0, 'bankA', '2026-11-27T10:00:00.000+09:00', '2026-11-20T10:00:00.000+09:00', 'fastaa');
const r = M.receive(phone, fast, null, '2026-11-24T12:00:00.000+09:00');
console.log('receive 3 days ahead: warn', r.warn, 'minBank', JSON.stringify(r.copy.home.minBank), '(hand: held, warning shown)');
// restore: the backup's home comes back unstamped and loses to the cloud
const backup = H(50000, 'bankA', '2026-11-01T10:00:00.000+09:00', '2026-11-01T10:00:00.000+09:00', 'phonea');
const rest = M.restore({ current: desk, backup, now: '2026-11-25T09:00:00.000+09:00', by: 'phonea', lastSeen: '2026-11-24T11:00:00.000+09:00' });
console.log('restore then cloud merge:', JSON.stringify(M.merge(rest, desk).home.minBank), '(hand: 50000, the restore)');
