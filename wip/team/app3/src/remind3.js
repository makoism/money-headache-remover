/* ---------- remind3: reminders in the phone's own calendar, the pure half (the old app's model.js helpers, ported) ----------
   Check-in reminders on the day after each pay lands and in the middle of each pay period, and bill reminders a chosen
   number of days before each bill leaves the bank. The days are the engine's own (engine/schedules.js occurrences on the
   country's calendar), so a pay moved by a weekend or a holiday moves its check-in too. Nothing is sent anywhere: the
   page makes a calendar file (.ics) to open, or a Google or Outlook link the person taps. The events carry words only,
   never an amount.
     R.checkins(book, today, { afterPay, mid, months }) -> { items: [{ day, kind: 'afterPay' | 'mid' }], repeat: { afterPay, mid }, why }
     R.bills(book, today, { before, months, only }) -> [{ id, name, kind: 'bill', items: [{ day, lands }], repeat }]
     R.events({ checkins, bills, time }) -> [{ uid, kind, day, time, title, details, rrule }]   one per reminder day
     R.ics(events, { now }) -> the calendar file's text; R.gcal(event), R.outlook(event) -> a link for one event
   `repeat` is a calendar repeat rule (RRULE) when the pay or bill keeps a plain rhythm (a fixed day each month, every n
   weeks), for Google's link; the calendar file holds each dated day instead, which is exact. Old helpers: model.js
   reminderTimesFor, rruleOf, gcalUrl, outlookUrl, icsText (they took Date objects; these take 'YYYY-MM-DD').
   Plain browser JavaScript; in node, require('./remind3.js'). Dates only, never money. */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && module.exports;
  const D = node ? require('../../engine/dates.js') : root.BurrowEngine.dates;
  const S = node ? require('../../engine/schedules.js') : root.BurrowEngine.schedules;
  const G = node ? require('../../engine/ledger.js') : root.BurrowEngine.ledger;
  const DAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const pad2 = n => String(n).padStart(2, '0');
  const live = x => x && !x.gone;
  const ruleNow = (s, today) => { let r = null; (s.rules || []).filter(live).forEach((x, i) => { if (i === 0 || x.from == null || x.from <= today) r = x.rule; }); return r; };
  function calOf(book, s) {
    const a = (book.accounts || []).find(x => x && x.id === s.acct);
    return S.calendar((a && a.country) || G.fieldValue((book.home || {}).country) || null);
  }
  const endOf = (today, months) => D.dayNum(addMonthsStr(today, months));
  function addMonthsStr(day, k) {   // the same day k months on, kept inside the month
    const y = +day.slice(0, 4), m = +day.slice(5, 7) - 1 + k, yy = y + Math.floor(m / 12), mm = (m % 12) + 1;
    return yy + '-' + pad2(mm) + '-' + pad2(Math.min(+day.slice(8, 10), D.daysInMonth(yy, mm)));
  }

  /* the repeat rule of a day that follows a rule, `shift` days later (for Google's link), or null */
  function repeatOf(rule, firstDay, shift) {
    if (!rule || !firstDay) return null;
    if (rule.every === 'month' && (rule.days || [rule.day]).length === 1) {
      const d = +firstDay.slice(8, 10);
      return d <= 28 ? 'FREQ=MONTHLY;BYMONTHDAY=' + d : null;
    }
    if (rule.every === 'weeks') return 'FREQ=WEEKLY;' + ((rule.n || 1) > 1 ? 'INTERVAL=' + rule.n + ';' : '') + 'BYDAY=' + DAY_CODES[D.weekday(D.dayNum(firstDay))];
    return null;
  }

  function checkins(book, today, o) {
    o = Object.assign({ afterPay: true, mid: true, months: 12 }, o || {});
    const pay = (book.schedules || []).find(s => live(s) && s.kind === 'income' && s.startsPeriod && !s.ends);
    const rule = pay && ruleNow(pay, today);
    if (!pay || !rule || rule.every === 'none') return { items: [], repeat: { afterPay: null, mid: null }, why: 'There is no pay day set, so there are no pay periods to remind you in. Set your pay day in Plan first' };
    const t = D.dayNum(today), end = endOf(today, o.months);
    const lands = [...new Set(S.occurrences(pay, calOf(book, pay), t - 70, end + 70).map(x => x.land))].sort((a, b) => a - b);
    const items = [];
    lands.forEach((l, i) => {
      if (o.afterPay) items.push({ n: l + 1, kind: 'afterPay' });
      const next = lands[i + 1];
      if (o.mid && next != null) items.push({ n: l + Math.floor((next - l) / 2), kind: 'mid' });
    });
    const out = items.filter(x => x.n >= t && x.n <= end).sort((a, b) => a.n - b.n).map(x => ({ day: D.dayStr(x.n), kind: x.kind }));
    const first = k => (out.find(x => x.kind === k) || {}).day;
    return { items: out, repeat: { afterPay: o.afterPay ? repeatOf(rule, first('afterPay')) : null, mid: o.mid ? repeatOf(rule, first('mid')) : null }, why: '' };
  }

  function bills(book, today, o) {
    o = Object.assign({ before: 2, months: 12 }, o || {});
    const t = D.dayNum(today), end = endOf(today, o.months), before = Math.max(0, Math.min(14, o.before | 0));
    return (book.schedules || []).filter(s => live(s) && s.kind === 'bill' && (!o.only || o.only.includes(s.id))).map(s => {
      const rule = ruleNow(s, today);
      const items = S.occurrences(s, calOf(book, s), t, end + 31).map(x => ({ n: x.land - before, lands: D.dayStr(x.land) }))
        .filter(x => x.n >= t && x.n <= end).map(x => ({ day: D.dayStr(x.n), lands: x.lands }));
      let repeat = null;
      if (rule && rule.every === 'month' && (rule.days || [rule.day]).length === 1 && typeof (rule.days || [rule.day])[0] === 'number') {
        const d = (rule.days || [rule.day])[0] - before;
        repeat = d >= 1 && d <= 28 ? 'FREQ=MONTHLY;BYMONTHDAY=' + d : null;
      }
      return { id: s.id, name: s.name, kind: 'bill', items, repeat };
    }).filter(x => x.items.length);
  }

  const label = day => +day.slice(8, 10) + ' ' + MON[+day.slice(5, 7) - 1];
  const WORDS = {
    afterPay: { title: 'Check your bank: pay day has passed', details: 'Open the burrow and tap Check your bank. Tick what has gone out and type what your bank app shows today.' },
    mid: { title: 'Check your bank: middle of the pay period', details: 'Open the burrow and tap Check your bank. Tick what has gone out and type what your bank app shows today.' }
  };
  function events(o) {
    const time = o.time || '09:00', out = [];
    const c = o.checkins || { items: [], repeat: {} };
    for (const x of c.items) out.push({ uid: 'burrow-' + x.kind + '-' + x.day, kind: x.kind, day: x.day, time, title: WORDS[x.kind].title, details: WORDS[x.kind].details, rrule: (c.repeat || {})[x.kind] || null });
    (o.bills || []).forEach((b, i) => {
      for (const x of b.items) out.push({ uid: 'burrow-bill-' + i + '-' + x.day, kind: 'bill', day: x.day, time, title: b.name + ' is due on ' + label(x.lands),
        details: b.name + ' leaves the bank on ' + label(x.lands) + '. Open the burrow to see what is due before next pay.', rrule: b.repeat });
    });
    return out.sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0));
  }

  /* ---- the old app's helpers, on day strings ---- */
  function clockParts(time) { const m = /^(\d{1,2}):(\d{2})$/.exec(time || ''); return m ? { h: Math.min(23, +m[1]), mi: Math.min(59, +m[2]) } : { h: 9, mi: 0 }; }
  function times(e) {
    const c = clockParts(e.time), start = c.h * 60 + c.mi, end = Math.min(start + 30, 24 * 60 - 1), d = e.day.replace(/-/g, '');
    const stamp = mins => d + 'T' + pad2(Math.floor(mins / 60)) + pad2(mins % 60) + '00';
    return { start: stamp(start), end: stamp(end) };
  }
  const enc = encodeURIComponent;
  function gcal(e) {
    const t = times(e);
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + enc(e.title) + '&details=' + enc(e.details) + '&dates=' + t.start + '/' + t.end + (e.rrule ? '&recur=' + enc('RRULE:' + e.rrule) : '');
  }
  function outlook(e) {
    const t = times(e), iso = s => s.slice(0, 4) + '-' + s.slice(4, 6) + '-' + s.slice(6, 8) + 'T' + s.slice(9, 11) + ':' + s.slice(11, 13) + ':' + s.slice(13, 15);
    return 'https://outlook.live.com/calendar/0/deeplink/compose?path=' + enc('/calendar/action/compose') + '&rru=addevent&subject=' + enc(e.title) + '&body=' + enc(e.details) + '&startdt=' + iso(t.start) + '&enddt=' + iso(t.end);
  }
  const icsEsc = s => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  const bytes = ch => unescape(encodeURIComponent(ch)).length;
  /* a calendar line may be at most 75 bytes, so long lines wrap by bytes, never in the middle of a character */
  const fold = l => { let out = '', n = 0; for (const ch of l) { const b = bytes(ch); if (n + b > 72) { out += '\r\n '; n = 1; } out += ch; n += b; } return out; };
  function ics(list, o) {
    const now = new Date((o && o.now) || Date.now());
    const z = now.getUTCFullYear() + pad2(now.getUTCMonth() + 1) + pad2(now.getUTCDate()) + 'T' + pad2(now.getUTCHours()) + pad2(now.getUTCMinutes()) + pad2(now.getUTCSeconds()) + 'Z';
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//The Burrow//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
    for (const e of list) {
      const t = times(e);
      lines.push('BEGIN:VEVENT', 'UID:' + e.uid + '@burrow', 'DTSTAMP:' + z, 'DTSTART:' + t.start, 'DTEND:' + t.end, 'SUMMARY:' + icsEsc(e.title), 'DESCRIPTION:' + icsEsc(e.details),
        'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc(e.title), 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT');
    }
    lines.push('END:VCALENDAR');
    return lines.map(fold).join('\r\n') + '\r\n';
  }

  const api = { checkins, bills, events, ics, gcal, outlook, times };
  if (node) module.exports = api;
  else root.REMIND3 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
