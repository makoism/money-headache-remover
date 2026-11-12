const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const w = ms => new Promise(r => setTimeout(r, ms));
const [,, vw='390', vh='844', out='/tmp/v26/a', scheme='light', persona='a'] = process.argv;
const P = {
  a: { name:'Sam', cur:'$', pay:3200, extra:0, bank:1400, bills:['rent','util','food','net','phone','gas'], amt:{rent:1100,util:120,food:400,net:60,phone:45,gas:100}, goals:['rainy','travel'], g:{travel:{name:'Trip',cost:2400,saved:100}} },
  t: { name:'Sam', cur:'$', pay:1500, extra:0, bank:3000, bills:['rent','util','food','net','phone','gas'], amt:{rent:1100,util:120,food:400,net:60,phone:45,gas:100}, goals:['rainy'], g:{} },
  s: { name:'Sam', cur:'$', pay:1500, extra:0, bank:100, bills:['rent','util','food','net','phone','gas'], amt:{rent:1100,util:120,food:400,net:60,phone:45,gas:100}, goals:['rainy'], g:{} },
  z: { name:'', cur:'$', pay:0, extra:0, bank:0, bills:[], amt:{}, goals:['rainy'], g:{}, skipAll:true },
};
(async () => {
  const pr = P[persona]; require('fs').mkdirSync(out,{recursive:true});
  const b = await puppeteer.launch({ executablePath:'/usr/bin/google-chrome', headless:'new', args:['--no-sandbox','--disable-gpu'] });
  const p = await b.newPage(); const errs=[];
  p.on('pageerror', e => errs.push('PAGEERR '+e.message));
  await p.setViewport({ width:+vw, height:+vh, deviceScaleFactor:2 });
  await p.emulateMediaFeatures([{name:'prefers-color-scheme', value:scheme}]);
  await p.evaluateOnNewDocument(() => { try { if(!sessionStorage.getItem('__c')){ (localStorage.clear(), indexedDB.deleteDatabase('money-map-safe')); sessionStorage.setItem('__c','1'); } } catch(e){} });
  await p.goto('file:///home/claude/work/money-map-team.html#2026-11', { waitUntil:'load' }); await w(900);
  await p.screenshot({ path: `${out}/00-first.png` });
  const type = async (sel, val) => { await p.$eval(sel, e => e.focus()); await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); await p.$eval(sel, e => { e.select && e.select(); }); await p.keyboard.press('Backspace'); if (val!=='' && val!==null) await p.type(sel, String(val)); };
  const has = async s => !!(await p.$(s));
  const seen=[];
  for (let i=0;i<60;i++) {
    const title = await p.$eval('#tourTitle', e=>e.textContent), part = await p.$eval('#tourPart', e=>e.textContent);
    const bodyText = await p.$eval('#tourBody', e=>e.innerText.replace(/\n+/g,' / '));
    seen.push(`${i}: [${part}] ${title}\n     ${bodyText.slice(0,420)}`);
    if (!pr.skipAll) {
      if (await has('#tourName')) { if (pr.name) await type('#tourName', pr.name); }
      if (title.startsWith('Currency')) { await p.evaluate(c => { const el=[...document.querySelectorAll('input[name=tourCur]')].find(x=>x.value===c); if (el) el.click(); }, pr.cur); }
      else if (await has('#tourPay')) await type('#tourPay', pr.pay);
      else if (await has('#tourExtra')) await type('#tourExtra', pr.extra||'');
      else if (await has('#tourBank')) await type('#tourBank', pr.bank);
      else if (await has('input[name=tourBill]')) {
        const ids = await p.$$eval('input[name=tourBill]', els => els.map(e=>[e.value,e.checked]));
        for (const [id,ck] of ids) { const want = pr.bills.includes(id); if (want!==ck) await p.click(`input[name=tourBill][value=${id}]`); }
      }
      else if (await has('#tourAmt')) {
        const t = title.toLowerCase(); const map={'rent':'rent','utilities':'util','food':'food','internet':'net','phone':'phone','transport':'gas'};
        const key = Object.keys(map).find(k=>t.includes(k)); const id=map[key];
        if (id && pr.amt[id]!==undefined) await type('#tourAmt', pr.amt[id]);
      }
      else if (await has('input[name=tourGoalPick]')) {
        const ids = await p.$$eval('input[name=tourGoalPick]', els => els.map(e=>[e.value,e.checked]));
        for (const [id,ck] of ids) { const want = pr.goals.includes(id); if (want!==ck) await p.click(`input[name=tourGoalPick][value=${id}]`); }
      }
      else if (await has('#tourGCost')) {
        const g=pr.g.travel; if (g) { await type('#tourGName', g.name); await type('#tourGCost', g.cost); if (await has('#tourGSaved')) await type('#tourGSaved', g.saved); }
      }
    }
    await w(250);
    await p.screenshot({ path: `${out}/${String(i+1).padStart(2,'0')}.png` });
    const nx = await p.$eval('#tourNext', e=>e.textContent);
    if (/View month|Go to bills|Open Home|Done/i.test(nx) && /Setup done/.test(title)) { await p.click('#tourNext'); await w(1000); break; }
    const dis = await p.$eval('#tourNext', e=>e.disabled);
    if (dis) { seen.push('NEXT DISABLED'); break; }
    await p.click('#tourNext'); await w(300);
  }
  require('fs').writeFileSync(out+'/state.json', await p.evaluate(()=>localStorage.getItem('money-map-template-v2')||''));
  console.log(seen.join('\n'));
  await p.screenshot({ path: `${out}/after-tour.png` });
  await p.screenshot({ path: `${out}/after-tour-full.png`, fullPage:true });
  console.log('errors:', JSON.stringify(errs));
  await b.close();
})();
