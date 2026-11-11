const { w, launch } = require('/tmp/v22/lib.js');
(async () => {
  const sizes = [[390,844],[1127,750],[1280,720],[1440,900],[390,667],[360,640],[320,568]];
  for (const [vw,vh] of sizes) for (const sch of ['light','dark']) {
    const { b, p, errs } = await launch(vw, vh, sch);
    await w(500);
    const r = await p.evaluate(() => {
      const q = s => document.querySelector(s), R = e => { if (!e) return null; const r = e.getBoundingClientRect(); return { t: Math.round(r.top), b: Math.round(r.bottom), l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width), h: Math.round(r.height) }; };
      const body = q('#tourBody') || q('.tour-body');
      return { title: (q('#tourTitle')||{}).textContent, scene: R(q('svg.tour-scene')), name: R(q('#tourName')), safe: R(q('.tour-safe')), foot: R(q('.tour-foot')), nextBtn: R(q('.tour-foot .btn.primary, .tour-foot #tourNext')), vh: innerHeight, scroll: body ? [body.scrollHeight, body.clientHeight] : null, docScroll: [document.documentElement.scrollHeight, innerHeight] };
    });
    console.log(`${vw}x${vh} ${sch}`, JSON.stringify(r));
    if (sch === 'light' || vw <= 390) await p.screenshot({ path: `/tmp/v27/house_${vw}x${vh}_${sch}.png` });
    if (errs.length) console.log('ERR', JSON.stringify(errs));
    await b.close();
  }
})();
