#!/usr/bin/env node
/* [qc-north-star confirming run, KNOWN M51; qc-novice C5; coordinator 18: first on wip-38.31] Home lists a late bill once:
   in the due card's "Late, not ticked off yet" (the one late list, screens/status.js lateList), never again under "May
   still go through" or "Not seen yet". A late pay (coming in) is not in that list and still shows in its own card. Made-up
   book (e3_act_book.js): Power 26 Nov, Rent and Internet 27 Nov, never ticked; looked at on 29 Nov, 5 Dec and 12 Dec. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs');
const { actBook } = require('./e3_act_book.js');
(async () => {
  const { b, p, errs } = await T.open({ profile: fs.mkdtempSync(require('os').tmpdir() + '/a3ol-') });
  const bk = actBook();
  await p.goto(T.URL0 + '?today=2026-11-29'); await T.w(300);
  await p.evaluate(async x => { const s = await BurrowStore.open(); await s.load(); await s.save(x, { full: true }); s.close(); }, bk);
  for (const day of ['2026-11-29', '2026-12-05', '2026-12-12']) {
    await p.goto(T.URL0 + '?today=' + day); await T.w(500);
    const r = T.L.lookahead(bk, day);
    const names = await p.$$eval('#a3Home li', ls => ls.map(l => (l.querySelector('span') || l).textContent.replace(/\s+/g, ' ').trim()));
    for (const [n, d] of [['Power', '26 Nov'], ['Rent', '27 Nov'], ['Internet', '27 Nov']]) {
      const k = names.filter(x => x.startsWith(n) && x.includes(d)).length;
      ck(`${day}: ${n} of ${d} is listed once on Home`, k === 1, JSON.stringify(names.filter(x => x.startsWith(n))));
    }
    const pays = [].concat(r.mayStillPost || [], r.notSeenYet.items || []).filter(o => /-(4|5)@/.test(o.item));
    if (pays.length) ck(`${day}: a late pay still shows on Home`, names.some(x => /Main job|Side job/.test(x)), JSON.stringify(names));
  }
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();
  T.done('e3_onelate');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
