const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
(async () => {
  const b = await puppeteer.launch({ executablePath:'/usr/bin/google-chrome', headless:'new', args:['--no-sandbox','--disable-gpu'] });
  const p = await b.newPage(); const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file:///home/claude/work/money-map-team.html?sfxtest#2026-11', { waitUntil:'load' });
  const res = await p.evaluate(async () => {
    const out = {};
    for (const name of Object.keys(window.__sfx)) {
      try {
        const c = new OfflineAudioContext(1, 44100 * 2, 44100), g = c.createGain(); g.connect(c.destination);
        window.__sfx[name](c, g, 0.005, 50);
        const buf = await c.startRendering(), d = buf.getChannelData(0);
        let peak = 0, nan = 0, last = 0; for (let i = 0; i < d.length; i++) { const v = d[i]; if (Number.isNaN(v)) nan++; const a = Math.abs(v); if (a > peak) peak = a; if (a > 0.003) last = i; }
        out[name] = { peak: +peak.toFixed(3), nan, endMs: Math.round(last / 44.1) };
      } catch (e) { out[name] = { error: String(e) }; }
    }
    return out;
  });
  let bad = 0;
  for (const [k, v] of Object.entries(res)) { const flag = v.error || v.nan || v.peak < 0.008 || v.peak > 0.98 ? 'CHECK' : 'ok'; if (flag === 'CHECK') bad++; console.log(k.padEnd(9), JSON.stringify(v), flag); }
  console.log('bad:', bad, 'errors:', JSON.stringify(errs));
  await b.close();
})();
