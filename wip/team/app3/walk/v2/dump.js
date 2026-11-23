const L = require('./lib.js');
(async () => {
  const c = await L.ctx(process.argv[2]); const p = c.pages()[0] || await c.newPage();
  await L.go(p, process.argv[3] || '2027-01-15');
  const b = await p.evaluate(async () => { const s = await BurrowStore.open(); try { const r = await s.load(); return r.copy; } finally { s.close(); } });
  require('fs').writeFileSync(process.argv[4] || 'book.json', JSON.stringify(b, null, 1));
  const nm = id => ((b.accounts || []).find(a => a.id === id) || {}).name || id;
  for (const e of b.events.slice().sort((x, y) => (x.date + x.told < y.date + y.told ? -1 : 1))) console.log(e.date, e.k, e.sub || '', e.a, nm(e.acct), e.acct2 ? '->' + nm(e.acct2) : '', e.settles ? 'settles=' + JSON.stringify(e.settles).slice(0,60) : '', e.of ? 'of=' + e.of : '', e.note || '', e.src ? e.src.type : '', 'told=' + String(e.told).slice(0, 16), e.gone ? 'GONE' : '', e.fill ? 'fill' : '');
  await c.close();
})();
