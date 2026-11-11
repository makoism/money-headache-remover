const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { M } = require('/tmp/v25/oracle.js');
const w = ms => new Promise(r => setTimeout(r, ms));
const [,, vw, scheme, out, tab, cur] = process.argv;
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); await p.setViewport({ width: +vw, height: 900, deviceScaleFactor: 1 });
  await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: scheme || 'light' }]);
  const S = M.presetState(cur || '₱'); S.ui = Object.assign(S.ui, { setup: true, sampleHidden: true, name: 'Mako', done: { pay: true, bills: true, goals: true, receipts: true }, seen: { home: true, month: true, goals: true, receipts: true, basics: true } });
  await p.evaluateOnNewDocument(s => { if (!sessionStorage.getItem('__s')) { localStorage.setItem('money-map-template-v2', s); sessionStorage.setItem('__s', '1'); } }, JSON.stringify(S));
  await p.goto('file://' + (process.env.PAGE || '/home/claude/work/money-map-team.html') + '#2026-11', { waitUntil: 'load' }); await w(800);
  await p.evaluate(() => { const t = document.querySelector('#tour'); if (t && !t.hidden) document.querySelector('#tourSkip').click(); const c = document.querySelector('#co:not([hidden]) #coSkip'); if (c) c.click(); }); await w(400);
  await p.evaluate(t => document.querySelector('#tab-' + t).click(), tab || 'home'); await w(900);
  await p.evaluate(() => { const c = document.querySelector('#co:not([hidden]) #coSkip'); if (c) c.click(); }); await w(300);
  await p.screenshot({ path: out, fullPage: true });
  await b.close();
})();
