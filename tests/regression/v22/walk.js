const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const w = ms => new Promise(r => setTimeout(r, ms));
const [,, persona='a', vw='390', vh='844', out='/tmp/v22/a', scheme='light'] = process.argv;
const P = {
  a: { name:'Aiko', cur:'¥', pay:280000, extra:0, bank:350000, bills:['rent','util','food','net','phone','gas','subs'], amt:{rent:85000,util:12000,food:45000,net:5000,phone:6000,gas:10000,subs:3000}, goals:['travel'], g:{travel:{name:'Japan trip',cost:300000,saved:50000}} },
  b: { name:'', cur:'$', pay:3200, extra:400, bank:2500, bills:['rent','util','food','net','phone','gas','loan','card'], amt:{rent:1500,util:150,food:450,net:60,phone:40,gas:120,loan:250,card:200}, goals:['moving','buy'], g:{moving:{name:'Deposit',cost:6000,saved:500},buy:{name:'Laptop',cost:1500,saved:0}} },
};
(async () => {
  const pr = P[persona]; require('fs').mkdirSync(out,{recursive:true});
  const b = await puppeteer.launch({ executablePath:'/usr/bin/google-chrome', headless:'new', args:['--no-sandbox','--disable-gpu'] });
  const p = await b.newPage(); const errs=[];
  p.on('pageerror', e => errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' | ')));
  p.on('console', m => { if (m.type()==='error' && !/ERR_FILE_NOT_FOUND|ERR_TUNNEL_CONNECTION_FAILED|ERR_NAME_NOT_RESOLVED|ERR_CONNECTION_REFUSED/.test(m.text())) errs.push('console: '+m.text()); });
  await p.setViewport({ width:+vw, height:+vh });
  await p.emulateMediaFeatures([{name:'prefers-color-scheme', value:scheme}]);
  await p.evaluateOnNewDocument(() => { try { (localStorage.clear(), indexedDB.deleteDatabase('money-map-safe')); } catch(e){} });
  await p.goto('file:///home/claude/work/money-map-team.html#2026-11', { waitUntil:'load' }); await w(800);
  const type = async (sel, val) => { await p.$eval(sel, e => e.focus()); await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); await p.$eval(sel, e => { e.select && e.select(); }); await p.keyboard.press('Backspace'); if (val!=='' && val!==null) await p.type(sel, String(val)); };
  const has = async s => !!(await p.$(s));
  const seen=[]; const probs=[];
  for (let i=0;i<60;i++) {
    const title = await p.$eval('#tourTitle', e=>e.textContent), part = await p.$eval('#tourPart', e=>e.textContent);
    seen.push(i+': '+part+' | '+title);
    if (await has('#tourName')) { if (pr.name) await type('#tourName', pr.name); }
    if (title.startsWith('Currency')) { await p.evaluate(c => { const el=[...document.querySelectorAll('input[name=tourCur]')].find(x=>x.value===c); if (el) el.click(); else { const s=document.querySelector('#tourCurMore'); s.value=c; s.dispatchEvent(new Event('change',{bubbles:true})); } }, pr.cur); }
    else if (await has('#tourPay')) await type('#tourPay', pr.pay);
    else if (await has('#tourExtra')) await type('#tourExtra', pr.extra||'');
    else if (await has('#tourBank')) await type('#tourBank', pr.bank);
    else if (title.startsWith('Which of these')) {
      const ids = await p.$$eval('input[name=tourBill]', els => els.map(e=>[e.value,e.checked]));
      for (const [id,ck] of ids) { const want = pr.bills.includes(id); if (want!==ck) await p.click(`input[name=tourBill][value=${id}]`); }
    }
    else if (await has('#tourAmt')) {
      const t = title.toLowerCase(); const map={rent:'rent',utilities:'util',food:'food',internet:'net',phone:'phone',insurance:'ins',subscriptions:'subs','getting around':'gas',loan:'loan','credit card':'card'};
      const key = Object.keys(map).find(k=>t.includes(k)); const id=map[key];
      if (id && pr.amt[id]!==undefined) await type('#tourAmt', pr.amt[id]);
    }
    else if (title.startsWith('What are you saving')) {
      const ids = await p.$$eval('input[name=tourGoalPick]', els => els.map(e=>[e.value,e.checked]));
      for (const [id,ck] of ids) { const want = pr.goals.includes(id); if (want!==ck) await p.click(`input[name=tourGoalPick][value=${id}]`); }
    }
    else if (await has('#tourGCost')) {
      const k = title.includes('trip')?'travel':title.includes('move')?'moving':title.includes('purchase')?'buy':null; const g=pr.g[k];
      if (g) { await type('#tourGName', g.name); await type('#tourGCost', g.cost); if (await has('#tourGSaved')) await type('#tourGSaved', g.saved); }
    }
    await w(220);
    const ov = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
    if (ov.sw > ov.iw + 1) probs.push(`h-overflow at step ${i} (${title}): ${ov.sw}>${ov.iw}`);
    await p.screenshot({ path: `${out}/${String(i).padStart(2,'0')}.png` });
    const nx = await p.$eval('#tourNext', e=>e.textContent);
    if (nx==='View month' || nx==='Done' || nx==='Go to bills') { await p.click('#tourNext'); await w(900); break; }
    if (await p.$eval('#tourNext', e=>e.hidden)) { await p.evaluate(() => document.querySelector('#srcSkip').scrollIntoView({ block: 'center' })); await p.click('#srcSkip'); await w(300); continue; }
    const dis = await p.$eval('#tourNext', e=>e.disabled);
    if (dis) { probs.push(`Next disabled at step ${i} (${title})`); break; }
    await p.click('#tourNext'); await w(300);
  }
  console.log(seen.join('\n'));
  await p.screenshot({ path: `${out}/after-tour.png` });
  const st = await p.evaluate(() => ({ tab: document.querySelector('.tabs [aria-selected=true]')?.textContent, coach: !!document.querySelector('#co'), tourHidden: document.querySelector('#tour').hidden }));
  console.log(JSON.stringify(st)); console.log('problems:', JSON.stringify(probs)); console.log('errors:', JSON.stringify(errs));
  await b.close();
})();
