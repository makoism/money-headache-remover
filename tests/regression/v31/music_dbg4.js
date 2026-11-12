const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w } = require('/tmp/v22/lib.js');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage(); p.on('pageerror', e => console.log('PAGEERR', e.message)); await p.setViewport({ width: 390, height: 844 });
  await p.goto('http://127.0.0.1:8788/?sfxtest#2026-11', { waitUntil: 'load' }); await w(1200);
  const st = () => p.evaluate(() => [window.__actx(), window.__music.playing()]);
  console.log('before', await st());
  await p.click('#tourTitle'); await w(600); console.log('after click on title', await st());
  await p.click('#tourMus'); await w(600); console.log('after click Music off', await st());
  await p.click('#tourMus'); await w(600); console.log('after click Music on', await st());
  await b.close();
})();
