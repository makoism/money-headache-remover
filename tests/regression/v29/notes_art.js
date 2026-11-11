// the same door inside a stand-in for the Claude viewer (window.claude present, signed out: use() rejects), phone and desktop
const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
(async () => {
  for (const [vw, vh, name] of [[390, 844, 'phone'], [1100, 900, 'desktop']]) {
    const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
    const p = await b.newPage(); await p.setViewport({ width: vw, height: vh }); await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch (e) {} window.claude = { use: () => Promise.reject(new Error('not signed in')) }; });
    await p.goto('file:///home/claude/work/money-map-team.html?a=' + Math.random() + '#2026-11', { waitUntil: 'load' }); await w(800);
    let done = false;
    await runTour(p, P.a, async () => {
      const t = await p.$eval('#tourTitle', e => e.textContent); if (t !== 'Your numbers' || done) return; done = true;
      await p.click('.src-opt[data-src="upload"]'); await w(1200);
      const input = await p.$('#impFile'); await input.uploadFile('/tmp/v28/x.csv', '/tmp/v28/a.pdf', '/tmp/v28/b.pdf'); await w(500);
      console.log(name, '| sub:', await p.$eval('#srcUploadSub', e => e.textContent), '| here:', await p.$eval('#impHere', e => e.hidden + ' ' + e.innerText), '| note:', await p.$eval('#impNote', e => e.innerText.replace(/\s+/g, ' ')), '| link:', await p.$eval('#impNote a', e => e.href).catch(() => 'none'));
      await p.screenshot({ path: `/tmp/v29/notes_art_${name}.png` });
      throw new Error('stop');
    }).catch(() => {});
    console.log('errs', JSON.stringify(errs));
    await b.close();
  }
})();
