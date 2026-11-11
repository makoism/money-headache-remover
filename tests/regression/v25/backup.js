/* Backup: save a copy as a file, wipe, load the file back, and check every number came back exactly. Also bad files. */
const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const fs = require('fs'), path = require('path');
const { M } = require('/tmp/v25/oracle.js');
const w = ms => new Promise(r => setTimeout(r, ms));
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
let pass = 0, fail = 0; const bad = [];
const ok = (m, c, d) => { if (c) pass++; else { fail++; bad.push(m + (d ? ' :: ' + d : '')); } };
const KEYS = ['steps', 'once', 'items', 'cfg', 'receipts', 'plan'];
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  for (const cur of ['₱', '¥', '€', '$']) {
    const S = M.presetState(cur);
    S.ui = Object.assign(S.ui, { setup: true, sampleHidden: true, done: { pay: true, bills: true, goals: true, receipts: true }, seen: { home: true, month: true, goals: true, receipts: true, basics: true } });
    S.receipts = [{ id: 'r1', d: '2026-11-03', a: 12.34, c: 'food', t: 'Lunch' }, { id: 'r2', d: '2026-11-04', a: 1250.5, c: 'other', t: 'Fix' }];
    const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.setViewport({ width: 900, height: 900 });
    await p.evaluateOnNewDocument(st => { if (!sessionStorage.getItem('__s')) { localStorage.setItem('money-map-template-v2', st); sessionStorage.setItem('__s', '1'); } window.__blobs = []; const orig = URL.createObjectURL.bind(URL); URL.createObjectURL = b => { window.__blobs.push(b); return orig(b); }; HTMLAnchorElement.prototype.click = function () { window.__dl = this.download; }; }, JSON.stringify(S));
    await p.goto('file://' + PAGE + '#2026-11', { waitUntil: 'load' }); await w(600);
    await p.evaluate(() => { const t = document.querySelector('#tour'); if (t && !t.hidden) document.querySelector('#tourSkip').click(); const c = document.querySelector('#co:not([hidden]) #coSkip'); if (c) c.click(); }); await w(300);
    await p.evaluate(() => document.querySelector('#tab-basics').click()); await w(400);
    await p.evaluate(() => { const c = document.querySelector('#co:not([hidden]) #coSkip'); if (c) c.click(); });
    const read = () => p.evaluate(() => JSON.parse(localStorage.getItem('money-map-template-v2')));
    const waitSaved = async () => { for (let i = 0; i < 60; i++) { if (!(await p.evaluate(() => !!document.querySelector('#save.busy')))) return; await w(100); } };
    await waitSaved(); const A = await read();
    /* save to file */
    await p.evaluate(() => document.querySelector('#bkSave').click()); await w(300);
    const dl = await p.evaluate(() => window.__dl), txt = await p.evaluate(async () => { const bl = window.__blobs[window.__blobs.length - 1]; return bl ? await bl.text() : null; });
    ok(cur + ' file name', /^money-headache-remover-\d{4}-\d\d-\d\d\.json$/.test(dl || ''), dl);
    let parsed = null; try { parsed = JSON.parse(txt); } catch (e) { /* */ }
    ok(cur + ' file is valid JSON', !!parsed);
    ok(cur + ' file has the same numbers as the saved copy', parsed && KEYS.every(k => JSON.stringify(parsed[k]) === JSON.stringify(A[k])), parsed ? KEYS.filter(k => JSON.stringify(parsed[k]) !== JSON.stringify(A[k])).join(',') : 'no file');
    ok(cur + ' receipts are in the file', parsed && Array.isArray(parsed.receipts) && parsed.receipts.length === 2);
    const f = path.join('/tmp/v25', 'bk_' + cur.charCodeAt(0) + '.json'); fs.writeFileSync(f, txt || '');
    /* wipe: start with everything at zero */
    await p.evaluate(() => { document.querySelector('#blankBtn').click(); document.querySelector('#blankBtn').click(); }); await w(500); await waitSaved();
    await p.evaluate(() => document.querySelector('#tab-basics').click()); await w(300);
    const Z = await read();
    ok(cur + ' wipe really cleared the plan', JSON.stringify(Z.steps) !== JSON.stringify(A.steps));
    /* load the file */
    const inp = await p.$('#bkFile'); await inp.uploadFile(f); await w(700); await waitSaved();
    const B = await read();
    ok(cur + ' after loading the file every number matches', KEYS.every(k => JSON.stringify(B[k]) === JSON.stringify(A[k])), KEYS.filter(k => JSON.stringify(B[k]) !== JSON.stringify(A[k])).join(','));
    const msg = await p.evaluate(() => document.querySelector('#bkMsg').textContent);
    ok(cur + ' says Loaded', msg === 'Loaded.', msg);
    /* bad files change nothing and say so */
    for (const [name, body] of [['not json', 'hello there'], ['empty', ''], ['other json', '{"a":1}'], ['array', '[1,2,3]'], ['half a copy', txt.slice(0, Math.floor(txt.length / 2))]]) {
      const bf = '/tmp/v25/bk_bad.json'; fs.writeFileSync(bf, body); await inp.uploadFile(bf); await w(500); await waitSaved();
      const C = await read(), m2 = await p.evaluate(() => document.querySelector('#bkMsg').textContent);
      ok(cur + ' bad file (' + name + ') leaves numbers alone', KEYS.every(k => JSON.stringify(C[k]) === JSON.stringify(A[k])));
      ok(cur + ' bad file (' + name + ') says so', /Not a valid backup/.test(m2), m2);
    }
    /* paste route */
    await p.evaluate(() => { document.querySelector('#blankBtn').click(); document.querySelector('#blankBtn').click(); }); await w(500); await waitSaved();
    await p.evaluate(() => document.querySelector('#tab-basics').click()); await w(300);
    await p.evaluate(t => { const ta = document.querySelector('#bk'); ta.value = t; ta.dispatchEvent(new Event('input', { bubbles: true })); document.querySelector('#bkLoad').click(); }, txt); await w(600); await waitSaved();
    const D = await read(); ok(cur + ' pasted copy loads every number', KEYS.every(k => JSON.stringify(D[k]) === JSON.stringify(A[k])), KEYS.filter(k => JSON.stringify(D[k]) !== JSON.stringify(A[k])).join(','));
    ok(cur + ' currency kept', D.ui.cur === A.ui.cur);
    ok(cur + ' no page errors', errs.length === 0, errs.join(' | '));
    await p.close();
  }
  await b.close();
  console.log('PASS', pass, 'FAIL', fail); bad.forEach(x => console.log('  FAIL', x)); process.exit(fail ? 1 : 0);
})();
