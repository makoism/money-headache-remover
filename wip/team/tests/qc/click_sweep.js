/* Clicks every visible button on every tab, on a phone and a laptop, dark and light. After each click: no page error, no NaN / undefined / Infinity / [object on screen,
   no sideways scroll. Destructive buttons (erase, reset, delete, restore, import, download, sign out) are skipped. Run: node tests/qc/click_sweep.js
   Needs /tmp/v25/oracle.js and /tmp/v39/real.js. Env: SIZES="390x844,1300x900,320x640" THEMES="dark,light" */
const { phone, w } = require('/tmp/v39/real.js');
const { M, randomState, setSeed } = require('/tmp/v25/oracle.js'); setSeed(+(process.env.SEED || 3));
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
const SIZES = (process.env.SIZES || '390x844,1300x900,320x640').split(',').map(s => s.split('x').map(Number));
const THEMES = (process.env.THEMES || 'dark,light').split(',');
const SKIP = /erase|reset|delete|remove|wipe|restore|import|download|sign out|clear all|start over|forget|upload|choose file|scan|camera|share|export|save a copy|copy/i;
let clicks = 0; const fails = [];
const tabs = ['home', 'receipts', 'goals', 'month', 'months', 'basics'];
(async () => {
  for (const [W, H] of SIZES) for (const theme of THEMES) {
    const S = randomState(); S.receipts = [{ id: 'r1', d: '2026-11-03', a: 1234.5, c: 'other', cn: 'Other', n: '' }];
    S.ui = Object.assign(S.ui, { toured: true, setup: true, sampleHidden: true, done: { pay: true, bills: true, goals: true, receipts: true }, seen: { home: true, month: true, goals: true, receipts: true, basics: true } });
    const { b, p, errs } = await phone({ w: W, h: H, dpr: 1, mobile: W < 700 });
    await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme }]);
    await p.evaluateOnNewDocument(st => { localStorage.setItem('money-map-template-v2', st); }, JSON.stringify(S));
    await p.evaluateOnNewDocument(() => { const real = Date, fixed = new real('2026-11-17T10:00:00').getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; window.confirm = () => false; window.alert = () => { }; window.prompt = () => null; });
    await p.goto('file://' + PAGE + '#2026-11'); await w(1400);
    const where = `${W}x${H} ${theme}`;
    const audit = async (label) => {
      const r = await p.evaluate(() => { const t = document.body.innerText; const m = t.match(/NaN|undefined|Infinity|\[object|null%|\$NaN/); return { bad: m ? m[0] : '', over: document.documentElement.scrollWidth - innerWidth, bodyOver: document.body.scrollWidth - innerWidth }; });
      if (r.bad) fails.push(`${where} ${label}: screen shows "${r.bad}"`);
      if (r.over > 1 || r.bodyOver > 1) fails.push(`${where} ${label}: sideways scroll ${r.over}px`);
      if (errs.length) { fails.push(`${where} ${label}: ${errs.splice(0).join(' | ').slice(0, 200)}`); }
    };
    for (const tab of tabs) {
      const go = async () => { await p.evaluate(t => { const e = document.querySelector(`[data-tab="${t}"]`); if (e) e.click(); }, tab); await w(500); };
      await go(); await audit('tab ' + tab);
      const labels = await p.evaluate(() => { const vis = e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !e.disabled; }; const main = document.querySelector('.wrap') || document.body; return [...main.querySelectorAll('button, [role=button], summary, a[href]')].filter(vis).map((e, i) => (e.getAttribute('aria-label') || e.innerText || e.id || e.className || '').replace(/\s+/g, ' ').trim().slice(0, 40)); });
      let n = 0;
      for (let i = 0; i < labels.length; i++) {
        if (SKIP.test(labels[i])) continue;
        if (n % 12 === 11) { await p.reload(); await w(1000); await go(); }
        const did = await p.evaluate(i => { const vis = e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !e.disabled; }; const main = document.querySelector('.wrap') || document.body; const e = [...main.querySelectorAll('button, [role=button], summary, a[href]')].filter(vis)[i]; if (!e) return false; if (e.matches('a[href]') && !/^#/.test(e.getAttribute('href'))) return false; e.scrollIntoView({ block: 'center' }); e.click(); return true; }, i);
        if (!did) continue; n++; clicks++; await w(220);
        await audit(`${tab} #${i} "${labels[i]}"`);
        await p.keyboard.press('Escape'); await w(80);
        const still = await p.evaluate(() => { const o = document.querySelector('dialog[open], .modal:not([hidden]), .bv:not([hidden])'); if (o) { const c = o.querySelector('[data-close], .close, button[aria-label*="lose"], #tourSkip'); if (c) c.click(); } return !!document.querySelector('.hash, #tour:not([hidden])'); });
        if (!(await p.evaluate(() => location.hash.startsWith('#20')))) { await p.evaluate(() => { location.hash = '#2026-11'; }); }
      }
      await p.reload(); await w(900);
    }
    await b.close();
  }
  console.log('clicks', clicks, '| problems', fails.length);
  fails.forEach(f => console.log('  ', f.slice(0, 300)));
  process.exit(fails.length ? 1 : 0);
})();
