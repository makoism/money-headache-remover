// The credit card step of the typed setup: one amount box; the statement calculator folds away; a filled calculator counts on its own.
const { w, P, launch, runTour } = require('/tmp/v22/lib.js');
let pass = 0, fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); c ? pass++ : fail++; };
(async () => {
  // A: the calculator, then Use
  let { b, p, errs } = await launch(390, 844, 'light');
  let seen = 0;
  await runTour(p, P.b, async () => {
    const t = await p.$eval('#tourTitle', e => e.textContent); if (t !== 'Credit card' || seen) return; seen = 1;
    ok(await p.evaluate(() => !!document.querySelector('#tourAmt') && !document.querySelector('#tourBody details').open), 'one amount box, the calculator folded');
    ok(/apart from the bills you already listed/.test(await p.$eval('#tourBody', e => e.textContent)), 'the question is about spending beyond the listed bills');
    await p.evaluate(() => { document.querySelector('#tourBody details').open = true; }); await w(200);
    await p.type('#tourCardT', '9000'); await p.type('#tourCardB', '5500'); await w(300);
    ok(/Card spending: \$3,500 a month/.test(await p.$eval('#cardCap', e => e.textContent)), 'the calculator shows the difference');
    await p.click('#cardUse'); await w(200);
    ok((await p.$eval('#tourAmt', e => e.value)) === '3500', 'Use puts the difference in the amount box');
  });
  let st = await p.evaluate(() => { const S = JSON.parse(localStorage.getItem('money-map-template-v2')); return { card: S.steps.card && S.steps.card[0].v, t: S.ui.cardT, b: S.ui.cardB }; });
  ok(st.card === 3500 && st.t === 9000 && st.b === 5500, 'the card line is 3,500 and the calculator inputs are kept: ' + JSON.stringify(st));
  ok(errs.length === 0, 'no page errors (A) ' + JSON.stringify(errs.slice(0, 2)));
  await b.close();
  // B: calculator filled, amount box left empty: it still counts on Next
  ({ b, p, errs } = await launch(390, 844, 'light'));
  seen = 0;
  const pb = Object.assign({}, P.b, { amt: Object.assign({}, P.b.amt, { card: undefined }) });
  await runTour(p, pb, async () => {
    const t = await p.$eval('#tourTitle', e => e.textContent); if (t !== 'Credit card' || seen) return; seen = 1;
    await p.evaluate(() => { document.querySelector('#tourBody details').open = true; }); await w(200);
    await p.type('#tourCardT', '4000'); await p.type('#tourCardB', '1000'); await w(300);
    ok((await p.$eval('#tourAmt', e => e.value)) === '', 'the amount box is still empty before moving on');
  });
  st = await p.evaluate(() => { const S = JSON.parse(localStorage.getItem('money-map-template-v2')); return S.steps.card && S.steps.card[0].v; });
  ok(st === 3000, 'moving on with an empty box uses the calculator result: ' + st);
  ok(errs.length === 0, 'no page errors (B) ' + JSON.stringify(errs.slice(0, 2)));
  await b.close();
  console.log(`CARD STEP: ${pass} pass, ${fail} fail`); process.exit(fail ? 1 : 0);
})().catch(e => { console.log('CRASH', e.stack); process.exit(2); });
