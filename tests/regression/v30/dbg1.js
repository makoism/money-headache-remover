const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844 });
  await p.goto('file:///home/claude/work/money-map-team.html#2026-11', { waitUntil: 'load' }); await new Promise(r => setTimeout(r, 900));
  console.log(JSON.stringify(await p.evaluate(() => ({ title: document.querySelector('#tourTitle').textContent, part: document.querySelector('#tourPart').textContent, vf: document.querySelectorAll('#tourBody .tour-vframe, #tourBody .tour-video, #tourBody svg.tour-scene').length, first: document.querySelector('#tourBody').innerHTML.slice(0, 300) }))));
  await b.close();
})();
