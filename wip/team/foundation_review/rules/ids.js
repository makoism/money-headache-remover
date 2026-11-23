// The one reader of ids for every reference (SCHEMA_V3 section 0; DECISIONS_ROUND2 O2, O3, X1, Y28, AH2, AJ1).
// Before AJ1 the merge, X8 and the look ahead each had their own pattern for the schedule, place or account a built id
// names, and none took the ordinary ids the app really makes (confirm_review_5 h1). LESSONS lesson 2: one shared piece.
'use strict';

// [O3] Everything a person types: `<device part>-<session part>-<counter>`, the device part 6 letters and digits,
// the session part 10, the counter from 1 (`k7qzpa-m2xq7ab9zt-41`).
const ORDINARY = '[a-z0-9]{6}-[a-z0-9]{10}-[1-9]\\d*';
// [X1, Y28] A record the move wrote: `mv:<kind>:<38.31 id, key or field path>`.
const MOVED = 'mv:[a-z]+:[A-Za-z0-9_.:-]+';
// [AJ1] The schedule, place or account a built id names: an ordinary id, a moved one, or a short made-up id (the
// rules files' own, kept readable; the realistic-ids check runs every case again with ordinary ids).
const REF = '(?:' + ORDINARY + '|' + MOVED + '|[a-z0-9_]+)';
const DATE = '\\d{4}-\\d{2}-\\d{2}';
const OCC = REF + '@' + DATE;   // an occurrence, `<schedule>@<due>`
// [AP3] An import line is named by what it is: `imp:<account>:<line id>`, the line id being the statement's own reference
// (`ref:<reference>`, every character but letters, digits and `-._~` written as %XX) when it has one, else
// `<date>:<amount>:<in|out>:<n>`, n counting the lines of that statement with the same date, amount and direction.
// So the same statement read on two devices makes the same ids, and the sync joins them into one record [AQ2].
const IMPORTED = 'imp:' + REF + ':(?:ref:[A-Za-z0-9%._~-]+|' + DATE + ':\\d+:(?:in|out):[1-9]\\d*)';
// [AQ3] The version not picked when one record was changed on two devices: `kept:<record id or field path>`.
const KEPT = 'kept:[^\\s].*';

// An occurrence at the start of a name (`<schedule>@<due>`, or the rest of a `pe:` id after it): [schedule, due] or null.
// The schedule is read whole, up to `@`, never by its start: `...-4@` is not `...-41@`.
const OCC_AT_START = new RegExp('^(' + REF + ')@(' + DATE + ')(?=$|:)');
function occurrence(name) {
  const m = String(name).match(OCC_AT_START);
  return m ? { schedule: m[1], due: m[2] } : null;
}

module.exports = { ORDINARY, MOVED, REF, DATE, OCC, IMPORTED, KEPT, occurrence };
