/* The 38.29 to 38.31 screen rules for one month of the Plan tab, recounted from the plain words (none of the app's code).
   Used by monkey.js; display.js carries the same rules inline (keep the two in step when a screen rule changes). r is the oracle row (oracle.js), S the saved plan. */
module.exports = function expectMonth({ S, O, r, ym, M, oraclePercents, F, F2 }) {
  const cents = x => Math.round(x * 100);
  const minBank = M.cfg(S, 'minBank'), st = r.bankEnd < minBank ? 'short' : (r.left < 0 ? 'tight' : 'good');
  let dk = r.left - r.draw; if (dk > 0) dk = Math.max(0, dk - r.overNow);
  const playSpentC = (S.receipts || []).filter(x => x.d.slice(0, 7) === ym && (S.plan.lines.find(q => q.key === x.c) || {}).jar === 'play').reduce((a, x) => a + cents(x.a), 0);
  const pLeft = Math.round(r.jar.play * 100 - playSpentC) / 100, held = st === 'short' && !(Math.round((r.bankEnd - r.bankStart) * 100) > 0) ?   /* 38.31 money accuracy round: held unless the month really adds to the bank (it was: left < 0 or past plan, which let a month adding nothing show Free to spend next to Short) */  Math.min(Math.max(0, pLeft), Math.max(0, minBank - r.bankEnd)) : 0;
  const safe = Math.max(pLeft < 0 ? pLeft : 0, Math.round((pLeft - held) * 100) / 100);
  const where = r.draw > 0 ? F(r.inflow - r.draw) + ' pay and ' + F(r.draw) + ' borrowed, by place' : F(r.inflow) + ' pay, by place';
  /* with no pay entered and nothing planned past it, the dock shows how far below zero the bank ends, if it does */
  const pin = r.a + r.b + r.side, bankOnly = pin <= 0 && r.left >= 0 && r.bankEnd < 0;
  const dock = bankOnly ? F(-r.bankEnd) : pin > 0 || r.left < 0 ? F(Math.abs(dk)) : '';
  const bank = r.over > 0 ? `Bank ends at ${F2(r.bankEnd)}: ${F2(r.bankPlanned)} planned, less ${F2(r.over)} spent over plan so far.` : Math.abs(r.bankStart - r.bankEnd) < 0.5 ? `Bank stays at ${F2(r.bankEnd)} this month.` : `Bank goes from ${F2(r.bankStart)} to ${F2(r.bankEnd)} this month.`;
  const rest = Math.max(0, r.inflow - r.outflow), short = Math.max(0, r.outflow - r.inflow), realPay = r.inflow - r.draw, base = short > 0 ? r.outflow : (r.draw > 0 && realPay > 0 ? realPay : r.inflow);
  const restCover = Math.min(rest, r.draw), usedOver = Math.min(Math.max(0, rest - restCover), r.overNow), unplacedNet = Math.round((rest - restCover - usedOver) * 100) / 100;
  const vals = [r.jar.nec, r.goalsTotal, r.jar.play, r.jar.edu, r.jar.ffa, r.jar.give, rest - restCover], pc = oraclePercents(vals, base), showPct = base > 0 && !(short > 0);
  const legend = M.JARS.map((j, i) => [j.name, F(vals[i]), showPct ? pc[i] + '%' : '']);
  if (unplacedNet >= 0.5) legend.push([restCover > 0 || usedOver > 0 ? 'Not placed yet' : 'Left', F(unplacedNet), showPct && usedOver < 0.5 ? pc[6] + '%' : '']);
  if (usedOver >= 0.5) legend.push(['Used for spending past plan', F(usedOver), '']);
  if (rest > 0 && restCover > 0) legend.push(['Borrowed', F(restCover), '']);
  const borrowUsed = short > 0 ? 0 : Math.max(0, r.draw - restCover), sumPct = pc.reduce((a, b) => a + b, 0);
  if (borrowUsed >= 0.5) legend.push(['Borrowed', F(borrowUsed), showPct && base === realPay && sumPct > 100 ? (sumPct - 100) + '%' : '']);
  if (short > 0) legend.push([r.draw > 0 ? 'Still over after borrowing' : st === 'tight' ? 'Over pay by' : 'Short by', F(short), '']);
  const pctMustBe100 = showPct && !(r.draw > 0) && usedOver < 0.5;
  const goalAmount = g => (g.target > 0 ? `${F(r.bal[g.id])} of ${F(O.cap(g))}` : 'No goal amount yet');
  return { st, safe, where, dock, bank, hero: F2(safe), legend, pctMustBe100, goalAmount };
};
