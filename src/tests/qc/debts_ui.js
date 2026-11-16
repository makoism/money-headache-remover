/* Cards and loans through the real screens: add one by typing a sum, then check the Goals card, the Plan row, the Home card and the totals against model.js.
   Run: node tests/qc/debts_ui.js   Needs /tmp/v25/oracle.js and /tmp/v39/real.js */
const { phone, w } = require('/tmp/v39/real.js');
const { M } = require('/tmp/v25/oracle.js');
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL', m); } };
(async () => {
  const S = M.presetState('¥', false); S.ui = Object.assign(S.ui, { toured: true, setup: true, sampleHidden: true, done: { pay: true, bills: true, goals: true, receipts: true }, seen: { home: true, month: true, goals: true, receipts: true, basics: true } });
  const { b, p, errs } = await phone({ w: 1100, h: 1000, dpr: 1 });
  await p.evaluateOnNewDocument(st => { if (!localStorage.getItem('money-map-template-v2')) localStorage.setItem('money-map-template-v2', st); }, JSON.stringify(S));
  await p.evaluateOnNewDocument(() => { const real = Date, fixed = new real('2026-11-17T10:00:00').getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; });
  await p.goto('file://' + PAGE + '#2026-11'); await w(1400);
  const tab = async t => { await p.evaluate(t => document.querySelector(`[data-tab="${t}"]`).click(), t); await w(500); };
  const stored = () => p.evaluate(() => JSON.parse(localStorage.getItem('money-map-template-v2')));
  await tab('goals'); await p.evaluate(() => { const e = document.querySelector('[data-tab-go="goals"][data-sub="goals"]'); if (e && e.offsetParent) e.click(); }); await w(400);
  await p.evaluate(() => document.querySelector('#addDebtBtn').click()); await w(300);
  await p.type('#de-new-name', 'Card A');
  await p.type('#de-new-bal', '50000+10000'); await p.evaluate(() => document.querySelector('#de-new-apr').focus()); await w(200);
  ok((await p.$eval('#de-new-bal', e => e.value)) === '60000', 'a typed sum becomes its answer: ' + await p.$eval('#de-new-bal', e => e.value));
  await p.type('#de-new-apr', '36'); await p.type('#de-new-min', '3000'); await p.type('#de-new-extra', '0'); await w(200);
  await p.evaluate(() => document.querySelector('[data-dsave]').click()); await w(700);
  let st = await stored(); ok(st.plan.debts && st.plan.debts.length === 1 && st.plan.debts[0].balance === 60000 && st.plan.debts[0].apr === 36 && st.plan.debts[0].min === 3000, 'the debt is saved with its numbers: ' + JSON.stringify(st.plan.debts));
  /* a second one, then a rate that never pays off */
  await p.evaluate(() => document.querySelector('#addDebtBtn').click()); await w(300);
  await p.type('#de-new-name', 'Mom'); await p.type('#de-new-bal', '10000'); await p.type('#de-new-min', '1000'); await p.evaluate(() => document.querySelector('[data-dsave]').click()); await w(600);
  st = await stored(); const C = M.calcAll(st);
  const m = C.byYm['2026-11'];
  const cardText = await p.$eval('#debtCards', e => e.innerText.replace(/\s+/g, ' '));
  ok(cardText.includes('¥60,000 owed') && cardText.includes('¥10,000 owed'), 'goal page shows what is owed: ' + cardText.slice(0, 160));
  ok(cardText.includes('Put extra money here first'), 'the highest rate is marked first');
  const sub = await p.$eval('#debtSub', e => e.textContent);
  ok(sub.includes('¥70,000 owed') && sub.includes(m.debtInterest.toLocaleString('en-US')), 'summary line: ' + sub);
  await tab('month'); await p.evaluate(() => { const e = document.querySelector('[data-tab-go="month"][data-sub="month"]'); if (e && e.offsetParent) e.click(); }); await w(500);
  const rowAmt = await p.evaluate(() => { const e = document.querySelector('#ra-debts'); return e ? e.textContent : null; });
  ok(rowAmt === '¥' + m.debtPay.toLocaleString('en-US'), 'Plan row shows the month payments: ' + rowAmt + ' vs ' + m.debtPay);
  const outTotal = await p.$eval('#outTotal', e => e.textContent);
  ok(outTotal === '¥' + m.out.toLocaleString('en-US'), 'money out total includes them: ' + outTotal + ' vs ' + m.out);
  await tab('home'); await w(400);
  const hd = await p.$eval('#hDebts', e => e.hidden ? 'hidden' : e.innerText.replace(/\s+/g, ' '));
  ok(hd.includes('¥70,000') && hd.includes('Mom') && hd.includes('Card A'), 'Home card: ' + hd.slice(0, 200));
  /* extra money to the card */
  const before = M.calcAll(st).byYm['2026-11'].left;
  await p.evaluate(() => document.querySelector('[data-xm]').click()); await w(400);
  await p.type('#xmAmt', '5,000+5000'); await p.evaluate(() => document.querySelector('#xmDest').focus());
  await p.evaluate(() => { const s = document.querySelector('#xmDest'); const i = Array.from(s.options).findIndex(o => /Pay down Card A/.test(o.textContent)); s.value = String(i); s.dispatchEvent(new Event('change', { bubbles: true })); }); await w(300);
  const prev = await p.$eval('#xmPrev', e => e.textContent); ok(/All ¥10,000 goes to/.test(prev), 'preview: ' + prev);
  await p.evaluate(() => document.querySelector('[data-xmok]').click()); await w(800);
  st = await stored(); const after = M.calcAll(st).byYm['2026-11'];
  ok(after.left === before, 'the month left is unchanged by extra money that is placed: ' + before + ' vs ' + after.left);
  ok(after.debts[st.plan.debts[0].id].extra === 10000 && after.debts[st.plan.debts[0].id].pay === 13000, 'the extra went to the card: ' + JSON.stringify(after.debts[st.plan.debts[0].id]));
  /* remove */
  await tab('goals'); await w(300);
  ok(errs.length === 0, 'no page errors: ' + errs.join(' | '));
  console.log('DEBTS UI:', pass, 'pass,', fail, 'fail'); await b.close(); process.exit(fail ? 1 : 0);
})();
