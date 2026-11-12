const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const fs = require('fs');
const { w, P, runTour } = require('/tmp/v22/lib.js');
const F = '/tmp/fonts/node_modules/@fontsource-variable/';
const b64 = f => fs.readFileSync(f).toString('base64');
const face = (name, file, extra) => `@font-face{font-family:"${name}";src:url(data:font/woff2;base64,${b64(file)}) format("woff2");font-weight:100 900;font-display:swap;${extra || ''}}`;
const FACES = face('Figtree', F + 'figtree/files/figtree-latin-wght-normal.woff2') + face('Nunito Sans', F + 'nunito-sans/files/nunito-sans-latin-wght-normal.woff2') + face('Plus Jakarta Sans', F + 'plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2') + face('Manrope', F + 'manrope/files/manrope-latin-wght-normal.woff2') + face('Fraunces', F + 'fraunces/files/fraunces-latin-opsz-normal.woff2') + face('Outfit', F + 'outfit/files/outfit-latin-wght-normal.woff2');
const DISPLAY = 'h1, h2, #tourTitle, .hs-big, .big .num, .tour-reveal b, .hst-n b, .top h1';
const V = {
  system: '',
  figtree: `:root{--f:"Figtree",-apple-system,sans-serif} body{letter-spacing:-.012em}`,
  nunito: `:root{--f:"Nunito Sans",-apple-system,sans-serif} body{letter-spacing:-.008em}`,
  jakarta: `:root{--f:"Plus Jakarta Sans",-apple-system,sans-serif} body{letter-spacing:-.016em}`,
  manrope: `:root{--f:"Manrope",-apple-system,sans-serif} body{letter-spacing:-.014em}`,
  fraunces_figtree: `:root{--f:"Figtree",-apple-system,sans-serif} body{letter-spacing:-.012em} ${DISPLAY}{font-family:"Fraunces",Georgia,serif;font-weight:500;letter-spacing:-.02em;font-variation-settings:"opsz" 72,"SOFT" 60,"WONK" 0}`,
  fraunces_system: `${DISPLAY}{font-family:"Fraunces",Georgia,serif;font-weight:500;letter-spacing:-.02em;font-variation-settings:"opsz" 72,"SOFT" 60,"WONK" 0}`,
};
(async () => {
  const theme = process.argv[2] || 'dark', out = '/tmp/v31/fonts_' + theme; fs.mkdirSync(out, { recursive: true });
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844 });
  await p.goto('http://127.0.0.1:8788/#2026-11', { waitUntil: 'load' }); await w(600);
  await p.evaluate(t => { localStorage.setItem('money-map-theme', t); }, theme); await p.reload({ waitUntil: 'load' }); await w(900);
  await p.addStyleTag({ content: FACES });
  const apply = async css => { await p.evaluate(css => { let s = document.querySelector('#fontTrial'); if (!s) { s = document.createElement('style'); s.id = 'fontTrial'; document.head.appendChild(s); } s.textContent = css; }, css); await w(250); };
  let shotAt = false;
  await runTour(p, P.a, async i => {
    const t = await p.$eval('#tourTitle', e => e.textContent);
    if (!shotAt && /Play money/.test(t)) { shotAt = true; await w(5500); for (const [k, css] of Object.entries(V)) { await apply(css); await p.screenshot({ path: `${out}/play_${k}.png` }); } await apply(''); }
  });
  await w(1200);
  await p.type('#hAmt', '1200'); await p.evaluate(() => document.querySelector('#hForm').requestSubmit()); await w(6000);
  await p.evaluate(() => window.scrollTo(0, 0));
  for (const [k, css] of Object.entries(V)) { await apply(css); await p.screenshot({ path: `${out}/home_${k}.png` }); }
  await b.close();
})();
