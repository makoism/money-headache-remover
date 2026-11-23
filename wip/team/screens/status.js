/* The one status every screen reads (DECISIONS_ROUND2 C, sweep2_repeats A1 and B2, LESSONS lesson 2). It is worked out
   from the engine's result only (SCHEMA_V3 section 12: safe to spend, warnings, next pay, not seen yet, the check-in
   list), so Home, Plan, setup and every sheet say the same thing about the same money. No screen writes its own verdict:
   a screen shows status.text, or picks its own words by status.state and status.reason.code, nothing else.

   statusOf(result, ctx) -> frozen { state, level, reason, next, also, underlying, text }
     ctx.currency  the home currency code (required; amounts in the words are written in it)
     ctx.origin    'typed' or 'sample' (required, from provenance.js): sample numbers are never judged as the person's
     ctx.names     { accountId: 'Main bank' } for the words, optional
     ctx.staleDays a bank figure older than this asks for a check-in (7 until Mako says otherwise)

   One state, in this order (the first that is true wins, the rest go in `also` so they can sit under it):
     sample > empty > short > warning > question > late > check > zero > ok
   Plain browser JavaScript. In a page it is BurrowScreens.status (load money.js and names.js first). */
(function (root, make) {
  const dep = n => (typeof module === 'object' && module.exports ? require('./' + n + '.js') : root.BurrowScreens[n]);
  const m = make(dep('money'), dep('names'));
  if (typeof module === 'object' && module.exports) module.exports = m;
  else (root.BurrowScreens = root.BurrowScreens || {}).status = m;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (money, names) {
  'use strict';

  const STALE_DAYS = 7;   // for Mako: how old a bank figure may get before the status asks for a check-in
  const LEVEL = { sample: 'wait', empty: 'wait', short: 'bad', warning: 'bad', question: 'wait', late: 'wait', check: 'wait', zero: 'wait', ok: 'good' };
  /* engine warning codes (lookahead_ref.js): which change the state, which are notes under it */
  const WARNING_STATE = { below_minimum: 'warning', check_again: 'question', gain_to_ask: 'question', minimum_other_currency: 'question' };
  const NOTE_ONLY = ['card_other_currency', 'loan_other_currency', 'income_other_currency', 'spend_other_currency', 'reopened'];

  /* every word the status says, all drafts for Mako's copy pass (VOICE: one-line notes have no full stop) */
  const W = (text) => ({ text, forMako: true });
  const WORDS = {
    'state.sample': W('Sample numbers'),
    'state.empty': W('No bank figure yet'),
    'state.short': W('Not safe to spend'),
    'state.warning': W('Under a minimum'),
    'state.question': W('A question for you'),
    'state.late': W('Pay not in yet'),
    'state.check': W('Time to check in'),
    'state.zero': W('Nothing safe to spend yet'),
    'state.ok': W('Fine for now'),
    'reason.sample_numbers': W('These numbers are made up - put yours in to see your own'),
    'reason.no_figures': W('There\'s no bank figure yet'),
    'reason.short': W('You\'re short by {amount}'),
    'reason.short_on': W('You\'re short by {amount} on {day}'),
    'reason.below_minimum': W('{account} goes {amount} under its minimum on {day}'),
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
    'reason.safe': W('{amount} is safe to spend until pay on {until}'),
    'reason.safe_no_pay': W('{amount} is safe to spend'),
    'next.put_yours_in': W('Put your numbers in'),
    'next.check_in': W('Check your bank'),
    'next.move_money_in': W('Move money in before {day}'),
    'next.move_money_in_now': W('Move money in or spend less'),
    'next.answer': W('Answer the question'),
    'next.check_in_when_it_lands': W('Check in when it lands'),
    'next.wait_for_pay': W('It turns safe once your pay is in'),
    'next.log_money_in': W('Log money in when it comes'),
  };

  function fill(key, p, ctx) {
    const w = WORDS[key];
    if (!w) throw new Error('status: no words for ' + key);
    return w.text.replace(/\{(\w+)\}/g, (all, k) => {
      const v = p[k];
      if (v === undefined || v === null) throw new Error('status: ' + key + ' needs ' + k);
      if (k === 'amount') return money.format(v, p.currency || ctx.currency);
      if (k === 'day' || k === 'since' || k === 'until') return names.dayLabel(v);
      if (k === 'account') return (ctx.names && ctx.names[v]) || v;
      return String(v);
    });
  }
  function reasonKey(r) {
    if (r.code === 'short') return r.day ? 'reason.short_on' : 'reason.short';
    if (r.code === 'to_confirm') return r.count === 1 ? 'reason.to_confirm_one' : 'reason.to_confirm_many';
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
    const until = pay.next_pay || null;
    const warnings = r.warnings || [];
    const below = warnings.filter(w => w.code === 'below_minimum').sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0));
    if (!Object.keys(accounts).length) out.push({ state: 'empty', reason: { code: 'no_figures' }, next: { code: 'check_in' } });
    if (stp.shortfall > 0) {
      const day = below.length ? below[0].day : null;
      out.push({ state: 'short', reason: { code: 'short', amount: stp.shortfall, currency: ctx.currency, day }, next: { code: 'move_money_in', day }, note: below.length ? 'below_minimum' : 'short' });
    }
    for (const w of below) out.push({ state: 'warning', reason: { code: 'below_minimum', account: w.account, amount: w.short, currency: (accounts[w.account] || {}).currency || ctx.currency, day: w.day }, next: { code: 'move_money_in', day: w.day }, note: 'below_minimum' });
    for (const w of warnings) {
      if (w.code === 'below_minimum' || NOTE_ONLY.includes(w.code)) continue;
      const known = WARNING_STATE[w.code];
      out.push({ state: known || 'question', reason: known ? { code: w.code, account: w.account } : { code: 'unknown_warning', warning: w.code, account: w.account }, next: { code: 'answer' }, note: w.code });
    }
    const paySeen = (r.notSeenYet && r.notSeenYet.items || []).find(i => i.direction === 'in');
    if (pay.late || paySeen) out.push({ state: 'late', reason: { code: 'pay_late', since: pay.late ? pay.next_pay : paySeen.lands }, next: { code: 'check_in_when_it_lands' }, note: 'pay_late' });
    const toConfirm = (r.checkIn && r.checkIn.toConfirm) || [];
    if (toConfirm.length) out.push({ state: 'check', reason: { code: 'to_confirm', count: toConfirm.length, since: r.checkIn.since }, next: { code: 'check_in' }, note: 'to_confirm' });
    const stale = ctx.staleDays == null ? STALE_DAYS : ctx.staleDays;
    if (Object.keys(accounts).some(id => accounts[id].ageDays > stale)) out.push({ state: 'check', reason: { code: 'old_figure', since: stp.oldestInput }, next: { code: 'check_in' }, note: 'old_figure' });
    if (Object.keys(accounts).length && stp.headline === 0) {
      out.push({ state: 'zero', reason: { code: stp.cappedByFreeToSpend && until ? 'free_used_up' : 'nothing_safe', until }, next: until ? { code: 'wait_for_pay', until } : { code: 'log_money_in' } });
    }
    if (Object.keys(accounts).length && stp.headline > 0) out.push({ state: 'ok', reason: { code: 'safe', amount: stp.headline, currency: ctx.currency, until, capped: !!stp.cappedByFreeToSpend }, next: null });
    for (const w of warnings) if (NOTE_ONLY.includes(w.code)) out.push({ note: w.code });
    if ((r.laterOn || []).length) out.push({ note: 'later_on' });
    return out;
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

  return { statusOf, WORDS, STALE_DAYS };
});
