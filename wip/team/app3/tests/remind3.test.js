#!/usr/bin/env node
/* Reminders, the pure half (app3/src/remind3.js), in node, on the made-up Mako book (pay on the 10th, moved after
   weekends and holidays; Rent on the 27th) on Wed 25 Nov 2026. The days come from the engine's own calendar (the
   pay's real landing days), and the calendar file, Google and Outlook links are the old app's helpers (model.js
   reminderTimesFor, rruleOf, gcalUrl, outlookUrl, icsText) ported to day strings. Nothing is sent anywhere. */
'use strict';
const path = require('path'), fs = require('fs');
const R = require('../src/remind3.js');
const DAY = '2026-11-25';
let bad = 0, n = 0;
const t = (name, fn) => { n++; try { fn(); console.log('PASS ' + name); } catch (e) { bad++; console.log('FAIL ' + name + ': ' + String(e && e.stack || e).split('\n').slice(0, 3).join(' ')); } };
const eq = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((what || '') + ' got ' + JSON.stringify(a) + ' wanted ' + JSON.stringify(b)); };
const ok = (v, what) => { if (!v) throw new Error(what || 'not true'); };
const mako = () => JSON.parse(fs.readFileSync(path.join(__dirname, '../fixtures/mako_madeup_book.json'), 'utf8'));
const RENT = 'k7m2qa-f3n8p1x6wd-6';

t('check-in days: the day after each pay lands and the middle of each pay period, from today, by the real landing days', () => {
  const c = R.checkins(mako(), DAY, { months: 3 });
  // pays land 10 Nov, 10 Dec, Fri 8 Jan (10 Jan is a Sunday and 11 Jan Coming of Age Day, so the working day before), 10 Feb
  eq(c.items.slice(0, 5), [{ day: '2026-11-25', kind: 'mid' }, { day: '2026-12-11', kind: 'afterPay' }, { day: '2026-12-24', kind: 'mid' },
    { day: '2027-01-09', kind: 'afterPay' }, { day: '2027-01-24', kind: 'mid' }], 'days');
  ok(c.items.every(x => x.day >= DAY), 'nothing before today');
});
t('check-in days: only the ones chosen', () => {
  const c = R.checkins(mako(), DAY, { months: 2, mid: false });
  ok(c.items.length && c.items.every(x => x.kind === 'afterPay'), JSON.stringify(c.items));
  eq(c.items[0].day, '2026-12-11');
});
t('check-in days: a year ahead by default (12 pays, 24 check-ins)', () => {
  const c = R.checkins(mako(), DAY);
  eq(c.items.filter(x => x.kind === 'afterPay').length, 12, 'after pay');
  ok(c.items.slice(-1)[0].day <= '2026-11-25'.replace('2026', '2027'), 'within a year: ' + c.items.slice(-1)[0].day);
});
t('check-in days: the repeat rule for Google (pay on a fixed day each month)', () => {
  const c = R.checkins(mako(), DAY);
  eq(c.repeat, { afterPay: 'FREQ=MONTHLY;BYMONTHDAY=11', mid: 'FREQ=MONTHLY;BYMONTHDAY=25' });
});
t('check-in days: paid every two weeks repeats every two weeks on the weekday after pay', () => {
  const b = mako(); b.schedules[0].rules = [{ from: null, rule: { every: 'weeks', n: 2, from: '2026-11-13' } }];   // Fridays
  const c = R.checkins(b, DAY, { months: 1 });
  eq(c.items.slice(0, 3), [{ day: '2026-11-28', kind: 'afterPay' }, { day: '2026-12-04', kind: 'mid' }, { day: '2026-12-12', kind: 'afterPay' }]);
  eq(c.repeat, { afterPay: 'FREQ=WEEKLY;INTERVAL=2;BYDAY=SA', mid: 'FREQ=WEEKLY;INTERVAL=2;BYDAY=FR' });
});
t('check-in days: no pay day set gives nothing and says why', () => {
  const b = mako(); delete b.schedules[0].startsPeriod;
  const c = R.checkins(b, DAY);
  eq(c.items, []); ok(/pay day/.test(c.why), c.why);
});
t('bill reminders: a chosen number of days before each bill leaves the bank (its landing day)', () => {
  const list = R.bills(mako(), DAY, { before: 2, months: 4 });
  const rent = list.find(x => x.id === RENT);
  eq(rent.name, 'Rent');
  // Rent 27 Nov (Fri), 27 Dec is a Sunday so it lands Mon 28 Dec, 27 Jan, 27 Feb is a Saturday so 1 Mar
  eq(rent.items.map(x => [x.day, x.lands]), [['2026-11-25', '2026-11-27'], ['2026-12-26', '2026-12-28'], ['2027-01-25', '2027-01-27'], ['2027-02-27', '2027-03-01']]);
  eq(rent.repeat, 'FREQ=MONTHLY;BYMONTHDAY=25');
  ok(list.every(x => x.kind === 'bill'), 'bills only');
});
t('bill reminders: on the day itself; a reminder day already past is left out', () => {
  const rent = R.bills(mako(), '2026-11-26', { before: 2, months: 1 }).find(x => x.id === RENT);
  eq(rent.items[0].lands, '2026-12-28'); eq(rent.repeat, 'FREQ=MONTHLY;BYMONTHDAY=25');
  const same = R.bills(mako(), DAY, { before: 0, months: 1 }).find(x => x.id === RENT);
  eq(same.items[0].day, '2026-11-27'); eq(same.repeat, 'FREQ=MONTHLY;BYMONTHDAY=27');
});
t('bill reminders: an ended or removed bill is not listed', () => {
  const b = mako(); b.schedules.find(x => x.id === RENT).ends = '2026-11-30';
  b.schedules.find(x => x.name === 'Phone').gone = '2026-11-20';
  const list = R.bills(b, DAY, { before: 0, months: 3 });
  eq(list.find(x => x.id === RENT).items.length, 1, 'rent once');
  ok(!list.some(x => x.name === 'Phone'), 'phone gone');
});
t('events: words only, no amounts; one per day; a time of day', () => {
  const ev = R.events({ checkins: R.checkins(mako(), DAY, { months: 1 }), bills: R.bills(mako(), DAY, { before: 2, months: 1 }).filter(x => x.id === RENT), time: '20:30' });
  ok(ev.length >= 3, 'some');
  ok(ev.every(e => /^\d{4}-\d{2}-\d{2}$/.test(e.day) && e.time === '20:30' && e.title && !/\d{3}/.test(e.title + e.details)), JSON.stringify(ev[0]));
  const r = ev.find(e => e.kind === 'bill');
  eq(r.title, 'Rent is due on 27 Nov'); ok(/Check your bank/.test(ev.find(e => e.kind === 'afterPay').details), 'check-in words');
});
t('the calendar file: every event, floating local time, an alarm, lines of at most 75 bytes, CRLF', () => {
  const ev = [{ uid: 'burrow-mid-2026-11-25', day: '2026-11-25', time: '09:00', title: 'Check your bank, mid pay period', details: 'Open the burrow, then Check your bank; a comma, a semicolon; and a back\\slash' },
    { uid: 'burrow-bill-1-2026-12-26', day: '2026-12-26', time: '21:45', title: 'Rent is due on 28 Dec', details: '家賃のお知らせ、家賃のお知らせ、家賃のお知らせ、家賃のお知らせ、家賃のお知らせ' }];
  const s = R.ics(ev, { now: '2026-11-25T03:00:00Z' });
  ok(s.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n'), 'head');
  ok(s.endsWith('END:VCALENDAR\r\n'), 'end');
  eq((s.match(/BEGIN:VEVENT/g) || []).length, 2, 'two events');
  ok(s.includes('DTSTART:20261125T090000\r\n') && s.includes('DTEND:20261125T093000\r\n'), 'floating start and end');
  ok(s.includes('DTSTART:20261226T214500\r\n') && s.includes('DTEND:20261226T221500\r\n'), 'late evening');
  ok(s.includes('DTSTAMP:20261125T030000Z'), 'stamp');
  ok(s.includes('UID:burrow-mid-2026-11-25@burrow'), 'uid');
  ok(s.replace(/\r\n /g, '').includes('a comma\\, a semicolon\\; and a back\\\\slash'), 'escaped');
  ok((s.match(/BEGIN:VALARM/g) || []).length === 2 && s.includes('TRIGGER:PT0M'), 'alarm');
  ok(!/RRULE/.test(s), 'dated events, no repeat rule in the file');
  for (const line of s.split('\r\n')) ok(Buffer.byteLength(line, 'utf8') <= 75, 'line too long: ' + line);
  const unfolded = s.replace(/\r\n /g, '');
  ok(unfolded.includes('家賃のお知らせ、家賃のお知らせ、家賃のお知らせ、家賃のお知らせ、家賃のお知らせ'), 'folded by whole characters');
});
t('an event at 23:50 ends at 23:59, the same day', () => {
  const s = R.ics([{ uid: 'x', day: '2026-12-01', time: '23:50', title: 'a', details: 'b' }], { now: '2026-11-25T03:00:00Z' });
  ok(s.includes('DTEND:20261201T235900'), s);
});
t('Google: the next one, repeating by the rule when there is one; Outlook: the next one', () => {
  const e = { day: '2026-12-11', time: '09:00', title: 'Check your bank, pay has landed', details: 'Open the burrow & tick', rrule: 'FREQ=MONTHLY;BYMONTHDAY=11' };
  const g = R.gcal(e);
  ok(g.startsWith('https://calendar.google.com/calendar/render?action=TEMPLATE&text=Check%20your%20bank%2C%20pay%20has%20landed'), g);
  ok(g.includes('&dates=20261211T090000/20261211T093000') && g.includes('&recur=' + encodeURIComponent('RRULE:FREQ=MONTHLY;BYMONTHDAY=11')) && g.includes('details=Open%20the%20burrow%20%26%20tick'), g);
  ok(!R.gcal(Object.assign({}, e, { rrule: null })).includes('recur='), 'no rule, no repeat');
  const o = R.outlook(e);
  ok(o.startsWith('https://outlook.live.com/calendar/0/deeplink/compose?path=%2Fcalendar%2Faction%2Fcompose&rru=addevent&subject=Check%20your%20bank'), o);
  ok(o.includes('&startdt=2026-12-11T09:00:00&enddt=2026-12-11T09:30:00'), o);
});
t('a bad time falls back to 09:00', () => {
  ok(R.gcal({ day: '2026-12-11', time: '9am', title: 'a', details: 'b' }).includes('20261211T090000/'), 'fallback');
});
console.log(bad ? `remind3: ${bad} FAIL of ${n}` : `remind3: ALL PASS (${n})`);
process.exit(bad ? 1 : 0);
