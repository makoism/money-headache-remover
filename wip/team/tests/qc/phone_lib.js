/* Shared helper for the phone tests (tests/qc/phone_*.js). One browser at a time, a phone-shaped page with touch, optional CPU slowdown.
   The plan is the app's own yen sample (presetState('¥')), marked as set up, with the date fixed to 17 Nov 2026.
   open({ dev, cpu, query, reduced }) -> { b, p, errs, cdp }. dev is one of DEVS. */
const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
const KEY = 'money-map-template-v2';
const w = ms => new Promise(r => setTimeout(r, ms));
const DEVS = {
  iphone13: { w: 390, h: 844, dpr: 3, mobile: true },
  iphoneSE: { w: 320, h: 568, dpr: 2, mobile: true },
  pixel5: { w: 393, h: 851, dpr: 2.75, mobile: true },
  big: { w: 430, h: 932, dpr: 3, mobile: true },
  tablet: { w: 768, h: 1024, dpr: 2, mobile: true },
  land: { w: 844, h: 390, dpr: 3, mobile: true },
  land8: { w: 667, h: 375, dpr: 2, mobile: true },
  desktop: { w: 1440, h: 900, dpr: 1, mobile: false },
};
async function open(o = {}) {
  const d = DEVS[o.dev || 'iphone13'];
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(), errs = [];
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await p.setViewport({ width: d.w, height: d.h, deviceScaleFactor: o.dpr || 1, isMobile: d.mobile, hasTouch: d.mobile });
  const feats = [{ name: 'prefers-color-scheme', value: 'dark' }]; if (o.reduced) feats.push({ name: 'prefers-reduced-motion', value: 'reduce' });
  await p.emulateMediaFeatures(feats);
  await p.evaluateOnNewDocument(() => { const real = Date, fixed = new real('2026-11-17T10:00:00').getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; window.confirm = () => false; window.alert = () => { }; });
  /* the plan is made by the app itself (presetState) in a throwaway tab, then written before the app starts in the tab under test, so the app's own save never overwrites it */
  const url = 'file://' + PAGE + (o.query ? '?' + o.query : '') + '#2026-11';
  const p0 = await b.newPage(); await p0.goto('file://' + PAGE + '#2026-11'); await w(300);
  const st = await p0.evaluate(() => { const s = presetState('¥'); s.ui = Object.assign(s.ui || {}, { toured: true, setup: true, sampleHidden: true, done: { pay: true, bills: true, goals: true, receipts: true }, seen: { home: true, month: true, goals: true, receipts: true, basics: true } }); return JSON.stringify(s); });
  await p0.close();
  await p.evaluateOnNewDocument((k, s) => { try { localStorage.clear(); indexedDB.deleteDatabase('money-map-safe'); localStorage.setItem(k, s); } catch (e) { } }, KEY, st);
  await p.goto(url); await w(1500);
  const cdp = await p.createCDPSession();
  if (o.cpu) await cdp.send('Emulation.setCPUThrottlingRate', { rate: o.cpu });
  return { b, p, errs, cdp };
}
/* long tasks (over 50 ms) seen by the page from now on, read with takeLong() */
async function watchLong(p) { await p.evaluate(() => { window.__long = []; new PerformanceObserver(l => l.getEntries().forEach(e => window.__long.push(Math.round(e.duration)))).observe({ type: 'longtask', buffered: false }); }); }
const takeLong = p => p.evaluate(() => window.__long.splice(0));
/* script time in ms over a window, from the CDP ScriptDuration counter */
async function scriptMs(cdp, ms) { const a = await cdp.send('Performance.getMetrics'); await w(ms); const c = await cdp.send('Performance.getMetrics'); const g = (m, n) => m.metrics.find(x => x.name === n).value; return Math.round((g(c, 'ScriptDuration') - g(a, 'ScriptDuration')) * 1000); }
module.exports = { open, w, DEVS, watchLong, takeLong, scriptMs, PAGE };
