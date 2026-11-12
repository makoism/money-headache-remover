/* flows after setup: goal wizard, plan line editor, category lines, month-close and sweep cards, help menu items, narrow and short screens */
const L = require('/tmp/v22/lib.js'); const { w, P, runTour } = L;
const fs = require('fs'); const OUT = '/tmp/v36/q'; let n = 0;
(async () => {
  const { b, p, errs } = await L.launch(390, 844, 'dark');
  const shot = async (name) => { n++; await p.screenshot({ path: `${OUT}/${String(n).padStart(2, '0')}-${name}.png` }); };
  const go = async (t) => { await p.evaluate(t => { const b = document.querySelector(`[data-tab="${t}"]`) || document.querySelector(`[data-tab-go="${t}"]`); b && b.click(); }, t); await w(450); };
  const click = async (sel) => p.evaluate(s => { const e = document.querySelector(s); if (!e) return false; e.scrollIntoView({ block: 'center' }); e.click(); return true; }, sel);
  const clickText = async (sel, re) => p.evaluate((s, r) => { const e = [...document.querySelectorAll(s)].find(x => new RegExp(r).test(x.textContent)); if (!e) return false; e.scrollIntoView({ block: 'center' }); e.click(); return true; }, sel, re);
  await runTour(p, P.a); await w(1200);
  // 1. goal wizard from Home
  await go('home'); await p.evaluate(() => scrollTo(0, 0));
  await clickText('#hGoals button', '^Add goal$'); await w(500); await shot('gw-1');
  const gwSteps = [];
  for (let i = 0; i < 6; i++) {
    const info = await p.evaluate(() => { const g = document.querySelector('#gw, .gw, [data-gwstep]'); const all = [...document.querySelectorAll('button')].filter(b => b.offsetParent && b.closest('#hGoals, #gw, .gw, .wiz, #goalWiz')); return { html: document.body.innerText.slice(0, 0), btns: all.map(b => b.textContent.trim()) }; });
    gwSteps.push(info.btns.join(' | '));
    const nextBtn = await p.evaluate(() => { const bs = [...document.querySelectorAll('button')].filter(b => b.offsetParent); const nb = bs.find(b => /^(Next|Continue|Add this goal|Save goal|Done|Add goal)$/.test(b.textContent.trim()) && !b.closest('#hGoals > .head')); return nb ? nb.textContent.trim() : null; });
    if (!nextBtn) break;
    if (i === 0) { await p.evaluate(() => document.querySelector('[data-kind="buy"]').click()); await w(200); const inp = await p.$('#gwName'); if (inp) { await p.evaluate(() => { const n = document.querySelector('#gwName'); n.value = ''; }); await inp.type('Scooter'); } }
    if (i === 1) { const amt = await p.$('#gwCost'); if (amt) await amt.type('60000'); }
    await p.evaluate(t => { const bs = [...document.querySelectorAll('button')].filter(b => b.offsetParent); const nb = bs.find(b => b.textContent.trim() === t); nb && nb.click(); }, nextBtn); await w(450);
    await shot(`gw-${i + 2}`);
  }
  console.log('goal wizard buttons per step:', gwSteps);
  await p.keyboard.press('Escape'); await w(400);
  // 2. plan line editor: tap the rent amount
  await go('month');
  await click('#rb-nec [data-edit], #rowsOut [data-edit]'); await w(400);
  await p.evaluate(() => { const r = document.querySelector('#rowsOut .ed, #rowsOut .row.on, [data-key="bill:rent"]'); r && r.scrollIntoView({ block: 'center' }); }); await shot('plan-line-open');
  const amt = await p.$('#rowsOut input.amt-in, #rowsOut input[type=number], #rowsOut input[data-mny]');
  if (amt) { await p.evaluate(e => { e.focus(); e.select && e.select(); }, amt); await p.keyboard.press('Backspace'); await amt.type('90000'); await w(500); await shot('plan-line-edited'); }
  await p.evaluate(() => scrollTo(0, 0)); await shot('plan-top-after-edit');
  // 3. Rename, remove or add lines
  await clickText('#p-month button', 'Rename, remove or add lines'); await w(500); await shot('plan-lines-manage');
  await p.evaluate(() => scrollBy(0, 500)); await shot('plan-lines-manage-2');
  // 4. month close + sweep: pretend it is Dec 3 with receipts in Nov
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('money-map-template-v2')); const rs = []; for (let i = 1; i <= 6; i++) rs.push({ id: 'r' + i, d: '2026-11-' + String(i * 3).padStart(2, '0'), a: 1500, c: 'play:spend', cn: 'Play money', n: '' }); s.receipts = rs; s.ui.done = Object.assign({}, s.ui.done, { receipts: true }); localStorage.setItem('money-map-template-v2', JSON.stringify(s)); sessionStorage.setItem('__keep', '1'); });
  await p.evaluateOnNewDocument(() => { const RealDate = Date; const fixed = new RealDate(2026, 11, 3, 10, 0, 0).getTime(); class D extends RealDate { constructor(...a) { if (!a.length) super(fixed); else super(...a); } static now() { return fixed; } } window.Date = D; });
  await p.goto('file:///home/claude/work/money-map-team.html#2026-12', { waitUntil: 'load' }); await w(900);
  await p.evaluate(() => { const t = document.querySelector('#tour'); if (t && !t.hidden) document.querySelector('#tourSkip').click(); }); await w(300);
  await go('home'); await shot('dec3-home'); await p.evaluate(() => scrollBy(0, 700)); await shot('dec3-home-2');
  const cards = await p.evaluate(() => [...document.querySelectorAll('#hNext, #hStatus, #hBk, .hnext')].filter(e => !e.hidden).map(e => e.innerText.replace(/\s+/g, ' ').slice(0, 200)));
  console.log('dec3 cards:', cards);
  // 5. help menu items
  await p.evaluate(() => scrollTo(0, 0));
  await click('#helpBtn'); await w(300); await click('#helpTab'); await w(600); await shot('help-explain-tab');
  const co = await p.evaluate(() => { const c = document.querySelector('#co'); return c ? { hidden: c.hidden, txt: c.innerText.slice(0, 160) } : 'no #co'; }); console.log('coach:', co);
  for (let i = 0; i < 12; i++) { const v = await p.evaluate(() => { const c = document.querySelector('#co'); return !!c && !c.hidden && c.getBoundingClientRect().width > 0; }); if (!v) break; if (i < 3) await shot('coach-' + i); await click('#coNext'); await w(300); }
  await click('#helpBtn'); await w(300); await click('#helpSetup'); await w(600); await shot('help-guided-setup-replay');
  const replay = await p.evaluate(() => ({ title: document.querySelector('#tourTitle') && document.querySelector('#tourTitle').textContent, next: document.querySelector('#tourNext').textContent, skip: document.querySelector('#tourSkip').textContent, hidden: document.querySelector('#tour').hidden }));
  console.log('replay:', replay);
  await click('#tourSkip'); await w(300);
  fs.writeFileSync(OUT + '/errs.json', JSON.stringify(errs, null, 1)); console.log('errs', errs);
  await b.close();
})();
