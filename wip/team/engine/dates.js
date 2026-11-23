/* The Burrow engine: days and moments (SCHEMA_V3 section 0, decisions D8, H1, X9, AN4, T watch).
   Every date is a whole day number (days since 1 Jan 1970), worked out from 'YYYY-MM-DD' by arithmetic: no
   `new Date(<date string>)`, no local time, so the answers are the same in Tokyo and in Los Angeles [D8].
   A moment (`told`, `at`) is milliseconds since 1970 in UTC, read with its own offset; a time with no offset of its
   own is read in the offset of the device that wrote it, passed in [X9]. Plain browser JavaScript, no dependencies. */
(function (root) {
  'use strict';
  const MS = 86400000;

  function dayNum(s) {
    const str = String(s);
    const y = +str.slice(0, 4), m = +str.slice(5, 7), d = +str.slice(8, 10);
    return Math.round(Date.UTC(y, m - 1, d) / MS);
  }
  const pad = n => (n < 10 ? '0' : '') + n;
  function ymdOf(n) { const d = new Date(n * MS); return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()]; }
  function dayStr(n) { const [y, m, d] = ymdOf(n); return y + '-' + pad(m) + '-' + pad(d); }
  const weekday = n => ((n % 7) + 7 + 4) % 7;   // 1 Jan 1970 was a Thursday; 0 is Sunday
  function ymOf(n) { const [y, m] = ymdOf(n); return [y, m]; }
  function daysInMonth(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }
  // Day `day` of month m in year y (m may run past 12 or below 1). A day past the month's end, or 'last', is the
  // month's last day, for every day field [10.8].
  function dayIn(y, m, day) {
    const i = y * 12 + (m - 1), yy = Math.floor(i / 12), mm = i - yy * 12 + 1;
    const last = daysInMonth(yy, mm);
    const d = day === 'last' ? last : Math.min(+day, last);
    return Math.round(Date.UTC(yy, mm - 1, d) / MS);
  }
  // The same day of the month k months later (or the last day of a shorter month).
  function addMonths(n, k) { const [y, m, d] = ymdOf(n); return dayIn(y, m + k, d); }

  // ----- moments -----
  const offsetMin = o => (!o || o === 'Z' ? 0 : (o[0] === '-' ? -1 : 1) * (+o.slice(1, 3) * 60 + +o.slice(4, 6)));
  const TIME = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2})(?::(\d{2}))?(?::(\d{2})(?:\.(\d+))?)?(Z|[+-]\d{2}:\d{2})?)?$/;
  // The offset a time carries ('+08:00', 'Z'), or null when it carries none (a date alone, or a time with no offset).
  function offsetOf(s) { const m = TIME.exec(String(s || '')); return m && m[2] !== undefined && m[6] ? m[6] : null; }
  // A moment in milliseconds. `zone` is the writing device's offset, used when the time carries none [X9].
  // A date with no time comes before every time that day (records on one day then keep the order they are listed in);
  // 24:00 is the end of its day (an opening that covers its whole day), just before the next day begins.
  function moment(s, zone) {
    const m = TIME.exec(String(s));
    if (!m) return NaN;
    const start = dayNum(m[1]) * MS - offsetMin(m[6] || zone) * 60000;
    if (m[2] === undefined) return start - 1;
    if (m[2] === '24') return start + MS - 2;
    const ms = m[5] ? Math.round(Number('0.' + m[5]) * 1000) : 0;
    return start + ((+m[2]) * 3600 + (+(m[3] || 0)) * 60 + (+(m[4] || 0))) * 1000 + ms;
  }
  // [AN4] The moment day n ends in an offset.
  const dayEnd = (n, zone) => (n + 1) * MS - offsetMin(zone) * 60000;

  const api = { MS, dayNum, dayStr, weekday, ymOf, ymdOf, daysInMonth, dayIn, addMonths, moment, offsetOf, offsetMin, dayEnd };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.BurrowEngine = root.BurrowEngine || {}).dates = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
