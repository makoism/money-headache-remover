#!/usr/bin/env node
/* A spend removed BEFORE a later bank check is not held by that check (qc-numbers amounthist, blocker 1; coordinator 16
   ruling (a); built in 50452e69). The reviewer's own steps, on the screens, made-up yen:
   - Today 1 Dec 2026, setup on the screens: Main bank 100,000, pay 200,000 on day 25, Free to spend 30,000.
     The period is 25 Nov to 24 Dec; the next pay Fri 25 Dec, then Mon 25 Jan 2027.
   - 2 Dec: a 200 spend logged on Receipts (the reviewer's book had one: "it was ¥200", Expected now 299,800).
   - 3 Dec: a 5,000 spend logged on Receipts, opened, Remove, "Yes, remove it".
   - 28 Dec: Check your bank, the pay ticked, the bank typed as the Expected now figure.
   Hand-worked:
     Expected now on 28 Dec = 100,000 - 200 + 200,000 = 299,800 (the 5,000 is gone, it never left the bank).
     Typed 299,800: no gap. The new period 25 Dec to 24 Jan has a full 30,000 and nothing spent, so
     Safe to spend = 30,000 until pay on 25 Jan (the bank 299,800 can spare far more; no bills).
     Receipts this period: spent ¥0, no "Removed on 3 Dec" row (the 28 Dec check never held the 5,000).
     Receipts the old period (25 Nov to 24 Dec): spent ¥200 (not ¥5,200: the closed period is not rewritten). */
'use strict';
const { finishSetup } = require('./setup_sections.js');
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs'), os = require('os');
const typeIn = async (p, sel, v) => { await p.click(sel, { clickCount: 3 }); await p.keyboard.press('Backspace'); await p.type(sel, String(v)); };
const txt = (p, sel) => p.$eval(sel, e => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => null);
const rows = p => p.$$eval('#rcList li', ls => ls.map(l => ({ rc: l.dataset.rc || null, split: l.dataset.split || null, text: l.textContent.replace(/\s+/g, ' ').trim() })));
const saved = p => p.evaluate(async () => { const s = await BurrowStore.open(); try { const r = await s.load(); return r.copy; } finally { s.close(); } });
(async () => {
  const o = await T.open({ profile: fs.mkdtempSync(os.tmpdir() + '/a3rmb-') }), p = o.p;
  await p.goto(T.URL0 + '?today=2026-12-01'); await T.w(400);
  await p.click('#a3SetupGo'); await T.w(300);
  await typeIn(p, '#s3Bank', '100000');
  await p.select('#s3PayDay', '25');
  await typeIn(p, '#s3PayAmt', '200000'); await typeIn(p, '#s3PayName', 'Pay');
  await typeIn(p, '#s3Free', '30000');
  const secErr = await finishSetup(p); await T.w(700);
  ck('1 Dec: setup saved on the screens', secErr === '' && await p.$eval('#a3Setup', e => e.hidden), secErr);

  const logSpend = async (day, amt) => {
    await p.goto(T.URL0 + '?today=' + day); await T.w(500);
    await p.tap('[data-tab="receipts"]'); await T.w(300);
    await p.tap('#rcAmt'); await p.keyboard.type(String(amt)); await p.tap('#rcSave'); await T.w(500);
    return (await saved(p)).events.find(e => e.k === 'spend' && e.a === amt && !e.gone).id;
  };
  await logSpend('2026-12-02', 200);
  const big = await logSpend('2026-12-03', 5000);
  await p.$eval(`#rcList [data-rc="${big}"] button`, e => e.click()); await T.w(300);
  await p.$eval('#rcRemove', e => e.click()); await T.w(300);
  await p.$eval('[data-sure] [data-sureyes]', e => e.click()); await T.w(500);
  ck('3 Dec: the 5,000 is removed', !!(await saved(p)).events.find(e => e.id === big).gone);

  await p.goto(T.URL0 + '?today=2026-12-28'); await T.w(500);
  await p.click('#a3CheckGo'); await T.w(300);
  const ticks = await p.$$eval('.a3-tick', rs => rs.map(r => ({ text: r.textContent.replace(/\s+/g, ' '), on: !!(r.querySelector('input[type=checkbox]') || {}).checked })));
  ck('28 Dec: the pay is listed and ticked', ticks.some(r => /Pay/.test(r.text) && r.on), JSON.stringify(ticks));
  const sheet = await txt(p, '#a3Check');
  ck('28 Dec: Expected now is 299,800, hand-worked', /299,800/.test(sheet || ''), sheet);
  await p.tap('[data-bankfig]'); await p.keyboard.type('299,800');
  await p.click('#a3CheckSave'); await T.w(600);
  ck('28 Dec: the sheet closed', await p.$eval('#a3Check', e => e.hidden));

  const check = async when => {
    const f = await T.figs(p), safe = f.find(x => x.fig === 'safe');
    ck(`${when}: safe to spend ¥30,000, not ¥35,000`, safe && safe.amt === 30000, JSON.stringify(safe));
    const np = f.find(x => x.fig === 'nextpay');
    ck(`${when}: the next pay is 25 Jan`, np && /25 Jan/.test(np.text), np && np.text);
    await p.tap('[data-tab="receipts"]'); await T.w(300);
    let rs = await rows(p);
    ck(`${when}: this period spent ¥0`, /spent ¥0 of ¥30,000/.test(await txt(p, '[data-fig="rc-spent"]')), await txt(p, '[data-fig="rc-spent"]'));
    ck(`${when}: no "Removed on 3 Dec" row this period`, !rs.some(r => r.split === big || /Removed on 3 Dec/.test(r.text)), JSON.stringify(rs));
    await p.click('#rcOlder'); await T.w(300);
    rs = await rows(p);
    ck(`${when}: the old period spent ¥200, not ¥5,200 (not rewritten)`, /spent ¥200 of/.test(await txt(p, '[data-fig="rc-spent"]')), await txt(p, '[data-fig="rc-spent"]'));
    ck(`${when}: the old period lists no removed 5,000`, !rs.some(r => r.rc === big || r.split === big), JSON.stringify(rs));
    await p.tap('[data-tab="home"]'); await T.w(300);
  };
  await check('28 Dec after the check');
  await p.reload(); await T.w(500);
  await check('28 Dec after a reload');
  ck('no page errors', o.errs.length === 0, o.errs.join(' | '));
  await o.b.close();
  T.done('e3_removedbefore');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
