/* The Burrow engine: ids (SCHEMA_V3 section 0; decisions O2, O3, X1, X2, Q5, Q7, S3, T1, Y28, AJ1, AL7).
   One reader of occurrence names and built ids for the whole engine, so ordinary, moved and short made-up ids are
   read alike and a schedule id is read whole up to `@` (`...-4@` never counts for `...-41@`) [AJ1].
   Plain browser JavaScript, no dependencies. */
(function (root) {
  'use strict';
  // [O3] Everything a person types: `<device part>-<session part>-<counter>`, lowercase letters and digits [AL7].
  const ORDINARY = '[a-z0-9]{6}-[a-z0-9]{10}-[1-9]\\d*';
  // [X1, Y28] A record the move wrote: `mv:<kind>:<38.31 id, key or field path>`.
  const MOVED = 'mv:[a-z]+:[A-Za-z0-9_.:-]+';
  const REF = '(?:' + ORDINARY + '|' + MOVED + '|[a-z0-9_]+)';
  const DATE = '\\d{4}-\\d{2}-\\d{2}';
  const OCC_AT_START = new RegExp('^(' + REF + ')@(' + DATE + ')(?=$|:)');
  const ORDINARY_RE = new RegExp('^' + ORDINARY + '$');

  // `<schedule>@<due>` at the start of a name: { schedule, due } or null.
  function occurrence(name) {
    const m = String(name).match(OCC_AT_START);
    return m ? { schedule: m[1], due: m[2] } : null;
  }
  const scheduleOf = name => { const o = occurrence(name); return o ? o.schedule : null; };
  const occName = (schedule, due) => schedule + '@' + due;
  // The occurrence a period-end answer (`pe:<occ>:<place>`) or a period start (`ps:<occ>`) is for.
  function periodOcc(id) {
    const m = /^(?:pe|ps):(.*)$/.exec(String(id));
    if (!m) return null;
    const o = occurrence(m[1]);
    return o ? occName(o.schedule, o.due) : null;
  }

  // [O2] Ids built from what a record is, so two devices writing the same moment make one record.
  const built = {
    set: occ => 'set:' + occ,                  // a settle ticked at a check-in
    auto: occ => 'auto:' + occ,                // a spend a schedule logs by itself
    skip: occ => 'skip:' + occ,                // a self-logged spend removed [Q5]
    pe: (occ, place) => 'pe:' + occ + ':' + place,   // a period-end answer, one per place [P2, T1]
    ps: occ => 'ps:' + occ,                    // a period started without the pay [N5, T1]
    rm: place => 'rm:' + place,                // the move to Waiting when a place with money is removed [Q7]
    close: (acct, n) => 'close:' + acct + (n ? ':' + n : ''),   // a closing's records [Q7, S3]
    fee: transferId => 'fee:' + transferId,    // a transfer's fee record [X2]
  };

  const isOrdinary = id => ORDINARY_RE.test(String(id));
  // [O3] An id maker for one page open: the device part is kept by the device, the session part (10 lowercase letters
  // and digits) is drawn on every open, the counter starts at 1. `rand` is the random source (Math.random by default).
  function idMaker(devicePart, rand) {
    const r = rand || Math.random, abc = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let session = '';
    for (let i = 0; i < 10; i++) session += abc[Math.floor(r() * abc.length) % abc.length];
    let n = 0;
    return () => devicePart + '-' + session + '-' + (++n);
  }

  const api = { ORDINARY, MOVED, REF, DATE, occurrence, scheduleOf, occName, periodOcc, built, isOrdinary, idMaker };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.BurrowEngine = root.BurrowEngine || {}).ids = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
