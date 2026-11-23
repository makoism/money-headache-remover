#!/usr/bin/env node
/* A figure typed at Check your bank stays the same after the page is reopened (QC numbers, blocker 1), in every time
   zone and at every time of day. The reviewer's repro, made-up yen, with the page's own clock set (no ?today):
   24 Nov setup (bank 150,000, pay 240,000 on the 10th, Card A owing 35,000 paid on the 10th, close day not sure), 5,000
   logged on Card A; 28 Nov check (bank 150,000, Card A 43,000); 11 Dec check, all ticked (bank 352,000, Card A 8,000);
   9 Jan check (bank 592,000, Card A 8,000). After each check: Home shows what was typed, and every figure on Home, Plan
   and Receipts is the same after a reload. Run in Tokyo, Kiritimati, Los Angeles and UTC, early morning, mid morning
   and late at night. */
'use strict';
const fs = require('fs'), os = require('os'), path = require('path');
const { chromium } = require(process.env.TOOLS_PLAYWRIGHT || '/opt/node-tools/node_modules/playwright');
const PAGE = 'file://' + path.join(__dirname, '../index.html');
const w = ms => new Promise(r => setTimeout(r, ms));
let bad = 0, n = 0;
const ck = (name, ok, extra) => { n++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : ' ' + String(extra === undefined ? '' : extra).slice(0, 600))); if (!ok) bad++; };

/* the page clock: ?clk=<moment> sets the device's clock to that moment, ticking on from there */
const CLOCK = () => {
  const m = location.search.match(/clk=([^&]+)/); if (!m) return;
  const off = new Date(decodeURIComponent(m[1])).getTime() - Date.now(), R = Date;
  class F extends R { constructor(...a) { if (a.length) super(...a); else super(R.now() + off); } static now() { return R.now() + off; } }
  window.Date = F;
};
const ZONES = [['Asia/Tokyo', '+09:00'], ['Pacific/Kiritimati', '+14:00'], ['America/Los_Angeles', '-08:00'], ['UTC', 'Z']];
const TIMES = (process.env.RELOAD_TIMES || '04:40,10:00,23:30').split(',');
const yen = s => (s == null ? null : Number(String(s).replace(/[^\d-]/g, '')));

/* every figure on Home, Plan and Receipts: its name, its amount and its words */
async function allFigs(p) {
  const out = [];
  for (const [tab, panel] of [['home', '#a3Home'], ['plan', '#a3Plan'], ['receipts', '#a3Rc']]) {
    await p.click(`[data-tab=${tab}]`); await w(150);
    out.push(...await p.$$eval(panel + ' [data-fig]', (es, t) => es.map(e => {
      const a = e.dataset.amt !== undefined ? e : e.querySelector('[data-amt]');
      return t + ':' + e.dataset.fig + '=' + (a ? a.dataset.amt : '') + ' ' + e.textContent.replace(/\s+/g, ' ').trim();
    }), tab));
  }
  await p.click('[data-tab=home]'); await w(100);
  return out;
}
const homeCard = p => p.$eval('#a3Home [data-card=cards]', e => { const o = e.querySelector('[data-fig=owed]'); return o ? o.textContent : null; }).catch(() => null);
const homeBank = p => p.$eval('#a3Home [data-card=bank] [data-fig=bank]', e => e.textContent).catch(() => null);

async function one(browser, tz, off, hhmm) {
  const tag = `${tz} ${hhmm}`;
  const c = await browser.newContext({ timezoneId: tz, viewport: { width: 390, height: 844 } });
  await c.addInitScript(CLOCK);
  const p = await c.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  const go = async day => { await p.goto(PAGE + '?clk=' + encodeURIComponent(`${day}T${hhmm}:00${off}`)); await w(500); };
  const typeIn = async (sel, v) => { await p.fill(sel, String(v)); await p.$eval(sel, e => e.dispatchEvent(new Event('blur'))); };
  await go('2026-11-24');
  await p.click('#a3SetupGo'); await w(200);
  await typeIn('#s3Bank', 150000); await typeIn('#s3PayAmt', 240000); await p.selectOption('#s3PayDay', '10');
  await p.click('#s3AddCard'); await typeIn('[data-row=card1] [data-f=name]', 'Card A'); await typeIn('[data-row=card1] [data-f=owed]', 35000);
  await p.selectOption('[data-row=card1] [data-f=payDay]', '10');
  await p.click('#a3SetupSave'); await w(700);
  await p.click('[data-tab=receipts]'); await w(150); await p.click('[data-mode=spend]'); await w(100);
  await p.fill('#rcAmt', '5000');
  const v = await p.$eval('#rcAcct', s => [...s.options].find(o => o.textContent.trim() === 'Card A').value); await p.selectOption('#rcAcct', v);
  await p.click('#rcSave'); await w(400); await p.click('[data-tab=home]'); await w(150);
  ck(`${tag}: 24 Nov, Card A owes 40,000 after the spend`, yen(await homeCard(p)) === 40000, await homeCard(p));
  for (const [day, bank, card] of [['2026-11-28', 150000, 43000], ['2026-12-11', 352000, 8000], ['2027-01-09', 592000, 8000]]) {
    await go(day);
    await p.click('#a3CheckGo'); await w(250);
    for (const id of await p.$$eval('#a3Check [data-bankfig]', es => es.map(e => e.id))) await p.fill('#' + id, String(bank));
    for (const id of await p.$$eval('#a3Check [data-cardfig]', es => es.map(e => e.id))) await p.fill('#' + id, String(card));
    await p.click('#a3CheckSave'); await w(700);
    const got = { bank: yen(await homeBank(p)), card: yen(await homeCard(p)) };
    ck(`${tag}: ${day}, Home shows what was typed (bank ${bank}, Card A ${card})`, got.bank === bank && got.card === card, JSON.stringify(got));
    const before = await allFigs(p);
    await p.reload(); await w(600);
    const after = await allFigs(p);
    const diff = before.map((x, i) => (x === after[i] ? null : `${x}  ->  ${after[i]}`)).filter(Boolean);
    ck(`${tag}: ${day}, every figure the same after a reload (${before.length})`, before.length > 5 && before.length === after.length && !diff.length, diff.join(' | ') || `${before.length} vs ${after.length}`);
  }
  ck(`${tag}: no page errors`, !errs.length, errs.join(' | '));
  await c.close();
}

(async () => {
  const t0 = Date.now();
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
  const runs = [];
  for (const [tz, off] of ZONES) for (const hhmm of TIMES) runs.push([tz, off, hhmm]);
  const POOL = 4;
  for (let i = 0; i < runs.length; i += POOL) await Promise.all(runs.slice(i, i + POOL).map(r => one(browser, ...r).catch(e => ck(`${r[0]} ${r[2]}: ran`, false, e.stack))));
  await browser.close();
  console.log(`(${Math.round((Date.now() - t0) / 1000)} s)`);
  console.log(bad ? `e3_reload: ${bad} FAIL of ${n}` : `e3_reload: ALL PASS (${n})`);
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
