const fs = require('fs');
const src = fs.readFileSync(__dirname + '/model.js', 'utf8');
const api = new Function(src + ';return {cleanSteps,cleanOnce,cleanItems,cleanCfg,validDue,wholePercents,presetState,sampleOf,SAMPLES,presetKey,roundUnit,MONTHS,JARS,jarsOf,calcAll,freshState,blankState,setVal,val,goalInfo,statusOf,fixes,cfg,resetMonth,aimsOf,basePlan,cleanPlan,cleanReceipts,addLine,removeLine,updateLine,addGoal,removeGoal,updateGoal,useSuggested,hasOwnMonthly,trimPlay,undoOnce,receiptStats,receiptsFor,addReceipt,updateReceipt,removeReceipt,catName,nextWeekday,gcalUrl,outlookUrl,reminderTimes,allKeys,emergencyGoal,lineByKey,goalById,MAX_GOALS,MAX_LINES,readyBy};')();
const { cleanSteps, cleanOnce, cleanItems, cleanCfg, validDue, wholePercents, readyBy, presetState, sampleOf, SAMPLES, presetKey, roundUnit, MONTHS, JARS, jarsOf, calcAll, freshState: modelFresh, blankState, setVal, val, goalInfo, statusOf, fixes, cfg, aimsOf, basePlan, cleanPlan, cleanReceipts, addLine, removeLine, updateLine, addGoal, removeGoal, updateGoal, useSuggested, hasOwnMonthly, trimPlay, receiptStats, addReceipt, updateReceipt, removeReceipt, catName, nextWeekday, gcalUrl, outlookUrl, reminderTimes, allKeys, emergencyGoal, lineByKey, goalById, MAX_GOALS } = api;
/* the older 35,000 sample, kept working for saved copies from before the per-currency samples. The checks below were written for it. */
const freshState = () => { const f = modelFresh(); f.ui.preset = 'legacy'; f.plan = basePlan({}); return f; };
let fails = 0;
const sortKeys = x => (x && typeof x === 'object' && !Array.isArray(x) ? Object.keys(x).sort().reduce((o, k) => { o[k] = sortKeys(x[k]); return o; }, {}) : Array.isArray(x) ? x.map(sortKeys) : x);
const eq = (name, a, b) => { const ok = JSON.stringify(sortKeys(a)) === JSON.stringify(sortKeys(b)); if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', name, ok ? '' : JSON.stringify({ got: a, want: b })); };
const S = freshState(), C = calcAll(S), f = ym => C.byYm[ym], J0 = (S0, ym) => jarsOf(S0, calcAll(S0).byYm[ym]);

/* ---------- the sample, checked by hand ---------- */
eq('window is 24 months', MONTHS.length, 24);
eq('bills total is 19,250', f('2026-11').billsTotal, 19250);
eq('money in is one salary', f('2026-11').pool.in, 35000);
eq('Nov goals 1000+500+500+1500', f('2026-11').goalsTotal, 3500);
eq('Nov out uses every peso', f('2026-11').pool.out, 19250 + 3500 + 3500 + 3500 + 1750 + 3500);
eq('Nov left over', f('2026-11').pool.left, 0);
eq('Nov bank end', f('2026-11').bankEnd, 15000);
eq('Nov status', statusOf(S, f('2026-11')), 'good');
eq('jar sums', f('2026-11').jar, { nec: 19250, play: 3500, edu: 3500, ffa: 3500, give: 1750 });

/* ---------- the six jars ---------- */
const J = jarsOf(S, f('2026-11'));
eq('the usual jar shares add to 100%', JARS.reduce((a, j) => a + Math.round(j.usual * 100), 0), 100);
eq('jar names in order', JARS.map(j => j.id), ['nec', 'lts', 'play', 'edu', 'ffa', 'give']);
eq('jar amounts', J.list.map(j => j.v), [19250, 3500, 3500, 3500, 3500, 1750]);
eq('jar shares of income', J.list.map(j => j.pct), [55, 10, 10, 10, 10, 5]);
eq('the shares add to exactly 100 with the left over', J.list.reduce((a, j) => a + j.pct, 0) + J.restPct, 100);
eq('Eker usual shares are carried on each jar', J.list.map(j => j.usual), [55, 10, 10, 10, 10, 5]);
eq('jars cover all the money out', J.list.reduce((a, j) => a + j.v, 0), f('2026-11').pool.out);
eq('blank jars: no income, no shares', (() => { const j = jarsOf(blankState(S), calcAll(blankState(S)).byYm['2026-11']); return [j.income, j.list.every(x => x.v === 0 && x.pct === 0)]; })(), [0, true]);
const SJ = freshState(); setVal(SJ, 'bill:rent', '2026-11', 9000, 'once'); setVal(SJ, 'envelope', '2026-11', 1500, 'once');
eq('bigger rent (paid for with less play money) lifts necessities above 55%', [J0(SJ, '2026-11').list[0].pct, J0(SJ, '2026-11').list.reduce((a, j) => a + j.pct, 0) + J0(SJ, '2026-11').restPct], [61, 100]);
const SJo = freshState(); setVal(SJo, 'bill:rent', '2026-11', 14000, 'once'); const Jo = J0(SJo, '2026-11');
eq('a plan that spends more than the pay shows no left over, says by how much, and its shares still add to 100', [Jo.over, Jo.short, Jo.rest, Jo.list.reduce((a, j) => a + j.pct, 0)], [true, 7000, 0, 100]);
const SC = freshState(); setVal(SC, 'card', '2026-11', 1000, 'once'); setVal(SC, 'envelope', '2026-11', 3000, 'once');
eq('card spending counts as necessities', J0(SC, '2026-11').list.map(j => j.v).slice(0, 3), [20250, 3500, 3000]);
const SA = freshState(); SA.cfg.aims = { nec: 0.5, play: 0.2, give: 0.1 };
eq('jar percentages can change', Object.values(aimsOf(SA)).map(x => Math.round(x * 100)), [50, 10, 20, 10, 10, 10]);
const SA2 = freshState(); SA2.cfg.aims = { nec: 4 }; eq('bad aim values are ignored', aimsOf(SA2).nec, 0.55);

/* ---------- the bank and the goals ---------- */
const run = C.months.reduce((a, m) => a + m.pool.left, cfg(S, 'bankStart'));
eq('bank chain', C.months[23].bankEnd, run);
eq('left = in - out every month', C.months.every(m => m.pool.left === m.pool.in - m.pool.out), true);
eq('reached', C.reached, { car: '2027-05', travel: '2028-02', moving: '2028-02', rainy: '2028-08' });
eq('emergency first goal is 3 months of necessities', goalById(S, 'rainy').target, 3 * f('2026-11').billsTotal);
eq('emergency someday goal is 6 months', goalById(S, 'rainy').stretch, 6 * f('2026-11').billsTotal);
eq('moving is on track', goalInfo(S, C, 'moving', '2026-11').state, 'ontrack');
eq('yearly cost is paid on its month', goalInfo(S, C, 'car', '2027-06').state, 'paid');
eq('travel stops at its target', f('2028-03').g.travel.actual, 0);
eq('left over grows once travel and moving are full', f('2028-03').pool.left, f('2028-01').pool.left + 500 + 1000);
eq('long-term jar shrinks as goals finish', jarsOf(S, f('2028-03')).list[1].v, f('2028-03').goalsTotal);
eq('moving money is spent in its month', [f('2028-03').spent.moving > 0, f('2028-03').bal.moving], [true, 0]);

/* ---------- one-month changes ---------- */
const S2 = freshState(); setVal(S2, 'envelope', '2026-12', 5000, 'once'); const C2 = calcAll(S2);
eq('Dec spending money changed', C2.byYm['2026-12'].jar.play, 5000);
eq('Jan back to usual', C2.byYm['2027-01'].jar.play, 3500);
eq('Dec left over drops by 1,500', C2.byYm['2026-12'].pool.left, f('2026-12').pool.left - 1500);
setVal(S2, 'envelope', '2026-12', 5000, 'after'); eq('keep for later months', calcAll(S2).byYm['2027-01'].jar.play, 5000);

/* ---------- short months and the fixes ---------- */
const S3 = freshState(); setVal(S3, 'envelope', '2026-11', 16500, 'once'); const m3 = calcAll(S3).byYm['2026-11'];
eq('big spend ends below the floor', [m3.bankEnd, statusOf(S3, m3)], [2000, 'short']);
const fx = fixes(S3, m3);
eq('fix ids', fx.map(x => x.id), ['trim', 'borrow']);
const trim = fx.find(x => x.id === 'trim').amount;
eq('trim amount', trim, 15500);
trimPlay(S3, m3, '2026-11', trim);
eq('trimmed spending money keeps the floor', calcAll(S3).byYm['2026-11'].bankEnd >= cfg(S3, 'minBank'), true);
const S3b = freshState(); addLine(S3b, 'play', 'Eating out', 2000); setVal(S3b, 'envelope', '2026-11', 14500, 'once');
const m3b = calcAll(S3b).byYm['2026-11'];
trimPlay(S3b, m3b, '2026-11', 15500);
eq('trim takes from the first play line first', [val(S3b, 'envelope', '2026-11'), calcAll(S3b).byYm['2026-11'].jar.play], [13500, 15500]);
const S4 = freshState(); setVal(S4, 'envelope', '2026-11', 16500, 'once');
const b4 = fixes(S4, calcAll(S4).byYm['2026-11']).find(x => x.id === 'borrow');
eq('borrow offered when the emergency fund has money', b4 && b4.amount, 1000);
setVal(S4, 'draw', '2026-11', b4.amount, 'once');
eq('borrowing lifts the bank to the floor', calcAll(S4).byYm['2026-11'].bankEnd >= cfg(S4, 'minBank'), true);
const S4b = freshState(); goalById(S4b, 'rainy').start = 0; setVal(S4b, 'envelope', '2026-11', 16500, 'once');
eq('no borrow when the emergency fund is empty', fixes(S4b, calcAll(S4b).byYm['2026-11']).map(x => x.id), ['trim']);
const S4c = freshState(); removeGoal(S4c, 'rainy'); setVal(S4c, 'envelope', '2026-11', 18500, 'once');
eq('no borrow without an emergency goal', fixes(S4c, calcAll(S4c).byYm['2026-11']).map(x => x.id), ['trim']);

/* ---------- start from zero ---------- */
const B = blankState(S), CB = calcAll(B);
eq('blank: nothing comes in or goes out', CB.months.every(m => m.pool.in === 0 && m.pool.out === 0), true);
eq('blank: bank is zero', CB.months[23].bankEnd, 0);
eq('blank keeps the currency', B.ui.cur, '₱');
eq('blank keeps the line names', B.plan.lines.map(l => l.name), S.plan.lines.map(l => l.name));
const B2 = blankState(S); setVal(B2, 'a', '2026-11', 50000, 'after'); setVal(B2, 'bill:rent', '2026-11', 15000, 'after');
eq('blank then enter a salary and rent', calcAll(B2).byYm['2027-03'].pool.left, 35000);
eq('blank goals show as unset', goalInfo(B, CB, 'travel', '2026-11').state, 'unset');
const B3 = blankState(S); addReceipt(S, '2026-11-08', 100, 'bill:food', ''); const B3b = blankState(S);
eq('blank keeps receipts', B3b.receipts.length, 1); S.receipts = [];

/* ---------- automatic monthly amounts ---------- */
const Y = freshState(); setVal(Y, 'a', '2026-11', 320000, 'after'); goalById(Y, 'moving').target = 600000; goalById(Y, 'car').target = 60000;
const CY = calcAll(Y);
eq('large pay: moving per month', CY.byYm['2026-11'].g.moving.planned, 37500);
eq('large pay rounds to hundreds', CY.byYm['2026-11'].g.car.planned % 100, 0);
const Sm = freshState(); setVal(Sm, 'a', '2026-11', 3600, 'after'); goalById(Sm, 'moving').target = 3000;
eq('small pay: moving rounds to tens', [calcAll(Sm).byYm['2026-11'].g.moving.planned, calcAll(Sm).byYm['2026-11'].g.moving.planned % 100 !== 0], [190, true]);
const Sd = freshState(); goalById(Sd, 'moving').start = 6000;
eq('money already saved lowers the monthly amount', calcAll(Sd).byYm['2026-11'].g.moving.planned < f('2026-11').g.moving.planned, true);

/* ---------- loan ending sends its money to the emergency fund ---------- */
const L = freshState(); setVal(L, 'bill:loan', '2026-11', 2000, 'after'); updateLine(L, 'loan', { ends: '2027-08' }); const CL = calcAll(L);
eq('loan is a line until its last month', [CL.byYm['2027-08'].lines.find(x => x.id === 'loan').on, CL.byYm['2027-09'].lines.find(x => x.id === 'loan').on], [true, false]);
eq('then goes to the emergency fund', CL.byYm['2027-09'].g.rainy.loan, 2000);
const L2 = freshState(); setVal(L2, 'bill:loan', '2026-11', 2000, 'after'); updateLine(L2, 'loan', { ends: '2027-08', redirect: false });
eq('redirect can be turned off', calcAll(L2).byYm['2027-09'].g.rainy.loan, 0);

/* ---------- editing lines ---------- */
const E = freshState(), idGym = addLine(E, 'play', '  Gym  ', 800);
eq('new line exists', [lineByKey(E, 'line:' + idGym).name, lineByKey(E, 'line:' + idGym).jar], ['Gym', 'play']);
eq('new line amount counts from the first month', [val(E, 'line:' + idGym, '2026-11'), val(E, 'line:' + idGym, '2028-10')], [800, 800]);
eq('new play line adds to spending money', calcAll(E).byYm['2026-11'].jar.play, 4300);
eq('and lowers left over', calcAll(E).byYm['2026-11'].pool.left, -800);
updateLine(E, idGym, { name: 'Climbing gym' }); eq('rename a line', lineByKey(E, 'line:' + idGym).name, 'Climbing gym');
updateLine(E, 'rent', { name: 'Rent' }); eq('rename a built-in line', lineByKey(E, 'bill:rent').name, 'Rent');
const idPhoneFix = addLine(E, 'nec', 'Pet food', 600); setVal(E, 'line:' + idPhoneFix, '2026-12', 700, 'once');
removeLine(E, idPhoneFix); eq('removing a line forgets its amounts', [lineByKey(E, 'line:' + idPhoneFix), E.steps['line:' + idPhoneFix], JSON.stringify(E.once).indexOf('line:' + idPhoneFix)], [null, undefined, -1]);
removeLine(E, 'rent'); eq('remove a built-in line', [calcAll(E).byYm['2026-11'].billsTotal, E.steps['bill:rent']], [12250, undefined]);
eq('bad jar is refused', addLine(E, 'lts', 'x', 1), null);
updateLine(E, 'util', { ends: '2027-03' });
eq('a line can end', [calcAll(E).byYm['2027-03'].lines.find(x => x.id === 'util').on, calcAll(E).byYm['2027-04'].lines.find(x => x.id === 'util').on], [true, false]);
eq('ending a line moves its money to the emergency fund by default', calcAll(E).byYm['2027-04'].g.rainy.loan, 1750);
updateLine(E, 'util', { ends: '' }); eq('no end again', lineByKey(E, 'bill:util').ends, undefined);
const E2 = freshState(); for (let i = 0; i < 60; i++) addLine(E2, 'nec', 'x' + i, 0); eq('lines are capped', E2.plan.lines.length, api.MAX_LINES);

/* ---------- editing goals ---------- */
const G = freshState(); const gid = addGoal(G, 'Laptop');
eq('new goal starts empty and undated', [goalById(G, gid).name, goalById(G, gid).target, goalById(G, gid).due], ['Laptop', 0, '']);
eq('an empty goal saves nothing', calcAll(G).byYm['2026-11'].g[gid].actual, 0);
eq('an empty goal reads unset', goalInfo(G, calcAll(G), gid, '2026-11').state, 'unset');
updateGoal(G, gid, { target: 36000, due: '2027-11-10' });
eq('goal with a date: ready the month before', api.readyBy(goalById(G, gid)), '2027-10');
eq('a dated goal spreads its cost over the months', calcAll(G).byYm['2026-11'].g[gid].planned, 3000);
eq('a dated goal fills on time', goalInfo(G, calcAll(G), gid, '2026-11').state, 'ontrack');
updateGoal(G, gid, { due: '' }); eq('undated goal aims to fill in a year', calcAll(G).byYm['2026-11'].g[gid].planned, 3000);
updateGoal(G, gid, { start: 6000 }); eq('already saved lowers it', calcAll(G).byYm['2026-11'].g[gid].planned, 2500);
eq('already saved is the opening balance', calcAll(G).byYm['2026-11'].balBefore[gid], 6000);
setVal(G, 'goal:' + gid, '2026-11', 1000, 'after');
eq('own monthly amount wins', [calcAll(G).byYm['2026-12'].g[gid].planned, hasOwnMonthly(G, gid)], [1000, true]);
useSuggested(G, gid); eq('use the suggested amount again', [calcAll(G).byYm['2026-12'].g[gid].planned, hasOwnMonthly(G, gid)], [2500, false]);
updateGoal(G, gid, { due: '2020-01-01' }); eq('dates outside the window are dropped', goalById(G, gid).due, '');
updateGoal(G, gid, { due: 'banana' }); eq('bad dates are dropped', goalById(G, gid).due, '');
updateGoal(G, gid, { emergency: true });
eq('only one emergency goal', G.plan.goals.filter(x => x.emergency).map(x => x.id), [gid]);
eq('old emergency goal loses its flag and someday goal', [goalById(G, 'rainy').emergency, goalById(G, 'rainy').stretch], [undefined, undefined]);
updateGoal(G, gid, { emergency: false }); eq('no emergency goal', emergencyGoal(G), null);
eq('goals are capped', (() => { const q = freshState(); for (let i = 0; i < 20; i++) addGoal(q, 'g'); return q.plan.goals.length; })(), MAX_GOALS);
eq('goals get different colours', (() => { const q = freshState(); removeGoal(q, 'car'); removeGoal(q, 'travel'); addGoal(q, 'a'); addGoal(q, 'b'); const s = q.plan.goals.map(x => x.slot); return new Set(s).size === s.length; })(), true);
removeGoal(G, gid); eq('removed goal is gone', [goalById(G, gid), G.steps['goal:' + gid]], [null, undefined]);
const G2 = freshState(); goalById(G2, 'travel').target = 0; eq('goal with no amount saves nothing', calcAll(G2).byYm['2026-11'].g.travel.actual, 0);
const G3 = freshState(); goalById(G3, 'moving').due = '2028-05-31';
eq('a late-month due date counts that month', api.readyBy(goalById(G3, 'moving')), '2028-05');
const G4 = freshState(); goalById(G4, 'rainy').stretch = 0; eq('emergency cap falls back to its first goal', calcAll(G4).byYm['2028-10'].bal.rainy <= goalById(G4, 'rainy').target, true);

/* ---------- old saved copies keep working ---------- */
const legacy = { moveMonth: '2028-09', moveTarget: 36000, moveStart: 1000, travelTarget: 0, carDue: '2027-03-05', carTarget: 9000, rainyStart: 10000, rainyTarget: 30000, rainyStretch: 60000, loanLast: '2027-01', redirectLoan: false, bankStart: 20000 };
const LP = cleanPlan(null, legacy), SL = freshState(); SL.plan = LP; SL.cfg = { bankStart: 20000 };
eq('legacy goal settings carry over', LP.goals.map(g => [g.id, g.target, g.start, g.due]), [['moving', 36000, 1000, '2028-09-01'], ['travel', 0, 0, ''], ['car', 9000, 0, '2027-03-05'], ['rainy', 30000, 10000, '']]);
eq('legacy loan settings carry over', [lineByKey(SL, 'bill:loan').ends, lineByKey(SL, 'bill:loan').redirect], ['2027-01', false]);
eq('legacy bank carries over', calcAll(SL).byYm['2026-11'].bankStart, 20000);
const LB = freshState(); LB.plan = cleanPlan(null, {}); ['a', 'b', 'side'].forEach(k => { LB.steps[k] = [{ from: '2026-11', v: 0 }]; }); allKeys(LB).forEach(k => { LB.steps[k] = [{ from: '2026-11', v: 0 }]; });
eq('an old blank copy stays blank', calcAll(LB).months.every(m => m.pool.in === 0 && m.pool.out === 0), true);

/* ---------- loading a plan from outside ---------- */
const bad = cleanPlan({ lines: [{ id: '<img>', jar: 'nec', name: 'x' }, { id: 'ok', jar: 'nec', name: '<b>' + 'n'.repeat(100), def: -5 }, { id: 'ok', jar: 'nec', name: 'dup' }, { id: 'z', jar: 'lts', name: 'wrong jar' }, null, 5], goals: [{ id: 'g1', name: 'Goal', target: 'big', start: -1, due: '2027-13-40', slot: 99, emergency: true, stretch: 5 }, { id: 'g2', name: 'Two', emergency: true }] }, {});
eq('bad lines are dropped', bad.lines.map(l => l.id), ['ok']);
eq('names are trimmed to 60', bad.lines[0].name.length, 60);
eq('negative amounts become zero', bad.lines[0].def, 0);
eq('bad goal numbers become zero and bad dates empty', [bad.goals[0].target, bad.goals[0].start, bad.goals[0].due], [0, 0, '']);
eq('only the first emergency goal is kept', bad.goals.map(g => !!g.emergency), [true, false]);
eq('every goal gets a valid colour', bad.goals.every(g => [4, 5, 6, 7, 1, 2, 3].indexOf(g.slot) >= 0), true);
eq('a missing plan falls back to the sample', cleanPlan({ lines: 'no' }, {}).lines.length, 14);
eq('built-in ids keep their old keys', cleanPlan({ lines: [{ id: 'rent', jar: 'nec', name: 'R', key: 'hack' }], goals: [] }, {}).lines[0].key, 'bill:rent');
eq('custom ids get a line: key', cleanPlan({ lines: [{ id: 'abc', jar: 'play', name: 'R' }], goals: [] }, {}).lines[0].key, 'line:abc');

/* ---------- receipts ---------- */
const R = freshState();
const r1 = addReceipt(R, '2026-11-03', 250.5, 'bill:food', 'Palengke'), r2 = addReceipt(R, '2026-11-09', 120, 'envelope', 'Coffee'), r3 = addReceipt(R, '2026-11-09', 80, 'nonsense', 'Mystery'), r4 = addReceipt(R, '2026-12-01', 500, 'bill:util', '');
eq('receipts are added', R.receipts.length, 4);
const rs = receiptStats(R, '2026-11');
eq('month total', rs.total, 450.5);
eq('count only this month', rs.count, 3);
eq('by category', rs.byKey, { 'bill:food': 250.5, envelope: 120, other: 80 });
eq('by jar', rs.byJar, { nec: 250.5, play: 120, other: 80 });
eq('newest first', rs.list.map(r => r.id).slice(0, 2).includes(r2) && rs.list[rs.list.length - 1].id === r1, true);
eq('unknown category falls to Other', catName(R, R.receipts.find(r => r.id === r3)), 'Other');
eq('bad receipts are refused', [addReceipt(R, '2026-13-01', 5, 'envelope'), addReceipt(R, '2026-11-01', 0, 'envelope'), addReceipt(R, '2026-11-01', -5, 'envelope'), addReceipt(R, 'x', 5, 'envelope')], [null, null, null, null]);
updateReceipt(R, r2, '2026-11-10', 130, 'bill:util', 'Edited'); eq('edit a receipt', R.receipts.find(r => r.id === r2).c, 'bill:util');
removeLine(R, 'food'); eq('removed category keeps its name', catName(R, R.receipts.find(r => r.id === r1)), 'Food and groceries');
eq('removed category counts as other in jar totals', receiptStats(R, '2026-11').byJar.other, 80 + 250.5);
removeReceipt(R, r1); eq('delete a receipt', R.receipts.length, 3);
eq('floating point sums stay tidy', (() => { const q = freshState(); for (let i = 0; i < 10; i++) addReceipt(q, '2026-11-05', 0.1, 'envelope'); return receiptStats(q, '2026-11').total; })(), 1);
eq('cleanReceipts drops junk', cleanReceipts([{ id: 'a1', d: '2026-11-02', a: 5, c: 'x y', cn: 'n' }, { id: 'a1', d: '2026-11-02', a: 5 }, { id: 'b', d: 'nope', a: 5 }, { id: 'c', d: '2026-11-02', a: -1 }, 7, null]).map(r => [r.id, r.c]), [['a1', 'other']]);
eq('cleanReceipts of a non-list', cleanReceipts('no'), []);

/* ---------- calendar ---------- */
const today = new Date(2026, 10, 10, 12, 0, 0);   // Tue 10 Nov 2026
eq('next Sunday', nextWeekday(0, today).getDate(), 15);
eq('today counts when it is the right day', nextWeekday(2, today).getDate(), 10);
eq('next Monday', nextWeekday(1, today).getDate(), 16);
eq('reminder times', reminderTimes(0, '18:00', today), { start: '20261115T180000', end: '20261115T183000' });
eq('late time clamps to the end of the day', reminderTimes(0, '23:50', today).end, '20261115T235900');
const g = gcalUrl({ title: 'Update my receipts', details: 'Open it. https://x.test/a?b=1', day: 0, time: '18:00', today });
eq('google link host', g.startsWith('https://calendar.google.com/calendar/render?action=TEMPLATE'), true);
eq('google link repeats weekly on the day', decodeURIComponent(g).includes('recur=RRULE:FREQ=WEEKLY;BYDAY=SU'), true);
eq('google link dates', g.includes('dates=20261115T180000/20261115T183000'), true);
const ou = outlookUrl({ title: 'Update my receipts', details: 'Line one, with; punctuation & more', day: 5, time: '09:15', today });
eq('outlook link is the compose deeplink', ou.startsWith('https://outlook.live.com/calendar/0/deeplink/compose?path=%2Fcalendar%2Faction%2Fcompose&rru=addevent'), true);
eq('outlook start is the next Friday', ou.includes('startdt=2026-11-13T09%3A15%3A00') || ou.includes('startdt=2026-11-13T09:15:00'), true);
eq('outlook end is 30 minutes later', ou.includes('enddt=2026-11-13T09%3A45%3A00') || ou.includes('enddt=2026-11-13T09:45:00'), true);
eq('outlook escapes the text', ou.includes('subject=Update%20my%20receipts') && ou.includes('punctuation%20%26%20more') && !/[ ;,]/.test(ou.split('?')[1]), true);


/* ---------- samples by currency ---------- */
const PAYS = { '₱': 30000, '¥': 200000, '€': 1650 };
Object.keys(PAYS).forEach(cur => {
  const P = presetState(cur), CP = calcAll(P), m = CP.byYm['2026-11'], JP = jarsOf(P, m), pay = PAYS[cur];
  eq(cur + ' sample pay', m.pool.in, pay);
  eq(cur + ' sample uses every unit of the pay: left over is zero', m.pool.left, 0);
  eq(cur + ' sample is on plan', statusOf(P, m), 'good');
  eq(cur + ' necessities are 55% of pay (within a rounding step)', Math.abs(m.billsTotal - pay * 0.55) <= SAMPLES[cur].unit, true);
  eq(cur + ' jars add up to the pay', JP.list.reduce((a, j) => a + j.v, 0), pay);
  eq(cur + ' every jar is within 2 points of Eker\'s usual share', JP.list.every(j => Math.abs(j.pct - j.usual) <= 2), true);
  eq(cur + ' no month is short or negative', MONTHS.every(ym => CP.byYm[ym].pool.left >= 0 && statusOf(P, CP.byYm[ym]) === 'good'), true);
  eq(cur + ' bank balance never falls under the minimum', MONTHS.every(ym => CP.byYm[ym].bankEnd >= cfg(P, 'minBank')), true);
  eq(cur + ' every goal has an amount and ends up funded inside the window', P.plan.goals.every(g => { const gi = goalInfo(P, CP, g.id, '2026-11'); return g.target > 0 && gi.reached; }), true);
  eq(cur + ' emergency fund aims at 3 months of bills, stretch 6', (g => [g.target, g.stretch])(P.plan.goals.find(g => g.emergency)), [m.billsTotal * 3, m.billsTotal * 6]);
  eq(cur + ' sample money is clean multiples', P.plan.lines.every(l => l.def % SAMPLES[cur].unit === 0), true);
  eq(cur + ' starting balance and minimum come with the sample', [cfg(P, 'bankStart') > 0, cfg(P, 'minBank') > 0, cfg(P, 'ceiling') > 0, cfg(P, 'bankStart') > cfg(P, 'minBank')], [true, true, true, true]);
  eq(cur + ' preset says what it is', presetKey(P), cur);
});
eq('yen sample is 200,000 a month', presetState('¥').plan.lines.length > 0 && calcAll(presetState('¥')).byYm['2026-11'].pool.in, 200000);
eq('peso sample is 30,000 a month', calcAll(presetState('₱')).byYm['2026-11'].pool.in, 30000);
eq('euro sample is 1,650 a month (300,000 yen at about 185, rounded)', calcAll(presetState('€')).byYm['2026-11'].pool.in, 1650);
['$', '£', 'A$', 'none', '₹'].forEach(cur => {
  const Z = presetState(cur), CZ = calcAll(Z);
  eq(cur + ' starts at zero everywhere', MONTHS.every(ym => { const x = CZ.byYm[ym]; return x.pool.in === 0 && x.pool.out === 0 && x.pool.left === 0 && x.bankEnd === 0; }), true);
  eq(cur + ' keeps the same lines and goals to fill in', [Z.plan.lines.length, Z.plan.goals.length], [presetState('₱').plan.lines.length, presetState('₱').plan.goals.length]);
  eq(cur + ' has no NaN anywhere', JSON.stringify(CZ).includes('null') === false && !/NaN|Infinity/.test(JSON.stringify(MONTHS.map(ym => CZ.byYm[ym]))), true);
  eq(cur + ' preset is blank, with zero pay and zero balances', [presetKey(Z), val(Z, 'a', '2026-11'), cfg(Z, 'bankStart'), cfg(Z, 'minBank')], ['blank', 0, 0, 0]);
});
eq('typing a salary in a zero-start currency works like anywhere else', (Z => { setVal(Z, 'a', '2026-11', 4000, 'after'); return calcAll(Z).byYm['2026-11'].pool.in; })(presetState('$')), 4000);
eq('an older saved copy still means the 35,000 sample', [presetKey(freshState()), val(freshState(), 'a', '2026-11'), cfg(freshState(), 'bankStart')], ['legacy', 35000, 15000]);
eq('default rounding step follows the size of the pay', [roundUnit(presetState('€')), roundUnit(presetState('₱')), roundUnit(presetState('¥'))], [5, 100, 100]);

/* ---------- rules added in v23.3 ---------- */
{
  const S = presetState('$'), g = S.plan.goals.find(x => x.id === 'car'); g.target = 3000; g.start = 0; g.due = '2027-03-20';
  setVal(S, 'goal:car', '2026-11', 400, 'after');
  const C = calcAll(S);
  eq('a dated goal takes no more money after its last saving month, whatever was typed', [C.byYm['2027-04'].g.car.planned, C.byYm['2028-10'].g.car.planned, C.byYm['2028-10'].bal.car], [0, 0, 0]);
  eq('a goal that falls short of its date says so, with how much was set aside', [goalInfo(S, C, 'car', '2027-04').state, goalInfo(S, C, 'car', '2027-04').had], ['short', 2000]);
  const S2 = presetState('$'); const g2 = S2.plan.goals.find(x => x.id === 'car'); g2.target = 3000; g2.start = 0; g2.due = '2027-03-20';
  eq('a goal funded by its date is paid', goalInfo(S2, calcAll(S2), 'car', '2027-04').state, 'paid');
  eq('a due date after pay day still counts that month, one on or before it does not', [readyBy({ due: '2027-03-16' }), readyBy({ due: '2027-03-15' })], ['2027-03', '2027-02']);
  eq('a date that does not exist is dropped', [validDue('2027-02-29'), validDue('2026-11-31'), validDue('2028-02-29'), validDue('2026-11-30')], ['', '', '2028-02-29', '2026-11-30']);
  /* borrowing from a full emergency fund takes the money out for real */
  const E = presetState('₱'); const eg = E.plan.goals.find(x => x.emergency); eg.start = eg.stretch; eg.target = eg.stretch;
  setVal(E, 'envelope', '2026-11', 20000, 'once');
  const m0 = calcAll(E).byYm['2026-11'], f = fixes(E, m0).find(x => x.id === 'borrow');
  setVal(E, 'draw', '2026-11', m0.draw + f.amount, 'once');
  const m1 = calcAll(E).byYm['2026-11'];
  eq('borrowing from a full emergency fund is not put straight back', [m1.draw, m1.g.rainy.actual, m1.bankEnd >= cfg(E, 'minBank')], [f.amount, 0, true]);
  /* whole-number percents: equal shares are a real tie, they add to 100 */
  eq('equal shares get equal percents where they can', wholePercents([799, 271, 120, 53, 165, 84, 0], 1492), [54, 18, 8, 3, 11, 6, 0]);
  eq('percents of an empty month are all zero', wholePercents([0, 0, 0], 0), [0, 0, 0]);
  eq('percents always add to 100', (() => { let bad = 0; for (let i = 1; i < 4000; i++) { const v = [i * 7 % 997, i * 13 % 389, i * 31 % 211, i % 5, 0, i * 3 % 50]; const t = v.reduce((a, b) => a + b, 0); if (t > 0 && wholePercents(v, t).reduce((a, b) => a + b, 0) !== 100) bad++; } return bad; })(), 0);
  /* a saved or imported copy: bad amounts never get through */
  eq('text, negative, NaN and wrong shapes are dropped from saved steps', cleanSteps({ a: [{ from: '2026-11', v: 'abc' }, { from: '2026-12', v: -5 }, { from: 'junk', v: 5 }, { from: '2027-01', v: 1234.4 }], b: 'oops', 'bad key!': [{ from: '2026-11', v: 1 }] }), { a: [{ from: '2027-01', v: 1234 }] });
  eq('one-time values are cleaned too', cleanOnce({ '2026-12': { 'bill:rent': 'x', a: -1, draw: 50 }, junk: { a: 5 }, '2027-01': 'no' }), { '2026-12': { draw: 50 } });
  eq('one-time costs are cleaned and an empty list is kept', [cleanItems({ '2026-12': [{ id: 'q', label: 'x', amount: 'nine' }, null, 5, { id: 'ok', label: ' Vet ', amount: 400.4 }] })['2026-12'], cleanItems({ '2026-12': [] })['2026-12']], [[{ id: 'ok', label: 'Vet', amount: 400 }], []]);
  eq('settings keep only known, sensible values', cleanCfg({ bankStart: 'lots', minBank: -50, ceiling: 5000.4, loanLast: '2027-08', evil: 1, aims: { nec: 2, play: 0.2 } }), { ceiling: 5000, loanLast: '2027-08', aims: { play: 0.2 } });
  eq('a valid saved copy passes through unchanged', (() => { const S = presetState('¥'); setVal(S, 'a', '2027-03', 250000, 'after'); setVal(S, 'draw', '2027-06', 5000, 'once'); S.items['2027-02'] = [{ id: 'x1', label: 'Fix', amount: 9000 }]; const C = JSON.stringify; return [C(cleanSteps(S.steps)) === C(S.steps), C(cleanOnce(S.once)) === C(S.once), C(cleanItems(S.items)) === C(S.items)]; })(), [true, true, true]);
}

console.log(fails ? fails + ' FAILED' : 'ALL PASS');
process.exit(fails ? 1 : 0);
