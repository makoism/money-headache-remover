// The Burrow's clock for the new store (SCHEMA_V3 section 0; DECISIONS_ROUND2 D4, D8, AH1, AI1, M4, N1, N2).
// Plain browser JavaScript, no dependencies. Sets window.BurrowClock (and module.exports under Node).
//
// - A time is ISO with its offset (2026-11-23T10:00:00.000+09:00) and is compared as a moment, never as text.
// - A device's own write uses its own clock [AH1]: `at` = the later of now and (the newest `at` it has seen + 1 ms).
//   A long gap since the last write is normal and never held.
// - A copy that arrives with an `at` or `told` more than a day ahead of this device's own now is held at that now
//   plus 1 ms, with a `held: { came, at }` mark [M4, N1, N2, AI1]. Same result as rules/merge_ref.js holdArriving.
// - D8: dates are whole day numbers; one day back from the last open is allowed; more than one day back or more
//   than 40 days ahead asks before anything is written; "today" is worked out again when the page comes back into
//   view and at local midnight.
(function (root) {
  'use strict';
  const DAY = 86400000;
  const ms = t => Date.parse(t);

  // ---------- writing a time ----------
  function offsetOf(t) { const m = /([+-])(\d\d):(\d\d)$/.exec(t); return m ? (m[1] === '-' ? -1 : 1) * (+m[2] * 60 + +m[3]) : 0; }
  const pad = (n, w) => String(n).padStart(w || 2, '0');
  // A moment written in the given offset (minutes east of UTC).
  function write(msValue, offsetMin) {
    const d = new Date(msValue + offsetMin * 60000), o = Math.abs(offsetMin);
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + ':' +
      pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + '.' + pad(d.getUTCMilliseconds(), 3) +
      (offsetMin < 0 ? '-' : '+') + pad(Math.floor(o / 60)) + ':' + pad(o % 60);
  }
  // Now, in this device's own offset (daylight saving and a flight change it; every time carries its own).
  function nowIso(d) { d = d || new Date(); return write(d.getTime(), -d.getTimezoneOffset()); }

  // ---------- days [D8] ----------
  // Whole day numbers: never `new Date('<date>')` (read as UTC) and never toISOString() of now (yesterday in Japan
  // before 9:00).
  function dayNum(s) { const p = String(s).slice(0, 10).split('-').map(Number); return Math.round(Date.UTC(p[0], p[1] - 1, p[2]) / DAY); }
  function dayStr(n) { const d = new Date(n * DAY); return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); }
  const addDays = (s, n) => dayStr(dayNum(s) + n);
  const daysBetween = (a, b) => dayNum(b) - dayNum(a);
  // The person's calendar day on this device now.
  function todayStr(d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  // [D8] 'back' for a date more than one day before the last open, 'ahead' for more than 40 days after it.
  function clockAsk(today, lastDay) {
    if (!lastDay) return null;
    const d = dayNum(today) - dayNum(lastDay);
    return d < -1 ? 'back' : d > 40 ? 'ahead' : null;
  }
  // On opening (and on coming back into view): is there a question about the date, and what is the device's
  // `clock.lastSeen` afterwards. Nothing may be written while `ask` is set; once the person confirms the date,
  // call again with { confirmed: true }. One day back keeps the later day as the last open.
  function openDay(device, today, opts) {
    const last = device && device.clock ? device.clock.lastSeen : device && device.lastSeen;
    const ask = opts && opts.confirmed ? null : clockAsk(today, last);
    if (ask) return { ask, lastSeen: last };
    return { ask: null, lastSeen: !last || opts && opts.confirmed || dayNum(today) > dayNum(last) ? today : last };
  }

  // ---------- the hybrid clock [D4, AH1] ----------
  function nextAtWarn(now, lastSeen, lastDay) {
    return { at: write(Math.max(ms(now), lastSeen ? ms(lastSeen) + 1 : -Infinity), offsetOf(now)),
      warn: clockAsk(String(now).slice(0, 10), lastDay) !== null };
  }
  const nextAt = (now, lastSeen) => nextAtWarn(now, lastSeen).at;
  // The newest `at` anywhere in what was read, at any depth, compared as moments [AL2]. A held mark's `came` is not
  // an `at`, so a fast clock's time is never seen.
  function newestAt(copy) {
    let best = null, bestMs = -Infinity;
    (function walk(x) {
      if (Array.isArray(x)) { for (let i = 0; i < x.length; i++) walk(x[i]); return; }
      if (x && typeof x === 'object') {
        if (typeof x.at === 'string') { const m = ms(x.at); if (m > bestMs) { bestMs = m; best = x.at; } }
        for (const k in x) if (Object.prototype.hasOwnProperty.call(x, k)) walk(x[k]);
      }
    })(copy);
    return best;
  }
  // One clock per page: stamp() gives the `at` (and `told`) of the next own write; see(x) takes in what was read.
  function makeClock(opts) {
    let seen = opts && opts.lastSeen || null;
    const later = t => { if (t && (!seen || ms(t) > ms(seen))) seen = t; };
    return {
      stamp(now) { const at = nextAt(now || nowIso(), seen); seen = at; return at; },
      see(x) { later(typeof x === 'string' ? x : newestAt(x)); },
      seen: () => seen,
    };
  }

  // ---------- holding a copy that arrives far ahead [M4, N1, N2, AI1] ----------
  const sameMoment = (a, b) => typeof a === 'string' && typeof b === 'string' && ms(a) === ms(b);
  // `mine` is this device's copy (its held marks are reused, so a copy held once is not held again); `now` is this
  // device's own now. Returns { copy, warn }; the input is not changed.
  function holdArriving(copy, mine, now) {
    if (!now) throw new Error('a copy that arrives is judged against the receiving device\'s own now [AH1]');
    let warn = false;
    const held = JSON.parse(JSON.stringify(copy || {}));
    const ahead = t => typeof t === 'string' && ms(t) > ms(now) + DAY;
    const cap = () => { warn = true; return write(ms(now) + 1, offsetOf(now)); };
    const holdAt = (x, mark) => {
      if (mark && sameMoment(x.at, mark.came)) { x.at = mark.at; x.held = mark; }
      else if (ahead(x.at)) { const came = x.at; x.at = cap(); x.held = { came, at: x.at }; }
      if (ahead(x.told)) x.told = cap();
    };
    const twin = (list, v) => (Array.isArray(list) && v && typeof v === 'object'
      ? list.find(m => m && ((v.id !== undefined && m.id === v.id) || (v.id === undefined && v.from !== undefined && m.from === v.from))) : undefined);
    (function walk(x, m) {
      if (Array.isArray(x)) return x.forEach(v => walk(v, twin(m, v)));
      if (!x || typeof x !== 'object') return;
      m = m && typeof m === 'object' ? m : undefined;
      if (typeof x.at === 'string') holdAt(x, m && m.held);
      for (const k of Object.keys(x)) if (k !== 'at' && k !== 'held') walk(x[k], m && m[k]);
    })(held, mine);
    return { copy: held, warn };
  }

  // ---------- "today", worked out again [D8] ----------
  // Calls onChange(newDay, oldDay) when the local day changes: at local midnight while the page is open, and when
  // the page comes back into view (visibilitychange, focus, pageshow), since timers do not run in the background.
  function watchToday(onChange, opts) {
    const win = opts && opts.win || root;
    let day = todayStr(), timer = null, stopped = false;
    const check = () => {
      if (stopped) return;
      const d = todayStr();
      if (d !== day) { const old = day; day = d; try { onChange(d, old); } catch (e) { /* the caller's problem */ } }
      arm();
    };
    const arm = () => {
      clearTimeout(timer);
      const n = new Date(), next = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1, 0, 0, 1);
      timer = setTimeout(check, Math.max(1000, next - n));
    };
    const onVis = () => { if (!win.document || win.document.visibilityState !== 'hidden') check(); };
    win.document && win.document.addEventListener('visibilitychange', onVis);
    win.addEventListener('focus', check);
    win.addEventListener('pageshow', check);
    arm();
    return {
      today: () => day,
      check,
      stop() { stopped = true; clearTimeout(timer); win.document && win.document.removeEventListener('visibilitychange', onVis); win.removeEventListener('focus', check); win.removeEventListener('pageshow', check); },
    };
  }

  // A short mark of a set of change stamps (app3/src/act3.js `ver`: "has anything in the book changed since I looked").
  // Order-free: the stamps are sorted first. Not money: a plain text hash, with the count in front.
  function markOf(stamps) {
    const t = stamps.slice().sort().join('\n');
    let h = 0;
    for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0;
    return stamps.length + '.' + h.toString(36);
  }
  const api = { markOf, DAY, ms, offsetOf, write, nowIso, dayNum, dayStr, addDays, daysBetween, todayStr, clockAsk, openDay,
    nextAt, nextAtWarn, newestAt, makeClock, holdArriving, watchToday };
  root.BurrowClock = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
