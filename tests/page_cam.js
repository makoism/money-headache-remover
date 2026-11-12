// the camera on a computer: the Camera button opens a sheet with a live view (a fake camera here), Take photo adds a file, Done closes
const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) pass++; else fail++; console.log((c ? 'PASS ' : 'FAIL ') + n + (c ? '' : ' ' + JSON.stringify(x || ''))); };
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.setViewport({ width: 1100, height: 800 });
  const url = process.env.PAGE_URL || 'http://127.0.0.1:8788/';
  await p.goto(url + '#2026-11', { waitUntil: 'load' }); await w(900);
  await runTour(p, P.a); await w(1200);
  await p.evaluate(() => document.querySelector('[data-tab="receipts"]').click()); await w(1200);
  const direct = await p.evaluate(() => !document.querySelector('#scanDirect').hidden);
  if (!direct) { console.log('note: Claude is not reachable on this page, the Camera button is not shown; nothing to test here'); console.log(`CAM: ${pass} pass, ${fail} fail`); await b.close(); return; }
  await p.click('#scanCam'); await w(1500);
  ok('the sheet opens on a computer', await p.evaluate(() => !document.querySelector('#cam').hidden));
  ok('the live view runs', await p.evaluate(() => { const v = document.querySelector('#camVid'); return !!v.srcObject && v.videoWidth > 0; }));
  ok('Take photo is ready', await p.evaluate(() => !document.querySelector('#camShot').disabled));
  await p.click('#camShot'); await w(900);
  ok('a photo joins the files', await p.evaluate(() => document.querySelectorAll('#scanFiles .sfile img').length === 1 && !document.querySelector('#scanGo').hidden));
  ok('the sheet says so and offers Done', await p.evaluate(() => /1 photo added/.test(document.querySelector('#camMsg').textContent) && !document.querySelector('#camDone').hidden));
  await p.click('#camShot'); await w(900);
  ok('a second photo', await p.evaluate(() => document.querySelectorAll('#scanFiles .sfile img').length === 2));
  await p.click('#camDone'); await w(300);
  ok('Done closes the sheet and stops the camera', await p.evaluate(() => document.querySelector('#cam').hidden && !document.querySelector('#camVid').srcObject));
  ok('focus lands on Read', await p.evaluate(() => document.activeElement && document.activeElement.id === 'scanRead'));
  // Escape closes too
  await p.click('#scanCam'); await w(900); await p.keyboard.press('Escape'); await w(200);
  ok('Escape closes it', await p.evaluate(() => document.querySelector('#cam').hidden));
  // a phone keeps the native camera input: pretend to be one
  await p.evaluate(() => { Object.defineProperty(navigator, 'userAgent', { value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15', configurable: true }); });
  let clicked = false; await p.exposeFunction('__camIn', () => { clicked = true; });
  await p.evaluate(() => { document.querySelector('#scanCamIn').addEventListener('click', e => { e.preventDefault(); window.__camIn(); }); });
  await p.click('#scanCam'); await w(300);
  ok('on a phone the button opens the native camera input and no sheet', clicked && await p.evaluate(() => document.querySelector('#cam').hidden));
  ok('no page errors', errs.length === 0, errs);
  console.log(`CAM: ${pass} pass, ${fail} fail`); await b.close();
})();
