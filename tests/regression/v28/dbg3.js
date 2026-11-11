const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
const KEY = 'money-map-template-v2';
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844 });
  await p.evaluateOnNewDocument(() => { try { if (!sessionStorage.getItem('__k')) { localStorage.clear(); indexedDB.deleteDatabase('money-map-safe'); } } catch (e) {} });
  await p.goto('file:///home/claude/work/money-map-team.html?s=3#2026-11', { waitUntil: 'load' }); await w(800);
  await runTour(p, P.a); await w(2000); await p.evaluate(() => sessionStorage.setItem('__k', '1'));
  const before = await p.evaluate(k => localStorage.getItem(k), KEY);
  console.log('done flags', JSON.stringify(JSON.parse(before).ui.done), 'receipts', JSON.parse(before).receipts.length, 'hNext hidden', await p.evaluate(() => document.querySelector('#hNext').hidden));
  await p.evaluate(() => document.querySelector('[data-tab="home"]').click()); await w(300);
  await p.type('#hAmt', '1200'); await p.click('#hSave'); await w(900);
  const s2 = JSON.parse(await p.evaluate(k => localStorage.getItem(k), KEY));
  console.log('after receipt: done', JSON.stringify(s2.ui.done), 'receipts', s2.receipts.length, 'sampleHidden', s2.ui.sampleHidden, 'preset', s2.ui.preset, 'cleared', s2.ui.cleared, 'hNext hidden', await p.evaluate(() => document.querySelector('#hNext').hidden), 'hBk', await p.evaluate(() => document.querySelector('#hBk').hidden + ' ' + document.querySelector('#hBk').textContent));
  // restore diff
  await p.evaluate(k => { const o = Storage.prototype.setItem; Storage.prototype.setItem = function () {}; localStorage.removeItem(k); }, KEY);
  await p.reload({ waitUntil: 'load' }); await w(2000);
  const after = JSON.parse(await p.evaluate(k => localStorage.getItem(k), KEY)), bef = s2;
  for (const k of ['steps', 'once', 'cfg', 'plan', 'receipts']) console.log(k, JSON.stringify(after[k]) === JSON.stringify(bef[k])); console.log('cfg before', JSON.stringify(bef.cfg), 'after', JSON.stringify(after.cfg));
  console.log('ui diff:', Object.keys(Object.assign({}, bef.ui, after.ui)).filter(k => JSON.stringify(bef.ui[k]) !== JSON.stringify(after.ui[k])).map(k => k + ': ' + JSON.stringify(bef.ui[k]) + ' -> ' + JSON.stringify(after.ui[k])).join(' | '));
  await b.close();
})();
