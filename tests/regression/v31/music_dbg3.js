const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w } = require('/tmp/v22/lib.js');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage(); p.on('pageerror', e => console.log('PAGEERR', e.message)); await p.setViewport({ width: 390, height: 844 });
  await p.goto('http://127.0.0.1:8788/?sfxtest#2026-11', { waitUntil: 'load' }); await w(1200);
  console.log('ctx before', await p.evaluate(() => window.__actx()));
  await p.mouse.move(100, 300); await p.mouse.down(); await w(50); console.log('ctx at mousedown+50', await p.evaluate(() => window.__actx()), await p.evaluate(() => window.__music.playing())); await p.mouse.up(); await w(500);
  console.log('ctx after click', await p.evaluate(() => window.__actx()), await p.evaluate(() => window.__music.playing()));
  await p.mouse.move(100, 320); await p.mouse.down(); await p.mouse.up(); await w(500);
  console.log('ctx after 2nd click', await p.evaluate(() => window.__actx()), await p.evaluate(() => window.__music.playing()));
  await b.close();
})();
