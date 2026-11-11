const { w, launch } = require('./lib.js');
(async () => {
  const { b, p } = await launch(390, 844, 'light');
  await p.click('#tourSkip'); await w(900); if (await p.evaluate(() => !!document.querySelector('#co') && !document.querySelector('#co').hidden)) { await p.click('#coSkip'); await w(300); }
  await p.evaluate(() => document.querySelector('[data-tab=basics]').click()); await w(500);
  await p.select('#curSel', '$'); await w(300);
  await p.evaluate(() => document.querySelector('[data-tab=goals]').click()); await w(900);
  console.log(await p.evaluate(() => ({ chart: document.querySelector('#chartbox').innerText.slice(0,120), svg: document.querySelectorAll('#chartbox svg').length, hidden: document.querySelector('#roadToggle').hidden })));
  await b.close();
})();
