const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const fs = require('fs');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage();
  for (const [svg, size, out, omit] of [['icon.svg',192,'icon-192.png',true],['icon.svg',512,'icon-512.png',true],['icon-maskable.svg',512,'icon-maskable-512.png',false],['icon-maskable.svg',180,'apple-touch-icon.png',false]]) {
    await p.setViewport({ width: size, height: size });
    const s = fs.readFileSync(svg, 'utf8');
    await p.setContent(`<html><body style="margin:0;background:transparent">${s.replace('width="512" height="512"', `width="${size}" height="${size}"`)}</body></html>`);
    await p.screenshot({ path: out, omitBackground: omit, clip: { x: 0, y: 0, width: size, height: size } });
  }
  await b.close();
})();
