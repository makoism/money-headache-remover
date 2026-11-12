const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
(async () => {
  const b = await puppeteer.launch({ executablePath:'/usr/bin/google-chrome', headless:'new', args:['--no-sandbox','--disable-gpu'] });
  const p = await b.newPage(); const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file:///tmp/v31/old.html?sfxtest#2026-11', { waitUntil:'load' });
  const res = await p.evaluate(async () => {
    const out = {}, CLICK = { tap:1, on:1, off:1 }, wavs = {};
    for (const name of Object.keys(window.__sfx)) {
      const c = new OfflineAudioContext(1, 44100 * 2, 44100), master = c.createGain(); master.gain.value = .5;
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1500; lp.Q.value = .4;
      const comp = c.createDynamicsCompressor(); master.connect(lp); lp.connect(comp); comp.connect(c.destination);
      const bright = c.createGain(); bright.gain.value = .4; const lp2 = c.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = 5200; lp2.Q.value = .4; bright.connect(lp2); lp2.connect(comp);
      master.hi = bright; bright.hi = bright;
      window.__sfx[name](c, CLICK[name] ? bright : master, 0.005, 50);
      const buf = await c.startRendering(), d = buf.getChannelData(0);
      let peak = 0, sum = 0, n = 0, last = 0, nan = 0; for (let i = 0; i < d.length; i++) { const v = d[i]; if (Number.isNaN(v)) nan++; const a = Math.abs(v); if (a > peak) peak = a; if (a > 0.002) { last = i; sum += v * v; n++; } }
      out[name] = { peakDb: +(20 * Math.log10(peak || 1e-6)).toFixed(1), rmsDb: +(10 * Math.log10((sum / Math.max(1, n)) || 1e-12)).toFixed(1), endMs: Math.round(last / 44.1), nan };
      // 16-bit samples of the first 1.6 s, base64, for a spectrogram
      const N = Math.min(d.length, 44100 * 1.6), i16 = new Int16Array(N); for (let i = 0; i < N; i++) i16[i] = Math.max(-1, Math.min(1, d[i])) * 32767;
      let s = ''; const u8 = new Uint8Array(i16.buffer); for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); wavs[name] = btoa(s);
    }
    return { out, wavs };
  });
  for (const [k, v] of Object.entries(res.out)) console.log(k.padEnd(9), JSON.stringify(v));
  require('fs').writeFileSync('/tmp/v31/sfx_wavs_old.json', JSON.stringify(res.wavs));
  console.log('errors', JSON.stringify(errs)); await b.close();
})();
