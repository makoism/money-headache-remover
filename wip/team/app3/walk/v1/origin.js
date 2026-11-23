const L = require('./lib.js'); const { home, w } = L;
(async () => {
  const c = await L.ctx(process.argv[2]); const p = c.pages()[0] || await c.newPage();
  await p.goto('file://' + process.cwd() + '/other/copy.html?today=2026-12-12'); await w(600);
  console.log('other path:', (await home(p)).slice(0, 150));
  console.log('origin', await p.evaluate(() => location.origin), await p.evaluate(async () => ({ persisted: await navigator.storage.persisted(), persist: await navigator.storage.persist(), est: await navigator.storage.estimate().then(e => e.usage) , secure: isSecureContext, subtle: !!(crypto.subtle)})));
  // opaque origin: the page inside a sandboxed iframe
  const p2 = await c.newPage(); const errs = []; p2.on('pageerror', e => errs.push(e.message));
  const html = require('fs').readFileSync('/home/user/money-headache-remover/wip/team/app3/index.html', 'utf8');
  await p2.setContent('<iframe id=f sandbox="allow-scripts allow-forms" style="width:390px;height:800px"></iframe>');
  await p2.$eval('#f', (f, h) => { f.srcdoc = h; }, html); await w(1000);
  const fr = p2.frames()[1];
  console.log('opaque first:', (await fr.evaluate(() => document.querySelector('#a3Home').innerText)).slice(0, 200));
  await fr.click('#a3SetupGo'); await w(200);
  await fr.fill('#s3Bank', '100000'); await fr.fill('#s3PayAmt', '200000'); await fr.click('#a3SetupSave'); await w(800);
  console.log('opaque after save:', await fr.evaluate(() => document.querySelector('#a3SetupErr') && document.querySelector('#a3SetupErr').textContent), (await fr.evaluate(() => document.querySelector('#a3Home').innerText)).slice(0, 200));
  console.log(errs);
  await c.close();
})().catch(e => { console.log('CRASH', e); process.exit(1); });
