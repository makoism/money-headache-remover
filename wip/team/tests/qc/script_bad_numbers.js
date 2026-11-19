/* script_bad_numbers: guards the finding that came back in rounds 1 to 4 on edge plans (number gate, money accuracy, novice): a broken
   number on screen. No NaN, undefined, null, Infinity, [object Object], minus zero (−$0, −0%, -0) or a minus sign after the currency
   ($−5) may show anywhere: page text, aria-label, title, placeholder, tooltip text or the value of a box. Checked on every tab and Plan
   view, Home with More open and Settings, in four made-up months: one with cents, one overspent with the bank short, one where every
   number is 0, and one with nothing entered at all. Run: node tests/qc/script_bad_numbers.js */
const K = require('./script_lib.js'); const { ck, done } = K.report();
const BAD = /\bNaN\b|\bundefined\b|\bnull\b|Infinity|\[object|(^|[^\w.,])[−-]\s?[$¥€£]?0(\.0+)?%?(?![\d.,])|[$¥€£]\s?[−-]/;
const grab = p => p.evaluate(() => {
  const out = document.body.innerText.split('\n');
  document.querySelectorAll('[aria-label],[title],[placeholder],[data-tip]').forEach(e => ['aria-label', 'title', 'placeholder', 'data-tip'].forEach(a => { const v = e.getAttribute(a); if (v) out.push(a + ': ' + v.replace(/<[^>]+>/g, ' ')); }));
  document.querySelectorAll('input:not([type=hidden]),textarea').forEach(e => { if (e.getClientRects().length) out.push('box ' + (e.id || e.name || '') + ': ' + e.value); });
  return out;
});
const hits = ls => [...new Set(ls.filter(l => BAD.test(l)).map(l => l.trim().slice(0, 140)))];
ck('self-test: the pattern catches each broken number and lets ordinary ones be',
  ['$NaN', 'undefined left', 'Infinity%', '−$0', '-0', '−0%', '$−5', '[object Object]', 'null'].every(x => BAD.test(x))
  && !['$0', '0%', 'Nov 2026-11', '−$0.45', '−$202.95', '$10', 'in 10 days'].some(x => BAD.test(x)));
(async () => {
  const { b, p, errs } = await K.open({});
  for (const st of ['cents', 'over', 'zero', 'blank']) {
    if (st !== 'cents') await K.state(p, st);
    await K.sweep(p, async name => { const h = hits(await grab(p)); ck(`${st} month, ${name}: no broken number`, h.length === 0, h.join(' | ')); });
  }
  ck('no page errors', errs.length === 0, errs.join(' | ')); await b.close(); done();
})();
