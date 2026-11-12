// every tour screen as it stands, phone width, light
const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
(async () => {
  const out = '/tmp/v30/tour_' + (process.argv[2] || 'now'); require('fs').mkdirSync(out, { recursive: true });
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 1300 });
  await p.goto('http://127.0.0.1:8788/#2026-11', { waitUntil: 'load' }); await w(900);
  const seen = [];
  const r = await runTour(p, P.a, async i => { const t = await p.$eval('#tourTitle', e => e.textContent); seen.push(t); await p.screenshot({ path: `${out}/${String(i).padStart(2, '0')}-${t.replace(/[^a-z0-9]+/gi, '_').slice(0, 24)}.png`, fullPage: false }); });
  console.log(seen.join(' | ')); console.log('probs', r.probs);
  await b.close();
})();
