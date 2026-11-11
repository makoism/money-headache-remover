const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w } = require('/tmp/v22/lib.js');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844 });
  await p.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch (e) {} window.claude = { use: async () => null }; });
  await p.goto('file:///home/claude/work/money-map-team.html?h=1#2026-11', { waitUntil: 'load' }); await w(700);
  await p.click('#tourSkip').catch(() => {}); await w(600);
  await p.click('#helpBtn'); await w(200);
  console.log(await p.evaluate(() => ({ hidden: document.querySelector('#helpAsk').hidden, txt: document.querySelector('#helpAsk').textContent, menu: document.querySelector('#helpMenu').hidden })));
  await b.close();
})();
