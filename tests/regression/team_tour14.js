const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const w = ms => new Promise(r => setTimeout(r, ms));
const ok = (n, c) => { console.log(c ? 'PASS' : 'FAIL', n); if (!c) process.exitCode = 1; };
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  for (const [vw, vh, dark] of [[390, 800, false], [1280, 800, false], [390, 800, true]]) {
    const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: dark ? 'dark' : 'light' }]);
    await p.setViewport({ width: vw, height: vh });
    await p.goto('file:///home/claude/work/money-map-team.html#2026-11', { waitUntil: 'load' }); await w(500);
    const seen = [];
    for (let i = 0; i < 14; i++) {
      seen.push([await p.$eval('#tourPart', e => e.textContent), await p.$eval('#tourTitle', e => e.textContent)]);
      if (i < 13) { await p.click('#tourNext'); await w(150); }
    }
    const tag = vw + (dark ? ' dark' : '');
    ok(tag + ': 14 screens in the default build', seen.length === 14 && (await p.$$eval('#tourDots i', e => e.length)) === 14);
    ok(tag + ': welcome group reads 1 to 4 of 4', [0, 1, 2, 3].every(i => seen[i][0] === 'Welcome · ' + (i + 1) + ' of 4'));
    ok(tag + ': video is screen 4', seen[3][1] === 'A short hello before we start');
    ok(tag + ': mindset 1 to 6, then putting it to work 1 to 4', [4, 5, 6, 7, 8, 9].every((k, i) => seen[k][0] === 'The mindset · ' + (i + 1) + ' of 6') && [10, 11, 12, 13].every((k, i) => seen[k][0] === 'Putting it to work · ' + (i + 1) + ' of 4'));
    ok(tag + ': last screen has two ways out', (await p.$eval('#tourNext', e => e.textContent)) === 'Go to my bills');
    ok(tag + ': no em dashes in any title', seen.every(s => !s[1].includes('—')));
    ok(tag + ': no page errors', errs.length === 0);
    await p.close();
  }
  await b.close();
})();
