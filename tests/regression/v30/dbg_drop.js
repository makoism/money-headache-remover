const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844 });
  await p.goto('http://127.0.0.1:8788/#2026-11', { waitUntil: 'load' }); await w(900);
  await runTour(p, P.a, async () => { if ((await p.$eval('#tourTitle', e => e.textContent)) === 'Your statements') throw new Error('stop'); }).catch(() => {});
  await w(800);
  console.log(JSON.stringify(await p.evaluate(() => {
    const q = s => document.querySelector(s); const cs = e => e ? getComputedStyle(e) : null;
    const panel = q('#srcUploadPanel'), arrow = q('.drop-arrow'), grass = q('#srcUploadPanel .art'), din = q('.drop-in');
    return { panelClass: panel.className, pos: cs(panel).position, ov: cs(panel).overflow, radius: cs(panel).borderRadius, arrowW: arrow && arrow.getBoundingClientRect().width, arrowCls: arrow && arrow.getAttribute('class'), dinDisplay: cs(din).display, grassPos: grass && cs(grass).position, grassRect: grass && JSON.stringify(grass.getBoundingClientRect()), panelRect: JSON.stringify(panel.getBoundingClientRect()), html: panel.outerHTML.slice(0, 400) };
  }), null, 1));
  await p.screenshot({ path: '/tmp/v30/drop_dbg.png' });
  await b.close();
})();
