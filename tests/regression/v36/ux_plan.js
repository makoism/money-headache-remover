const L = require('/tmp/v22/lib.js'); const { w, P, runTour } = L;
const fs = require('fs'); const OUT = '/tmp/v36/r'; let n = 0;
(async () => {
  const { b, p, errs } = await L.launch(390, 844, 'dark');
  const shot = async (name) => { n++; await p.screenshot({ path: `${OUT}/${String(n).padStart(2, '0')}-${name}.png` }); };
  const go = async (t) => { await p.evaluate(t => { const b = document.querySelector(`[data-tab="${t}"]`) || document.querySelector(`[data-tab-go="${t}"]`); b && b.click(); }, t); await w(450); };
  const click = async (sel) => p.evaluate(s => { const e = document.querySelector(s); if (!e) return false; e.scrollIntoView({ block: 'center' }); e.click(); return true; }, sel);
  const clickText = async (sel, re) => p.evaluate((s, r) => { const e = [...document.querySelectorAll(s)].find(x => new RegExp(r).test(x.textContent) && x.offsetParent); if (!e) return false; e.scrollIntoView({ block: 'center' }); e.click(); return true; }, sel, re);
  await runTour(p, P.a); await w(1200);
  await go('month');
  // tap the rent line amount
  const opened = await p.evaluate(() => { const r = [...document.querySelectorAll('#rowsOut [data-edit], #rowsOut .row, #rowsOut button')].find(x => /Rent/.test(x.textContent)); if (!r) return 'no rent row'; r.scrollIntoView({ block: 'center' }); (r.querySelector('[data-edit]') || r).click(); return r.outerHTML.slice(0, 160); });
  console.log('rent row:', opened); await w(400); await shot('plan-rent-open');
  const edHtml = await p.evaluate(() => { const e = document.querySelector('#rowsOut .ed, #rowsOut .row.on, #rowsOut [data-key="bill:rent"]'); return e ? e.innerText.replace(/\s+/g, ' ').slice(0, 400) : 'no editor'; }); console.log('editor text:', edHtml);
  const inp = await p.$('#rowsOut input[data-mny], #rowsOut input.amt-in, #rowsOut input[type=number]');
  if (inp) { await p.evaluate(e => { e.scrollIntoView({ block: 'center' }); e.focus(); }, inp); await p.evaluate(e => { e.value = ''; }, inp); await inp.type('90000'); await w(500); await shot('plan-rent-edited'); console.log('after edit:', await p.evaluate(() => { const e = document.querySelector('#rowsOut .ed, #rowsOut .row.on'); return e ? e.innerText.replace(/\s+/g, ' ').slice(0, 400) : ''; })); }
  await p.evaluate(() => scrollTo(0, 0)); await w(200); await shot('plan-top-after-edit');
  await p.evaluate(() => scrollBy(0, 700)); await shot('plan-mid-after-edit');
  // the lines manager
  const lm = await clickText('#p-month button', 'Rename, remove or add lines'); console.log('lines manager opened', lm); await w(500); await shot('plan-lines-1'); await p.evaluate(() => scrollBy(0, 600)); await shot('plan-lines-2');
  // month close + sweep: Dec 3 with receipts in Nov
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('money-map-template-v2')); const rs = []; for (let i = 1; i <= 6; i++) rs.push({ id: 'r' + i, d: '2026-11-' + String(i * 3).padStart(2, '0'), a: 1500, c: 'play:spend', cn: 'Play money', n: '' }); s.receipts = rs; s.ui.done = Object.assign({}, s.ui.done, { receipts: true }); localStorage.setItem('money-map-template-v2', JSON.stringify(s)); sessionStorage.setItem('__keep', '1'); });
  await p.evaluateOnNewDocument(() => { const RealDate = Date; const fixed = new RealDate(2026, 11, 3, 10, 0, 0).getTime(); class D extends RealDate { constructor(...a) { if (!a.length) super(fixed); else super(...a); } static now() { return fixed; } } window.Date = D; });
  await p.goto('file:///home/claude/work/money-map-team.html#2026-12', { waitUntil: 'load' }); await w(900);
  await p.evaluate(() => { const t = document.querySelector('#tour'); if (t && !t.hidden) document.querySelector('#tourSkip').click(); }); await w(300);
  await go('home'); await shot('dec3-home'); await p.evaluate(() => scrollBy(0, 700)); await shot('dec3-home-2');
  const cards = await p.evaluate(() => [...document.querySelectorAll('#hNext, #hStatus, #hBk, .hnext')].filter(e => !e.hidden).map(e => e.id + ': ' + e.innerText.replace(/\s+/g, ' ').slice(0, 220)));
  console.log('dec3 cards:', cards);
  await p.evaluate(() => scrollTo(0, 0));
  const sw = await click('[data-sweep]'); console.log('sweep clicked', sw); await w(800); await shot('dec3-after-sweep');
  console.log('after sweep cards:', await p.evaluate(() => [...document.querySelectorAll('#hNext, #hStatus, .hnext')].filter(e => !e.hidden).map(e => e.id + ': ' + e.innerText.replace(/\s+/g, ' ').slice(0, 200))));
  fs.writeFileSync(OUT + '/errs.json', JSON.stringify(errs, null, 1)); console.log('errs', errs);
  await b.close();
})();
