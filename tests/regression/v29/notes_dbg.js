// the upload door in a copy that cannot read files (file://, no relay reachable): grouped notes and the way-out line
const { w, P, launch, runTour } = require('/tmp/v22/lib.js');
(async () => {
  for (const [vw, vh, name] of [[390, 844, 'phone'], [1100, 900, 'desktop']]) {
    const { b, p, errs } = await launch(vw, vh, 'dark');
    let done = false;
    await runTour(p, P.a, async () => {
      const t = await p.$eval('#tourTitle', e => e.textContent); if (t !== 'Your numbers' || done) return; done = true;
      await p.click('.src-opt[data-src="upload"]'); await w(900);
      require('fs').writeFileSync('/tmp/v28/a.pdf', '%PDF-1.4\n%%EOF'); require('fs').writeFileSync('/tmp/v28/b.pdf', '%PDF-1.4\n%%EOF'); require('fs').writeFileSync('/tmp/v28/x.csv', 'Date,Amount\n2026-10-01,100\n');
      const input = await p.$('#impFile'); await input.uploadFile('/tmp/v28/x.csv', '/tmp/v28/a.pdf', '/tmp/v28/b.pdf'); await w(500);
      console.log(name, 'note:', await p.$eval('#impNote', e => e.innerText.replace(/\s+/g, ' ')), '| here:', await p.$eval('#impHere', e => e.hidden + ' ' + e.innerText));
      await p.screenshot({ path: `/tmp/v29/notes_${name}.png` });
      throw new Error('stop');
    }).catch(() => {});
    console.log('errs', JSON.stringify(errs));
    await b.close();
  }
})();
