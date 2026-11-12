const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
(async () => {
  const b = await puppeteer.launch({ executablePath:'/usr/bin/google-chrome', headless:'new', args:['--no-sandbox','--disable-gpu'] });
  const p = await b.newPage(); const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file:///home/claude/work/money-map-team.html?sfxtest#2026-11', { waitUntil:'load' });
  const secs = +(process.argv[2] || 40);
  const res = await p.evaluate(async (secs) => {
    const sr = 22050, c = new OfflineAudioContext(1, sr * secs, sr);
    window.__music.render(c, c.destination, secs);
    const buf = await c.startRendering(), d = buf.getChannelData(0);
    let peak = 0, sum = 0; const env = []; const win = sr; for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > peak) peak = a; sum += d[i]*d[i]; if (i % win === win - 1) { env.push(+(10*Math.log10(sum/win)).toFixed(1)); sum = 0; } }
    const N = d.length, i16 = new Int16Array(N); for (let i = 0; i < N; i++) i16[i] = Math.max(-1, Math.min(1, d[i])) * 32767;
    let s = ''; const u8 = new Uint8Array(i16.buffer); for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return { peakDb: +(20*Math.log10(peak||1e-6)).toFixed(1), envDb: env, wav: btoa(s) };
  }, secs);
  console.log('peak', res.peakDb, 'per-second rms dB', res.envDb.join(' '));
  require('fs').writeFileSync('/tmp/v31/music.json', JSON.stringify({ wav: res.wav, sr: 22050 }));
  console.log('errors', JSON.stringify(errs)); await b.close();
})();
