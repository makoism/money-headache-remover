const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const w = ms => new Promise(r => setTimeout(r, ms));
let fails = 0, passes = 0;
const ok = (n, c) => { console.log(c ? 'PASS' : 'FAIL', n); c ? passes++ : (fails++, process.exitCode = 1); };
const ID = '1wsx3AotNISeoWiqpy-gHPOJ0VVexNiKO';
const DRIVE = 'https://drive.google.com/file/d/' + ID + '/view';
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--allow-file-access-from-files'] });
  const open = async (file, vw = 390, vh = 800) => {
    const p = await b.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
    await p.setViewport({ width: vw, height: vh });
    await p.evaluateOnNewDocument(() => { try { (localStorage.clear(), indexedDB.deleteDatabase('money-map-safe')); } catch (e) { /* none */ } });
    await p.goto('file:///tmp/play/' + file + '#2026-11', { waitUntil: 'load' }); await w(500);
    return p;
  };
  const toVideo = async p => { for (let i = 0; i < 3; i++) { await p.click('#tourNext'); await w(200); } await w(400); };
  const title = p => p.$eval('#tourTitle', e => e.textContent);
  const dots = p => p.$$eval('#tourDots i', e => e.length);

  /* ---- the player ---- */
  let p = await open('index.html'); await toVideo(p);
  ok('player: video screen is screen 4 of the welcome', (await title(p)) === 'A short hello before we start' && (await p.$eval('#tourPart', e => e.textContent)) === 'Welcome · 4 of 4' && (await dots(p)) === 14);
  ok('player: a video with a cover picture and a play button, no native controls yet', await p.$eval('#tourVid', v => v.getAttribute('poster') === 'hello.jpg' && v.hasAttribute('playsinline') && !v.controls) && (await p.$('#tourPlay')) !== null);
  ok('player: the video really loaded (about six minutes, 16:9)', await p.evaluate(async () => { const v = document.querySelector('#tourVid'); for (let i = 0; i < 40 && !(v.readyState >= 1); i++) await new Promise(r => setTimeout(r, 100)); return v.duration > 350 && v.duration < 360 && v.videoWidth / v.videoHeight > 1.7; }));
  ok('player: Chrome uses the sharper AV1 copy', await p.$eval('#tourVid', v => /hello-av1\.mp4$/.test(v.currentSrc)));
  ok('player: copy is the short note From Mako: and has no em dash', await p.$eval('#tourBody', e => /From Mako:/.test(e.textContent) && !/real person|six minutes/.test(e.textContent) && !e.textContent.includes('—')));
  ok('player: Drive link is there for when it does not play, opens a new tab', await p.$eval('#tourVideo', a => a.href === 'https://drive.google.com/file/d/1wsx3AotNISeoWiqpy-gHPOJ0VVexNiKO/view' && a.target === '_blank' && /noopener/.test(a.rel)));
  const speeds = await p.$$eval('#tourSpeed button', bs => bs.map(x => [x.textContent, x.getAttribute('aria-pressed')]));
  ok('player: speed choices 1x to 3x, 1x selected', JSON.stringify(speeds.map(s => s[0])) === JSON.stringify(['1x', '1.25x', '1.5x', '2x', '2.5x', '3x']) && speeds[0][1] === 'true' && speeds.slice(1).every(s => s[1] === 'false'));
  const r = await p.$eval('.tour-vframe', e => { const x = e.getBoundingClientRect(); return [x.width, x.height, x.right]; });
  ok('player: 16:9 and fits a 390 px phone', Math.abs(r[0] / r[1] - 16 / 9) < 0.05 && r[2] <= 390);
  const sp = await p.$eval('#tourSpeed', e => { const x = e.getBoundingClientRect(); return [x.left, x.right]; });
  ok('player: speed row fits the phone', sp[0] >= 0 && sp[1] <= 390);
  await p.click('#tourSpeed [data-rate="3"]'); await w(100);
  ok('player: choosing 3x sets the speed before playing', await p.$eval('#tourVid', v => v.playbackRate === 3) && (await p.$eval('#tourSpeed [data-rate="3"]', e => e.getAttribute('aria-pressed'))) === 'true' && (await p.$eval('#tourSpeed [data-rate="1"]', e => e.getAttribute('aria-pressed'))) === 'false');
  await p.click('#tourPlay'); await w(2200);
  const t3 = await p.$eval('#tourVid', v => ({ paused: v.paused, t: v.currentTime, rate: v.playbackRate, ctrl: v.controls }));
  ok('player: plays, shows native controls, button hides, keeps 3x', !t3.paused && t3.ctrl && t3.rate === 3 && (await p.$eval('#tourVF', e => e.classList.contains('playing'))) && (await p.$eval('#tourPlay', e => getComputedStyle(e).display)) === 'none');
  ok('player: at 3x it moves about three times faster than real time', t3.t > 3.2 && t3.t < 8.5);
  await p.click('#tourSpeed [data-rate="1.5"]'); await w(100);
  ok('player: speed can change while playing', await p.$eval('#tourVid', v => v.playbackRate === 1.5 && !v.paused));
  const handle = await p.$('#tourVid');
  await p.click('#tourNext'); await w(250);
  ok('player: Next stops the video', await handle.evaluate(v => v.paused) && (await title(p)) === 'Money is easier when you can see it');
  await p.click('#tourBack'); await w(300);
  ok('player: Back returns to the video, speed choice remembered', (await title(p)) === 'A short hello before we start' && await p.$eval('#tourVid', v => v.playbackRate === 1.5) && (await p.$eval('#tourSpeed [data-rate="1.5"]', e => e.getAttribute('aria-pressed'))) === 'true');
  await p.click('#tourPlay'); await w(600);
  const h2 = await p.$('#tourVid'); await p.click('#tourSkip'); await w(250);
  ok('player: closing the tour stops the video', await h2.evaluate(v => v.paused) && await p.$eval('#tour', e => e.hidden));
  /* Help button brings it back */
  await p.click('#helpBtn'); await w(150);
  ok('help: menu has "Watch the hello video"', await p.$eval('#helpVideo', e => !e.hidden && e.textContent === 'Watch the hello video'));
  await p.click('#helpVideo'); await w(400);
  ok('help: it opens the tour on the video screen', await p.$eval('#tour', e => !e.hidden) && (await title(p)) === 'A short hello before we start' && (await p.$('#tourVid')) !== null);
  await p.keyboard.press('Escape'); await w(250);
  ok('player: no page errors', p.errs.length === 0);
  await p.close();

  /* ---- player, but no Drive link ---- */
  p = await open('nolink.html'); await toVideo(p);
  ok('no Drive link: player still shows, without the link', (await title(p)) === 'A short hello before we start' && (await p.$('#tourVid')) !== null && (await p.$('#tourVideo')) === null && !(await p.$eval('#tourBody', e => e.textContent)).includes('Does not play'));
  ok('no Drive link: no page errors', p.errs.length === 0); await p.close();

  /* ---- the small copy cannot load: the Drive card takes over ---- */
  for (const f of ['hqonly_bad.html', 'badfile.html']) {
    p = await open(f); await toVideo(p); await w(300);
    ok(f + ': falls back to the Drive card, no broken player', (await p.$('#tourVid')) === null && (await p.$('.tour-video')) !== null && await p.$eval('#tourVideo', a => a.href === 'https://drive.google.com/file/d/1wsx3AotNISeoWiqpy-gHPOJ0VVexNiKO/view' && a.target === '_blank' && /noopener/.test(a.rel)) && (await p.$eval('.tour-video', e => e.textContent)).includes('Opens in a new tab'));
    ok(f + ': still screen 4, still 14 dots, Next and Back work', (await title(p)) === 'A short hello before we start' && (await dots(p)) === 14);
    await p.click('#tourNext'); await w(200); await p.click('#tourBack'); await w(250);
    ok(f + ': after Back it shows the card again', (await title(p)) === 'A short hello before we start' && (await p.$('.tour-video')) !== null);
    const cr = await p.$eval('.tour-video', e => { const x = e.getBoundingClientRect(); return [x.left, x.right, x.height]; });
    ok(f + ': card fits the phone and is a big enough tap target', cr[0] >= 0 && cr[1] <= 390 && cr[2] >= 44);
    ok(f + ': no page errors', p.errs.length === 0); await p.close();
  }
  /* ---- links only, no small copy ---- */
  for (const [f, href] of [['drive_only.html', DRIVE], ['loom.html', 'https://www.loom.com/share/abc123DEF']]) {
    p = await open(f); await toVideo(p);
    ok(f + ': card with the right link', (await title(p)) === 'A short hello before we start' && await p.$eval('#tourVideo', a => a.href) === href && (await p.$('iframe')) === null && (await p.$('video')) === null);
    ok(f + ': no page errors', p.errs.length === 0); await p.close();
  }
  /* ---- nothing valid: no video screen at all ---- */
  for (const f of ['bad1.html', 'bad2.html', 'none.html']) {
    p = await open(f); await toVideo(p);
    ok(f + ': no video screen, straight to the mindset, 13 dots', (await title(p)) === 'Money is easier when you can see it' && (await dots(p)) === 13 && (await p.$('#tourVideo')) === null);
    await p.click('#helpBtn').catch(() => {});
    ok(f + ': no help entry', await p.$eval('#helpVideo', e => e.hidden));
    ok(f + ': no page errors', p.errs.length === 0); await p.close();
  }

  /* ---- the sharper copy is missing: the standard copy takes over, the player stays ---- */
  p = await open('nohq.html'); await toVideo(p);
  await p.click('#tourSpeed [data-rate="2"]'); await w(100);
  await p.click('#tourPlay'); await w(2500);
  const nh = await p.$eval('#tourVid', v => ({ src: v.currentSrc, paused: v.paused, rate: v.playbackRate, t: v.currentTime }));
  ok('sharper copy missing: falls back to hello.mp4 and still plays', /hello\.mp4$/.test(nh.src) && !nh.paused && nh.t > 0.5);
  ok('sharper copy missing: keeps the chosen speed, no Drive card, no page errors', nh.rate === 2 && (await p.$('.tour-video')) === null && (await p.$('#tourVid')) !== null && p.errs.length === 0);
  await p.close();
  /* ---- a browser that cannot play AV1 goes straight to the standard copy ---- */
  p = await b.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); await p.setViewport({ width: 390, height: 800 });
  await p.evaluateOnNewDocument(() => { try { (localStorage.clear(), indexedDB.deleteDatabase('money-map-safe')); } catch (e) { /* none */ } const o = HTMLMediaElement.prototype.canPlayType; HTMLMediaElement.prototype.canPlayType = function (t) { return /av01/.test(t || '') ? '' : o.call(this, t); }; });
  await p.goto('file:///tmp/play/index.html#2026-11', { waitUntil: 'load' }); await w(500); await toVideo(p);
  await p.click('#tourPlay'); await w(1500);
  ok('no AV1 support: uses hello.mp4 straight away and plays', await p.$eval('#tourVid', v => /hello\.mp4$/.test(v.currentSrc) && !v.paused && v.currentTime > 0.3));
  ok('no AV1 support: no page errors', p.errs.length === 0); await p.close();
  await b.close();
  console.log(`video: ${passes} passed, ${fails} failed`);
})();
