const { w, P, launch } = require('./lib.js');
const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
(async () => {
  const [,, vw='390', vh='844', out='/tmp/v22/vid'] = process.argv; require('fs').mkdirSync(out,{recursive:true});
  const b = await puppeteer.launch({ executablePath:'/usr/bin/google-chrome', headless:'new', args:['--no-sandbox','--disable-gpu','--autoplay-policy=no-user-gesture-required','--allow-file-access-from-files'] });
  const p = await b.newPage(); const errs=[]; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
  await p.setViewport({ width:+vw, height:+vh });
  await p.evaluateOnNewDocument(() => { try { (localStorage.clear(), indexedDB.deleteDatabase('money-map-safe')); } catch(e){} });
  await p.goto('file:///home/claude/work/pwa/dist/index.html#2026-11', { waitUntil:'load' }); await w(800);
  await p.click('#tourNext'); await w(300); await p.click('#tourNext'); await w(900);
  console.log('title', await p.$eval('#tourTitle', e=>e.textContent));
  const info = await p.evaluate(() => { const v = document.querySelector('#tour video'); return { hasVideo: !!v, tx: document.querySelectorAll('.tx-l').length, plain: document.querySelector('.tx')?.classList.contains('plain'), dur: v && v.duration, rs: v && v.readyState }; });
  console.log(JSON.stringify(info));
  await p.screenshot({ path: out+'/v0.png' });
  if (info.hasVideo) {
    await p.evaluate(() => { const v = document.querySelector('#tour video'); v.currentTime = 100; });
    await w(1500);
    const on = await p.evaluate(() => { const l = document.querySelector('.tx-l.on'); return l ? l.textContent + ' @' + l.dataset.t : null; });
    console.log('line on at 100s:', on);
    await p.screenshot({ path: out+'/v1.png' });
    // click a line
    await p.evaluate(() => document.querySelectorAll('.tx-l')[10].click()); await w(600);
    console.log('after click, t=', await p.evaluate(() => document.querySelector('#tour video').currentTime));
    // scroll away to trigger "Now" button
    await p.evaluate(() => { const l = document.querySelector('#txList'); l.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 })); l.scrollTop = 20; });
    await w(500); console.log('now button shown:', await p.evaluate(() => !document.querySelector('#txNow').hidden));
    await p.screenshot({ path: out+'/v2.png' });
  }
  console.log('errors', JSON.stringify(errs)); await b.close();
})();
