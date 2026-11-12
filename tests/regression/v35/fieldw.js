const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w } = require('/tmp/v22/lib.js');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844 });
  await p.goto('file:///home/claude/work/money-map-team.html?sfxtest#2026-11', { waitUntil: 'load' }); await w(800);
  for (let i = 0; i < 40; i++) {
    const t = await p.$eval('#tourTitle', e => e.textContent);
    const f = await p.evaluate(() => { const f = document.querySelector('.tour-fields'); if (!f) return null; const r = f.getBoundingClientRect(); return { w: Math.round(r.width), parent: f.parentElement.className, pw: Math.round(f.parentElement.getBoundingClientRect().width), disp: getComputedStyle(f.parentElement).display, ai: getComputedStyle(f.parentElement).alignItems, tag: f.parentElement.tagName }; });
    if (f) console.log(t, JSON.stringify(f));
    if (/Setup done/.test(t)) break;
    if (t === 'Monthly bills') { const ids = await p.$$eval('input[name=tourBill]', els => els.map(e => [e.value, e.checked])); for (const [id, ck] of ids) if (!ck && ['rent', 'util', 'food', 'net', 'phone', 'transport'].includes(id)) await p.click(`input[name=tourBill][value=${id}]`); }
    if (await p.$eval('#tourNext', e => e.hidden)) { await p.evaluate(() => document.querySelector('#srcSkip').scrollIntoView({ block: 'center' })); await p.click('#srcSkip'); } else await p.click('#tourNext');
    await w(250);
  }
  await b.close();
})();
