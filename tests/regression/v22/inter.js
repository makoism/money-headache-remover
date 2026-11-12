const { w, P, launch } = require('./lib.js');
(async () => {
  const [,, vw='390', vh='844', out='/tmp/v22/i'] = process.argv; require('fs').mkdirSync(out,{recursive:true});
  const { b, p, errs } = await launch(vw, vh, 'light');
  const pr = P.b; const log = (...a) => console.log(...a);
  const type = async (sel, val) => { await p.$eval(sel, e => e.focus()); await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); await p.$eval(sel, e => { e.select && e.select(); }); await p.keyboard.press('Backspace'); if (val!=='' && val!==null) await p.type(sel, String(val)); };
  const has = async s => !!(await p.$(s));
  const title = () => p.$eval('#tourTitle', e=>e.textContent);
  const next = async () => { await p.click('#tourNext'); await w(320); };
  const shot = async n => { await w(300); await p.screenshot({ path: `${out}/${n}.png` }); };
  await next(); // welcome -> currency
  await next(); await next(); // -> video -> pay
  await type('#tourPay', 3200); await next(); await type('#tourExtra', 400); await next(); await type('#tourBank', 2500); await next(); await next(); // floor
  log('at', await title());
  // bills pick: rent, util, subs, loan
  const ids = await p.$$eval('input[name=tourBill]', els => els.map(e=>[e.value,e.checked]));
  for (const [id,ck] of ids) { const want = ['rent','util','subs','loan'].includes(id); if (want!==ck) await p.click(`input[name=tourBill][value=${id}]`); }
  await next();
  await type('#tourAmt', 1500); await next(); await type('#tourAmt', 150); await next();
  log('at', await title());
  // subscriptions
  const chips = await p.$$('.tour-chips.subs label'); log('subs chips', chips.length);
  await chips[0].click(); await w(200); await chips[1].click(); await w(300);
  log('subs total after 2 ticks:', await p.$eval('#tourAmt', e=>e.value));
  await shot('subs'); await type('#tourAmt', 50);
  await next();
  log('at', await title());
  // loan
  const sw = await p.$('#tourBody .sw'); log('loan switch', !!sw);
  const m0 = await p.$eval('.loan-fields', e=>e.className);
  await p.click('#tourBody .sw'); await w(500);
  log('loan mode before/after:', m0, '->', await p.$eval('.loan-fields', e=>e.className), 'aria', await p.$eval('#tourBody .sw', e=>e.getAttribute('aria-checked')));
  await shot('loan-total');
  await p.click('#tourBody .sw'); await w(400);
  await type('#tourAmt', 250);
  // end date picker button
  const dpb = await p.$('#tourBody .dpb'); log('has dpb', !!dpb);
  if (dpb) { await p.evaluate(() => document.querySelector('#tourBody .dpb').scrollIntoView({block:'center'})); await w(300); await dpb.click(); await w(500); await shot('picker-open'); 
    const pop = await p.$eval('.dp', e=>({cls:e.className, w:e.getBoundingClientRect().width, l:e.getBoundingClientRect().left, t:e.getBoundingClientRect().top}));
    log('popover', JSON.stringify(pop));
    const items = await p.$$('.dp-mg button:not(:disabled), .dp-g button:not(:disabled)'); log('picker options', items.length);
    if (items.length) { await items[Math.min(6, items.length-1)].click(); await w(500); }
    log('picker closed:', !(await has('.dp')), 'button text:', await p.$eval('#tourBody .dpb .dpb-t', e=>e.textContent).catch(()=>'?'));
  }
  const go = async pre => { for (let k=0;k<8 && !(await title()).startsWith(pre); k++) await next(); };
  await go('Jar purposes');
  log('at', await title());
  const jar = await p.$('.shr-jar'); if (jar) { await p.evaluate(() => document.querySelector('.shr-jar').dispatchEvent(new MouseEvent('click', {bubbles:true}))); await w(250); log('shrine jar poked, class', await p.$eval('.shr-jar', e=>e.getAttribute('class'))); await shot('shrine'); }
  await go('Split the rest');
  log('at', await title());
  await shot('divide');
  log(await p.$eval('#tourBody', e => e.innerText.slice(0,400)));
  const pcts = await p.$$eval('.pctp input', els => els.map(e=>e.value)); log('percents before', JSON.stringify(pcts));
  await type('.pctp input', 12); await p.keyboard.press('Tab'); await w(600);
  log('percents after', JSON.stringify(await p.$$eval('.pctp input', els => els.map(e=>e.value))));
  await shot('split-edit');
  const bar = await p.$('#tourBody .rng'); if (bar) { const bb = await bar.boundingBox(); await p.mouse.click(bb.x + bb.width*0.5, bb.y + bb.height/2); await w(500); log('after rng click', JSON.stringify(await p.$$eval('.pctp input', els => els.map(e=>e.value)))); }
  await next();
  await b.close();
  console.log('errors', JSON.stringify(errs));
})();
