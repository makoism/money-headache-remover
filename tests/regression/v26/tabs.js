const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const w = ms => new Promise(r => setTimeout(r, ms));
const [,, state, vw='390', vh='844', out='/tmp/v26/t', scheme='light'] = process.argv;
(async () => {
  require('fs').mkdirSync(out,{recursive:true});
  const st = require('fs').readFileSync(state,'utf8');
  const b = await puppeteer.launch({ executablePath:'/usr/bin/google-chrome', headless:'new', args:['--no-sandbox','--disable-gpu'] });
  const p = await b.newPage(); await p.setViewport({ width:+vw, height:+vh, deviceScaleFactor:2 });
  await p.emulateMediaFeatures([{name:'prefers-color-scheme', value:scheme}]);
  await p.evaluateOnNewDocument(s => { if (!sessionStorage.getItem('__s')) { if (s) localStorage.setItem('money-map-template-v2', s); sessionStorage.setItem('__s','1'); } }, st);
  await p.goto('file:///home/claude/work/money-map-team.html#2026-11', { waitUntil:'load' }); await w(900);
  const skip = async () => { for (let i=0;i<8;i++){ const done = await p.evaluate(() => { const t=document.querySelector('#tour'); if (t && !t.hidden) { document.querySelector('#tourSkip').click(); return false; } const c=document.querySelector('#co:not([hidden]) #coSkip'); if (c) { c.click(); return false; } return true; }); if (done) break; await w(300);} };
  await skip();
  const dump = async name => { const t = await p.evaluate(() => { const v=[...document.querySelectorAll('[role=tabpanel]')].find(e=>!e.hidden); return v ? v.innerText.replace(/\n+/g,' / ') : ''; }); console.log('== '+name+'\n'+t.slice(0,1800)+'\n'); };
  const go = async (tab, sub) => { await p.evaluate((t) => { const b=document.querySelector('#tab-'+t); b.click(); }, tab); await w(500); await skip(); if (sub) { await p.evaluate(s => document.querySelector('[data-sub='+s+']').click(), sub); await w(500);} };
  await p.screenshot({ path: `${out}/home-top.png` }); await dump('home');
  await p.screenshot({ path: `${out}/home-full.png`, fullPage:true });
  if (process.env.HOMEONLY) { await b.close(); return; }
  await go('receipts'); await p.screenshot({ path: `${out}/receipts.png`, fullPage:true }); await dump('receipts');
  await go('month'); await p.screenshot({ path: `${out}/month.png`, fullPage:true }); await dump('month');
  await go('month','goals'); await p.screenshot({ path: `${out}/goals.png`, fullPage:true }); await dump('goals');
  await go('month','months'); await p.screenshot({ path: `${out}/months.png`, fullPage:true }); await dump('months');
  await go('basics'); await p.screenshot({ path: `${out}/settings.png`, fullPage:true }); await dump('settings');
  await b.close();
})();
