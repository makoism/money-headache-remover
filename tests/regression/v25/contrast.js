/* Look for unreadable text in every screen, light and dark, whether the device or the setting chose it. */
const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { M } = require('/tmp/v25/oracle.js');
const w = ms => new Promise(r => setTimeout(r, ms));
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
const probe = () => {
  const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c.r) + .7152 * f(c.g) + .0722 * f(c.b); };
  const over = (top, bot) => { const a = top.a + bot.a * (1 - top.a); if (a === 0) return { r: 0, g: 0, b: 0, a: 0 }; return { r: (top.r * top.a + bot.r * bot.a * (1 - top.a)) / a, g: (top.g * top.a + bot.g * bot.a * (1 - top.a)) / a, b: (top.b * top.a + bot.b * bot.a * (1 - top.a)) / a, a }; };
  const bgOf = el => { const stack = []; for (let x = el; x; x = x.parentElement) { const cs = getComputedStyle(x); if (cs.backgroundImage && cs.backgroundImage !== 'none') return null; const c = parse(cs.backgroundColor); if (c && c.a > 0) { stack.push(c); if (c.a >= 1) break; } } let base = { r: 255, g: 255, b: 255, a: 1 }; if (!stack.length || stack[stack.length - 1].a < 1) { const rb = parse(getComputedStyle(document.documentElement).backgroundColor), bb = parse(getComputedStyle(document.body).backgroundColor); base = bb && bb.a > 0 ? over(bb, rb && rb.a > 0 ? rb : base) : (rb && rb.a > 0 ? rb : base); } let res = stack.length && stack[stack.length - 1].a >= 1 ? stack.pop() : base; while (stack.length) res = over(stack.pop(), res); return res; };
  const out = [], seen = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const n = walker.currentNode, t = n.textContent.trim(); if (!t) continue; const el = n.parentElement; if (!el || el.closest('script,style,noscript')) continue;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height || el.offsetParent === null && getComputedStyle(el).position !== 'fixed') continue;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    let op = 1; for (let x = el; x; x = x.parentElement) op *= +getComputedStyle(x).opacity; if (op < .5) continue;
    const fg = parse(cs.color), bg = bgOf(el); if (!fg || !bg) continue;
    const fgc = over({ r: fg.r, g: fg.g, b: fg.b, a: fg.a * Math.min(1, op) }, bg), L1 = lum(fgc), L2 = lum(bg), cr = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
    const size = parseFloat(cs.fontSize), big = size >= 24 || (size >= 18.66 && +cs.fontWeight >= 700); const need = big ? 3 : 4.5;
    if (cr < need - 0.0001 && cr < 4.0) { const key = el.tagName + '.' + String(el.className).slice(0, 24) + '#' + el.id + '|' + t.slice(0, 20); if (!seen.has(key)) { seen.add(key); out.push({ sel: el.tagName + '#' + el.id + '.' + String(el.className).slice(0, 30), text: t.slice(0, 30), cr: Math.round(cr * 100) / 100, fg: cs.color, bg: `rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})` }); } }
  }
  return out;
};
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const all = new Map(); let screens = 0;
  for (const dev of ['light', 'dark']) for (const pref of ['auto', 'light', 'dark']) for (const vw of [390, 1100]) {
    const eff = pref === 'auto' ? dev : pref; /* 'auto' here is stored as auto (follows the device); with nothing stored the page is dark by default */
    const S = M.presetState('¥'); S.ui = Object.assign(S.ui, { setup: true, sampleHidden: false, done: { pay: true, bills: true, goals: true, receipts: true }, seen: { home: true, month: true, goals: true, receipts: true, basics: true } });
    S.receipts = [{ id: 'r1', d: '2026-11-03', a: 1234, c: 'food', t: 'Lunch' }];
    const p = await b.newPage(); await p.setViewport({ width: vw, height: 900 }); await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: dev }]);
    await p.evaluateOnNewDocument((st, pr) => { if (!sessionStorage.getItem('__s')) { localStorage.setItem('money-map-template-v2', st); localStorage.setItem('money-map-theme', pr); sessionStorage.setItem('__s', '1'); } }, JSON.stringify(S), pref);
    await p.goto('file://' + PAGE + '#2026-11', { waitUntil: 'load' }); await w(500);
    const skip = () => p.evaluate(() => { const t = document.querySelector('#tour'); if (t && !t.hidden) document.querySelector('#tourSkip').click(); const c = document.querySelector('#co:not([hidden]) #coSkip'); if (c) c.click(); });
    await skip(); await w(300);
    const bgc = await p.evaluate(() => getComputedStyle(document.body).backgroundColor); const isDark = (c => { const m = c.match(/\d+/g).map(Number); return (m[0] + m[1] + m[2]) / 3 < 128; })(bgc);
    if (isDark !== (eff === 'dark')) all.set('MODE WRONG ' + dev + '/' + pref + '/' + vw, [{ sel: 'body', text: 'bg ' + bgc, cr: 0, fg: '', bg: '' }]);
    for (const tab of ['home', 'month', 'goals', 'receipts', 'basics']) {
      await p.evaluate(t => document.querySelector('#tab-' + t).click(), tab); await w(350); await skip();
      for (const step of [0, 1]) {
        if (step === 1) { await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await w(200); } else await p.evaluate(() => window.scrollTo(0, 0));
        const r = await p.evaluate(probe); screens++;
        r.forEach(x => { const k = x.sel + '|' + x.text; if (!/SVGAnimatedString/.test(x.sel) && !all.has(eff + ' ' + k)) all.set(eff + ' ' + k, [x]); });
      }
    }
    /* help menu, ask panel, tour, coach */
    await p.evaluate(() => (document.querySelector('#helpBtn')||{click(){}}).click()); await w(250); (await p.evaluate(probe)).forEach(x => all.set(eff + ' HELP ' + x.sel + '|' + x.text, [x])); screens++;
    await p.evaluate(() => (document.querySelector('#helpBtn')||{click(){}}).click());
    await p.evaluate(() => { (document.querySelector('#helpBtn')||{click(){}}).click(); (document.querySelector('#helpAsk')||{click(){}}).click(); }); await w(500); (await p.evaluate(probe)).forEach(x => all.set(eff + ' ASK ' + x.sel + '|' + x.text, [x])); screens++;
    await p.evaluate(() => { const x = document.querySelector('#askClose'); if (x) x.click(); }); await w(200);
    await p.evaluate(() => { (document.querySelector('#helpBtn')||{click(){}}).click(); (document.querySelector('#helpSetup')||{click(){}}).click(); }); await w(700);
    for (let i = 0; i < 8; i++) { (await p.evaluate(probe)).forEach(x => all.set(eff + ' TOUR' + i + ' ' + x.sel + '|' + x.text, [x])); screens++; const nx = await p.$('#tourNext'); if (!nx) break; const hid = await p.$eval('#tourNext', e => e.hidden).catch(() => true); if (hid) { if (await p.$('#srcSkip')) { await p.click('#srcSkip'); await w(250); continue; } break; } const dis = await p.$eval('#tourNext', e => e.disabled).catch(() => true); if (dis) break; await p.click('#tourNext'); await w(250); }
    await p.close();
  }
  await b.close();
  console.log('screens checked', screens, '| low-contrast spots', all.size);
  [...all.entries()].filter(([k]) => !/TOUR[0-9] (SPAN#.yen|P#.foot|P#verFoot)|\.sr\|/.test(k)).forEach(([k, v]) => console.log('  ', k, JSON.stringify(v[0])));
})();
