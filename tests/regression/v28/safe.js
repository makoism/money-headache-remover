/* v24.2: second copy in the browser, restore on loss, backup reminder */
const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
const PAGE = 'file:///home/claude/work/money-map-team.html';
const KEY = 'money-map-template-v2';
let fail = 0, pass = 0; const ck = (ok, m) => { console.log((ok ? 'PASS ' : 'FAIL ') + m); ok ? pass++ : fail++; };
const open = async (init, vw = 390) => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(), errs = []; await p.setViewport({ width: vw, height: 844 });
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/ERR_FILE_NOT_FOUND|ERR_TUNNEL_CONNECTION_FAILED|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  if (init) await p.evaluateOnNewDocument(init);
  await p.goto(PAGE + '?s=1#2026-11', { waitUntil: 'load' }); await w(800); return { b, p, errs };
};
const idbRec = p => p.evaluate(() => new Promise(res => { const rq = indexedDB.open('money-map-safe'); rq.onerror = () => res(null); rq.onsuccess = () => { try { const g = rq.result.transaction('kv').objectStore('kv').get('state'); g.onsuccess = () => res(g.result || null); g.onerror = () => res(null); } catch (e) { res(null); } }; }));
const lose = (p, val) => p.evaluate((k, v) => { const o = Storage.prototype.setItem; Storage.prototype.setItem = function () {}; if (v === null) localStorage.removeItem(k); else o.call(localStorage, k, v); }, KEY, val);
const reload = async p => { await p.reload({ waitUntil: 'load' }); await w(1800); };
const coach = async p => { for (let i = 0; i < 12; i++) { const vis = await p.evaluate(() => { const c = document.querySelector('#co'); return !!c && !c.hidden && getComputedStyle(c).display !== 'none' && c.getBoundingClientRect().width > 0; }); if (!vis) return; await p.click('#coNext').catch(() => {}); await w(450); } };
const keep = p => p.evaluate(() => sessionStorage.setItem('__k', '1'));
const tourOpen = p => p.evaluate(() => { const t = document.querySelector('#tour'); return !!t && !t.hidden; });
const canon = v => Array.isArray(v) ? v.map(canon) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canon(v[k])])) : v;
const strip = j => { const o = JSON.parse(j); return JSON.stringify(canon({ steps: o.steps, once: o.once, cfg: o.cfg, plan: o.plan, receipts: o.receipts, name: o.ui.name, cur: o.ui.cur, done: o.ui.done })); };

(async () => {
  // 1. fresh visitor, finish setup, a second copy appears
  let { b, p, errs } = await open(() => { try { if (!sessionStorage.getItem('__k')) { localStorage.clear(); indexedDB.deleteDatabase('money-map-safe'); } } catch (e) {} });
  ck(await tourOpen(p), 'a new visitor sees the setup');
  ck((await p.evaluate(() => !!document.querySelector('#hBk') && document.querySelector('#hBk').hidden)), 'no backup card for a new visitor');
  await runTour(p, P.a); await w(2000); await keep(p);
  const before = await p.evaluate(k => localStorage.getItem(k), KEY);
  let rec = await idbRec(p);
  ck(!!rec && typeof rec.json === 'string', 'second copy exists after setup');
  ck(rec && strip(rec.json) === strip(before), 'second copy has the same numbers as the main copy');
  // 2. main copy removed -> restored
  await lose(p, null); await reload(p);
  ck(!(await tourOpen(p)), 'main copy missing: setup does not reopen');
  let after = await p.evaluate(k => localStorage.getItem(k), KEY);
  ck(!!after && strip(after) === strip(before), 'main copy missing: numbers restored exactly');
  let note = await p.evaluate(() => { const e = document.querySelector('#hBk'); return { hid: e.hidden, t: e.textContent }; });
  ck(!note.hid && /Numbers restored/.test(note.t), 'Home says the numbers were restored');
  const who = await p.evaluate(() => document.body.innerText.includes('Aiko')); ck(who, 'the restored page greets by name');
  await p.click('#hBk [data-bk-ok]'); await w(200);
  ck(await p.evaluate(() => document.querySelector('#hBk').hidden), 'OK dismisses the notice');
  // 3. damaged main copy -> restored
  await lose(p, '{broken'); await reload(p);
  after = await p.evaluate(k => localStorage.getItem(k), KEY);
  ck(!(await tourOpen(p)) && after && strip(after) === strip(before), 'damaged main copy: restored from the second copy');
  // 4. a normal reload does nothing special
  await reload(p);
  note = await p.evaluate(() => document.querySelector('#hBk').textContent);
  ck(!/restored/i.test(note), 'normal reload: no restore notice');
  // 5. both gone -> fresh start
  await p.evaluate(k => { Storage.prototype.setItem = function () {}; localStorage.removeItem(k); indexedDB.deleteDatabase('money-map-safe'); }, KEY); await reload(p);
  ck(await tourOpen(p), 'both copies gone: fresh start, setup opens');
  ck(!(await p.evaluate(() => /restored/i.test(document.querySelector('#hBk').textContent))), 'both copies gone: no restore notice');
  ck(errs.length === 0, 'no page errors (part 1) ' + JSON.stringify(errs)); await b.close();

  // 6. slow database: a fresh page must not overwrite the good copy before it is read
  ({ b, p, errs } = await open(() => { try { if (!sessionStorage.getItem('__k')) { localStorage.clear(); indexedDB.deleteDatabase('money-map-safe'); } } catch (e) {} }));
  await runTour(p, P.b); await w(2000); await keep(p);
  const b2 = await p.evaluate(k => localStorage.getItem(k), KEY);
  await lose(p, null);
  await p.evaluateOnNewDocument(() => { const g = IDBObjectStore.prototype.get; IDBObjectStore.prototype.get = function (...a) { const rq = g.apply(this, a); return rq; }; const o = indexedDB.open.bind(indexedDB); indexedDB.open = function (...a) { const rq = o(...a); return rq; }; });
  // delay the read by delaying the open's success a while
  await p.evaluateOnNewDocument(() => { const d = Object.getOwnPropertyDescriptor(IDBRequest.prototype, 'onsuccess'); Object.defineProperty(IDBRequest.prototype, 'onsuccess', { set(fn) { d.set.call(this, function (...a) { setTimeout(() => fn.apply(this, a), 900); }); }, get() { return d.get.call(this); } }); });
  await reload(p); await w(1500);
  const a2 = await p.evaluate(k => localStorage.getItem(k), KEY), r2 = await idbRec(p);
  ck(a2 && strip(a2) === strip(b2), 'slow database: numbers still restored');
  ck(r2 && strip(r2.json) === strip(b2), 'slow database: the good copy was not overwritten by the empty page');
  ck(errs.length === 0, 'no page errors (part 2) ' + JSON.stringify(errs)); await b.close();

  // 7. storage blocked: the second copy is the only copy
  ({ b, p, errs } = await open(() => { try { if (window.name !== 'kept') { indexedDB.deleteDatabase('money-map-safe'); } const th = function () { throw new Error('blocked'); }; Storage.prototype.getItem = th; Storage.prototype.setItem = th; Storage.prototype.removeItem = th; } catch (e) {} }));
  ck(await tourOpen(p), 'storage blocked: a new visitor still sees the setup');
  const r = await runTour(p, P.a); await w(2000); await p.evaluate(() => { window.name = 'kept'; });
  const txt = await p.evaluate(() => document.querySelector('#saveTxt') && document.querySelector('#saveTxt').textContent);
  ck(/Saved in this browser/.test(txt || ''), 'storage blocked but second copy works: the page says saved (' + txt + ')');
  const r7 = await idbRec(p); ck(!!r7 && r7.json.length > 500, 'storage blocked: second copy written');
  await reload(p).catch(() => {});
  ck(!(await tourOpen(p)) && (await p.evaluate(() => document.body.innerText.includes('Aiko'))), 'storage blocked: numbers come back after a reload');
  ck(errs.length === 0, 'no page errors (part 3) ' + JSON.stringify(errs)); await b.close();

  // 8. backup reminder and last-backup line
  ({ b, p, errs } = await open(() => { try { if (!sessionStorage.getItem('__k')) { localStorage.clear(); indexedDB.deleteDatabase('money-map-safe'); } } catch (e) {} }));
  await p.target().createCDPSession().then(c => c.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: '/tmp/v28/dl', eventsEnabled: false })).catch(() => {});
  await runTour(p, P.a); await w(1500); await keep(p);
  const vis = () => p.evaluate(() => { const e = document.querySelector('#hBk'); return { hid: e.hidden, t: e.textContent.replace(/\s+/g, ' ').trim() }; });
  ck((await vis()).hid, 'no reminder while the next-step card still shows');
  // log a receipt so the next-step card goes away
  await p.evaluate(() => document.querySelector('[data-tab="home"]').click()); await w(500); await coach(p);
  await p.type('#hAmt', '1200'); await p.evaluate(() => document.querySelector('#hForm').requestSubmit()); await w(900);
  let v = await vis(); ck(v.hid && /Make it exact/.test(await p.$eval('#hNext', e => e.textContent)), 'typed numbers: the Make it exact card comes first, the reminder waits');
  await p.click('#hNext [data-hideexact]'); await w(500);
  for (let i = 0; i < 12; i++) { if (await p.evaluate(k => { try { return !!JSON.parse(localStorage.getItem(k)).ui.exactHidden; } catch (e) { return false; } }, KEY)) break; await w(250); } /* the save is deferred; wait for it under load */
  v = await vis(); ck(!v.hid && /Back up your numbers/.test(v.t), 'reminder appears once the cards are done: ' + v.t.slice(0, 60));
  await p.click('#hBk [data-bk-later]'); await w(300);
  if (0) console.log('DBG later:', JSON.stringify(await p.evaluate(k => { const o = JSON.parse(localStorage.getItem(k)); return { later: o.ui.bkLater, bk: o.ui.bk, hid: document.querySelector('#hBk').hidden, now: Date.now() }; }, KEY)));
  ck((await vis()).hid, 'Later hides it');
  await reload(p); ck((await vis()).hid, 'Later still hidden after a reload (snoozed a week)');
  await p.evaluate(() => document.querySelector('[data-tab="basics"]').click()); await w(400);
  ck(/Last backup: never/.test(await p.$eval('#bkWhen', e => e.textContent)), 'Settings says: last backup never');
  await p.click('#bkSave'); await w(1500);
  for (let i = 0; i < 12; i++) { if (/today/.test(await p.$eval('#bkWhen', e => e.textContent))) break; await w(250); }
  ck(/Last backup: today/.test(await p.$eval('#bkWhen', e => e.textContent)), 'Save file marks the backup: ' + await p.$eval('#bkWhen', e => e.textContent));
  { const o = JSON.parse(await p.evaluate(k => localStorage.getItem(k), KEY)); o.ui.bk = Date.now() - 30 * 864e5; delete o.ui.bkLater; await lose(p, JSON.stringify(o)); } await reload(p);
  v = await vis(); ck(!v.hid && /30 days ago/.test(v.t), 'a 30-day-old backup shows the reminder: ' + v.t.slice(0, 50));
  await p.click('#hBk [data-bk-now]'); await w(1500);
  v = await vis(); ck(v.hid, 'Save a copy on Home saves and hides the reminder');
  ck(await p.evaluate(() => /Backup saved/.test(document.querySelector('#cheer').textContent)), 'Home shows a confirmation');
  const files = require('fs').existsSync('/tmp/v28/dl') ? require('fs').readdirSync('/tmp/v28/dl').filter(f => f.endsWith('.json')) : [];
  ck(files.length >= 1, 'a backup file was written: ' + files.join(','));
  if (files.length) { const j = JSON.parse(require('fs').readFileSync('/tmp/v28/dl/' + files[0], 'utf8')); ck(!!(j.steps && j.once && j.cfg), 'the backup file is a valid saved copy'); }
  ck(errs.length === 0, 'no page errors (part 4) ' + JSON.stringify(errs)); await b.close();
  console.log(`SAFE: ${pass} pass, ${fail} fail`); process.exit(fail ? 1 : 0);
})().catch(e => { console.log('CRASH', e.stack); process.exit(2); });
