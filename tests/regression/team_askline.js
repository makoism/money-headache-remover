const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const w = ms => new Promise(r => setTimeout(r, ms));
const ok = (n, c) => { console.log(c ? 'PASS' : 'FAIL', n); if (!c) process.exitCode = 1; };
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  for (const [label, mode] of [['no Claude', 'none'], ['Claude, text only', 'text'], ['Claude with pictures', 'images']]) {
    const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.evaluateOnNewDocument(m => {
      try { (localStorage.clear(), indexedDB.deleteDatabase('money-map-safe')); } catch (e) { /* none */ }
      if (m === 'none') return;
      window.claude = { use: async name => { if (name !== 'sample') return null; const fn = async () => ({ text: 'ok' }); fn.json = async () => ({}); fn.limits = async () => m === 'images' ? { maxPromptBytes: 262144, images: { maxCount: 5, maxInputBytes: 20000000, mediaTypes: ['image/jpeg', 'image/png'] } } : { maxPromptBytes: 262144 }; return fn; } };
    }, mode);
    await p.setViewport({ width: 1000, height: 1100 });
    await p.goto('file:///home/claude/work/money-map-team.html#2026-11', { waitUntil: 'load' }); await w(900);
    for (let i = 0; i < 45 && (await p.$eval('#tourTitle', e => e.textContent)) !== 'Once a week, take five minutes'; i++) { await p.click('#tourNext'); await w(80); }
    const title = await p.$eval('#tourTitle', e => e.textContent), text = await p.$eval('#tourBody', e => e.innerText);
    ok(label + ': on the weekly routine screen', title === 'Once a week, take five minutes');
    ok(label + ': original sentences kept', text.includes('Add each one on the Receipts tab.') && text.includes('That’s the whole routine.'));
    const has = text.includes('Or give screenshots of them to Ask Claude, in the Help button, and check what it fills in.');
    ok(label + ': Ask Claude line ' + (mode === 'images' ? 'is shown' : 'is not shown'), has === (mode === 'images'));
    ok(label + ': no em dashes, no page errors', !text.includes('—') && errs.length === 0);
    await p.close();
  }
  await b.close();
})();
