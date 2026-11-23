'use strict';
const { t, done, eq, ok, throws } = require('./t.js');
const U = require('../units.js');

t('decimals by ISO code; unknown is 2 and asked', () => {
  eq(U.decimals('JPY'), 0); eq(U.decimals('PHP'), 2); eq(U.decimals('KWD'), 3); eq(U.decimals('CLF'), 4);
  eq(U.decimals('XAU'), 2); eq(U.known('XAU'), false); eq(U.known('USD'), true);
});
t('a typed amount to minor units, rounded half up and said so', () => {
  eq(U.toMinor('1234.5', 'PHP'), { minor: 123450, decimals: 2, ask: false });
  eq(U.toMinor('1234.565', 'PHP'), { minor: 123457, decimals: 2, ask: false, rounded: true });
  eq(U.toMinor('1234.564', 'PHP'), { minor: 123456, decimals: 2, ask: false, rounded: true });
  eq(U.toMinor('980.5', 'JPY').minor, 981);
  eq(U.toMinor('-15', 'USD').minor, -1500);
  throws(() => U.toMinor('1,000', 'USD'));
});
t('minor units from a number in money units (for amounts given as numbers)', () => {
  eq(U.minorOf(1234.56, 'USD'), 123456);
  eq(U.minorOf(0.1 + 0.2, 'USD'), 30);
  eq(U.minorOf(1500, 'JPY'), 1500);
});
t('format with the currency decimals', () => {
  eq(U.fmt(123456, 'USD'), '1,234.56'); eq(U.fmt(-5, 'USD'), '-0.05'); eq(U.fmt(1500000, 'JPY'), '1,500,000');
});
t('one month of interest, half up, nothing on a credit [I2]', () => {
  eq(U.interestOn(994700, 18), 14921);   // 14,920.5 up
  eq(U.interestOn(1000000, 18), 15000);
  eq(U.interestOn(-500, 18), 0); eq(U.interestOn(5000, 0), 0);
});
t('a monthly amount spread over the pays of a year, the leftover on the earliest pays [H9, L units q4]', () => {
  const list = U.spread(50000 * 12, 26);
  eq(list.length, 26);
  eq(list.reduce((a, b) => a + b, 0), 600000);
  eq(list[0], 23077); eq(list[25], 23076);
});
t('a saved amount that is not whole is kept and flagged [L units q9]', () => {
  eq(U.loadAmount(12.5), { a: 12.5, flag: true }); eq(U.loadAmount(12), { a: 12, flag: false });
});
done('units');
