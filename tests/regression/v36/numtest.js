const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage();
  await p.setContent('<input id=a type=number step=any inputmode=decimal><input id=b type=number step=any lang="en-US">');
  console.log('lang', await p.evaluate(() => navigator.language));
  for (const s of ['1,200', '1.200', '1 200', '１２００', '1200円', '¥1200']) {
    await p.evaluate(() => { const a = document.querySelector('#a'); a.value = ''; a.focus(); });
    await p.type('#a', s);
    console.log(JSON.stringify(s), '->', await p.evaluate(() => { const a = document.querySelector('#a'); return [a.value, a.valueAsNumber, a.validity.badInput]; }));
  }
  await b.close();
})();
