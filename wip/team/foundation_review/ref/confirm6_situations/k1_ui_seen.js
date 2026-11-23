// A desktop 3 hours fast sets a shared ui key; the phone receives it, then the person changes the same key on the phone.
const M = require('/home/user/money-headache-remover/wip/team/foundation_review/rules/merge_ref.js');
const desk = { ui: { limits: 'weekly', at: { limits: '2026-12-01T13:00:00.000+09:00' }, by: { limits: 'deskaa' } } };
const phone0 = { ui: { limits: 'monthly', at: { limits: '2026-11-30T08:00:00.000+09:00' }, by: { limits: 'phonea' } } };
const now = '2026-12-01T10:30:00.000+09:00';
const r = M.receive(phone0, desk, '2026-11-30T08:00:00.000+09:00', now);
console.log('held?', r.warn, 'phone ui after sync', JSON.stringify(r.copy.ui));
// the device's lastSeen after reading the copy, as the devices harness does it
const src = require('fs').readFileSync('/home/user/money-headache-remover/wip/team/foundation_review/rules/merge_ref.js','utf8');
const newestAt = eval('(' + src.match(/function newestAt[\s\S]*?\n}\n/)[0] + ')');
const seen = newestAt(r.copy) || '2026-11-30T08:00:00.000+09:00';
console.log('newestAt seen by phone:', newestAt(r.copy));
const at = M.nextAt(now, seen);
const phone1 = { ui: Object.assign({}, r.copy.ui, { limits: 'monthly', at: Object.assign({}, r.copy.ui.at, { limits: at }), by: Object.assign({}, r.copy.ui.by, { limits: 'phonea' }) }) };
console.log('phone edit at', at);
console.log('after merge with desktop:', M.merge(phone1, desk).ui.limits, '(hand answer: monthly, the later edit made after seeing weekly)');
// same for restore: the restore stamp against a ui key from a fast desktop
const rest = M.restore({ current: r.copy, backup: phone0, now, by: 'phonea', lastSeen: '2026-11-30T08:00:00.000+09:00' });
console.log('restore stamp', rest.ui.at.limits, '-> after cloud merge:', M.merge(rest, desk).ui.limits, '(hand: monthly, the restore)');
