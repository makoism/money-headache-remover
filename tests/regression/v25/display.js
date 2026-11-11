/* Reads the numbers off the real screens (Plan, Goals, Receipts, Home) and compares them to the independent math in oracle.js */
const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { M, oracle, oracleGoal, oraclePercents, randomState, rnd, pick, ri, setSeed } = require('/tmp/v25/oracle.js');
setSeed(+(process.env.SEED || 1));
const w = ms => new Promise(r => setTimeout(r, ms));
const N = +(process.env.N || 20), PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthLabel = ym => MON[+ym.slice(5) - 1] + ' ' + ym.slice(0, 4), dateLabel = d => (+d.slice(8, 10)) + ' ' + MON[+d.slice(5, 7) - 1] + ' ' + d.slice(0, 4);
const fails = []; let checks = 0;
const eq = (m, a, b) => { checks++; if (a !== b) { if (fails.length < 60) fails.push(m + ': screen ' + JSON.stringify(a) + ' vs independent ' + JSON.stringify(b)); } };

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
    S.ui = Object.assign(S.ui, { setup: true, sampleHidden: true, done: { pay: true, bills: true, goals: true, receipts: true }, seen: { home: true, month: true, goals: true, receipts: true, basics: true } });
    const cur = S.ui.cur, pre = cur === 'none' ? '' : (/^[A-Za-z]{2,}$/.test(cur) ? cur + ' ' : cur);
    const F = n => { n = Math.round(n); return (n < 0 ? '−' : '') + pre + Math.abs(n).toLocaleString('en-US'); };
    const F2 = n => (Math.abs(n - Math.round(n)) < 0.005 ? F(n) : (n < 0 ? '−' : '') + pre + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
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
      eq(pt + 'where title', D.where, F(r.inflow) + ' pay, by jar'); eq(pt + 'dock', D.dock, F(r.left)); eq(pt + 'in', D.inT, F(r.inflow)); eq(pt + 'out', D.outT, F(r.outflow)); eq(pt + 'left', D.left, F(r.left));
      eq(pt + 'bank', D.bank, `Balance: ${F(r.bankStart)} to ${F(r.bankEnd)} this month.`); eq(pt + 'play (hero)', D.hero, F(r.jar.play));
      eq(pt + 'salary box', +String(D.sal).replace(/,/g, ''), r.a);
      const rest = Math.max(0, r.inflow - r.outflow), short = Math.max(0, r.outflow - r.inflow), base = short > 0 ? r.outflow : r.inflow;
      const vals = [r.jar.nec, r.goalsTotal, r.jar.play, r.jar.edu, r.jar.ffa, r.jar.give, rest], pc = oraclePercents(vals, base), showPct = base > 0 && !(short > 0);
      const names = M.JARS.map(j => j.name), exp = names.map((n, i) => [n, F(vals[i]), showPct ? pc[i] + '%' : '']);
      if (rest > 0) exp.push(['Left', F(rest), showPct ? pc[6] + '%' : '']); if (short > 0) exp.push(['Short by', F(short), '']);
      eq(pt + 'legend rows', JSON.stringify(D.legend), JSON.stringify(exp));
      if (showPct) eq(pt + 'legend percents add to 100', D.legend.reduce((a, x) => a + (parseInt(x[2]) || 0), 0), 100);
      /* goals tab */
      await p.evaluate(() => document.querySelector('#tab-goals').click()); await w(200);
      for (const g of S.plan.goals) {
        const G = await p.evaluate(id => ({ v: (document.querySelector('#jv-' + id) || {}).innerText, s: (document.querySelector('#js-' + id) || {}).innerText, n: (document.querySelector('#jt-' + id) || {}).innerText }), g.id);
        const go = oracleGoal(S, O, g.id, ym), bal = r.bal[g.id];
        eq(pt + g.id + ' goal amounts', G.v, g.target > 0 ? `${F(bal)} planned of ${F(g.target)}` : 'No goal amount yet');
        const lab = { ontrack: ['On track', `Full ${go.reached && monthLabel(go.reached)}`], behind: ['Behind', go.need != null ? `Needs ${F(go.need)} a month` : 'Will not be ready in time'], full: ['Full', ''], paid: ['Paid', `Due ${g.due && dateLabel(g.due)}`], short: ['Short', `Had ${F(go.had)} of ${F(g.target)} by ${g.due && dateLabel(g.due)}`], eta: ['Filling', `Full ${go.reached && monthLabel(go.reached)}`], noeta: ['Slow', `Not full within ${M.SPAN}`], unset: ['Unset', 'Edit goal to add an amount'] }[go.state];
        eq(pt + g.id + ' goal status', (G.s || '').trim(), lab[0]); if (lab[1]) eq(pt + g.id + ' goal note', (G.n || '').trim(), lab[1]);
      }
      /* receipts tab */
      await p.evaluate(() => document.querySelector('#tab-receipts').click()); await w(200);
      const list = S.receipts.filter(x => x.d.slice(0, 7) === ym);
      const R = await p.evaluate(() => ({ sum: (document.querySelector('#rcSum') || {}).textContent, rows: [...document.querySelectorAll('#rcCats tbody tr')].map(tr => [...tr.children].map(td => td.textContent)) }));
      const totC = list.reduce((a, x) => a + cents(x.a), 0), byKey = {}, byJar = {}; list.forEach(x => { byKey[x.c] = (byKey[x.c] || 0) + cents(x.a); const l = S.plan.lines.find(q => q.key === x.c); const j = l ? l.jar : 'other'; byJar[j] = (byJar[j] || 0) + cents(x.a); });
      let sum = list.length ? `${F2(totC / 100)} spent, ${list.length} receipt${list.length === 1 ? '' : 's'}.` : 'No receipts this month.';
      const playPlan = r.jar.play, playSpent = (byJar.play || 0) / 100;
      if (playPlan > 0 || playSpent > 0) { const diff = Math.round((playSpent - playPlan) * 100) / 100; sum += ` Play money: ${F2(playPlan)} planned, ${F2(playSpent)} spent, ` + (playSpent > playPlan ? `${F2(diff)} over.` : `${F2(Math.round((playPlan - playSpent) * 100) / 100)} left.`); }
      eq(pt + 'receipts summary', (R.sum || '').trim(), sum);
      const rows = [], known = new Set();
      r.lineVals.forEach(x => { known.add(x.key); const sp = (byKey[x.key] || 0) / 100; if (sp > 0 || (x.jar === 'play' && x.on)) rows.push([x.name, F(x.on ? x.v : 0), F2(sp), sp > (x.on ? x.v : 0) ? 'over ' + F2(Math.round((sp - (x.on ? x.v : 0)) * 100) / 100) : F2(Math.round(((x.on ? x.v : 0) - sp) * 100) / 100)]); });
      const others = Object.keys(byKey).filter(k => !known.has(k)); others.forEach(k => rows.push([k === 'other' ? 'Other' : (S.plan.lines.find(l => l.key === k) || { name: 'Other' }).name, '', F2(byKey[k] / 100), '']));
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
