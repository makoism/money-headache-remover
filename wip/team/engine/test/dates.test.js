'use strict';
const { t, done, eq, ok } = require('./t.js');
const D = require('../dates.js');

t('day numbers round trip', () => {
  eq(D.dayNum('1970-01-01'), 0);
  eq(D.dayStr(D.dayNum('2026-11-23')), '2026-11-23');
  eq(D.dayStr(D.dayNum('2028-02-29')), '2028-02-29');
  eq(D.dayNum('2026-11-23T09:30+09:00'), D.dayNum('2026-11-23'));
});
t('weekday: 0 is Sunday', () => {
  eq(D.weekday(D.dayNum('2026-11-23')), 1);   // a Monday
  eq(D.weekday(D.dayNum('2027-01-10')), 0);
});
t('a day past the month end is the last day; last is the last day', () => {
  eq(D.dayStr(D.dayIn(2027, 2, 31)), '2027-02-28');
  eq(D.dayStr(D.dayIn(2028, 2, 'last')), '2028-02-29');
  eq(D.dayStr(D.dayIn(2026, 13, 10)), '2027-01-10');
  eq(D.dayStr(D.dayIn(2027, 0, 10)), '2026-12-10');
});
t('year and month of a day', () => {
  eq(D.ymOf(D.dayNum('2026-12-31')), [2026, 12]);
});
t('moments compare with their offsets', () => {
  // 09:30 in Manila is 10:30 in Tokyo: after 10:00 in Tokyo
  ok(D.moment('2026-12-14T09:30+08:00') > D.moment('2026-12-14T10:00+09:00'));
  eq(D.moment('2026-12-14T00:00Z'), D.dayNum('2026-12-14') * 86400000);
});
t('a time with no offset takes the device offset given', () => {
  eq(D.moment('2026-12-14T10:00', '+09:00'), D.moment('2026-12-14T10:00+09:00'));
  eq(D.moment('2026-12-14T10:00'), D.moment('2026-12-14T10:00Z'));
});
t('a date with no time comes before every time that day; 24:00 is the end of the day', () => {
  ok(D.moment('2026-12-14', '+09:00') < D.moment('2026-12-14T00:00+09:00'));
  ok(D.moment('2026-12-14T24:00', '+09:00') > D.moment('2026-12-14T23:59:59.997+09:00'));
  ok(D.moment('2026-12-14T24:00', '+09:00') < D.moment('2026-12-15', '+09:00'));
});
t('the end of a day in an offset', () => {
  eq(D.dayEnd(D.dayNum('2026-12-14'), '+09:00'), D.moment('2026-12-15T00:00+09:00'));
  eq(D.dayEnd(D.dayNum('2026-12-14'), '-10:00'), D.moment('2026-12-15T00:00-10:00'));
});
t('the offset a time carries', () => {
  eq(D.offsetOf('2026-12-14T09:30+08:00'), '+08:00');
  eq(D.offsetOf('2026-12-14T09:30Z'), 'Z');
  eq(D.offsetOf('2026-12-14T09:30'), null);
  eq(D.offsetOf('2026-12-14'), null);
});
t('a bad moment is NaN, never a guess', () => {
  ok(Number.isNaN(D.moment('14 Dec 2026')));
});
t('months added keep the day, or the last day of a shorter month', () => {
  eq(D.dayStr(D.addMonths(D.dayNum('2027-01-31'), 1)), '2027-02-28');
  eq(D.dayStr(D.addMonths(D.dayNum('2027-01-15'), 13)), '2028-02-15');
});
done('dates');
