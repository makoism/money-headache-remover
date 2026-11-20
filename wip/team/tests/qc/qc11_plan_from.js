/* QC round 4 money accuracy B1: the plan always started in Nov 2026. A setup on 1 Dec counted Nov as lived: the Emergency fund had Nov's
   deposit ("$730 of $4,200 so far" with nothing saved) and Home overstated Saved and Total by Nov's money. A setup on 31 Jan 2027 with
   €300 in the bank started Jan at −€300.80, Nov's and Dec's shortfall taken off what the person typed that day. The plan starts at the
   month of setup: months before it count nothing (no pay, no bills, no goal money), and the balance typed is the bank at the start of
   the setup month. Made-up numbers.  Run: node tests/qc/qc11_plan_from.js */
let bad = 0; const ck = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (x !== undefined) console.log('     saw ' + JSON.stringify(x).slice(0, 600)); } };
const R = require('/tmp/v39/real.js'); const w = R.w;
const PAGE = process.env.BUILD || '/home/claude/work/money-map-team.html';
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const typeIn = async (p, id, v) => { for (let i = 0; i < 10 && !(await p.evaluate(id => !!document.getElementById(id), id)); i++) await w(300); if (!(await p.evaluate(id => !!document.getElementById(id), id))) throw new Error('no #' + id + ' on: ' + (await p.evaluate(() => document.getElementById('tour').innerText.replace(/\s+/g, ' ').slice(0, 300)))); await p.evaluate(id => { const e = document.getElementById(id); e.value = ''; e.focus(); }, id); await p.keyboard.type(v); await p.keyboard.press('Tab'); await w(250); };
/* the whole setup, as a person taps it: currency, pay and balance, rent and food, the emergency fund with nothing saved */
const setup = async (iso, cur, pay, bank, rent, food, fund) => {
  const x = await R.phone({ w: 412, h: 915, dpr: 1, mobile: true, keep: true }), p = x.p;
  await clock(p, iso); await p.goto('file://' + PAGE + '?sfxtest'); await w(1500);
  const step = async () => { await p.evaluate(() => { const n = document.getElementById('tourNext'); n && n.click(); }); await w(700); };
  for (let i = 0; i < 6 && !(await p.evaluate(() => !!document.querySelector('#tourBody input[name=tourCur]'))); i++) await step();
  await p.evaluate(c => { const i = [...document.querySelectorAll('#tourBody input[name=tourCur]')].find(x => x.value === c); i && i.click(); }, cur); await w(500);
  for (let i = 0; i < 8 && !(await p.evaluate(() => !!document.getElementById('tourPay'))); i++) await step();
  await typeIn(p, 'tourPay', pay); await typeIn(p, 'tourBank', bank);
  let done = '';
  for (let i = 0; i < 22; i++) {
    const st = await p.evaluate(() => { const t = document.getElementById('tour'); return !t || t.hidden ? null : t.innerText.replace(/\s+/g, ' '); });
    if (st === null) break; if (/Setup done/.test(st)) done = st;
    if (/Finish later Rent or mortgage/.test(st)) await typeIn(p, 'tourAmt', rent);
    else if (/Finish later Food and groceries/.test(st)) await typeIn(p, 'tourAmt', food);
    else if (await p.evaluate(() => { const e = document.getElementById('tourAmt'); return !!e && !e.readOnly; })) await typeIn(p, 'tourAmt', '0');
    if (await p.evaluate(() => { const e = document.getElementById('tourGCost'); return !!e && !e.value; })) await typeIn(p, 'tourGCost', fund);
    await step();
  }
  return Object.assign(x, { done });
};
const model = p => p.evaluate(() => { const S = __t.S, C = __t.calcAll(S), r = ym => { const m = C.byYm[ym]; return m && { inflow: m.inflow, out: m.out, goals: m.goalsTotal, start: m.bankStart, end: m.bankEnd, saved: Object.keys(m.bal).reduce((a, k) => a + m.bal[k], 0), savedBefore: Object.keys(m.balBefore).reduce((a, k) => a + m.balBefore[k], 0) }; };
  return { from: S.cfg.planFrom || null, nov: r('2026-11'), dec: r('2026-12'), jan: r('2027-01') }; });
(async () => {
  /* ---- setup on 1 Dec 2026 ---- */
  const A = await setup('2026-12-01T10:00:00', '$', '3000', '1000', '1000', '400', '4200');
  const a = await model(A.p);
  ck('1 Dec: the plan starts in Dec', a.from === '2026-12', a.from);
  ck('1 Dec: Nov counts nothing (no pay in, nothing out, no goal money)', a.nov.inflow === 0 && a.nov.out === 0 && a.nov.goals === 0, a.nov);
  ck('1 Dec: Dec starts at the $1,000 typed', a.dec.start === 1000, a.dec);
  ck('1 Dec: nothing is in the goals at the start of Dec', a.dec.savedBefore === 0, a.dec);
  ck('1 Dec: setup done says $0 saved now', /\$0 saved now/.test(A.done), A.done.slice(0, 300));
  ck('1 Dec: setup done names the end of Dec, not Nov money', /by the end of Dec/.test(A.done), A.done.slice(0, 300));
  /* a receipt dated before the plan starts is already in the balance typed at setup: it is not spending past the plan */
  await A.p.evaluate(() => { const S = __t.S; S.receipts.push({ id: 'rold1', d: '2026-11-28', a: 250, c: 'envelope', n: 'Made-up dinner in Nov' }); __t.persist(); __t.restructure(); }); await w(500);
  const a2 = await model(A.p);
  ck('1 Dec: a receipt dated in Nov does not take money from the bank again (Dec still starts at $1,000)', a2.dec.start === 1000, a2.dec);
  /* ---- setup on 31 Jan 2027 ---- */
  const B = await setup('2027-01-31T10:00:00', '€', '2000', '300', '1900', '400.40', '4000');
  const b = await model(B.p);
  ck('31 Jan: the plan starts in Jan', b.from === '2027-01', b.from);
  ck('31 Jan: Jan starts at the €300 typed that day, not −€300.80', b.jan.start === 300, b.jan);
  ck('31 Jan: Nov and Dec count nothing', b.nov.inflow === 0 && b.nov.out === 0 && b.dec.inflow === 0 && b.dec.out === 0, { nov: b.nov, dec: b.dec });
  /* ---- the page reloads: the start month is kept ---- */
  await B.p.reload(); await w(1500);
  ck('31 Jan: after a reload the plan still starts in Jan', (await model(B.p)).from === '2027-01');
  const errs = A.errs.concat(B.errs);
  ck('no page errors', errs.length === 0, errs.slice(0, 3));
  await A.b.close(); await B.b.close();
  console.log(bad ? `qc11_plan_from: ${bad} FAIL` : 'qc11_plan_from: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc11_plan_from: FAIL'); process.exit(1); });
