const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const w = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath:'/usr/bin/google-chrome', headless:'new', args:['--no-sandbox','--disable-gpu'] });
  for (const vw of [320, 360, 375, 390]) {
    const p = await b.newPage(); await p.setViewport({ width:vw, height:700, deviceScaleFactor:1 });
    await p.evaluateOnNewDocument(() => { try { (localStorage.clear(), indexedDB.deleteDatabase('money-map-safe')); } catch(e){} });
    await p.goto('file:///home/claude/work/money-map-team.html#2026-11', { waitUntil:'load' }); await w(700);
    for (let i=0;i<40;i++) { const t = await p.$eval('#tourTitle', e=>e.textContent); if (t==='Monthly pay') { await p.type('#tourPay','3200'); } if (t==='Monthly bills') break; await p.click('#tourNext'); await w(250); }
    await w(300);
    const over = await p.evaluate(() => [...document.querySelectorAll('#tourBody .chip')].map(c => { const sp=c.querySelector('span,b'); const r=c.getBoundingClientRect(), q=sp?sp.getBoundingClientRect():r; const cs=getComputedStyle(c); return { t:c.textContent.trim().slice(0,22), sw:sp?sp.scrollWidth:0, cw:Math.round(c.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)), broke:false }; }).filter(x => x.sw > x.cw + 1));
    await p.screenshot({ path: `/tmp/v26/bills_${vw}.png` });
    console.log(vw, 'overflowing labels:', JSON.stringify(over));
    await p.close();
  }
  await b.close();
})();
