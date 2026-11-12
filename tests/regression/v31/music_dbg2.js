const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w } = require('/tmp/v22/lib.js');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage(); p.on('pageerror', e => console.log('PAGEERR', e.message)); await p.setViewport({ width: 390, height: 844 });
  await p.goto('http://127.0.0.1:8788/?sfxtest#2026-11', { waitUntil: 'load' }); await w(1200);
  console.log('allowed?', await p.evaluate(() => ({ on: window.__music.on(), playing: window.__music.playing() })));
  await p.click('#tourTitle'); await w(800);
  console.log('after click', await p.evaluate(() => window.__music.playing()));
  await p.click('#tourNext'); await w(800);
  console.log('after next', await p.evaluate(() => window.__music.playing()));
  await b.close();
})();
