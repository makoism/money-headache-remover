#!/usr/bin/env node
/* "Which to keep" answered on both devices (qc-data-safety run 5 CONFUSING 1, coordinator 18; M20, M61, M85).
   Rent is changed on two devices and both are asked. Device B keeps one amount and sends it. Device A, still showing the
   old question, keeps the other. The join asks again. PASS: A says "Your other device already chose <B's>. Keep that, or
   use <A's>?", B says what A chose after it, each with the two choices; nothing is lost; A's "Keep <B's>" puts B's amount
   on both devices. Made-up money, local fake vault. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs'), os = require('os'), path = require('path');
const { makeVault, serve } = require('./fake_vault.js');
const DAY = '2026-12-10';
const seed = (p, bk) => p.evaluate(async bk0 => { const s = await BurrowStore.open(); await s.load(); const r = await s.save(bk0, { full: true }); s.close(); return r.ok; }, bk);
const stored = p => p.evaluate(async () => { const s = await BurrowStore.open(); try { const r = await s.load(); return r.copy; } finally { s.close(); } });
const setAmount = (p, id, amount, at) => p.evaluate(async (id0, a0, at0) => {
  const by = BurrowStore.local.deviceIdPart(), s = await BurrowStore.open();
  try { const r = await s.load(); const x = r.copy.schedules.find(y => y.id === id0); x.steps = [{ from: null, amount: a0 }]; Object.assign(x, { at: at0, by }); return (await s.save(r.copy)).ok; } finally { s.close(); }
}, id, amount, at);
const until = async (f, ms) => { for (let i = 0; i < (ms || 8000) / 100; i++) { if (await f()) return true; await T.w(100); } return false; };
const amountOf = (b, id) => b.schedules.find(x => x.id === id).steps.slice(-1)[0].amount;
const keptOf = (b, of) => (b.keptVersions || []).find(k => k.of === of);
const qText = p => p.$$eval('[data-cloudq=which]', qs => qs.map(q => q.textContent.replace(/\s+/g, ' ').trim()).join(' || ')).catch(() => '');
const btns = p => p.$$eval('[data-cloudq=which] button', bs => bs.map(b => b.textContent.trim())).catch(() => []);
const fmt = n => '¥' + n.toLocaleString('en-US');
async function settingsOpen(p) { await p.bringToFront(); if (!(await p.$('#a3SetClose'))) await p.click('#a3SetGo'); await until(async () => !!(await p.$('#a3CloudState'))); await T.w(300); }
async function settingsClose(p) { await p.bringToFront(); if (await p.$('#a3SetClose')) { await p.click('#a3SetClose'); await T.w(200); } }
/* tap the Keep button on the row (or the button) whose text holds `txt` */
async function tapWith(p, txt) {
  await p.bringToFront();
  for (const li of await p.$$('[data-cloudq=which] li')) if ((await li.evaluate(e => e.textContent)).includes(txt)) { await (await li.$('button')).click(); return true; }
  for (const b of await p.$$('[data-cloudq=which] button')) if ((await b.evaluate(e => e.textContent)).includes(txt)) { await b.click(); return true; }
  return false;
}
(async () => {
  const vault = makeVault();
  const html = path.join(__dirname, '../index.html');
  const s = await serve(vault, () => fs.readFileSync(html));
  const URL = `http://127.0.0.1:${s.port}/?today=${DAY}`;
  const A = await T.open({ profile: fs.mkdtempSync(path.join(os.tmpdir(), 'a3stA-')) });
  const B = await T.open({ profile: fs.mkdtempSync(path.join(os.tmpdir(), 'a3stB-')) });
  const rev = () => (vault.rows.size ? vault.rows.values().next().value.rev : 0);
  try {
    const book = T.book();
    const RENT = book.schedules.find(x => x.name === 'Rent').id;
    await A.p.goto(URL); await T.w(300); await seed(A.p, book); await A.p.reload(); await T.w(400);
    await A.p.click('#a3SetGo'); await T.w(200); await A.p.click('#a3CloudOn');
    await until(async () => !!(await A.p.$('[data-cloud=code]')));
    const code = (await A.p.$eval('[data-cloud=code]', e => e.textContent)).trim();
    await A.p.click('#a3CloudSaved');
    ck('(A turned the cloud copy on)', await until(() => vault.rows.size === 1));
    await T.w(500); await settingsClose(A.p);
    await B.p.goto(URL); await T.w(400);
    await B.p.click('#a3SetGo'); await T.w(200); await B.p.click('#a3CloudHave'); await B.p.type('#a3CloudCode', code); await B.p.click('#a3CloudUse');
    ck('(B joined with the code)', await until(async () => { const b = await stored(B.p); return !!b && b.schedules.length === book.schedules.length; }));
    await T.w(500); await settingsClose(B.p);
    /* the clash, asked on both: A's change sent first, then B's; then A fetches the question */
    await setAmount(A.p, RENT, 75000, '2026-12-10T09:00:00.000+09:00'); await setAmount(B.p, RENT, 78000, '2026-12-10T09:01:00.000+09:00');
    let r0 = rev(); await A.p.bringToFront(); await A.p.reload(); await until(() => rev() > r0); await T.w(400);
    await B.p.bringToFront(); await B.p.reload(); await T.w(300);
    ck('(B is asked)', await until(async () => { const k = keptOf(await stored(B.p), RENT); return !!k && k.ask; }));
    await T.w(800);
    await A.p.bringToFront(); await A.p.reload(); await T.w(300);
    ck('(A is asked too)', await until(async () => { const k = keptOf(await stored(A.p), RENT); return !!k && k.ask; }));
    await T.w(800);
    await settingsOpen(A.p); await settingsOpen(B.p);
    /* B keeps 78,000 and sends it; A still shows the old question and keeps 75,000 */
    r0 = rev();
    ck('(B tapped Keep on 78,000)', await tapWith(B.p, '78,000'));
    ck('(B kept 78,000)', await until(async () => amountOf(await stored(B.p), RENT) === 78000));
    await until(() => rev() > r0); await T.w(500);
    await A.p.bringToFront();
    ck('(A still shows the old question)', (await A.p.$$('[data-cloudq=which] li')).length === 2);
    ck('(A tapped Keep on 75,000)', await tapWith(A.p, '75,000'));
    await T.w(2500);
    await A.p.reload(); await T.w(800); await settingsOpen(A.p);
    const ta = await qText(A.p);
    console.log(`(A now says: ${ta.slice(0, 240)}; buttons ${JSON.stringify(await btns(A.p))})`);
    ck('A: the question says the other device already chose its amount, and offers that or this one',
      ta.includes(`Your other device already chose ${fmt(78000)}. Keep that, or use ${fmt(75000)}?`), ta);
    ck('A: two choices, "Keep <theirs>" and "Use <mine>"', JSON.stringify(await btns(A.p)) === JSON.stringify([`Keep ${fmt(78000)}`, `Use ${fmt(75000)}`]), JSON.stringify(await btns(A.p)));
    const kA = keptOf(await stored(A.p), RENT);
    ck('A: nothing lost, both amounts still kept', !!kA && [75000, 78000].every(a => kA.versions.some(v => v.steps && v.steps.slice(-1)[0].amount === a)));
    await B.p.bringToFront(); await B.p.reload(); await T.w(800); await settingsOpen(B.p);
    const tb = await qText(B.p);
    console.log(`(B now says: ${tb.slice(0, 240)}; buttons ${JSON.stringify(await btns(B.p))})`);
    ck('B: the question says the other device chose its amount after this one chose', tb.includes(`Your other device chose ${fmt(75000)} after this one chose ${fmt(78000)}. Keep ${fmt(78000)}, or use ${fmt(75000)}?`), tb);
    ck('B: two choices, "Keep <mine>" and "Use <theirs>"', JSON.stringify(await btns(B.p)) === JSON.stringify([`Keep ${fmt(78000)}`, `Use ${fmt(75000)}`]), JSON.stringify(await btns(B.p)));
    /* A takes the other device's choice: both devices end on it, the question gone */
    r0 = rev();
    ck('(A tapped Keep 78,000)', await tapWith(A.p, `Keep ${fmt(78000)}`));
    ck('A: after "Keep that" the amount is the other device\'s and nothing is asked', await until(async () => { const b = await stored(A.p); return amountOf(b, RENT) === 78000 && !keptOf(b, RENT).ask; }));
    await until(() => rev() > r0); await T.w(500);
    await B.p.bringToFront(); await B.p.reload(); await T.w(800);
    ck('B: after a reload it has the same amount and no question', await until(async () => { const b = await stored(B.p); return amountOf(b, RENT) === 78000 && !keptOf(b, RENT).ask; }), amountOf(await stored(B.p), RENT));
    const errs = A.errs.concat(B.errs).filter(e => !/Failed to load resource/.test(e));
    ck('no page errors', errs.length === 0, errs.join(' | '));
  } finally { await A.b.close(); await B.b.close(); await s.close(); }
  T.done('e3_cloudstale');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
