/* The one status every screen reads (DECISIONS_ROUND2 C, sweep2_repeats A1 and B2, LESSONS lesson 2). It is worked out
   from the engine's result only (SCHEMA_V3 section 12: safe to spend, warnings, next pay, not seen yet, the check-in
   list), so Home, Plan, setup and every sheet say the same thing about the same money. No screen writes its own verdict:
   a screen shows status.text, or picks its own words by status.state and status.reason.code, nothing else.

   statusOf(result, ctx) -> frozen { state, level, reason, next, also, underlying, text }
     ctx.currency  the home currency code (required; amounts in the words are written in it)
     ctx.origin    'typed' or 'sample' (required, from provenance.js): sample numbers are never judged as the person's
     ctx.names     { accountId: 'Main bank' } for the words, optional
     ctx.staleDays a bank figure older than this asks for a check-in (7 until Mako says otherwise)
     ctx.oldDays   a bank figure older than this leads with "Check your bank", above a pay not in yet (14) [N26]

   One state, in this order (the first that is true wins, the rest go in `also` so they can sit under it):
     sample > empty > short > warning > set_aside > plan_over > question > check (old) > late > check > zero > no_free > ok
   check (old) [N26]: the last bank check is over ctx.oldDays old, so a pay "not in yet" is only a guess; the check leads
   plan_over [LISTFIX A2]: the real money is fine (no short, no warning) but the plan lines need more than the accounts
   can spare, so nothing is safe to spend; it says so and by how much, never "it turns safe once your pay is in"
   no_free [north star F1]: a pay period with neither Free to spend nor a budget line, so safe to spend leaves nothing
   for food and everyday things; Home asks for it in place of "Fine for now" and links to Plan's Set Free to spend
   Plain browser JavaScript. In a page it is BurrowScreens.status (load money.js and names.js first). */
(function (root, make) {
  const dep = n => (typeof module === 'object' && module.exports ? require('./' + n + '.js') : root.BurrowScreens[n]);
  const m = make(dep('money'), dep('names'));
  if (typeof module === 'object' && module.exports) module.exports = m;
  else (root.BurrowScreens = root.BurrowScreens || {}).status = m;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (money, names) {
  'use strict';

  const OLD_DAYS = 14;    // [N26] past this, "Check your bank" leads, above "Pay not in yet"
  const STALE_DAYS = 7;   // for Mako: how old a bank figure may get before the status asks for a check-in
  /* [C3, M47] short and under a minimum (or below zero) are 'warn', plain amber: never 'bad', never red */
  const LEVEL = { sample: 'wait', empty: 'wait', short: 'warn', warning: 'warn', set_aside: 'bad', plan_over: 'bad', question: 'wait', late: 'wait', check: 'wait', zero: 'wait', no_free: 'wait', ok: 'good' };
  /* engine warning codes (lookahead_ref.js): which change the state, which are notes under it */
  const WARNING_STATE = { below_minimum: 'warning', set_aside_over: 'set_aside', check_again: 'question', gain_to_ask: 'question', minimum_other_currency: 'question' };
  const NOTE_ONLY = ['card_other_currency', 'loan_other_currency', 'income_other_currency', 'spend_other_currency', 'reopened', 'revived'];

  /* every word the status says, all drafts for Mako's copy pass (VOICE: one-line notes have no full stop) */
  const W = (text) => ({ text, forMako: true });
  const WORDS = {
    'state.sample': W('Sample numbers'),
    'state.empty': W('No bank figure yet'),
    'state.short': W('Not safe to spend'),
    'state.warning': W('Under a minimum'),
    'state.set_aside': W('Set aside more than you can spare'),
    'state.plan_over': W('Your plan needs more than you have'),
    'state.question': W('A question for you'),
    'state.late': W('Pay not in yet'),
    'state.check': W('Check your bank'),
    'state.zero': W('Nothing safe to spend yet'),
    'state.no_free': W('Add your everyday spending'),
    'state.ok': W('Fine for now'),
    'reason.sample_numbers': W('These numbers are made up - put yours in to see your own'),
    'reason.no_figures': W('There\'s no bank figure yet'),
    'reason.short': W('You\'re short by {amount}'),
    'reason.short_on': W('You\'re short by {amount} on {day}'),
    'reason.short_before': W('You\'re short by {amount} before pay on {until}, below zero from {day}'),
    'reason.short_before_min': W('You\'re short by {amount} before pay on {until}, below your minimum from {day}'),
    'reason.short_from': W('You\'re short by {amount}, below zero from {day}'),
    'reason.short_from_min': W('You\'re short by {amount}, below your minimum from {day}'),
    'reason.below_minimum': W('{account} goes {amount} under its minimum on {day}'),
    'reason.below_zero': W('{account} goes {amount} below zero on {day}'),
    'reason.set_aside_over': W('{who} is {amount} more than {account} can spare on {day}'),
    'reason.plan_over': W('Your plan lines need {amount} more than your bank can spare. It runs short from {day}'),
    'reason.plan_over_no_day': W('Your plan lines need {amount} more than your bank can spare'),
    'reason.gain_to_ask': W('{account} has more in it than the app expected'),
    'reason.check_again': W('Check {account} again'),
    'reason.minimum_other_currency': W('What\'s the minimum for {account} in its own currency'),
    'reason.unknown_warning': W('Something about {account} needs a look'),
    'reason.pay_late': W('Your pay due {since} isn\'t in yet'),
    'reason.to_confirm_one': W('1 thing to tick off since {since}'),
    'reason.to_confirm_many': W('{count} things to tick off since {since}'),
    'reason.old_figure': W('Your bank figure is from {since}'),
    'reason.nothing_safe': W('Nothing\'s safe to spend until pay on {until}'),
    'reason.nothing_safe_no_pay': W('Nothing\'s safe to spend right now'),
    'reason.free_used_up': W('Free to spend is used up until pay on {until}'),
    'reason.no_free': W('Add what you spend on everyday things so safe to spend leaves room for it'),
    'reason.safe': W('{amount} is safe to spend until pay on {until}'),
    'reason.safe_no_pay': W('{amount} is safe to spend'),
    'next.put_yours_in': W('Put your numbers in'),
    'next.check_in': W('Check your bank'),
    'next.move_money_in': W('Move money in before {day}'),
    'next.move_money_in_now': W('Move money in or spend less'),
    'next.plan_over': W('Lower a plan line, or move money in'),
    'next.move_from': W('Move {amount} from {from} to {account} by {day}. {from} can spare it'),
    'next.answer': W('Answer the question'),
    'next.take_out_or_move_in': W('Take some out of a goal, or move money in'),
    'next.check_in_when_it_lands': W('Check in when it lands'),
    'next.wait_for_pay': W('It turns safe once your pay is in'),
    'next.log_money_in': W('Log money in when it comes'),
    'next.set_free': W('Set Free to spend'),
    /* the engine's warnings, worded here from their data (account, amount, day, minimum or none), never its text */
    'warn.below_zero': W('{account} goes {amount} below zero on {day}'),
    'warn.below_zero_now': W('{account} is below zero today. Everything here counts from what it shows'),   // [M47, K29] the bank itself is under: said as it is, in amber, no shame
    'warn.below_minimum': W('{account} goes {amount} below its minimum of {minimum} on {day}'),
    'warn.later_on': W('Later on: {account} goes below zero in {month}'),
    'warn.later_low_zero': W('Later on: {account} goes {amount} below zero on {day}'),
    'warn.later_low_minimum': W('Later on: {account} goes {amount} below its minimum of {minimum} on {day}'),
    'warn.set_aside_over': W('{who} is {amount} more than {account} can spare on {day}'),
    'warn.later_set_aside_over': W('Later on: {who} is {amount} more than {account} can spare on {day}'),
    'warn.check_again': W('The {account} figure of {day} was wrong: what does it show now'),
    'warn.gain_to_ask': W('{account} shows {amount} more than the app had: was that figure right'),
    'warn.reopened': W('{account} was closed, but money came into it, so it is open again'),
    'warn.revived': W('{account} was removed, but money was logged on it on another device, so it is back'),
    'warn.revived_item': W('{name} was removed, but something logged on another device uses it, so it is back'),
    'warn.minimum_other_currency': W('The minimum kept for {account} is in another currency: what is its minimum in its own'),
    'warn.card_other_currency': W('{card} is paid from {account} in another currency: it is not taken off safe to spend until it is paid'),
    'warn.loan_other_currency': W('{loan} is paid from {account} in another currency: it is not taken off safe to spend until it is paid'),
    'warn.income_other_currency': W('A pay into {account} is in another currency: it is not counted until it arrives'),
    'warn.spend_other_currency': W('A spend from {account} in another currency is listed apart: it is not counted yet'),
    'warn.unknown': W('Something about {account} needs a look'),
  };

  function fill(key, p, ctx) {
    const w = WORDS[key];
    if (!w) throw new Error('status: no words for ' + key);
    /* one sentence, one way of writing cents: when one amount in it has cents, every amount does (money.formatter) */
    const code = p.currency || ctx.currency;
    const amounts = ['amount', 'minimum'].map(k => p[k]).filter(v => typeof v === 'number');
    const fmt = amounts.length && code ? money.formatter(code, amounts) : null;
    return w.text.replace(/\{(\w+)\}/g, (all, k) => {
      const v = p[k];
      if (v === undefined || v === null) throw new Error('status: ' + key + ' needs ' + k);
      if (k === 'amount' || k === 'minimum') return fmt(v);
      if (k === 'day' || k === 'since' || k === 'until') return names.dayLabel(v);
      if (k === 'month') return names.monthLabel(v);
      if (k === 'account' || k === 'card' || k === 'loan' || k === 'from') return (ctx.names && ctx.names[v]) || 'an account';
      return String(v);
    });
  }
  function reasonKey(r) {
    if (r.code === 'below_minimum' && !r.minimum) return 'reason.below_zero';
    if (r.code === 'short' && r.short) return r.until ? (r.short.minimum ? 'reason.short_before_min' : 'reason.short_before') : r.short.minimum ? 'reason.short_from_min' : 'reason.short_from';
    if (r.code === 'short') return r.day ? 'reason.short_on' : 'reason.short';
    if (r.code === 'to_confirm') return r.count === 1 ? 'reason.to_confirm_one' : 'reason.to_confirm_many';
    if (r.code === 'plan_over') return r.day ? 'reason.plan_over' : 'reason.plan_over_no_day';
    if (r.code === 'nothing_safe') return r.until ? 'reason.nothing_safe' : 'reason.nothing_safe_no_pay';
    if (r.code === 'safe') return r.until ? 'reason.safe' : 'reason.safe_no_pay';
    return 'reason.' + r.code;
  }
  function nextKey(n) { return n.code === 'move_money_in' && !n.day ? 'next.move_money_in_now' : 'next.' + n.code; }

  /* every condition that is true, in the order above; the first one is the state */
  function conditions(r, ctx) {
    const out = [];
    const accounts = r.accounts || {};
    const stp = r.safeToSpend || {};
    const pay = r.daysToNextPay || {};
    /* [C8] the pay safe to spend runs to (safeToSpend.until): on pay day that is the pay after today's, never today */
    const until = stp.until || pay.next_pay || null;
    const warnings = r.warnings || [];
    const below = warnings.filter(w => w.code === 'below_minimum').sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0));
    if (!Object.keys(accounts).length) out.push({ state: 'empty', reason: { code: 'no_figures' }, next: { code: 'check_in' } });
    /* [BM2] short only when the real money is: the engine's short (or a below-zero warning) comes from the real-money
       walk; a shortfall from goals or plan lines alone is the goals' own warning, or nothing safe to spend */
    if (stp.shortfall > 0 && (stp.short || below.length)) {
      /* [BL3] the engine's short (safeToSpend.short): the headline's amount, the sum's own total, before the pay after the
         lowest point; money moves in before the first day under */
      const sh = stp.short || null, day = sh ? sh.day : below.length ? below[0].day : null;
      out.push({ state: 'short', reason: Object.assign({ code: 'short', amount: sh ? sh.amount : stp.shortfall, currency: ctx.currency, day }, sh ? { short: sh } : {}, sh && sh.beforePay ? { until: sh.beforePay } : {}), next: { code: 'move_money_in', day }, note: below.length ? 'below_minimum' : 'short' });
    }
    for (const w of below) out.push({ state: 'warning', reason: { code: 'below_minimum', account: w.account, amount: w.amount != null ? w.amount : w.short, currency: (accounts[w.account] || {}).currency || ctx.currency, day: w.day, minimum: minimumOf(w, accounts) }, next: { code: 'move_money_in', day: w.day }, note: 'below_minimum' });
    for (const w of warnings) {
      if (w.code === 'below_minimum' || NOTE_ONLY.includes(w.code)) continue;
      /* [BM2] goals holding more than the bank can spare: the money is short against the goals, never the bank */
      if (w.code === 'set_aside_over') { out.push({ state: 'set_aside', reason: { code: 'set_aside_over', who: whoOf(w), account: w.account, amount: w.amount, currency: (accounts[w.account] || {}).currency || ctx.currency, day: w.day }, next: { code: 'take_out_or_move_in' }, note: 'set_aside_over' }); continue; }
      const known = WARNING_STATE[w.code];
      out.push({ state: known || 'question', reason: known ? { code: w.code, account: w.account } : { code: 'unknown_warning', warning: w.code, account: w.account }, next: { code: 'answer' }, note: w.code });
    }
    /* [LISTFIX A2] the plan lines alone need more than the accounts can spare: the bank itself does not go under (no
       short, no below-zero warning) and no goal holds too much, so the shortfall is the plan's */
    if (stp.shortfall > 0 && !stp.short && !below.length && !warnings.some(w => w.code === 'set_aside_over'))
      out.push({ state: 'plan_over', reason: { code: 'plan_over', amount: stp.shortfall, currency: ctx.currency, day: planShortDay(accounts, ctx.currency) }, next: { code: 'plan_over' }, note: 'plan_over' });
    /* [N26] the last bank check is old: checking the bank comes before a pay that only looks late */
    const oldAfter = ctx.oldDays == null ? OLD_DAYS : ctx.oldDays;
    const veryOld = Object.keys(accounts).some(id => accounts[id].ageDays > oldAfter);
    if (veryOld) out.push({ state: 'check', reason: { code: 'old_figure', since: stp.oldestInput }, next: { code: 'check_in' }, note: 'old_figure' });
    const paySeen = (r.notSeenYet && r.notSeenYet.items || []).find(i => i.direction === 'in');
    if (pay.late || paySeen) out.push({ state: 'late', reason: { code: 'pay_late', since: pay.late ? pay.next_pay : paySeen.lands }, next: { code: 'check_in_when_it_lands' }, note: 'pay_late' });
    const toConfirm = (r.checkIn && r.checkIn.toConfirm) || [];
    if (toConfirm.length) out.push({ state: 'check', reason: { code: 'to_confirm', count: toConfirm.length, since: r.checkIn.since }, next: { code: 'check_in' }, note: 'to_confirm' });
    const stale = ctx.staleDays == null ? STALE_DAYS : ctx.staleDays;
    if (!veryOld && Object.keys(accounts).some(id => accounts[id].ageDays > stale)) out.push({ state: 'check', reason: { code: 'old_figure', since: stp.oldestInput }, next: { code: 'check_in' }, note: 'old_figure' });
    if (Object.keys(accounts).length && stp.headline === 0) {
      out.push({ state: 'zero', reason: { code: stp.cappedByFreeToSpend && until ? 'free_used_up' : 'nothing_safe', until }, next: until ? { code: 'wait_for_pay', until } : { code: 'log_money_in' } });
    }
    const per = r.period;
    if (Object.keys(accounts).length && stp.headline > 0 && per && !per.free && !(per.lines || []).some(l => l.amount)) out.push({ state: 'no_free', reason: { code: 'no_free' }, next: { code: 'set_free' }, note: 'no_free' });
    if (Object.keys(accounts).length && stp.headline > 0) out.push({ state: 'ok', reason: { code: 'safe', amount: stp.headline, currency: ctx.currency, until, capped: !!stp.cappedByFreeToSpend }, next: null });
    for (const w of warnings) if (NOTE_ONLY.includes(w.code)) out.push({ note: w.code });
    if ((r.laterOn || []).length) out.push({ note: 'later_on' });
    return out;
  }

  /* [LISTFIX2 A2] the first day the full walk (plan lines and goals too) runs short, in any account in the home currency
     that cannot spare its share: the engine's accounts[].firstUnder; never the next pay, which may come before it */
  function planShortDay(accounts, currency) {
    let day = null;
    for (const id of Object.keys(accounts)) {
      const a = accounts[id];
      if (a.currency !== currency || !(a.headroom < 0) || !a.firstUnder) continue;
      if (day === null || a.firstUnder < day) day = a.firstUnder;
    }
    return day;
  }
  /* the minimum a warning is measured against, or null for none (zero): the engine's own field, else the account's */
  function minimumOf(w, accounts) {
    const m = w.minimum !== undefined ? w.minimum : (accounts[w.account] || {}).minimum;
    return m ? m : null;
  }
  /* [BM2] whose money a set_aside_over warning names: "Trip's money", or "The money set aside for Trip and House" */
  function whoOf(w, lower) {
    const n = (w.places || []).map(p => p.name);
    if (n.length === 1) return `${n[0]}'s money`;
    return `${lower ? 'the' : 'The'} money set aside for ${n.length ? n.join(' and ') : 'your goals'}`;
  }
  /* one engine warning in words: from its data only, so no raw ISO day and no engine text reaches a screen.
     ctx: { currency, names: { id: name }, accounts (the engine's, for each account's currency) } */
  function warningText(w, ctx) {
    ctx = ctx || {};
    const accounts = ctx.accounts || {};
    const currency = (accounts[w.account] || {}).currency || ctx.currency;
    if (w.code === 'below_minimum') {
      const minimum = minimumOf(w, accounts), amount = w.amount != null ? w.amount : w.short;
      /* [M47, K29] the bank figure itself is below zero (the engine's own figure for it, nothing worked out here) */
      const under = !minimum && (accounts[w.account] || {}).bank < 0;
      return fill(minimum ? 'warn.below_minimum' : under ? 'warn.below_zero_now' : 'warn.below_zero', { account: w.account, amount, minimum, day: w.day, currency }, ctx);
    }
    if (w.code === 'set_aside_over') return fill('warn.set_aside_over', { who: whoOf(w), account: w.account, amount: w.amount, day: w.day, currency }, ctx);
    if (w.code === 'check_again') return fill('warn.check_again', { account: w.account, day: w.day }, ctx);
    if (w.code === 'gain_to_ask') return fill('warn.gain_to_ask', { account: w.account, amount: w.gain, currency }, ctx);
    if (w.code === 'revived') return w.account ? fill('warn.revived', { account: w.account }, ctx) : fill('warn.revived_item', { name: w.name || 'Something' }, ctx);   // [BZ3]
    if (w.code === 'card_other_currency') return fill('warn.card_other_currency', { account: w.account, card: w.card }, ctx);
    if (w.code === 'loan_other_currency') return fill('warn.loan_other_currency', { account: w.account, loan: w.loan }, ctx);
    if (WORDS['warn.' + w.code]) return fill('warn.' + w.code, { account: w.account }, ctx);
    return fill('warn.unknown', { account: w.account }, ctx);
  }
  /* [LISTFIX C1] an account going under while another can spare the money: which one to move it from, how much (the
     lowest it goes, its later low when there is one) and by which day. The account that can spare the most is named,
     from the engine's full walk (accounts[].headroom: money set aside for goals and plan lines are not spare;
     LISTFIX2), only when it can spare all of it; '' otherwise.
     ctx: { currency, names, accounts (the engine's) } */
  function moveText(w, ctx) {
    ctx = ctx || {};
    if (!w || w.code !== 'below_minimum') return '';
    const accounts = ctx.accounts || {}, own = accounts[w.account] || {};
    const amount = w.later && w.later.amount > (w.amount != null ? w.amount : w.short) ? w.later.amount : w.amount != null ? w.amount : w.short;
    let best = null;
    for (const id of Object.keys(accounts)) {
      const a = accounts[id];
      if (id === w.account || !a.spendFrom || a.currency !== own.currency || !(a.headroom >= amount)) continue;
      if (!best || a.headroom > accounts[best].headroom) best = id;
    }
    if (!best) return '';
    return fill('next.move_from', { amount, from: best, account: w.account, day: w.day, currency: own.currency || ctx.currency }, ctx);
  }
  /* one "later on" entry in words: the month it goes below zero, as "Mar 2027" */
  /* capParts(result, fmt): the parts of the sum under safe to spend when Free to spend caps it, each with the words a
     person reads (LISTFIX B3, BM3, S6). One place: Home writes them and the assistant is sent them, so "why is it that
     much?" gets the screen's own sum (M36, M51). fmt(minor) writes an amount in the home currency. Nothing is added up
     here: every amount is the engine's (safeToSpend.whyParts, .headline, period.free.left). null when nothing caps it. */
  function capParts(r, fmt) {
    const s = r.safeToSpend, w = s.whyParts;
    if (!w) return null;
    const all = s.headline === 0 ? 'all of it: ' : '';
    return w.map((x, i) => (x.over ? Object.assign({}, x, { label: `${all}Free to spend is ${fmt(x.over)} over this period` })
      : i > 0 && all && r.period && r.period.free && r.period.free.left === 0 ? Object.assign({}, x, { label: `${all}Free to spend is used up this period` })
      : i > 0 && !all ? Object.assign({}, x, { label: `held back: Free to spend has only ${fmt(s.headline)} left this period` }) : x));
  }
  function laterText(l, ctx) { return fill('warn.later_on', { account: l.account, month: l.day }, ctx || {}); }
  /* [B1] a below-minimum warning's lower point after its first day under, in words with its own day; '' when none */
  function laterLowText(w, ctx) {
    ctx = ctx || {};
    if (!w || (w.code !== 'below_minimum' && w.code !== 'set_aside_over') || !w.later) return '';
    const accounts = ctx.accounts || {}, minimum = minimumOf(w, accounts);
    if (w.code === 'set_aside_over') return fill('warn.later_set_aside_over', { who: whoOf(w, true), account: w.account, amount: w.later.amount, day: w.later.day, currency: (accounts[w.account] || {}).currency || ctx.currency }, ctx);
    return fill(minimum ? 'warn.later_low_minimum' : 'warn.later_low_zero', { account: w.account, amount: w.later.amount, minimum, day: w.later.day, currency: (accounts[w.account] || {}).currency || ctx.currency }, ctx);
  }

  function deepFreeze(o) { Object.values(o).forEach(v => { if (v && typeof v === 'object') deepFreeze(v); }); return Object.freeze(o); }

  function statusOf(r, ctx) {
    ctx = ctx || {};
    if (ctx.origin !== 'typed' && ctx.origin !== 'sample') throw new Error('status: ctx.origin must be "typed" or "sample" (provenance.js), got ' + JSON.stringify(ctx.origin));
    if (typeof ctx.currency !== 'string') throw new Error('status: ctx.currency (the home currency code) is required');
    const all = conditions(r || {}, ctx);
    const states = all.filter(c => c.state);
    const top = states[0] || { state: 'empty', reason: { code: 'no_figures' }, next: { code: 'check_in' } };
    const also = all.filter(c => c !== top && c.note).map(c => c.note).filter((x, i, a) => a.indexOf(x) === i && x !== top.note);
    let s = { state: top.state, level: LEVEL[top.state], reason: top.reason, next: top.next, also, underlying: null };
    if (ctx.origin === 'sample') s = { state: 'sample', level: LEVEL.sample, reason: { code: 'sample_numbers' }, next: { code: 'put_yours_in' }, also: [], underlying: top.state };
    s.text = { state: WORDS['state.' + s.state].text, reason: fill(reasonKey(s.reason), s.reason, ctx), next: s.next ? fill(nextKey(s.next), s.next, ctx) : null };
    return deepFreeze(s);
  }

  /* [coordinator, slice 10] the one question before a figure far from what the app expected is saved (engine/checkin.js
     farFigure gives the rule): Check your bank, the Checks sheet and the assistant all ask it in these words */
  function farText(far, typed, fmt) { return `That is ${fmt(far.by)} ${far.dir} than expected. Is ${fmt(typed)} right?`; }
  return { statusOf, capParts, warningText, farText, laterText, laterLowText, moveText, WORDS, STALE_DAYS, OLD_DAYS };
});
