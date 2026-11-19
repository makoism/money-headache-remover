/* script_words: guards the wording finding that came back in rounds 1 to 4 (glossary words, wording editor): no em dash and none of the
   retired words (jar, Necessities, Financial Freedom, play money, income, allocation, unassigned) in any text a person can see or hear:
   the first screen, every tab and Plan view, Home with More open, Settings and the Help menu, in an ordinary and an overspent month.
   Screen readers count too, so aria-label, title, placeholder and tooltip text are checked as well. Made-up numbers.
   Run: node tests/qc/script_words.js */
const K = require('./script_lib.js'); const { ck, done } = K.report();
const BAD = /\u2014|\bjars?\b|\bnecessit(?:y|ies)\b|financial freedom|play money|\bincomes?\b|\ballocat(?:e|ed|es|ion|ions)\b|\bunassigned\b/i;
const grab = p => p.evaluate(() => {
  const out = [document.body.innerText];
  document.querySelectorAll('[aria-label],[title],[placeholder],[data-tip],[alt]').forEach(e => ['aria-label', 'title', 'placeholder', 'data-tip', 'alt'].forEach(a => { const v = e.getAttribute(a); if (v) out.push(v.replace(/<[^>]+>/g, ' ')); }));
  return out.join('\n');
});
const hits = t => [...new Set(t.split('\n').filter(l => BAD.test(l)).map(l => l.trim().slice(0, 140)))];
ck('self-test: the pattern catches each retired word and an em dash, and not ordinary words',
  ['a jar', 'Necessities', 'financial freedom', 'Play money', 'income', 'allocation', 'Unassigned', 'a \u2014 b'].every(x => BAD.test(x))
  && !['Majority', 'outcome', 'reallocate later'.replace('reallocate', 'move'), 'assigned'].some(x => BAD.test(x)));
(async () => {
  let tour = [];
  const { b, p, errs } = await K.open({ onTour: async p => { tour = hits(await grab(p)); } });
  ck('first screen (tour): no em dash or retired word', tour.length === 0, tour.join(' | '));
  for (const st of ['cents', 'over']) {
    if (st !== 'cents') await K.state(p, st);
    await K.sweep(p, async name => { const h = hits(await grab(p)); ck(`${st} month, ${name}: no em dash or retired word`, h.length === 0, h.join(' | ')); });
  }
  await p.evaluate(() => { const h = document.getElementById('helpBtn'); h && h.click(); }); await K.w(500);
  const hm = hits(await grab(p)); ck('Help menu: no em dash or retired word', hm.length === 0, hm.join(' | '));
  ck('no page errors', errs.length === 0, errs.join(' | ')); await b.close(); done();
})();
