/* A figure with the same name shows the same amount wherever it is written: Home (More open), Plan (Month, Burrows, All months),
   Receipts and Settings. Every amount is read off the screen, never from storage, in several made-up situations, one of them Mako's shape
   (one bank, two cards, pay on the 10th). For each named figure the test collects every place that writes it and fails when two differ.
   A name found in one place only is a NOTE. A name found nowhere in any situation fails (the wording moved: update NAMES).
   Not checked here, because other scripts own it: "not placed" (number_gate2, numbers_round4, number_findings), goal percents (goal_agree),
   bank + burrows = total against the recount (home_map), Home against the model (home_dom), now and planned labels (v1_home).
   Known findings: tests/qc/label_agree.known, one pattern per line; a listed line that passes again fails the run.
   Made-up numbers. Run: node tests/qc/label_agree.js      (about 1 minute) */
const fs = require('fs'), path = require('path');
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
const BUILD = process.env.BUILD || '/home/claude/work/money-map-team.html';
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* ---- the named figures. Each pattern has one (M): the amount. X.mon is "Nov", X.month is "Nov 2026". ---- */
const NAMES = X => {
  const M = '([-−]?' + esc(X.cur) + '[\\d,]+(?:\\.\\d+)?)', m = '[-−]?' + esc(X.cur) + '[\\d,]+(?:\\.\\d+)?';
  const r = (s, f) => new RegExp(s.replace(/\(M\)/g, M).replace(/@/g, m), f || 'm');   /* (M) is the amount read, @ is any other amount */
  const names = {
    'Bank now': [r('^In your bank now(?: now)?\\n(M)$'), r('^Money today[^\\n]*= (M)$')],
    'Bank at the end of this month': [r('^Bank at month end\\n(M)$'), r('^Bank (M) \\+ burrows'), r('to (M) this month\\.$'), r('^(?:Your bank|Bank) ends at (M)[ :]'), r('^' + X.month + '\\t@\\t(M)$')],
    'Free to spend, safe to spend': [r('^Free to spend\\n(M)\\nsafe to spend$'), r('^Free to spend\\n(M)\\nplanned: safe to spend'), r('^Free to spend in [A-Z][a-z]+ \\d+\\n(M)$'),
      r('^Free to spend: (M) left'), r('^(M)\\nFree to spend\\nPlanned'), r('(M) safe to spend\\. See receipts'), r('spent, (M) safe to spend\\.$'), r('^Free to spend\\t@\\t@\\t(M)$'), r('(M) is free to spend\\.')],
    'Free to spend, planned': [r('^Planned (M) this month'), r('^Free to spend\\nFun, no guilt\\n(M)$'), r('Free to spend: (M) planned'), r('^Free to spend\\t(M)\\t@\\t@$'), r('^Spent @ of (M)\\.')],
    'Free to spend, spent': [r('^Spent (M) of @\\.'), r('^Receipts: (M) spent'), r('planned, (M) spent,'), r('^Free to spend\\t@\\t(M)\\t@$')],
    'Bills and basics, planned': [r('^Bills and basics\\nBills\\n(M)$'), r('^Money out\\n@\\nBills and basics\\n(M)$'), r('enough for (M) of bills')],
    'Bills left to pay': [r('^Bills and basics\\n(M)\\nleft to pay'), r('^Bills left\\n(M)$')],
    'Saved in burrows': [r('^Saved\\n(M)\\nplanned'), r('\\+ burrows (M) =')],
    'Total': [r('^Total\\n(M)$'), r('= (M) at the end of')],
    'Goal burrows this month': [r('^Goal burrows\\n[^\\n' + esc(X.cur) + ']*\\n(M)\\n\\d+%$'), r('^Goal burrows\\n(M)$'), r('^Goals get (M) this month')],
    'Owed at the start of this month': [r('^Owed at the start of [A-Z][a-z]+\\n(M)$'), r('^(M) owed at the start of')],
    'Card and loan payments this month': [r('^You pay (M) this month'), r('^Cards and loans\\n(M)$')],
    'Interest this month': [r('this month, (M) of it interest'), r('(M) interest this month\\.')],
  };
  X.goals.forEach(g => { names['Burrow ' + g] = [r('^' + esc(g) + '\\n(M)$'), r('^' + esc(g) + '\\n(M), \\d+% full$'), r('^' + esc(g) + '\\n(M) of @$')].concat(X.main === g ? [r('^(M) of @\\n\\d+%$')] : []); });
  ['Education', 'Investing', 'Giving'].forEach(g => { names['Burrow ' + g] = [r('^' + g + '\\n(M)\\n(?!left of)')]; });   /* not the "left of this month's" card, a different figure */
  return names;
};

/* ---- the made-up situations ---- */
const SITS = [
  { tag: 'dollars, one card, two receipts', at: '2026-11-20T10:00:00', cur: '$',
    base: { pay: 3200, bank: 1500, min: 200, defs: { 'bill:rent': 1100, 'bill:food': 400, envelope: 300, education: 50, invest: 100, give: 30 }, tT: 1200, tM: 150, eT: 5000, eS: 900, eM: 200 },
    debts: [{ id: 'd1', name: 'Card', kind: 'card', balance: 1800, apr: 18, min: 60, extra: 0 }],
    rc: [['2026-11-03', 42.5, 'envelope'], ['2026-11-04', 380, 'bill:food']] },
  { tag: 'yen, spent past the plan, overdrawn', at: '2026-11-24T10:00:00', cur: '¥',
    base: { pay: 300000, bank: -20000, min: 20000 },
    rc: [['2026-11-02', 52000, 'envelope'], ['2026-11-05', 61000, 'bill:food'], ['2026-11-09', 7000, 'other']] },
  { tag: "Mako's shape: one bank, two cards, the day before pay day", at: '2026-12-09T10:00:00', cur: '¥',
    base: { pay: 410000, bank: 96000, min: 30000, defs: { 'bill:rent': 120000, 'bill:food': 60000, envelope: 50000, education: 10000, invest: 30000, give: 5000 }, tT: 240000, tM: 20000, eT: 900000, eS: 150000, eM: 30000 },
    debts: [{ id: 'd1', name: 'Card one', kind: 'card', balance: 84000, apr: 15, min: 84000, extra: 0 }, { id: 'd2', name: 'Card two', kind: 'card', balance: 37500, apr: 15, min: 37500, extra: 0 }],
    cards: [{ id: 'c1', name: 'Card one', owed: 84000, payDay: 10, at: '2026-12-08' }, { id: 'c2', name: 'Card two', owed: 37500, payDay: 11, at: '2026-12-08' }],
    rc: [['2026-12-01', 3200, 'envelope'], ['2026-12-04', 18400, 'bill:food'], ['2026-11-12', 41000, 'envelope']] },
  { tag: 'euros with cents, four months in', at: '2027-02-15T10:00:00', cur: '€',
    base: { pay: 2840.5, bank: 912.37, min: 150, defs: { 'bill:rent': 980.25, 'bill:food': 320, envelope: 260.4, education: 35, invest: 80, give: 12.5 }, tT: 900, tM: 75.5, eT: 4000, eS: 610.2, eM: 120 },
    debts: [{ id: 'd1', name: 'Loan', kind: 'loan', balance: 2400, apr: 6, min: 110, extra: 0 }],
    rc: [['2027-02-02', 18.99, 'envelope'], ['2027-02-06', 64.3, 'bill:food'], ['2027-01-15', 250, 'envelope']] },
];

const num = s => +String(s).replace('−', '-').replace(/[^\d.\-]/g, '');
async function screens(p) {
  const out = {}, txt = () => p.evaluate(() => document.body.innerText.split('\n').map(s => s.trim()).filter(Boolean).join('\n'));
  await L.tab(p, 'tab-home'); await w(400);
  await p.evaluate(() => { const m = [...document.querySelectorAll('button,summary')].find(e => /^More\b/.test(e.innerText.trim()) && (e.offsetParent || e.getClientRects().length)); m && m.click(); }); await w(500);
  out.Home = await txt();
  await L.tab(p, 'tab-month'); await L.clickText(p, 'Month'); await w(400); out['Plan, Month'] = await txt();
  await L.clickText(p, 'Burrows'); await w(500); out['Plan, Burrows'] = await txt();
  await L.clickText(p, 'All months'); await w(500); out['Plan, All months'] = await txt();
  await L.clickText(p, 'Month'); await w(300);
  await L.tab(p, 'tab-receipts'); await w(500); out.Receipts = await txt();
  await L.settings(p);
  /* Settings writes its amounts in boxes: read each box with its label, as "label = amount" */
  out.Settings = await p.evaluate(cur => [...document.querySelectorAll('input')].filter(e => (e.offsetParent || e.getClientRects().length) && e.value !== '' && /^[-−]?[\d,.]+$/.test(e.value)).map(e => {
    const lab = (e.labels && e.labels[0]) || (e.id && document.querySelector('label[for="' + e.id + '"]')) || e.closest('label') || e.parentElement.parentElement;
    const neg = /^[-−]/.test(e.value) ? '-' : '';
    return (lab ? lab.innerText.split('\n')[0].trim() : '(no label)') + ' = ' + neg + cur + e.value.replace(/^[-−]/, '');
  }).join('\n'), await p.evaluate(() => __t.S.ui.cur));
  await p.evaluate(() => { const h = [...document.querySelectorAll('button,a')].find(e => /Home$/.test(e.innerText.trim()) && e.offsetParent); h && h.click(); }); await w(300);
  return out;
}

(async () => {
  const lines = [], found = {}, say = s => { lines.push(s); console.log(s); };
  for (const sit of SITS) {
    const { b, p, errs } = await R.phone({ w: 390, h: 844, dpr: 1, mobile: true, keep: true });
    await p.evaluateOnNewDocument(at => { const real = Date, fixed = new real(at).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, sit.at);
    await p.goto('file://' + BUILD + '?sfxtest'); await w(1300);
    await p.evaluate(() => { const s = document.getElementById('tourSkip'); s && s.click(); }); await w(400); await p.evaluate(() => { const s = document.getElementById('coSkip'); s && s.click(); }); await w(400);
    await L.zero(p); await p.evaluate(c => { __t.S.ui.cur = c; }, sit.cur); await L.base(p, sit.base);
    /* Set all to zero opens setup again a moment later: close it and write the situation twice, as v1_home.js does */
    for (let k = 0; k < 2; k++) {
      await w(500); for (let i = 0; i < 3; i++) { await p.evaluate(() => { const s = document.getElementById('tourSkip'); if (s && s.offsetParent) s.click(); }); await w(300); }
      await p.evaluate(x => {
        const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; S.cfg.bankAt = x.at.slice(0, 10);
        if (x.debts) S.plan.debts = JSON.parse(JSON.stringify(x.debts));
        if (x.cards && Array.isArray(S.cards)) S.cards = JSON.parse(JSON.stringify(x.cards));   /* cards of their own, once the app has them */
        S.receipts = x.rc.map((r, i) => ({ id: 'u' + i, d: r[0], a: r[1], c: r[2], n: '' }));
        __t.persist(); __t.restructure();
      }, sit);
      await L.tab(p, 'tab-month'); await L.tab(p, 'tab-home'); await w(400);
    }
    const d = new Date(sit.at), X = { cur: sit.cur, mon: MON[d.getMonth()], month: MON[d.getMonth()] + ' ' + d.getFullYear() };
    Object.assign(X, await p.evaluate(() => { const S = __t.S, g = S.plan.goals.filter(g => !g.debt); return { goals: g.map(x => x.name), main: (g.find(x => x.id === S.ui.main) || {}).name }; }));
    /* Plan opens on the first month of the plan: put the month of the made-up day on screen, so every screen is about the same month */
    await p.evaluate(ym => { location.hash = '#' + ym; }, sit.at.slice(0, 7)); await w(600);
    const scr = await screens(p), names = NAMES(X);
    if (process.env.LA_SHOW) Object.keys(scr).forEach(k => scr[k].split('\n').forEach((l, i, all) => { if (new RegExp(process.env.LA_SHOW, 'i').test(l)) console.log(`SHOW [${sit.tag}] ${k}: ${(all[i - 1] || '').slice(0, 40)} | ${l.slice(0, 160)} | ${(all[i + 1] || '').slice(0, 40)}`); }));   /* for a person reading a finding: LA_SHOW=bank */
    for (const name of Object.keys(names)) {
      const hits = [];
      names[name].forEach(re => { Object.keys(scr).forEach(s => { const g = new RegExp(re.source, 'gm'); let mm; while ((mm = g.exec(scr[s]))) hits.push({ s, a: num(mm[1]), t: mm[1] }); }); });
      found[name.replace(/^Burrow .*/, 'Burrow')] = Math.max(found[name.replace(/^Burrow .*/, 'Burrow')] || 0, hits.length);
      const vals = [...new Set(hits.map(h => h.a))], where = [...new Set(hits.map(h => h.s))];
      if (!hits.length) continue;
      if (hits.length < 2) { console.log(`NOTE [${sit.tag}] ${name}: written once only (${hits[0].s}, ${hits[0].t}), nothing to compare`); continue; }
      if (vals.length === 1) say(`PASS [${sit.tag}] ${name}: ${hits[0].t} in ${hits.length} places (${where.join('; ')})`);
      else say(`FAIL [${sit.tag}] ${name}: ${vals.length} different amounts: ` + vals.map(v => { const hs = hits.filter(h => h.a === v); return `${hs[0].t} on ${[...new Set(hs.map(h => h.s))].join(' and ')}`; }).join(', but '));
    }
    if (errs.length) say(`FAIL [${sit.tag}] page errors: ${errs.join(' | ')}`);
    await b.close();
  }
  Object.keys(found).filter(n => !found[n]).forEach(n => say(`FAIL ${n}: not found on any screen in any situation. The wording moved: update NAMES in tests/qc/label_agree.js`));
  let known = []; try { known = fs.readFileSync(path.join(__dirname, 'label_agree.known'), 'utf8').split('\n').map(s => s.trim()).filter(s => s && s[0] !== '#'); } catch (e) { }
  const fails = lines.filter(s => /^FAIL /.test(s)), fresh = fails.filter(s => !known.some(k => new RegExp(k).test(s))), stale = known.filter(k => !fails.some(s => new RegExp(k).test(s)));
  stale.forEach(k => console.log(`FAIL the known finding "${k}" no longer fails: take its line out of tests/qc/label_agree.known`));
  console.log(`${lines.filter(s => /^PASS /.test(s)).length} pass, ${fails.length - fresh.length} known findings, ${fresh.length} new failures${stale.length ? ', ' + stale.length + ' stale known lines' : ''}`);
  const bad = fresh.length + stale.length; console.log(bad ? 'FAILED ' + bad : 'ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('FAIL the test itself broke: ' + (e && e.stack || e)); process.exit(1); });
