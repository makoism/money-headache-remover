// F6. A couple, one shared copy. Pay due Thu 10 Dec not seen (window to Fri 11). Mon 14 Dec Jun starts the new
// period on his phone (ps:2026-12-14). Tess's phone has not synced; Tue 15 she is asked "did your pay come?",
// says no and starts the new period too (ps:2026-12-15). They sync on Tue evening.
// Right: one late pay, one new period. It began 14 Dec (the earlier choice, or the newer one; either way ONE).
// The period from 14 Dec must not end after one day.
const { pe, show } = require('./base');
const ev = [{ id: 'ps:2026-12-14', k: 'periodStart', date: '2026-12-14' }, { id: 'ps:2026-12-15', k: 'periodStart', date: '2026-12-15' }];
const first = pe.ask('question_start', { periodFrom: '2026-11-10', nextPay: { due: '2026-12-10', landed: null }, events: ev, checkins: ['2026-12-12'], today: '2026-12-15' });
show('the November period ends', first.periodTo, '2026-12-13');
// The new period, from 14 Dec; its next pay is due 10 Jan.
const second = pe.ask('question_start', { periodFrom: '2026-12-14', nextPay: { due: '2027-01-10', landed: null }, events: ev, checkins: ['2026-12-15'], today: '2026-12-15' });
show('the period from 14 Dec has ended', second.ended, false);
