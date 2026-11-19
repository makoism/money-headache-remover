/* H1 (novice walk of setup, 2026-11-19), findings 2 and 3, on the built page. Made-up numbers.
   2. The Credit card step tells a person who pays the card in full what to do (a marked line, shown, that stays inside setup), marks the
      line that explains the places it names for after setup, and Next works with nothing typed and stays in setup.
   3. Split the rest: each of the five places has a short line of its own, a marked line says the sliders can be changed, the line under
      the pot and the line under the sliders give the same percent when all is given out, and "Give it to" uses the same five names.
   The test reads ids and data attributes, not the wording. Run: node tests/qc/h1_setup.js */
let bad = 0; const ck = (n, c, x) => { console.log(c ? 'PASS' : 'FAIL', n, c ? '' : (x || '')); if (!c) bad++; };
const R = require('/tmp/v39/real.js'); const w = R.w;
const PAGE = 'file://' + (process.env.BUILD || '/home/claude/work/money-map-team.html') + '?sfxtest';
const next = p => p.evaluate(() => { const n = document.getElementById('tourNext'); if (n && n.offsetParent) { n.click(); return true; } return false; });
const title = p => p.evaluate(() => { const t = document.querySelector('#tour h2, .tour h2'); return t ? t.innerText.trim() : ''; });
(async () => {
  let errsAll = [];
  for (const [W, H] of [[390, 844], [320, 568]]) {
    const { b, p, errs } = await R.phone({ w: W, h: H, dpr: 1, mobile: true });
    await p.goto(PAGE); await w(1500);
    let card = null, split = null;
    for (let i = 0; i < 16 && !(card && split); i++) {
      await p.evaluate(() => { const set = (id, v) => { const e = document.getElementById(id); if (e && !e.value && !e.readOnly) { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); } };
        set('tourPay', 3200); set('tourBank', 1500); if (!document.getElementById('tourCardT')) set('tourAmt', 400);
        const c = [...document.querySelectorAll('input[name="tourBill"]')].find(x => /card/i.test(x.value)); if (c && !c.checked) c.click(); });
      await w(200);
      const at = await p.evaluate(() => ({ card: !!document.getElementById('tourCardT'), split: !!document.getElementById('jarSplit') }));
      if (at.card && !card) {
        const t0 = await title(p);
        card = await p.evaluate(() => { const tour = document.querySelector('#tour, .tour'), vis = e => !!e && !!(e.offsetParent || e.getClientRects().length);
          const full = tour.querySelector('[data-card-full]'), later = tour.querySelector('[data-card-later]');
          return { full: vis(full), fullLen: full ? full.textContent.trim().length : 0, later: vis(later), laterLen: later ? later.textContent.trim().length : 0,
            out: [...tour.querySelectorAll('.tour-body a, .tour-body [data-go], #tourBody a')].length, amt: (document.getElementById('tourAmt') || {}).value }; });
        ck(`${W}: the card step has a shown line for a card paid in full`, card.full && card.fullLen > 40, JSON.stringify(card));
        ck(`${W}: the card step has a shown line saying where the named places are, for after setup`, card.later && card.laterLen > 40, JSON.stringify(card));
        ck(`${W}: nothing in the card step leads out of setup`, card.out === 0, JSON.stringify(card));
        await next(p); await w(800);
        const t1 = await title(p), still = await p.evaluate(() => { const t = document.querySelector('#tour, .tour'); return !!t && !t.hidden && document.body.classList.contains('touring'); });
        ck(`${W}: Next with nothing typed moves on and stays in setup`, still && t1 && t1 !== t0, t0 + ' -> ' + t1);
        continue;
      }
      if (at.card) { /* typed nothing: the step after it */ }
      if (at.split && !split) {
        await w(400);
        split = await p.evaluate(() => { const vis = e => !!e && !!(e.offsetParent || e.getClientRects().length);
          const rows = [...document.querySelectorAll('#jarSplit [data-jrow]')], names = rows.map(r => r.querySelector('.split-h b').textContent.trim());
          const desc = rows.map(r => { const d = r.querySelector('.split-d'); return vis(d) ? d.textContent.trim() : ''; });
          const can = document.querySelector('.tour [data-split-can], #tour [data-split-can]'), rest = rows.length ? rows[0].querySelector('input[type=range]').max : '';
          const give = [...document.querySelectorAll('#jarPool select option')].map(o => o.textContent.trim()).filter(x => x && x !== '…');
          const r0 = rows.length ? rows[0].getBoundingClientRect() : null;
          return { n: rows.length, names, desc, can: vis(can), canLen: can ? can.textContent.trim().length : 0, rest, pool: document.querySelector('#jarPool .pool-t').textContent, why: document.getElementById('jarWhy').textContent, give,
            wide: document.getElementById('tourScroll').scrollWidth > document.getElementById('tourScroll').clientWidth + 1, inside: !!r0 && r0.right <= innerWidth + 1 }; });
        ck(`${W}: the split step shows five places`, split.n === 5, JSON.stringify(split.names));
        ck(`${W}: each of the five has a short line of its own`, split.desc.length === 5 && split.desc.every(d => d.length >= 8) && new Set(split.desc).size === 5, JSON.stringify(split.desc));
        ck(`${W}: a shown line says the sliders can be changed`, split.can && split.canLen > 20, JSON.stringify({ can: split.can, len: split.canLen }));
        ck(`${W}: with all given out, the line under the pot gives the same percent as the line under the sliders (${split.rest}%)`, split.pool.includes(split.rest + '%') && split.why.includes(split.rest + '%'), split.pool + ' || ' + split.why);
        ck(`${W}: "Give it to" uses the same five names`, JSON.stringify(split.give) === JSON.stringify(split.names), JSON.stringify(split.give));
        ck(`${W}: the split step is no wider than the screen`, !split.wide && split.inside);
      }
      if (!(await next(p))) break; await w(800);
    }
    ck(`${W}: the Credit card step was reached`, !!card); ck(`${W}: the Split the rest step was reached`, !!split);
    errsAll = errsAll.concat(errs); await b.close();
  }
  ck('no page errors', errsAll.length === 0, errsAll.join(' | '));
  console.log(bad ? 'H1 SETUP FAIL ' + bad : 'H1 SETUP PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('FAIL the test stopped: ' + e.message); console.log('H1 SETUP FAIL'); process.exit(1); });
