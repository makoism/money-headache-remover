#!/usr/bin/env node
/* The real-page walk as a permanent gate: walk 4's run A (walk/v4, s1 to s8), Mako's made-up shape from setup on 24 Nov
   2026 to a check-in on 15 Feb 2027, through the page as a person uses it: setup, spends, a refund, a goal in its own
   account, check-ins with items left unticked and ticked late, a bank statement pasted from any AI, Ask with a recorded
   made-up reply, plan changes, a backup restored on a fresh device, two tabs, Free to spend. After each step Home's
   safe to spend and the main bank's figure must be the hand-worked ones of the walk 4 report. Made-up yen only; no real
   AI (a stand-in for the viewer's Claude answers with recorded made-up replies). */
'use strict';
const fs = require('fs'), os = require('os'), path = require('path');
const { chromium } = require(process.env.TOOLS_PLAYWRIGHT || '/opt/node-tools/node_modules/playwright');
const PAGE = 'file://' + path.join(__dirname, '../index.html');
const w = ms => new Promise(r => setTimeout(r, ms));
let bad = 0, n = 0;
const ck = (name, ok, extra) => { n++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : ' ' + String(extra === undefined ? '' : extra).slice(0, 400))); if (!ok) bad++; };
const errs = [];
async function ctx(dir) {
  const c = await chromium.launchPersistentContext(dir, { executablePath: '/usr/bin/google-chrome', headless: true, viewport: { width: 390, height: 844 }, acceptDownloads: true, args: ['--no-sandbox'] });
  await c.addInitScript(() => {
    window.__asked = [];
    const fn = async () => ({ text: '' });
    fn.form = async prompt => { window.__asked.push(prompt); const q = prompt.split('THE QUESTION\n')[1]; return JSON.parse(JSON.stringify((window.__replies || {})[q] || { answer: 'I don\'t know', actions: [] })); };
    window.claude = { use: async () => fn };
  });
  c.on('page', p => watch(p));
  for (const p of c.pages()) watch(p);
  return c;
}
function watch(p) { p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); }
const go = async (p, day) => { await p.goto(PAGE + '?today=' + day); await w(500); };
const txt = (p, sel) => p.$eval(sel, e => e.innerText.replace(/\n+/g, ' | ')).catch(() => '(none)');
const tab = async (p, name) => { await p.click(`[data-tab=${name}]`); await w(250); };
const typeIn = async (p, sel, v) => { await p.fill(sel, String(v)); await p.$eval(sel, e => e.dispatchEvent(new Event('blur'))); };
async function selByText(p, sel, text) { const v = await p.$eval(sel, (s, t) => { const o = [...s.options].find(o => o.textContent.trim() === t); return o ? o.value : null; }, text); if (v == null) throw new Error('no option ' + text + ' in ' + sel); await p.selectOption(sel, v); }
async function spend(p, a, acct, o = {}) {
  await tab(p, 'receipts');
  await p.click(`[data-mode=${o.mode || 'spend'}]`); await w(120);
  await p.fill('#rcAmt', String(a));
  if ((o.mode || 'spend') === 'moved') { await selByText(p, '#rcFrom', acct); await w(120); await p.fill('#rcAmt', String(a)); await selByText(p, '#rcTo', o.to); }
  else await selByText(p, '#rcAcct', acct);
  if (o.note) await p.fill('#rcNote', o.note);
  await w(120); await p.click('#rcSave'); await w(400);
  const err = await txt(p, '#rcErr');
  ck(`logged ${o.mode || 'spend'} ${a} ${o.note || ''}`, !err || err === '(none)', err);
}
async function checkin(p, figures, amts = {}, untick = [], landed = {}) {
  await tab(p, 'home');
  await p.click('#a3CheckGo'); await w(250);
  const list = await p.$$eval('#a3Check .a3-tick', rs => rs.map(r => ({ item: r.dataset.item, text: r.querySelector('label span').textContent + ' ' + r.querySelector('.when').textContent })));
  for (const r of list) {
    const sel = `#a3Check .a3-tick[data-item="${r.item}"]`;
    const key = Object.keys(amts).find(k => r.text.includes(k)); if (key) await p.fill(sel + ' [data-amt]', String(amts[key]));
    if (untick.some(k => r.text.includes(k))) await p.uncheck(sel + ' input[type=checkbox]');
    const lk = Object.keys(landed).find(k => r.text.includes(k)); if (lk) await p.fill(sel + ' [data-landed]', landed[lk]);
  }
  const labels = await p.$$eval('#a3Check [data-bankfig]', es => es.map(e => ({ id: e.id, label: document.querySelector(`label[for="${e.id}"]`).textContent })));
  for (const l of labels) { const k = Object.keys(figures).find(x => l.label.includes(x)); if (k == null) throw new Error('no figure for ' + l.label); await p.fill('#' + l.id, String(figures[k])); }
  await p.click('#a3CheckSave'); await w(600);
  const err = await txt(p, '#a3CheckErr');
  ck('check-in saved', !err || err === '(none)', err);
}
/* Home's safe to spend (data-fig=safe) and the main bank's figure, against the walk 4 report's hand-worked ones */
async function home(p, label, safe, bank) {
  await tab(p, 'home');
  const got = await p.evaluate(() => {
    const s = document.querySelector('#a3Home [data-fig="safe"]');
    const amt = s ? Number((s.dataset.amt !== undefined ? s : s.querySelector('[data-amt]')).dataset.amt) : null;
    const m = /Main bank\s*\n+\s*¥([\d,]+)/.exec(document.querySelector('#a3Home').innerText);
    return { safe: amt, bank: m ? Number(m[1].replace(/,/g, '')) : null };
  });
  ck(`${label}: safe to spend ${safe.toLocaleString('en')}, Main bank ${bank.toLocaleString('en')}`, got.safe === safe && got.bank === bank, JSON.stringify(got));
}
(async () => {
  const t0 = Date.now();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'a3walk-')), dir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'a3walk2-'));
  let c = await ctx(dir); let p = c.pages()[0] || await c.newPage();
  /* s1: setup on 24 Nov */
  await go(p, '2026-11-24');
  await p.click('#a3SetupGo'); await w(200);
  await typeIn(p, '#s3Bank', '286000');
  await p.selectOption('#s3PayDay', '10'); await p.selectOption('#s3PayShift', 'before');
  await typeIn(p, '#s3PayName', 'Main job'); await typeIn(p, '#s3PayAmt', '180000');
  await p.click('#s3AddPay'); await typeIn(p, '[data-row=pay2] [data-f=name]', 'Side job'); await typeIn(p, '[data-row=pay2] [data-f=amount]', '60000');
  for (const [k, name, owed, day, shift] of [[1, 'Card A', 54000, '10', 'after'], [2, 'Card B', 23000, '11', 'before']]) {
    await p.click('#s3AddCard'); const r = `[data-row=card${k}] `;
    await typeIn(p, r + '[data-f=name]', name); await typeIn(p, r + '[data-f=owed]', owed);
    await p.selectOption(r + '[data-f=payDay]', day); await p.selectOption(r + '[data-f=shift]', shift);
  }
  let k = 0;
  for (const [name, amt, day] of [['Rent', 72000, '27'], ['Power', 7400, '26'], ['Phone', 4800, '20'], ['Internet', 5200, '27']]) {
    k++; await p.click('#s3AddBill'); const r = `[data-row=bill${k}] `;
    await typeIn(p, r + '[data-f=name]', name); await typeIn(p, r + '[data-f=amount]', amt); await p.selectOption(r + '[data-f=day]', day);
  }
  await p.click('#a3SetupSave'); await w(700);
  await home(p, '24 Nov after setup', 201400, 286000);
  /* s2: November */
  await spend(p, 3000, 'Main bank', { note: 'groceries' });
  await spend(p, 8000, 'Card A', { note: 'shoes' });
  await home(p, '24 Nov after 2 spends', 198400, 283000);
  await go(p, '2026-11-25'); await spend(p, 5000, 'Card B', { note: 'dinner' }); await home(p, '25 Nov', 198400, 283000);
  await go(p, '2026-11-28'); await spend(p, 2000, 'Card A', { mode: 'refund', note: 'shoes partly back' }); await home(p, '28 Nov after refund', 198400, 283000);
  await go(p, '2026-12-01');
  await tab(p, 'plan'); await p.click('#plAddGoal'); await w(200);
  await p.fill('#pl-name', 'Trip'); await p.fill('#pl-target', '100000'); await p.fill('#pl-due', '2027-06-30'); await p.selectOption('#pl-mode', 'ownAccount');
  await p.click('[data-plbtn="0"]'); await w(400);
  await p.click('[data-goal]'); await w(200); await p.fill('#pl-amount', '20000'); await p.click('[data-plbtn="0"]'); await w(400);
  await home(p, '1 Dec after the goal and 20,000 set aside', 178400, 263000);
  await go(p, '2026-12-05'); await spend(p, 5000, 'Main bank', { mode: 'moved', to: 'Trip account', note: 'extra for trip' });
  await go(p, '2026-12-06'); await spend(p, 4000, 'Main bank', { note: 'food' });
  await go(p, '2026-12-09'); await home(p, '9 Dec', 169400, 254000);
  /* s3: pay day check-ins */
  await go(p, '2026-12-10'); await home(p, '10 Dec before the check', 232000, 254000);
  await checkin(p, { 'Main bank': 295400, 'Trip account': 25000 }, { 'Card A': 54000 }, ['Side job']);
  await home(p, '10 Dec after the check (side job unticked)', 178000, 295400);
  await p.reload(); await w(400); await home(p, '10 Dec after a reload', 178000, 295400);
  await go(p, '2026-12-11'); await home(p, '11 Dec before the check', 178000, 295400);
  await checkin(p, { 'Main bank': 332400, 'Trip account': 25000 }, { 'Card B': 23000 }, [], { 'Side job': '2026-12-11' });
  await home(p, '11 Dec after the check', 243000, 332400);
  /* s4a: a gift, the bank statement from any AI, a check */
  await go(p, '2026-12-12'); await spend(p, 12000, 'Card A', { note: 'gift' });
  await go(p, '2026-12-15'); await home(p, '15 Dec before the statement', 243000, 332400);
  await tab(p, 'home'); await p.$eval('#a3StmtGo', e => e.click()); await w(250);
  await p.click('#a3StmtAny summary'); await w(100);
  const rows = [
    ['2026-11-24', 'SUPER', 3000, 'out', 'food'], ['2026-11-26', 'DENKI POWER', 7400, 'out', 'util'], ['2026-11-27', 'RENT', 72000, 'out', 'rent'],
    ['2026-11-27', 'NET', 5200, 'out', 'net'], ['2026-12-01', 'TO TRIP ACCT', 20000, 'out', 'transfer_out'], ['2026-12-05', 'TO TRIP ACCT', 5000, 'out', 'transfer_out'],
    ['2026-12-06', 'FOOD MART', 4000, 'out', 'food'], ['2026-12-10', 'SALARY MAIN', 180000, 'in', 'pay'], ['2026-12-10', 'CARD A PAYMENT', 54000, 'out', 'card_payment'],
    ['2026-12-11', 'SIDE JOB', 60000, 'in', 'pay'], ['2026-12-11', 'CARD B PAYMENT', 23000, 'out', 'card_payment'], ['2026-12-14', 'SUPER', 2500, 'out', 'food']]
    .map(([date, text, amount, dir, cat]) => ({ date, text, amount, dir, cat }));
  await p.$eval('#a3StmtPaste', (e, v) => { e.value = v; }, JSON.stringify({ statements: [{ account: 'Main bank', kind: 'bank', currency: 'JPY', period: { from: '2026-11-24', to: '2026-12-14' }, rows }] }));
  await p.click('#a3StmtCheck'); await w(500);
  ck('the statement can be added', !(await p.$eval('#a3StmtAdd', e => e.disabled)));
  await p.click('#a3StmtAdd'); await w(700);
  await home(p, '15 Dec after the statement', 240500, 329900);
  await p.reload(); await w(400); await home(p, '15 Dec after a reload', 240500, 329900);
  await go(p, '2026-12-16'); await checkin(p, { 'Main bank': 329900, 'Trip account': 25000 }); await home(p, '16 Dec after the check', 240500, 329900);
  /* s4b: Ask with a recorded made-up reply, plan changes */
  await go(p, '2026-12-18');
  await p.evaluate(() => { window.__replies = { 'I spent 1,500 on lunch today': { answer: 'Logged 1,500 lunch from your main bank, if you apply it.', actions: [{ do: 'log_spend', amount: 1500, note: 'lunch' }] } }; });
  await p.click('#a3AskGo'); await w(250);
  await p.fill('#a3AskIn', 'I spent 1,500 on lunch today'); await p.click('#a3AskSend'); await w(600);
  await p.click('[data-ask=apply]'); await w(500);
  await p.click('#a3AskClose'); await w(200);
  await home(p, '18 Dec after a spend through Ask', 239000, 328400);
  await go(p, '2026-12-20');
  await tab(p, 'plan'); await p.click('[data-goal]'); await w(200); await p.fill('#pl-amount', '3000'); await p.click('[data-plbtn="2"]'); await w(400);
  const billBtn = async name => (await p.$$eval('[data-bill],[data-pay]', (bs, nm) => bs.filter(b => b.innerText.startsWith(nm)).map(b => b.dataset.bill || b.dataset.pay), name))[0];
  await tab(p, 'plan'); let id = await billBtn('Rent'); await p.click(`[data-bill="${id}"]`); await w(200);
  await p.fill('#pl-amount', '75000'); await p.fill('#pl-from', '2027-01-01'); await p.click('[data-plbtn="0"]'); await w(400);
  await tab(p, 'plan'); id = await billBtn('Main job'); await p.click(`[data-pay="${id}"]`); await w(200);
  await p.fill('#pl-amount', '185000'); await p.fill('#pl-from', '2027-02-01'); await p.click('[data-plbtn="0"]'); await w(400);
  await home(p, '20 Dec after the plan changes', 242000, 331400);
  await go(p, '2026-12-21'); await home(p, '21 Dec', 242000, 331400);
  await go(p, '2026-12-24'); await spend(p, 9000, 'Card B', { note: 'xmas' });
  await go(p, '2026-12-29'); await home(p, '29 Dec', 242000, 331400);
  /* s4c: rent left unticked, then ticked late */
  await go(p, '2026-12-28'); await home(p, '28 Dec before the check', 242000, 331400);
  await checkin(p, { 'Main bank': 314000, 'Trip account': 22000 }, {}, ['Rent']);
  await home(p, '28 Dec after the check, rent unticked', 242000, 314000);
  await go(p, '2026-12-30'); await home(p, '30 Dec', 242000, 314000);
  await go(p, '2027-01-03'); await spend(p, 6000, 'Main bank', { note: 'new year' }); await home(p, '3 Jan', 236000, 308000);
  await go(p, '2027-01-07'); await checkin(p, { 'Main bank': 236000, 'Trip account': 22000 }, {}, [], { 'Rent': '2026-12-30' });
  await home(p, '7 Jan after the check', 236000, 236000);
  /* s5: the January pay late, then in */
  await go(p, '2027-01-08'); await home(p, '8 Jan', 236000, 236000);
  await go(p, '2027-01-11'); await home(p, '11 Jan before the check', 111600, 236000);
  await checkin(p, { 'Main bank': 282000, 'Trip account': 22000 }, { 'Card B': 14000 }, ['Main job']);
  await home(p, '11 Jan after the check, main pay late', 171600, 282000);
  await p.reload(); await w(400); await home(p, '11 Jan after a reload', 171600, 282000);
  await go(p, '2027-01-12'); await home(p, '12 Jan', 171600, 282000);
  await go(p, '2027-01-13'); await spend(p, 2000, 'Main bank', { note: 'pay landed, lunch' }); await home(p, '13 Jan', 169600, 280000);
  await go(p, '2027-01-15'); await checkin(p, { 'Main bank': 442000, 'Trip account': 22000 }, { 'Card A': 18000 }, [], { 'Main job': '2027-01-13' });
  await home(p, '15 Jan after the check', 349600, 442000);
  /* s6: Free to spend */
  await tab(p, 'plan'); await p.click('#plSetFree'); await w(200); await p.fill('#pl-amount', '50000'); await p.click('[data-plbtn="0"]'); await w(400);
  await home(p, '15 Jan with Free to spend 50,000', 48000, 442000);
  /* s7: a locked backup, two tabs, the backup restored on a fresh device */
  const before = await txt(p, '#a3Home');
  await p.click('#a3SetGo'); await w(250);
  await p.check('#a3BkLock'); await p.fill('#a3BkCode', 'abc12345');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#a3BkSave')]);
  const bkFile = path.join(dir2, 'backup.json'); await dl.saveAs(bkFile);
  await p.click('#a3SetClose'); await w(200);
  const p2 = await c.newPage(); await go(p2, '2027-01-15');
  ck('a second tab shows the same Home', (await txt(p2, '#a3Home')) === before);
  await spend(p, 1000, 'Main bank', { note: 'tab1 coffee' });
  await spend(p2, 2000, 'Card A', { note: 'tab2 book' });
  await spend(p2, 500, 'Main bank', { note: 'tab2 snack' });
  await p2.reload(); await w(500); await tab(p, 'home'); await p.reload(); await w(500);
  await home(p2, '15 Jan, the second tab sees all three spends from both tabs', 44500, 440500);
  await p2.close();
  await c.close();
  const c2 = await ctx(fs.mkdtempSync(path.join(os.tmpdir(), 'a3walk3-'))); const q = c2.pages()[0] || await c2.newPage();
  await go(q, '2027-01-15'); await q.click('#a3SetGo'); await w(250);
  await q.setInputFiles('#a3BkFile', bkFile); await w(600);
  await q.fill('#a3BkOpen', 'abc12345'); await q.click('#a3BkOpenGo'); await w(1500);
  await q.click('#a3BkGo'); await w(600); await q.click('#a3SetClose'); await w(200);
  ck('the backup restored on a fresh device shows the same Home', (await txt(q, '#a3Home')) === before);
  await c2.close();
  c = await ctx(dir); p = c.pages()[0] || await c.newPage();
  /* s7b: a move to the Trip account, money taken out of the goal, a refund */
  await go(p, '2027-01-16'); await spend(p, 10000, 'Main bank', { mode: 'moved', to: 'Trip account', note: 'trip top up' });
  await home(p, '16 Jan after a move to the Trip account', 44500, 430500);
  await go(p, '2027-01-17'); await tab(p, 'plan'); await p.click('[data-goal]'); await w(200); await p.fill('#pl-amount', '2000'); await p.click('[data-plbtn="2"]'); await w(400);
  await home(p, '17 Jan after taking 2,000 out of the goal', 44500, 432500);
  await go(p, '2027-01-18'); await spend(p, 1000, 'Card A', { mode: 'refund', note: 'book back' }); await home(p, '18 Jan after a refund', 44500, 432500);
  /* s8: February, no check for a month */
  await go(p, '2027-01-20'); await spend(p, 7000, 'Card A', { note: 'jacket' });
  await go(p, '2027-02-01'); await spend(p, 3000, 'Card B', { note: 'taxi' });
  await go(p, '2027-02-09'); await home(p, '9 Feb', 34500, 432500);
  await go(p, '2027-02-10'); await home(p, '10 Feb', 34500, 432500);
  await go(p, '2027-02-15'); await home(p, '15 Feb, no check since 15 Jan', 34500, 432500);
  await checkin(p, { 'Main bank': 574100, 'Trip account': 30000 });
  await home(p, '15 Feb after the check', 50000, 574100);
  await p.reload(); await w(400); await home(p, '15 Feb after a reload', 50000, 574100);
  await c.close();
  ck('no page errors', errs.length === 0, errs.join(' | '));
  const secs = Math.round((Date.now() - t0) / 1000);
  ck(`the walk took ${secs} s (limit 300)`, secs < 300);
  for (const d of [dir, dir2]) fs.rmSync(d, { recursive: true, force: true });
  console.log(bad ? `e3_walk: ${bad} FAIL of ${n}` : `e3_walk: ALL PASS (${n})`);
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
