// F1. Pay due Thu 10 Dec is late (window 3 working days, to Tue 15). On Mon 14 the person starts the new
// period without it (periodStart 14 Dec, pe-32), answers the period end: Free to spend's 20,000 left goes to
// the trip, saved as pe:2026-12-13:free. Tue 15 the pay arrives inside its window and is ticked.
// Right (M7: the new period starts on the day they chose): the old period still ends Sun 13; the answer stands.
const { pe, show } = require('./base');
const ev = [{ id: 'ps:2026-12-14', k: 'periodStart', date: '2026-12-14' }];
const before = pe.ask('question_start', { periodFrom: '2026-11-10', nextPay: { due: '2026-12-10', landed: null }, events: ev, postingDays: 3, checkins: ['2026-12-12'], today: '2026-12-14' });
show('14 Dec, after periodStart: old period ends', before.periodTo, '2026-12-13');
const after = pe.ask('question_start', { periodFrom: '2026-11-10', nextPay: { due: '2026-12-10', landed: '2026-12-15' }, events: ev, postingDays: 3, checkins: ['2026-12-12'], today: '2026-12-15' });
show('15 Dec, the late pay ticked: old period ends', after.periodTo, '2026-12-13');
// The answer already saved is keyed by the old last day; the question now runs for the new last day.
const ends = pe.ask('leftovers_ends', { ends: [{ periodTo: after.periodTo, places: [{ id: 'free', left: 20000 }] }],
  answers: [{ period: '2026-12-13', place: 'free', to: 'trip', a: 20000 }] });
show('15 Dec: Free to spend still to decide', ends[0].places.free.toDecide, 0);
// F1b. Same, ticked pay (set:pay@2026-12-10) dated 8 Dec, answered (pe:2026-12-07:*), then the person corrects
// the tick's date to 9 Dec (it was in the bank a day later) or a nearer statement line moves the settle [Q6, S2].
const a2 = pe.ask('question_start', { periodFrom: '2026-11-10', nextPay: { due: '2026-12-10', landed: '2026-12-09' }, checkins: ['2026-12-06'], today: '2026-12-09' });
const e2 = pe.ask('leftovers_ends', { ends: [{ periodTo: a2.periodTo, places: [{ id: 'free', left: 20000 }] }], answers: [{ period: '2026-12-07', place: 'free', to: 'trip', a: 20000 }] });
show('pay day corrected 8 -> 9 Dec after the answer: still to decide', e2[0].places.free.toDecide, 0);
