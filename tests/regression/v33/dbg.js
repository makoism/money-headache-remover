const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844 });
  await p.goto('http://127.0.0.1:8788/?sfxtest#2026-11', { waitUntil: 'load' }); await w(800);
  await runTour(p, P.b); await w(1500);
  console.log(await p.evaluate(() => {
    const c = document.querySelector('#hHero > .pixc'); const k = document.querySelector('#hHero .hwin-k, #hHero .k, #hHero small, #hHero p');
    const rep = []; const old = k.textContent;
    const dump = tag => { c.classList.remove('off'); const r = c.getBoundingClientRect(); const rg = document.createRange(), walk = document.createTreeWalker(c.parentElement, NodeFilter.SHOW_TEXT); let n; const hits = []; while ((n = walk.nextNode())) { if (!n.textContent.trim() || c.contains(n)) continue; rg.selectNodeContents(n); for (const q of rg.getClientRects()) if (q.width && q.left < r.right + 6 && q.right > r.left - 6 && q.top < r.bottom + 6 && q.bottom > r.top - 6) hits.push([n.textContent.trim().slice(0, 20), Math.round(q.left), Math.round(q.right), Math.round(q.top), Math.round(q.bottom)]); } rep.push([tag, k.className, [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)], hits]); };
    dump('start'); k.textContent = 'A very long caption that runs right across the whole width of the card and then some more words'; dump('long'); k.textContent = old; dump('short');
    return JSON.stringify(rep);
  }));
  await b.close();
})();
