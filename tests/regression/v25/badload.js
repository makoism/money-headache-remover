const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const w = ms => new Promise(r => setTimeout(r, ms));
const BAD = {
  strings: { steps: { a: [{ from: '2026-11', v: 'abc' }] } },
  negative: { steps: { a: [{ from: '2026-11', v: -5000 }], 'bill:rent': [{ from: '2026-11', v: -100 }] } },
  nan_null: { steps: { a: [{ from: '2026-11', v: null }], 'bill:food': [{ from: '2026-11', v: NaN }] } },
  notarray: { steps: { a: 'oops', 'bill:rent': { from: '2026-11', v: 5 } } },
  huge: { steps: { a: [{ from: '2026-11', v: 9e99 }] } },
  badmonth: { steps: { a: [{ from: 'junk', v: 5000 }, { from: '2031-01', v: 7 }] } },
  once_bad: { once: { '2026-12': { 'bill:rent': 'x', a: -1 }, 'junk': { a: 5 } } },
  items_bad: { items: { '2026-12': [{ id: 'q', label: 'x', amount: 'nine' }, { id: 'r', label: 'y', amount: -400 }, null, 5] } },
  cfg_bad: { cfg: { bankStart: 'lots', minBank: -50, ceiling: null } },
};
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  for (const [name, patch] of Object.entries(BAD)) {
    const p = await b.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message.slice(0, 80)));
    await p.setViewport({ width: 1000, height: 800 });
    await p.evaluateOnNewDocument((patch) => { const base = { v: 1, rev: 1, steps: {}, once: {}, items: {}, cfg: {}, ui: { cur: '$', preset: '$', setup: true, done: {}, seen: { month: true, goals: true, receipts: true, basics: true, home: true, learn: true } }, plan: null, receipts: [] }; localStorage.setItem('money-map-template-v2', JSON.stringify(Object.assign(base, patch))); }, patch);
    await p.goto('file:///home/claude/work/money-map-team.html#2026-11', { waitUntil: 'load' }); await w(900);
    const txt = await p.evaluate(() => document.body.innerText);
    const bad = (txt.match(/NaN|Infinity|undefined|\[object/g) || []).length;
    console.log(name.padEnd(10), 'page errors:', errs.length, errs[0] || '', '| NaN/undefined text:', bad);
    await p.close();
  }
  await b.close();
})();
