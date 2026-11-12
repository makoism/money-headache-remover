const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w } = require('/tmp/v22/lib.js');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  for (const [wd, tag, light] of [[390, 'ph', false], [1280, 'lap', false], [390, 'phday', true]]) {
    const ctx = await b.createBrowserContext(); const p = await ctx.newPage(); await p.setViewport({ width: wd, height: wd < 600 ? 844 : 820, deviceScaleFactor: wd < 600 ? 2 : 1 });
    if (light) await p.evaluateOnNewDocument(() => { try { localStorage.setItem('mhr-theme', 'light'); } catch (e) {} });
    await p.goto('http://127.0.0.1:8788/?sfxtest#2026-12', { waitUntil: 'load' }); await w(1200);
    if (light) { await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'light')); await w(300); }
    await p.screenshot({ path: `/tmp/v35/v_${tag}.png` });
    await ctx.close();
  }
  await b.close();
})();
