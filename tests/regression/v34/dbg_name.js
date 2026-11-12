const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P } = require('/tmp/v22/lib.js');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844 });
  await p.goto('file:///home/claude/work/money-map-team.html?sfxtest#2026-11', { waitUntil: 'load' }); await w(800);
  // walk to the Trip step quickly
  for (let i = 0; i < 40; i++) {
    const t = await p.$eval('#tourTitle', e => e.textContent);
    if (t === 'Trip') break;
    if (t.startsWith('What are you saving') || t === 'Goals') { const ids = await p.$$eval('input[name=tourGoalPick]', els => els.map(e => [e.value, e.checked])); for (const [id, ck] of ids) { if ((id === 'travel') !== ck) await p.click(`input[name=tourGoalPick][value=${id}]`); } }
    if (await p.$eval('#tourNext', e => e.hidden)) { await p.evaluate(() => document.querySelector('#srcSkip').scrollIntoView({ block: 'center' })); await p.click('#srcSkip'); } else await p.click('#tourNext');
    await w(250);
  }
  console.log('at', await p.$eval('#tourTitle', e => e.textContent));
  const log = async tag => console.log(tag, JSON.stringify(await p.evaluate(() => ({ v: document.querySelector('#tourGName').value, active: document.activeElement && document.activeElement.id, selStart: document.querySelector('#tourGName').selectionStart, selEnd: document.querySelector('#tourGName').selectionEnd }))));
  await log('start');
  await p.$eval('#tourGName', e => { e.focus(); e.select && e.select(); }); await log('after select');
  await w(50); await log('50ms later');
  await p.keyboard.press('Backspace'); await log('after backspace');
  await b.close();
})();
