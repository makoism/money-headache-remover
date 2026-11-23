// g1: a phone-only person, away three weeks (persona: three weeks without opening the app). After AH1.
// [AH1] A device's own write uses its own clock; a long gap is never held; only D8 asks (more than 40 days ahead of the
// last open, or more than a day back). An arriving copy is held only when more than a day ahead of the receiver's own now.
// Cases: rules/merge.json mg-121 to mg-133; the money: scenarios/away_clock.json ac-01 to ac-03.
const path = require('path');
const M = require(path.join(__dirname, '..', '..', 'rules', 'merge_ref.js'));
let lastSeen = '2026-11-01T21:00:00.000+09:00', lastDay = '2026-11-01';   // last write and last open before going away
for (const now of ['2026-11-22T12:00:00.000+09:00', '2026-11-23T08:00:00.000+09:00', '2026-12-01T08:00:00.000+09:00', '2027-03-01T08:00:00.000+09:00']) {
  const r = M.nextAtWarn(now, lastSeen, lastDay);
  console.log('now', now, '-> at', r.at, r.warn ? '(D8 asks the date first)' : '(nothing asked)');
  lastSeen = r.at; lastDay = now.slice(0, 10);
}
console.log('hand answer: each `at` is its now; only 1 Mar 2027 (90 days after 1 Dec) asks the date first');
// Two devices: desktop used daily, phone away three weeks. Same spend record.
const out = M.ask('devices', {
  devices: { P: { id: 'phn001', lastSeen: '2026-11-01T21:00:00.000+09:00' }, D: { id: 'dsk001', lastSeen: '2026-11-09T21:00:00.000+09:00' } },
  copy: { events: [{ id: 'e1', k: 'spend', a: 1200, date: '2026-11-01', told: '2026-11-01T20:00:00.000+09:00', at: '2026-11-01T20:00:00.000+09:00' }] },
  steps: [
    { on: 'D', now: '2026-11-10T10:00:00.000+09:00', edit: { list: 'events', id: 'e1', set: { a: 1500 } } },
    { on: 'P', now: '2026-11-22T12:00:00.000+09:00', edit: { list: 'events', id: 'e1', set: { a: 1800 } } },   // the newer real correction
    { sync: 'D', to: 'P', now: '2026-11-22T12:01:00.000+09:00' }, { sync: 'P', to: 'D', now: '2026-11-22T12:02:00.000+09:00' },
  ],
  show: { on: 'P', list: 'events', id: 'e1' },
});
console.log('after merge (hand answer 1,800 at 22 Nov 12:00):', out.a, out.at);
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
console.log('spend typed at 12:00 after the 09:00 check: told', o2.told, '(hand answer 22 Nov 12:00: after the check, so the 8,000 is counted)');
