/* The Burrow engine: calendars and schedules (SCHEMA_V3 section 5; decisions F17, H2, H7, B8, AE1, AH3, X watch, 10.8).
   - A calendar per country: weekends, holidays and bank-closed days are not working days [F17]. Japan's holidays are
     worked out from the holiday law for each year; the Philippines' fixed and Easter-based days are worked out too, but
     the days proclaimed each year (Eid, Chinese New Year, extra special days) are not known ahead, so that table is marked
     `partial`. Any other country falls back to weekends only and is marked `fallback`, so the screen can say so.
     A table given for a country (from a data file, or a test) replaces the built-in one.
   - The occurrences of a schedule: every rule kind (month, weeks, months, monthsList, year, lastWorkday, once, none),
     rules and amounts from a date [H2], the first occurrence, `ends`, `count`, `byDay`, the keyed `amounts` override
     [B8, AE1] and the weekend and holiday rule. Each is named `<schedule>@<due date before any move>` [H2].
   Plain browser JavaScript; uses dates.js and units.js. */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && module.exports;
  const D = node ? require('./dates.js') : root.BurrowEngine.dates;
  const U = node ? require('./units.js') : root.BurrowEngine.units;
  const { dayNum, dayStr, weekday, ymOf, dayIn } = D;

  // ---------- holiday tables ----------
  const nthWeekday = (y, m, wd, k) => { let d = dayIn(y, m, 1); while (weekday(d) !== wd) d++; return d + 7 * (k - 1); };
  const lastWeekday = (y, m, wd) => { let d = dayIn(y, m, 'last'); while (weekday(d) !== wd) d--; return d; };
  // Easter Sunday (the Gregorian computus).
  function easter(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
    return dayIn(y, month, day);
  }
  // Japan, from the holiday law as it stands since 2020 (equinoxes by the usual formula, good for 1980 to 2099):
  // a holiday on a Sunday gives the next day that is not a holiday; a day between two holidays is a holiday too.
  function jpHolidays(y) {
    const set = new Set();
    const add = n => set.add(n);
    const vern = Math.floor(20.8431 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4));
    const aut = Math.floor(23.2488 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4));
    [[1, 1], [2, 11], [2, 23], [3, vern], [4, 29], [5, 3], [5, 4], [5, 5], [8, 11], [9, aut], [11, 3], [11, 23]].forEach(([m, d]) => add(dayIn(y, m, d)));
    add(nthWeekday(y, 1, 1, 2)); add(nthWeekday(y, 7, 1, 3)); add(nthWeekday(y, 9, 1, 3)); add(nthWeekday(y, 10, 1, 2));
    for (const h of [...set].sort((a, b) => a - b)) if (weekday(h) === 0) { let d = h + 1; while (set.has(d)) d++; set.add(d); }
    for (const h of [...set]) if (set.has(h + 2) && !set.has(h + 1) && weekday(h + 1) !== 0) set.add(h + 1);
    return set;
  }
  const jpBankClosed = y => new Set([dayIn(y, 1, 2), dayIn(y, 1, 3), dayIn(y, 12, 31)]);
  // The Philippines: the regular and special days that fall on a fixed date or follow Easter or the last Monday of
  // August. Eid'l Fitr, Eid'l Adha, Chinese New Year and the extra days of each year's proclamation are not here.
  function phHolidays(y) {
    const e = easter(y), set = new Set([e - 3, e - 2, e - 1, lastWeekday(y, 8, 1)]);
    [[1, 1], [4, 9], [5, 1], [6, 12], [8, 21], [11, 1], [11, 30], [12, 8], [12, 25], [12, 30], [12, 31]].forEach(([m, d]) => set.add(dayIn(y, m, d)));
    return set;
  }
  const BUILT_IN = {
    JP: { holidays: jpHolidays, bankClosed: jpBankClosed, partial: false },
    PH: { holidays: phHolidays, bankClosed: () => new Set(), partial: true },
  };
  const listOf = set => [...set].sort((a, b) => a - b).map(dayStr);
  const holidays = (country, y) => (BUILT_IN[country] ? listOf(BUILT_IN[country].holidays(y)) : []);
  const bankClosed = (country, y) => (BUILT_IN[country] ? listOf(BUILT_IN[country].bankClosed(y)) : []);

  // A calendar: `table` ({ holidays: [dates], bankClosed: [dates] }) replaces the built-in one when given.
  function calendar(country, table) {
    let closedOn;
    if (table) { const set = new Set([...(table.holidays || []), ...(table.bankClosed || [])].map(dayNum)); closedOn = n => set.has(n); }
    else if (BUILT_IN[country]) {
      const years = {}, b = BUILT_IN[country];
      closedOn = n => { const y = ymOf(n)[0]; const s = years[y] || (years[y] = new Set([...b.holidays(y), ...b.bankClosed(y)])); return s.has(n); };
    } else closedOn = () => false;
    const working = n => { const w = weekday(n); return w !== 0 && w !== 6 && !closedOn(n); };
    function shift(n, rule) {
      if (rule === 'before') while (!working(n)) n--;
      else if (rule === 'after') while (!working(n)) n++;
      return n;
    }
    function addWorking(n, k) { while (k > 0) { n++; if (working(n)) k--; } return n; }
    function subWorking(n, k) { while (k > 0) { n--; if (working(n)) k--; } return n; }
    function lastWorking(y, m) { let n = dayIn(y, m, 'last'); while (!working(n)) n--; return n; }
    return { country, working, shift, addWorking, subWorking, lastWorking,
      partial: !table && !!BUILT_IN[country] && BUILT_IN[country].partial, fallback: !table && !BUILT_IN[country] };
  }

  // ---------- keyed overrides [AE1, AH3, AN5] ----------
  // A key of `amounts` or `once` is read in its saved shape `{ amount, at, by, gone }`; a removed key is not read. Any other
  // shape is refused, so no reader is ever written against plain numbers.
  function keyLive(map, k) {
    const v = map ? map[k] : undefined;
    if (v === undefined || v === null) return null;
    if (typeof v !== 'object' || typeof v.amount !== 'number') throw new Error(`the key ${k} is not in the keyed override shape { amount, at, by, gone } [AE1, AH3, AN5]`);
    return v.gone ? null : v;
  }
  const keyAmount = (map, k) => { const v = keyLive(map, k); return v ? v.amount : null; };

  // ---------- occurrences ----------
  // The due days of one rule from day `start` to day `to`, before any move. `key` picks a `byDay` entry.
  function dueDays(r, start, to, cal) {
    const out = [];
    switch (r.every) {
      case 'month': {
        const days = r.days || [r.day];
        for (let [y, m] = ymOf(start); dayIn(y, m, 1) <= to; m++) for (const d of days) out.push({ due: dayIn(y, m, d), key: d });
        break;
      }
      case 'months': {
        const a = dayNum(r.from), day = r.day != null ? r.day : +r.from.slice(8, 10), [y, m] = ymOf(a);
        for (let k = 0; dayIn(y, m + k, 1) <= to; k += r.n) out.push({ due: dayIn(y, m + k, day), key: day });
        break;
      }
      case 'weeks': {
        const step = 7 * (r.n || 1);
        let due = dayNum(r.from);
        if (start > due) due += Math.floor((start - due) / step) * step;
        for (; due <= to; due += step) out.push({ due });
        break;
      }
      case 'monthsList':
        for (let [y] = ymOf(start); dayIn(y, 1, 1) <= to; y++) for (const mo of r.months) out.push({ due: dayIn(y, mo, r.day), key: r.day });
        break;
      case 'year': {
        const mo = +r.date.slice(0, 2), d = +r.date.slice(3, 5);
        for (let [y] = ymOf(start); dayIn(y, 1, 1) <= to; y++) out.push({ due: dayIn(y, mo, d) });
        break;
      }
      case 'lastWorkday':
        for (let [y, m] = ymOf(start); dayIn(y, m, 1) <= to; m++) out.push({ due: cal.lastWorking(y, m), noShift: true });
        break;
      case 'once': out.push({ due: dayNum(r.date) }); break;
      default: break;   // 'none': no fixed day, no future money expected [B4]
    }
    return out.sort((a, b) => a.due - b.due);
  }
  const liveEntries = list => (list || []).filter(x => x && !x.gone);
  const entryFrom = (x, i) => (i === 0 || x.from == null ? -Infinity : dayNum(x.from));
  // The usual amount on a due day: the `steps` entry in force on it [H2].
  function stepOn(sch, due) {
    let a = null;
    liveEntries(sch.steps).map((x, i) => ({ f: entryFrom(x, i), a: x.amount })).sort((p, q) => p.f - q.f).forEach(x => { if (x.f <= due) a = x.a; });
    return a;
  }

  // Every occurrence of schedule `sch` landing or due from day `from` to day `to`, sorted by landing day:
  // { id, sid, due, land, amount, key }. `cal` is the calendar of the schedule's account.
  function occurrences(sch, cal, from, to, opts) {
    const rules = liveEntries(sch.rules).map((x, i) => ({ f: entryFrom(x, i), rule: x.rule || {} })).sort((p, q) => p.f - q.f);
    const first = sch.from ? dayNum(sch.from) : -Infinity;
    const ends = sch.ends ? dayNum(sch.ends) : Infinity;
    const count = sch.count || null;
    const out = [];
    rules.forEach((p, i) => {
      const until = rules[i + 1] ? rules[i + 1].f : Infinity;
      // with a count, the occurrences are counted from the first one
      const start = count && first > -Infinity ? first : Math.max(from, p.f);
      for (const { due, key, noShift } of dueDays(p.rule, Math.min(start, to), to, cal)) {
        if (due < p.f || due >= until || due < first || due > ends) continue;
        if (count && out.length >= count) continue;
        out.push({ id: sch.id + '@' + dayStr(due), sid: sch.id, due, key, land: noShift ? due : cal.shift(due, sch.shift) });
      }
    });
    const monthly = sch.per === 'month' ? perMonthAmounts(sch, cal) : null;
    for (const o of out) {
      const one = keyAmount(sch.amounts, dayStr(o.due));   // [B8, AE1] one occurrence changed
      const step = monthly ? monthly(o.due) : stepOn(sch, o.due);
      o.amount = one != null ? one : sch.byDay && sch.byDay[String(o.key)] != null ? sch.byDay[String(o.key)] : step;
    }
    return out.filter(o => o.land >= from || o.due >= from).filter(o => o.due <= to || o.land <= to)
      .sort((a, b) => a.land - b.land || (a.id < b.id ? -1 : 1));
  }

  // [per: 'month', H9, L units q4] Each step is a monthly total: each occurrence gets monthly x 12 over the occurrences
  // in its due date's year, the leftover minor units on the earliest. (A rule that changes during the year gets the
  // months it is in force [P4, R2]: not yet here, see the report.)
  function perMonthAmounts(sch, cal) {
    const cache = {};
    return due => {
      const y = ymOf(due)[0];
      if (!cache[y]) {
        const plain = Object.assign({}, sch, { per: 'pay', amounts: null, byDay: null, count: null });
        const list = occurrences(plain, cal, dayIn(y, 1, 1), dayIn(y, 12, 31)).filter(o => ymOf(o.due)[0] === y).sort((a, b) => a.due - b.due);
        cache[y] = {};
        const monthly = stepOn(sch, dayIn(y, 1, 1));
        U.spread(monthly * 12, list.length || 1).forEach((a, i) => { if (list[i]) cache[y][list[i].due] = a; });
      }
      return cache[y][due] != null ? cache[y][due] : stepOn(sch, due);
    };
  }

  const api = { calendar, holidays, bankClosed, easter, keyLive, keyAmount, dueDays, occurrences, stepOn };
  if (node) module.exports = api;
  else (root.BurrowEngine = root.BurrowEngine || {}).schedules = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
