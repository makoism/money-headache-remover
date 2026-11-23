// A phone-only person, away three weeks (persona: three weeks without opening the app).
const M = require('/home/user/money-headache-remover/wip/team/foundation_review/rules/merge_ref.js');
let lastSeen = '2026-11-01T21:00:00.000+09:00';   // last write before going away
for (const now of ['2026-11-22T12:00:00.000+09:00', '2026-11-23T08:00:00.000+09:00', '2026-12-01T08:00:00.000+09:00', '2027-03-01T08:00:00.000+09:00']) {
  const r = M.nextAtWarn(now, lastSeen); console.log('now', now, '-> at', r.at, 'warn', r.warn); lastSeen = r.at;
}
// Two devices: desktop used daily, phone away three weeks. Same spend record.
const out = M.ask('devices', {
  devices: { P: { id: 'phn001', lastSeen: '2026-11-01T21:00:00.000+09:00' }, D: { id: 'dsk001', lastSeen: '2026-11-09T21:00:00.000+09:00' } },
  copy: { events: [{ id: 'e1', k: 'spend', a: 1200, date: '2026-11-01', told: '2026-11-01T20:00:00.000+09:00', at: '2026-11-01T20:00:00.000+09:00' }] },
  steps: [
    { on: 'D', now: '2026-11-10T10:00:00.000+09:00', edit: { list: 'events', id: 'e1', set: { a: 1500 } } },
    { on: 'P', now: '2026-11-22T12:00:00.000+09:00', edit: { list: 'events', id: 'e1', set: { a: 1800 } } },   // the newer real correction
    { sync: 'D', to: 'P' }, { sync: 'P', to: 'D' },
  ],
  show: { on: 'P', list: 'events', id: 'e1' },
});
console.log('after merge (hand answer 1,800, the 22 Nov correction):', out.a, out.at);
// told order against a check made on the desktop the same morning
const o2 = M.ask('devices', {
  devices: { P: { id: 'phn001', lastSeen: '2026-11-01T21:00:00.000+09:00' }, D: { id: 'dsk001', lastSeen: '2026-11-21T21:00:00.000+09:00' } },
  copy: { events: [] },
  steps: [
    { on: 'D', now: '2026-11-22T09:00:00.000+09:00', edit: { list: 'events', id: 'chk1', set: { k: 'check', date: '2026-11-22', bal: 300000 } } },
    { on: 'P', now: '2026-11-22T12:00:00.000+09:00', edit: { list: 'events', id: 'sp1', set: { k: 'spend', date: '2026-11-22', a: 8000 } } },
  ],
  show: { on: 'P', list: 'events', id: 'sp1' },
});
console.log('spend typed at 12:00 after the 09:00 check: told', o2.told, '(check told 2026-11-22T09:00) -> read as inside the figure, 8,000 never counted');
