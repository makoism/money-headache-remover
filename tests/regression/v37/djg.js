const L = require('/tmp/v22/lib.js'); const { w } = L;
(async () => { const { b, p } = await L.launch(390, 800, 'dark');
 await p.evaluate(() => document.querySelector('#tourSkip').click()); await w(500);
 await p.evaluate(() => { window.YT = { Player: function (id, o) { const el = document.getElementById(id); const f = document.createElement('iframe'); f.id = id; el.replaceWith(f); this.setVolume = () => {}; this.mute = () => {}; this.unMute = () => {}; this.playVideo = () => o.events.onStateChange({ data: 1 }); this.pauseVideo = () => o.events.onStateChange({ data: 2 }); this.loadVideoById = () => o.events.onStateChange({ data: 1 }); this.cueVideoById = () => {}; setTimeout(() => o.events.onReady(), 10); }, }; });
 await p.click('#djBtn'); await w(300); await p.click('[data-djsrc="green"]'); await w(900);
 console.log(JSON.stringify(await p.evaluate(() => { const c = document.querySelector('.dj-ctl'), g = getComputedStyle(c), big = getComputedStyle(document.querySelector('.dj-i.big')); return [g.display, g.alignItems, g.padding, big.marginTop, big.alignSelf, big.position, big.top, big.transform]; })));
 console.log(JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('.dj-ctl .dj-i')].map(e => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; }))));
 await p.screenshot({ path: '/tmp/v37/dj-m.png' }); await b.close(); })();
