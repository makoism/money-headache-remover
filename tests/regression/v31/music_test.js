const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w } = require('/tmp/v22/lib.js');
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) pass++; else fail++; console.log((c ? 'PASS ' : 'FAIL ') + n + (c ? '' : ' ' + JSON.stringify(x || ''))); };
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.setViewport({ width: 320, height: 700 });
  await p.goto((process.env.PAGE_URL || 'file:///home/claude/work/money-map-team.html') + '?sfxtest#2026-11', { waitUntil: 'load' }); await w(900);
  const playing = () => p.evaluate(() => window.__music.playing());
  ok('page open, music not yet started (no tap)', !(await playing()));
  const tools = await p.evaluate(() => { const r = document.querySelector('.tour-tools').getBoundingClientRect(), t = document.querySelector('#tourMus').textContent; const bs = [...document.querySelectorAll('.tour-tools button')].map(b => { const q = b.getBoundingClientRect(); return [b.textContent, Math.round(q.left), Math.round(q.right), Math.round(q.top)]; }); return { right: Math.round(r.right), tops: new Set(bs.map(x => x[3])).size, bs, t }; });
  ok('three links fit one row at 320 wide', tools.right <= 320 && tools.tops === 1, tools);
  await p.click('#tourNext'); await w(600);
  ok('the first tap starts the music', await playing());
  ok('music link says on', (await p.$eval('#tourMus', e => e.textContent + e.getAttribute('aria-pressed'))) === 'Music ontrue');
  await p.click('#tourMus'); await w(300);
  ok('Music off stops it and says so', !(await playing()) && (await p.$eval('#tourMus', e => e.textContent)) === 'Music off');
  await w(1500);
  ok('...and it is remembered', await p.evaluate(() => JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k => /money-map-template/.test(k)))).ui.music === false));
  await p.click('#tourMus'); await w(400);
  ok('Music on starts it again', await playing());
  await p.click('#tourSnd'); await w(300);
  ok('Sound off silences the music too', !(await playing()));
  await p.click('#tourSnd'); await w(400);
  ok('Sound on brings it back', await playing());
  await p.click('#tourSkip'); await w(500);
  ok('closing the setup keeps the music going (it plays in the app too)', await playing());
  // Settings switch
  await p.evaluate(() => document.querySelector('.tabs [data-tab=basics]').click()); await w(600);
  const row = await p.evaluate(() => { const s = document.querySelector('#setMus'); return s ? [s.getAttribute('aria-checked'), document.querySelector('#musTxt').textContent] : null; });
  ok('Settings has the Music switch, on', row && row[0] === 'true' && row[1] === 'On', row);
  await p.evaluate(() => document.querySelector('#setMus').scrollIntoView({ block: 'center' })); await p.click('#setMus'); await w(300);
  ok('Settings switch turns it off', (await p.$eval('#musTxt', e => e.textContent)) === 'Off');
  await p.click('#setMus'); await w(300);
  // reopen the setup from Help: music starts on a tap
  await p.evaluate(() => document.querySelector('#helpBtn').click()); await w(300); await p.click('#helpSetup'); await w(700);
  ok('the reopened setup still has it', await playing());
  // the hello video playing keeps the level at 0: go to the video screen and pretend the video plays (only where the video file exists)
  await p.click('#tourSkip'); await w(500);
  await p.evaluate(() => document.querySelector('#helpBtn').click()); await w(300); await p.click('#helpVideo'); await w(700);
  if (await p.evaluate(() => !!document.querySelector('#tourVid'))) {
    await p.evaluate(() => { const v = document.querySelector('#tourVid'); Object.defineProperty(v, 'paused', { value: false, configurable: true }); Object.defineProperty(v, 'ended', { value: false, configurable: true }); });
    await p.click('#tourTitle'); await w(700);
    ok('while the video plays the music level is 0', (await p.evaluate(() => window.__music.level())) === 0 && await playing());
    await p.evaluate(() => { const v = document.querySelector('#tourVid'); delete v.paused; delete v.ended; }); await w(600);
    ok('when the video stops the music comes back', (await p.evaluate(() => window.__music.level())) === 1);
  } else console.log('note: no video file next to this page (Drive card instead), the ducking check runs on the server copy');
  ok('no page errors', errs.length === 0, errs);
  console.log(`MUSIC: ${pass} pass, ${fail} fail`); await b.close();
})();
