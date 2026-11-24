/* ---------- Home: "If no more pay came, your money lasts about N weeks" (stage 2 S1, STAGE2_PLAN 2.1) ----------
   One line under safe to spend, with a "?" and the engine's sum behind it (res.runway, lookahead's `runway` option).
   It names the account (the one that runs out first when there are several), never "your money". With no fixed pay the "Lasts about" line already says
   this (lastsWords3), so this line is for a life with a pay day. This file words and places; it never adds, takes away
   or rounds (tests: no_maths.js, e3_runway.js). Words are drafts for Mako's copy pass (FOR_MAKO.md). */
function runwayWords3(r, yr) {
  const x = r.runway;
  if (!x || !r.period) return '';
  const span = x.more ? 'a year or more' : x.weeks === 0 ? 'less than a week' : `about ${x.weeks} ${x.weeks === 1 ? 'week' : 'weeks'}`;
  const keep = x.minimum ? ', keeping your minimum' : '';
  /* [qc-foundation on S1, fix 2] the account is named, never "your money", until accounts are added together */
  const who = `${x.several ? ', the first of your accounts to run out' : ''}${(x.leftOut || []).length ? '. Money in other currencies is left out' : ''}`;   // [second review, watch]
  const head = `<div class="a3-head"><p class="a3-sub" data-fig="runway" data-weeks="${esc3(x.more ? 'more' : x.weeks)}" data-day="${esc3(x.day || '')}" data-acct="${esc3(x.account)}">If no more pay came, ${esc3(E3.nameOf(x.account))} lasts ${esc3(span)}${esc3(keep)}${esc3(who)}</p>${HELP3.button('runway')}</div>${HELP3.text('runway')}`;
  if (x.more) return head;
  /* "would", never "goes below zero": that is said only of the real walk (BM2, e3_warnwords J) */
  const under = x.minimum ? 'would go under its minimum' : 'would run out';
  return head + `<p class="a3-sum" data-fig="runwaywhy">${esc3(E3.nameOf(x.account))} ${under} on ${esc3(day3(x.day, yr))}: ${esc3(sum3(x.parts, x.total, E3.curOf(x.account)))}</p>`;
}
