/* script_two_ways: guards the number-gate finding that came back in rounds 1 to 3: one amount written two ways on one screen
   (whole in one place, with cents in another; rounded beside exact). The money rule (decision 1, RESUME round 3): whole amounts are
   written whole, every other amount keeps its two cents, and only the per-week and per-day pace hints ("about $90 a week") are rounded.
   On every tab and Plan view, Home with More open and Settings, in an ordinary and an overspent month with cents, this checks:
   (a) no amount is written with one decimal, with ".00", or above 999 without its comma; (b) no rounded amount sits beside an amount
   with cents that it is the rounding of (pace hints excepted). Made-up numbers. Run: node tests/qc/script_two_ways.js */
const K = require('./script_lib.js'); const { ck, done } = K.report();
const MONEY = /([−-]?)\u2060?\$(\d[\d,]*)(\.\d+)?/g;
const scan = text => {
  const fmtBad = [], whole = [], cents = [];
  for (const line of text.split('\n')) {
    for (const m of line.matchAll(MONEY)) {
      const tok = m[0], intp = m[2], dec = m[3] || '';
      const v = +(intp.replace(/,/g, '') + dec) * (m[1] ? -1 : 1);
      if (dec && dec.length !== 3) fmtBad.push(`"${tok}" (${dec.length - 1} decimals) in: ${line.trim().slice(0, 90)}`);
      if (dec === '.00') fmtBad.push(`"${tok}" (a whole amount with .00) in: ${line.trim().slice(0, 90)}`);
      if (!/^\d{1,3}(,\d{3})*$/.test(intp)) fmtBad.push(`"${tok}" (commas) in: ${line.trim().slice(0, 90)}`);
      const before = line.slice(Math.max(0, m.index - 7), m.index), after = line.slice(m.index + tok.length, m.index + tok.length + 10);
      const pace = /about\s*$/i.test(before) || /^\s*a (week|day)\b/.test(after);
      if (dec && dec !== '.00') cents.push({ v, tok, line }); else if (!pace) whole.push({ v, tok, line });
    }
  }
  const twoWays = [];
  for (const c of cents) for (const wv of whole) if (Math.abs(c.v - wv.v) <= 0.5 && Math.round(c.v) === wv.v)
    twoWays.push(`${c.tok} and ${wv.tok}: "${c.line.trim().slice(0, 70)}" / "${wv.line.trim().slice(0, 70)}"`);
  return { fmtBad: [...new Set(fmtBad)], twoWays: [...new Set(twoWays)] };
};
{ const t = scan('Bills $1,482.65 left\nyou have $1,483 to pay\nabout $90 a week, $90.40 planned\n$12.5 $3.00 $1234');
  ck('self-test: the scanner catches a planted two-ways amount and bad formats, and lets a pace hint be',
    t.twoWays.length === 1 && /1,482\.65/.test(t.twoWays[0]) && t.fmtBad.length === 3, JSON.stringify(t)); }
(async () => {
  const { b, p, errs } = await K.open({});
  for (const st of ['cents', 'over']) {
    if (st !== 'cents') await K.state(p, st);
    await K.sweep(p, async name => {
      const r = scan(await K.visibleText(p));
      ck(`${st} month, ${name}: every amount written by the money rule`, r.fmtBad.length === 0, r.fmtBad.join(' | '));
      ck(`${st} month, ${name}: no amount written two ways`, r.twoWays.length === 0, r.twoWays.join(' | '));
    });
  }
  ck('no page errors', errs.length === 0, errs.join(' | ')); await b.close(); done();
})();
