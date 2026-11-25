#!/usr/bin/env node
/* The cloud copy turned on right after a setup by chat (AI_JOIN_FIXES item B; qc-foundation finding 5; M61, M67, M19).
   Mako sets up by chat on his phone on Tue 24 Nov 2026 (made-up shape: Main bank 286,000, safe to spend 201,400),
   turns the cloud copy on in Settings, writes the code down and opens his desktop. Nothing else is changed in between.
   Before the fix every send returned silently while the fill could still be undone, so the cloud stayed empty and the
   code restored nothing. Now turning the cloud copy on ends the fill's hold and the first copy is sent.
   The real core, panel, E3 and store; the model is made up (tests/chat_real.js); the cloud is the local fake vault. */
'use strict';
const T = require('./lib3.js'), { ck } = T, R = require('./chat_real.js');
const fs = require('fs'), os = require('os'), path = require('path');
const { makeVault, serve } = require('./fake_vault.js');
const until = async (f, ms) => { for (let i = 0; i < (ms || 8000) / 100; i++) { if (await f()) return true; await T.w(100); } return false; };
(async () => {
  const vault = makeVault();
  const s = await serve(vault, () => fs.readFileSync(process.env.APP3 || path.join(__dirname, '../index.html')));
  const URL = `http://127.0.0.1:${s.port}/?today=2026-11-24`;
  const A = await T.open({ profile: fs.mkdtempSync(path.join(os.tmpdir(), 'a3cfA-')) });
  const B = await T.open({ profile: fs.mkdtempSync(path.join(os.tmpdir(), 'a3cfB-')) });
  try {
    const ai = await R.relay(A.p);
    await A.p.goto(URL); await T.w(700);
    await R.setup(A.p, ai);
    const h = await R.home(A.p);
    ck('the phone: set up by chat, safe to spend 201,400 and Main bank 286,000', h.safe === 201400 && h.bank === 286000, JSON.stringify(h) + (await R.log(A.p)).slice(-300));
    ck('the fill can still be undone, and nothing has been sent', await A.p.evaluate(() => BurrowApp3.E3.held()) && vault.rows.size === 0);
    await A.p.click('#a3SetGo'); await T.w(200);
    await A.p.click('#a3CloudOn');
    await until(async () => !!(await A.p.$('[data-cloud=code]')));
    const code = (await A.p.$eval('[data-cloud=code]', e => e.textContent)).trim();
    await A.p.click('#a3CloudSaved');
    ck('turning the cloud copy on sends the first copy', await until(() => vault.rows.size === 1, 6000), JSON.stringify(vault.log.map(x => x.method)));
    ck('Settings says it is on and in step', await until(async () => /^On\./.test(await A.p.$eval('#a3CloudState', e => e.textContent)), 4000), await A.p.$eval('#a3CloudState', e => e.textContent));
    ck('the fill is no longer held back', await A.p.evaluate(() => !BurrowApp3.E3.held()));
    await A.p.click('#a3SetClose'); await T.w(200);

    /* the desktop joins with the code */
    await B.p.goto(URL); await T.w(500);
    await B.p.click('#a3OtherGo').catch(() => {}); await T.w(200);
    if (!(await B.p.$('#a3CloudHave'))) { await B.p.click('#a3SetGo'); await T.w(200); }
    await B.p.click('#a3CloudHave'); await B.p.type('#a3CloudCode', code); await B.p.click('#a3CloudUse');
    ck('the second device takes the book with the code', await until(() => B.p.evaluate(() => !!BurrowApp3.E3.book && BurrowApp3.E3.book.schedules.length > 0), 8000), await B.p.$eval('#a3CloudErr', e => e.textContent).catch(() => ''));
    await B.p.click('#a3SetClose').catch(() => {}); await T.w(300);
    const hb = await R.home(B.p);
    ck('its Home shows the same money: safe to spend 201,400, Main bank 286,000', hb.safe === 201400 && hb.bank === 286000, JSON.stringify(hb));
    const errs = A.errs.concat(B.errs).filter(e => !/Failed to load resource/.test(e));   // the vault's 404 while nothing is stored
    ck('no page errors', !errs.length, errs.join(' | '));
  } catch (e) { ck('the test ran to its end', false, e.stack); }
  await A.b.close(); await B.b.close(); s.close();
  T.done('e3_cloudfirst');
})();
