const { w, P, launch, runTour } = require('./lib.js');
const fs = require('fs');
(async () => {
  for (const [vw, mock] of [[390, true], [320, true], [390, false]]) {
    const { b, p, errs } = await launch(vw, 844, 'light');
    if (mock) { await p.evaluateOnNewDocument(() => { window.claude = { use: async () => { const fn = async () => ({ text: 'x' }); fn.limits = async () => ({ images: { mediaTypes: ['image/jpeg', 'image/png'], maxCount: 10, maxInputBytes: 5000000 } }); fn.json = async () => ({ summary: 'Found 3 receipts.', receipts: [{ date: '2026-11-03', amount: 1280, category: 'other', note: 'FamilyMart' }, { date: '2026-11-04', amount: 640, category: 'other', note: 'Cafe' }, { date: '2026-11-05', amount: 3300, category: 'other', note: 'Don Quijote' }] }); return fn; } }; }); await p.reload({ waitUntil: 'load' }); await w(800); }
    await runTour(p, P.a); await w(900);
    for (let i = 0; i < 3; i++) if (await p.evaluate(() => { const c = document.querySelector('#co'); return !!c && !c.hidden; })) { await p.click('#coSkip'); await w(450); }
    await p.evaluate(() => document.querySelector('.tabs [data-tab=receipts]').click()); await w(1200);
    // coach mark: first step should be the scan card
    const co = await p.evaluate(() => { const c = document.querySelector('#co'); return c && !c.hidden ? c.innerText.replace(/\n/g, ' | ').slice(0, 120) : 'no coach'; });
    console.log(vw, mock ? 'mock' : 'nomock', 'coach:', co);
    for (let i = 0; i < 4; i++) if (await p.evaluate(() => { const c = document.querySelector('#co'); return !!c && !c.hidden; })) { await p.click('#coSkip'); await w(450); }
    await p.evaluate(() => window.scrollTo(0, 0)); await w(300);
    if (mock) {
      await (await p.$('#scanCamIn')).uploadFile('/tmp/v22/receipt_small.png'); await w(900);
      await p.screenshot({ path: `/tmp/v22/scanA_${vw}.png` });
      await p.evaluate(() => document.querySelector('#scanRead').click()); await w(1500);
      await p.evaluate(() => document.querySelector('#scanOut').scrollIntoView({ block: 'start' })); await w(300);
      await p.screenshot({ path: `/tmp/v22/scanB_${vw}.png` });
    } else {
      await w(1200); await p.screenshot({ path: `/tmp/v22/scanC_${vw}.png` });
      // fallback flow
      await p.evaluate(() => { const t = document.querySelector('#scanPaste'); t.scrollIntoView({ block: 'center' }); });
      await p.evaluate(() => { document.querySelector('#scanCopy').click(); }); await w(500);
      console.log('copy msg:', await p.$eval('#scanCopyMsg', e => e.textContent));
      const cats = await p.$$eval('#rcCat option', os => os.map(o => o.textContent));
      console.log('cats:', cats.slice(0, 6).join(' / '));
      const answers = {
        csv: "```csv\ndate,amount,category,note\n2026-11-03,1280,Food,FamilyMart\n2026/11/04,\"3,300\",Dining out,Don Quijote\n2026-11-05,640,Other,Cafe\n```",
        table: "| date | amount | category | note |\n|---|---|---|---|\n| 2026-11-03 | 1,280 | Food | FamilyMart |\n| 2026-11-05 | 640 | Other | Cafe |",
        jp: "date,amount,category,note\n2026年11月3日,¥1280,Food,Lawson\n2026-11-04,980.50,Food,Seven",
        junk: "Sorry, I cannot read those photos.",
        old: "date,amount,category,note\n2025-01-03,500,Food,Old shop"
      };
      for (const [k, v] of Object.entries(answers)) {
        await p.evaluate(t => { const e = document.querySelector('#scanPaste'); e.value = t; }, v);
        await p.evaluate(() => document.querySelector('#scanCheck').click()); await w(400);
        const r = await p.evaluate(() => { const c = document.querySelector('#scanOut2 .msg.card'); return { msg: document.querySelector('#scanPasteMsg').textContent, rows: c ? [...c.querySelectorAll('li')].map(li => li.innerText.replace(/\n/g, ' ').slice(0, 60) + ' [' + li.querySelector('select').selectedOptions[0].textContent + ']') : null }; });
        console.log('paste', k, JSON.stringify(r));
        if (k === 'csv') {
          await p.evaluate(() => document.querySelector('#scanOut2').scrollIntoView({ block: 'center' })); await w(250);
          await p.screenshot({ path: `/tmp/v22/scanD_${vw}.png` });
          await p.evaluate(() => [...document.querySelectorAll('#scanOut2 .msg.card button')].find(x => /Add to my page/.test(x.textContent)).click()); await w(800);
          console.log('after add:', (await p.$eval('#scanOut2', e => e.innerText)).replace(/\n/g, ' | '));
          console.log('list:', (await p.$eval('#rcList', e => e.innerText)).replace(/\n/g, ' | ').slice(0, 200));
        }
      }
    }
    const ov = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    console.log(vw, 'horizontal overflow:', ov, 'errors', JSON.stringify(errs));
    await b.close();
  }
})();
