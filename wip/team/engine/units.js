/* The Burrow engine: amounts in whole minor units (SCHEMA_V3 section 0 and 8, decisions H9, I2, L units).
   Every amount the engine holds is a whole number of the currency's minor unit: yen 1 is 1, peso 1.00 is 100.
   The table is the ISO 4217 minor-unit table (active codes). An unknown code is 2 decimals and the screen asks once.
   Plain browser JavaScript, no dependencies. */
(function (root) {
  'use strict';
  // Codes ISO lists with no minor unit (gold, test and fund codes such as XAU, XTS, XDR) are left out: unknown.
  const ZERO = 'BIF CLP DJF GNF ISK JPY KMF KRW PYG RWF UGX UYI VND VUV XAF XOF XPF';
  const THREE = 'BHD IQD JOD KWD LYD OMR TND';
  const FOUR = 'CLF UYW';
  const TWO = 'AED AFN ALL AMD ANG AOA ARS AUD AWG AZN BAM BBD BDT BGN BMD BND BOB BOV BRL BSD BTN BWP BYN BZD CAD CDF '
    + 'CHE CHF CHW CNY COP COU CRC CUP CVE CZK DKK DOP DZD EGP ERN ETB EUR FJD FKP GBP GEL GHS GIP GMD GTQ GYD HKD HNL '
    + 'HTG HUF IDR ILS INR IRR JMD KES KGS KHR KPW KYD KZT LAK LBP LKR LRD LSL MAD MDL MGA MKD MMK MNT MOP MRU MUR MVR '
    + 'MWK MXN MXV MYR MZN NAD NGN NIO NOK NPR NZD PAB PEN PGK PHP PKR PLN QAR RON RSD RUB SAR SBD SCR SDG SEK SGD SHP '
    + 'SLE SOS SRD SSP STN SVC SYP SZL THB TJS TMT TOP TRY TTD TWD TZS UAH USD USN UZS VED VES WST XCD XCG YER ZAR ZMW ZWG';
  const DECIMALS = Object.create(null);
  [[ZERO, 0], [TWO, 2], [THREE, 3], [FOUR, 4]].forEach(([list, d]) => list.split(' ').forEach(c => { DECIMALS[c] = d; }));

  const known = cur => DECIMALS[cur] !== undefined;
  const decimals = cur => (known(cur) ? DECIMALS[cur] : 2);

  // A typed amount (text, a point for decimals) as whole minor units, read as digits, never through a decimal number.
  // More decimals than the currency has: rounded half up, and `rounded: true` so the screen says so [L units q2].
  function toMinor(text, cur) {
    const d = decimals(cur);
    const m = /^(-?)(\d+)(?:\.(\d*))?$/.exec(String(text).trim());
    if (!m) throw new Error('not an amount: ' + text);
    const frac = m[3] || '';
    let n = BigInt(m[2]) * 10n ** BigInt(d) + BigInt((frac + '0'.repeat(d)).slice(0, d) || 0);
    const rest = frac.slice(d);
    if (rest.length && +rest[0] >= 5) n += 1n;
    const out = { minor: Number(m[1] ? -n : n), decimals: d, ask: !known(cur) };
    if (rest.length) out.rounded = true;
    return out;
  }
  // A number in money units (12.34) as minor units, for amounts that arrive as numbers (a statement reader, a test).
  const minorOf = (x, cur) => Math.round(x * Math.pow(10, decimals(cur)));

  function fmt(n, cur) {
    const d = decimals(cur), neg = n < 0, a = Math.abs(n), p = Math.pow(10, d);
    const whole = String(Math.floor(a / p)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (neg ? '-' : '') + whole + (d ? '.' + String(a % p).padStart(d, '0') : '');
  }

  // [I2] One month of interest on a balance: balance x yearly rate (percent) / 12, rounded half up to the minor unit,
  // in whole numbers so x.5 always goes up. Nothing on a balance at or below zero.
  function interestOn(bal, apr) {
    if (!apr || bal <= 0) return 0;
    const k = BigInt(Math.round(apr * 10000)), den = 1200n * 10000n;
    return Number((2n * BigInt(bal) * k + den) / (2n * den));
  }

  // [H9, L units q4] A total spread over n pays, each the same, the leftover minor units on the earliest pays.
  function spread(total, n) {
    const base = Math.floor(total / n), extra = total - base * n, out = [];
    for (let i = 0; i < n; i++) out.push(base + (i < extra ? 1 : 0));
    return out;
  }

  // [L units q9] A saved amount that is not whole is kept as it is and flagged, never rounded on load.
  const loadAmount = a => ({ a, flag: !Number.isInteger(a) });

  const api = { DECIMALS, known, decimals, toMinor, minorOf, fmt, interestOn, spread, loadAmount };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.BurrowEngine = root.BurrowEngine || {}).units = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
