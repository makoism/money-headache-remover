const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
exports.w = ms => new Promise(r => setTimeout(r, ms));
exports.P = {
  a: { name:'Aiko', cur:'¥', pay:280000, extra:0, bank:350000, bills:['rent','util','food','net','phone','gas','subs'], amt:{rent:85000,util:12000,food:45000,net:5000,phone:6000,gas:10000,subs:3000}, goals:['travel'], g:{travel:{name:'Japan trip',cost:300000,saved:50000}} },
  b: { name:'', cur:'$', pay:3200, extra:400, bank:2500, bills:['rent','util','food','net','phone','gas','loan','card'], amt:{rent:1500,util:150,food:450,net:60,phone:40,gas:120,loan:250,card:200}, goals:['moving','buy'], g:{moving:{name:'Deposit',cost:6000,saved:500},buy:{name:'Laptop',cost:1500,saved:0}} },
};
exports.launch = async (vw, vh, scheme='light', reduce=false) => {
  const b = await puppeteer.launch({ executablePath:'/usr/bin/google-chrome', headless:'new', args:['--no-sandbox','--disable-gpu'] });
  const p = await b.newPage(); const errs=[];
  p.on('pageerror', e => errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' | ')));
  p.on('console', m => { if (m.type()==='error' && !/ERR_FILE_NOT_FOUND|ERR_TUNNEL_CONNECTION_FAILED|ERR_NAME_NOT_RESOLVED|ERR_INTERNET_DISCONNECTED|ERR_CONNECTION_REFUSED/.test(m.text())) errs.push('console: '+m.text()); });
  await p.setViewport({ width:+vw, height:+vh });
  const feats=[{name:'prefers-color-scheme', value:scheme}]; if (reduce) feats.push({name:'prefers-reduced-motion', value:'reduce'});
  await p.emulateMediaFeatures(feats);
  await p.evaluateOnNewDocument(() => { try { if (!sessionStorage.getItem('__keep')) localStorage.clear(); indexedDB.deleteDatabase('money-map-safe'); } catch(e){} });
  await p.goto('file://' + (process.env.PAGE || '/home/claude/work/money-map-team.html') + '#2026-11', { waitUntil:'load' }); await exports.w(700);
  return { b, p, errs };
};
exports.runTour = async (p, pr, shot) => {
  const w = exports.w;
  const type = async (sel, val) => { await p.$eval(sel, e => { e.focus(); e.select && e.select(); }); await p.keyboard.press('Backspace'); if (val!=='' && val!==null) await p.type(sel, String(val)); };
  const has = async s => !!(await p.$(s)); const seen=[], probs=[];
  for (let i=0;i<60;i++) {
    const title = await p.$eval('#tourTitle', e=>e.textContent), part = await p.$eval('#tourPart', e=>e.textContent);
    seen.push(i+': '+part+' | '+title);
    if (title==='Welcome') { if (pr.name) await type('#tourName', pr.name); }
    else if (title.startsWith('Currency')) { await p.evaluate(c => { const el=[...document.querySelectorAll('input[name=tourCur]')].find(x=>x.value===c); if (el) el.click(); else { const s=document.querySelector('#tourCurMore'); s.value=c; s.dispatchEvent(new Event('change',{bubbles:true})); } }, pr.cur); }
    else if (await has('#tourPay')) await type('#tourPay', pr.pay);
    else if (await has('#tourExtra')) await type('#tourExtra', pr.extra||'');
    else if (await has('#tourBank')) await type('#tourBank', pr.bank);
    else if (title.startsWith('Which of these')) {
      const ids = await p.$$eval('input[name=tourBill]', els => els.map(e=>[e.value,e.checked]));
      for (const [id,ck] of ids) { const want = pr.bills.includes(id); if (want!==ck) await p.click(`input[name=tourBill][value=${id}]`); }
    }
    else if (await has('#tourCardT')) { const a = pr.amt.card; if (a !== undefined) await type('#tourCardT', a); }
    else if (await has('#subsAddO')) { const a = pr.amt.subs; if (a) { if (!(await has('#soN0'))) { await p.click('#subsAddO'); await w(120); } await p.type('#soN0', 'Streaming'); await type('#soA0', a); } }
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
    await w(200);
    const ov = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
    if (ov.sw > ov.iw + 1) probs.push(`h-overflow at step ${i} (${title}): ${ov.sw}>${ov.iw}`);
    if (shot) await shot(i);
    const nx = await p.$eval('#tourNext', e=>e.textContent);
    if (nx==='View month' || nx==='Go to bills') { await p.click('#tourNext'); await w(900); break; }
    if (await p.$eval('#tourNext', e=>e.disabled)) { probs.push(`Next disabled at step ${i} (${title})`); break; }
    await p.click('#tourNext'); await w(260);
  }
  return { seen, probs };
};
