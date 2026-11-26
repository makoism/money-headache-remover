#!/usr/bin/env node
/* [qc-numbers confirming run 3, POLISH; M7, M12, M51] A card payment moved off its day by a weekend says why on Plan, in
   the same words as a pay or a bill: made-up Mako book with Card A paid on the 12th (Sat 12 Dec 2026, so it lands Mon
   14 Dec), today 25 Nov 2026. Card B, paid on its own day (11 Dec), says only the day. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
(async () => {
  const bk = T.book();
  bk.accounts.find(a => a.name === 'Card A').payDay = 12;
  const o = await T.open({ profile: require('fs').mkdtempSync(require('os').tmpdir() + '/a3cardland-') });
  try {
    await o.p.goto(T.URL0 + '?today=2026-11-25'); await T.w(300);
    await o.p.evaluate(async bk => { const s = await BurrowStore.open(); await s.save(bk, { full: true }); if (s.db) s.db.close(); }, bk);
    await o.p.reload(); await T.w(400);
    await o.p.tap('[data-tab="plan"]'); await T.w(300);
    const row = n => o.p.evaluate(n => { const r = [...document.querySelectorAll('[data-owed]')].find(e => e.textContent.includes(n)); return r ? r.textContent.replace(/\s+/g, ' ') : ''; }, n);
    const a = await row('Card A'), b = await row('Card B');
    ck('Plan: Card A next payment on 14 Dec says why', /on 14 Dec \(12 Dec is a Saturday, so the working day after\)/.test(a), a);
    ck('Plan: Card B on its own day says only the day', /on 11 Dec/.test(b) && !/is a (Saturday|Sunday|holiday)/.test(b), b);
    ck('no page errors', !o.errs.length, o.errs.join(' | '));
  } catch (e) { ck('the check ran to its end', false, e.stack); }
  finally { await o.b.close(); }
  T.done('e3_cardland');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
