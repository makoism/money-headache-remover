const L = require('./lib.js'); const { go, home, w } = L;
(async () => {
  const c = await L.ctx(process.argv[2]); const p = c.pages()[0] || await c.newPage();
  const show = async t => console.log('\n## ' + t + '\n' + (await home(p)));
  await go(p, '2026-12-10');
  let r = await L.checkin(p, 438400, {}, ['Card A']); console.log(r.list.map(x => x.text).join(' / '), r.err);
  await show('10 Dec, card A unticked (not posted yet)');
  await go(p, '2026-12-14');
  await p.click('#a3CheckGo'); await w(300);
  console.log('14 Dec list:', await p.$eval('#a3Check', e => e.innerText.replace(/\n+/g, ' | ')));
  await p.click('#a3CheckX');
  r = await L.checkin(p, 375400, { 'Card B': 23000 }); 
  await show('14 Dec after check, card A really left 40,000 on 11 Dec, card B 23,000');
  await c.close();
})().catch(e => { console.log('CRASH', e); process.exit(1); });
