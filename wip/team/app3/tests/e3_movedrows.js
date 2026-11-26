#!/usr/bin/env node
/* [coordinator 18, ruling A, slice 10] Receipts lists everything that moved money in a stretch, ticked bills and pay
   included, from the same records Home counts as moved since the bank's check ("out, logged since" and "in, logged
   since"), each with Remove (asked first) and Undo. The made-up Mako book with a Gym bill (5th, 8,000), checked on 28 Nov
   (bank typed); on 11 Dec, with no figure typed, the Gym bill, both pays and both card payments ticked; a 1,500 spend
   logged on 11 Dec. Today 12 Dec. Home's moved lines equal Receipts' rows since the check, count and total; money in
   rows read "in", never "back". Made-up yen. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs'), path = require('path');
const E = path.join(__dirname, '../../engine/');
const LA = require(E + 'lookahead.js'), CK = require(E + 'checkin.js'), IDS = require(E + 'ids.js');
const DAY = '2026-12-12', BANK = 'k7m2qa-f3n8p1x6wd-1', GYM = 'k7m2qa-gymb1llxxx-1', AT = '2026-11-20T12:00:00.000+09:00';
function seed() {
  let b = JSON.parse(fs.readFileSync(path.join(__dirname, '../fixtures/mako_madeup_book.json'), 'utf8'));
  b.schedules.push({ id: GYM, kind: 'bill', name: 'Gym', acct: BANK, cur: 'JPY', shift: 'after', from: '2026-11-20', rules: [{ from: null, rule: { every: 'month', days: [5] }, at: AT, by: 'k7m2qa' }], steps: [{ from: null, amount: 8000, at: AT, by: 'k7m2qa' }], told: AT, at: AT, by: 'k7m2qa' });
  const newId = IDS.idMaker('m0v3dr');
  const check = (day, figs) => {
    const r = LA.lookahead(b, day), expected = {}, lands = {};
    for (const x of r.checkIn.toConfirm) { expected[x.item] = x.amount; lands[x.item] = x.lands; }
    b = CK.apply(b, CK.checkIn(b, { day, told: day + 'T12:00:00.000+09:00', newId, figures: figs, ticked: r.checkIn.toConfirm.map(x => x.item), unticked: [], amounts: {}, expected, lands, landed: {} }));
  };
  check('2026-11-28', { [BANK]: 200000 });
  check('2026-12-11', {});
  b.events.push({ id: newId(), k: 'spend', acct: BANK, a: 1500, date: '2026-12-11', line: 'free', src: { type: 'typed' }, told: '2026-12-11T18:00:00.000+09:00', at: '2026-12-11T18:00:00.000+09:00', by: 'm0v3dr' });
  return b;
}
const saved = p => p.evaluate(async () => { const s = await BurrowStore.open(); try { const r = await s.load(); return r.copy; } finally { s.close(); } });
(async () => {
  const prof = fs.mkdtempSync(require('os').tmpdir() + '/a3moved-');
  const { b, p, errs } = await T.open({ profile: prof });
  try {
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
    await p.evaluate(async bk => { const s = await BurrowStore.open(); await s.load(); const r = await s.save(bk, { full: true }); s.close(); return r.ok; }, seed());
    await p.reload(); await T.w(500);
    /* Home: the engine's parts since the check, as Home writes them */
    const parts = await p.evaluate(b => { const a = BurrowApp3.E3.view(BurrowApp3.E3.today()).accounts[b]; return { out: a.loggedOut, in: a.loggedIn, asOf: a.asOf }; }, BANK);
    const homeLine = await p.$eval(`#a3Home [data-card=bank][data-acct="${BANK}"] [data-fig=age]`, e => e.textContent.replace(/\s+/g, ' ').trim());
    ck('Home writes the moved parts since the 28 Nov check', parts.asOf === '2026-11-28' && /\(out, logged since\)/.test(homeLine) && /\(in, logged since\)/.test(homeLine), homeLine);
    /* Receipts: every row since the check, this stretch and the one before */
    await p.tap('[data-tab="receipts"]'); await T.w(400);
    const rowsNow = async () => p.evaluate((b, from) => {
      const bk = BurrowApp3.E3.book, out = [];
      for (const li of document.querySelectorAll('#rcList [data-rc], #rcList [data-tick]')) {
        const id = li.dataset.rc || li.dataset.tick, e = bk.events.find(x => x.id === id);
        if (!e || e.date <= from) continue;
        const dir = e.k === 'in' ? 'in' : 'out', amt = e.k === 'repay' && e.a2 != null ? e.a2 : e.a;
        out.push({ id, dir, amt, text: li.textContent.replace(/\s+/g, ' ').trim(), remove: !!li.querySelector('[data-untick]') || !!li.dataset.rc });
      }
      return out;
    }, BANK, parts.asOf);
    let rows = await rowsNow();
    await p.click('#rcOlder'); await T.w(300);
    rows = rows.concat(await rowsNow());
    const sum = d => rows.filter(r => r.dir === d).reduce((t, r) => t + r.amt, 0);
    ck('Receipts lists the ticked bill, both pays, both card payments and the spend since the check: 6 rows', rows.length === 6, JSON.stringify(rows.map(r => r.text)));
    ck('their money out equals Home\'s "out, logged since"', sum('out') === parts.out, `${sum('out')} ${parts.out}`);
    ck('their money in equals Home\'s "in, logged since"', sum('in') === parts.in, `${sum('in')} ${parts.in}`);
    ck('the ticked bill reads as lane/controls-6\'s rows: name, day, bank, "ticked at Check your bank"', rows.some(r => /^Gym ?7 Dec, Main bank, ticked at Check your bank/.test(r.text)), JSON.stringify(rows.map(r => r.text)));
    ck('money in rows read "in", never "back"', rows.filter(r => r.dir === 'in').every(r => /in ¥[\d,]+$/.test(r.text) && !/back/.test(r.text)), JSON.stringify(rows.filter(r => r.dir === 'in').map(r => r.text)));
    ck('each row can be removed (a tick: Remove this tick; a spend: tapped open, Remove)', rows.every(r => r.remove));
    /* the ticked bill removed: asked first, Home and Receipts move together; Undo */
    const gym = rows.find(r => /^Gym/.test(r.text));
    await p.$eval(`#rcList [data-untick="${gym.id}"]`, e => e.click()); await T.w(300);
    ck('Remove this tick asks first', /^Untick Gym of ¥8,000, 7 Dec\?/.test(await p.$eval('#rcTickSure [data-sure]', e => e.textContent.trim()).catch(() => '')));
    await p.$eval('#rcTickSure [data-sureyes]', e => e.click()); await T.w(700);
    const out2 = await p.evaluate(b => BurrowApp3.E3.view(BurrowApp3.E3.today()).accounts[b].loggedOut, BANK);
    ck('unticked: Home\'s money out drops by 8,000, and the row is gone', out2 === parts.out - 8000 && !(await p.$(`#rcList [data-tick="${gym.id}"]`)), `${out2}`);
    const undo = await p.evaluate(() => { const x = [...document.querySelectorAll('#a3Msg button')].find(y => /Undo/.test(y.textContent)); if (x) x.click(); return !!x; }); await T.w(700);
    ck('Undo puts it back', undo && !(await saved(p)).events.find(e => e.id === gym.id).gone);
    ck('no page errors', !errs.length, errs.join(' | '));
  } finally { await b.close(); fs.rmSync(prof, { recursive: true, force: true }); }
  T.done('e3_movedrows');
})();
