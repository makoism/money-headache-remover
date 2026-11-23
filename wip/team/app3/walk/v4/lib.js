const { chromium } = require('/opt/node-tools/node_modules/playwright');
const PAGE = 'file:///home/user/money-headache-remover/wip/team/app3/index.html';
const w = ms => new Promise(r => setTimeout(r, ms));
async function ctx(dir) {
  const c = await chromium.launchPersistentContext(dir, { executablePath: '/usr/bin/google-chrome', headless: true, viewport: { width: 390, height: 844 }, acceptDownloads: true, args: ['--no-sandbox'] });
  await c.addInitScript(() => {
    window.__asked = [];
    const fn = async () => ({ text: '' });
    fn.form = async (prompt) => { window.__asked.push(prompt); const q = prompt.split('THE QUESTION\n')[1]; return JSON.parse(JSON.stringify((window.__replies || {})[q] || { answer: 'I don\'t know', actions: [] })); };
    window.claude = { use: async () => fn };
  });
  return c;
}
async function go(p, day) { await p.goto(PAGE + '?today=' + day); await w(600); }
const txt = (p, sel) => p.$eval(sel, e => e.innerText.replace(/\n+/g, ' | ')).catch(() => '(none)');
async function home(p) { await tab(p, 'home'); return txt(p, '#a3Home'); }
async function tab(p, name) { await p.click(`[data-tab=${name}]`); await w(350); }
async function plan(p) { await tab(p, 'plan'); return txt(p, '#a3Plan'); }
async function rc(p) { await tab(p, 'receipts'); return txt(p, '#a3Rc'); }
async function figs(p) { return p.evaluate(() => [...document.querySelectorAll('[data-fig]')].filter(e => e.offsetParent !== null).map(e => e.dataset.fig + '=' + e.textContent.trim().replace(/\s+/g, ' ').slice(0, 80))); }
async function typeIn(p, sel, v) { await p.fill(sel, String(v)); await p.$eval(sel, e => e.dispatchEvent(new Event('blur'))); }
async function selByText(p, sel, text) { const v = await p.$eval(sel, (s, t) => { const o = [...s.options].find(o => o.textContent.trim() === t); return o ? o.value : null; }, text); if (v == null) throw new Error('no option ' + text + ' in ' + sel); await p.selectOption(sel, v); }
async function spend(p, a, acct, o = {}) {
  await tab(p, 'receipts');
  await p.click(`[data-mode=${o.mode || 'spend'}]`); await w(150);
  await p.fill('#rcAmt', String(a));
  if ((o.mode || 'spend') === 'moved') { await selByText(p, '#rcFrom', acct); await w(150); await p.fill('#rcAmt', String(a)); await selByText(p, '#rcTo', o.to); }
  else await selByText(p, '#rcAcct', acct);
  if (o.date) await p.fill('#rcDate', o.date);
  if (o.note) await p.fill('#rcNote', o.note);
  await w(150);
  const after = await txt(p, '#rcAfter');
  await p.click('#rcSave'); await w(500);
  const err = await txt(p, '#rcErr');
  return `${o.mode || 'spend'} ${a} ${acct}${o.to ? '->' + o.to : ''} ${o.note || ''}: preview[${after}] err[${err}]`;
}
/* figures: {accountName: amount}; amts: {itemText: amount}; untick: [itemText] */
async function checkin(p, figures, amts = {}, untick = [], landed = {}) {
  await tab(p, 'home');
  await p.click('#a3CheckGo'); await w(300);
  const list = await p.$$eval('#a3Check .a3-tick', rs => rs.map(r => ({ item: r.dataset.item, text: r.querySelector('label span').textContent, when: r.querySelector('.when').textContent, amt: r.querySelector('[data-amt]').value })));
  for (const r of list) {
    const key = Object.keys(amts).find(k => (r.text + ' ' + r.when).includes(k));
    const sel = `#a3Check .a3-tick[data-item="${r.item}"]`;
    if (key) { await p.fill(sel + ' [data-amt]', String(amts[key])); }
    if (untick.some(k => (r.text + ' ' + r.when).includes(k))) await p.uncheck(sel + ' input[type=checkbox]');
    const lk = Object.keys(landed).find(k => (r.text + ' ' + r.when).includes(k));
    r.landed = await p.$eval(sel + ' [data-landed]', e => e.value + ' min ' + e.min + ' max ' + e.max).catch(() => '');
    if (lk) await p.fill(sel + ' [data-landed]', landed[lk]);
  }
  const labels = await p.$$eval('#a3Check [data-bankfig]', es => es.map(e => ({ id: e.id, label: document.querySelector(`label[for="${e.id}"]`).textContent })));
  for (const l of labels) { const k = Object.keys(figures).find(n => l.label.includes(n)); if (k == null) throw new Error('no figure for ' + l.label); await p.fill('#' + l.id, String(figures[k])); }
  const head = await txt(p, '#a3Check');
  await p.click('#a3CheckSave'); await w(700);
  const err = await txt(p, '#a3CheckErr');
  return { list: list.map(x => `${x.text} ${x.when} ${x.amt}${x.landed ? ' LANDED[' + x.landed + ']' : ''}`), err, head: head.slice(0, 300) };
}
module.exports = { ctx, go, home, plan, rc, tab, figs, typeIn, selByText, spend, checkin, w, txt, PAGE };
