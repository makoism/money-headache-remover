const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
const DIR = '/tmp/v35/shots/';
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  // 1. the real video page, phone and laptop (served build has the video files)
  for (const [wd, tag] of []) {
    const p = await b.newPage(); await p.setViewport({ width: wd, height: wd < 600 ? 844 : 820, deviceScaleFactor: wd < 600 ? 2 : 1 });
    await p.goto('http://127.0.0.1:8788/?sfxtest#2026-12', { waitUntil: 'load' }); await w(1500);
    await p.screenshot({ path: `${DIR}${tag}_video_real.png` });
    await p.close();
  }
  // 2. the Day look on laptop and phone
  for (const [wd, tag] of [[1280, 'lapday'], [390, 'phday']]) {
    const ctx = await b.createBrowserContext(); const p = await ctx.newPage(); await p.setViewport({ width: wd, height: wd < 600 ? 844 : 820, deviceScaleFactor: wd < 600 ? 2 : 1 });
    await p.goto('http://127.0.0.1:8788/?sfxtest#2026-12', { waitUntil: 'load' }); await w(800);
    await runTour(p, P.a, async () => { const t = await p.$eval('#tourTitle', e => e.textContent); if (t === 'Trip' && await p.$('#tourGWhy')) await p.type('#tourGWhy', 'A week in Hokkaido with Mum'); });
    await w(1500);
    for (let i = 0; i < 12; i++) { const vis = await p.evaluate(() => { const c = document.querySelector('#co'); return !!c && !c.hidden && c.getBoundingClientRect().width > 0; }); if (!vis) break; await p.click('#coN').catch(() => {}); await w(150); }
    const tab = t => p.evaluate(t => (document.querySelector(`[data-tab="${t}"]`) || document.querySelector(`[data-tab-go="${t}"]`)).click(), t);
    await tab('basics'); await w(400);
    await p.click('[data-theme-set="light"]'); await w(500);
    console.log(tag, 'theme attr', await p.evaluate(() => document.documentElement.getAttribute('data-theme') || document.documentElement.className));
    await p.evaluate(() => window.scrollTo(0, 0)); await p.screenshot({ path: `${DIR}${tag}_settings.png`, fullPage: true });
    await tab('home'); await w(500); await p.evaluate(() => { document.querySelector('#hMore').open = true; window.scrollTo(0, 0); }); await w(200); await p.screenshot({ path: `${DIR}${tag}_home.png`, fullPage: true });
    await tab('receipts'); await w(500); await p.evaluate(() => window.scrollTo(0, 0)); await p.screenshot({ path: `${DIR}${tag}_receipts.png`, fullPage: true });
    await tab('goals'); await w(500); await p.evaluate(() => window.scrollTo(0, 0)); await p.screenshot({ path: `${DIR}${tag}_goals.png`, fullPage: true });
    await tab('month'); await w(500); await p.evaluate(() => window.scrollTo(0, 0)); await p.screenshot({ path: `${DIR}${tag}_month.png`, fullPage: true });
    await p.evaluate(() => { const b = document.querySelector('#helpBtn'); if (b) b.click(); }); await w(400); await p.evaluate(() => { const v = [...document.querySelectorAll('.help-menu button, .help-menu a')].find(e => /video/i.test(e.textContent)); if (v) v.click(); }); await w(1500);
    await p.screenshot({ path: `${DIR}${tag}_video.png` });
    await ctx.close();
  }
  await b.close(); console.log('done');
})().catch(e => { console.log('CRASH', e.message); process.exit(1); });
