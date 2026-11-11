const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const w = ms => new Promise(r => setTimeout(r, ms));
const mode = process.argv[2] || 'ok', port = process.argv[3] || '8777';
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await p.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1');
  await p.evaluateOnNewDocument(() => { try { (localStorage.clear(), indexedDB.deleteDatabase('money-map-safe')); } catch (e) {} });
  await p.goto(`http://localhost:${port}/`, { waitUntil: 'load' }); await w(900);
  const title = () => p.$eval('#tourTitle', e => e.textContent);
  console.log('first screen:', await title());
  await p.click('#tourNext'); await w(400); console.log('second:', await title());
  await p.click('#tourNext'); await w(300); console.log('third:', await title());
  const st = () => p.evaluate(() => { const f = document.querySelector('#tourVF'), v = document.querySelector('#tourVid'); return f ? { loading: f.classList.contains('loading'), pct: (document.querySelector('#tourLoadPct') || {}).textContent, src: (v.getAttribute('src') || '').slice(0, 14), card: !!document.querySelector('#tourVideo'), t: +v.currentTime.toFixed(2), rate: v.playbackRate, ready: v.readyState, err: v.error && v.error.code } : { noPlayer: true, card: !!document.querySelector('.tour-video'), body: document.querySelector('#tourBody').innerText.slice(0, 120) }; });
  for (let i = 0; i < 4; i++) { console.log('t+' + i * 0.7 + 's', JSON.stringify(await st())); await w(700); }
  if (mode === 'fail') { await w(1500); console.log('after fail', JSON.stringify(await st())); await p.screenshot({ path: '/tmp/v22/vid_fail.png' }); await b.close(); console.log('errors', JSON.stringify(errs)); return; }
  if (mode === 'slow') {
    await w(300); console.log('mid-download', JSON.stringify(await st()));
    await p.screenshot({ path: '/tmp/v22/vid_loading.png' });
    await p.click('#tourNext'); await w(1200); console.log('left the screen ->', await title()); await w(1500);
    await b.close(); console.log('errors', JSON.stringify(errs)); return;
  }
  // wait until ready
  for (let i = 0; i < 40; i++) { const s = await st(); if (!s.loading && s.src === 'blob:http://loc') break; await w(300); }
  console.log('ready', JSON.stringify(await st()));
  await p.screenshot({ path: '/tmp/v22/vid_ready.png' });
  await p.click('#tourPlay'); await w(2500);
  const s1 = await st(); console.log('after play 2.5s', JSON.stringify(s1));
  await p.click('#tourSpeed [data-rate="2"]'); await w(1500);
  const s2 = await st(); console.log('2x', JSON.stringify(s2));
  await p.evaluate(() => { const l = document.querySelector('.tx-l[data-t]'); const ls = document.querySelectorAll('.tx-l'); ls[Math.min(12, ls.length - 1)].click(); }); await w(1200);
  console.log('after transcript click', JSON.stringify(await st()));
  // leave and come back: no second download
  await p.click('#tourNext'); await w(500); await p.click('#tourBack'); await w(600);
  console.log('back on video', JSON.stringify(await st()));
  console.log('errors', JSON.stringify(errs)); await b.close();
})();
