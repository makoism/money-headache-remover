/* Undo of an action is exact, also after the save that follows it. Made-up numbers.
   Found with act_keep.js (LANE_act_keep.md): the save that follows an Undo carried the undone value back in from the stored copy, as if
   it were a field from a newer version (keepUnknown): the bank date after Undo of the balance, and the first card after Undo of adding it.
   Run: node tests/qc/act_undo_exact.js      Ends with "ACT UNDO EXACT PASS" or "ACT UNDO EXACT FAIL n". */
let bad = 0; const ck = (n, c, x) => { console.log(c ? 'PASS' : 'FAIL', n, c ? '' : (x === undefined ? '' : x)); if (!c) bad++; };
const L = require('./lib_r12.js'); const w = L.R.w;
(async () => {
  const { b, p, errs } = await L.start({ w: 390, h: 844, dpr: 1, mobile: true, keep: true });
  ck('the page gives tests the ACT door', await p.evaluate(() => !!(window.__t && __t.ACT)));
  const stored = () => p.evaluate(() => JSON.parse(localStorage.getItem('money-map-template-v2') || '{}'));
  await p.evaluate(() => { delete __t.S.cfg.bankAt; delete __t.S.cards; __t.S.cfg.bankStart = 1500; __t.persist(); }); await w(900);
  let s = await stored(); ck('start: no bank date and no cards saved', s.cfg.bankAt === undefined && s.cards === undefined, JSON.stringify([s.cfg.bankAt, s.cards]));
  await p.evaluate(() => __t.ACT.setBalance(1800)); await w(900);
  s = await stored(); ck('the balance and its date are saved', s.cfg.bankStart === 1800 && !!s.cfg.bankAt);
  await p.evaluate(() => __t.ACT.undo()); await w(900);
  s = await stored(); ck('Undo of the balance: the balance is back and the date is not left behind (' + s.cfg.bankAt + ')', s.cfg.bankStart === 1500 && s.cfg.bankAt === undefined);
  await p.evaluate(() => __t.ACT.setCard(null, { name: 'Card one', owed: 420, payDay: 10 })); await w(900);
  s = await stored(); ck('the first card is saved', Array.isArray(s.cards) && s.cards.length === 1);
  await p.evaluate(() => __t.ACT.undo()); await w(900);
  s = await stored(); ck('Undo of adding the first card: no card is left behind', !s.cards || s.cards.length === 0, JSON.stringify(s.cards));
  await p.reload(); await w(1600);
  ck('and after a reload there is still no card and no bank date', await p.evaluate(() => (!__t.S.cards || !__t.S.cards.length) && __t.S.cfg.bankAt === undefined));
  /* a field a newer version saved is still carried over (the reason keepUnknown exists) */
  await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('money-map-template-v2')); d.cfg.futureThing = 7; d.futureList = [1, 2]; d.rev = Date.now() + 5; localStorage.setItem('money-map-template-v2', JSON.stringify(d)); });
  await p.reload(); await w(1600); await p.evaluate(() => __t.ACT.setName('Robin')); await w(900);
  s = await stored(); ck('a field from a newer version still survives a save', s.cfg.futureThing === 7 && Array.isArray(s.futureList), JSON.stringify([s.cfg.futureThing, s.futureList]));
  /* a late Undo of a removal keeps the receipts logged since; an Undo in the visit lets the kept copy go */
  const gid = await p.evaluate(() => __t.S.plan.goals[0].id), gname = await p.evaluate(() => __t.S.plan.goals[0].name);
  await p.evaluate(id => __t.ACT.removeGoal(id), gid); await w(900);
  ck('removing a burrow keeps a copy of before', await p.evaluate(() => !!(__t.S.ui.keep && __t.S.ui.keep.act)));
  await p.evaluate(() => __t.ACT.addReceipts([{ d: '2026-11-20', a: 12, c: 'envelope', n: 'Made-up later receipt' }])); await w(900);
  await p.reload(); await w(1800);
  const bar = await p.evaluate(() => !document.getElementById('undoBar').hidden ? document.getElementById('undoTxt').textContent : '');
  ck('after a reload Undo is offered and says what happened ("' + bar + '")', /removed/i.test(bar) && /undo/i.test(bar));
  await p.evaluate(() => document.getElementById('undoGo').click()); await w(900);
  const back = await p.evaluate(id => ({ goal: !!__t.S.plan.goals.find(g => g.id === id), rc: __t.S.receipts.some(r => r.n === 'Made-up later receipt') }), gid);
  ck('Undo brings the burrow "' + gname + '" back', back.goal);
  ck('and the receipt logged after the removal is still there', back.rc);
  await p.evaluate(id => __t.ACT.removeGoal(id), gid); await w(300); await p.evaluate(() => __t.ACT.undo()); await w(900);
  ck('an Undo in the same visit lets the kept copy go, so it is not offered again later', await p.evaluate(() => !__t.S.ui.keep));
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();
  console.log(bad ? 'ACT UNDO EXACT FAIL ' + bad : 'ACT UNDO EXACT PASS'); process.exit(bad ? 1 : 0);
})();
