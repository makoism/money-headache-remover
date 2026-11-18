const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const w = ms => new Promise(r => setTimeout(r, ms));
exports.w = w;
/* a real phone: 385x730 css px at 2.8x, touch, optional CPU slowdown */
exports.phone = async (opt = {}) => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/ERR_FILE_NOT_FOUND|ERR_TUNNEL|ERR_NAME|ERR_INTERNET|ERR_CONNECTION|CORS|ERR_FAILED/.test(m.text())) errs.push('console: ' + m.text()); });
  const W = opt.w || 385, H = opt.h || 730;
  await p.setViewport({ width: W, height: H, deviceScaleFactor: opt.dpr || 2.8, isMobile: !!opt.mobile, hasTouch: !!opt.mobile });
  await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  /* Storage. Every launch above gets a fresh, empty, throwaway browser profile, so the first load always starts with nothing saved.
     opt.keep (every reload test): nothing is wiped, ever, so a reload sees exactly what the page saved.
       It used to wipe "unless sessionStorage says __keep", but Chrome sometimes loses that sessionStorage flag across a reload
       of a file:// page; the helper then wiped the saved plan itself and the reload test failed about half the time
       with 0 receipts and sample numbers, although the app had saved correctly. The app was never at fault.
     without opt.keep: the old behaviour, storage is wiped at every page load unless the test sets __keep itself. */
  if (!opt.keep) await p.evaluateOnNewDocument(() => { try { if (!sessionStorage.getItem('__keep')) { localStorage.clear(); indexedDB.deleteDatabase('money-map-safe'); } } catch (e) {} });
  if (opt.cpu) { const c = await p.createCDPSession(); await c.send('Emulation.setCPUThrottlingRate', { rate: opt.cpu }); }
  return { b, p, errs };
};
