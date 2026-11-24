#!/usr/bin/env node
/* Setup on the screens on a day the pay lands (DECISIONS_ROUND2 BV2.13; setup3 through answers3.js, BV1).
   Made-up: Main bank shows 50,000; pay 240,000 on the 10th; Thu 10 Dec 2026 is a weekday, so the pay is not moved.
   1. The question "Has today's pay already landed in that figure?" shows only on a pay day (not on Wed 9 Dec).
   2. Save without an answer: it is asked, nothing is kept.
   3. "No, not yet": the opening check names today's pay as still to come (notYet). "Yes": it does not. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs'), os = require('os');
const shown = (p, sel) => p.$eval(sel, e => !e.closest('[hidden]') && e.getClientRects().length > 0).catch(() => false);
const kept = p => p.evaluate(async () => { const s = await BurrowStore.open(); try { const r = await s.load(); return r.empty ? null : r.copy; } finally { s.close(); } });
async function setup(day, answer) {
  const o = await T.open({ profile: fs.mkdtempSync(os.tmpdir() + '/a3pt-') }), p = o.p;
  await p.goto(T.URL0 + '?today=' + day); await T.w(400);
  await p.click('#a3SetupGo'); await T.w(200);
  await p.type('#s3Bank', '50000'); await p.$eval('#s3PayAmt', e => e.focus()); await p.type('#s3PayAmt', '240000');
  await p.select('#s3PayDay', '10'); await p.$eval('#s3Free', e => e.focus()); await T.w(200);
  const asked = await shown(p, '#s3PayToday');
  let refused = null;
  if (answer !== undefined) {
    await p.click('#a3SetupSave'); await T.w(300);
    refused = { err: await p.$eval('#a3SetupErr', e => e.textContent), kept: await kept(p) };
    await p.select('#s3PayToday', answer);
  }
  await p.click('#a3SetupSave'); await T.w(500);
  const bk = await kept(p);
  const check = bk && bk.events.find(e => e.k === 'check' && bk.accounts.find(a => a.id === e.acct && a.type === 'bank'));
  await o.b.close();
  return { asked, refused, bk, check, errs: o.errs };
}
(async () => {
  const off = await setup('2026-12-09');
  ck('not a pay day: no question about today\'s pay', !off.asked && !!off.bk);
  const no = await setup('2026-12-10', 'no');
  ck('on the pay day the question shows', no.asked);
  ck('saving without an answer asks it, nothing kept', /today's pay/.test(no.refused.err) && no.refused.kept === null, JSON.stringify(no.refused).slice(0, 200));
  ck('"No, not yet": the opening check names today\'s pay as still to come', !!no.check && (no.check.notYet || []).length === 1, JSON.stringify(no.check));
  const yes = await setup('2026-12-10', 'yes');
  ck('"Yes, it is in it": nothing named as still to come', !!yes.check && !(yes.check.notYet || []).length, JSON.stringify(yes.check));
  const errs = [].concat(off.errs, no.errs, yes.errs);
  ck('no page errors', !errs.length, errs.join(' | '));
  T.done('e3_paytoday');
})().catch(e => { console.log('FAIL crashed ' + (e && e.stack || e)); process.exit(1); });
