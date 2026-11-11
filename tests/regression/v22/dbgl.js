const { w, launch } = require('./lib.js');
(async () => {
  const { b, p } = await launch(390, 844, 'light');
  await p.click('#tourSkip'); await w(900); if (await p.evaluate(() => !!document.querySelector('#co') && !document.querySelector('#co').hidden)) { await p.click('#coSkip'); await w(300); }
  await p.evaluate(() => document.querySelector('[data-tab=month]').click()); await w(800); 
  if (await p.evaluate(() => !!document.querySelector('#co') && !document.querySelector('#co').hidden)) { await p.click('#coSkip'); await w(300); }
  const all = await p.evaluate(() => [...document.body.children].filter(e => e.tagName !== 'SCRIPT').map(e => e.textContent).join(' '));
  for (const k of ['SSS, PhilHealth and Pag-IBIG','Commute, Grab, fuel','GCash, Maya','Grab','UITF']) console.log(k, all.includes(k));
  await b.close();
})();
