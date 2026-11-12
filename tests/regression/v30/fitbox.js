// reads art_raw.json, measures each drawing's geometry box in a headless browser, writes art_fit.json with padded viewBoxes
const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const fs = require('fs');
(async () => {
  const raw = JSON.parse(fs.readFileSync('/tmp/v30/art_raw.json', 'utf8'));
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage();
  await p.setContent('<!doctype html><body>' + Object.entries(raw).map(([k, v]) => `<div id="${k}">${v}</div>`).join('') + '</body>');
  const out = await p.evaluate(raw => {
    const r = {};
    for (const k of Object.keys(raw)) {
      const svg = document.querySelector('#' + k + ' svg'); let bb = { x: 0, y: 0, width: 0, height: 0 };
      const kids = [...svg.children]; let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const el of kids) { const c = el.getBBox(); const m = el.getCTM(), s = svg.getScreenCTM(); /* bbox in element space; apply transform attribute */
        const t = el.transform && el.transform.baseVal.consolidate(); const mat = t ? t.matrix : new DOMMatrix();
        for (const [px, py] of [[c.x, c.y], [c.x + c.width, c.y], [c.x, c.y + c.height], [c.x + c.width, c.y + c.height]]) { const q = new DOMPoint(px, py).matrixTransform(mat); x0 = Math.min(x0, q.x); y0 = Math.min(y0, q.y); x1 = Math.max(x1, q.x); y1 = Math.max(y1, q.y); } }
      const pad = 2.2; x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
      const f = v => (Math.round(v * 10) / 10).toString();
      r[k] = raw[k].replace(/viewBox="[^"]*"/, `viewBox="${f(x0)} ${f(y0)} ${f(x1 - x0)} ${f(y1 - y0)}"`);
    }
    return r;
  }, raw);
  fs.writeFileSync('/tmp/v30/art_fit.json', JSON.stringify(out));
  for (const k of Object.keys(out)) console.log(k, out[k].match(/viewBox="([^"]*)"/)[1]);
  await b.close();
})();
