#!/usr/bin/env node
/* The cloud copy through the page, two devices, the made-up Mako book, a local fake vault (tests/fake_vault.js) that also
   serves the page, never the real server (DECISIONS_ROUND2 D5, E3, AQ1, AQ3, AW7).
   A turns it on: a code is shown once, and after "I saved the code" the copy is sent (only ciphertext). B, with nothing,
   types the code and gets the same book. A checks the bank; leaving the app sends it; B takes it on opening. The same
   schedule renamed on both: B is asked which to keep, picks A's, and A gets it; the other version stays kept. A turns
   it off and deletes the cloud copy, after being told what that means. A vault that refuses says so and keeps the money
   here. Every request goes to the page's own address. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs'), os = require('os'), path = require('path');
const { makeVault, serve } = require('./fake_vault.js');
const DAY = '2026-12-10';
const book = T.book();
/* the book through the store (store/idb.js), as the page keeps it; a change made here is read by the page on its next open */
const seed = (p, bk) => p.evaluate(async bk0 => { const s = await BurrowStore.open(); await s.load(); const r = await s.save(bk0, { full: true }); s.close(); return r.ok; }, bk);
const stored = p => p.evaluate(async () => { const s = await BurrowStore.open(); try { const r = await s.load(); return r.copy; } finally { s.close(); } });
const rename = (p, id, name, at, by) => p.evaluate(async (id0, n, a, b) => { const s = await BurrowStore.open(); try { const r = await s.load(); const x = r.copy.schedules.find(y => y.id === id0); Object.assign(x, { name: n, at: a, by: b }); return (await s.save(r.copy)).ok; } finally { s.close(); } }, id, name, at, by);
const state = p => p.$eval('#a3CloudState', e => e.textContent);
const until = async (f, ms) => { for (let i = 0; i < (ms || 8000) / 100; i++) { if (await f()) return true; await T.w(100); } return false; };
(async () => {
  const vault = makeVault();
  const html = path.join(__dirname, '../index.html');
  const s = await serve(vault, () => fs.readFileSync(html));
  const URL = `http://127.0.0.1:${s.port}/?today=${DAY}`;
  const own = r => r.startsWith(`http://127.0.0.1:${s.port}/`);
  const A = await T.open({ profile: fs.mkdtempSync(path.join(os.tmpdir(), 'a3cA-')) });
  const B = await T.open({ profile: fs.mkdtempSync(path.join(os.tmpdir(), 'a3cB-')) });
  try {
    /* ---- A turns it on ---- */
    await A.p.goto(URL); await T.w(300); await seed(A.p, book); await A.p.reload(); await T.w(400);
    await A.p.click('#a3SetGo'); await T.w(200);
    ck('off at first, and it says the money is on this device only', /^Off\./.test(await state(A.p)));
    await A.p.click('#a3CloudOn');
    ck('turning on shows a code once', await until(async () => !!(await A.p.$('[data-cloud=code]'))));
    const code = (await A.p.$eval('[data-cloud=code]', e => e.textContent)).trim();
    ck('the code looks like XXXX-XXXX-XXXX-XXXX-XXXX, no prefix', /^[A-Z0-9]{4}(-[A-Z0-9]{4}){4}$/.test(code), code);
    ck('nothing is sent before the person says they saved the code', vault.rows.size === 0);
    await A.p.click('#a3CloudSaved');
    ck('then the copy is sent', await until(() => vault.rows.size === 1 && /^On\. Last in step/.test(''), 200) || await until(async () => vault.rows.size === 1 && /^On\./.test(await state(A.p))));
    const puts = vault.log.filter(x => x.method === 'PUT').map(x => JSON.stringify(x.body)).join(' ');
    ck('only ciphertext was sent (no names, no amounts)', !puts.includes(book.schedules[0].name) && !puts.includes('286000'));
    await A.p.click('#a3SetClose');

    /* ---- B, with nothing, uses the code ---- */
    await B.p.goto(URL); await T.w(400);
    await B.p.click('#a3SetGo'); await T.w(200);
    ck('a device with nothing offers "I have a code" but no turn on', !!(await B.p.$('#a3CloudHave')) && !(await B.p.$('#a3CloudOn')));
    await B.p.click('#a3CloudHave'); await B.p.type('#a3CloudCode', 'MHR-AAAA'); await B.p.click('#a3CloudUse'); await T.w(200);
    ck('a short code is refused with what a code looks like', /20 letters and digits/.test(await B.p.$eval('#a3CloudErr', e => e.textContent)));
    await B.p.$eval('#a3CloudCode', e => { e.value = ''; }); await B.p.type('#a3CloudCode', 'mhr-' + code.toLowerCase()); await B.p.click('#a3CloudUse');
    ck('the code finds the cloud copy and B takes it', await until(async () => { const b = await stored(B.p); return !!b && b.schedules.length === book.schedules.length; }));
    await B.p.click('#a3SetClose'); await T.w(200);
    ck('B\'s Home shows the book', /Safe to spend/.test(await B.p.$eval('#a3Home', e => e.textContent)));

    /* ---- A checks the bank; leaving sends it; B takes it on opening ---- */
    const rev0 = vault.rows.values().next().value.rev;
    await A.p.click('#a3CheckGo'); await T.w(300);
    await A.p.tap('[data-bankfig]'); await A.p.keyboard.type('339,000');
    await A.p.click('#a3CheckSave'); await T.w(400);
    await A.p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
    ck('leaving the app sends the change', await until(() => vault.rows.values().next().value.rev > rev0));
    await A.p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); });
    await B.p.reload(); await T.w(300);
    ck('B takes it on opening: the bank figure A typed', await until(async () => { const f = await T.figs(B.p); const b = f.find(x => x.fig === 'bank'); return !!b && b.amt === 339000; }));

    /* ---- the same schedule renamed on both: asked, both kept ---- */
    const sid = book.schedules[0].id;
    await rename(A.p, sid, 'Main job (desk)', '2026-12-10T09:00:00.000+09:00', 'dsk001');
    await T.w(300);
    await rename(B.p, sid, 'Main job (phone)', '2026-12-10T09:05:00.000+09:00', 'phn002');
    const rev1 = vault.rows.values().next().value.rev;
    await A.p.reload();
    ck('A sends its rename on opening', await until(() => vault.rows.values().next().value.rev > rev1));
    await B.p.reload(); await T.w(300);
    await until(async () => { const b = await stored(B.p); return !!(b && (b.keptVersions || []).length); });
    await B.p.click('#a3SetGo');
    ck('B is asked which name to keep', await until(async () => !!(await B.p.$('[data-cloudq=which]'))));
    const opts = await B.p.$$eval('[data-cloudq=which] li', ls => ls.map(l => l.textContent));
    ck('both names are offered', opts.some(t => /desk/.test(t)) && opts.some(t => /phone/.test(t)), opts.join(' | '));
    const i = opts.findIndex(t => /desk/.test(t));
    await (await B.p.$$('[data-cloudq=which] li button'))[i].click();
    ck('B keeps the desk name and the question is gone', await until(async () => { const b = await stored(B.p); return b && b.schedules.find(x => x.id === sid).name === 'Main job (desk)' && !(await B.p.$('[data-cloudq=which]')); }));
    const kept = (await stored(B.p)).keptVersions.find(k => k.of === sid);
    ck('the phone name stays kept, so it can come back', !!kept && kept.versions.some(v => v.name === 'Main job (phone)') && kept.ask === false);
    const rev2 = vault.rows.values().next().value.rev;
    await B.p.click('#a3CloudNow');
    ck('Send now sends the pick', await until(() => vault.rows.values().next().value.rev > rev2));
    await A.p.reload();
    ck('A takes the pick on opening', await until(async () => { const b = await stored(A.p); return b && b.schedules.find(x => x.id === sid).name === 'Main job (desk)'; }));

    /* ---- a vault that refuses: said, and the money stays ---- */
    const realHandle = vault.handle;
    vault.handle = (m, ...a) => (m === 'PUT' ? { status: 503, j: { error: 'down' } } : realHandle(m, ...a));
    await rename(B.p, sid, 'Main job', '2026-12-10T10:00:00.000+09:00', 'phn002');
    await B.p.reload(); await T.w(300);
    await B.p.click('#a3SetGo');
    ck('a refused send is said, and the money here stays', await until(async () => /did not take the copy/.test(await state(B.p))) && (await stored(B.p)).schedules.find(x => x.id === sid).name === 'Main job');
    ck('it says what is on this device only', !!(await B.p.$('[data-cloud=behind]')));
    vault.handle = realHandle;

    /* ---- A turns it off and deletes the cloud copy ---- */
    await A.p.click('#a3SetGo'); await T.w(200);
    await A.p.click('#a3CloudOff'); await T.w(100);
    const words = await A.p.$eval('[data-cloud=offask]', e => e.textContent);
    ck('turning off says what is lost each way', /stays for your other devices/.test(words) && /opens nothing/.test(words) && /backup file/.test(words));
    await A.p.click('#a3CloudDel');
    ck('the cloud copy is deleted and A is off', await until(async () => vault.rows.size === 0 && /^Off\./.test(await state(A.p))));
    ck('A\'s money stays', (await stored(A.p)).schedules.find(x => x.id === sid).name === 'Main job (desk)');

    const outside = A.requests.concat(B.requests).filter(r => !own(r));
    ck('every request went to the page\'s own address', outside.length === 0, outside.join(' '));
    const errs = A.errs.concat(B.errs).filter(e => !/Failed to load resource/.test(e));
    ck('no page errors', errs.length === 0, errs.join(' | '));
  } finally { await A.b.close(); await B.b.close(); await s.close(); }
  T.done('e3_cloud');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
