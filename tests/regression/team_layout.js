const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const w = ms => new Promise(r => setTimeout(r, ms));
let fails = 0, passes = 0;
const ok = (n, c, extra) => { if (c) passes++; else { fails++; console.log('FAIL', n, extra || ''); process.exitCode = 1; } };
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const views = [[320, 640], [375, 812], [390, 844], [768, 1024], [1280, 800]];
  const cur = [['₱', '₱'], ['¥', '¥'], ['$', '$']];
  for (const dark of [false, true]) for (const [vw, vh] of views) for (const [sym] of cur) {
    const p = await b.newPage(); const errs = []; const bad = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text())) errs.push(m.text()); });
    await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: dark ? 'dark' : 'light' }]);
    await p.setViewport({ width: vw, height: vh });
    await p.goto('file:///home/claude/work/money-map-team.html#2026-11', { waitUntil: 'load' }); await w(400);
    await p.evaluate(() => { Storage.prototype.setItem = function () {}; (localStorage.clear(), indexedDB.deleteDatabase('money-map-safe')); }); await p.reload({ waitUntil: 'load' }); await w(450);
    const tag = `${vw}x${vh} ${dark ? 'dark' : 'light'} ${sym}`;
    // the tour at every screen
    await p.click('#tourNext'); await w(120);
    await p.click(`input[name=tourCur][value="${sym}"]`); await w(120);
    /* walk every screen of the guided setup: type something wherever there is a box, and look for sideways overflow on each one */
    let n = 0; const seen = [];
    for (let i = 0; i < 45; i++) {
      const wide = await p.evaluate(() => { const t = document.querySelector('#tour'); return t.scrollWidth - t.clientWidth; });
      const title = await p.$eval('#tourTitle', e => e.textContent); seen.push(title); n++;
      if (wide > 1) bad.push('tour wide on screen ' + n + ' (' + title + ')');
      if (await p.$('#tourPay')) await p.type('#tourPay', '2500');
      else if (await p.$('#tourAmt')) await p.type('#tourAmt', '300');
      else if (await p.$('#tourGCost')) { await p.type('#tourGName', 'A long goal name to test wrapping'); await p.type('#tourGCost', '9000'); }
      const nx = await p.$eval('#tourNext', e => e.textContent);
      if (nx === 'View month' || nx === 'Done' || nx === 'Go to bills') break;
      await p.click('#tourNext'); await w(90);
    }
    ok(tag + ': walked the whole setup', seen.length > 20 && seen[seen.length - 1].startsWith('You’re ready'), seen.length + ' screens, last: ' + seen[seen.length - 1]);
    await p.click('#tourNext'); await w(400);
    for (const t of ['month', 'months', 'goals', 'receipts', 'basics']) {
      await p.evaluate(x => document.querySelector(`[data-tab="${x}"]`).click(), t); await w(220);
      if (await p.$eval('#tour', e => !e.hidden)) { const m0 = await p.evaluate(() => { const tt = document.querySelector('#tour'); return tt.scrollWidth - tt.clientWidth; }); if (m0 > 1) bad.push('tab tour wide on ' + t); await p.click('#tourSkip'); await w(220); }
      const m = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
      if (m.sw > m.iw + 1) bad.push(t + ' overflows sideways by ' + (m.sw - m.iw));
    }
    ok(tag + ': no sideways overflow on the tour or any tab', bad.length === 0, bad.join('; '));
    ok(tag + ': no script errors', errs.length === 0, errs.join('; '));
    await p.close();
  }
  await b.close();
  console.log(`layout: ${passes} passed, ${fails} failed`);
})();
