const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const w = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath:'/usr/bin/google-chrome', headless:'new', args:['--no-sandbox','--disable-gpu'] });
  const p = await b.newPage(); await p.setViewport({ width:390, height:844, deviceScaleFactor:2 });
  await p.evaluateOnNewDocument(() => { try { if(!sessionStorage.getItem('__c')){ (localStorage.clear(), indexedDB.deleteDatabase('money-map-safe')); sessionStorage.setItem('__c','1'); } } catch(e){} });
  await p.goto('file:///home/claude/work/money-map-team.html#2026-11', { waitUntil:'load' }); await w(900);
  await p.click('#tourSkip'); await w(800);
  for (let i=0;i<6;i++){ const c = await p.$('#co:not([hidden]) #coSkip'); if (c) { await c.click(); await w(400);} }
  await p.screenshot({ path:'/tmp/v26/skip-home.png', fullPage:true });
  console.log(await p.evaluate(()=>document.querySelector('#p-home').innerText.replace(/\n+/g,' / ').slice(0,1500)));
  await b.close();
})();
