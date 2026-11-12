const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
const PAGE = 'file:///tmp/v31/old.html', KEY = 'money-map-template-v2';
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(), errs = []; await p.setViewport({ width: 390, height: 844 });
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await p.evaluateOnNewDocument(() => { try { if (!sessionStorage.getItem('__k')) { localStorage.clear(); indexedDB.deleteDatabase('money-map-safe'); } } catch (e) {} });
  await p.goto(PAGE + '?s=1&sfxtest#2026-11', { waitUntil: 'load' }); await w(800);
  await runTour(p, P.a); await w(2000); await p.evaluate(() => sessionStorage.setItem('__k', '1'));
  const before = await p.evaluate(k => localStorage.getItem(k), KEY);
  console.log('main copy after tour', !!before, before && before.length);
  const rec = await p.evaluate(() => new Promise(res => { const rq = indexedDB.open('money-map-safe'); rq.onerror = () => res(null); rq.onsuccess = () => { try { const g = rq.result.transaction('kv').objectStore('kv').get('state'); g.onsuccess = () => res(g.result || null); g.onerror = () => res(null); } catch (e) { res('ERR ' + e.message); } }; }));
  console.log('idb rec', rec && typeof rec === 'object' ? Object.keys(rec) + ' json ' + (rec.json || '').length : rec);
  await p.evaluate((k) => { const o = Storage.prototype.setItem; Storage.prototype.setItem = function () {}; localStorage.removeItem(k); }, KEY);
  await p.reload({ waitUntil: 'load' });
  for (let i = 0; i < 10; i++) { await w(200); console.log(i * 200 + 'ms', await p.evaluate(k => { const m = localStorage.getItem(k); let u = null; try { u = JSON.parse(m).ui; } catch (e) {} return [!document.querySelector('#tour').hidden, document.querySelector('#tourTitle') && document.querySelector('#tourTitle').textContent, m ? m.length : null, u && [u.toured, u.setup, u.name, Object.keys(u.done || {}).length]]; }, KEY)); }
  console.log('tour open after reload', await p.evaluate(() => !document.querySelector('#tour').hidden));
  console.log('main copy after reload', await p.evaluate(k => !!localStorage.getItem(k), KEY));
  console.log('restoreErr', await p.evaluate(() => window.__restoreErr || null));
  console.log('errors', JSON.stringify(errs));
  await b.close();
})();
