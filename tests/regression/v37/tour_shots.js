const L = require('/tmp/v22/lib.js'); const { w } = L;
(async () => {
  for (const [vw, vh] of [[1440, 900], [390, 844]]) {
    const { b, p } = await L.launch(vw, vh, 'dark');
    await p.goto('file:///home/claude/work/money-map-team.html?tod=morning#2026-11', { waitUntil: 'load' }); await w(900);
    await p.screenshot({ path: `/tmp/v37/t-${vw}-video.png` });
    await p.click('#tourNext'); await w(500); await p.screenshot({ path: `/tmp/v37/t-${vw}-cur.png` });
    await b.close();
  }
})();
