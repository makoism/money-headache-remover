const { w, P, launch } = require('./lib.js');
(async () => {
  const { b, p, errs } = await launch(390, 844, 'light');
  const type = async (sel, val) => { await p.$eval(sel, e => { e.focus(); e.select && e.select(); }); await p.keyboard.press('Backspace'); if (val!=='' && val!==null) await p.type(sel, String(val)); };
  const next = async () => { await p.click('#tourNext'); await w(320); };
  await next(); await next(); await next(); await type('#tourPay', 3200); await next(); await next(); await next(); await next();
  const ids = await p.$$eval('input[name=tourBill]', els => els.map(e=>[e.value,e.checked]));
  for (const [id,ck] of ids) { const want = ['loan'].includes(id); if (want!==ck) await p.click(`input[name=tourBill][value=${id}]`); }
  await next();
  console.log(await p.$eval('#tourTitle', e=>e.textContent));
  const info = await p.evaluate(() => [...document.querySelectorAll('.dpb')].map(e => ({ cls: e.className, txt: e.textContent.trim(), vis: !!e.offsetParent, r: JSON.stringify(e.getBoundingClientRect()), forsel: e.previousElementSibling && e.previousElementSibling.tagName })));
  console.log(JSON.stringify(info, null, 1));
  const selInfo = await p.evaluate(() => [...document.querySelectorAll('#tourBody select, #tourBody input[type=date]')].map(e => ({ id: e.id, cls: e.className, tag: e.tagName, opts: e.options ? e.options.length : 0, first: e.options ? [...e.options].slice(0,3).map(o=>o.value) : null })));
  console.log(JSON.stringify(selInfo));
  await p.click('#tourBody .dpb'); await w(600);
  console.log(JSON.stringify(await p.evaluate(() => ({ dp: !!document.querySelector('.dp'), title: document.querySelector('#tourTitle')?.textContent, dpb: document.querySelectorAll('#tourBody .dpb').length, active: document.activeElement && document.activeElement.outerHTML.slice(0,120), bodyN: document.querySelector('#tourBody').children.length }))));
  await p.screenshot({ path: '/tmp/v22/dbg.png' });
  await b.close();
})();
