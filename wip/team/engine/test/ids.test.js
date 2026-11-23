'use strict';
const { t, done, eq, ok } = require('./t.js');
const I = require('../ids.js');

const ORD = 'k7qzpa-m2xq7ab9zt-41';
t('an occurrence name read whole up to @ [AJ1]', () => {
  eq(I.occurrence('pay@2026-12-25'), { schedule: 'pay', due: '2026-12-25' });
  eq(I.occurrence(ORD + '@2026-12-25'), { schedule: ORD, due: '2026-12-25' });
  eq(I.occurrence('mv:pay:steps.a@2026-12-25'), { schedule: 'mv:pay:steps.a', due: '2026-12-25' });
  eq(I.occurrence('pay'), null);
});
t('an ordinary id ending in 4 never names one ending in 41', () => {
  const four = 'k7qzpa-m2xq7ab9zt-4';
  eq(I.occurrence(ORD + '@2026-12-25').schedule === four, false);
  eq(I.scheduleOf(ORD + '@2026-12-25'), ORD);
});
t('built ids from what a record is [O2, X2, Q5, Q7, S3, T1]', () => {
  eq(I.built.set('pay@2026-12-25'), 'set:pay@2026-12-25');
  eq(I.built.auto('gym@2027-02-01'), 'auto:gym@2027-02-01');
  eq(I.built.skip('gym@2027-02-08'), 'skip:gym@2027-02-08');
  eq(I.built.pe('pay@2026-11-25', 'free'), 'pe:pay@2026-11-25:free');
  eq(I.built.ps('pay@2026-12-25'), 'ps:pay@2026-12-25');
  eq(I.built.rm('trip'), 'rm:trip');
  eq(I.built.close('old'), 'close:old'); eq(I.built.close('old', 2), 'close:old:2');
  eq(I.built.fee('set:top@2027-01-05'), 'fee:set:top@2027-01-05');
});
t('the occurrence a pe: or ps: id is for', () => {
  eq(I.periodOcc('pe:pay@2026-11-25:free'), 'pay@2026-11-25');
  eq(I.periodOcc('pe:' + ORD + '@2026-11-25:' + ORD), ORD + '@2026-11-25');
  eq(I.periodOcc('ps:mv:pay:steps.a@2026-12-25'), 'mv:pay:steps.a@2026-12-25');
  eq(I.periodOcc('x'), null);
});
t('a new ordinary id: device part, session part, counter [O3, AL7]', () => {
  const mk = I.idMaker('k7qzpa', () => 0.5);
  const a = mk(), b = mk();
  ok(I.isOrdinary(a)); ok(I.isOrdinary(b));
  eq(a.split('-')[2], '1'); eq(b.split('-')[2], '2');
  eq(a.split('-')[1].length, 10);
  ok(!I.isOrdinary('K7QZPA-m2xq7ab9zt-1'));
});
done('ids');
