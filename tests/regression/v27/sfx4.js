const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
(async () => {
  const b = await puppeteer.launch({ executablePath:'/usr/bin/google-chrome', headless:'new', args:['--no-sandbox','--disable-gpu'] });
  const p = await b.newPage(); const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file:///home/claude/work/money-map-team.html?sfxtest#2026-11', { waitUntil:'load' });
  const res = await p.evaluate(async () => {
    const out = {}, CLICK = { tap:1, on:1, off:1 };
    for (const name of Object.keys(window.__sfx)) {
      const c = new OfflineAudioContext(1, 44100 * 2, 44100), master = c.createGain(); master.gain.value = .5;
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1500; lp.Q.value = .4;
      const comp = c.createDynamicsCompressor(); master.connect(lp); lp.connect(comp); comp.connect(c.destination);
      const bright = c.createGain(); bright.gain.value = .4; const lp2 = c.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = 5200; lp2.Q.value = .4; bright.connect(lp2); lp2.connect(comp);
      window.__sfx[name](c, CLICK[name] ? bright : master, 0.005, 50);
      const buf = await c.startRendering(), d = buf.getChannelData(0);
      let peak = 0, sum = 0, n = 0, last = 0, nan = 0; for (let i = 0; i < d.length; i++) { const v = d[i]; if (Number.isNaN(v)) nan++; const a = Math.abs(v); if (a > peak) peak = a; if (a > 0.002) { last = i; sum += v * v; n++; } }
      out[name] = { peakDb: +(20 * Math.log10(peak || 1e-6)).toFixed(1), rmsDb: +(10 * Math.log10((sum / Math.max(1, n)) || 1e-12)).toFixed(1), endMs: Math.round(last / 44.1), nan };
    }
    return out;
  });
  for (const [k, v] of Object.entries(res)) console.log(k.padEnd(9), JSON.stringify(v));
  console.log('errors', JSON.stringify(errs)); await b.close();
})();
