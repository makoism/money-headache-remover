/* QC round 10 data safety blocker 1: a late Undo (after a reload) brought back the whole saved copy, so a receipt logged after the change
   was silently deleted (remove a bill line, log ¥3,333, reload, Undo: the receipt was gone; the same after Set all to zero, whose confirm
   says "Receipts stay."). Undo now brings back only what the change itself changed and keeps everything done since. When something done
   since would have to go, Undo asks first and names it, and nothing changes until the second tap.
   Covered: a bill line removed, Set all to zero, Restore samples, a burrow removed, setup run again (all from the screens), and the ACT door
   (a removal by the assistant's door, then a later change and receipt; a receipt the change added and that was edited since).
   Made-up numbers.  Run: BUILD=/abs/wip/money-map-team.html node tests/qc/qc29_undo_since.js   Ends with "qc29_undo_since: ALL PASS". */
let bad = 0; const ck = (n, c, x) => { console.log(c ? 'PASS' : 'FAIL', n, c ? '' : JSON.stringify(x === undefined ? '' : x).slice(0, 400)); if (!c) bad++; };
const L = require('./lib_r12.js'), R = L.R, w = R.w;
const BUILD = process.env.BUILD || process.env.PAGE || '/home/claude/work/money-map-team.html';
(async () => {
  const { b, p, errs } = await R.phone({ w: 390, h: 844, dpr: 1, mobile: true, keep: true });
  await p.goto('file://' + BUILD + '?sfxtest'); await w(1300);
  for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); }
  await L.zero(p);
  await L.base(p, { pay: 300000, bank: 250000, min: 20000, eT: 200000, eS: 50000, eM: 10000 });
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; delete S.ui.keep; delete S.ui.keeps; __t.persist(); __t.restructure(); }); await w(900);
  /* the plan's numbers, receipts left out */
  const plan = () => p.evaluate(() => { const S = __t.S; return JSON.stringify([S.plan.lines.map(l => [l.id, l.def]), S.plan.goals.map(g => [g.id, g.start, g.target]), S.steps, S.once, S.cfg.bankStart, S.cfg.minBank, (S.cards || []).map(k => k.id)]); });
  const rcs = () => p.evaluate(() => (__t.S.receipts || []).map(r => r.a));
  const bar = () => p.evaluate(() => { const e = document.getElementById('undoBar'); return e && !e.hidden ? document.getElementById('undoTxt').textContent : ''; });
  const tapUndo = async () => { await p.evaluate(() => document.getElementById('undoGo').click()); await w(900); };
  const reload = async () => { await w(1500); await p.reload(); await p.waitForFunction(() => window.__t && __t.S && __t.S.ui, { timeout: 15000 }).catch(() => { }); await w(1600);
    for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(300); } };
  const closeBar = async () => { await p.evaluate(() => { const x = document.getElementById('undoX'); if (x && x.offsetParent) x.click(); }); await w(200); };
  const clean = async () => { await p.evaluate(() => { delete __t.S.ui.keep; delete __t.S.ui.keeps; __t.persist(); }); await closeBar(); await w(700); };
  /* one change from the screens, a receipt logged after it, a reload, Undo */
  async function lateUndo(name, amount, doIt, barRe) {
    await clean();
    const before = await plan(), n0 = (await rcs()).length;
    await doIt(); await w(800);
    ck(`${name}: the change happened`, (await plan()) !== before, await plan());
    await closeBar();
    await L.rc(p, amount, 'envelope', null, 'Made-up after ' + name); await w(400);
    ck(`${name}: the receipt logged after it is in`, (await rcs()).indexOf(amount) >= 0, await rcs());
    await reload();
    const t = await bar();
    ck(`${name}: after a reload Undo is offered ("${t}")`, barRe.test(t), t);
    await tapUndo();
    const after = await plan(), r = await rcs();
    ck(`${name}: Undo brings the plan back`, after === before, [before, after]);
    ck(`${name}: the ${amount} receipt logged after the change is still there`, r.indexOf(amount) >= 0 && r.length === n0 + 1, r);
  }
  /* 1. a bill line, from the Plan screen */
  await lateUndo('bill line removed', 3333, async () => {
    await L.tab(p, 'tab-month'); await p.evaluate(() => { const t = document.getElementById('rt-nec'); if (t && !document.querySelector('#rb-nec [data-edit]')) t.click(); }); await w(400);
    await p.evaluate(() => { if (!document.querySelector('#rb-nec [data-ldel]')) { const e = document.querySelector('#rb-nec [data-edit]'); e && e.click(); } }); await w(500);
    await p.evaluate(() => document.querySelector('[data-ldel="rent"]').click()); await w(300); await p.evaluate(() => document.querySelector('[data-ldel="rent"]').click());
  }, /Rent or mortgage was removed\. You can undo until/);
  /* 2. Set all to zero (its confirm says "Receipts stay.") */
  await lateUndo('Set all to zero', 4444, async () => { await L.zero(p, { keepBar: true }); }, /set to zero\. You can undo until/);
  /* 3. Restore samples */
  await lateUndo('Restore samples', 5555, async () => {
    await L.settings(p); await p.evaluate(() => document.getElementById('bkReset').click()); await w(700); await p.evaluate(() => document.getElementById('bkReset').click());
  }, /Samples replaced your numbers\. You can undo until|Your plan was cleared\. You can undo until/);
  /* 4. a burrow, from the Plan screen */
  await lateUndo('burrow removed', 6666, async () => {
    await L.tab(p, 'tab-month'); await L.clickText(p, 'Burrows'); await w(500);
    await p.evaluate(() => { const b = document.querySelector('[data-gedit="trip1"]'); b && b.click(); }); await w(500);
    await p.evaluate(() => document.querySelector('[data-gdel]').click()); await w(300); await p.evaluate(() => document.querySelector('[data-gdel]').click());
  }, /was removed\. You can undo until/);
  await L.tab(p, 'tab-month'); await L.clickText(p, 'Month'); await w(300);
  /* 5. setup run again from Settings */
  await lateUndo('setup run again', 7777, async () => {
    await L.settings(p); await p.evaluate(() => document.getElementById('setupOpen').click()); await w(700); await p.evaluate(() => document.getElementById('setupOpen').click()); await w(900);
    await p.evaluate(() => { const S = __t.S; S.plan.goals.find(g => g.emergency).start = 0; S.steps.a = [{ from: '2026-11', v: 200000 }]; __t.persist(); });
    await p.evaluate(() => document.getElementById('tourSkip').click()); await w(900);
  }, /Setup changed your plan\. You can undo until/);

  /* 6. something done since that Undo would have to replace: it asks first, names it, and changes nothing until the second tap */
  await clean();
  { const before = await plan();
    await L.zero(p, { keepBar: true }); await w(500); await closeBar();
    await L.rc(p, 1212, 'envelope', null, 'Made-up after zero');
    await p.evaluate(() => __t.ACT.setPay(250000)); await w(500);   /* new pay typed after the reset */
    const mid = await plan();
    await reload();
    ck('zero then new pay: Undo is offered after a reload', /set to zero/.test(await bar()), await bar());
    await p.evaluate(() => document.getElementById('undoGo').click()); await w(400);
    const ask = await bar();
    ck(`the first tap asks and names what Undo would replace ("${ask}")`, /^Undo also/.test(ask) && /pay/i.test(ask) && !/receipt/.test(ask), ask);
    ck('...and changes nothing yet', (await plan()) === mid, await plan());
    await w(800); await tapUndo();
    ck('the second tap brings the plan from before back, pay too', (await plan()) === before, [before, await plan()]);
    ck('the 1,212 receipt is still there', (await rcs()).indexOf(1212) >= 0, await rcs()); }

  /* 7. the ACT door: a line removed, then a new pay and a receipt. Undo after a reload brings the line back and keeps both */
  await clean();
  { const lid = await p.evaluate(() => __t.S.plan.lines.find(l => l.id === 'util').id);
    await p.evaluate(id => __t.ACT.removeLine(id), lid); await w(300); await closeBar();
    await p.evaluate(() => __t.ACT.setPay(280000)); await L.rc(p, 2323, 'envelope', null, 'Made-up after the act');
    await reload();
    ck('ACT removal: after a reload Undo is offered', /removed/.test(await bar()), await bar());
    await tapUndo();
    const s = await p.evaluate(() => ({ line: !!__t.S.plan.lines.find(l => l.id === 'util'), pay: __t.S.steps.a }));
    ck('ACT removal: the line is back', s.line, s);
    ck('ACT removal: the pay typed since stays 280,000', JSON.stringify(s.pay) === JSON.stringify([{ from: '2026-11', v: 280000 }]), s.pay);
    ck('ACT removal: the receipt logged since stays', (await rcs()).indexOf(2323) >= 0, await rcs()); }

  /* 7b. the other removals through the ACT door (act_keep.js lists them): each, then a new pay and a receipt, a reload, Undo */
  for (const [name, setup, call, back] of [
    ['removeCard', () => __t.ACT.setCard(null, { name: 'Made-up card', owed: 42000, payDay: 10 }), () => __t.ACT.removeCard(__t.S.cards[0].id), () => (__t.S.cards || []).some(k => k.name === 'Made-up card')],
    ['removeReceipts', () => __t.ACT.addReceipts([{ d: '2026-11-10', a: 8888, c: 'envelope', n: 'Made-up to delete' }]), () => __t.ACT.removeReceipts([__t.S.receipts.find(r => r.n === 'Made-up to delete').id]), () => __t.S.receipts.some(r => r.n === 'Made-up to delete')],
    ['removeGoal', () => 0, () => __t.ACT.removeGoal('trip1'), () => __t.S.plan.goals.some(g => g.id === 'trip1')],
  ]) {
    await clean();
    await p.evaluate(setup.toString().replace(/^\(\) => /, '')); await w(300); await clean();
    await p.evaluate(call.toString().replace(/^\(\) => /, '')); await w(300); await closeBar();
    await p.evaluate(() => __t.ACT.setPay(290000)); await L.rc(p, 1717, 'envelope', null, 'Made-up after ' + name);
    await reload();
    ck(`ACT ${name}: after a reload Undo is offered`, !!(await bar()), await bar());
    await tapUndo();
    const s = await p.evaluate(back.toString().replace(/^\(\) => /, ''));
    ck(`ACT ${name}: Undo brings it back`, s === true, s);
    ck(`ACT ${name}: the pay typed since stays 290,000`, await p.evaluate(() => JSON.stringify(__t.S.steps.a)) === JSON.stringify([{ from: '2026-11', v: 290000 }]));
    ck(`ACT ${name}: the receipt logged since stays`, await p.evaluate(n => __t.S.receipts.some(r => r.n === n), 'Made-up after ' + name));
  }

  /* 8. a receipt the change added itself, edited since: Undo asks and names it before taking it out */
  await clean();
  { await p.evaluate(() => __t.ACT.tx('assistant', () => { __t.ACT.addReceipts([{ d: '2026-11-20', a: 4444, c: 'envelope', n: 'Made-up from Ask' }]); __t.ACT.setLine('bill:food', 45000); })); await w(400);
    await p.evaluate(() => { const r = __t.S.receipts.find(r => r.n === 'Made-up from Ask'); r.a = 4000; __t.persist(); }); await w(300);
    await reload();
    ck('Ask change: after a reload Undo is offered', /Ask changed your plan/.test(await bar()), await bar());
    await p.evaluate(() => document.getElementById('undoGo').click()); await w(400);
    const ask = await bar();
    ck(`the first tap names the receipt it would take out ("${ask}")`, /^Undo also removes what you did since: 1 receipt \(¥4,000\)/.test(ask), ask);
    ck('...and it is still there', (await rcs()).indexOf(4000) >= 0);
    await w(800); await tapUndo();
    const s = await p.evaluate(() => ({ food: (__t.S.steps['bill:food'] || []).map(x => x.v), rc: __t.S.receipts.some(r => r.n === 'Made-up from Ask') }));
    ck('the second tap takes the change back', !s.rc && s.food.indexOf(45000) < 0, s); }

  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc29_undo_since: ${bad} FAIL` : 'qc29_undo_since: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc29_undo_since: FAIL'); process.exit(1); });
