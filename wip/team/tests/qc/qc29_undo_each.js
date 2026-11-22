/* QC round 10 data safety blocker 2: a second removal silently ended the first one's 3-day Undo (remove Rent, then Utilities, then Food,
   reload: only Food's Undo was offered, so Rent could not come back before the promised date). Every kept change now keeps its own Undo
   until its own date. After a reload the bar offers the newest and says how many earlier ones can be undone after it; each Undo then
   offers the next. Settings lists every kept change with its own date and its own Undo, so Rent can come back first.
   Made-up numbers.  Run: BUILD=/abs/wip/money-map-team.html node tests/qc/qc29_undo_each.js   Ends with "qc29_undo_each: ALL PASS". */
let bad = 0; const ck = (n, c, x) => { console.log(c ? 'PASS' : 'FAIL', n, c ? '' : JSON.stringify(x === undefined ? '' : x).slice(0, 400)); if (!c) bad++; };
const L = require('./lib_r12.js'), R = L.R, w = R.w;
const BUILD = process.env.BUILD || process.env.PAGE || '/home/claude/work/money-map-team.html';
(async () => {
  const { b, p, errs } = await R.phone({ w: 390, h: 844, dpr: 1, mobile: true, keep: true });
  await p.goto('file://' + BUILD + '?sfxtest'); await w(1300);
  const skip = async () => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(300); } };
  await skip(); await L.zero(p);
  await L.base(p, { pay: 300000, bank: 250000, min: 20000, defs: { 'bill:rent': 85000, 'bill:util': 12000, 'bill:food': 50000 } });
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; delete S.ui.keep; delete S.ui.keeps; __t.persist(); __t.restructure(); }); await w(900);
  const lines = () => p.evaluate(() => __t.S.plan.lines.map(l => l.id).join(','));
  const plan = () => p.evaluate(() => { const S = __t.S; return JSON.stringify([S.plan.lines.map(l => [l.id, l.def]), S.steps, S.once]); });
  const bar = () => p.evaluate(() => { const e = document.getElementById('undoBar'); return e && !e.hidden ? document.getElementById('undoTxt').textContent : ''; });
  const before = await plan(), all0 = await lines();
  const remove = async id => {
    await L.tab(p, 'tab-month'); await p.evaluate(() => { const t = document.getElementById('rt-nec'); if (t && !document.querySelector('#rb-nec [data-edit]')) t.click(); }); await w(400);
    await p.evaluate(() => { if (!document.querySelector('#rb-nec [data-ldel]')) { const e = document.querySelector('#rb-nec [data-edit]'); e && e.click(); } }); await w(500);
    const t = await p.evaluate(id => { const b = document.querySelector(`[data-ldel="${id}"]`); if (!b) return '(no button)'; b.click(); return b.textContent; }, id); await w(300);
    await p.evaluate(id => document.querySelector(`[data-ldel="${id}"]`).click(), id); await w(700);
    return t;
  };
  const t1 = await remove('rent');
  ck(`the first removal's confirm ("${t1}")`, /^Tap again: removes Rent or mortgage from every month\. You can undo for 3 days\.$/.test(t1), t1);
  await remove('util');
  await L.rc(p, 3333, 'envelope', null, 'Made-up between removals');
  const t3 = await remove('food');
  ck(`a later removal does not end an earlier Undo, so its confirm says nothing about one ("${t3}")`, !/ends the Undo/.test(t3), t3);
  ck('the three lines are gone', !/(^|,)(rent|util|food)(,|$)/.test(await lines()), await lines());
  await w(1200); await p.reload(); await w(1800); await skip();
  const b1 = await bar();
  ck(`after a reload the bar offers the newest and says two earlier ones can be undone after it ("${b1}")`, /^Food and groceries was removed\. You can undo until \d+ \w+ \d{4}\. 2 earlier changes can be undone after it\.$/.test(b1), b1);
  /* Settings: each kept change with its own date and its own Undo */
  await L.settings(p); await w(500);
  const set = await p.evaluate(() => { const k = document.getElementById('keepLine'), m = document.getElementById('keepMore'); return { line: k && !k.hidden ? k.innerText.replace(/\s+/g, ' ') : '', more: m && !m.hidden ? [...m.querySelectorAll('p')].map(x => x.innerText.replace(/\s+/g, ' ').trim()) : [] }; });
  ck(`Settings shows the newest ("${set.line}")`, /Food and groceries was removed/.test(set.line), set);
  ck(`Settings lists the two earlier ones, each with its date and Undo (${JSON.stringify(set.more)})`, set.more.length === 2 && /^Utilities was removed\. You can undo until \d+ \w+ \d{4}\. Undo$/.test(set.more[0]) && /^Rent or mortgage was removed\. You can undo until \d+ \w+ \d{4}\. Undo$/.test(set.more[1]), set.more);
  /* Rent first, from Settings: only Rent comes back */
  await p.evaluate(() => { const r = [...document.querySelectorAll('#keepMore p')].find(x => /Rent or mortgage/.test(x.innerText)); r.querySelector('button').click(); }); await w(900);
  let ls = await lines();
  ck('Undo on Rent in Settings brings Rent back', /(^|,)rent(,|$)/.test(ls), ls);
  ck('...and only Rent: Utilities and Food are still removed', !/(^|,)(util|food)(,|$)/.test(ls), ls);
  ck('...and Settings now lists only Utilities as earlier', await p.evaluate(() => [...document.querySelectorAll('#keepMore p')].map(x => x.innerText).join('|')).then(t => /Utilities/.test(t) && !/Rent/.test(t)));
  /* then the bar: Food, then the next one it offers, Utilities */
  await L.tab(p, 'tab-home'); await w(300);
  const b2 = await bar();
  ck(`the bar still offers Food ("${b2}")`, /^Food and groceries was removed/.test(b2), b2);
  await p.evaluate(() => document.getElementById('undoGo').click()); await w(900);
  const b3 = await bar();
  ck(`after Undo the bar offers the next kept change ("${b3}")`, /^Utilities was removed\. You can undo until/.test(b3), b3);
  await p.evaluate(() => document.getElementById('undoGo').click()); await w(900);
  ls = await lines();
  ck('all three lines are back, in their places', ls === all0, [all0, ls]);
  ck('every amount is as before', (await plan()) === before, [before, await plan()]);
  ck('the receipt logged between the removals is still there', await p.evaluate(() => __t.S.receipts.some(r => r.a === 3333)));
  ck('nothing is left to undo', await p.evaluate(() => !__t.S.ui.keep && !__t.S.ui.keeps), await p.evaluate(() => [__t.S.ui.keep && __t.S.ui.keep.why, __t.S.ui.keeps]));
  ck('the bar has gone', (await bar()) === '', await bar());
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc29_undo_each: ${bad} FAIL` : 'qc29_undo_each: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc29_undo_each: FAIL'); process.exit(1); });
