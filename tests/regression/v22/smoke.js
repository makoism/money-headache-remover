const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const w = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const [,, vw='390', vh='844', out='/tmp/v22/s'] = process.argv;
  require('fs').mkdirSync(out, {recursive:true});
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox','--disable-gpu'] });
  const p = await b.newPage(); const errs=[];
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message + '\n' + (e.stack||'').split('\n').slice(0,4).join('\n')));
  p.on('console', m => { if (m.type()==='error') errs.push('console: '+m.text()); });
  await p.setViewport({ width:+vw, height:+vh });
  await p.evaluateOnNewDocument(() => { try { (localStorage.clear(), indexedDB.deleteDatabase('money-map-safe')); } catch(e){} });
  await p.goto('file:///home/claude/work/money-map-team.html#2026-11', { waitUntil:'load' }); await w(1200);
  await p.screenshot({ path: out+'/00-load.png' });
  const info = await p.evaluate(() => ({ tourOpen: !document.querySelector('#tour').hidden, title: (document.querySelector('#tourTitle')||{}).textContent, tab: document.querySelector('.tabs [aria-selected=true]')?.textContent }));
  console.log(JSON.stringify(info));
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
