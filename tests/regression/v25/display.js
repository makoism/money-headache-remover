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
    S.ui = Object.assign(S.ui, { toured: true, setup: true, sampleHidden: true, done: { pay: true, bills: true, goals: true, receipts: true }, seen: { home: true, month: true, goals: true, receipts: true, basics: true } });
    const cur = S.ui.cur, pre = cur === 'none' ? '' : (/^[A-Za-z]{2,}$/.test(cur) ? cur + ' ' : cur);
    const F = n => { n = Math.round(n); return (n < 0 ? '−' : '') + pre + Math.abs(n).toLocaleString('en-US'); };
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
      /* 38.29 to 38.31 rules, recounted from the plain words (none of the app's code):
         the split is "by place"; money borrowed from the emergency fund is named apart from pay;
         the dock shows how far real pay is from what the month plans (pay less borrowed money, less what spending past plan already used), as a size;
         the status is short when the bank ends under its minimum, tight when the month spends more than comes in;
         Free to spend shown is what is still safe: what is left of its plan, less what is held back to keep the bank at its minimum in a short month */
      const minBank = M.cfg(S, 'minBank'), st = r.bankEnd < minBank ? 'short' : (r.left < 0 ? 'tight' : 'good');
      let dk = r.left - r.draw; if (dk > 0) dk = Math.max(0, dk - r.overNow);
      const playSpentC = S.receipts.filter(x => x.d.slice(0, 7) === ym && (S.plan.lines.find(q => q.key === x.c) || {}).jar === 'play').reduce((a, x) => a + cents(x.a), 0);
      const pLeft = Math.round(r.jar.play * 100 - playSpentC) / 100, held = st === 'short' && !(Math.round((r.bankEnd - r.bankStart) * 100) > 0) ?   /* 38.31 money accuracy round, in step with expect_month.js */  Math.min(Math.max(0, pLeft), Math.max(0, minBank - r.bankEnd)) : 0;
      const safe = Math.max(pLeft < 0 ? pLeft : 0, Math.round((pLeft - held) * 100) / 100);
      eq(pt + 'where title', D.where, r.draw > 0 ? F2(r.inflow - r.draw) + ' pay and ' + F2(r.draw) + ' borrowed, by place' : F2(r.inflow) + ' pay, by place');   /* 38.31 number gate round 2: to the cent */ eq(pt + 'dock', D.dock, r.a + r.b + r.side > 0 || r.left < 0 ? F2(Math.abs(dk)) : ''); eq(pt + 'in', D.inT, F(r.inflow)); eq(pt + 'out', D.outT, F(r.outflow)); eq(pt + 'left', D.left, F(r.left));
      /* the bank line: with spending past plan so far it says the planned bank and what came off it; otherwise where the bank goes */
      eq(pt + 'bank', D.bank, r.over > 0 ? `Bank ends at ${F2(r.bankEnd)}: ${F2(r.bankPlanned)} planned, less ${F2(r.over)} spent over plan so far.` : Math.abs(r.bankStart - r.bankEnd) < 0.5 ? `Bank stays at ${F2(r.bankEnd)} this month.` : `Bank goes from ${F2(r.bankStart)} to ${F2(r.bankEnd)} this month.`); eq(pt + 'play (hero)', D.hero, F2(safe));
      eq(pt + 'salary box', +String(D.sal).replace(/,/g, ''), r.a);
      /* 38.31: percents are shares of real pay; borrowed money left over is not pay waiting to be placed; the last row is named by the case */
      const rest = Math.max(0, r.inflow - r.outflow), short = Math.max(0, r.outflow - r.inflow), realPay = r.inflow - r.draw, base = short > 0 ? r.outflow : (r.draw > 0 && realPay > 0 ? realPay : r.inflow);
      const restCover = Math.min(rest, r.draw), usedOver = Math.min(Math.max(0, rest - restCover), r.overNow), unplacedNet = Math.round((rest - restCover - usedOver) * 100) / 100;
      const vals = [r.jar.nec, r.goalsTotal, r.jar.play, r.jar.edu, r.jar.ffa, r.jar.give, rest - restCover], pc = oraclePercents(vals, base), showPct = base > 0 && !(short > 0);
      const names = M.JARS.map(j => j.name), exp = names.map((n, i) => [n, F2(vals[i]), showPct ? pc[i] + '%' : '']);
      if (unplacedNet >= 0.5) exp.push([restCover > 0 || usedOver > 0 ? 'Not placed yet' : 'Left', F2(unplacedNet), showPct && usedOver < 0.5 ? pc[6] + '%' : '']);
      if (usedOver >= 0.5) exp.push(['Used for spending past plan', F2(usedOver), '']);
      /* 38.31 Borrowed rows: emergency-fund money not needed by the plan, then emergency-fund money that pays for part of the plan (its percent is the part past 100) */
      if (rest > 0 && restCover > 0) exp.push(['Borrowed', F2(restCover), '']);
      const borrowUsed = short > 0 ? 0 : Math.max(0, r.draw - restCover), sumPct = pc.reduce((a, b) => a + b, 0);
      if (borrowUsed >= 0.5) exp.push(['Borrowed', F2(borrowUsed), showPct && base === realPay && sumPct > 100 ? (sumPct - 100) + '%' : '']);
      if (short > 0) exp.push([r.draw > 0 ? 'Still over after borrowing' : st === 'tight' ? 'Over pay by' : 'Short by', F2(short), '']);
      eq(pt + 'legend rows', JSON.stringify(D.legend), JSON.stringify(exp));
      if (showPct && !(r.draw > 0) && usedOver < 0.5) eq(pt + 'legend percents add to 100', D.legend.reduce((a, x) => a + (parseInt(x[2]) || 0), 0), 100);   /* with borrowed money they add to 100 + borrowed (oracle.js checks that rule) */
      /* goals tab */
      await p.evaluate(() => { document.querySelector('#tab-month').click(); const sb = [...document.querySelectorAll('[data-tab-go="goals"][data-sub="goals"]')].find(x => x.offsetParent); sb.click(); }); await w(300);
      for (const g of S.plan.goals) {
        const G = await p.evaluate(id => ({ v: (document.querySelector('#jv-' + id) || {}).innerText, s: (document.querySelector('#js-' + id) || {}).innerText, n: (document.querySelector('#jt-' + id) || {}).innerText }), g.id);
        const go = oracleGoal(S, O, g.id, ym), bal = r.bal[g.id];
        eq(pt + g.id + ' goal amounts', G.v, g.target > 0 ? `${F(bal)} of ${F(O.cap(g))}` /* 38.31 wording; the target is the longer goal once the person said yes to it */ : 'No goal amount yet');
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
      if (playPlan > 0 || playSpent > 0) { const diff = Math.round((playSpent - playPlan) * 100) / 100; sum += ` Free to spend: ${F2(playPlan)} planned, ${F2(playSpent)} spent, ` + (playSpent > playPlan ? `${F2(diff)} over.` : `${F2(safe)} safe to spend.`); }
      eq(pt + 'receipts summary', (R.sum || '').trim(), sum);
      const rows = [], known = new Set();
      /* 38.30 cells: Free to spend shows what is still safe; Investing is never spent (shows "saved"); past plan in Education or Giving is
         split into what its own pile covered and what the bank paid (oracle r.ovB); anything else past plan is "over" */
      const cell = (x, plan, sp) => { if (sp > plan) { const over = Math.round((sp - plan) * 100) / 100; if (x.jar !== 'edu' && x.jar !== 'give') return 'over ' + F2(over);
          const bank = Math.round(Math.min(over, (r.ovB || {})[x.jar] || 0) * 100) / 100, pile = Math.round((over - bank) * 100) / 100;
          return (pile > 0 ? 'from the pile ' + F2(pile) : '') + (pile > 0 && bank > 0 ? ', ' : '') + (bank > 0 ? (pile > 0 ? '' : 'over ') + F2(bank) + (pile > 0 ? ' over' : '') : ''); }
        if (x.key === 'envelope' && x.on) return F2(safe); if (x.jar === 'ffa') return 'saved'; return F2(Math.round((plan - sp) * 100) / 100); };
      r.lineVals.forEach(x => { known.add(x.key); const sp = (byKey[x.key] || 0) / 100; const plan = x.on ? x.v : 0; if (sp > 0 || (x.jar === 'play' && x.on)) rows.push([x.name, F(plan), F2(sp), cell(x, plan, sp)]); });
      const others = Object.keys(byKey).filter(k => !known.has(k)); others.forEach(k => { const sp = byKey[k] / 100, past = Math.round((sp - (k === 'other' ? r.items : 0)) * 100) / 100;
        /* 38.30 rule: Other spending is past plan only beyond the month's one-time costs (money already set aside) */
        const it = k === 'other' && r.items > 0 ? r.items : null; rows.push([k === 'other' ? 'Other' : (S.plan.lines.find(l => l.key === k) || { name: 'Other' }).name, it == null ? '' : F(it), F2(sp), it == null ? 'over ' + F2(sp) : past > 0 ? 'over ' + F2(past) : F2(Math.round((it - sp) * 100) / 100)]); });
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
