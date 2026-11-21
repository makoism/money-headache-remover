/* script_percents: guards the number finding that came back in rounds 2 to 4 (number gate, money accuracy, novice): percents and sums
   that do not agree with what the same screen says. On made-up plans with cents (an ordinary month, an overspent one, and one where every
   place is about a tenth of pay, so rounding is at its hardest) this checks:
   (1) Plan, "pay, by place": the places' percents add to 100 when they show, each is its amount over pay within 1 point, and the
       amounts add to the pay in the title, to the cent;
   (2) "Bills and basics are N% of pay" and "Goals get $X this month, N% of pay" say the same as the Bills and Goals rows;
   (3) every goal "N% full" on Home is within 1 point of saved over target, never above it, and never 100 before the goal is full;
       Home's "most full, N%" names the same N as that goal's tile;
   (4) the Settings guide percents add to 100;
   (5) Home: Bank at month end plus every burrow tile equals Total, and the burrow tiles add to Saved; every "$A + $B = $C" sentence adds up.
   Run: node tests/qc/script_percents.js */
const K = require('./script_lib.js'); const { ck, done } = K.report();
const num = t => { const m = String(t).match(/([−-]?)\u2060?\$([\d,]+(?:\.\d+)?)/); return m ? +m[2].replace(/,/g, '') * (m[1] ? -1 : 1) : NaN; };
const near = (a, b) => Math.abs(a - b) < 0.005;
const screen = name => K.SCREENS.find(s => s[0] === name)[1];
(async () => {
  const { b, p, errs } = await K.open({});
  for (const st of ['cents', 'over', 'tenths']) {
    if (st === 'over') await K.state(p, 'over');
    if (st === 'tenths') {
      await K.L.base(p, { pay: 997.3, bank: 500, min: 0, defs: { 'bill:rent': 100.15, 'bill:food': 99.7, envelope: 99.95, education: 99.65, invest: 99.85, give: 99.75 }, tT: 3000, tM: 99.9, eT: 2000, eS: 1999.5, eM: 0.25 });
      await K.state(p, 'cents-done');
    }
    /* (1) and (2) Plan, Month */
    await screen('Plan / Month')(p);
    const pm = await p.evaluate(() => ({ title: document.getElementById('whereTitle').innerText, note: document.getElementById('jarNote').innerText,
      rows: [...document.querySelectorAll('#legend .lg')].map(r => ({ name: r.querySelector('span').childNodes[0].textContent.trim(), neg: r.classList.contains('neg'), v: r.querySelector('b').innerText, pct: r.querySelector('em').innerText })) }));
    const pay = num(pm.title), withPct = pm.rows.filter(r => r.pct);
    const pctSum = withPct.reduce((a, r) => a + parseInt(r.pct), 0);
    if (withPct.length) ck(`${st}: Plan places' percents add to 100 (${withPct.map(r => r.pct).join(' + ')})`, pctSum === 100);
    const off = withPct.filter(r => Math.abs(parseInt(r.pct) - num(r.v) / pay * 100) >= 1);
    ck(`${st}: each place's percent is its amount over the pay (${pm.title}) within 1 point`, off.length === 0, off.map(r => `${r.name} ${r.v} shows ${r.pct}, exact ${(num(r.v) / pay * 100).toFixed(2)}%`).join(' | '));
    if (!/borrowed/.test(pm.title)) {
      /* every row is part of the pay except Borrowed; a red "Short by" row is planned past the pay, so it comes off */
      const placed = pm.rows.filter(r => !/^Borrowed/.test(r.name)).reduce((a, r) => a + (r.neg ? -1 : 1) * num(r.v), 0);
      ck(`${st}: the rows add to the pay in the title (${placed.toFixed(2)} vs ${pay})`, near(placed, pay), pm.rows.map(r => r.name + ' ' + r.v).join(', '));
      const payRows = pm.rows.filter(r => !r.neg && !/^Borrowed/.test(r.name) && num(r.v) >= 0.5);
      if (withPct.length) ck(`${st}: when percents show, every part of the pay has one (${payRows.map(r => r.name + ' ' + (r.pct || 'none')).join(', ')})`, payRows.every(r => r.pct));
    }
    const bills = pm.rows.find(r => /^Bills/.test(r.name)), m2 = pm.note.match(/Bills and basics are (\d+)%/);
    if (m2 && bills && bills.pct) ck(`${st}: "Bills and basics are ${m2[1]}%" matches the Bills row (${bills.pct})`, m2[1] + '%' === bills.pct);
    await screen('Plan / Goals')(p);
    const gs = await p.evaluate(() => document.getElementById('goalsSub').innerText), goals = pm.rows.find(r => /^Goals/.test(r.name)), m3 = gs.match(/Goals get (\S+) this month(?:, (\d+)% of pay)?/);
    if (m3 && goals) ck(`${st}: "${gs}" matches the Goals row (${goals.v}, ${goals.pct || 'no percent'})`, num(m3[1]) === num(goals.v) && (m3[2] ? m3[2] + '%' : '') === (goals.pct || ''));
    /* (3) goal percents on Home against the plan's own targets */
    await screen('Home (More open)')(p);
    const home = await p.evaluate(() => document.body.innerText);
    const tg = await p.evaluate(() => __t.S.plan.goals.map(g => ({ name: g.name, target: g.target })));
    for (const g of tg) {
      const m = home.match(new RegExp(g.name + '\\n\\$([\\d,.]+), (\\d+)% full')); if (!m || !(g.target > 0)) continue;
      const exact = +m[1].replace(/,/g, '') / g.target * 100, shown = +m[2];
      ck(`${st}: Home "${g.name} $${m[1]}, ${shown}% full" is within 1 point of ${exact.toFixed(2)}%, not above it, not 100 early`, shown <= exact + 1e-9 && exact - shown < 1 && (shown < 100 || exact >= 100));
    }
    const mf = home.match(/([^\n]+?) is the most full, (\d+)%/);
    if (mf) { const card = home.match(new RegExp(mf[1] + '\\n\\$[\\d,.]+, (\\d+)% full')); ck(`${st}: "most full, ${mf[2]}%" matches the ${mf[1]} tile`, !!card && card[1] === mf[2], card ? card[0] : 'tile not found'); }
    /* (5) Home sums */
    const lines = home.split('\n').map(s => s.trim()).filter(Boolean);
    const i0 = lines.indexOf('Bank at month end'), i1 = lines.indexOf('Total', i0);
    if (i0 >= 0 && i1 > i0) {
      let sum = 0, tiles = 0; const parts = [];
      for (let i = i0; i < i1; i++) if (/^(?:[−-]\u2060?)?\$/.test(lines[i])) { sum += num(lines[i]); parts.push(lines[i - 1] + ' ' + lines[i]); if (i > i0 + 1) tiles += num(lines[i]); }
      ck(`${st}: Home bank plus burrows (${parts.join(', ')}) = Total ${lines[i1 + 1]}`, near(sum, num(lines[i1 + 1])), sum.toFixed(2));
      const sv = lines.indexOf('Saved'); if (sv > 0) ck(`${st}: Home burrow tiles add to Saved ${lines[sv + 1]} (${tiles.toFixed(2)})`, near(tiles, num(lines[sv + 1])));
    } else ck(`${st}: Home shows Bank at month end ... Total`, false, 'not found');
    for (const s of K.SCREENS) {
      await s[1](p); const t = await p.evaluate(() => document.body.innerText);
      for (const m of t.matchAll(/((?:[−-]\u2060?)?\$[\d,.]+) \+ [a-z ]*((?:[−-]\u2060?)?\$[\d,.]+) = ((?:[−-]\u2060?)?\$[\d,.]+)/g)) ck(`${st}, ${s[0]}: "${m[0]}" adds up`, near(num(m[1]) + num(m[2]), num(m[3])));
    }
  }
  /* (4) Settings guide */
  await K.L.settings(p);
  const guide = await p.evaluate(() => { const t = document.body.innerText; const a = t.indexOf('Where your pay goes'); return t.slice(a, a + 1500); });
  const gp = [...guide.matchAll(/^(\d+)%$/gm)].map(m => +m[1]);
  ck(`Settings guide percents add to 100 (${gp.join(' + ')})`, gp.length >= 3 && gp.reduce((a, x) => a + x, 0) === 100);
  ck('no page errors', errs.length === 0, errs.join(' | ')); await b.close(); done();
})();
