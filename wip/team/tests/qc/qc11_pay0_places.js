/* QC round 4 money accuracy B2: setup with pay 0 (balance 5,000, rent 900, food 400) left the sample amounts in Free to spend,
   Education, Investing and Giving (€165, €165, €165, €85), so Home said the plan spends €1,880 and the bank ends at €3,120; the true
   figures are €1,300 and €3,700. With no pay, every place except the bills is 0, and so is every goal. Made-up numbers.
   Run: node tests/qc/qc11_pay0_places.js */
let bad = 0; const ck = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (x !== undefined) console.log('     saw ' + JSON.stringify(x).slice(0, 500)); } };
const R = require('/tmp/v39/real.js'); const w = R.w;
const PAGE = process.env.BUILD || '/home/claude/work/money-map-team.html';
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const typeIn = async (p, id, v) => { await p.evaluate(id => { const e = document.getElementById(id); e.value = ''; e.focus(); }, id); await p.keyboard.type(v); await p.keyboard.press('Tab'); await w(250); };
(async () => {
  const { b, p, errs } = await R.phone({ w: 412, h: 915, dpr: 1, mobile: true });
  await clock(p, '2026-11-20T10:00:00');
  await p.goto('file://' + PAGE + '?sfxtest'); await w(1500);
  const step = async () => { await p.evaluate(() => { const n = document.getElementById('tourNext'); n && n.click(); }); await w(700); };
  for (let i = 0; i < 6 && !(await p.evaluate(() => !!document.querySelector('#tourBody input[name=tourCur]'))); i++) await step();
  await p.evaluate(() => { const i = [...document.querySelectorAll('#tourBody input[name=tourCur]')].find(x => x.value === '€'); i && i.click(); }); await w(500);
  for (let i = 0; i < 8 && !(await p.evaluate(() => !!document.getElementById('tourPay'))); i++) await step();
  await typeIn(p, 'tourPay', '0'); await typeIn(p, 'tourBank', '5000');
  const seen = [];
  for (let i = 0; i < 20; i++) {
    const st = await p.evaluate(() => { const t = document.getElementById('tour'); if (!t || t.hidden) return null; const h = (t.querySelector('h2,h1') || {}).innerText || ''; return h + ' | ' + t.innerText.replace(/\s+/g, ' ').slice(0, 80); });
    if (st === null) break; seen.push(st);
    if (/Rent or mortgage/.test(st)) await typeIn(p, 'tourAmt', '900');
    else if (/Food and groceries/.test(st)) await typeIn(p, 'tourAmt', '400');
    else if (await p.evaluate(() => { const e = document.getElementById('tourAmt'); return !!e && !e.readOnly; })) await typeIn(p, 'tourAmt', '0');
    await step();
  }
  const m = await p.evaluate(() => { const m = __t.calcAll(__t.S).byYm['2026-11']; return { pay: m.a, play: m.jar.play, edu: m.jar.edu, ffa: m.jar.ffa, give: m.jar.give, goals: m.goalsTotal, nec: m.jar.nec, end: m.bankEnd }; });
  ck('setup ran with pay 0', m.pay === 0, { m, seen })
  ck('pay 0: Free to spend, Education, Investing and Giving are 0, not sample amounts', m.play === 0 && m.edu === 0 && m.ffa === 0 && m.give === 0, m);
  ck('pay 0: goals get nothing', m.goals === 0, m);
  ck('pay 0: the bank ends at the balance less the bills (5000 less ' + m.nec + ')', Math.abs(m.end - (5000 - m.nec)) < 0.005, m);
  ck('no page errors', errs.length === 0, errs.slice(0, 3));
  await b.close();
  console.log(bad ? `qc11_pay0_places: ${bad} FAIL` : 'qc11_pay0_places: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc11_pay0_places: FAIL'); process.exit(1); });
