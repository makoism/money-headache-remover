/* Reads the numbers off the real screens (Plan, Goals, Receipts, Home) and compares them to the independent math in oracle.js */
const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { M, oracle, oracleGoal, oraclePercents, randomState, rnd, pick, ri, setSeed } = require('/tmp/v25/oracle.js');
setSeed(+(process.env.SEED || 1));
const w = ms => new Promise(r => setTimeout(r, ms));
const N = +(process.env.N || 20), PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthLabel = ym => MON[+ym.slice(5) - 1] + ' ' + ym.slice(0, 4), dateLabel = d => (+d.slice(8, 10)) + ' ' + MON[+d.slice(5, 7) - 1] + ' ' + d.slice(0, 4);
const fails = []; let checks = 0;
/* the app joins a minus sign to its amount with a word joiner (U+2060, no width); it is not part of the words or the number */
const eq = (m, a, b) => { checks++; if (typeof a === 'string') a = a.replace(/\u2060/g, ''); if (a !== b) { if (fails.length < 60) fails.push(m + ': screen ' + JSON.stringify(a) + ' vs independent ' + JSON.stringify(b)); } };

/* receipts in whole cents, so the independent total can never pick up a float error */
const cents = x => Math.round(x * 100);
function randomReceipts(S) {
  const out = [], keys = S.plan.lines.map(l => l.key).concat(['other']), n = pick([0, 0, 3, 8, 20]);
  for (let i = 0; i < n; i++) {
    const ym = pick(M.MONTHS.slice(0, 4)), c = pick(keys), l = S.plan.lines.find(x => x.key === c);
    const a = pick([0.1, 0.2, 19.99, 4.5, 0.05, 1234.56, 99.99, 10, 250, 7.77, 0.01]) + (rnd() < .5 ? ri(0, 300) : 0);
    out.push({ id: 'r' + i, d: ym + '-' + String(ri(1, 28)).padStart(2, '0'), a: Math.round(a * 100) / 100, c: l ? c : 'other', cn: l ? l.name : 'Other', n: c === 'other' ? 'Vet bill' : '' });
  }
  return out;
}
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  for (let t = 0; t < N; t++) {
    const S = randomState();
    if (t % 7 === 3) S.ui.cur = 'CHF'; if (t % 11 === 5) S.ui.cur = 'none';
    S.receipts = randomReceipts(S);
    S.ui = Object.assign(S.ui, { toured: true, setup: true, sampleHidden: true, done: { pay: true, bills: true, goals: true, receipts: true }, seen: { home: true, month: true, goals: true, receipts: true, basics: true } });
    const cur = S.ui.cur, pre = cur === 'none' ? '' : (/^[A-Za-z]{2,}$/.test(cur) ? cur + ' ' : cur);
    const F = n => { n = Math.round(n); return (n < 0 ? '−' : '') + pre + Math.abs(n).toLocaleString('en-US'); };
    const FC = n => (n < 0 ? '−' : '') + pre + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), hasCents = n => typeof n === 'number' && Math.abs(n - Math.round(n)) >= 0.005;
    const F2 = n => (Math.abs(n - Math.round(n)) < 0.005 ? F(n) : (n < 0 ? '−' : '') + pre + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    /* items meet Other: in some plans log Other spending in a month that has one-time costs, within and past them */
  if (rnd() < .6) { const ym0 = M.MONTHS[3], amt = ri(500, 90000); S.items[ym0] = [{ id: 'it1', label: 'Repair', amount: amt }]; S.receipts.push({ id: 'rit', d: ym0 + '-09', a: Math.max(1, Math.round(amt * (rnd() < .5 ? .6 : 1.3))), c: 'other', cn: 'Other', n: '' }); }
  const O = oracle(S), tag = '#' + t + ' ' + cur;
    const p = await b.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message.slice(0, 100)));
    await p.setViewport({ width: 1100, height: 900 });
    await p.evaluateOnNewDocument(st => { localStorage.setItem('money-map-template-v2', st); }, JSON.stringify(S));
    await p.goto('file://' + PAGE + '#2026-11', { waitUntil: 'load' }); await w(700);
    await p.evaluate(() => { const b = document.querySelector('#co:not([hidden]) #coSkip'); if (b) b.click(); });
    const months = [M.START, M.MONTHS[3], M.MONTHS[11], M.MONTHS[23]];
    for (const ym of months) {
      const r = O.rows.find(x => x.ym === ym), pt = tag + ' ' + ym + ' ';
      await p.evaluate(() => document.querySelector('#tab-month').click());
      await p.evaluate(ym => { const s = document.querySelector('#monthSel'); s.value = ym; s.dispatchEvent(new Event('change', { bubbles: true })); }, ym); await w(250);
      const D = await p.evaluate(() => {
        const q = s => (document.querySelector(s) || {}).textContent;
        return { where: q('#whereTitle'), dock: q('#dockNum'), inT: q('#inTotal'), outT: q('#outTotal'), left: q('#leftTotal'), bank: q('#bankLine'), hero: q('#heroNum'),
          legend: [...document.querySelectorAll('#legend .lg')].map(x => [x.querySelector('span').firstChild.textContent, x.querySelector('b').textContent, x.querySelector('em').textContent]),
          sal: (document.querySelector('#i-a') || {}).value };
      });
      /* 38.29 to 38.31 rules, recounted from the plain words (none of the app's code), shared with monkey.js in expect_month.js */
      const X = require(__dirname + '/expect_month.js')({ S, O, r, ym, M, oraclePercents, F, F2 }), safe = X.safe;
      eq(pt + 'where title', D.where, X.where); eq(pt + 'dock', D.dock, X.dock); eq(pt + 'in', D.inT, F2(r.inflow)); eq(pt + 'out', D.outT, F2(r.outflow)); eq(pt + 'left', D.left, F2(r.left));   /* to the cent, as the screen writes them */
      eq(pt + 'bank', D.bank, X.bank); eq(pt + 'play (hero)', D.hero, X.hero);
      eq(pt + 'salary box', +String(D.sal).replace(/,/g, ''), r.a);
      eq(pt + 'legend rows', JSON.stringify(D.legend), JSON.stringify(X.legend));
      if (X.pctMustBe100) eq(pt + 'legend percents add to 100', D.legend.reduce((a, x) => a + (parseInt(x[2]) || 0), 0), 100);   /* with borrowed money they add to 100 + borrowed (oracle.js checks that rule) */
      /* goals tab */
      await p.evaluate(() => { document.querySelector('#tab-month').click(); const sb = [...document.querySelectorAll('[data-tab-go="goals"][data-sub="goals"]')].find(x => x.offsetParent); sb.click(); }); await w(300);
      for (const g of S.plan.goals) {
        const G = await p.evaluate(id => ({ v: (document.querySelector('#jv-' + id) || {}).innerText, s: (document.querySelector('#js-' + id) || {}).innerText, n: (document.querySelector('#jt-' + id) || {}).innerText }), g.id);
        const go = oracleGoal(S, O, g.id, ym), bal = r.bal[g.id];
        eq(pt + g.id + ' goal amounts', G.v, X.goalAmount(g));   /* the target is the longer goal once the person said yes to it */
        const lab = { ontrack: ['On track', `Full ${go.reached && monthLabel(go.reached)}`], behind: ['Behind', go.need != null ? `Needs ${F(go.need)} a month` : 'Will not be ready in time'], full: ['Full', ''], paid: ['Paid', `Due ${g.due && dateLabel(g.due)}`], short: ['Short', `Had ${F(go.had)} of ${F(g.target)} by ${g.due && dateLabel(g.due)}`], eta: ['Filling', `Full ${go.reached && monthLabel(go.reached)}`], noeta: ['Slow', `Not full within ${M.SPAN}`], unset: ['Unset', 'Edit goal to add an amount'] }[go.state];
        eq(pt + g.id + ' goal status', (G.s || '').trim(), lab[0]); if (lab[1]) eq(pt + g.id + ' goal note', (G.n || '').trim(), lab[1]);
      }
      /* receipts tab */
      await p.evaluate(() => document.querySelector('#tab-receipts').click()); await w(200);
      const list = S.receipts.filter(x => x.d.slice(0, 7) === ym);
      const R = await p.evaluate(() => ({ sum: (document.querySelector('#rcSum') || {}).textContent, rows: [...document.querySelectorAll('#rcCats tbody tr')].map(tr => [...tr.children].map(td => td.textContent)) }));
      const totC = list.reduce((a, x) => a + cents(x.a), 0), byKey = {}, byJar = {}; list.forEach(x => { byKey[x.c] = (byKey[x.c] || 0) + cents(x.a); const l = S.plan.lines.find(q => q.key === x.c); const j = l ? l.jar : 'other'; byJar[j] = (byJar[j] || 0) + cents(x.a); });
      /* QC round 4 north-star 1: a month other than this one is named; 38.31 number gate round 8 finding 4: every amount in the sentence is written the
         same way, all with cents when any has cents (the numbers stay the independent ones) */
      const nowYm = (() => { const d = new Date(), x = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); return x < M.START ? M.START : x > M.MONTHS[M.MONTHS.length - 1] ? M.MONTHS[M.MONTHS.length - 1] : x; })();
      const playPlan = r.jar.play, playSpent = (byJar.play || 0) / 100, diff = Math.round((playSpent - playPlan) * 100) / 100, third = playSpent > playPlan ? diff : safe;
      const S2 = [totC / 100, playPlan, playSpent, third].some(hasCents) ? FC : F2;
      let sum = list.length ? `${F2(totC / 100)} spent, ${list.length} receipt${list.length === 1 ? '' : 's'}.` : ym === nowYm ? 'No receipts this month.' : `No receipts in ${monthLabel(ym)}${ym > nowYm ? ' yet' : ''}.`;
      if (playPlan > 0 || playSpent > 0) { sum = (list.length ? `${S2(totC / 100)} spent, ${list.length} receipt${list.length === 1 ? '' : 's'}.` : sum) + ` Free to spend: ${S2(playPlan)} planned, ${S2(playSpent)} spent, ` + (playSpent > playPlan ? `${S2(diff)} over.` : `${S2(safe)} safe to spend.`); }
      eq(pt + 'receipts summary', (R.sum || '').trim(), sum);
      const rows = [], known = new Set();
      /* 38.30 cells: Free to spend shows what is still safe; Investing is never spent (shows "saved"); past plan in Education or Giving is
         split into what its own pile covered and what the bank paid (oracle r.ovB); anything else past plan is "over" */
      /* 38.31 number gate round 8: "X over" (the word after the amount); one table, one way of writing amounts: all with cents when any amount
         a row works with has cents (QC round 11 numbers 3); Education's line shows as "Education" */
      const r2 = v => Math.round(v * 100) / 100, nums = [], tab = [];
      const cell = (x, plan, sp) => { if (sp > plan) { const over = r2(sp - plan); if (x.jar !== 'edu' && x.jar !== 'give') { nums.push(over); return f => f(over) + ' over'; }
          const bank = r2(Math.min(over, (r.ovB || {})[x.jar] || 0)), pile = r2(over - bank); nums.push(over, bank, pile);
          return f => (pile > 0 ? 'from the pile ' + f(pile) : '') + (pile > 0 && bank > 0 ? ', ' : '') + (bank > 0 ? f(bank) + ' over' : ''); }
        nums.push(r2(plan - sp)); if (x.key === 'envelope' && x.on) { nums.push(safe); return f => f(safe); } if (x.jar === 'ffa') return () => 'saved'; return f => f(r2(plan - sp)); };
      r.lineVals.forEach(x => { known.add(x.key); const sp = (byKey[x.key] || 0) / 100; const plan = x.on ? x.v : 0; if (sp > 0 || (x.jar === 'play' && x.on)) { nums.push(plan, sp); tab.push([x.name === 'Courses and books' ? 'Education' : x.name, plan, sp, cell(x, plan, sp)]); } });
      const others = Object.keys(byKey).filter(k => !known.has(k)); others.forEach(k => { const sp = byKey[k] / 100, past = r2(sp - (k === 'other' ? r.items : 0));
        /* 38.30 rule: Other spending is past plan only beyond the month's one-time costs (money already set aside); with none its plan reads 0 */
        const it = k === 'other' && r.items > 0 ? r.items : null; nums.push(sp); if (it != null) nums.push(it, past > 0 ? past : r2(it - sp));
        tab.push([k === 'other' ? 'Other' : (S.plan.lines.find(l => l.key === k) || { name: 'Other' }).name, it == null ? 0 : it, sp, f => it == null ? f(sp) + ' over' : past > 0 ? f(past) + ' over' : f(r2(it - sp))]); });
      const tf = nums.some(hasCents) ? FC : F2; tab.forEach(([n, plan, sp, c]) => rows.push([n, tf(plan), tf(sp), c(tf)]));
      if (list.length) eq(pt + 'receipts table', JSON.stringify(R.rows), JSON.stringify(rows)); else eq(pt + 'receipts table empty', R.rows.length, 0);
    }
    eq(tag + ' page errors', errs.join(' | '), '');
    await p.close();
  }
  await b.close();
  console.log('plans on screen', N, '| screen checks', checks, '| mismatches', fails.length);
  fails.forEach(f => console.log('  ', f));
  process.exit(fails.length ? 1 : 0);
})();
