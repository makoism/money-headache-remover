/* The one name table (DECISIONS_ROUND2 C, sweep2_repeats A8, LESSONS lesson 2). Each label is tied to the engine figure
   it names (a path in the engine result, SCHEMA_V3 section 12; `*` stands for an account, card, loan or place id), so one
   figure has one name and one name one figure. A screen never writes a label for a money figure itself: it asks here.

   state:  'decided'  a written decision names it (source says which)
           'in use'   the app's wording today, no clash found, kept until Mako's copy pass says otherwise
           'for Mako' an open choice for his copy pass; `choices` lists the options, the label is the one in use until then
   engine: false when the engine result has no such field yet (the screens need it before wiring)

   Plain browser JavaScript, no dependencies. In a page it is BurrowScreens.names; in node, require('./names.js'). */
(function (root, make) {
  const m = make();
  if (typeof module === 'object' && module.exports) module.exports = m;
  else (root.BurrowScreens = root.BurrowScreens || {}).names = m;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const NAMES = {
    bankToday: {
      label: 'Bank today', figures: ['accounts.*.bank'], state: 'for Mako', choices: ['Bank today', 'In your bank'],
      source: 'MAKO_RUN 2.1; the check itself is decided: one dated question, what does your bank show today (LESSONS lesson 1, sweep2_repeats C)',
      note: 'shown with its day, see bankAsOf',
    },
    bankAsOf: {
      label: 'Checked on', figures: ['accounts.*.asOf'], state: 'for Mako', choices: ['Checked on', 'As of', 'Typed on'],
      source: 'DECISIONS_ROUND2 A1, F24 (each figure carries its day, its age shown)',
    },
    bankAfterCards: {
      label: 'After your cards are paid', figures: ['bankAfterCards.*.amount'], state: 'decided',
      source: 'DECISIONS_ROUND2 F10 (Mako, A5), BB2, BK1, BK3; NORTH_STAR; DECISIONS.md 169',
      note: 'per bank and dated: "After your cards are paid on 10 and 11 Dec: Main bank", the engine walk to the last card payment on or before the first counted pay after the earliest unpaid one (res.bankAfterCards, BK3, BK5). Shown once, in the cards box, with its day and the pays in it, so it is never read as safe to spend. The undated total.afterCards is not shown (BB2)',
    },
    safeToSpend: {
      label: 'Safe to spend', figures: ['safeToSpend.headline'], state: 'decided',
      source: 'DECISIONS_ROUND2 B and F9 (one headline); MAKO_RUN 1.2 choice C',
      note: 'whether it reads "Safe to spend today" is for Mako',
    },
    safeFromAccount: {
      label: 'Safe to spend from this account', figures: ['accounts.*.headroom'], state: 'for Mako',
      choices: ['Safe to spend from this account', 'Room in this account'],
      source: 'DECISIONS_ROUND2 F9 (each account walked and warned on its own)',
    },
    shortBy: {
      label: 'Short by', figures: ['safeToSpend.short'], state: 'for Mako', choices: ['Short by', 'Under your minimum by'],
      source: 'MAKO_RUN 2.2 (one word for short)',
    },
    freeToSpendLeft: {
      label: 'Free to spend left', figures: ['period.free.left'], state: 'for Mako',
      choices: ['Free to spend left', 'Left to spend'],
      source: 'COPY_QC8_FOR_MAKO one word per thing (four names today); MAKO_RUN 2.5',
      note: 'the engine returns it as res.period.free.left (the cap on safe to spend)',
    },
    notPlacedYet: {
      label: 'Not placed yet', figures: ['toPlace.*.amount'], state: 'decided',
      source: 'QC_ROLES shared glossary ("say not placed yet"); MAKO_RUN 2.6 asks only to confirm',
    },
    setAside: {
      label: 'Set aside', figures: ['places.*.kept'], state: 'for Mako', choices: ['Set aside', 'Saved'],
      source: 'MAKO_RUN 2.4 ("Saved" names two figures today); DECISIONS.md new foundation 3 ("Kept in my bank, set aside")',
    },
    placeDue: {
      label: 'Next due', figures: ['places.*.due'], state: 'for Mako', choices: ['Next due', 'Needed by'],
      source: 'SCHEMA_V3 section 12 (each place\'s money and when it is next due)',
    },
    owed: {
      label: 'Still owed', figures: ['cards.*.owedNow', 'owed.*.owedNow'], state: 'decided',
      source: 'QC_ROLES shared glossary (paid off, still owed); DECISIONS_ROUND2 F18, F19',
    },
    inCredit: {
      label: 'In credit', figures: ['cards.*.credit'], state: 'decided',
      source: 'DECISIONS_ROUND2 BL5 (a card paid more than it owed shows "in credit ¥1,500", never as owed)',
    },
    nextPayment: {
      label: 'Next payment', figures: ['cards.*.next.amount', 'owed.*.next.amount'], state: 'for Mako',
      choices: ['Next payment', 'To pay next'], source: 'SCHEMA_V3 section 12 (each card\'s and loan\'s next payment)',
    },
    total: {
      label: 'Total', figures: ['total.amount'], state: 'decided', source: 'QC_ROLES shared glossary; VOICE D2',
    },
    totalBeside: {
      label: 'Also held', figures: ['total.beside'], state: 'for Mako', choices: ['Also held', 'In other currencies'],
      source: 'DECISIONS_ROUND2 F11 (other currencies beside Total, never converted)',
    },
    dueBeforeNextPay: {
      label: 'Due before next pay', when: { noFixedPay: 'Due in the next 30 days', payToday: 'Due before the pay after today\'s' }, figures: ['dueBeforeNextPay.total'], state: 'decided',
      source: 'DECISIONS_ROUND2 F7, F13, F21; payToday: qc-numbers confirming run 2 (B5), on a pay day the list runs to the pay after it (G4)',
    },
    notSeenYet: {
      label: 'Not seen yet', figures: ['notSeenYet.items'], state: 'decided', source: 'DECISIONS_ROUND2 F3, F4',
    },
    mayStillPost: {
      label: 'May still go through', figures: ['mayStillPost'], state: 'for Mako', choices: ['May still go through', 'Still on its way'],
      source: 'DECISIONS_ROUND2 F4, Z2 (inside the posting window)',
    },
    nextPay: {
      label: 'Next pay', figures: ['daysToNextPay.next_pay'], state: 'in use', source: 'DECISIONS_ROUND2 F3, F8; the app\'s pay wording',
    },
    lowest: {
      label: 'Lowest point', figures: ['accounts.*.lowest'], state: 'for Mako', choices: ['Lowest point', 'Lowest before pay'],
      source: 'sweep2_repeats A8 (a figure the new engine adds)',
    },
    minimum: {
      label: 'Keep at least', figures: ['accounts.*.minimum'], state: 'decided', source: 'DECISIONS.md new foundation 5 (Mako, 23 Nov)',
    },
    laterOn: {
      label: 'Later on', figures: ['laterOn'], state: 'decided', source: 'DECISIONS_ROUND2 B11 ("Later on: Jul 2027 ends below zero")',
    },
    lastsAbout: {
      label: 'Lasts about', figures: ['lastsAboutWeeks'], state: 'decided', source: 'DECISIONS_ROUND2 B4 ("lasts about N weeks")',
    },
    oldestInput: {
      label: 'Oldest figure from', figures: ['safeToSpend.oldestInput'], state: 'for Mako', choices: ['Oldest figure from', 'Based on figures from'],
      source: 'DECISIONS_ROUND2 A1 (safe to spend reports its oldest input)',
    },
    checkInList: {
      label: 'To tick off', figures: ['checkIn.toConfirm'], state: 'for Mako', choices: ['To tick off', 'Since your last check'],
      source: 'DECISIONS_ROUND2 A2 (expected items since the last check-in, ticked by default)',
    },
    period: {
      label: 'This pay period', figures: ['period.start', 'period.end'], state: 'for Mako',
      choices: ['This pay period', 'This period', 'Until next pay'],
      source: 'LESSONS lesson 1 (periods run pay to pay); QC_ROLES glossary "This month" no longer fits a pay period',
      note: 'written with periodLabel, "10 Nov to 9 Dec", from res.period',
    },
  };

  function label(key, ctx) {
    const n = NAMES[key];
    if (!n) throw new Error('names: "' + key + '" is not in the name table (screens/names.js); add it there, never on a screen');
    if (ctx && n.when) for (const k of Object.keys(n.when)) if (ctx[k]) return n.when[k];
    return n.label;
  }
  function byFigure(figure) {
    for (const k of Object.keys(NAMES)) if (NAMES[k].figures.includes(figure)) return k;
    return null;
  }
  function labelKey(text) {
    const low = String(text).toLowerCase();
    for (const k of Object.keys(NAMES)) if ([NAMES[k].label].concat(Object.values(NAMES[k].when || {})).some(l => l.toLowerCase() === low)) return k;
    return null;
  }
  /* check([{ label, figure }]): what a screen shows, label beside figure. Returns one line per mismatch, none when right. */
  function check(shown) {
    const out = [];
    for (const s of shown) {
      const k = labelKey(s.label);
      if (!k) { out.push('"' + s.label + '" is not in the name table'); continue; }
      if (!NAMES[k].figures.includes(s.figure)) out.push('"' + s.label + '" names ' + NAMES[k].figures.join(' and ') + ', not ' + s.figure);
    }
    return out;
  }
  const forMako = () => Object.keys(NAMES).filter(k => NAMES[k].state === 'for Mako')
    .map(k => ({ key: k, label: NAMES[k].label, choices: NAMES[k].choices, source: NAMES[k].source, note: NAMES[k].note }));
  const notInEngine = () => Object.keys(NAMES).filter(k => NAMES[k].engine === false);

  /* days, as VOICE says: day then short month, "10 Nov" */
  const MONTHS = { '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec' };
  function parseDay(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(typeof s === 'string' ? s : '');
    const d = m && new Date(m[0] + 'T00:00:00Z');
    if (!m || !MONTHS[m[2]] || isNaN(d) || d.toISOString().slice(0, 10) !== m[0]) throw new Error('names: a day must be a real YYYY-MM-DD, got ' + JSON.stringify(s));
    return { y: m[1], m: m[2], d: m[3].replace(/^0/, ''), s: m[0] };
  }
  function dayLabel(s, withYear) { const p = parseDay(s); return [p.d, MONTHS[p.m]].concat(withYear ? [p.y] : []).join(' '); }
  /* [qc-controls 2to5 F2] the day a pay or bill lands, in one set of words for every screen and the assistant: its
     landing day, and when a weekend or holiday moved it off its due day, why: "25 Dec (26 Dec is a Saturday, so the
     working day before)". Without the reason a row reading "day 26 each month, next 25 Dec" looks like the change did
     not take effect. The engine's occurrence gives both days (land, due); nothing is worked out here but the weekday. */
  const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  function landLabel(land, due, withYear) {
    const at = dayLabel(land, withYear);
    if (!due || due === land) return at;
    const wd = new Date(parseDay(due).s + 'T00:00:00Z').getUTCDay();
    return `${at} (${dayLabel(due, withYear)} is ${wd === 0 || wd === 6 ? 'a ' + WEEKDAY[wd] : 'a holiday'}, so the working day ${land < due ? 'before' : 'after'})`;
  }
  /* a month as VOICE says: "Feb 2027" (from a real day in it) */
  function monthLabel(s) { const p = parseDay(s); return MONTHS[p.m] + ' ' + p.y; }
  /* "10 Nov to 9 Dec"; across the new year both days carry their year (for Mako: whether the year shows otherwise) */
  function periodLabel(start, end) {
    const a = parseDay(start), b = parseDay(end);
    if (b.s < a.s) throw new Error('names: the period ends before it starts: ' + start + ' to ' + end);
    const years = a.y !== b.y;
    return dayLabel(start, years) + ' to ' + dayLabel(end, years);
  }

  /* several days in one phrase: "10 and 11 Dec", "8, 10 and 12 Jan", "11 Dec, 8 Jan and 12 Jan" (the month once when
     every day shares it) */
  function dayList(days, withYear) {
    const ps = days.map(parseDay), one = ps.every(p => p.m === ps[0].m && p.y === ps[0].y);
    const words = ps.map(p => (one ? p.d : dayLabel(p.s, withYear))), last = words.pop();
    if (last === undefined) return '';
    const tail = one ? dayLabel(ps.slice(-1)[0].s, withYear) : last;
    return words.length ? words.join(', ') + ' and ' + tail : tail;
  }

  return { NAMES, label, byFigure, labelKey, check, forMako, notInEngine, dayLabel, landLabel, dayList, monthLabel, periodLabel };
});
