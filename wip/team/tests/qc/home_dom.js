/* Reads the numbers off the real Home screen and compares each with the model, on random plans, receipts and days of the month.
   Run: node tests/qc/home_dom.js [count] [seed]     Needs /tmp/v25/oracle.js (random plans) and /tmp/v39/real.js (browser helper). */
const { phone, w } = require('/tmp/v39/real.js');
const { M, randomState, setSeed, pick, ri, rnd } = require('/tmp/v25/oracle.js');
const N = +(process.argv[2] || 24); setSeed(+(process.argv[3] || 5));
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
let checks = 0; const fails = [];
const eq = (m, a, b) => { checks++; if (a !== b) { if (fails.length < 80) fails.push(m + ': screen ' + JSON.stringify(a) + ' vs expected ' + JSON.stringify(b)); } };
const has = (m, text, s) => { checks++; if (!text.includes(s)) { if (fails.length < 80) fails.push(m + ': screen lacks ' + JSON.stringify(s) + ' in ' + JSON.stringify(text.slice(0, 260))); } };
const lacks = (m, text, s) => { checks++; if (text.includes(s)) { if (fails.length < 80) fails.push(m + ': screen should not have ' + JSON.stringify(s)); } };
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monShort = ym => MON[+ym.slice(5) - 1], monLong = ym => monShort(ym) + ' ' + ym.slice(0, 4);

(async () => {
  for (let t = 0; t < N; t++) {
    const S = randomState();
    if (t % 5 === 1) S.ui.cur = '¥'; if (t % 7 === 3) S.ui.cur = 'CHF'; if (t % 11 === 5) S.ui.cur = 'none';
    const cur = S.ui.cur, pre = cur === 'none' ? '' : (/^[A-Za-z]{2,}$/.test(cur) ? cur + ' ' : cur);
    const F0 = n => { n = Math.round(n); return (n < 0 ? '−' : '') + pre + Math.abs(n).toLocaleString('en-US'); };
    /* 38.31 number gate round 3: the page writes every amount whole when whole, else to the cent; F and F2 are now the same rule */
    const F2 = n => (Math.abs(n - Math.round(n)) < 0.005 ? F0(n) : (n < 0 ? '−' : '') + pre + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    const F = F2;
    const ym = pick(M.MONTHS.slice(0, 12)), day = pick([1, 3, 10, 15, 22, 27, 28]), today = ym + '-' + String(day).padStart(2, '0');
    /* receipts: some in the month on screen, play and other jars, with cents */
    S.receipts = [];
    const keys = S.plan.lines.map(l => l.key).concat(['other']);
    const nr = pick([0, 0, 2, 5, 9]);
    for (let i = 0; i < nr; i++) { const c = pick(keys), l = S.plan.lines.find(x => x.key === c); S.receipts.push({ id: 'r' + i, d: ym + '-' + String(ri(1, 28)).padStart(2, '0'), a: Math.round((pick([0.5, 19.99, 250, 1234.56, 4000, 12000, ri(1, 90000) / 100]) ) * 100) / 100, c: l ? c : 'other', cn: l ? l.name : 'Other', n: '' }); }
    if (t % 3 === 0) { S.plan.debts = []; for (let i = 0; i < ri(1, 3); i++) S.plan.debts.push({ id: 'd' + i, name: 'Debt ' + i, kind: pick(['card', 'loan', 'personal']), balance: pick([500, 5000, 60000, ri(1000, 900000)]), apr: pick([0, 12, 24, 36]), min: pick([0, 100, 3000, ri(0, 20000)]), extra: pick([0, 0, 1000, ri(0, 9000)]) }); }
    if (t % 2 === 0) S.ui.limits = true;
    S.ui = Object.assign(S.ui, { toured: true, setup: true, sampleHidden: true, done: { pay: true, bills: true, goals: true, receipts: true }, seen: { home: true, month: true, goals: true, receipts: true, basics: true } });
    if (M.setCurYm) M.setCurYm(() => ym);   /* the page knows what month it is; the model here must too */
    const C = M.calcAll(S), V = M.viewOf(S, C, ym, today), m = C.byYm[ym], floor = M.cfg(S, 'minBank'), tag = '#' + t + ' ' + cur + ' ' + today;
    const { b, p, errs } = await phone({ w: 1100, h: 900, dpr: 1 });
    await p.evaluateOnNewDocument(st => { localStorage.setItem('money-map-template-v2', st); }, JSON.stringify(S));
    await p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, today + 'T10:00:00');
    await p.goto('file://' + PAGE + '#' + ym); await w(1300);
    const T = await p.evaluate(() => { const g = i => { const e = document.querySelector('#' + i); return e && !e.hidden ? e.innerText.replace(/\s+/g, ' ').trim() : null; }; return { st: g('hStatus'), sp: g('hSpend'), bu: g('hBuckets'), mp: g('hMap'), go: g('hGoals'), bur: g('hBur'), de: g('hDebts'), li: g('hLimits') }; });
    eq(tag + ' page errors', errs.join(' | '), '');
    /* ---- status ---- */
    const stat = m.inflow > 0 ? M.statusOf(S, m) : 'none';
    /* no pay entered: 'No pay entered' when the plan or logged spending takes the bank below zero (ui6.js renderStatus says why), otherwise 'No plan yet' */
    if (stat === 'none') has(tag + ' status', T.st || '', m.left < 0 || m.bankEnd < 0 ? 'No pay entered' : 'No plan yet');
    else if (stat === 'good') { { const nO = V.map.month.find(x => x.id === 'nec'), necOver = !!(nO && nO.overBy > 0), playOver = V.play.planned > 0 && V.play.left < 0; has(tag + ' status', T.st, necOver ? 'Over plan' : playOver ? 'Over Free to spend' : V.month.overNow > 0.004 ? 'Over plan' : 'You are okay'); if (!necOver && !playOver && V.month.overNow > 0.004) has(tag + ' status past plan', T.st, F2(V.month.overNow) + ' went past the plan this month'); } if (V.play.planned > 0) { if (V.play.left > 0) has(tag + ' status free', T.st, F2(V.play.left) + ' is free to spend'); else if (V.play.left < 0) has(tag + ' status over', T.st, 'Free to spend is ' + F2(V.play.overBy) + ' over'); } }
    else if (stat === 'tight') { has(tag + ' status', T.st, 'Tight month'); has(tag + ' status', T.st, 'Plans ' + F(V.cells.overPay) + ' more than your pay'); has(tag + ' status', T.st, 'ending ' + monShort(ym) + ' at ' + F(m.bankEnd)); }
    /* decision 2 (Mako, 2026-11-18): below zero is one amber line with the month, the amount and its causes; this replaced "Building your cushion" and "Short" there */
    else if (m.bankEnd < -0.004) { has(tag + ' status', T.st, 'Below zero'); has(tag + ' status', T.st, 'Your bank ends ' + monShort(ym) + ' at ' + F2(m.bankEnd) + '.');
      if (m.bankStart < 0) has(tag + ' status start', T.st, 'It starts the month at ' + F2(m.bankStart));
      if (m.bankEnd < m.bankStart && m.pool.left < 0) has(tag + ' status plan', T.st, monShort(ym) + ' plans ' + F2(-m.pool.left) + ' more than comes in');
      if (m.bankEnd < m.bankStart && (m.overNow || 0) > 0) has(tag + ' status over', T.st, F2(m.overNow) + ' went past the plan this month');
      if (/cushion/.test(T.st)) eq(tag + ' status never cushion below zero', T.st, '(no cushion)'); }
    else if (V.month.bankChange > 0.004) { has(tag + ' status', T.st, 'Building your cushion');   /* only when the month really adds (38.31 money accuracy round) */ has(tag + ' status', T.st, 'minimum balance of ' + F(floor)); has(tag + ' status', T.st, 'end at ' + F(m.bankEnd)); }
    else { has(tag + ' status', T.st, 'Short'); has(tag + ' status', T.st, 'bank would end at ' + F(m.bankEnd)); has(tag + ' status', T.st, 'minimum balance of ' + F(floor)); }
    if (stat !== 'none') { const i0 = M.MONTHS.indexOf(ym), bad = []; for (let k = 1; k <= 3 && i0 + k < M.MONTHS.length; k++) { const x = M.MONTHS[i0 + k], mx = C.byYm[x], st = M.statusOf(S, mx); if (st === 'short') bad.push(monShort(x) + (mx.bankEnd < 0 ? ' ends below zero' : mx.left < 0 ? ' is short' : ' ends under your minimum')); else if (st === 'tight') bad.push(monShort(x) + ' is tight'); } if (i0 + 1 < M.MONTHS.length && !(V.month.over > 0.004 && !bad.length)) has(tag + ' status ahead', T.st, bad.length ? 'Coming up: ' + bad.join(', ') + '.' : 'The next 3 months look fine.'); }
    /* ---- treasure chest ---- */
    const p0 = V.play;
    if (!(m.inflow > 0)) has(tag + ' chest', T.sp || '', 'Add your monthly pay');
    else if (p0.planned <= 0 && p0.spent <= 0) { has(tag + ' chest', T.sp, 'Free to spend in ' + monLong(ym)); has(tag + ' chest', T.sp, 'No Free to spend planned'); }
    else {
      const held = V.map.held, freeLeft = V.map.free;   /* one rule for every screen: model.js freeOf, through the map */
      has(tag + ' chest label', T.sp, (p0.over ? 'Over Free to spend in ' : 'Free to spend in ') + monLong(ym));
      has(tag + ' chest big', T.sp, F2(freeLeft));
      has(tag + ' chest spent', T.sp, p0.count ? 'Spent ' + F2(p0.spent) + ' of ' + F(p0.planned) : 'Nothing logged yet. ' + F(p0.planned) + ' planned');
      if (!p0.over) {
        if (p0.perWeek != null && freeLeft > 0) has(tag + ' chest week', T.sp, F0(V.cells.perWeek) + ' a week to stay inside it for the ' + p0.daysLeft + (p0.daysLeft === 1 ? ' day' : ' days') + ' left');
        if (freeLeft > 0 && p0.daysLeft > 0) has(tag + ' chest day', T.sp, 'About ' + F0(V.cells.perDay) + ' a day');
      }
      if (held > 0) has(tag + ' chest held', T.sp, F(held) + ' is held back');
      const nec = V.buckets.find(x => x.id === 'nec'), covered = m.inflow >= nec.planned;
      has(tag + ' chest nec', T.sp, 'Bills and basics'); { const nR = V.map.month.find(x => x.id === 'nec'); has(tag + ' chest nec', T.sp, nR && nR.overBy > 0 ? 'Over' : covered ? 'Covered' : 'Short'); }
      ['edu', 'give'].forEach(id => { const x = V.buckets.find(q => q.id === id), T2 = V.cells[id]; has(tag + ' chest ' + id, T.sp, x.left < 0 ? (T2.bank >= 0.005 ? '−' + F2(T2.bank) : F2(0)) : F2(x.left)); if (x.planned > 0) has(tag + ' chest ' + id, T.sp, (x.left < 0 ? F(T2.over) + ' more than the ' + F(x.planned) + ' for ' + monShort(ym) : 'left of the ' + F(x.planned) + ' for ' + monShort(ym))); });
      if (V.otherSpent > 0) has(tag + ' chest other', T.sp, F2(V.otherSpent) + ' logged as Other');
    }
    /* ---- Investing: its own card is retired (38.29); it is a room in the Burrows section and a share of the pay strip ---- */
    eq(tag + ' ffa card retired', T.bu, null);
    /* ---- Your burrow (38.29): the four numbers and the proof line come from the model's map ---- */
    if (!(m.inflow > 0)) eq(tag + ' map hidden', T.mp, null);
    else { const M = V.map; has(tag + ' map free', T.mp, F2(M.free)); has(tag + ' map bills left', T.mp, F2(M.billsLeft)); has(tag + ' map saved', T.mp, F2(M.saved)); has(tag + ' map bank', T.mp, F2(M.bankEnd)); has(tag + ' map total', T.mp, F2(M.total)); has(tag + ' proof', T.mp, 'Bank ' + F2(M.bankEnd) + ' + burrows ' + F2(M.saved) + ' = ' + F2(M.total))   /* the one proof line (Mako, 2026-11-19): the long "They add up" note became the sum itself */; lacks(tag + ' proof', T.mp, 'do not add up'); }
    /* ---- goals list ---- */
    V.goals.forEach(r => { const g = S.plan.goals.find(x => x.id === r.id); if (r.target > 0 && !g.why) { const pp = T.go.indexOf(g.name.replace(/\s+/g, ' ').trim()); checks++; if (pp < 0) fails.push(tag + ' goals home: ' + g.name + ' missing'); } });
    /* ---- cards and loans on Home ---- */
    if (!S.plan.debts) eq(tag + ' debts card hidden', T.de, null);
    else {
      const ds = S.plan.debts, rowsD = M.debtRows(S, C), owed = ds.reduce((a, d) => a + m.debts[d.id].start, 0);
      has(tag + ' debts owed', T.de || '', F(owed)); has(tag + ' debts head', T.de || '', 'Owed at the start of ' + monShort(ym));
      if (m.debtPay > 0) has(tag + ' debts pay', T.de, 'You pay ' + F(m.debtPay) + ' this month' + (m.debtInterest > 0 ? ', ' + F(m.debtInterest) + ' of it interest' : ''));
      if (rowsD.every(r => !r.never)) has(tag + ' debts free', T.de, 'Debt free ' + monLong(rowsD.reduce((a, r) => (r.payoffYm > a ? r.payoffYm : a), '')));
      ds.forEach(d => has(tag + ' debts row ' + d.id, T.de, F(m.debts[d.id].start)));
    }
    /* ---- spending limits ---- */
    if (!S.ui.limits) eq(tag + ' limits hidden', T.li, null);
    else {
      const L = M.limitsOf(S, C, ym);
      if (!L.rows.length && !L.other) eq(tag + ' limits empty hidden', T.li, null);
      else L.rows.forEach(r => { has(tag + ' limit ' + r.key, T.li || '', r.over ? F2(-r.left) + ' over' : F2(r.left) + ' left'); has(tag + ' limit spent ' + r.key, T.li, F2(r.spent) + ' of ' + F(r.planned)); });
    }
    /* ---- burrows percents, matched by goal id (names can repeat) ---- */
    const BP = await p.evaluate(() => { const o = {}; document.querySelectorAll('#hBur .hb-b').forEach(x => { o[x.dataset.b] = (x.querySelector('.hb-p') || {}).textContent; }); return o; });
    V.goals.filter(r => r.live && r.target > 0).forEach(r => eq(tag + ' burrow pct ' + r.id, BP[r.id], F(r.saved) + ', ' + r.pct + '% ' + (r.kind === 'debt' ? 'paid off' : 'full')));
    await b.close();
  }
  console.log('plans on screen', N, '| screen checks', checks, '| mismatches', fails.length);
  fails.forEach(f => console.log('  ', f.slice(0, 400)));
  process.exit(fails.length ? 1 : 0);
})();
