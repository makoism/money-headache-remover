/* The 38.29 to 38.31 screen rules for one month of the Plan tab, recounted from the plain words (none of the app's code).
   Used by monkey.js; display.js carries the same rules inline (keep the two in step when a screen rule changes). r is the oracle row (oracle.js), S the saved plan. */
module.exports = function expectMonth({ S, O, r, ym, M, oraclePercents, F, F2 }) {
  const cents = x => Math.round(x * 100);
  const minBank = M.cfg(S, 'minBank'), st = r.bankEnd < minBank ? 'short' : (r.left < 0 ? 'tight' : 'good');
  let dk = r.left - r.draw; if (dk > 0) dk = Math.max(0, dk - r.overNow);
  const playSpentC = (S.receipts || []).filter(x => x.d.slice(0, 7) === ym && (S.plan.lines.find(q => q.key === x.c) || {}).jar === 'play').reduce((a, x) => a + cents(x.a), 0);
  const pLeft = Math.round(r.jar.play * 100 - playSpentC) / 100, held = st === 'short' && !(Math.round((r.bankEnd - r.bankStart) * 100) > 0) ?   /* 38.31 money accuracy round: held unless the month really adds to the bank (it was: left < 0 or past plan, which let a month adding nothing show Free to spend next to Short) */  Math.min(Math.max(0, pLeft), Math.max(0, minBank - r.bankEnd))
    : r.bankEnd < -0.004 ? Math.min(Math.max(0, pLeft), Math.round(-r.bankEnd * 100) / 100) : 0;   /* and a month that ends below zero is never safe to spend, even when it adds to the bank (the app's QC round 5 numbers 1 rule) */
  const safe = Math.max(pLeft < 0 ? pLeft : 0, Math.round((pLeft - held) * 100) / 100);
  const where = r.draw > 0 ? F2(r.inflow - r.draw) + ' pay and ' + F2(r.draw) + ' borrowed, by place' : F2(r.inflow) + ' pay, by place';   /* 38.31 number gate round 2: to the cent */
  /* with no pay entered and nothing planned past it, the dock shows how far below zero the bank ends, if it does */
  const pin = r.a + r.b + r.side, bankOnly = pin <= 0 && r.left >= 0 && r.bankEnd < 0;
  /* 38.31 novice round 3: with pay entered and every coin placed, the number is left out (the words say "All of your pay has a place") */
  const dock = bankOnly ? F2(-r.bankEnd) : pin > 0 && Math.abs(dk) < 0.005 ? '' : pin > 0 || r.left < 0 ? F2(Math.abs(dk)) : '';
  /* launch checklist Q2 wording: "Bank at month end", the same name as Home, and the start figure it is planned from */
  const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+ym.slice(5) - 1];
  const bank = r.over > 0 ? `Bank at month end: ${F2(r.bankEnd)}. ${F2(r.bankPlanned)} planned, less ${F2(r.over)} spent over plan since your plan started.` : Math.abs(r.bankStart - r.bankEnd) < 0.5 ? `Bank at month end: ${F2(r.bankEnd)} planned, the same as at the start of ${mon}.` : `Bank at month end: ${F2(r.bankEnd)} planned, from ${F2(r.bankStart)} at the start of ${mon}.`;
  const rest = Math.max(0, r.inflow - r.outflow), short = Math.max(0, r.outflow - r.inflow), realPay = r.inflow - r.draw, base = short > 0 ? r.outflow : (r.draw > 0 && realPay > 0 ? realPay : r.inflow);
  /* side A 2026-11-19 and launch checklist Q3, the same rules oracle.js checks, in whole cents: spending past plan is paid first from pay that had no place
     (its own row and percent), then from borrowed emergency money still in the bank; borrowed money it does not use stays in the bank */
  const restCover = Math.min(rest, r.draw), overC = cents(r.overNow), unplacedC = cents(rest) - cents(restCover), usedOverC = Math.min(unplacedC, overC);
  const keptC = Math.max(0, cents(restCover) - Math.max(0, overC - unplacedC)), spentC = cents(restCover) - keptC, usedOver = usedOverC / 100, unplacedNet = (unplacedC - usedOverC) / 100;
  const vals = [r.jar.nec, r.goalsTotal, r.jar.play, r.jar.edu, r.jar.ffa, r.jar.give], pc = oraclePercents(vals.map(cents).concat([unplacedC - usedOverC, usedOverC]), cents(base)), showPct = base > 0 && !(short > 0);
  const say = (p, v) => (p === 0 && v >= 0.005 ? 'under 1%' : p + '%');   /* a piece with money never reads 0% (QC10 numbers should-fix 3) */
  const legend = M.JARS.map((j, i) => [j.name, F2(vals[i]), showPct ? say(pc[i], vals[i]) : '']);
  if (unplacedNet >= 0.5) legend.push(['Not placed yet', F2(unplacedNet), showPct ? say(pc[6], unplacedNet) : '']);
  if (usedOver >= 0.5) legend.push(['Used for spending past plan', F2(usedOver), showPct ? say(pc[7], usedOver) : '']);
  if (rest > 0 && keptC > 0) legend.push(['Borrowed, stays in the bank', F2(keptC / 100), '']);
  if (rest > 0 && spentC > 0) legend.push(['Borrowed, used for spending past plan', F2(spentC / 100), '']);
  const borrowUsed = short > 0 ? 0 : Math.max(0, r.draw - restCover), sumPct = pc.reduce((a, b) => a + b, 0), borrowPct = borrowUsed > 0 && base === realPay ? Math.max(0, sumPct - 100) : 0;
  if (borrowUsed >= 0.5) legend.push(['Borrowed, pays for part of this plan', F2(borrowUsed), showPct && borrowPct > 0 ? borrowPct + '%' : '']);
  if (short > 0) legend.push([r.draw > 0 ? 'Still over after borrowing' : st === 'tight' ? 'Over pay by' : 'Short by', F2(short), '']);
  const pctMustBe100 = showPct && !(r.draw > 0);
  /* 38.31 wording: the amount is at the end of the month picked, and money past the goal is named (a debt is never over); the cap is the
     month's own, since a yes to the longer emergency goal counts from its month (oracle.js QC8 SF5) */
  const isDebt = g => !g.emergency && (((S.ui || {}).gk || {})[g.id] || g.id) === 'debt';
  const goalAmount = g => { if (!(g.target > 0)) return 'No goal amount yet'; const cap = O.cap(g, ym), over = isDebt(g) ? 0 : Math.max(0, Math.round((r.bal[g.id] - cap) * 100) / 100);
    return `${F2(r.bal[g.id])} of ${F2(cap)} by the end of ${mon}` + (over > 0 ? `, ${F2(over)} over the goal` : ''); };   /* to the cent, as the screen writes it */
  /* QC round 10 numbers gate blocker 1: when part is held back, the big figure is the plan left (the line under it gives the safe part) */
  return { st, safe, where, dock, bank, hero: F2(held > 0.004 ? pLeft : safe), legend, pctMustBe100, goalAmount };
};
