// Walk the setup and every tab as a new person (Aiko, a trip goal) and dump the words on each screen.
const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
const fs = require('fs');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await p.goto('http://127.0.0.1:8788/?sfxtest#2026-11', { waitUntil: 'load' }); await w(800);
  const out = [];
  const txt = async sel => (await p.$eval(sel, e => e.innerText)).replace(/\n{2,}/g, '\n');
  let n = 0;
  await runTour(p, P.a, async i => {
    const t = await txt('#tour');
    out.push(`\n===== SETUP ${i}: ${await p.$eval('#tourTitle', e => e.textContent)} =====\n${t}`);
    await p.screenshot({ path: `/tmp/v34/t${String(n++).padStart(2, '0')}.png` });
  });
  await w(1500);
  out.push(`\n===== HOME (fresh) =====\n${await txt('#p-home')}`);
  await p.screenshot({ path: '/tmp/v34/home0.png', fullPage: true });
  // log one receipt
  await p.type('#hAmt', '1200'); await p.evaluate(() => document.querySelector('#hForm').requestSubmit()); await w(1200);
  out.push(`\n===== HOME (after one receipt) =====\n${await txt('#p-home')}`);
  out.push(`\n== cheer: ${await p.$eval('#cheer', e => e.textContent)}`);
  await p.evaluate(() => { document.querySelector('#hMore').open = true; }); await w(200);
  out.push(`\n===== HOME more (streak, badges, pages) =====\n${await txt('#hMore')}`);
  for (const t of ['receipts', 'goals', 'month', 'months', 'basics']) {
    await p.evaluate(t => (document.querySelector(`[data-tab="${t}"]`) || document.querySelector(`[data-tab-go="${t}"]`)).click(), t); await w(600);
    const pane = `#p-${t}`;
    const sel = pane;
    out.push(`\n===== TAB ${t} =====\n${await txt(sel)}`);
    await p.screenshot({ path: `/tmp/v34/tab_${t}.png`, fullPage: true });
  }
  // help menu and ask panel
  await p.evaluate(() => document.querySelector('[data-tab="home"]').click()); await w(300);
  await p.click('#helpBtn').catch(() => {}); await w(300);
  const hm = await p.$('.help-menu'); if (hm) out.push(`\n===== HELP MENU =====\n${await p.$eval('.help-menu', e => e.innerText)}`);
  fs.writeFileSync('/tmp/v34/walk.txt', out.join('\n'));
  console.log('steps', n, 'chars', out.join('\n').length);
  await b.close();
})();
