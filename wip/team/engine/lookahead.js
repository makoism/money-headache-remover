/* The Burrow engine: the look ahead (SCHEMA_V3 sections 3 to 9 and 12; DECISIONS_ROUND2, later sections win).
   lookahead(book, asOf, opts) reads one saved copy (shape version 3) and an "as of" day and returns every figure Home
   needs: bank today per account with its age, the fillers of each check, safe to spend (per account, the headline,
   the sum a person can check), warnings and "later on", days to next pay, due before next pay, not seen yet and may
   still post, each card's and loan's next payment and what is owed now, each place's money, the total, and the
   check-in list.
     opts.at            'end of day' (default) or 'start of day'
     opts.calendars     { <country>: { holidays: [dates], bankClosed: [dates] } } replacing the built-in tables
     opts.deviceOffset  the device's offset ('+09:00'), for a time saved with no offset of its own [X9]
     opts.mostlyBeforePay  the person's answer to the filler question [A4]
   The result's names are those of SCHEMA_V3 section 12. Every amount is in whole minor units, every date a whole day
   number inside (D8). A copy the rules forbid (a closed account still holding money [P6], a schedule change that no
   longer makes a settled or named occurrence [X8]) is refused with an error that names the decision.
   Plain browser JavaScript; uses dates.js, units.js, ids.js, schedules.js and ledger.js. */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && module.exports;
  const E = node ? null : root.BurrowEngine;
  const D = node ? require('./dates.js') : E.dates;
  const U = node ? require('./units.js') : E.units;
  const I = node ? require('./ids.js') : E.ids;
  const S = node ? require('./schedules.js') : E.schedules;
  const L = node ? require('./ledger.js') : E.ledger;
  const { dayNum, dayStr, ymOf, dayIn, moment, dayEnd, offsetOf } = D;
  const { fmt, interestOn } = U;

  const HORIZON_MIN_DAYS = 45;      // the walk reaches at least 45 days [SCHEMA 10.3]
  const LATER_ON_DAYS = 365;        // "later on" looks 12 months ahead [B11]
  const NO_PAY_DUE_DAYS = 30;       // with no fixed pay, "due" means the next 30 days [F13]
  const POSTING_DAYS = 1;           // an account's posting window in working days [F4]
  const CARD_POSTING_DAYS = 7;      // a card's [L matching q4, M1]
  const EARLY_SETTLE = 5;           // an import may settle an item up to 5 working days early [L matching q2]
  const SPEND_TYPES = { bank: 1, cash: 1, ewallet: 1, wallet: 1 };   // spendFrom by default [SCHEMA 3]
  const OWED_TYPES = { card: 1, loan: 1, paylater: 1 };              // they own their payment day [B5, E6]
  const TWO_SIDED = { transfer: 1, repay: 1, borrow: 1, convert: 1 }; // [Q1]
  const IMPORT_TYPES = { statement: 1, screenshot: 1 };
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const short = n => { const s = dayStr(n); return (+s.slice(8, 10)) + ' ' + MONTHS[+s.slice(5, 7) - 1]; };
  // [H9, L matching q10] within 10% of the larger, compared exactly in minor units
  const withinTenth = (a, b) => Math.abs(a - b) * 10 <= Math.max(a, b);
  const fv = L.fieldValue;
  const occStr = o => (typeof o === 'string' ? o : o.s + '@' + o.due);
  const occList = v => [].concat(v || []).map(occStr);

  function lookahead(book, asOf, opts) {
    opts = opts || {};
    const at = opts.at || 'end of day';
    const today = dayNum(asOf);
    const knownTo = at === 'start of day' ? today - 1 : today;   // what the app has heard of by then
    const zone = opts.deviceOffset || null;
    const keyOf = t => moment(t, zone);
    const keyCmp = (a, b) => a - b;
    const home = L.homeOn(book, asOf);   // [O6] the home currency in force on the day
    const homeInfo = book.home || {};
    const homeCountry = fv(homeInfo.country) || null;
    const main = fv(homeInfo.main) || {};
    const mainAcct = main.acct || null;
    const res = { asOf, at, accounts: {}, cards: {}, owed: {}, places: {}, warnings: [], laterOn: [] };

    // ----- accounts -----
    const acct = {};
    for (const a of book.accounts || []) if (a && !a.gone) acct[a.id] = a;
    const cur = id => acct[id].cur;
    const isOwed = id => !!(acct[id] && OWED_TYPES[acct[id].type]);
    const cals = {};
    const calFor = country => (cals[country] = cals[country] || S.calendar(country, (opts.calendars || {})[country]));
    const calOf = id => calFor((acct[id] && acct[id].country) || homeCountry);   // [O] an account's own country
    const postingDays = id => (acct[id].postingDays != null ? acct[id].postingDays : acct[id].type === 'card' ? CARD_POSTING_DAYS : POSTING_DAYS);
    const lineAcct = l => l.acct || mainAcct;   // [O4] a line with no account is on the main bank
    const moneyAcct = id => (acct[id] && acct[id].type === 'card' ? acct[id].payFrom || mainAcct : id);   // a card's line: its paying account
    const payFromOf = id => acct[id].payFrom || mainAcct;
    // [AN3] the main bank's minimum lives in home.main; any other account's in its own minBank. [AS11, AV2] A main
    // minimum in another currency than the main bank's is never converted: no minimum is used and the person is asked.
    const mainMinOtherCur = () => !!(main.min && mainAcct && acct[mainAcct] && main.min.cur && main.min.cur !== cur(mainAcct));
    const minimumOf = id => (id === mainAcct ? (main.min && !mainMinOtherCur() ? main.min.a : 0) : acct[id].minBank ? acct[id].minBank.a : 0);

    // ----- the openings: one `open` and a `check` the same day, written together [B6, B7, H1] -----
    const all = (book.events || []).map((e, i) => ({ e, i }));
    const openEv = {}, openChecks = {};
    for (const { e, i } of all) if (e && !e.gone && e.k === 'open' && acct[e.acct] && !openEv[e.acct]) openEv[e.acct] = Object.assign({ idx: i }, e);
    const isOpeningCheck = e => { const o = openEv[e.acct]; return !!o && e.k === 'check' && e.date === o.date && e.grp != null && e.grp === o.grp; };
    for (const { e } of all) if (e && !e.gone && isOpeningCheck(e)) (openChecks[e.acct] = openChecks[e.acct] || []).push(e);
    const openDay = id => dayNum(openEv[id].date);
    const notYetOf = id => { const c = (openChecks[id] || []).find(x => !x.stmt); return (c && c.notYet) || []; };
    const isMovedSrc = e => !!(e.src && e.src.type === 'move');
    function openingOf(id) {
      const o = openEv[id];
      return { day: dayNum(o.date), key: keyOf(o.told || o.date + 'T24:00'), idx: -1, moved: isMovedSrc(o), opening: true, amount: o.a || 0 };
    }

    // ----- events the app knows of [H1, F24] -----
    // Each is copied and given: its day, its moment (`key`, from `told`), its place in the list (`idx`, which orders
    // records told at the same moment), and the accounts it names: `account` for a one-account record, `from` (the side
    // money leaves) and `to` (the side it reaches) for a two-sided one [Q1].
    const checkins = (book.checkins || []).filter(c => c && !c.gone);
    const ticked = new Set([].concat(...checkins.map(c => c.settled || [])));
    const unticked = new Set([].concat(...checkins.map(c => c.unticked || [])));
    const isImport = e => !!(e.src && IMPORT_TYPES[e.src.type]);
    const events = [];
    for (const { e, i } of all) {
      if (!e || e.k === 'open' || isOpeningCheck(e)) continue;
      const told = e.told || e.date;
      if (dayNum(told) > knownTo || dayNum(e.date) > knownTo) continue;
      const x = Object.assign({}, e, { day: dayNum(e.date), key: keyOf(told), idx: i, moved: isMovedSrc(e) });
      x.settles = occList(e.settles);
      if (TWO_SIDED[e.k]) { x.from = e.acct || null; x.to = e.acct2 || null; x.account = isImport(e) ? (e.src.acct || e.acct) : undefined; }
      else x.account = e.acct;
      if (e.src && e.src.bal != null) x.bal = e.src.bal;
      // [S2] the settle an imported line saved when read is worked out again, unless the person ticked it at a check-in
      if (isImport(e) && x.settles.length && !ticked.has(e.id)) { x.savedSettles = x.settles; x.settles = []; }
      if (unticked.has(e.id)) x.untick = true;   // [U2] unticked on the check-in list: it settles nothing
      events.push(x);
    }
    const dirOf = e => (e.k === 'spend' ? 'out' : e.k === 'in' ? 'in' : e.k);   // 6.4 matches by direction
    const reachOf = e => e.to;

    // [Q5] a self-logged spend of an occurrence that has a live skip does not count
    const sched = {};
    for (const s of book.schedules || []) if (s && !s.gone) sched[s.id] = s;
    const autoSched = id => !!(sched[id] && sched[id].kind === 'autoSpend');
    const skipped = new Set([].concat(...events.filter(e => e.k === 'skip' && !e.gone).map(e => e.settles)));
    for (const e of events) {
      const occ = e.settles.find(o => skipped.has(o) && autoSched(I.scheduleOf(o)));
      if (!e.gone && e.k === 'spend' && occ) { e.gone = true; e.goneBy = I.built.skip(occ); }
    }

    // [A6, H9, L matching q3 to q7, q10] An imported line replaces the typed line it matches (account, direction, amount
    // exactly or within 10% when rough, inside the posting window either side of the typed day; the closest day, then
    // the earliest `told`), takes over its settles and keeps its `told` [O1].
    const importDays = imp => {
      const d = [imp.posted ? dayNum(imp.posted) : imp.day];
      if (acct[imp.account] && acct[imp.account].type === 'card' && imp.day !== d[0]) d.push(imp.day);
      return d;
    };
    const gapIn = (imp, t, id) => {
      const w = postingDays(id), c = calOf(id);
      let best = null;
      for (const d of importDays(imp)) if (d >= c.subWorking(t.day, w) && d <= c.addWorking(t.day, w)) best = best === null ? Math.abs(d - t.day) : Math.min(best, Math.abs(d - t.day));
      return best;
    };
    for (const imp of events.filter(isImport)) {
      if (imp.gone || !acct[imp.account]) { if (!imp.gone) imp.unmatched = true; continue; }
      const hits = events.filter(t => !t.gone && !isImport(t) && t.account !== undefined && dirOf(t) === dirOf(imp) && t.account === imp.account
        && (t.est ? withinTenth(imp.a, t.a) : imp.a === t.a)).map(t => ({ t, gap: gapIn(imp, t, imp.account) })).filter(h => h.gap !== null)
        .sort((p, q) => p.gap - q.gap || keyCmp(p.t.key, q.t.key) || p.t.idx - q.t.idx);
      if (hits.length) {
        const hit = hits[0].t;
        hit.gone = true; hit.goneBy = imp.id;
        if (hit.settles.length && !imp.settles.length && !imp.untick) imp.settles = hit.settles;
        imp.key = hit.key; imp.idx = hit.idx; imp.momentGrp = hit.grp != null ? hit.grp : null;   // and its moment (sameMoment)
      } else imp.unmatched = true;
    }
    // [Q1, S1, U1] An imported line that met no typed line attaches to one side of a two-sided record: a money-out line on
    // the side money leaves (by `a`), a money-in line on the side it reaches (by `a2`), inside the posting window either
    // side of the record's day. It sets that side's posted date and is never counted again. A rough side takes the line's
    // amount; in one currency nothing arrives that did not leave.
    for (const imp of events.filter(e => isImport(e) && e.unmatched)) {
      const id = imp.account;
      if (!acct[id]) continue;
      const dir = TWO_SIDED[imp.k] ? (imp.from === id ? 'out' : 'in') : dirOf(imp);
      const fits = t => {
        if (t.gone || isImport(t) || !TWO_SIDED[t.k]) return null;
        const amt = a => (t.est ? withinTenth(imp.a, a) : imp.a === a);
        if (dir === 'out' && t.from === id && !t.attached1 && amt(t.a)) return 1;
        if (dir === 'in' && t.to === id && !t.attached2 && amt(t.a2)) return 2;
        return null;
      };
      const hits = [];
      for (const t of events) { const side = fits(t); if (!side) continue; const gap = gapIn(imp, t, id); if (gap !== null) hits.push({ t, side, gap }); }
      hits.sort((p, q) => p.gap - q.gap || keyCmp(p.t.key, q.t.key) || p.t.idx - q.t.idx);
      if (!hits.length) continue;
      const { t, side } = hits[0], posted = imp.posted || imp.date;
      if (side === 1) { t.posted = posted; t.attached1 = imp.id; t.a = imp.a; }
      else { t.posted2 = posted; t.attached2 = imp.id; t.a2 = imp.a; }
      if (t.est && acct[t.from] && acct[t.to] && cur(t.from) === cur(t.to) && t.a2 > t.a) {
        if (side === 1 && !t.attached2) t.a2 = t.a;
        else if (side === 2 && !t.attached1) t.a = t.a2;
      }
      imp.gone = true; imp.goneBy = t.id; imp.unmatched = false;
    }
    // [BI2] what the matching above set aside, and the record that holds each: a typed or ticked record an imported line
    // replaced, an imported line that met a side of a two-sided record (a move, a card payment), a self-logged spend
    // skipped. Receipts and the past periods count through countOnce() with this, so a pair is one record everywhere.
    const wasGone = new Set((book.events || []).filter(e => e && e.gone).map(e => e.id));
    res.dropped = {};
    for (const x of events) if (x.gone && !wasGone.has(x.id)) res.dropped[x.id] = x.goneBy || null;
    // the live records, kept until one is added (a self-logged spend) or removed
    let liveCache = null;
    const live = () => liveCache || (liveCache = events.filter(e => !e.gone));
    // [S5] a fee record (`of` its transfer) counts only while its transfer is live; [S5 fix] it never moves an account
    const isFeeRecord = e => e.k === 'spend' && !!e.of;
    const isFee = e => isFeeRecord(e) && !!events.find(t => t.id === e.of && !t.gone && TWO_SIDED[t.k]);
    const settledBy = {};
    for (const e of live()) for (const s of e.settles) settledBy[s] = e;

    // ----- expected items from schedules [H2, B8] -----
    const schedules = Object.values(sched).filter(s => acct[s.acct]);
    const occOf = (s, from, to) => S.occurrences(s, calOf(s.acct), from, to);

    // [X8] A schedule change never starts on or before its latest settled or named occurrence (a settle, an `amounts`
    // or `once` key, a `pe:` or `ps:` record). A copy where a change no longer makes such an occurrence is refused.
    const namedDues = sid => {
      const out = [];
      const take = o => { const oc = I.occurrence(o); if (oc && oc.schedule === sid) out.push(oc.due); };
      for (const e of live()) {
        for (const o of e.settles.concat(e.savedSettles || [])) take(o);
        if (e.k === 'periodEnd' || e.k === 'periodStart') { const oc = I.periodOcc(e.id); if (oc) take(oc); }
      }
      const s = sched[sid];
      for (const d of Object.keys(s.amounts || {})) if (S.keyLive(s.amounts, d)) out.push(d);
      const plan = book.plan || {};
      for (const l of (plan.budgets || []).concat(plan.shares || [])) for (const o of Object.keys(l.once || {})) if (!(l.once[o] && l.once[o].gone)) take(o);
      return out;
    };
    for (const s of schedules) {
      const changes = (s.rules || []).filter((r, i) => i > 0 && !r.gone && r.from);
      if (!changes.length) continue;
      const first = Math.min(...changes.map(r => dayNum(r.from)));
      const late = namedDues(s.id).filter(d => dayNum(d) >= first);
      if (!late.length) continue;
      const days = late.map(dayNum);
      const made = new Set(occOf(s, Math.min(...days), Math.max(...days)).map(o => o.id));
      for (const d of late) if (!made.has(s.id + '@' + d)) throw new Error(`${s.id}@${d} is settled or named, but a change of ${s.name} from ${dayStr(first)} no longer makes it: a change never starts on or before its latest settled or named occurrence [X8]`);
    }

    const waitingFor = (sid, due) => (book.pendingMove || []).filter(p => p && !p.gone && p.waits === 'pick' && p.to === 'amounts'
      && p.schedule === sid && p.key === due && typeof p.a === 'number');
    const openDays = Object.keys(acct).filter(id => openEv[id]).map(openDay);
    const earliest = (openDays.length ? Math.min(...openDays) : today) - 70;
    const farEnd = today + LATER_ON_DAYS + 62;
    const items = [];
    // [AW7] each kept version of a schedule still asked about (whole schedule records), as amounts by occurrence
    const keptAmounts = s => {
      const out = {};
      for (const k of book.keptVersions || []) {
        if (!k || k.gone || !k.ask || k.of !== s.id || (k.in != null && k.in !== 'schedules')) continue;
        for (const v of k.versions || []) {
          if (!v || typeof v !== 'object' || v.gone) continue;
          for (const o of occOf(Object.assign({}, s, v, { id: s.id }), earliest, farEnd)) (out[o.id] = out[o.id] || []).push(o.amount || 0);
        }
      }
      return out;
    };
    const KIND_OF = { income: 'income', bill: 'bill', transfer: 'transfer', autoSpend: 'auto', once: 'bill' };
    for (const s of schedules) {
      const kind = KIND_OF[s.kind] || 'bill';
      const other = kind === 'income' && !!s.cur && s.cur !== cur(s.acct);   // [Q4] pay in another currency
      const fee = kind === 'transfer' && s.fee ? s.fee : 0;                  // [Q2] what each occurrence costs on top
      const kept = keptAmounts(s);
      for (const o of occOf(s, earliest, farEnd)) {
        // [AN5, AO3] until the person picks add or replace, money out counts on the safe side: the larger of what is
        // written and each amount waiting for that occurrence; a waiting pay amount adds nothing
        if (kind !== 'income') for (const w of waitingFor(s.id, dayStr(o.due))) o.amount = Math.max(o.amount || 0, w.a);
        // [AW7, AR1] while a money question waits, the safe side across the kept versions: the smaller pay, the larger bill
        const alt = kept[o.id];
        if (alt) o.amount = kind === 'income' ? Math.min(o.amount || 0, ...alt) : Math.max(o.amount || 0, ...alt);
        const it = { id: o.id, sid: s.id, kind, acct: s.acct, to: s.acct2, place: s.place, due: o.due, land: o.land, amount: o.amount || 0,
          startsPeriod: !!s.startsPeriod, name: s.name, otherCur: other };
        if (other) it.currency = s.cur;
        if (fee) Object.assign(it, { amount: it.amount + fee, amount2: it.amount, fee });
        items.push(it);
      }
      if (other) res.warnings.push({ account: s.acct, code: 'income_other_currency', schedule: s.id,
        text: `${s.name} (${s.cur}) lands in ${acct[s.acct].name} (${cur(s.acct)}): it is not counted until it arrives` });
    }
    // [P6] a closed account's schedules end on its closing day
    const closedOn = id => (acct[id] && acct[id].closed && dayNum(acct[id].closed) <= knownTo ? dayNum(acct[id].closed) : null);
    for (let i = items.length - 1; i >= 0; i--) {
      const ends = [closedOn(items[i].acct), closedOn(items[i].to)].filter(x => x !== null);
      if (ends.length && items[i].due > Math.min(...ends)) items.splice(i, 1);
    }
    // [L matching q1, q2, Q6, S2, AA14] An imported line that replaced no typed line and settles nothing may settle an
    // unsettled item of its account and direction (exact, or within the schedule's `vary`), landing from 5 working days
    // before to the end of its posting window: items in landing order, each by the nearest line, then the nearest amount.
    const notYetIds = id => notYetOf(id);
    const isNotYet = o => notYetIds(o.acct).includes(o.id);
    const pastAtSetup = o => isNotYet(o) && openEv[o.acct] && calOf(o.acct).addWorking(o.land, postingDays(o.acct)) < openDay(o.acct);
    const freeLines = live().filter(e => e.unmatched && !e.settles.length);
    for (const o of items.slice().sort((a, b) => a.land - b.land || (a.id < b.id ? -1 : 1))) {
      if (settledBy[o.id]) continue;
      const c = calOf(o.acct), from = c.subWorking(o.land, EARLY_SETTLE), to = pastAtSetup(o) ? Infinity : c.addWorking(o.land, postingDays(o.acct));
      const vary = (sched[o.sid] && sched[o.sid].vary) || 0;
      let best = null;
      for (const imp of freeLines) {
        if (imp.settles.length || imp.untick || imp.account !== o.acct || (o.kind === 'income' ? 'in' : 'out') !== dirOf(imp)
          || (o.kind === 'income' && imp.sub === 'refund')   // [AV4] a refund never settles a pay
          || Math.abs(imp.a - o.amount) * 1000 > o.amount * Math.round(vary * 1000)) continue;
        const ds = importDays(imp).filter(d => d >= from && d <= to);
        if (!ds.length) continue;
        const cand = { imp, gap: Math.min(...ds.map(d => Math.abs(d - o.land))), off: Math.abs(imp.a - o.amount) };
        if (!best || cand.gap - best.gap < 0 || (cand.gap === best.gap && (cand.off - best.off < 0 || (cand.off === best.off
          && (keyCmp(imp.key, best.imp.key) < 0 || (imp.key === best.imp.key && imp.idx < best.imp.idx)))))) best = cand;
      }
      if (best) { best.imp.settles = [o.id]; best.imp.byImport = true; settledBy[o.id] = best.imp; }
    }
    // An item due or landing on or before its account's opening is inside the opening figure, unless setup was told it
    // had not gone out yet (`notYet`) [F20, X3].
    const covered = o => openEv[o.acct] && (o.land <= openDay(o.acct) || o.due <= openDay(o.acct)) && !isNotYet(o);
    for (const o of items) o.settled = !!settledBy[o.id] || !!covered(o);
    // [B5, H7, O2] a self-logged spend writes itself on its landing day unless something settled it: `auto:<occurrence>`
    for (const o of items.filter(x => x.kind === 'auto' && !x.settled && x.land <= knownTo)) {
      events.push({ id: I.built.auto(o.id), k: 'spend', account: o.acct, acct: o.acct, a: o.amount, day: o.land, date: dayStr(o.land), key: keyOf(dayStr(o.land)), idx: -1, settles: [o.id] });
      liveCache = null;
      o.settled = true;
    }
    // [S5, QC numbers] opts.settled: the occurrences from today on that count as gone (a record settles it, it is inside
    // the opening figure, or it logged itself), so the Plan tab's next one follows the one rule Home follows
    if (opts.settled) res.settled = items.filter(o => o.settled && Math.max(o.land, o.due) >= today).map(o => o.id);
    // [O1] an unmatched import, or a self-logged spend, dated on a check's day or the setup day counts as inside it
    for (const e of events) if (!e.gone && ((isImport(e) && e.unmatched) || e.settles.some(x => autoSched(I.scheduleOf(x))))) e.dayInside = true;

    // ----- periods [F8, F12, T1, T6] -----
    const periodStream = schedules.find(s => s.kind === 'income' && s.startsPeriod && ((s.rules || []).find(r => !r.gone) || {}).rule && ((s.rules || []).find(r => !r.gone).rule.every !== 'none'));
    const windowEnd = o => calOf(o.acct).addWorking(o.land, postingDays(o.acct));
    const stillExpected = o => isNotYet(o) && windowEnd(o) < openDay(o.acct);             // [Z2]
    const lateExpected = o => o.land < today && (today <= windowEnd(o) || stillExpected(o));   // [G3, H8]
    const pays = periodStream ? items.filter(o => o.sid === periodStream.id) : [];
    const startsPeriod = e => e.k === 'in' && e.sub !== 'refund' && !!periodStream && e.settles.some(s => I.scheduleOf(s) === periodStream.id);
    const nextPays = pays.filter(o => !o.settled && (o.land >= today || lateExpected(o)));
    // [BJ1] a pay due today left unticked at a check-in made today is not seen: it is not counted (BH1 over G4)
    const checkedOn = {};
    for (const e of all) if (e.e && !e.e.gone && e.e.k === 'check' && !e.e.stmt && e.e.date && dayNum(e.e.date) === today && !isOpeningCheck(e.e) && dayNum(e.e.told || e.e.date) <= knownTo) checkedOn[e.e.acct] = true;
    const leftToday = o => o.land === today && !o.settled && !!checkedOn[o.acct];
    const psOf = {}, peEnd = {};
    for (const e of live()) {
      if (e.k === 'periodStart' && e.day <= knownTo) { const oc = I.periodOcc(e.id); if (oc) psOf[oc] = e.day; }
      if (e.k === 'periodEnd') { const oc = I.periodOcc(e.id); if (oc) peEnd[oc] = Math.min(peEnd[oc] == null ? Infinity : peEnd[oc], e.day); }
    }
    const monthCache = {};   // each year's pays for the units rules, for this look ahead only
    const periodStartDays = [], occByStart = {};   // [T1] each period is named by the occurrence of the pay that starts it
    pays.slice().sort((x, y) => x.due - y.due).forEach((o, i, list) => {
      const prev = list[i - 1], s = settledBy[o.id];
      const d = psOf[o.id] != null ? psOf[o.id] : prev && peEnd[prev.id] != null ? peEnd[prev.id] + 1 : s && startsPeriod(s) ? s.day : null;
      if (d !== null && d <= knownTo) { periodStartDays.push(d); occByStart[d] = o.id; }
    });

    // ----- bank today per account [A1, B7, H1, I1, J3, O1, AN4] -----
    const delta = (e, id) => {
      if (e.k === 'open') return 0;
      let t = 0;
      for (const [a, v] of L.accountMoves(e, acct)) if (a === id) t += v;
      return t;
    };
    const postedOn = (e, id) => (e.account === id || e.from === id ? e.posted : reachOf(e) === id ? e.posted2 : null);
    const dayFor = (e, c, id) => { const p = c.avail !== 'available' && !isOwed(id) && postedOn(e, id); return p ? dayNum(p) : e.day; };
    const notGoneOut = (e, id) => e.settles.some(x => notYetOf(id).includes(x));   // [F20, X3, AB4]
    const isFigure = e => e.k === 'check';
    // the offset its writer was in, worked out once per record [X9, AN4]
    const zoneMinOf = e => (e.zoneMin != null ? e.zoneMin : (e.zoneMin = D.offsetMin(offsetOf(e.told || '') || zone)));
    // Told at the same moment as check c: a record written by the same check-in (`grp`) is inside it, since the figure is
    // read after its ticked items went through, and so is an imported line that replaced one of them; anything else goes
    // by its place in the list. The list order alone is not kept: the store hands events back sorted by id.
    const sameMoment = (e, c) => (c.grp != null && (e.momentGrp !== undefined ? e.momentGrp : e.grp) === c.grp ? true : e.idx < c.idx);
    // Is event e inside check c (or the opening) of account id?
    function inside(e, c, id) {
      if (c.opening && notGoneOut(e, id)) return false;   // [AB4]
      const d = dayFor(e, c, id);
      if (d > c.day) return false;
      // [AP1] a closing's final check holds everything dated on or before the closing day, whatever its told; the
      // closing's own records (`close:<account>`, Q7) come after it
      if (c.closing) return !isClosingRecord(e, id);
      if ((d + 1) * D.MS - zoneMinOf(e) * 60000 <= c.key) return true;   // [AN4] its day was over when the figure was read
      if (d < c.day) {
        if (e.key !== c.key) return e.key < c.key;
        if (e.moved && c.moved && !isFigure(e)) return true;   // [J2] a moved receipt before a moved figure
        return sameMoment(e, c);
      }
      const byBal = balOrder(e, c, id);   // [O1] a printed running balance decides first
      if (byBal !== null) return byBal;
      if (e.dayInside) return true;
      if (e.key !== c.key) return e.key < c.key;
      if (e.moved && c.moved && !isFigure(e)) return true;
      return sameMoment(e, c);
    }
    function balOrder(e, c, id) {
      const fig = c.amount;
      if (e.bal == null || e.account !== id || isOwed(id) || fig == null) return null;
      const same = live().filter(x => isImport(x) && x.bal != null && x.account === id && dayFor(x, c, id) === c.day).sort((x, y) => x.idx - y.idx);
      let j = null;
      same.forEach((x, k) => { if (x.bal === fig) j = k; });
      if (j === null && same.length && same[0].bal - delta(same[0], id) === fig) j = -1;
      return j === null ? null : same.indexOf(e) <= j;
    }
    const byTime = (x, y) => x.day - y.day || keyCmp(x.key, y.key) || x.idx - y.idx;
    const isClosingRecord = (e, id) => e.id === I.built.close(id) || String(e.id).startsWith(I.built.close(id) + ':');
    const heldBy = [];   // [S3] records told after a check that holds them: { id, account, check }
    function bankInfo(id) {
      let base = openingOf(id);
      // [Z1] a check whose large gain was answered "wrong" counts nowhere; the account asks for the figure again
      const checks = live().filter(e => e.k === 'check' && e.account === id && !e.stmt && e.gain !== 'wrong').sort(byTime);
      const wrong = events.filter(e => e.k === 'check' && e.account === id && e.gain === 'wrong').sort(byTime).pop();
      const askAgain = !!wrong && !checks.some(c => byTime(c, wrong) > 0);
      const moves = live().filter(e => delta(e, id) !== 0);
      const fillers = [];
      let lastGap = null;
      // [T2, AS6] the place a filler was put on is the check-in's `fillerPlace` for this account: the check-in the check
      // was written with (`grp`), or the one whose figures name it
      const fillerPlaceOf = c => {
        const ci = (book.checkins || []).find(k => k && !k.gone && (k.id === c.grp || (k.figures || []).some(f => f && f.check === c.id)));
        return ci && ci.fillerPlace && ci.fillerPlace[id] ? ci.fillerPlace[id] : null;
      };
      const span = moves.map(e => { const ds = [e.day].concat([e.posted, e.posted2].filter(Boolean).map(dayNum)); return [Math.min(...ds), Math.max(...ds)]; });
      let wasIn = moves.map(e => inside(e, base, id));
      // [AP1] the closing's final check: the last check dated on the closing day
      const closingCheck = closedOn(id) === null ? null : checks.filter(c => c.day === closedOn(id)).pop() || null;
      for (const c of checks) {
        const cc = { day: c.day, key: c.key, idx: c.idx, avail: c.avail, moved: c.moved, amount: c.a, closing: c === closingCheck, grp: c.grp };
        // [A3] the filler is worked out every time: what the events say minus what the check shows; [I1] an event inside
        // an earlier available check and not yet inside a later current one is added back
        // A record whose every date is two or more days before the check's day was over in every offset when it was read;
        // one dated after it is never inside. Only the rest need the full rule (so a long history stays quick).
        const settledDay = cc.key >= cc.day * D.MS - 15 * 3600000;
        const isIn = moves.map((e, k) => (cc.closing && span[k][0] <= cc.day ? inside(e, cc, id) : settledDay && span[k][1] <= cc.day - 2 ? true : span[k][0] > cc.day ? false : inside(e, cc, id)));
        let computed = base.amount;
        moves.forEach((e, k) => { if (isIn[k] !== wasIn[k]) computed += isIn[k] ? delta(e, id) : -delta(e, id); });
        // [S3, AN4] a record told after this check but inside it: named, so the screens can say the figure holds it
        moves.forEach((e, k) => { if (isIn[k] && !wasIn[k] && e.key > cc.key) heldBy.push({ id: e.id, account: id, check: dayStr(cc.day) }); });
        wasIn = isIn;
        const fp = fillerPlaceOf(c);
        fillers.push(Object.assign(makeFiller(id, c.day > base.day ? base.day + 1 : c.day, c.day, computed - c.a), fp ? { place: fp } : {},
          { had: computed, gain: c.a - computed, answer: c.gain || null }));
        base = cc;
        lastGap = { day: c.day, had: computed, gain: c.a - computed, answer: c.gain || null };
      }
      // [QC F4] bank today in its parts: the last check, and what was logged in and out after it
      const since = moves.filter((e, k) => !wasIn[k]).map(e => delta(e, id));
      const loggedIn = since.filter(d => d > 0).reduce((t, d) => t + d, 0), loggedOut = since.filter(d => d < 0).reduce((t, d) => t - d, 0);
      const bank = base.amount + loggedIn - loggedOut;
      return { bank, checked: base.amount, loggedIn, loggedOut, asOfDay: base.day, fillers, lastGap, askAgain: askAgain ? wrong.day : null };
    }
    // [A3, A4, T6] the filler of a stretch, split by days at each period start in it (or all to the older period)
    function makeFiller(id, first, last, amount) {
      const starts = periodStartDays.filter(d => d > first && d <= last).sort((x, y) => x - y);
      const cuts = [first, ...starts, last + 1], days = last - first + 1, parts = [];
      let given = 0;
      for (let i = 0; i < cuts.length - 1; i++) {
        const n = cuts[i + 1] - cuts[i];
        const share = opts.mostlyBeforePay ? (i === 0 ? amount : 0) : i === cuts.length - 2 ? amount - given : Math.round(amount * n / days);
        given += share;
        parts.push({ from: dayStr(cuts[i]), to: dayStr(cuts[i + 1] - 1), days: n, amount: share });
      }
      return { account: id, from: dayStr(first), to: dayStr(last), amount, parts };
    }

    // ----- plans of a loan or pay-later [Q3] -----
    function planParts(a) {
      const out = [];
      for (const pl of a.plans || []) {
        if (pl.gone) continue;
        const f = dayNum(pl.first), [y, mo] = ymOf(f), d = +pl.first.slice(8, 10);
        for (let k = 0; k < pl.count; k++) out.push({ plan: pl.id, due: dayIn(y, mo + k, d), amount: pl.amount });
      }
      return out.sort((x, z) => x.due - z.due);
    }
    const minPay = (rule, bal) => {
      if (!rule) return bal;
      const want = rule.fixed != null ? rule.fixed : Math.max(rule.floor || 0, Math.round(bal * rule.pct / 100));
      return Math.min(bal, want);
    };
    const extraOn = (steps, day) => { let x = 0; for (const st of steps || []) if (!st.gone && dayNum(st.from) <= day) x = st.amount; return x; };

    // ----- cards [F5, F6, F7, F14, F18, H3, H4, H7, I2, I3, J1, J5, K1, K2, O5, T3, X6, X7] -----
    function cardInfo(id) {
      const c = acct[id], cal = calOf(id), payFrom = payFromOf(id);
      const notSure = c.cutDay == null;                   // [H4] close day "not sure"
      const carries = c.inFull === false;                 // [H7] a card that carries a balance
      const months = c.payMonths != null ? c.payMonths : 1;
      const open = openingOf(id);
      // [J5, AB3] the statements at the opening, oldest first: each with its amount, close and payment day; "don't know"
      // holds everything owed, so it is all due on the next payment day
      const sts = (openChecks[id] || []).filter(x => x.stmt).map(x => ({ closed: x.stmtDate, payment_day: x.stmtPay, paid: x.paid === true,
        amount: x.paid === 'dont_know' ? open.amount : x.a === undefined ? 0 : x.a })).sort((p, q) => (p.closed < q.closed ? -1 : 1));
      const st = sts.length ? sts[sts.length - 1] : null;
      const payOf = due => ({ id: id + '@' + dayStr(due), due, land: cal.shift(due, c.shift) });
      const payAfterClose = cl => { const [y, mo] = ymOf(cl); return payOf(dayIn(y, mo + months, c.payDay)); };
      const planned = (amt, day) => (carries ? Math.min(amt, minPay(c.minRule, amt) + extraOn(c.extraSteps, day)) : amt);
      const carried0 = sts.filter(x => !x.paid).reduce((t, x) => t + x.amount, 0);
      const lines = [{ day: openDay(id), amount: open.amount - carried0, what: 'opening' }];
      const payments = [];
      for (const e of live()) {
        if (inside(e, open, id)) continue;
        if (e.account === id && (e.k === 'spend' || e.k === 'in') && !isFeeRecord(e)) {
          const posted = e.posted && dayNum(e.posted) <= knownTo ? dayNum(e.posted) : e.day;
          lines.push({ day: posted, amount: e.k === 'spend' ? e.a : -e.a });   // [F5] a refund lowers the cycle it posts in
        }
        if ((e.k === 'transfer' || e.k === 'borrow') && e.from === id) lines.push({ day: e.day, amount: e.a });   // [O5]
        if (e.k === 'repay' && e.to === id) payments.push({ day: e.day, amount: e.a2 != null ? e.a2 : e.a, settles: e.settles });
      }
      // [Q3] a card instalment plan's parts are card lines on their days
      for (const pa of Object.values(acct).filter(x => x.of === id)) for (const pt of planParts(pa))
        if (pt.due <= knownTo && pt.due > openDay(id) && openEv[pa.id] && pt.due > openDay(pa.id)) lines.push({ day: pt.due, amount: pt.amount, what: 'plan part' });
      // [X6] with a close day and no typed last statement, the close days run from the last close on or before the opening
      const lastCloseBy = d => { const [y, mo] = ymOf(d), here = dayIn(y, mo, c.cutDay); return here <= d ? here : dayIn(y, mo - 1, c.cutDay); };
      const sClose = st ? dayNum(st.closed) : notSure ? null : lastCloseBy(openDay(id));
      const closes = [];   // [F6] a close day never moves; [X7] as far as any question asks
      if (!notSure) { const [y, mo] = ymOf(sClose); for (let k = 1; ; k++) { const cl = dayIn(y, mo + k, c.cutDay); closes.push(cl); if (cl > farEnd) break; } }

      // [H3, I2, I3] the statements close by close up to `last`, with what each still holds on `upTo`
      function statementsTo(last, upTo) {
        const list = [];
        if (notSure) return { list, open: 0 };
        for (const x of sts) {
          const cl = dayNum(x.closed);
          list.push(Object.assign(x.payment_day ? payOf(dayNum(x.payment_day)) : payAfterClose(cl),
            { close: cl, amount: x.amount, left: x.paid ? 0 : x.amount, interest: 0, into: null, paidAtOpening: !!x.paid }));
        }
        const evs = lines.map(l => ({ day: l.day, line: l.amount })).concat(payments.map(p => ({ day: p.day, pay: p.amount, settles: p.settles }))).sort((x, z) => x.day - z.day);
        let openAmt = 0, i = 0;
        const apply = until => {
          for (; i < evs.length && evs[i].day <= until; i++) {
            const ev = evs[i];
            if (ev.line != null) { openAmt += ev.line; continue; }
            let left = ev.pay;
            // a payment goes to the statement it settles (or the one that was carried into), then the oldest owing, then the open cycle
            const named = ev.settles.map(sid => list.find(b => b.id === sid)).filter(Boolean).map(b => { while (b.into) b = b.into; return b; });
            for (const b of named.concat(list)) {
              if (left <= 0) break;
              if (b.into || b.left <= 0) continue;
              const take = Math.min(left, b.left);
              b.left -= take; left -= take;
            }
            openAmt -= left;
          }
        };
        for (const cl of closes) {
          if (cl > last) break;
          apply(cl);
          // [I3] only statements whose payment day has come; [AU6, H3] a credit carries to the next statement at once
          const folding = list.filter(b => !b.into && (b.land <= cl || b.left < 0));
          const carried = folding.reduce((t, b) => t + b.left, 0);
          const interest = interestOn(carried, c.apr);
          const amount = carried + interest + openAmt;
          const nb = Object.assign(payAfterClose(cl), { close: cl, amount, left: amount, interest, into: null });
          for (const b of folding) { b.into = nb; b.leftAtFold = b.left; b.left = 0; }
          list.push(nb);
          openAmt = 0;
        }
        apply(upTo);
        return { list, open: openAmt };
      }
      const interestTo = day => statementsTo(day, day).list.reduce((t, b) => t + b.interest, 0);
      const owedBare = day => carried0 + lines.filter(l => l.day <= day).reduce((t, l) => t + l.amount, 0) - payments.filter(p => p.day <= day).reduce((t, p) => t + p.amount, 0);
      // [J1, K1] close day not sure and carrying: interest on each payment day after the opening, on everything owed before it
      const notSureDays = [];
      if (notSure && carries && c.apr) {
        const [y, mo] = ymOf(openDay(id));
        for (let k = 0; ; k++) { const p = payOf(dayIn(y, mo + k, c.payDay)); if (p.due > farEnd) break; if (p.land > openDay(id) && p.due > openDay(id)) notSureDays.push(p.land); }
      }
      const notSureInterestTo = day => { let t = 0; for (const d of notSureDays) { if (d > day) break; t += interestOn(owedBare(d - 1) + t, c.apr); } return t; };
      const owedAt = day => owedBare(day) + (notSure ? notSureInterestTo(day) : interestTo(day));
      const stmtAmount = cl => { const b = statementsTo(cl, cl).list.find(x => x.close === cl); return b ? b.amount : owedAt(cl); };
      // a card check sets the statement it names and what is owed now; the gaps are its fillers [A3]
      const fillers = [];
      for (const e of live().filter(x => x.k === 'check' && x.account === id && !x.stmt)) {
        let gap = 0;
        const sx = live().find(x => x.k === 'check' && x.account === id && x.stmt && x.grp != null && x.grp === e.grp);
        if (sx) {
          const cl = dayNum(sx.stmtDate), g = sx.a - stmtAmount(cl);
          if (g) lines.push({ day: cl, amount: g, what: 'filler' });
          gap += g;
        }
        const g2 = e.a - owedAt(e.day);
        if (g2) lines.push({ day: e.day, amount: g2, what: 'filler' });
        gap += g2;
        // more: typed above what the app had (spending not logged); less: below it (comes off spending), each 0 or more
        fillers.push({ account: id, day: e.date, amount: gap, more: Math.max(0, gap), less: Math.max(0, -gap) });
      }
      const owedNow = owedAt(knownTo) + lines.filter(l => l.day > knownTo).reduce((t, l) => t + l.amount, 0);

      // the points where something fell due, then the next one still to come
      const points = [];
      let nextPoint = null;
      if (!notSure) {
        const Sx = statementsTo(knownTo, knownTo);
        for (const b of Sx.list) points.push(Object.assign(b, { closed: b.close, basis: b.into ? b.leftAtFold : b.left, paid: b.paidAtOpening || !!settledBy[b.id] }));
        const nc = closes.find(cl => cl > knownTo);
        if (nc != null) nextPoint = Object.assign(payAfterClose(nc), { closes: nc });
      } else {
        const [y, mo] = ymOf(openDay(id));
        for (let k = 0; !nextPoint; k++) {
          const p = payOf(dayIn(y, mo + k, c.payDay));
          if (p.due > farEnd) break;
          if (p.land <= openDay(id) || p.due <= openDay(id)) continue;
          if (p.land < today) {
            const prev = points[points.length - 1];
            const pt = Object.assign(p, { amount: owedAt(p.land), paid: !!settledBy[p.id], into: null, left: owedAt(p.land) });
            pt.basis = pt.amount;
            if (prev) prev.into = pt;
            points.push(pt);
          } else if (!settledBy[p.id]) nextPoint = p;
        }
      }
      // [H3, I6] each unpaid point asks only what an older unpaid one carried into it does not already ask
      const unpaid = [];
      for (const p of points) p.held = 0;
      let stillAsked = 0, projCarried = 0;
      for (const p of points) {
        const item = !p.paid && p.basis > 0;
        if (item) { p.part = carries ? planned(p.amount, p.due) : Math.max(0, p.basis - p.held); p.asks = carries ? p.part : p.basis; unpaid.push(p); }
        // [AU3, I3] a statement that is no item (ticked, or nothing owed) still carries on what older items ask and is
        // still inside its remainder, so a remainder carried on again is asked once
        const asked = !item ? Math.min(p.held, Math.max(0, p.basis)) : carries ? p.part + p.held : p.basis;
        if (p.into) p.into.held += asked;
        else { stillAsked += asked; if (!notSure && nextPoint && p.land <= nextPoint.closes) projCarried += p.left - asked; }
      }
      const label = notSure ? 'all owed' : null;
      const owedBefore = owedNow - stillAsked;
      const nextInterest = !nextPoint ? 0 : !notSure ? interestOn(projCarried, c.apr) : carries ? interestOn(owedBefore, c.apr) : 0;
      const rest = Math.max(0, owedBefore + nextInterest);
      const nextAmount = nextPoint ? planned(rest, nextPoint.due) : 0;
      const walkItems = unpaid.map(p => ({ land: p.land, amount: p.part, label: c.name + (notSure ? ', all owed' : ' statement closed ' + short(p.closed)) }));
      // [T3] bills and self-logged spends paid by this card still to come: off the paying account on the payment day of
      // the statement they fall in
      let nextExp = 0;
      for (const o of items) {
        if (o.acct !== id || (o.kind !== 'bill' && o.kind !== 'auto') || o.settled || !o.amount || !(o.land >= today || lateExpected(o))) continue;
        const day = Math.max(o.land, today);
        let p;
        if (!notSure) { const cl = closes.find(x => x >= day); if (cl == null) continue; p = Object.assign(payAfterClose(cl), { closes: cl }); }
        else { const [y, mo] = ymOf(day); for (let k = 0; k < 3; k++) { p = payOf(dayIn(y, mo + k, c.payDay)); if (p.land >= day) break; } }
        if (nextPoint && p.id === nextPoint.id) nextExp += o.amount;
        else if (!carries && (!nextPoint || p.land > nextPoint.land)) walkItems.push({ land: p.land, amount: o.amount, future: true, label: c.name + ', ' + o.name + ' ' + short(o.land) });
      }
      if (nextPoint) walkItems.push({ land: nextPoint.land, amount: nextExp ? planned(rest + nextExp, nextPoint.due) : nextAmount, label: c.name + (notSure ? ', all owed' : ' still open, closes ' + short(nextPoint.closes)) });
      // [F4, H8] a payment past its day and not ticked is overdue (late, then not seen), never the next one
      const shown = p => ({ item: p.id, amount: p.asks, payment_date: dayStr(p.land), statement: label || 'closed', closed_on: p.closed != null ? dayStr(p.closed) : undefined });
      const overdue = unpaid.filter(p => p.land < today).map(p => Object.assign(shown(p), { state: payState(p.land, payFrom) }));
      const coming = unpaid.filter(p => p.land >= today);
      const next = coming.length ? Object.assign(shown(coming[0]), { state: 'coming' })
        : nextPoint ? { item: nextPoint.id, amount: nextAmount, payment_date: dayStr(nextPoint.land), statement: label || 'open', closes_on: nextPoint.closes != null ? dayStr(nextPoint.closes) : undefined, state: 'coming' } : null;
      const cardItems = unpaid.map(p => ({ id: p.id, due: p.due, land: p.land, amount: p.part, statement: label || 'closed' }));
      if (nextPoint) cardItems.push({ id: nextPoint.id, due: nextPoint.due, land: nextPoint.land, amount: nextAmount, statement: label || 'open' });
      return { owedNow, statements: points, next, overdue, walkItems, cardItems, fillers, payFrom };
    }

    // ----- loans and pay-later [B5, E6, F19, H7, I2, Q3, AB3, AC5, AD7] -----
    function loanInfo(id) {
      const a = acct[id], open = openingOf(id), cal = calOf(id), payFrom = a.payFrom || mainAcct;
      const changes = [];
      for (const e of live()) {
        if (inside(e, open, id)) continue;
        if ((e.k === 'borrow' || e.k === 'transfer') && e.from === id) changes.push({ day: e.day, d: e.a });
        if (e.k === 'spend' && e.account === id && !isFeeRecord(e)) changes.push({ day: e.day, d: e.a });
        if (e.k === 'in' && e.account === id) changes.push({ day: e.day, d: -e.a });
        if (e.k === 'repay' && e.to === id) changes.push({ day: e.day, d: -(e.a2 != null ? e.a2 : e.a) });
      }
      const parts = planParts(a);
      if (a.of) for (const pt of parts) if (pt.due <= knownTo && pt.due > openDay(id) && openEv[a.of] && pt.due > openDay(a.of)) changes.push({ day: pt.due, d: -pt.amount });
      changes.sort((x, z) => x.day - z.day);
      const days = [];
      const [y, mo] = ymOf(openDay(id));
      const stmtPaid = (openChecks[id] || []).filter(x => x.stmt && x.paid === true && x.stmtPay).map(x => x.stmtPay);
      for (let k = 0; !a.of && a.payDay != null; k++) {
        const due = dayIn(y, mo + k, a.payDay);
        if (due > farEnd) break;
        const land = cal.shift(due, a.shift);
        if (land <= openDay(id) || due <= openDay(id)) continue;
        if (stmtPaid.includes(dayStr(due))) continue;   // [AB3] answered "paid": that payment was made before setup
        days.push({ due, land, iid: id + '@' + dayStr(due) });
      }
      let owed = open.amount, r = 0;
      for (const d of days) {
        if (d.land > knownTo) break;
        while (r < changes.length && changes[r].day < d.land) owed += changes[r++].d;
        owed += interestOn(owed, a.apr);   // [I2] interest first, on a payment day gone by too
        d.owedThen = owed;
      }
      while (r < changes.length) owed += changes[r++].d;
      const owedNow = owed;
      const own = d => S.keyAmount(a.amounts, dayStr(d.due));   // [AC5, AE1] that payment, whole
      const asks = (d, i, bal) => (own(d) != null ? own(d) : (parts.length
        ? parts.filter(pt => pt.due <= d.due && (i === 0 || pt.due > days[i - 1].due)).reduce((t, pt) => t + pt.amount, 0)
        : a.amount != null ? a.amount : minPay(a.minRule, bal)) + extraOn(a.extraSteps, d.due));
      const loanItems = [];
      let unpaid = 0, left = null;
      for (let i = 0; i < days.length; i++) {
        const d = days[i], past = d.land <= knownTo;
        let bal;
        if (past) bal = Math.min(d.owedThen, owedNow) - unpaid;
        else { if (left === null) left = owedNow - unpaid; if (left <= 0) break; left += interestOn(left, a.apr); bal = left; }
        if (bal <= 0 || settledBy[d.iid]) continue;
        const amt = Math.min(bal, asks(d, i, bal));
        if (amt <= 0) continue;
        if (past) unpaid += amt; else left -= amt;
        loanItems.push({ id: d.iid, sid: id, kind: 'loan', acct: payFrom, card: id, due: d.due, land: d.land, amount: amt, settled: false, name: a.name });
      }
      // [F4, H8] a payment past its day and not ticked is overdue (late, then not seen), never the next one
      const shown = x => ({ item: x.id, amount: x.amount, payment_date: dayStr(x.land) });
      const nx = loanItems.find(x => x.land >= today);
      return { owedNow, loanItems, payFrom, next: nx ? Object.assign(shown(nx), { state: 'coming' }) : null,
        overdue: loanItems.filter(x => x.land < today).map(x => Object.assign(shown(x), { state: payState(x.land, payFrom) })) };
    }

    // [H8, F3, AU] a payment past its day: late inside the paying account's posting window, then not seen
    const payState = (land, from) => (from && acct[from] && today <= calOf(from).addWorking(land, postingDays(from)) ? 'late' : 'notSeen');
    // ----- every account -----
    const banks = {}, cards = {}, loans = {};
    for (const id of Object.keys(acct)) {
      if (!openEv[id]) continue;
      if (acct[id].type === 'card') cards[id] = cardInfo(id);
      else if (isOwed(id)) loans[id] = loanInfo(id);
      else banks[id] = bankInfo(id);
    }
    res.heldByCheck = heldBy;
    // [W2] a card, loan or pay-later payment in another currency than its paying account is listed apart
    const otherOf = (id, from) => (acct[from] && cur(id) !== cur(from) ? { otherCur: true, currency: cur(id) } : { otherCur: false });
    for (const id in cards) for (const ci of cards[id].cardItems) items.push(Object.assign({ kind: 'card', acct: cards[id].payFrom, card: id, settled: false }, ci, otherOf(id, cards[id].payFrom)));
    for (const id in loans) for (const li of loans[id].loanItems) items.push(Object.assign(li, otherOf(id, loans[id].payFrom)));
    const isOut = o => o.kind !== 'income';
    const fallsDue = o => o.kind !== 'card' || o.statement !== 'open';   // an open statement is not due yet [F7]

    // ----- the plan: shares and budget lines [B1, B2, B8, O4, T watch, V] -----
    const plan = book.plan || {};
    const budgets = (plan.budgets || []).filter(l => l && !l.gone);
    const shares = (plan.shares || []).filter(x => x && !x.gone && x.free != null);
    // A change applies from the first period start on or after the day it was made [T watch, V]
    // [BJ2] an amount set for the first time carries the day it was set: the period it was set in has it, a period
    // that ended before that day has none (null); nothing before it changes
    const stepAmount = (steps, start) => {
      const list = (steps || []).filter(x => !x.gone).map(x => ({ f: x.from == null ? -Infinity : dayNum(x.from), a: x.amount })).sort((p, q) => p.f - q.f);
      if (!list.length) return null;
      const nextStart = start == null ? Infinity : Math.min(Infinity, ...pays.map(startDayOf).filter(d => d > start));
      let a = list[0].f === -Infinity || start == null || list[0].f < nextStart ? list[0].a : null;
      for (const x of list) if (x.f === -Infinity || (start != null && x.f <= start)) a = x.a;
      return a;
    };
    const freeSrc = shares.length ? { id: 'free', acct: shares[0].acct, per: (shares[0].per || {}).free || 'month',
      steps: shares.map(x => ({ from: x.from == null ? null : x.from, amount: x.free })) } : null;
    const lineSrcs = budgets.map(l => ({ id: l.id, name: l.name, acct: l.acct, per: l.per, steps: l.steps, once: [l.once], field: 'amount', from: l.from || null }));
    if (freeSrc) Object.assign(freeSrc, { once: shares.map(x => x.once), field: 'free' });
    // [B8, T1, AE1] A period's amount: a live `once` key named by the occurrence of the pay that starts it, else the step in
    // force. [AO4, AR1] Until the person picks add or replace, a `once` amount waiting for that period counts on the safe
    // side: the larger, so more is kept aside for the line.
    const periodAmount = (src, start, occ) => {
      let a = null;
      if (occ) for (const m of src.once) { const v = m && m[occ]; if (v && typeof v === 'object' && !v.gone && typeof v[src.field] === 'number') a = v[src.field]; }
      if (a === null) a = stepAmount(src.steps, start);
      if (occ) for (const w of book.pendingMove || []) {
        if (!w || w.gone || w.waits !== 'pick' || w.to !== 'once' || w.key !== occ || (w.line !== src.id && !(src.id === 'free' && w.share))) continue;
        const wa = typeof w.a === 'number' ? w.a : w.a && typeof w.a[src.field] === 'number' ? w.a[src.field] : null;
        // [AV3] the safe side for what it is: the larger for a spending line, the smaller for Free to spend
        if (wa !== null && a !== null) a = src.field === 'free' ? Math.min(a, wa) : Math.max(a, wa);
      }
      return a;
    };
    // the period a day is in, named by the pay that started it: started, else the last pay landing on or before it
    const occOn = (start, day) => (start != null && occByStart[start] ? occByStart[start]
      : (pays.filter(o => (o.land <= day && (o.settled || o.land <= firstOpenDay)) || (o.due <= firstOpenDay && firstOpenDay <= day)).sort((x, z) => startDayOf(x) - startDayOf(z)).pop() || {}).id || null);
    // [H8, AU4, AU5] a pay not ticked (still to come, late, or not seen) never starts a period; one inside the opening has [AU7]
    // [AU7] a pay inside the opening (due on or before the setup day) starts its period by the setup day at the latest
    const startDayOf = o => (o.due <= firstOpenDay ? Math.min(o.land, firstOpenDay) : o.land);
    const firstOpenDay = Object.keys(openEv).length ? Math.min(...Object.keys(openEv).map(openDay)) : -Infinity;

    // [AU1] The period running now, converted like every other: from the pay that started it (or the day it started) to
    // the next pay. Its amount for a source by the units rules.
    function nowPeriod() {
      const started = periodStartDays.length ? Math.max(...periodStartDays) : null;
      const occ = occOn(started, today);
      const o = occ && pays.find(p => p.id === occ);
      const start = started !== null ? started : o ? startDayOf(o) : null;
      const next = nextPays.slice().sort((x, z) => x.land - z.land)[0];   // [AU4, AU5] a pay counted today or late ends it
      const end = next ? next.land : start !== null ? start + 30 : null;
      return { started, occ, start, end };
    }
    const nowAmount = (src, per) => {
      // the period's own first day, also for the period holding the setup day, which has no recorded start
      const n = nowPeriod(), a = periodAmount(src, n.start, n.occ);
      return n.start === null ? a : perPeriod({ per, amount: a }, n.start, n.end, n.occ);
    };
    function freePeriodAmount() {
      if (!periodStream || !freeSrc) return null;
      return nowAmount(freeSrc, freeSrc.per);
    }
    // [O watch, X4] a check-in figure above what the app had by more than the period's Free to spend, or by more than
    // 20% of what it had, is held until the person answers that it is right; an investment's rise is never asked [T watch]
    const largeGain = (id, g) => {
      if (!g || g.gain <= 0 || acct[id].type === 'investment') return false;
      const fp = freePeriodAmount();
      return (fp !== null && g.gain > fp) || g.gain * 5 > g.had;
    };
    const heldGain = (id, f) => largeGain(id, f) && f.answer !== 'right';

    // ----- places: goals and the other kept places [B6, F22, E5, H7, P1, P2, R1, T2, T7, V1, X5] -----
    const places = (book.places || []).filter(p => p && p.id);
    const billPlace = {}; for (const s of schedules) if (s.place) billPlace[s.id] = s.place;
    const fromPlace = e => e.place || e.settles.map(s => billPlace[I.scheduleOf(s)]).find(Boolean);
    const removedOn = p => (p.gone && dayNum(p.gone) <= knownTo ? dayNum(p.gone) : null);
    const keptIn = {};
    const gaveWay = new Set();
    function placeBalance(g) {
      let amt = 0;
      const own = g.keptIn && g.keptIn.mode === 'ownAccount' ? g.keptIn.acct : null;
      let outside = 0;
      if (own) for (const id of Object.keys(openEv)) { const sp = (openEv[id].split || {}).places || {}; if (id !== own && sp[g.id] != null) outside += sp[g.id]; }
      const placeMoveGrps = new Set(live().filter(e => e.k === 'move' && (e.place === g.id || e.place2 === g.id) && e.grp != null).map(e => e.grp));
      for (const id of Object.keys(openEv)) { const sp = (openEv[id].split || {}).places || {}; if (sp[g.id] != null) amt += sp[g.id]; }
      for (const e of live()) {
        if (e.k === 'move' && e.place2 === g.id && e.place !== g.id && !gaveWay.has(e.id)) amt += e.a;
        // [T7] a move out of a place lowers it; [P1, Q7] the removal's own move to Waiting (`toPlace`) is the money to place
        if (e.k === 'move' && e.place === g.id && e.place2 !== g.id && !e.toPlace) amt -= e.a;
        if (e.k === 'spend' && fromPlace(e) === g.id && (!isFeeRecord(e) || isFee(e))) amt -= e.a;   // [H7, S5]
        if (e.k === 'adjust' && e.place === g.id) amt += e.a;   // [T7]
        // [BI5] a goal kept in its own account: money moved into that account is set aside for it, and money moved out
        // of it is taken from it, unless a move of the place was written with it (the same `grp`), which already counts.
        // [V1] Money the goal already held outside its account (its opening split on another account) moved in is the
        // same money: it moves first, and only what is beyond it is new.
        if (own && TWO_SIDED[e.k] && e.from !== e.to && (e.to === own || e.from === own) && !(e.grp != null && placeMoveGrps.has(e.grp))) {
          if (e.to === own) { const inn = e.a2 != null ? e.a2 : e.a, same = Math.min(outside, inn); outside -= same; amt += inn - same; }
          else amt -= e.a;
        }
        if (e.k === 'periodEnd') for (const mv of e.moves || []) {   // [P2]
          if (mv.to === g.id && e.place !== g.id) amt += mv.a;
          if (e.place === g.id && mv.to !== g.id) amt -= mv.a;
        }
      }
      for (const bid in banks) for (const f of banks[bid].fillers) if (f.place === g.id && !heldGain(bid, f)) amt -= f.amount;   // [T2, X4]
      return Math.max(0, amt);
    }
    const placings = g => live().filter(e => e.k === 'move' && e.placed === I.built.rm(g.id));
    const atOf = e => (e.at ? moment(e.at, zone) : e.key);
    for (const g of places.filter(p => removedOn(p) !== null)) {   // [X5] the newest placing gives way until the rest fit
      const list = placings(g).sort((x, y) => atOf(x) - atOf(y) || x.idx - y.idx);
      let total = list.reduce((t, e) => t + e.a, 0);
      const limit = placeBalance(g);
      while (total > limit && list.length) { const newest = list.pop(); gaveWay.add(newest.id); total -= newest.a; }
    }
    // A goal with a target and a date: what is still to go from what is really set aside (a place below nothing holds
    // nothing, AU2), and what each period needs to reach it: spread over the period-starting pays still to come on or
    // before its date (a late pay still counted is one of them), the leftover minor units on the earliest, so the first
    // is the most. No pay left before the date: all of it now. No fixed pay: periods are not known [B4].
    function goalPace(g, amt, due) {
      if (g.target == null || !due) return {};
      const toGo = Math.max(0, g.target - Math.max(0, amt));
      if (!periodStream) return { target: g.target, toGo, periodsLeft: null, perPeriod: null };
      const dd = dayNum(due);
      // [BJ3, BF1] a late pay still expected counts here (pace is a plan), though safe to spend leaves it out (BH1)
      const n = dd < today ? 0 : occOf(periodStream, today - 62, dd).filter(o => o.land <= dd && !settledBy[o.id]
        && (o.land >= today || nextPays.some(p => p.id === o.id))).length;
      return { target: g.target, toGo, periodsLeft: n, perPeriod: n ? U.spread(toGo, n)[0] : toGo };
    }
    for (const g of places) {
      const amt = placeBalance(g), where = (g.keptIn || {}).acct;
      if (removedOn(g) !== null) {   // [P1, R1] a removed place's money waits "to place", held out of safe to spend
        const mine = placings(g).filter(e => !gaveWay.has(e.id));
        const placed = mine.reduce((t, e) => t + e.a, 0);
        const keptWaiting = mine.filter(e => e.place2 === 'waiting').reduce((t, e) => t + e.a, 0);
        const toPlace = Math.max(0, amt - placed);
        const gave = placings(g).filter(e => gaveWay.has(e.id)).map(e => e.id);
        (res.toPlace = res.toPlace || {})[g.id] = Object.assign({ amount: toPlace, keptInWaiting: keptWaiting, account: where }, gave.length ? { gaveWay: gave } : {});
        if (keptWaiting) (keptIn[where] = keptIn[where] || []).push({ id: g.id + ':waiting', name: g.name, label: g.name + "'s money, kept in Waiting on purpose", amount: keptWaiting });
        if (toPlace) (keptIn[where] = keptIn[where] || []).push({ id: g.id, name: g.name, label: g.name + "'s money, in Waiting to place", amount: toPlace });
        continue;
      }
      // [E5, H7] a place that pays a schedule is next due on that schedule's next occurrence not settled yet
      const paysSched = schedules.find(s => s.place === g.id);
      const nextOf = paysSched && items.find(o => o.sid === paysSched.id && !o.settled);
      const due = g.refill && nextOf ? dayStr(nextOf.due) : g.due || (nextOf ? dayStr(nextOf.due) : null);
      res.places[g.id] = Object.assign({ kept: amt, due, account: where }, goalPace(g, amt, due));
      (keptIn[where] = keptIn[where] || []).push({ id: g.id, name: g.name, amount: amt });
    }

    // ----- what is left of this period's lines and Free to spend [B1, B2, I4, J4, O4, O, Q2, R1, T2, T4, T5, T7] -----
    // [periods.js] `win` names a period gone by: { start, end, occ, next } (whole day numbers; `next` the day the period
    // after it started). Left out: the period running now. A past period counts only what is dated inside it.
    function planNow(win) {
      if (!freeSrc && !lineSrcs.length) return {};
      const past = !!win && !win.now;
      const lastPay = past ? win.start : periodStartDays.length ? Math.max(...periodStartDays) : null;
      const upTo = past ? win.end : Infinity;
      const opening = {};
      function openingShares(acctId) {
        if (opening[acctId]) return opening[acctId];
        const split = (openEv[acctId] && openEv[acctId].split) || {}, od = openDay(acctId), out = { lines: {}, free: null };
        const inOpening = o => o.land <= od || o.due <= od;   // [AU7]
        const before = pays.filter(inOpening).sort((x, z) => x.land - z.land), after = pays.filter(o => !inOpening(o)).sort((x, z) => x.land - z.land);
        // [I4] shared by days left: from the setup day to the period's last day, both counted, over the period's days
        const share = before.length && after.length ? { d: after[0].land - od, D: after[0].land - startDayOf(before[before.length - 1]) } : null;
        // [AS, AU1] of the amount of the period holding the opening, by the units rules
        const holding = before.length ? before[before.length - 1] : null;
        const openAmount = (src, per) => { const a = periodAmount(src, holding ? startDayOf(holding) : null, occOn(null, od)); return holding && after.length ? perPeriod({ per, amount: a }, startDayOf(holding), after[0].land, holding.id) : a; };
        let leftOver = 0;
        for (const l of lineSrcs.filter(x => moneyAcct(lineAcct(x)) === acctId)) {
          const typed = (split.lines || {})[l.id], amount = openAmount(l, l.per);
          if (typed != null) out.lines[l.id] = typed;
          else if (amount == null) continue;   // [BJ2] no amount in the period holding the opening
          else if (share) { out.lines[l.id] = Math.floor(amount * share.d / share.D); leftOver += amount * share.d - out.lines[l.id] * share.D; }
          else out.lines[l.id] = amount;
        }
        if (freeSrc && moneyAcct(lineAcct(freeSrc)) === acctId) {
          const amount = openAmount(freeSrc, freeSrc.per);
          out.free = split.free != null ? split.free : amount == null ? null : share ? Math.floor((amount * share.d + leftOver) / share.D) : amount;   // [J4]
        }
        return (opening[acctId] = out);
      }
      // a line's opening split stays on the account it was typed on, also after the line moved (closing the main bank)
      const splitAt = lineId => Object.keys(openEv).find(id => { const sp = openEv[id].split; return sp && (lineId === 'free' ? sp.free != null : (sp.lines || {})[lineId] != null); });
      // [AU] in a life with a plan, a spend with no line (not a bill paid, not from a place, not a fee) is Free to spend's
      const lineOfSpend = e => (e.line ? e.line : e.k === 'spend' && freeSrc && !e.settles.length && !e.place && !isFeeRecord(e) ? 'free' : null);
      const partsOf = {};   // [QC F5] each line's part that counts this period, and what was spent on it
      const leftOf = (lineId, acctId, amount) => {
        const sa = splitAt(lineId), moved = sa && sa !== acctId;
        const atOpening = moved ? (lineId === 'free' ? openEv[sa].split.free : openEv[sa].split.lines[lineId])
          : lineId === 'free' ? openingShares(acctId).free : openingShares(acctId).lines[lineId];
        const fromOpening = lastPay === null || lastPay <= openDay(moved ? sa : acctId);
        const start = fromOpening ? (atOpening != null ? atOpening : amount) : amount;
        const inLine = e => lineOfSpend(e) === lineId && e.account && openEv[e.account] && !inside(e, openingOf(e.account), e.account) && (fromOpening || e.day >= lastPay) && e.day <= upTo;
        const counts = e => inLine(e) && cur(e.account) === cur(acctId);   // [T5] only spends in the line's own currency
        if (!past) for (const e of live().filter(x => x.k === 'spend' && !isFeeRecord(x) && inLine(x) && cur(x.account) !== cur(acctId)))
          res.warnings.push({ account: e.account, code: 'spend_other_currency', line: lineId, event: e.id,
            text: `${fmt(e.a, cur(e.account))} ${cur(e.account)} on ${lineId === 'free' ? 'Free to spend' : lineId} is listed apart: it is not counted until stage 2` });
        let filled = 0;   // [T2] the filler is spending, signed; [X4] a held gain places nothing
        for (const bid in banks) {
          if (acct[bid].type === 'investment' || cur(bid) !== cur(acctId)) continue;
          for (const f of banks[bid].fillers) if ((f.place || 'free') === lineId && !heldGain(bid, f))
            for (const pt of f.parts) if ((fromOpening || dayNum(pt.from) >= lastPay) && dayNum(pt.from) <= upTo) filled += pt.amount;
        }
        if (lineId === 'free') for (const cid in cards) {
          if (cur(cid) !== cur(acctId)) continue;
          for (const f of cards[cid].fillers) if ((fromOpening || dayNum(f.day) >= lastPay) && dayNum(f.day) <= upTo) filled += f.amount;
        }
        const spent = live().filter(e => e.k === 'spend' && !isFeeRecord(e) && counts(e)).reduce((t, e) => t + e.a, 0)
          - live().filter(e => e.k === 'in' && e.sub === 'refund' && counts(e)).reduce((t, e) => t + e.a, 0) + filled;   // [O] a refund given back to its line
        if (lineId !== 'free') { partsOf[lineId] = { start, spent }; return win ? { start, left: start - spent } : start - spent; }
        const inPeriod = (e, id) => openEv[id] && !inside(e, openingOf(id), id) && (fromOpening || e.day >= lastPay) && e.day <= upTo;
        // [Q2, S5] a fee in one currency comes out of Free to spend unless its fee record names another place
        const elsewhere = new Set(live().filter(f => isFee(f) && f.place).map(f => f.of));
        const fees = live().filter(e => TWO_SIDED[e.k] && acct[e.from] && acct[e.to] && cur(e.from) === cur(e.to) && cur(e.from) === cur(acctId) && e.a > e.a2 && inPeriod(e, e.from) && !elsewhere.has(e.id))
          .reduce((t, e) => t + e.a - e.a2, 0);
        const placed = live().filter(e => e.k === 'move' && e.placed && e.place2 === 'free' && !gaveWay.has(e.id) && e.acct && inPeriod(e, e.acct)).reduce((t, e) => t + e.a, 0);   // [R1, X5]
        const adjusted = live().filter(e => e.k === 'adjust' && !e.place && acct[e.account] && cur(e.account) === cur(acctId) && inPeriod(e, e.account)).reduce((t, e) => t + e.a, 0);   // [T7]
        partsOf.free = { start };
        return win ? { start, left: start - spent - fees + placed + adjusted } : start - spent - fees + placed + adjusted;
      };
      const amountOf = (src, per) => (past ? perPeriod({ per, amount: periodAmount(src, win.start, win.occ) }, win.start, win.next, win.occ)
        : periodStream ? nowAmount(src, per) : periodAmount(src, lastPay, occOn(lastPay, today)));
      // [BJ2] a line or Free to spend with no amount in this period (set later) is not in it
      const lines = lineSrcs.map(l => { const id = moneyAcct(lineAcct(l)), a = amountOf(l, l.per); if (a == null) return null; const left = leftOf(l.id, id, a), pt = partsOf[l.id]; return { name: l.name, acct: id, per: l.per, amount: a, left, counts: pt.start, spent: pt.spent, src: l }; }).filter(Boolean);
      const fid = freeSrc && moneyAcct(lineAcct(freeSrc)), fa = freeSrc && amountOf(freeSrc, freeSrc.per);
      const free = freeSrc && fa != null ? { name: 'Free to spend', acct: fid, per: freeSrc.per, amount: fa, left: leftOf('free', fid, fa), src: freeSrc } : null;
      if (free) free.counts = partsOf.free.start;
      return { lines, free };
    }
    const planLeft = planNow();

    // ----- the period in the answer [F8, T1, AU4, AU5; WIRING_PLAN 1.4 step 2] -----
    // start: the day the period running now started; end: the day before the next period-starting pay lands, or today
    // while that pay is due or late and not ticked (`waitingForPay`); startsWith: the occurrence of the pay that started it
    if (periodStream) {
      const n = nowPeriod();
      // [F4, H8, F3, G4] its next pay: the first pay after the one that started it not ticked yet. Coming (today or
      // later), late (past its day, inside its posting window, still counted) or not seen (after the window, no longer
      // counted). While it is due, late or not seen the period runs to today: its end is never a day already past.
      // [S1] On the day it is due and counted (G4) `payToday` says so, so the screens never write the period as "10 Nov
      // to 10 Dec" beside a safe to spend that runs to the pay after it (safeToSpend.until).
      const next = pays.filter(o => !o.settled && (n.start === null || o.land > n.start)).sort((x, z) => x.land - z.land)[0];
      const waiting = !!next && next.land <= today;
      const state = !next ? null : next.land >= today ? 'coming' : nextPays.includes(next) ? 'late' : 'notSeen';
      res.period = {
        start: n.start === null ? null : dayStr(n.start),
        end: next ? dayStr(waiting ? today : next.land - 1) : n.end === null ? null : dayStr(Math.max(today, n.end - 1)),
        startsWith: n.occ, waitingForPay: waiting, payToday: !!next && next.land === today && !leftToday(next),
        nextPay: next ? { occ: next.id, due: dayStr(next.due), state } : null,
        // [QC F5, B2] amount: the line's full amount a period; counts: the part that counts in this period (less when it
        // started mid-period); spent; left = counts - spent; over: how far past it, taken from safe to spend
        lines: (planLeft.lines || []).map(l => ({ id: l.src.id, name: l.name, acct: l.acct, per: l.per, amount: l.amount, left: l.left, counts: l.counts, spent: l.spent, over: Math.max(0, -l.left) })),
        free: planLeft.free ? { acct: planLeft.free.acct, per: planLeft.free.per, amount: planLeft.free.amount, left: planLeft.free.left, counts: planLeft.free.counts } : null };
    } else res.period = null;   // [B4] no fixed pay: no periods
    // [periods.js] opts.periods: every period gone by, oldest first, each counted only from what is dated inside it, with
    // everything heard of by the day asked (a spend logged late, a check-in on pay day whose stretch reaches back)
    if (opts.periods && periodStream) {
      const starts = periodStartDays.slice().sort((x, z) => x - z), occAt = Object.assign({}, occByStart);
      // [AU7] the period holding the opening starts by its pay (inside the opening, so never ticked)
      const held = firstOpenDay > -Infinity ? pays.find(o => o.id === occOn(null, firstOpenDay)) : null;
      if (held && starts.length && startDayOf(held) < starts[0]) { starts.unshift(startDayOf(held)); occAt[startDayOf(held)] = held.id; }
      res.periods = [];
      for (let i = 0; i + 1 < starts.length; i++) {
        const win = { start: starts[i], end: starts[i + 1] - 1, occ: occAt[starts[i]], next: starts[i + 1] };
        if (win.end < win.start) continue;
        const pl = planNow(win), out = x => ({ amount: x.amount, start: x.left.start, spent: x.left.start - x.left.left, left: x.left.left });
        res.periods.push({ start: dayStr(win.start), end: dayStr(win.end), startsWith: win.occ,
          lines: (pl.lines || []).map(l => Object.assign({ id: l.src.id, name: l.name, acct: l.acct, per: l.per }, out(l))),
          free: pl.free ? Object.assign({ acct: pl.free.acct, per: pl.free.per }, out(pl.free)) : null });
      }
      // the period running now in the same shape (what it started with and what is spent so far)
      const pn = planNow({ now: true }), outN = x => ({ amount: x.amount, start: x.left.start, spent: x.left.start - x.left.left, left: x.left.left });
      res.periodNow = { lines: (pn.lines || []).map(l => Object.assign({ id: l.src.id, name: l.name, acct: l.acct, per: l.per }, outN(l))),
        free: pn.free ? Object.assign({ acct: pn.free.acct, per: pn.free.per }, outN(pn.free)) : null };
    }

    // ----- the horizon [SCHEMA 10.3, B4] -----
    let horizon;
    if (periodStream) { const second = nextPays[1] || nextPays[0]; horizon = Math.max(second ? second.land : today, today + HORIZON_MIN_DAYS); }
    else {
      horizon = today + HORIZON_MIN_DAYS;
      for (const s of schedules.filter(x => x.kind !== 'income')) { const fut = items.filter(o => o.sid === s.id && !o.settled && o.land >= today); if (fut[1]) horizon = Math.max(horizon, fut[1].land); }
    }
    res.horizon = dayStr(horizon);

    // ----- planned spending of later periods [B1, B3, B4, 10.4, H9] -----
    // A period gets a line's amount when its `per` matches; `month` with pay that is not monthly gets monthly x 12 over the
    // year's pays, the leftover on the earliest; `week` gets days x amount / 7, rounded down [SCHEMA 8].
    // `occId` names the pay that starts the period, when known (a period started without its pay keeps its name [T1]).
    function perPeriod(x, startDay, endDay, occId) {
      if (x.amount == null) return null;   // [BJ2] no amount in that period
      if (x.per === 'week') return Math.floor(x.amount * (endDay - startDay) / 7);
      if (x.per === 'month' && periodStream) {
        const o = occId ? pays.find(p => p.id === occId) : pays.find(p => p.land === startDay);
        const oc = !o && occId ? I.occurrence(occId) : null;
        const due = o ? o.due : oc && oc.schedule === periodStream.id ? dayNum(oc.due) : null;
        const sh = due === null ? null : S.monthShare(periodStream, calOf(periodStream.acct), due, x.amount, monthCache);
        if (sh) return sh.amount;
      }
      return x.amount;
    }
    function plannedFor(id) {
      const list = [];
      const lines = (planLeft.lines || []).filter(l => l.acct === id);
      if (planLeft.free && planLeft.free.acct === id) lines.push(planLeft.free);
      if (!lines.length) return list;
      if (periodStream) {
        // [AU4] every pay the walk counts (due today or later) brings its period's lines on the day it lands; [BH1] a late
        // pay is not counted and its period has not started, so it brings none
        const starts = nextPays.filter(p => p.land >= today && !leftToday(p)).sort((x, z) => x.land - z.land);
        starts.forEach((p, i) => {
          const end = starts[i + 1] ? starts[i + 1].land : p.land + 30;
          for (const l of lines) list.push({ land: Math.max(p.land, today), amount: perPeriod({ per: l.per, amount: periodAmount(l.src, p.land, p.id) }, p.land, end, p.id), label: l.name + ' for the period from ' + short(p.land) });
        });
      } else {
        // [B4, M9, M10] no fixed pay: by day. A monthly amount x 12 / the year's days a day, rounded down, the rest of each
        // month's own share on its last day; a weekly one a seventh a day, the rest on the seventh day.
        for (const l of lines) {
          for (let d = today + 1; d <= today + LATER_ON_DAYS; d++) {
            const [y, mo] = ymOf(d), yearDays = dayIn(y + 1, 1, 1) - dayIn(y, 1, 1);
            let want;
            if (l.per === 'week') {
              // [N4, AS9, AV5] a week ends on the seventh day counted from the line's `from` (day 1), else its account's setup day
              const f = l.src && l.src.from ? dayNum(l.src.from) : openEv[l.acct] ? openDay(l.acct) : today + 1;
              const day7 = (((d - f) % 7) + 7) % 7 === 6; want = Math.floor(l.amount / 7) + (day7 ? l.amount - 7 * Math.floor(l.amount / 7) : 0); }
            else {
              const perDay = Math.floor(l.amount * 12 / yearDays), monthDays = dayIn(y, mo + 1, 1) - dayIn(y, mo, 1);
              want = perDay + (d === dayIn(y, mo, 'last') ? Math.floor(l.amount * 12 * monthDays / yearDays) - perDay * monthDays : 0);
            }
            if (want) list.push({ land: d, amount: want, label: l.name + ' (by day)' });
          }
        }
      }
      return list;
    }

    // ----- the walk, one account at a time [B3, B9, F1, F2, F3, F9, F14, H5, H7, H8, Q2, Q4, S4, T3, T4, V2] -----
    // [BM2] `real`: the real-money walk, the bank's own money only (pays, bills, card payments, moves): no goals, no plan
    // lines. Below zero and under the minimum are judged on it; the full walk (goals and plan lines off) is what can be spared.
    function walk(id, end, minimum, real) {
      const start = banks[id].bank;
      const why = [{ label: acct[id].name + ' today', amount: start }];
      let bal = start;
      const placeLeft = {};
      if (!real) for (const g of keptIn[id] || []) { bal -= g.amount; placeLeft[g.id] = g.amount; why.push({ label: g.label || g.name + ', kept in it', amount: -g.amount }); }
      if (periodStream && !real) for (const l of (planLeft.lines || []).filter(x => x.acct === id && x.left)) { const left = Math.max(0, l.left); bal -= left; why.push({ label: l.name + ' left this period', amount: -left }); }
      const steps = [];
      for (const o of items) {
        if (o.settled) continue;
        // [BH1, replaces H8 for safe to spend] money not yet seen never counts: a pay past its day and not ticked (late or
        // not seen) is left out of the walk until it is ticked; a pay due today counts [G4]
        if (o.kind === 'income' && o.acct === id && !o.otherCur && o.land >= today && !leftToday(o) && o.land <= end)
          steps.push({ day: o.land, order: 0, amount: o.amount, label: o.name + ' ' + short(o.land), pay: true });
        if (o.kind === 'loan' && cur(o.card) !== cur(id)) continue;   // [V2] warned below
        if ((o.kind === 'bill' || o.kind === 'transfer' || o.kind === 'auto' || o.kind === 'loan') && o.acct === id && o.land <= end) {
          const fromIt = o.place && placeLeft[o.place] ? Math.min(placeLeft[o.place], o.amount) : 0;   // [H7] the place's money first
          if (fromIt) placeLeft[o.place] -= fromIt;
          steps.push({ day: Math.max(o.land, today), order: 1, amount: -(o.amount - fromIt), label: o.name + ' ' + short(o.land) + (o.land < today ? ', late' : ''), fromPlace: fromIt ? { place: o.place, amount: fromIt } : undefined });
        }
        if (o.kind === 'transfer' && o.to === id && o.land >= today && o.land <= end) steps.push({ day: o.land, order: 0, amount: o.amount2 != null ? o.amount2 : o.amount, label: o.name + ' in ' + short(o.land) });
      }
      for (const cid in cards) {
        if (cards[cid].payFrom !== id || cur(cid) !== cur(id)) continue;   // [H5] another currency: warned below
        for (const w of cards[cid].walkItems) {
          if (!w.amount) continue;
          if (w.future && w.land > end) continue;
          const day = Math.min(Math.max(w.land, today), end);   // [F14] beyond the horizon: off at its end
          steps.push({ day, order: 1, amount: -Math.max(0, w.amount), label: w.label + ', paid ' + short(w.land) + (w.land > end ? ', taken at the horizon end' : ''), card: cid });
        }
      }
      for (const pa of Object.values(acct).filter(x => x.of && cards[x.of] && cards[x.of].payFrom === id && cur(x.of) === cur(id))) {   // [S4]
        let left = loans[pa.id] ? loans[pa.id].owedNow : 0;
        for (const pt of planParts(pa)) {
          if (pt.due <= knownTo || pt.due <= openDay(pa.of) || (openEv[pa.id] && pt.due <= openDay(pa.id)) || left <= 0) continue;
          const amt = Math.min(pt.amount, left);
          left -= amt;
          if (pt.due <= end) steps.push({ day: Math.max(pt.due, today), order: 1, amount: -amt, label: pa.name + ', part posted ' + short(pt.due) });
        }
      }
      if (!real) for (const p of plannedFor(id)) if (p.land <= end) steps.push({ day: p.land, order: 2, amount: -p.amount, label: p.label });
      steps.sort((a, b) => a.day - b.day || a.order - b.order);
      let low = bal, lowDay = today, lowAt = 0, firstBelowZero = null, belowBal = null;
      // [B1, QC numbers] the first day the bank ends under its minimum (or zero) and how far under then, and the first
      // pay that brings money in after that day: the shortfall is named by that day, never by a lower point later
      let firstUnder = bal < minimum ? { day: today, amount: minimum - bal } : null, payAfter = null;
      for (let i = 0; i < steps.length; i++) {
        bal += steps[i].amount;
        if (firstUnder && payAfter === null && steps[i].pay && steps[i].amount > 0 && steps[i].day > firstUnder.day) payAfter = steps[i].day;
        if (steps[i + 1] && steps[i + 1].day === steps[i].day) continue;   // the end of a day
        if (bal < low) { low = bal; lowDay = steps[i].day; lowAt = i + 1; }
        if (bal < 0 && firstBelowZero === null) { firstBelowZero = steps[i].day; belowBal = bal; }
        if (bal < minimum && firstUnder === null) firstUnder = { day: steps[i].day, amount: minimum - bal };
      }
      for (let i = 0; i < lowAt; i++) why.push({ label: steps[i].label, amount: steps[i].amount });
      why.push({ label: 'minimum', amount: -minimum });
      // [BL3] the first pay that brings money in after the lowest point: the sum's own total is short before it
      const payAfterLow = (steps.slice(lowAt).find(x => x.pay && x.amount > 0 && x.day > lowDay) || {}).day;
      return { lowest: low, lowestDay: lowDay, headroom: low - minimum, why, firstBelowZero, belowBal, firstUnder, payAfter, payAfterLow: payAfterLow == null ? null : payAfterLow, start, steps };
    }

    const backsGoal = id => places.some(g => g.keptIn && g.keptIn.acct === id && g.keptIn.mode === 'ownAccount' && removedOn(g) === null);
    // [T watch, AP1, AO6, AR3] One reopen rule: any record dated after the closing day that reaches the account reopens it,
    // money in or out; a check does when its figure is other than zero. A record on the closing day reopens nothing.
    const touches = (e, id) => e.account === id || e.from === id || e.to === id;
    const reopened = id => closedOn(id) !== null && live().some(e => e.day > closedOn(id) && touches(e, id)
      && (e.k === 'check' ? e.a !== 0 : delta(e, id) !== 0));
    const realWalks = {};
    for (const id in banks) {
      const isClosed = closedOn(id) !== null && !reopened(id);
      if (reopened(id)) res.warnings.push({ account: id, code: 'reopened', text: `${acct[id].name} was closed; money came into it, so it is open again` });
      if (isClosed && banks[id].bank !== 0) throw new Error(`${acct[id].name} is closed with ${fmt(banks[id].bank, cur(id))} in it: a closing is refused unless its figure is zero or moved out [P6]`);
      const a = acct[id], minimum = isClosed ? 0 : minimumOf(id);
      const w = walk(id, horizon, minimum), rw = walk(id, horizon, minimum, true);
      const r = res.accounts[id] = {
        bank: banks[id].bank, asOf: dayStr(banks[id].asOfDay), ageDays: today - banks[id].asOfDay,
        checked: banks[id].checked, loggedIn: banks[id].loggedIn, loggedOut: banks[id].loggedOut,
        currency: a.cur, minimum, lowest: w.lowest, lowestDay: dayStr(w.lowestDay), headroom: w.headroom,
        spendFrom: isClosed ? false : a.spendFrom != null ? a.spendFrom : !!SPEND_TYPES[a.type] && a.cur === home && !backsGoal(id),
        why: whyText(w.why, w.headroom, a.cur), whyParts: w.why.map(p => ({ label: p.label, amount: p.amount })), fillers: banks[id].fillers };   // [S4] the parts, for screens/money.js sumLine
      // [BM2] the real-money walk: its lowest point, and its sum for the screens (the "Short by" headline is its total)
      r.real = { lowest: rw.lowest, lowestDay: dayStr(rw.lowestDay), headroom: rw.headroom, whyParts: rw.why.map(p => ({ label: p.label, amount: p.amount })) };
      // [BL2] what is set aside in it today (goals and other kept places), and what it can still set aside: today's figure
      // less that, never below nothing
      r.setAside = (keptIn[id] || []).reduce((t, g) => t + g.amount, 0);
      r.canSetAside = Math.max(0, r.bank - r.setAside);
      realWalks[id] = rw;
      if (id === mainAcct && mainMinOtherCur()) res.warnings.push({ account: id, code: 'minimum_other_currency', text: `The minimum kept for ${a.name} is in ${main.min.cur}, not ${a.cur}: what is its minimum in ${a.cur}?` });
      // [QC fix] data for the screens to word (account, amount, day, minimum or null for none); the text is only for Ask's
      // summary, and says "below zero" when there is no minimum, with the day as "1 Jan", never an ISO day
      // [B1] named by the first day under and how far under then; a lower point after it is `later`, with its own day
      // [BM2] from the real-money walk only: goals and plan lines never make the bank "go below zero"
      if (rw.headroom < 0) {
        const f = rw.firstUnder, lower = -rw.headroom > f.amount && rw.lowestDay !== f.day ? { day: dayStr(rw.lowestDay), amount: -rw.headroom } : undefined;
        res.warnings.push(Object.assign({ account: id, code: 'below_minimum', day: dayStr(f.day), amount: f.amount, short: f.amount, minimum: minimum || null },
          lower ? { later: lower } : {}, { payAfter: rw.payAfter === null ? null : dayStr(rw.payAfter), payAfterLow: rw.payAfterLow === null ? null : dayStr(rw.payAfterLow),
            text: minimum ? `${a.name} goes ${fmt(f.amount, a.cur)} below its minimum of ${fmt(minimum, a.cur)} on ${short(f.day)}` : `${a.name} goes ${fmt(f.amount, a.cur)} below zero on ${short(f.day)}` }));
      }
      // [BM2] goals holding more than the bank can spare (after bills, card payments and plan lines): their own warning,
      // named by the first day the full walk goes under and how much of the goals' money is over then (never more than
      // they hold); a lower point later is `later`. Data for screens/status.js to word.
      const kept = (keptIn[id] || []).filter(g => g.amount > 0);
      if (w.headroom < 0 && r.setAside > 0 && kept.length) {
        const f = w.firstUnder, first = Math.min(r.setAside, f.amount), most = Math.min(r.setAside, -w.headroom);
        const placesOver = kept.map(g => ({ place: g.id, name: g.name })).filter((g, i, all) => all.findIndex(x => x.place === g.place) === i);
        const who = placesOver.length === 1 ? placesOver[0].name + "'s money" : 'The money set aside for ' + placesOver.map(g => g.name).join(' and ');
        res.warnings.push(Object.assign({ account: id, code: 'set_aside_over', day: dayStr(f.day), amount: first, places: placesOver },
          most > first && w.lowestDay !== f.day ? { later: { day: dayStr(w.lowestDay), amount: most } } : {},
          { text: `${who} is ${fmt(first, a.cur)} more than ${a.name} can spare on ${short(f.day)}` }));
      }
      const later = walk(id, today + LATER_ON_DAYS, 0, true);   // [B11; BM2: the real-money walk]
      if (later.firstBelowZero !== null && later.firstBelowZero > horizon) res.laterOn.push({ account: id, day: dayStr(later.firstBelowZero), balance: later.belowBal, amount: -later.belowBal, minimum: null,
        text: `Later on: ${a.name} goes below zero in ${MONTHS[+dayStr(later.firstBelowZero).slice(5, 7) - 1]} ${dayStr(later.firstBelowZero).slice(0, 4)}` });
    }
    for (const id in banks) {
      if (banks[id].askAgain !== null) res.warnings.push({ account: id, code: 'check_again', day: dayStr(banks[id].askAgain), text: `The ${acct[id].name} figure of ${short(banks[id].askAgain)} was wrong: what does it show now?` });   // [Z1]
      const g = banks[id].lastGap;
      if (g && largeGain(id, g) && g.answer !== 'right') res.warnings.push({ account: id, code: 'gain_to_ask', day: dayStr(g.day), gain: g.gain, text: `${acct[id].name} shows ${fmt(g.gain, cur(id))} more than the app had: was that figure right?` });
    }
    for (const id in cards) {
      const k = cards[id];
      // [BL5] a card paid more than it owed is in credit by that much (credit 0 otherwise)
      res.cards[id] = { owedNow: k.owedNow, credit: Math.max(0, -k.owedNow), next: k.next, overdue: k.overdue, statements: k.statements.map(s => ({ closed: s.closed != null ? dayStr(s.closed) : undefined, amount: s.amount, payment: dayStr(s.land), paid: s.paid })), fillers: k.fillers };
      if (acct[k.payFrom] && cur(id) !== cur(k.payFrom)) res.warnings.push({ account: k.payFrom, card: id, code: 'card_other_currency', text: `${acct[id].name} (${cur(id)}) is paid from ${acct[k.payFrom].name} (${cur(k.payFrom)}): it is not taken off safe to spend until it is paid` });   // [H5]
    }
    for (const id in loans) {
      res.owed[id] = { owedNow: loans[id].owedNow, next: loans[id].next, overdue: loans[id].overdue };
      const from = loans[id].payFrom;
      if (from && acct[from] && cur(id) !== cur(from)) res.warnings.push({ account: from, loan: id, code: 'loan_other_currency', text: `${acct[id].name} (${cur(id)}) is paid from ${acct[from].name} (${cur(from)}): it is not taken off safe to spend until it is paid` });   // [V2]
    }

    // ----- safe to spend: one headline [F9, B9, G2, A1] -----
    const homeSpend = Object.keys(res.accounts).filter(id => res.accounts[id].spendFrom && res.accounts[id].currency === home);
    const up = homeSpend.reduce((t, id) => t + Math.max(0, res.accounts[id].headroom), 0);
    const shortfalls = Object.keys(res.accounts).filter(id => res.accounts[id].currency === home).reduce((t, id) => t + Math.max(0, -res.accounts[id].headroom), 0);
    const cap = planLeft.free && planLeft.free.left != null ? planLeft.free.left : null;
    const raw = up - shortfalls;
    const oldest = Object.keys(res.accounts).reduce((d, id) => Math.min(d, dayNum(res.accounts[id].asOf)), today);
    res.safeToSpend = { headline: Math.max(0, cap === null ? raw : Math.min(cap, raw)), shortfall: Math.max(0, -raw), cappedByFreeToSpend: cap !== null && cap < raw, oldestInput: dayStr(oldest) };
    // [BL3, replaces B1 for the headline] what the screens say when short: the amount is the sum's own total (how far
    // the account's walk ends under its minimum, or zero), before the first pay that brings money in after its lowest
    // point (null when none does); the first day it goes under is named beside it (`day`), with how far under then (`first`)
    const firstWarn = res.warnings.filter(w => w.code === 'below_minimum' && res.accounts[w.account].currency === home).sort((x, z) => (x.day < z.day ? -1 : x.day > z.day ? 1 : 0))[0];
    // [BM2] from the real-money walk: its own total (accounts[].real.headroom, whose sum is accounts[].real.whyParts)
    res.safeToSpend.short = firstWarn ? { account: firstWarn.account, day: firstWarn.day, amount: -res.accounts[firstWarn.account].real.headroom, minimum: firstWarn.minimum,
      beforePay: firstWarn.payAfterLow, first: firstWarn.amount } : null;
    // [BJ5] when Free to spend caps the headline, the sum under it ends with the cap, so the two figures never disagree
    // [S6, QC numbers] Free to spend left below zero: the sum takes off all that the accounts can spare and says how far
    // over (`over` on that part, and safeToSpend.freeOver), never hides it; the sum still adds up
    const over = res.safeToSpend.cappedByFreeToSpend && cap < 0 ? -cap : null;
    if (over !== null) res.safeToSpend.freeOver = over;
    res.safeToSpend.why = !res.safeToSpend.cappedByFreeToSpend ? null : over !== null && raw <= 0 ? `Free to spend is ${fmt(over, home)} over this period` : over !== null
      ? `${fmt(raw, home)} (what your accounts can spare) - ${fmt(raw, home)} (Free to spend is ${fmt(over, home)} over this period) = ${fmt(res.safeToSpend.headline, home)}`
      : `${fmt(raw, home)} (what your accounts can spare) - ${fmt(raw - cap, home)} (more than Free to spend left this period) = ${fmt(res.safeToSpend.headline, home)}`;
    res.safeToSpend.whyParts = !res.safeToSpend.cappedByFreeToSpend ? null : over !== null
      ? [{ label: 'what your accounts can spare', amount: Math.max(0, raw) }, { label: 'Free to spend is over this period', amount: -Math.max(0, raw), over }]
      : [{ label: 'what your accounts can spare', amount: raw }, { label: 'more than Free to spend left this period', amount: -(raw - cap) }];

    // ----- days to next pay [F3, F8, F12, F13, H8] -----
    const np = nextPays[0];
    res.daysToNextPay = np ? { days: Math.max(0, np.land - today), next_pay: dayStr(np.land), item: np.id, late: np.land < today || undefined } : { days: null };
    if (!periodStream) {   // [B4] "lasts about N weeks"
      const lastDay = homeSpend.map(id => walk(id, today + LATER_ON_DAYS, res.accounts[id].minimum).firstBelowZero);
      res.lastsAboutWeeks = planLeft.lines || planLeft.free ? Math.floor((Math.min(...lastDay.map(d => (d === null ? today + LATER_ON_DAYS : d))) - today) / 7) : null;
    }

    // ----- due before next pay [F7, F13, F21, F23, H8, W2] -----
    // [G4] a pay due today and not ticked counts as coming in today, and its period's lines come off with it (AU4): the
    // list runs to the pay after it, so it holds what the walk takes off before that pay. [BH1] While the next pay is
    // late it is not counted, so the list runs to the pay after it too (late-03 under BH1). What is past its day and not
    // settled is in mayStillPost and notSeenYet.
    const after = np && np.land <= today ? nextPays.find(p => p.land > today) : np;
    const until = after ? after.land : today + NO_PAY_DUE_DAYS;
    const due = items.filter(o => isOut(o) && !o.settled && o.land >= today && o.land < until && o.amount).sort((a, b) => a.land - b.land || (a.acct < b.acct ? -1 : 1));
    const byAccount = {}; for (const o of due) (byAccount[o.acct] = byAccount[o.acct] || []).push(o.id);
    // [S1, G4, BH1] the pay safe to spend runs to: the next one, or on its day (counted) or while it is late, the one after
    res.safeToSpend.until = after ? dayStr(after.land) : null;
    res.safeToSpend.untilPay = after ? after.id : null;
    // [BJ1] a pay due today left unticked at a check-in today is not counted: named so the heading can say so
    res.safeToSpend.notCounting = np && leftToday(np) ? np.id : null;
    res.dueBeforeNextPay = { until: dayStr(until), byAccount, items: due.map(itemOut), total: due.filter(o => !o.otherCur).reduce((t, o) => t + o.amount, 0) };

    // ----- not seen yet, and still inside the posting window [F3, F4, F23, G3, H8, S6, W2, Z2] -----
    const past = items.filter(o => !o.settled && o.land < today && fallsDue(o) && o.amount);
    const late = past.filter(o => today > windowEnd(o) && !stillExpected(o)).sort((a, b) => a.land - b.land);
    res.notSeenYet = { items: late.map(o => Object.assign(itemOut(o), { direction: o.kind === 'income' ? 'in' : 'out' })),
      money_in: late.filter(o => o.kind === 'income' && !o.otherCur).reduce((t, o) => t + o.amount, 0),
      money_out: late.filter(o => isOut(o) && !o.otherCur).reduce((t, o) => t + o.amount, 0) };
    res.mayStillPost = past.filter(o => today <= windowEnd(o) || stillExpected(o)).map(o => Object.assign(itemOut(o), today <= windowEnd(o) ? { postsBy: dayStr(windowEnd(o)) } : { stillExpected: true }));

    // ----- each bank after its cards are paid [NORTH_STAR, BK1, BK3; refines BB2] -----
    // Per bank, dated, from the walk's own steps. D1 is the earliest unpaid card payment from the bank (an overdue one
    // is taken today); N is the first counted pay landing after D1; the day is the last card payment on or after D1 and
    // on or before N's day (BK5: the pay counted first, the walk's order). It starts from the bank today, adds the counted pays and takes off bills, moves, loan parts and card
    // payments up to that day; never plan lines, never goals (money set aside in the bank stays in it and is named).
    // A late or not seen pay is not counted (BH1) and is named; close days "not sure" are named (all on the card is
    // taken); the lowest end of day below zero before the day is given as a dip.
    res.bankAfterCards = {};
    for (const id in banks) {
      if (!res.accounts[id]) continue;
      const w = walk(id, horizon, 0), real = w.steps.filter(x => x.order !== 2);
      const cardSteps = real.filter(x => x.card && x.amount < 0);
      if (!cardSteps.length) continue;
      const d1 = Math.min(...cardSteps.map(x => x.day));
      const n = real.find(x => x.pay && x.amount > 0 && x.day > d1);
      const inStretch = cardSteps.filter(x => x.day >= d1 && (!n || x.day <= n.day));   // [BK5] on N's own day too, the pay first
      const last = Math.max(...inStretch.map(x => x.day));
      let bal = w.start, dip = null;
      const upTo = real.filter(x => x.day <= last);
      for (let i = 0; i < upTo.length; i++) {
        bal += upTo[i].amount + (upTo[i].fromPlace ? -upTo[i].fromPlace.amount : 0);
        if (upTo[i + 1] && upTo[i + 1].day === upTo[i].day) continue;
        if (upTo[i].day < last && bal < 0 && (!dip || -bal > dip.amount)) dip = { day: dayStr(upTo[i].day), amount: -bal };
      }
      const usedFrom = {}; for (const x of upTo) if (x.fromPlace) usedFrom[x.fromPlace.place] = (usedFrom[x.fromPlace.place] || 0) + x.fromPlace.amount;
      const setAside = (keptIn[id] || []).map(g => ({ place: g.id, name: g.name, amount: g.amount - (usedFrom[g.id] || 0) })).filter(g => g.amount > 0);
      const cardIds = [...new Set(inStretch.map(x => x.card))];
      const notCounted = items.filter(o => o.kind === 'income' && o.acct === id && !o.otherCur && !o.settled && o.amount && o.land <= last && (o.land < today || leftToday(o)) && fallsDue(o));
      res.bankAfterCards[id] = { day: dayStr(last), amount: bal, currency: cur(id),
        cardDays: [...new Set(inStretch.map(x => x.day))].sort((x, z) => x - z).map(dayStr), cards: cardIds,
        pays: [...new Set(upTo.filter(x => x.pay).map(x => x.day))].map(dayStr), billsTaken: upTo.filter(x => !x.card && !x.pay && x.amount < 0).length,
        paysNotCounted: notCounted.map(o => ({ item: o.id, due: dayStr(o.land) })), ifAllTaken: cardIds.some(c => cards[c].cardItems.some(x => x.statement === 'all owed')),
        setAside, dip };
    }

    // ----- total [F10, F11, O6] -----
    const ids = Object.keys(res.accounts);
    const homeTotal = ids.filter(id => res.accounts[id].currency === home).reduce((t, id) => t + res.accounts[id].bank, 0);
    const beside = {};
    for (const id of ids) if (res.accounts[id].currency !== home) beside[res.accounts[id].currency] = (beside[res.accounts[id].currency] || 0) + res.accounts[id].bank;
    const cardsOwed = Object.keys(cards).filter(id => cur(id) === home).reduce((t, id) => t + cards[id].owedNow, 0);
    res.total = { amount: homeTotal, beside, afterCards: homeTotal - cardsOwed };

    // ----- the check-in list [A1, A2, S6, U2, W2, X3] -----
    const bankIds = Object.keys(banks);
    const lastCheckIn = bankIds.length ? Math.min(...bankIds.map(id => banks[id].asOfDay)) : today;
    // [A2, X3] every expected item that has landed and is not settled or skipped stays on the list, also one left
    // unticked at an earlier check-in (an item inside the opening is settled by it, unless setup said "not yet")
    const listed = items.filter(o => !o.settled && o.land <= today && fallsDue(o) && o.amount);
    const matched = items.filter(o => settledBy[o.id] && settledBy[o.id].byImport && o.land > lastCheckIn && o.land <= today && o.amount);
    res.checkIn = { since: dayStr(lastCheckIn), toConfirm: listed.filter(o => !o.otherCur).map(itemOut), apart: listed.filter(o => o.otherCur).map(itemOut), matched: matched.map(itemOut) };
    return res;
  }

  function itemOut(o) { return { item: o.id, lands: dayStr(o.land), amount: o.amount, account: o.acct, statement: o.kind === 'card' ? o.statement : undefined, currency: o.otherCur ? o.currency : undefined }; }
  // The walk as a sum a person can check: "312,000 (bank today) - 100,000 (trip) ... = 17,000".
  function whyText(parts, result, cur) {
    return parts.filter(p => p.amount !== 0 || p.label === 'minimum').map((p, i) => {
      const sign = p.amount < 0 || p.label === 'minimum' ? '- ' : i ? '+ ' : '';
      return `${sign}${fmt(Math.abs(p.amount), cur)} (${p.label.replace(/[()]/g, '')})`;
    }).join(' ') + ' = ' + fmt(result, cur);
  }

  /* [BI2] the one way to count what happened: the book's live records, less those the look ahead (`res`, its answer for
     the day) set aside as matched to another record. Receipts and the past periods both list through this. */
  function countOnce(book, res) {
    const away = (res && res.dropped) || {};
    return (book.events || []).filter(e => e && !e.gone && !Object.prototype.hasOwnProperty.call(away, e.id));
  }
  const api = { lookahead, countOnce };
  if (node) module.exports = api;
  else (root.BurrowEngine = root.BurrowEngine || {}).lookahead = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
