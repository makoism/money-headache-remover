const { w, P, launch, runTour } = require('./lib.js');
const mockInit = (mode) => {
  window.__calls = [];
  window.claude = { use: async (n) => {
    if (n !== 'sample') return null;
    if (window.__mode === 'denied') return null;
    const fn = async () => ({ text: 'x' });
    fn.limits = async () => ({ images: { mediaTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], maxCount: 10, maxInputBytes: 5000000 } });
    fn.json = async (prompt, opts) => {
      window.__calls.push({ plen: prompt.length, hasCats: /CATEGORIES/.test(prompt), images: (opts.images || []).map(f => ({ name: f.name, type: f.type, size: f.size })) });
      await new Promise(r => setTimeout(r, 700));
      if (window.__mode === 'rate') { throw { code: 'rate_limited' }; }
      if (window.__mode === 'gone') { throw { code: 'not_granted' }; }
      if (window.__mode === 'empty') return { summary: 'Nothing readable.', receipts: [], pay: null, balance: null, bills: [], skipped: [] };
      const cats = window.__cats;
      return { summary: 'Found 3 receipts.', receipts: [
        { date: '2026-11-03', amount: 1280, category: cats[0], note: 'FamilyMart' },
        { date: '2026-11-04', amount: '640', category: 'not-a-real-id', note: 'Cafe <b>x</b>' },
        { date: '2026-11-05', amount: 3300, category: cats[1], note: 'Don Quijote' },
        { date: 'garbage', amount: 5, category: 'other', note: 'bad date' }
      ], pay: null, balance: null, bills: [], skipped: ['One photo was blurry'] };
    };
    return fn;
  } };
};
process.on('unhandledRejection', e => { console.log('UNHANDLED', e && e.message); });
(async () => {
  const out = []; const ok = (c, m) => { out.push((c ? 'PASS ' : 'FAIL ') + m); };
  const { b, p, errs } = await launch(390, 844, 'light');
  await p.evaluateOnNewDocument(mockInit); await p.reload({ waitUntil: 'load' }); await w(800);
  await runTour(p, P.a); await w(900);
  const skipCoach = async () => { for (let i = 0; i < 3; i++) if (await p.evaluate(() => { const c = document.querySelector('#co'); return !!c && !c.hidden; })) { await p.click('#coSkip'); await w(450); } };
  await skipCoach();
  const cats = await p.$$eval('#rcCat option', os => os.map(o => o.value).filter(v => v !== 'other'));
  await p.evaluate(c => { window.__cats = c; }, cats);
  // ---- Home link goes to the camera
  /* on a phone the Home link opens the phone's camera (a file chooser here); on a computer it opens the camera sheet */
  const chooser = p.waitForFileChooser({ timeout: 2500 }).catch(() => null);
  await p.evaluate(() => document.querySelector('#hScan').click());
  const fc = await chooser, sheet = await p.evaluate(() => !document.querySelector('#cam').hidden);
  ok(!!fc || sheet, 'Home link opens the camera (sheet on a computer, chooser on a phone)');
  if (fc) await fc.cancel();
  if (sheet) { await p.click('#camClose'); await w(200); }
  await w(500); await skipCoach();
  ok(await p.evaluate(() => document.querySelector('#tab-receipts').getAttribute('aria-selected') === 'true'), 'Home link moved to Receipts tab');
  ok(await p.evaluate(() => !document.querySelector('#scanDirect').hidden && document.querySelector('#scanOff').hidden), 'Scan card shows camera buttons when Claude is reachable');
  // ---- photo: big jpeg gets shrunk
  await (await p.$('#scanCamIn')).uploadFile('/tmp/v22/receipt_big.jpg'); await w(1500);
  ok(await p.evaluate(() => document.querySelectorAll('#scanFiles .sfile').length === 1 && document.querySelector('#scanRead').textContent === 'Read 1 photo'), 'photo chip and "Read 1 photo"');
  await (await p.$('#scanPickIn')).uploadFile('/tmp/v22/receipt_small.png', '/tmp/v22/doc.pdf'); await w(1200);
  const info = await p.evaluate(() => ({ n: document.querySelectorAll('#scanFiles .sfile').length, msg: document.querySelector('#scanMsg').textContent, read: document.querySelector('#scanRead').textContent }));
  ok(info.n === 2 && /cannot be read here/.test(info.msg), 'png added, pdf refused with a plain note: ' + JSON.stringify(info));
  await p.screenshot({ path: '/tmp/v22/scan_files.png' });
  // remove the png chip, then re-add to test remove
  await p.evaluate(() => document.querySelector('#scanFiles [data-rm="1"]').click()); await w(200);
  ok(await p.evaluate(() => document.querySelectorAll('#scanFiles .sfile').length === 1), 'remove chip works');
  await (await p.$('#scanPickIn')).uploadFile('/tmp/v22/receipt_small.png'); await w(800);
  // ---- read
  const before = await p.evaluate(() => document.querySelectorAll('#rcList li, #rcList .rc').length);
  await p.evaluate(() => document.querySelector('#scanRead').click()); await w(250);
  ok(await p.evaluate(() => !document.querySelector('#scanStop').hidden && document.querySelector('#scanRead').hidden), 'busy state shows Stop');
  await w(1800);
  const calls = await p.evaluate(() => window.__calls);
  ok(calls.length === 1 && calls[0].images.length === 2 && calls[0].hasCats, 'one request with 2 images and the category list');
  ok(calls[0].images[0].type === 'image/jpeg' && calls[0].images[0].size < 2500000 && /\.jpg$/.test(calls[0].images[0].name), 'big photo was shrunk to a smaller jpeg: ' + JSON.stringify(calls[0].images[0]));
  const card = await p.evaluate(() => { const c = document.querySelector('#scanOut .msg.card'); return c ? { rows: c.querySelectorAll('li').length, sels: c.querySelectorAll('select.catsel').length, left: (c.querySelector('.left') || {}).textContent, head: c.querySelector('.grp b').textContent, html: c.innerHTML.includes('<b>x</b>') } : null; });
  ok(card && card.rows === 3 && card.sels === 3 && /unreadable/.test(card.left) && /blurry/.test(card.left) && !card.html, 'review card: 3 rows, category pickers, left-out note, tags stripped: ' + JSON.stringify(card));
  await p.screenshot({ path: '/tmp/v22/scan_card.png' });
  // change a category and untick one
  await p.evaluate(() => { const s = document.querySelectorAll('#scanOut select.catsel'); s[1].value = [...s[1].options].find(o => o.value !== 'other' && o.value !== s[1].value).value; s[1].dispatchEvent(new Event('change')); document.querySelectorAll('#scanOut .msg.card li input')[2].click(); });
  const chosenCat = await p.evaluate(() => document.querySelectorAll('#scanOut select.catsel')[1].value);
  const streak0 = await p.evaluate(() => (document.querySelector('#hStreak') || {}).innerText || '');
  await p.evaluate(() => [...document.querySelectorAll('#scanOut .msg.card button')].find(x => /Add to my page/.test(x.textContent)).click()); await w(900);
  const done = await p.evaluate(() => document.querySelector('#scanOut .msg.card').innerText);
  ok(/Added 2 receipts/.test(done), 'added the 2 ticked receipts: ' + done.replace(/\n/g, ' | '));
  const list = await p.evaluate(() => document.querySelector('#rcList').innerText);
  ok(/FamilyMart/.test(list) && /Cafe/.test(list) && !/Don Quijote/.test(list), 'receipts show in the list below');
  await p.evaluate(() => document.querySelector('.tabs [data-tab=home]').click()); await w(900);
  const streak1 = await p.evaluate(() => { const s = document.querySelector('#hStreak'); return s ? s.textContent : ''; });
  ok(/1\s*week/i.test(streak1) && !/^Weekly streak\s*0/.test(streak1.replace(/\n/g, '').trim()), 'weekly streak counted on Home: ' + streak1.replace(/\n/g, ' | ').slice(0, 90));
  await p.screenshot({ path: '/tmp/v22/home_after_scan.png' });
  await p.evaluate(() => document.querySelector('.tabs [data-tab=receipts]').click()); await w(700);
  await p.evaluate(() => [...document.querySelectorAll('#scanOut .msg.card button')].find(x => x.textContent === 'Undo').click()); await w(500);
  const list2 = await p.evaluate(() => document.querySelector('#rcList').innerText);
  ok(!/FamilyMart/.test(list2), 'Undo removes them');
  // ---- failure modes
  const failCase = async (mode, re, name) => {
    await p.evaluate(m => { window.__mode = m; }, mode);
    await (await p.$('#scanCamIn')).uploadFile('/tmp/v22/receipt_small.png'); await w(700);
    await p.evaluate(() => document.querySelector('#scanRead').click()); await w(1800);
    const t = await p.evaluate(() => (document.querySelector('#scanOut') || {}).innerText + ' || off=' + !document.querySelector('#scanOff').hidden);
    ok(re.test(t), name + ': ' + t.replace(/\n/g, ' | ').slice(0, 140));
  };
  await failCase('rate', /usage limit/, 'rate limited');
  await failCase('empty', /Nothing new found/, 'nothing found');
  await p.evaluate(() => { window.__mode = ''; });
  await failCase('gone', /permission|off=true/, 'permission lost');
  ok(await p.evaluate(() => document.querySelector('#scanDirect').hidden && !document.querySelector('#scanOff').hidden && document.querySelector('#scanApp').open), 'permission lost: buttons hide, reason and Claude app steps show');
  await p.screenshot({ path: '/tmp/v22/scan_off.png' });
  console.log(out.join('\n')); console.log('errors', JSON.stringify(errs));
  await b.close();
})();
