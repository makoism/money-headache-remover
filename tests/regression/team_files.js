const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const w = ms => new Promise(r => setTimeout(r, ms));
let fails = 0;
const ok = (name, cond) => { console.log(cond ? 'PASS' : 'FAIL', name); if (!cond) { fails++; process.exitCode = 1; } };
async function session(opts, fn) {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--disable-features=BackForwardCache,ProactivelySwapBrowsingInstance', '--disable-site-isolation-trials'] });
  const p = await b.newPage(); const errs = [];
  p.on('console', m => { if (['error', 'warning'].includes(m.type())) errs.push(m.type() + ': ' + m.text()); });
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  await p.setViewport({ width: 1180, height: 900 });
  await p.evaluateOnNewDocument(o => {
    window.__mock = { mode: 'ok', calls: [], payload: null, aborted: false };
    window.claude = { use: async name => {
      if (name !== 'sample') return null;
      const fn = async (input, opts) => { window.__mock.calls.push({ kind: 'chat' }); opts.onText({ text: 'Tap Basics.', delta: 'Tap Basics.' }); return { text: 'Tap Basics.', truncated: false }; };
      fn.json = async (input, opts) => {
        const M = window.__mock; M.calls.push({ kind: 'json', input: typeof input === 'string' ? input : JSON.stringify(input), cache: opts.cache, tier: opts.modelTier, nImages: opts.images ? opts.images.length : 0, hasSignal: !!opts.signal });
        if (M.mode.startsWith('err:')) throw Object.assign(new Error('mock'), { code: M.mode.slice(4) });
        if (M.mode === 'hang') return new Promise((res, rej) => { opts.signal.addEventListener('abort', () => { M.aborted = true; rej(Object.assign(new Error('c'), { code: 'cancelled' })); }); });
        await new Promise(r => setTimeout(r, 80));
        return JSON.parse(JSON.stringify(M.payload));
      };
      if (o.images) fn.limits = async () => ({ maxPromptBytes: 262144, images: { maxCount: 5, maxInputBytes: 20000000, mediaTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] } });
      else fn.limits = async () => ({ maxPromptBytes: 262144 });
      return fn;
    } };
  }, opts);
  await p.goto('file:///home/claude/work/money-map-team.html#2026-11', { waitUntil: 'load' });
  const frozen = json => p.evaluate(j => { const orig = Storage.prototype.setItem; Storage.prototype.setItem = function () {}; (localStorage.clear(), indexedDB.deleteDatabase('money-map-safe')); if (j !== null) orig.call(localStorage, 'money-map-template-v2', j); }, json);
  const H = { p, w, errs,
    fresh: async () => { await frozen(null); await p.reload({ waitUntil: 'load' }); await w(500); },
    q: s => p.$eval(s, e => e.textContent.trim()).catch(() => 'MISSING:' + s),
    hidden: s => p.$eval(s, e => e.hidden).catch(() => 'MISSING'),
    skipTour: async () => { if (await p.$eval('#tour', e => !e.hidden)) { await p.click('#tourSkip'); await w(250); } },
    mock: () => p.evaluate(() => window.__mock),
    setPayload: pl => p.evaluate(x => { window.__mock.payload = x; }, pl),
    setMode: m => p.evaluate(x => { window.__mock.mode = x; }, m),
    open: async () => { await p.click('#helpBtn'); await w(120); await p.click('#helpAsk'); await w(250); },
    attach: async files => { const inp = await p.$('#askFile'); await inp.uploadFile(...files); await w(300); },
    state: () => p.evaluate(() => JSON.parse(localStorage.getItem('money-map-template-v2') || 'null')),
  };
  await fn(H); console.log('ERRORS:', JSON.stringify(errs)); if (errs.length) { fails++; process.exitCode = 1; }
  await b.close();
}
const PAYLOAD = {
  summary: 'I found 4 purchases, your pay and your rent.',
  receipts: [
    { date: '2026-11-03', amount: 1280, category: 'bill:food', note: 'Seven Eleven' },
    { date: '2026-11-04', amount: 3500, category: 'nonsense:id', note: '<img src=x onerror="window.__xss=1">Amazon' },
    { date: '2026-11-05', amount: 420, category: 'bill:food', note: 'FamilyMart' },
    { date: '2026-11-06', amount: 900, category: 'bill:food', note: 'Lawson' },
    { date: '2025-01-02', amount: 700, category: 'bill:food', note: 'too early' },
    { date: 'not a date', amount: 100, category: 'other', note: 'bad date' },
    { date: '2026-11-07', amount: -50, category: 'other', note: 'negative' },
    { date: '2026-11-07', amount: 'abc', category: 'other', note: 'not a number' },
  ],
  pay: { amount: 300000, month: '2026-10' },
  balance: { amount: 123456, date: '2026-11-09' },
  bills: [{ category: 'bill:rent', amount: 42300 }, { category: 'bill:nothing', amount: 5 }, { category: 'bill:rent', amount: 1 }],
  skipped: ['One photo was blurry at the bottom.'],
};
(async () => {
  /* ---------- A: images allowed ---------- */
  await session({ images: true }, async H => {
    const { p } = H; console.log('--- A: with images');
    await H.fresh(); await H.skipTour(); await H.open();
    ok('the paperclip shows when Claude is available', (await H.hidden('#askAttach')) === false);
    ok('the file picker accepts photos and CSV files', await p.$eval('#askFile', e => e.accept.includes('image/png') && e.accept.includes('.csv') && !e.accept.includes('pdf')));
    ok('the intro tells people about files', (await p.$eval('#askLog', e => e.textContent)).includes('paperclip'));
    ok('a suggestion offers to fill in the page', await p.$eval('#askSug', e => e.textContent.includes('Fill in my page')));
    await H.attach(['/tmp/ftest/receipt.png', '/tmp/ftest/card.csv', '/tmp/ftest/sjis.csv']);
    ok('three chips appear', (await p.$$eval('#askFiles .fchip', e => e.length)) === 3);
    ok('the privacy line changes while files are attached', (await H.q('#askCap')).includes('This page does not keep them'));
    ok('the box says what to write', (await p.$eval('#askIn', e => e.placeholder)).includes('October card statement'));
    await H.attach(['/tmp/ftest/statement.pdf']);
    ok('a PDF is refused with a helpful reason', (await H.q('#askFilesMsg')).includes('PDFs cannot be read here') && (await p.$$eval('#askFiles .fchip', e => e.length)) === 3);
    await H.attach(['/tmp/ftest/notes.docx']);
    ok('another file type is refused', (await H.q('#askFilesMsg')).includes('photos, screenshots and CSV'));
    await p.click('#askFiles [data-rmf="2"]'); await w(100);
    ok('a chip can be removed', (await p.$$eval('#askFiles .fchip', e => e.length)) === 2 && (await H.hidden('#askFilesMsg')) === true);
    await H.setPayload(PAYLOAD);
    await p.type('#askIn', 'October card statement'); await p.click('#askSend'); await w(900);
    const m = await H.mock(); const c = m.calls.find(x => x.kind === 'json');
    ok('one reading call, with the photo, the default tier and no cache', m.calls.filter(x => x.kind === 'json').length === 1 && c.nImages === 1 && c.tier === 'default' && c.cache === false && c.hasSignal);
    ok('the prompt carries the categories, the note, the csv text and today', c.input.includes('bill:rent') && c.input.includes('October card statement') && c.input.includes('セブンイレブン') && /Today is \d{4}-\d{2}-\d{2}/.test(c.input));
    ok('...and no em dash anywhere in it', !c.input.includes('—'));
    ok('the chat did not run as a normal question', m.calls.filter(x => x.kind === 'chat').length === 0);
    ok('the files are cleared after sending', (await p.$$eval('#askFiles .fchip', e => e.length)) === 0 && (await H.hidden('#askFiles')) === true);
    ok('a card shows what was found', await p.$eval('#askLog .card', e => e.textContent.includes('I found 4 purchases') && e.textContent.includes('Seven Eleven') && e.textContent.includes('FamilyMart')));
    const rows = await p.$$eval('#askLog .card li', e => e.map(x => ({ t: x.textContent, on: x.querySelector('input').checked, dupe: x.classList.contains('dupe') })));
    ok('only valid receipts are listed (4 of 8)', rows.length === 4);
    ok('a made-up category becomes Other', rows.some(r => r.t.includes('Other')) );
    ok('markup in a note is plain text', (await p.evaluate(() => window.__xss)) === undefined && (await p.$$eval('#askLog .card img', e => e.length)) === 0);
    ok('the plan section offers pay, rent (once) and money today', await p.$eval('#askLog .card', e => { const t = e.textContent; return t.includes('Salary:') && t.includes('300,000') && (t.match(/Rent[^:]*:/g) || []).length === 1 && t.includes('Money today') && t.includes('123,456'); }));
    ok('things left out are listed', await p.$eval('#askLog .card', e => e.textContent.includes('Left out') && e.textContent.includes('before Nov 2026') && e.textContent.includes('could not be read') && e.textContent.includes('blurry')));
    ok('nothing has changed yet', ((await H.state()) || { receipts: [] }).receipts.length === 0);
    await p.$eval('#askLog .card li input', e => e.click());   // untick the first receipt
    await p.click('#askLog .card .btn.solid'); await w(500);
    const st = await H.state();
    ok('3 receipts were added (one was unticked)', st.receipts.length === 3 && !st.receipts.some(r => r.n === 'Seven Eleven'));
    ok('the made-up category was stored as other', st.receipts.some(r => r.c === 'other' && r.n.includes('Amazon')) && st.receipts.filter(r => r.c === 'bill:food').length === 2);
    ok('the note was stored as plain text', st.receipts.every(r => !/[<>]/.test(r.n)));
    ok('pay, rent and money today changed', st.steps.a && st.steps.a.slice(-1)[0].v === 300000 && st.steps['bill:rent'] && st.steps['bill:rent'].slice(-1)[0].v === 42300 && st.cfg.bankStart === 123456);
    ok('the page shows the new pay', (await p.$eval('#h-a', e => e.value)) === '₱300,000');
    ok('the card turns into a done message with Undo', await p.$eval('#askLog .card', e => e.textContent.includes('Done. Added 3 receipts, your pay, 1 bill amount and your money today.') && !!Array.from(e.querySelectorAll('button')).find(b => b.textContent === 'Undo')));
    await p.evaluate(() => { const b = Array.from(document.querySelectorAll('#askLog .card button')).find(x => x.textContent === 'Undo'); b.click(); }); await w(500);
    const st2 = await H.state();
    ok('Undo removes the receipts and puts back pay, rent and money today', st2.receipts.length === 0 && !(st2.steps.a && st2.steps.a.length) && !st2.steps['bill:rent'] && st2.cfg.bankStart === undefined);
    ok('the page shows the old pay again', (await p.$eval('#h-a', e => e.value)) === '₱30,000');
    ok('the card says it was undone', (await p.$eval('#askLog', e => e.textContent)).includes('Undone.'));
    /* adding the same photo again: the duplicates are flagged */
    await H.attach(['/tmp/ftest/receipt.png']); await H.setPayload({ summary: 'One purchase.', receipts: [{ date: '2026-11-03', amount: 1280, category: 'bill:food', note: 'Seven Eleven' }], pay: null, balance: null, bills: [], skipped: [] });
    await p.click('#askSend'); await w(700); await p.click('#askLog .msg.card:last-of-type .btn.solid'); await w(400);
    await H.attach(['/tmp/ftest/receipt.png']); await p.click('#askSend'); await w(700);
    const last = await p.$$eval('#askLog .msg.card', e => e[e.length - 1].querySelector('li').className + '|' + e[e.length - 1].querySelector('li input').checked + '|' + e[e.length - 1].textContent.includes('already on your page'));
    ok('the same receipt again is flagged and unticked', last === 'dupe|false|true');
    await p.evaluate(() => { const c = document.querySelectorAll('#askLog .msg.card'); Array.from(c[c.length - 1].querySelectorAll('button')).find(x => x.textContent === 'Not now').click(); }); await w(150);
    ok('Not now changes nothing', (await p.$eval('#askLog', e => e.textContent)).includes('nothing was changed') && (await H.state()).receipts.length === 1);
  });

  /* ---------- B: errors, odd answers, Stop ---------- */
  await session({ images: true }, async H => {
    const { p } = H; console.log('--- B: failures');
    await H.fresh(); await H.skipTour(); await H.open();
    await H.attach(['/tmp/ftest/card.csv']);
    await H.setMode('err:image_rejected'); await p.click('#askSend'); await w(500);
    ok('a rejected photo gives a plain message and keeps the files', (await p.$eval('#askLog', e => e.textContent)).includes('could not be read') && (await p.$$eval('#askFiles .fchip', e => e.length)) === 0 === false);
    await H.setMode('err:invalid_json'); await p.click('#askSend'); await w(500);
    ok('unreadable output gives a retry message', (await p.$eval('#askLog', e => e.textContent)).includes('could not turn those files into entries'));
    await H.setMode('err:rate_limited'); await p.click('#askSend'); await w(500);
    ok('rate limit is explained', (await p.$eval('#askLog', e => e.textContent)).includes('usage limit'));
    await H.setMode('ok'); await H.setPayload({ summary: '', receipts: [], pay: null, balance: null, bills: [], skipped: [] });
    await p.click('#askSend'); await w(500);
    ok('an empty answer says nothing was found', (await p.$eval('#askLog', e => e.textContent)).includes('could not find anything new to add'));
    ok('send is back after each failure', (await H.hidden('#askSend')) === false);
    await H.attach(['/tmp/ftest/card.csv']); await H.setMode('hang'); await p.click('#askSend'); await w(300);
    ok('Stop is shown while reading', (await H.hidden('#askStop')) === false && (await H.hidden('#askSend')) === true);
    await p.click('#askStop'); await w(300);
    ok('Stop cancels the call and removes the waiting message', (await H.mock()).aborted === true && (await H.hidden('#askSend')) === false);
    /* garbage shapes */
    await H.setMode('ok');
    for (const [name, pl] of [['a string', 'hello'], ['an array', [1, 2]], ['null', null], ['wrong types', { receipts: 'x', pay: 'y', bills: 5, balance: {}, skipped: 3 }]]) {
      await H.attach(['/tmp/ftest/card.csv']); await H.setPayload(pl); await p.click('#askSend'); await w(500);
      ok('odd answer (' + name + ') does not break the page', (await p.$$eval('#askLog .msg.card', e => e.length)) === 0 && (await H.hidden('#askSend')) === false);
    }
  });

  /* ---------- C: no image support in this view ---------- */
  await session({ images: false }, async H => {
    const { p } = H; console.log('--- C: text only');
    await H.fresh(); await H.skipTour(); await H.open();
    ok('the paperclip still shows (CSV files work)', (await H.hidden('#askAttach')) === false && await p.$eval('#askFile', e => !e.accept.includes('image/')));
    await H.attach(['/tmp/ftest/receipt.png']);
    ok('a photo is refused when photos cannot be sent', (await p.$$eval('#askFiles .fchip', e => e.length)) === 0 && (await H.q('#askFilesMsg')).includes('photos, screenshots and CSV'));
    await H.attach(['/tmp/ftest/sjis.csv']); await H.setPayload({ summary: 'One purchase.', receipts: [{ date: '2026-11-05', amount: 420, category: 'bill:food', note: 'FamilyMart' }], pay: null, balance: null, bills: [], skipped: [] });
    await p.click('#askSend'); await w(600);
    const c = (await H.mock()).calls.find(x => x.kind === 'json');
    ok('a Shift-JIS csv is read correctly', c.input.includes('ファミリーマート') && c.nImages === 0);
  });

  /* ---------- D: ordinary questions still work and a view with no Claude has no paperclip ---------- */
  await session({ images: true }, async H => {
    const { p } = H; console.log('--- D: chat unchanged');
    await H.fresh(); await H.skipTour(); await H.open();
    await p.type('#askIn', 'How do I add a goal?'); await p.click('#askSend'); await w(500);
    ok('a normal question still goes to the chat', (await H.mock()).calls.filter(x => x.kind === 'chat').length === 1 && (await p.$eval('#askLog', e => e.textContent)).includes('Tap Basics.'));
    await p.click('#askClose'); await w(100);
  });
  console.log(fails ? 'FAILURES: ' + fails : 'ALL PASS');
})();
