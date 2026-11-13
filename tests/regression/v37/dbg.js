const L = require('/tmp/v22/lib.js'); const { w } = L;
(async () => { const { b, p } = await L.launch(390, 844, 'dark'); await p.evaluate(() => document.querySelector('#tourSkip').click()); await w(700);
  console.log(await p.evaluate(async () => { window.scrollTo({ top: 1e6, behavior: 'instant' }); await new Promise(r => setTimeout(r, 400)); const s = Array.from(document.querySelectorAll('#p-home section:not([hidden])')).map(e => e.id + ':' + Math.round(e.getBoundingClientRect().bottom) + ':' + getComputedStyle(e).display); return { y: scrollY, h: document.documentElement.scrollHeight, s, foot: Math.round(document.querySelector('.wrap').getBoundingClientRect().bottom) }; }));
  await b.close(); })();
