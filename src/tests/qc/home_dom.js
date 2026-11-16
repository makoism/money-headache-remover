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
    const F = n => { n = Math.round(n); return (n < 0 ? '−' : '') + pre + Math.abs(n).toLocaleString('en-US'); };
    const F2 = n => (Math.abs(n - Math.round(n)) < 0.005 ? F(n) : (n < 0 ? '−' : '') + pre + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    const ym = pick(M.MONTHS.slice(0, 12)), day = pick([1, 3, 10, 15, 22, 27, 28]), today = ym + '-' + String(day).padStart(2, '0');
    /* receipts: some in the month on screen, play and other jars, with cents */
    S.receipts = [];
    const keys = S.plan.lines.map(l => l.key).concat(['other']);
    const nr = pick([0, 0, 2, 5, 9]);
    for (let i = 0; i < nr; i++) { const c = pick(keys), l = S.plan.lines.find(x => x.key === c); S.receipts.push({ id: 'r' + i, d: ym + '-' + String(ri(1, 28)).padStart(2, '0'), a: Math.round((pick([0.5, 19.99, 250, 1234.56, 4000, 12000, ri(1, 90000) / 100]) ) * 100) / 100, c: l ? c : 'other', cn: l ? l.name : 'Other', n: '' }); }
    S.ui = Object.assign(S.ui, { toured: true, setup: true, sampleHidden: true, done: { pay: true, bills: true, goals: true, receipts: true }, seen: { home: true, month: true, goals: true, receipts: true, basics: true } });
    const C = M.calcAll(S), V = M.viewOf(S, C, ym, today), m = C.byYm[ym], floor = M.cfg(S, 'minBank'), tag = '#' + t + ' ' + cur + ' ' + today;
    const { b, p, errs } = await phone({ w: 1100, h: 900, dpr: 1 });
    await p.evaluateOnNewDocument(st => { localStorage.setItem('money-map-template-v2', st); }, JSON.stringify(S));
    await p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, today + 'T10:00:00');
    await p.goto('file://' + PAGE + '#' + ym); await w(1300);
    const T = await p.evaluate(() => { const g = i => { const e = document.querySelector('#' + i); return e && !e.hidden ? e.innerText.replace(/\s+/g, ' ').trim() : null; }; return { st: g('hStatus'), sp: g('hSpend'), bu: g('hBuckets'), go: g('hGoals'), bur: g('hBur') }; });
    eq(tag + ' page errors', errs.join(' | '), '');
    /* ---- status ---- */
    const stat = m.inflow > 0 ? M.statusOf(S, m) : 'none';
    if (stat === 'none') has(tag + ' status', T.st || '', 'No plan yet');
    else if (stat === 'good') { has(tag + ' status', T.st, 'You are okay'); if (V.play.planned > 0) { if (V.play.left > 0) has(tag + ' status free', T.st, F2(V.play.left) + ' is free to spend'); else if (V.play.left < 0) has(tag + ' status over', T.st, 'Play money is ' + F2(-V.play.left) + ' over'); } }
    else if (stat === 'tight') { has(tag + ' status', T.st, 'Tight month'); has(tag + ' status', T.st, 'Plans ' + F(-m.left) + ' more than your pay'); has(tag + ' status', T.st, 'ending ' + monShort(ym) + ' at ' + F(m.bankEnd)); }
    else if (m.left >= 0) { has(tag + ' status', T.st, 'Building your cushion'); has(tag + ' status', T.st, 'safety minimum of ' + F(floor)); has(tag + ' status', T.st, 'end at ' + F(m.bankEnd)); }
    else { has(tag + ' status', T.st, 'Short'); has(tag + ' status', T.st, 'bank would end at ' + F(m.bankEnd)); has(tag + ' status', T.st, 'safety minimum of ' + F(floor)); }
    if (stat !== 'none') { const i0 = M.MONTHS.indexOf(ym), bad = []; for (let k = 1; k <= 3 && i0 + k < M.MONTHS.length; k++) { const x = M.MONTHS[i0 + k], mx = C.byYm[x], st = M.statusOf(S, mx); if (st === 'short' && mx.left < 0) bad.push(monShort(x) + ' is short'); else if (st === 'tight') bad.push(monShort(x) + ' is tight'); } if (i0 + 1 < M.MONTHS.length) has(tag + ' status ahead', T.st, bad.length ? 'Coming up: ' + bad.join(', ') + '.' : 'The next 3 months look fine.'); }
    /* ---- treasure chest ---- */
    const p0 = V.play;
    if (!(m.inflow > 0)) has(tag + ' chest', T.sp || '', 'Add your monthly pay');
    else if (p0.planned <= 0 && p0.spent <= 0) { has(tag + ' chest', T.sp, 'Free to spend (play money) in ' + monLong(ym)); has(tag + ' chest', T.sp, 'No play money planned'); }
    else {
      const held = stat === 'short' && m.left < 0 ? Math.max(0, floor - m.bankEnd) : 0, freeLeft = Math.max(p0.left < 0 ? p0.left : 0, Math.round((p0.left - held) * 100) / 100);
      has(tag + ' chest label', T.sp, (p0.over ? 'Over play money in ' : 'Free to spend (play money) in ') + monLong(ym));
      has(tag + ' chest big', T.sp, F2(freeLeft));
      has(tag + ' chest spent', T.sp, p0.count ? 'Spent ' + F2(p0.spent) + ' of ' + F(p0.planned) : 'Nothing logged yet. ' + F(p0.planned) + ' planned');
      if (!p0.over) {
        if (p0.perWeek != null) has(tag + ' chest week', T.sp, F(Math.max(0, freeLeft) / (p0.daysLeft / 7)) + ' a week, ' + p0.daysLeft + (p0.daysLeft === 1 ? ' day' : ' days') + ' left');
        if (freeLeft > 0 && p0.daysLeft > 0) has(tag + ' chest day', T.sp, 'About ' + F(freeLeft / p0.daysLeft) + ' a day');
      }
      if (held > 0) has(tag + ' chest held', T.sp, F(held) + ' is held back');
      const nec = V.buckets.find(x => x.id === 'nec'), covered = m.inflow >= nec.planned;
      has(tag + ' chest nec', T.sp, 'Necessities Covered'.slice(0, 11)); has(tag + ' chest nec', T.sp, covered ? 'Covered' : 'Short');
      ['edu', 'give'].forEach(id => { const x = V.buckets.find(q => q.id === id); has(tag + ' chest ' + id, T.sp, F2(x.left)); if (x.planned > 0) has(tag + ' chest ' + id, T.sp, (x.left < 0 ? 'Over' : 'Left') + ' of ' + F(x.planned) + ' in ' + monShort(ym)); });
      if (V.otherSpent > 0) has(tag + ' chest other', T.sp, F2(V.otherSpent) + ' logged as Other');
    }
    /* ---- Financial Freedom ---- */
    const ff = V.buckets.find(x => x.id === 'ffa');
    if (!(m.inflow > 0) || !(ff.planned > 0 || ff.total > 0)) eq(tag + ' ffa hidden', T.bu, null);
    else { has(tag + ' ffa', T.bu, F(ff.planned)); if (ff.total > ff.planned) has(tag + ' ffa total', T.bu, F(ff.total) + ' planned in total so far'); else lacks(tag + ' ffa total', T.bu, 'planned in total so far'); }
    /* ---- goals list ---- */
    V.goals.forEach(r => { const g = S.plan.goals.find(x => x.id === r.id); if (r.target > 0 && !g.why) { const pp = T.go.indexOf(g.name.replace(/\s+/g, ' ').trim()); checks++; if (pp < 0) fails.push(tag + ' goals home: ' + g.name + ' missing'); } });
    /* ---- burrows percents, matched by goal id (names can repeat) ---- */
    const BP = await p.evaluate(() => { const o = {}; document.querySelectorAll('#hBur .hb-b').forEach(x => { o[x.dataset.b] = (x.querySelector('.hb-p') || {}).textContent; }); return o; });
    V.goals.filter(r => r.live && r.target > 0).forEach(r => eq(tag + ' burrow pct ' + r.id, BP[r.id], r.pct + '% ' + (r.kind === 'debt' ? 'paid off' : 'full')));
    await b.close();
  }
  console.log('plans on screen', N, '| screen checks', checks, '| mismatches', fails.length);
  fails.forEach(f => console.log('  ', f.slice(0, 400)));
  process.exit(fails.length ? 1 : 0);
})();
