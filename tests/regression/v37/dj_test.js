const L = require('/tmp/v22/lib.js'); const { w } = L;
let pass = 0, fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); c ? pass++ : fail++; };
const st = p => p.evaluate(() => JSON.parse(localStorage.getItem('money-map-template-v2') || '{}').ui || {});
(async () => {
  const { b, p, errs } = await L.launch(1280, 820, 'dark');
  await p.evaluate(() => document.querySelector('#tourSkip').click()); await w(500);
  ok(await p.evaluate(() => !!document.querySelector('#scene') && document.body.classList.contains('scene-on')), 'the scenery canvas is behind the page');
  ok(/^\d+$/.test(await p.$eval('#topStreak b', e => e.textContent)), 'the streak leaf and number sit by the title: ' + await p.$eval('#topStreak', e => e.textContent));
  const tb = await p.evaluate(() => { const s = document.querySelector('#topStreak').getBoundingClientRect(), h = document.querySelector('.top h1').getBoundingClientRect(); return s.right <= h.left + 1 && Math.abs((s.top + s.bottom) / 2 - (h.top + h.bottom) / 2) < 14; });
  ok(tb, 'the streak is to the left of the title, centred with it');
  // one-tap mute
  await p.click('#sndBtn'); await w(700);
  ok((await st(p)).mute === true && (await p.$eval('#sndBtn', e => e.getAttribute('aria-pressed'))) === 'true', 'the speaker button mutes in one tap');
  await p.click('#sndBtn'); await w(700);
  ok(!(await st(p)).mute, 'and turns sound back on');
  // the panel
  await p.click('#djBtn'); await w(300);
  ok(await p.evaluate(() => !document.querySelector('#dj').hidden), 'the music button opens the panel');
  await p.screenshot({ path: '/tmp/v37/dj-panel.png' });
  await p.evaluate(() => { const r = document.querySelector('#djVol'); r.value = 30; r.dispatchEvent(new Event('input', { bubbles: true })); }); await w(700);
  ok((await st(p)).vol === 30 && (await p.$eval('#djVolN', e => e.textContent)) === '30', 'the volume slider sets and saves the volume');
  await p.click('[data-djsrc="off"]'); await w(600);
  ok((await st(p)).music === false, 'Off turns the music off');
  await p.click('[data-djsrc="forest"]'); await w(600);
  ok((await st(p)).music === undefined && (!(await st(p)).dj || (await st(p)).dj.src === 'forest'), 'Forest brings the made-here music back');
  await p.click('[data-djsrc="green"]'); await w(2500);
  const g = await p.evaluate(() => ({ list: document.querySelectorAll('.dj-list button').length, src: (JSON.parse(localStorage.getItem('money-map-template-v2')).ui.dj || {}).src, dock: !document.querySelector('#djDock').hidden, dockTxt: document.querySelector('#djDockT').textContent }));
  const note = await p.$eval('#djNote', e => e.textContent);
  ok(g.list === 8 || (g.src === 'forest' && /could not load/.test(note)), `GREEN shows its 8 tracks, or (offline here) falls back to Forest and says why: ${JSON.stringify(g)} ${note}`);
  await p.keyboard.press('Escape'); await w(200);
  ok(await p.evaluate(() => document.querySelector('#dj').hidden), 'Escape closes the panel');
  // scenery switch
  await p.click('#djBtn'); await w(300); await p.click('#djScene'); await w(900);
  ok(await p.evaluate(() => !document.querySelector('#scene')) && (await st(p)).scene === false, 'the scenery can be switched off');
  await p.click('#djScene'); await w(400);
  ok(await p.evaluate(() => !!document.querySelector('#scene')), 'and on again');
  // reload keeps the choices
  await w(800); await p.evaluate(() => sessionStorage.setItem('__keep', '1')); await p.reload({ waitUntil: 'load' }); await w(1500);
  ok((await st(p)).vol === 30, 'the volume survives a reload');
  // the setup's Sound button and Settings agree with the top bar
  await p.click('#sndBtn'); await w(500);
  await p.evaluate(() => document.querySelector('#gearBtn').click()); await w(300);
  ok((await p.$eval('#setSnd', e => e.getAttribute('aria-checked'))) === 'false', 'Settings shows Sound off after the top-bar mute');
  /* with a stand-in for YouTube's player that loads: the dock with the player is visible while GREEN is the source */
  await p.evaluate(() => { window.YT = { Player: function (id, o) { const el = document.getElementById(id); const f = document.createElement('iframe'); f.id = id; el.replaceWith(f); this.setVolume = () => {}; this.mute = () => {}; this.unMute = () => {}; this.playVideo = () => o.events.onStateChange({ data: 1 }); this.pauseVideo = () => o.events.onStateChange({ data: 2 }); this.loadVideoById = () => o.events.onStateChange({ data: 1 }); this.cueVideoById = () => {}; setTimeout(() => o.events.onReady(), 50); } }; });
  await p.click('#sndBtn'); await w(400);
  await p.click('#djBtn'); await w(300); await p.click('[data-djsrc="green"]'); await w(900);
  const d = await p.evaluate(() => ({ dock: !document.querySelector('#djDock').hidden, frame: !!document.querySelector('#djDock iframe'), vis: (() => { const r = document.querySelector('#djDock').getBoundingClientRect(); return r.width >= 200 && r.height >= 200; })(), label: document.querySelector('#djDockPlay').getAttribute('aria-label') }));
  ok(d.dock && d.frame && d.vis && d.label === 'Pause', 'GREEN: the player dock is visible (at least 200 by 200) and playing: ' + JSON.stringify(d));
  await p.click('[data-djstep="1"]'); await w(300);
  ok((await p.$eval('#djDockT b', e => e.textContent)) === 'FEEL', 'Next goes to the second track');
  await p.click('#djDockHide'); await w(300);
  ok(await p.evaluate(() => document.querySelector('#djDock').hidden), 'closing the dock stops and hides it');
  await p.click('#djBtn'); await w(300); await p.click('[data-djsrc="forest"]'); await w(400);
  ok(await p.evaluate(() => document.querySelector('#djDock').hidden), 'back to Forest, no dock');
  ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs));
  console.log(`\nDJ: ${pass} pass, ${fail} fail`); if (fail) process.exitCode = 1;
  await b.close();
})();
