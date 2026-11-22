/* QC round 6 data safety blocker 1 and confusing 1.
   1. After Set all to zero, loading a backup or removing a goal, the bar "... You can undo for 3 days. Undo" went away when the person
      changed tab, with no Undo anywhere until a reload. The big-change Undo now stays until it is tapped, closed or replaced by another
      Undo, across tab changes and past the old 30 seconds. A receipt's small Undo still goes by itself.
   2. Phone B after a cloud load and a reload: the bar says Undo also stops sharing the cloud copy, and after Undo Settings shows the
      cloud copy Off right away. Made-up numbers, and a made-up server on this machine (cloud_lib.js).
   Run: PAGE=/abs/wip/money-map-team.html node tests/qc/qc13_undo_stays.js   Ends with "qc13_undo_stays: ALL PASS" or "n FAIL". */
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 400)); } };
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const bar = p => p.evaluate(() => { const e = document.getElementById('undoBar'); return e && !e.hidden && e.getClientRects().length ? document.getElementById('undoTxt').textContent : ''; });
const goal = p => p.evaluate(() => JSON.stringify(__t.S.plan.goals.map(g => [g.id, g.start, g.target])));
const tabs = async p => { const seen = []; for (const t of ['tab-home', 'tab-receipts', 'tab-month', 'tab-home']) { await L.tab(p, t); seen.push(await bar(p)); } return seen; };
(async () => {
  const { b, p, errs } = await R.phone({ w: 390, h: 844, dpr: 1, mobile: true });
  await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await L.base(p, { bank: 250000, eS: 60000 });
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); }); await w(600);
  const before = await goal(p);

  /* Set all to zero: the bar stays across every tab, and past 30 seconds */
  await L.zero(p, { keepBar: true }); await w(500);   /* this test is about the bar the reset leaves */
  let t = await bar(p);
  ck('Set all to zero offers Undo', /set to zero\. You can undo for 3 days/.test(t), t);
  let seen = await tabs(p);
  ck('the zero Undo stays on Home, Receipts, Plan and Home again', seen.every(s => /set to zero/.test(s)), seen);
  await p.keyboard.press('Tab'); await p.evaluate(() => document.getElementById('tab-home').focus()); await p.keyboard.press('ArrowRight'); await w(500);
  ck('the zero Undo stays after changing tab with the arrow keys', /set to zero/.test(await bar(p)), await bar(p));
  await w(31000);
  ck('the zero Undo is still there after 31 seconds', /set to zero/.test(await bar(p)), await bar(p));
  await p.evaluate(() => document.getElementById('undoGo').click()); await w(800);
  ck('Undo puts the numbers back', (await goal(p)) === before, await goal(p));
  ck('the bar goes once Undo is tapped', (await bar(p)) === '', await bar(p));

  /* Close: the bar goes, Settings still offers Put them back */
  await L.zero(p, { keepBar: true }); await w(500);   /* this test is about the bar the reset leaves */
  const x = await p.evaluate(() => { const e = document.getElementById('undoX'); if (!e || !e.getClientRects().length) return ''; e.click(); return e.textContent.trim() || e.getAttribute('aria-label'); }); await w(400);
  ck(`the bar has a Close button ("${x}")`, /close/i.test(x || ''), x);
  ck('Close takes the bar away', (await bar(p)) === '', await bar(p));
  await L.settings(p);
  ck('after Close, Settings still offers Put them back', await p.evaluate(() => { const e = document.getElementById('keepBack'); return !!(e && e.getClientRects().length); }));
  await p.evaluate(() => document.getElementById('keepBack').click()); await w(800);
  ck('Put them back brings the numbers back', (await goal(p)) === before, await goal(p));

  /* a backup loaded: the bar stays across tabs */
  await L.settings(p);
  const good = await p.evaluate(() => { const s = JSON.parse(JSON.stringify(__t.S)); s.plan.goals.forEach(g => { if (g.id === 'trip1') g.target = 70000; }); return JSON.stringify(s); });
  await p.evaluate(g => { const t = document.getElementById('bk'); t.value = g; t.dispatchEvent(new Event('input', { bubbles: true })); }, good); await w(200);
  await p.evaluate(() => document.getElementById('bkLoad').click()); await w(800);
  await p.evaluate(() => document.getElementById('bkLoad').click()); await w(900);
  t = await bar(p);
  ck('loading a backup offers Undo', /Backup loaded\. You can undo for 3 days/.test(t), t);
  seen = await tabs(p);
  ck('the backup Undo stays on every tab', seen.every(s => /Backup loaded/.test(s)), seen);
  await p.evaluate(() => document.getElementById('undoGo').click()); await w(800);
  ck('Undo puts back the numbers from before the backup', (await goal(p)) === before, await goal(p));

  /* a goal removed: the bar stays across tabs */
  await L.tab(p, 'tab-goals'); await w(400);
  await p.evaluate(() => { const b = document.querySelector('[data-gedit="trip1"]'); b && b.click(); }); await w(500);
  await p.evaluate(() => document.querySelector('[data-gdel]').click()); await w(700);
  await p.evaluate(() => document.querySelector('[data-gdel]').click()); await w(800);
  t = await bar(p);
  ck('removing a goal offers Undo', /Trip removed\. You can undo for 3 days/.test(t), t);
  seen = await tabs(p);
  ck('the goal Undo stays on every tab', seen.every(s => /Trip removed/.test(s)), seen);

  /* replaced by another Undo: a receipt's Undo takes its place and still goes by itself */
  const m = await L.rc(p, 1200, 'envelope', null, 'Made-up lunch');
  t = await bar(p);
  ck('a receipt Undo replaces the goal Undo', /Logged|Undo|lunch|1,200/.test(t) && !/Trip removed/.test(t), { t, m });
  await w(9000);
  ck('the small receipt Undo still goes by itself', (await bar(p)) === '', await bar(p));
  await L.settings(p);
  ck('the goal copy is still in Settings', await p.evaluate(() => { const e = document.getElementById('keepBack'); return !!(e && e.getClientRects().length); }));
  const e1 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e1.length === 0, e1.slice(0, 3));
  await b.close();

  /* phone B: cloud load, reload, the bar says sharing stops, Undo shows the cloud copy Off at once */
  const C = require('./cloud_lib.js'), { seen: vis, text, tap, until } = C;
  const srv = await C.server();
  const A = await C.profile(srv.url);
  await L.rc(A.p, 1234, 'envelope', null, 'Made-up noodles');
  await L.settings(A.p); await until(() => vis(A.p, '#vaultOn')); await tap(A.p, '#vaultOn');
  await tap(A.p, '#vaultFlow [data-vf-next]');
  const code = await text(A.p, '#vaultCodeTxt');
  await tap(A.p, '#vaultSaved'); await until(() => srv.st.puts >= 1); await w(4000);
  const B = await C.profile(srv.url);
  await L.rc(B.p, 700, 'envelope', null, 'Made-up own spend on B');
  await B.p.evaluate(() => { __t.persist(); }); await w(1500);
  await L.settings(B.p); await until(() => vis(B.p, '#vaultHave')); await tap(B.p, '#vaultHave');
  await B.p.type('#vaultIn', code); await tap(B.p, '#vaultUse'); await until(() => vis(B.p, '#vaultLoad')); await tap(B.p, '#vaultLoad');
  await until(async () => /noodles/.test(await B.p.evaluate(() => JSON.stringify(__t.S.receipts))));
  await w(6000); await B.p.reload(); await w(4000);
  t = await bar(B.p);
  ck('after a reload the cloud Undo bar says Undo also stops sharing the cloud copy', /The cloud copy replaced the numbers on this device\..*Undo puts your old numbers back here\. The cloud copy stays as it is, and this device stops using it\./.test(t), t);
  await L.settings(B.p); await w(400);
  const on0 = await text(B.p, '#vaultState');
  ck('before Undo Settings says the cloud copy is On', /^On/.test(on0), on0);
  await tap(B.p, '#undoGo'); await w(1500);
  const off = await text(B.p, '#vaultState');
  ck('right after Undo, Settings says the cloud copy is Off', /^Off/.test(off), off);
  ck('the Keep a copy in the cloud button is back', await vis(B.p, '#vaultOn'));
  const e2 = B.errs.filter(e => !/status of 409/.test(e));
  ck('phone B: no page errors', e2.length === 0, e2.slice(0, 3));
  await A.b.close(); await B.b.close(); srv.close();

  console.log(bad ? `qc13_undo_stays: ${bad} FAIL` : 'qc13_undo_stays: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc13_undo_stays: FAIL'); process.exit(1); });
