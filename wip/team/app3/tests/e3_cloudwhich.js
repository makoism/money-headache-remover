#!/usr/bin/env node
/* "Which to keep" lets a person choose (M20, M61; coordinator item 6, 25 Nov). Two devices through the page on the
   local fake vault, made-up money. Both change one bill's amount (Rent) to two different values with no signal between
   them. Settings on the second device shows two rows that differ: each names its amount through the page's one amount
   formatter and which device it came from ("this device" or "your other device"). One is picked, and both devices end
   with it. The edit itself is written into each device's store with that device's own device part, as a Plan edit
   keeps it; what is tested is the question, the rows and the pick. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs'), os = require('os'), path = require('path');
const { makeVault, serve } = require('./fake_vault.js');
const DAY = '2026-12-10';
const seed = (p, bk) => p.evaluate(async bk0 => { const s = await BurrowStore.open(); await s.load(); const r = await s.save(bk0, { full: true }); s.close(); return r.ok; }, bk);
const stored = p => p.evaluate(async () => { const s = await BurrowStore.open(); try { const r = await s.load(); return r.copy; } finally { s.close(); } });
const devicePart = p => p.evaluate(() => BurrowStore.local.deviceIdPart());
const setAmount = (p, id, amount, at) => p.evaluate(async (id0, a0, at0) => {
  const by = BurrowStore.local.deviceIdPart();
  const s = await BurrowStore.open();
  try { const r = await s.load(); const x = r.copy.schedules.find(y => y.id === id0); x.steps = [{ from: null, amount: a0 }]; Object.assign(x, { at: at0, by }); return (await s.save(r.copy)).ok; } finally { s.close(); }
}, id, amount, at);
const until = async (f, ms) => { for (let i = 0; i < (ms || 8000) / 100; i++) { if (await f()) return true; await T.w(100); } return false; };
const amountOf = (b, id) => b.schedules.find(x => x.id === id).steps.slice(-1)[0].amount;
(async () => {
  const vault = makeVault();
  const html = path.join(__dirname, '../index.html');
  const s = await serve(vault, () => fs.readFileSync(html));
  const URL = `http://127.0.0.1:${s.port}/?today=${DAY}`;
  const A = await T.open({ profile: fs.mkdtempSync(path.join(os.tmpdir(), 'a3wA-')) });
  const B = await T.open({ profile: fs.mkdtempSync(path.join(os.tmpdir(), 'a3wB-')) });
  const rev = () => (vault.rows.size ? vault.rows.values().next().value.rev : 0);
  try {
    const book = T.book();
    const rent = book.schedules.find(x => x.name === 'Rent').id;
    await A.p.goto(URL); await T.w(300); await seed(A.p, book); await A.p.reload(); await T.w(400);
    await A.p.click('#a3SetGo'); await T.w(200); await A.p.click('#a3CloudOn');
    await until(async () => !!(await A.p.$('[data-cloud=code]')));
    const code = (await A.p.$eval('[data-cloud=code]', e => e.textContent)).trim();
    await A.p.click('#a3CloudSaved');
    ck('(A turned the cloud copy on)', await until(() => vault.rows.size === 1));
    await T.w(500); await A.p.click('#a3SetClose');
    await B.p.goto(URL); await T.w(400);
    await B.p.click('#a3SetGo'); await T.w(200); await B.p.click('#a3CloudHave'); await B.p.type('#a3CloudCode', code); await B.p.click('#a3CloudUse');
    ck('(B joined with the code)', await until(async () => { const b = await stored(B.p); return !!b && b.schedules.length === book.schedules.length; }));
    await T.w(500); await B.p.click('#a3SetClose'); await T.w(200);
    ck('(each device has its own device part)', (await devicePart(A.p)) !== (await devicePart(B.p)));

    /* both change Rent's amount, with no signal between them */
    await setAmount(A.p, rent, 75000, '2026-12-10T09:00:00.000+09:00');
    await setAmount(B.p, rent, 78000, '2026-12-10T09:05:00.000+09:00');
    const r1 = rev();
    await A.p.reload();
    ck('(A sends its amount on opening)', await until(() => rev() > r1));
    await T.w(500);
    await B.p.reload(); await T.w(300);
    await until(async () => { const b = await stored(B.p); return !!(b && (b.keptVersions || []).some(k => k.of === rent && k.ask)); });
    await B.p.click('#a3SetGo');
    ck('B is asked which Rent to keep', await until(async () => !!(await B.p.$('[data-cloudq=which]'))));
    const rows = await B.p.$$eval('[data-cloudq=which] li', ls => ls.map(l => l.querySelector('span').textContent.replace(/\s+/g, ' ').trim()));
    ck('two rows, and they differ', rows.length === 2 && rows[0] !== rows[1], rows.join(' | '));
    ck('each row names its amount, written as amounts are written', rows.some(t => /¥75,000/.test(t)) && rows.some(t => /¥78,000/.test(t)), rows.join(' | '));
    ck('each row says which device it came from', rows.some(t => /¥78,000/.test(t) && /this device/.test(t) && !/other device/.test(t)) && rows.some(t => /¥75,000/.test(t) && /your other device/.test(t)), rows.join(' | '));
    ck('the name, the same in both, is still there', rows.every(t => /Rent/.test(t)), rows.join(' | '));
    const i = rows.findIndex(t => /¥75,000/.test(t));
    await (await B.p.$$('[data-cloudq=which] li button'))[i].click();
    ck('B keeps 75,000 and the question is gone', await until(async () => { const b = await stored(B.p); return b && amountOf(b, rent) === 75000 && !(await B.p.$('[data-cloudq=which]')); }));
    const r2 = rev();
    await B.p.click('#a3CloudNow');
    ck('(the pick is sent)', await until(() => rev() > r2));
    await A.p.reload();
    ck('A ends with the pick too', await until(async () => { const b = await stored(A.p); return b && amountOf(b, rent) === 75000; }));
    ck('and both are the same', amountOf(await stored(A.p), rent) === amountOf(await stored(B.p), rent));
    const errs = A.errs.concat(B.errs).filter(e => !/Failed to load resource/.test(e));
    ck('no page errors', errs.length === 0, errs.join(' | '));
  } finally { await A.b.close(); await B.b.close(); await s.close(); }
  T.done('e3_cloudwhich');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
