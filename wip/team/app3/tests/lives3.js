/* Shared pieces for the other lives' real-page walks (slice 6: tests/e3_life_a.js, _b, _c), built like tests/e3_walk.js
   (which stays as it is: Mako's shape). A walk drives the built page as a person does, from setup, and after each step
   checks Home's safe to spend and every account's bank figure against figures worked out by hand in the walk's own
   comments. Every check-in also reloads the page and checks that every figure on Home, Plan and Receipts is the same.
   Made-up amounts only; amounts given to the checks are whole minor units (cents for dollars, centavos for pesos). */
'use strict';
const fs = require('fs'), os = require('os'), path = require('path');
const { chromium } = require(process.env.TOOLS_PLAYWRIGHT || '/opt/node-tools/node_modules/playwright');
const PAGE = 'file://' + path.join(__dirname, '../index.html');
const w = ms => new Promise(r => setTimeout(r, ms));
function make(label) {
  let bad = 0, n = 0;
  const errs = [], dirs = [];
  const ck = (name, ok, extra) => { n++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : ' ' + String(extra === undefined ? '' : extra).slice(0, 500))); if (!ok) bad++; };
  const watch = p => { p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); };
  async function open() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'a3life-')); dirs.push(dir);
    const c = await chromium.launchPersistentContext(dir, Object.assign({ executablePath: '/usr/bin/google-chrome', headless: true, viewport: { width: 390, height: 844 }, args: ['--no-sandbox'] }, process.env.TZ ? { timezoneId: process.env.TZ } : {}));
    c.on('page', watch); for (const p of c.pages()) watch(p);
    const p = c.pages()[0] || await c.newPage();
    return { c, p };
  }
  const go = async (p, day) => { await p.goto(PAGE + '?today=' + day); await w(450); };
  const tab = async (p, name) => { await p.click(`[data-tab=${name}]`); await w(220); };
  const typeIn = async (p, sel, v) => { await p.fill(sel, String(v)); await p.$eval(sel, e => e.dispatchEvent(new Event('blur'))); };
  const txt = (p, sel) => p.$eval(sel, e => e.innerText.replace(/\n+/g, ' | ')).catch(() => '(none)');
  async function selByText(p, sel, text) { const v = await p.$eval(sel, (s, t) => { const o = [...s.options].find(o => o.textContent.trim() === t); return o ? o.value : null; }, text); if (v == null) throw new Error('no option ' + text + ' in ' + sel); await p.selectOption(sel, v); }
  /* log on Receipts: o.mode spend (default), refund, in (money in) or moved (o.to) */
  async function log(p, amount, acct, o = {}) {
    const mode = o.mode || 'spend';
    await tab(p, 'receipts');
    await p.click(`[data-mode=${mode}]`); await w(120);
    await p.fill('#rcAmt', String(amount));
    if (mode === 'moved') { await selByText(p, '#rcFrom', acct); await w(100); await p.fill('#rcAmt', String(amount)); await selByText(p, '#rcTo', o.to); }
    else await selByText(p, '#rcAcct', acct);
    if (o.for) await selByText(p, '#rcFor', o.for);
    if (o.note) await p.fill('#rcNote', o.note);
    await w(100); await p.click('#rcSave'); await w(400);
    const err = await txt(p, '#rcErr');
    ck(`logged ${mode} ${amount} ${o.note || ''}`, !err || err === '(none)', err);
  }
  async function allFigs(p) {
    const out = [];
    for (const [t, panel] of [['home', '#a3Home'], ['plan', '#a3Plan'], ['receipts', '#a3Rc']]) {
      await p.click(`[data-tab=${t}]`); await w(150);
      out.push(...await p.$$eval(panel + ' [data-fig]', (es, tb) => es.map(e => {
        const a = e.dataset.amt !== undefined ? e : e.querySelector('[data-amt]');
        return tb + ':' + e.dataset.fig + '=' + (a ? a.dataset.amt : '') + ' ' + e.textContent.replace(/\s+/g, ' ').trim();
      }), t));
    }
    await p.click('[data-tab=home]'); await w(100);
    return out;
  }
  async function sameAfterReload(p, what) {
    const before = await allFigs(p);
    await p.reload(); await w(500);
    const after = await allFigs(p);
    const diff = before.map((x, i) => (x === after[i] ? null : `${x}  ->  ${after[i]}`)).filter(Boolean);
    ck(`${what}: every figure the same after a reload (${before.length})`, before.length > 3 && before.length === after.length && !diff.length, diff.join(' | ') || `${before.length} vs ${after.length}`);
  }
  /* Check your bank: figures by account name; amts by item name; untick names; landed { name: day } */
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
    for (const l of labels) { const k = Object.keys(figures).find(x => l.label.includes(x)); if (k == null) continue; await p.fill('#' + l.id, String(figures[k])); }
    await p.click('#a3CheckSave'); await w(600);
    const err = await txt(p, '#a3CheckErr');
    ck('check-in saved', !err || err === '(none)', err);
    await sameAfterReload(p, 'check-in ' + (await p.evaluate(() => location.search)));
    return list.map(r => r.text);
  }
  /* Home: safe to spend (data-fig=safe) and each account's bank figure, by name, in minor units */
  async function home(p, what, safe, banks) {
    await tab(p, 'home');
    const got = await p.evaluate(() => {
      const amt = e => (e ? Number((e.dataset.amt !== undefined ? e : e.querySelector('[data-amt]')).dataset.amt) : null);
      const out = { safe: amt(document.querySelector('#a3Home [data-fig="safe"]')) };
      for (const c of document.querySelectorAll('#a3Home [data-card=bank]')) out[c.querySelector('h2').textContent.replace(/^[^:]*:\s*/, '').replace(/ today$/, '')] = amt(c.querySelector('[data-fig=bank]'));
      return out;
    });
    const want = Object.assign({ safe }, banks);
    const ok = Object.keys(want).every(k => got[k] === want[k]);
    ck(`${what}: safe to spend ${safe}, ${Object.keys(banks).map(k => k + ' ' + banks[k]).join(', ')}`, ok, JSON.stringify(got));
    return got;
  }
  /* the kept book, as the store holds it (as tests/e3_setup6.js reads it) */
  const readBook = p => p.evaluate(() => new Promise(res => {
    const rq = indexedDB.open('burrow3');
    rq.onsuccess = () => {
      const db = rq.result, tx = db.transaction(['book', 'events']), out = {};
      tx.objectStore('book').get('book').onsuccess = e => { out.book = e.target.result; };
      tx.objectStore('events').getAll().onsuccess = e => { out.events = e.target.result; };
      tx.oncomplete = () => { db.close(); res(Object.assign({}, out.book, { events: out.events })); };
    };
    rq.onerror = () => res(null);
  }));
  const finish = async () => {
    ck('no page errors', errs.length === 0, errs.join(' | '));
    for (const d of dirs) fs.rmSync(d, { recursive: true, force: true });
    console.log(bad ? `${label}: ${bad} FAIL of ${n}` : `${label}: ALL PASS (${n})`);
    process.exit(bad ? 1 : 0);
  };
  return { ck, open, go, tab, typeIn, txt, selByText, log, checkin, home, sameAfterReload, readBook, finish, w };
}
module.exports = { make };
