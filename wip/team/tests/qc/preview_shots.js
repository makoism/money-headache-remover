/* Preview screenshots for Mako: a phone 412 by 915 at 2x, every state reached by taps and typing on the built page. Made-up numbers.
   Run: node tests/qc/preview_shots.js [out folder, default preview/]
   Each shot is the phone's screen (not the whole page), scrolled so the named thing is in view. A state that cannot be reached is
   skipped and said so; the last line lists what was made. */
const fs = require('fs'), path = require('path');
const { phone, w } = require('/tmp/v39/real.js');
const PAGE = process.env.PAGE || path.resolve(__dirname, '../../../money-map-team.html');
const OUT = path.resolve(process.argv[2] || path.join(__dirname, '../../preview'));
fs.mkdirSync(OUT, { recursive: true });
const made = [], skipped = [];
const vis = `(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; })`;
const open = async () => { const o = await phone({ w: 412, h: 915, dpr: 2, mobile: true, keep: true }); await o.p.goto('file://' + PAGE); await w(2200); return o; };
/* a real tap on the middle of a thing, scrolled into view first */
const tapEl = async (p, h) => { await h.evaluate(e => e.scrollIntoView({ block: 'center' })); await w(250); await h.tap(); await w(600); };
const tap = async (p, sel) => { const h = await p.$(sel); if (!h) throw new Error('nothing to tap: ' + sel); await tapEl(p, h); };
const byText = (p, re, sel = 'button, a, summary, label') => p.evaluateHandle((src, sel, vis) => { const re = new RegExp(src, 'i'), ok = eval(vis);
  return [...document.querySelectorAll(sel)].find(e => ok(e) && re.test((e.innerText || '').replace(/\s+/g, ' ').trim())) || null; }, re.source, sel, vis).then(h => h.asElement());
const tapText = async (p, re, sel) => { const h = await byText(p, re, sel); if (!h) throw new Error('no button reads ' + re); await tapEl(p, h); };
const type = async (p, sel, text) => { await tap(p, sel); await p.keyboard.type(String(text), { delay: 35 }); await w(250); };
const shot = async (p, name) => { await w(500); await p.screenshot({ path: path.join(OUT, name), type: 'png' }); made.push(name); };
/* scroll so the first line matching re sits about a third of the way down the screen; returns the line's words */
const toLine = (p, re, frac = 0.35) => p.evaluate((src, frac, vis) => { const re = new RegExp(src, 'i'), ok = eval(vis);
  const all = [...document.querySelectorAll('main *, #view *, body *')].filter(e => ok(e) && !e.closest('#tour') && re.test((e.innerText || '').replace(/\s+/g, ' ')));
  const e = all.filter(x => !all.some(y => y !== x && x.contains(y))).pop() && all.filter(x => !all.some(y => y !== x && x.contains(y)))[0]; if (!e) return null;
  const y = e.getBoundingClientRect().top + window.scrollY - innerHeight * frac; window.scrollTo(0, Math.max(0, y)); return e.innerText.replace(/\s+/g, ' ').trim().slice(0, 400); }, re.source, frac, vis);
const top = async p => { await p.evaluate(() => window.scrollTo(0, 0)); await w(400); };
const seen = (p, re) => p.evaluate(src => { const m = document.body.innerText.replace(/[ \t]+/g, ' ').match(new RegExp(src, 'i')); return m ? m[0].replace(/\s+/g, ' ') : null; }, re.source);
const note = (name, s) => console.log(name + ': ' + s);
const tabTo = async (p, id) => { await tap(p, '#' + id); await w(500); await top(p); };
/* the short setup, by taps and typing: currency, pay, balance, rent, food, emergency fund */
const setup = async (p, o) => { try { await setup0(p, o); } catch (e) { if (process.env.DBG) { console.log(await p.evaluate(() => [...document.querySelectorAll('#tour button')].map(e => e.id + '|' + e.innerText + '|' + e.getClientRects().length + '|' + getComputedStyle(e).visibility + '|' + JSON.stringify(e.getBoundingClientRect())).join('\n'))); await p.screenshot({ path: process.env.DBG }); } throw e; } };
const setup0 = async (p, o) => {
  await tap(p, '#tourNext');
  const cur = await p.evaluateHandle(c => { const r = [...document.querySelectorAll('#tour input[type=radio]')].find(i => i.value === c); return r ? (r.closest('label') || r) : null; }, o.cur);
  await tapEl(p, cur.asElement()); await tap(p, '#tourNext');
  /* walk the steps: type into whichever boxes the step shows (rent and food are ticked already), then Next, until setup says it is done */
  const amts = [o.rent, o.food]; const here = sel => p.$(sel).then(h => h ? h.evaluate(e => e.getClientRects().length > 0) : false);
  for (let i = 0; i < 14; i++) {
    if (await p.$eval('#tourNext', e => /^Done$/.test(e.innerText.trim()))) break;        /* Setup done */
    if (await here('#tourPay')) { await type(p, '#tourPay', o.pay); await type(p, '#tourBank', o.bank); }
    else if (await here('#tourAmt')) { if (!amts.length) throw new Error('setup asked for a bill the script has no number for'); await type(p, '#tourAmt', amts.shift()); }
    else if (await here('#tourGCost')) { await type(p, '#tourGCost', o.hold); await type(p, '#tourGSaved', o.saved); }
    await tap(p, '#tourNext');
  }
  await tap(p, '#tourNext'); await w(1200);                   /* Done */
  for (let i = 0; i < 3; i++) { const h = await p.$('#coSkip'); if (h && await h.evaluate(e => e.getClientRects().length > 0)) { await h.tap(); await w(500); } }
};
const tryShot = async (name, fn) => { try { await fn(); } catch (e) { skipped.push(name + ' (' + e.message.slice(0, 120) + ')'); console.log('SKIPPED ' + name + ': ' + e.message); } };

(async () => {
  /* ---- first open ---- */
  let o = await open(), p = o.p;
  await tryShot('01-welcome.png', async () => { await shot(p, '01-welcome.png'); });
  await setup(p, { cur: '$', pay: 3200, bank: 1500, rent: 1100, food: 400, hold: 5000, saved: 900 });
  await tryShot('02-home-first-screen.png', async () => { await tabTo(p, 'tab-home'); await shot(p, '02-home-first-screen.png');
    note('02', (await p.evaluate(() => { const out = []; const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = tw.nextNode())) { const e = n.parentElement, r = e.getBoundingClientRect(); if (n.nodeValue.trim() && r.height > 0 && r.top >= 0 && r.bottom <= innerHeight && getComputedStyle(e).visibility !== 'hidden') out.push(n.nodeValue.trim()); } return out.join(' | '); })).slice(0, 900)); });
  await tryShot('03-home-adds-up.png', async () => { const t = await toLine(p, /Bank .{1,20} \+ burrows .{1,20} = .{1,20} at the end of/); if (!t) throw new Error('no "Bank X + burrows Y = Z" line on Home'); await shot(p, '03-home-adds-up.png'); note('03', t); });
  /* ---- check your bank (a figure different from the planned one) and one card ---- */
  await tryShot('04-home-bank-now-and-cards.png', async () => {
    await top(p); await tap(p, '#mpCheck'); await tap(p, '#mpBankIn'); await p.keyboard.type('1420', { delay: 35 }); await tap(p, '#mpBankSave'); await w(600);
    await tap(p, '#mpCardAdd'); await type(p, '#mpCardName', 'Visa'); await type(p, '#mpCardOwed', '260'); await type(p, '#mpCardDay', '27'); await tap(p, '#mpCardSave'); await w(2600);
    await top(p); const t = await toLine(p, /In your bank now/, 0.12); await shot(p, '04-home-bank-now-and-cards.png');
    note('04', (await p.evaluate(() => { const n = document.querySelector('#hMap .mp-now'); return n ? n.innerText.replace(/\s+/g, ' ') : ''; })).slice(0, 500)); });
  await tryShot('05-home-bank-at-month-end.png', async () => { const t = await toLine(p, /Bank at month end/); if (!t) throw new Error('no "Bank at month end" on Home'); await shot(p, '05-home-bank-at-month-end.png'); note('05', t + ' || ' + (await seen(p, /Bank at month end[^\n]*\n[^\n]*(\n[^\n]*)?/))); });
  await tryShot('06-plan-bank-stays.png', async () => { await tabTo(p, 'tab-month'); await tapText(p, /^Month$/); const t = await toLine(p, /Bank (stays|ends) at|Bank at month end: /); if (!t) throw new Error('no "Bank at month end:" sentence on Plan, Month (before Q2: "Bank stays at")'); await shot(p, '06-plan-bank-stays.png'); note('06', t); });
  await tryShot('10-plan-month.png', async () => { await tabTo(p, 'tab-month'); await tapText(p, /^Month$/); await top(p); await shot(p, '10-plan-month.png'); });
  await tryShot('11-burrows.png', async () => { await tabTo(p, 'tab-month'); await tapText(p, /^Burrows$/); await top(p); await shot(p, '11-burrows.png'); });
  await tryShot('09-receipts.png', async () => { await tabTo(p, 'tab-receipts'); await shot(p, '09-receipts.png'); });
  await tryShot('08-settings-backup.png', async () => { await tabTo(p, 'tab-home'); await tap(p, '#gearBtn'); await w(600);
    const ok = await p.evaluate(() => { const ol = document.getElementById('bkSteps'); if (!ol) return false; for (let d = ol.closest('details'); d; d = d.parentElement && d.parentElement.closest('details')) d.open = false; return true; });
    if (!ok) throw new Error('no backup steps in Settings');
    /* open the folds around the steps by tapping their headings, outermost first */
    for (let i = 0; i < 4; i++) { const h = await p.evaluateHandle(() => { const ol = document.getElementById('bkSteps'); const ds = []; for (let d = ol.closest('details'); d; d = d.parentElement && d.parentElement.closest('details')) ds.unshift(d); const c = ds.find(d => !d.open); return c ? c.querySelector('summary') : null; }); const el = h.asElement(); if (!el) break; await tapEl(p, el); }
    await p.evaluate(() => { const ol = document.getElementById('bkSteps'); const y = ol.getBoundingClientRect().top + window.scrollY - innerHeight * 0.3; const sc = [...document.querySelectorAll('*')].find(e => e.contains(ol) && e.scrollHeight > e.clientHeight + 40 && /auto|scroll/.test(getComputedStyle(e).overflowY)); if (sc) sc.scrollTop += ol.getBoundingClientRect().top - innerHeight * 0.3; else window.scrollTo(0, Math.max(0, y)); }); await w(500);
    const inView = await p.evaluate(() => { const r = document.getElementById('bkSteps').getBoundingClientRect(); return r.height > 0 && r.top >= 0 && r.top < innerHeight - 100; }); if (!inView) throw new Error('the backup steps would not scroll into view');
    await shot(p, '08-settings-backup.png'); });
  await o.b.close();

  /* ---- bills bigger than pay, then the offered borrow from the emergency fund ---- */
  await tryShot('07-plan-after-borrow.png', async () => {
    o = await open(); p = o.p;
    await setup(p, { cur: '$', pay: 1200, bank: 100, rent: 1000, food: 400, hold: 3000, saved: 800 });
    /* with bills over pay the short setup has no emergency fund step, so say what is already saved under Plan, Burrows, Edit goal */
    await tabTo(p, 'tab-month'); await tapText(p, /^Burrows$/); await tapText(p, /^Edit goal$/);
    await tap(p, '[data-g="start"]'); await p.keyboard.down('Control'); await p.keyboard.press('a'); await p.keyboard.up('Control'); await p.keyboard.type('800', { delay: 35 }); await tap(p, '[data-gdone]'); await w(700);
    let h = null; for (const t of ['tab-month', 'tab-home']) { await tabTo(p, t); if (t === 'tab-month') await tapText(p, /^Month$/).catch(() => {}); h = await byText(p, /^Borrow .* from (the |your )?emergency fund/); if (h) break; }
    if (!h && process.env.DBG) console.log(await p.evaluate(() => document.body.innerText.slice(0, 2500) + '\n##' + [...document.querySelectorAll('[data-fx]')].map(e => e.outerHTML).join('\n')));
    if (!h) throw new Error('no "Borrow ... from emergency fund" button offered');
    const label = await h.evaluate(e => e.innerText.trim()); await tapEl(p, h); await w(1500);
    await tabTo(p, 'tab-month'); await tapText(p, /^Month$/);
    /* the sentence under the places, in its words before (launch checklist Q3) and after; the state and the scroll are the same either way */
    const t = await toLine(p, /Your places add up to|Your pay is 100%/, 0.75); if (!t) throw new Error('no "Your pay is 100%" (or, before Q3, "Your places add up to") sentence after the borrow');
    await shot(p, '07-plan-after-borrow.png'); note('07', 'tapped "' + label + '" || ' + t + ' || ' + (await p.evaluate(() => [...document.querySelectorAll('body *')].filter(e => !e.children.length && !/SCRIPT|STYLE/.test(e.tagName) && e.getClientRects().length && /Borrowed/.test(e.innerText || '')).map(e => (e.closest('tr, li, .row, div') || e).innerText.replace(/\s+/g, ' ')).join(' ; ').slice(0, 400))));
    await o.b.close(); });
  console.log('made ' + made.length + ': ' + made.sort().join(', ')); console.log(skipped.length ? 'skipped: ' + skipped.join('; ') : 'skipped: none');
  process.exit(0);
})().catch(e => { console.log('crashed: ' + e.stack); process.exit(1); });
