/* The screens' numbers (viewOf) and the spreadsheet (sheetCsv) against the plain rules, recomputed independently, on thousands of random plans. */
const { M, oracle, oracleGoal, randomState, rnd, pick, ri, setSeed } = require('/tmp/v25/oracle.js');
setSeed(+(process.env.SEED || 11));
const N = +(process.env.N || 1500);
const mIdx = ym => +ym.slice(0, 4) * 12 + (+ym.slice(5, 7) - 1);
let checks = 0; const bad = [];
const eq = (m, a, b) => { checks++; if (JSON.stringify(a) !== JSON.stringify(b) && bad.length < 40) bad.push(m + ': got ' + JSON.stringify(a) + ' expected ' + JSON.stringify(b)); };
const cents = x => Math.round(x * 100) / 100;
function parseCsv(t) { t = t.replace(/^﻿/, ''); const rows = []; let row = [], cell = '', q = false; for (let i = 0; i < t.length; i++) { const c = t[i]; if (q) { if (c === '"') { if (t[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; } else if (c === '"') q = true; else if (c === ',') { row.push(cell); cell = ''; } else if (c === '\r') { /* skip */ } else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; } else cell += c; } if (cell || row.length) { row.push(cell); rows.push(row); } return rows; }
for (let t = 0; t < N; t++) {
  const S = randomState();
  /* receipts on random days, in cents, some in lines of each jar and some "other" */
  const nR = ri(0, 14); S.receipts = [];
  for (let k = 0; k < nR; k++) { const l = pick(S.plan.lines.concat([null, null])); S.receipts.push({ id: 'r' + k, d: pick(M.MONTHS) + '-' + String(ri(1, 28)).padStart(2, '0'), a: cents(ri(1, 900000) / 100), c: l ? l.key : 'other', cn: l ? l.name : 'Other', n: '' }); }
  const rr = rnd(); if (rr < .5) { const g = pick(S.plan.goals); S.ui.main = g ? g.id : 'nope'; } else if (rr < .6) S.ui.main = 'zzz-none';
  if (rnd() < .5) { S.ui.gk = {}; S.plan.goals.forEach(g => { if (rnd() < .5) S.ui.gk[g.id] = pick(['travel', 'moving', 'buy', 'car', 'other']); }); }
  const O = oracle(S), C = M.calcAll(S), tag = '#' + t + ' ' + S.ui.cur + ' ';
  for (const ym of [M.MONTHS[0], pick(M.MONTHS), pick(M.MONTHS), M.MONTHS[23]]) {
    const row = O.rows.find(r => r.ym === ym), today = rnd() < .5 ? ym + '-' + String(ri(1, 28)).padStart(2, '0') : '2020-01-05';
    const V = M.viewOf(S, C, ym, today), pt = tag + ym + ' ';
    /* goals */
    const exp = S.plan.goals.map(g => {
      const og = oracleGoal(S, O, g.id, ym), bal = row.bal[g.id], reached = O.reached[g.id] || null;
      return { id: g.id, saved: bal, pct: g.target > 0 ? (bal >= g.target ? 100 : Math.min(99, Math.floor(bal * 100 / g.target))) : 0, state: og.state, need: og.need, slack: og.slack, had: og.had, reached, months: reached ? Math.max(0, mIdx(reached) - mIdx(ym)) : null, live: g.target > 0 && og.state !== 'paid' && og.state !== 'short', target: g.target, emergency: !!g.emergency };
    });
    eq(pt + 'goals', V.goals.map(r => ({ id: r.id, saved: r.saved, pct: r.pct, state: r.state, need: r.need, slack: r.slack, had: r.had, reached: r.reached, months: r.months, live: r.live, target: r.target, emergency: r.emergency })), exp);
    eq(pt + 'live count', V.live, exp.filter(g => g.live).length);
    /* the main goal, by the plain rule */
    const all = exp.filter(g => g.target > 0); let mainId = null;
    if (all.length) { const ch = S.ui.main && all.find(g => g.id === S.ui.main && g.live); if (ch) mainId = ch.id; else { const live = all.filter(g => g.live), pool = live.length ? live : all; let best = null, bs = 0; pool.forEach(g => { const sc = (g.emergency ? 1000 : 0) + (g.pct >= 100 ? 4000 : 0) + (g.reached ? mIdx(g.reached) - mIdx(M.START) : 600); if (best === null || sc < bs) { best = g; bs = sc; } }); mainId = best.id; } }
    eq(pt + 'main goal', V.main ? V.main.id : null, mainId);
    /* play money and the buckets, from the receipts in cents */
    const lineJar = k => { const l = S.plan.lines.find(x => x.key === k); return l ? l.jar : 'other'; };
    const spentBy = {}; S.receipts.filter(r => r.d.slice(0, 7) === ym).forEach(r => { const j = lineJar(r.c); spentBy[j] = (spentBy[j] || 0) + Math.round(r.a * 100); });
    const sp = j => (spentBy[j] || 0) / 100;
    eq(pt + 'play planned', V.play.planned, row.jar.play); eq(pt + 'play spent', V.play.spent, sp('play')); eq(pt + 'play left', V.play.left, Math.round(row.jar.play * 100 - (spentBy.play || 0)) / 100);
    eq(pt + 'play over', V.play.over, row.jar.play * 100 < (spentBy.play || 0));
    const dim = new Date(+ym.slice(0, 4), +ym.slice(5, 7), 0).getDate(), dayN = today.slice(0, 7) === ym ? +today.slice(8, 10) : 1, dl = Math.max(1, dim - dayN + 1);
    eq(pt + 'days left', V.play.daysLeft, dl); eq(pt + 'per week', V.play.perWeek, dl >= 4 ? Math.max(0, V.play.left) / (dl / 7) : null);
    const goalsSaved = Object.keys(row.bal).reduce((s, k) => s + row.bal[k], 0); let ffa = 0; for (const r of O.rows) { if (r.ym > ym) break; ffa += r.jar.ffa; }
    eq(pt + 'buckets', V.buckets.map(b => [b.id, b.planned, b.spent, b.left, b.total]), [['nec', row.jar.nec, sp('nec'), Math.round(row.jar.nec * 100 - (spentBy.nec || 0)) / 100, null], ['lts', row.goalsTotal, 0, null, goalsSaved], ['play', row.jar.play, sp('play'), Math.round(row.jar.play * 100 - (spentBy.play || 0)) / 100, null], ['edu', row.jar.edu, sp('edu'), Math.round(row.jar.edu * 100 - (spentBy.edu || 0)) / 100, null], ['ffa', row.jar.ffa, 0, null, ffa], ['give', row.jar.give, sp('give'), Math.round(row.jar.give * 100 - (spentBy.give || 0)) / 100, null]]);
    eq(pt + 'month', [V.month.inflow, V.month.out, V.month.left, V.month.bankEnd], [row.inflow, row.outflow, row.left, row.bankEnd]);
    eq(pt + 'other spent', V.otherSpent, sp('other'));
  }
  /* the spreadsheet: every month, every column */
  const rows = parseCsv(M.sheetCsv(S, C)); eq(tag + 'csv rows', rows.length, 1 + O.rows.length);
  eq(tag + 'csv width', rows.every(r => r.length === 12 + 2 * S.plan.goals.length), true);
  O.rows.forEach((r, i) => { const x = rows[i + 1]; const want = [r.ym, r.inflow, r.jar.nec, r.goalsTotal, r.jar.play, r.jar.edu, r.jar.ffa, r.jar.give, r.outflow, r.left, r.bankStart, r.bankEnd]; S.plan.goals.forEach(g => { want.push(r.g[g.id].actual, r.bal[g.id]); }); eq(tag + 'csv ' + r.ym, x.map((c, k) => (k === 0 ? c : +c)), want); });
  /* a spreadsheet row can be checked by adding it up: money in = money out + left over */
  rows.slice(1).forEach(x => eq(tag + 'csv adds up ' + x[0], +x[1] - +x[8], +x[9]));
}
/* wording: every goal gets a plain sentence, never empty, never markup, and a custom name shapes it */
const mk = (name, kind, em) => ({ S: { ui: { gk: kind ? { x: kind } : {} } }, g: { id: 'x', name, emergency: !!em } });
[['Surfboard', 'Surfboard covered'], ['buy a surfboard', 'Ready to buy a surfboard'], ['Buy a Surfboard', 'Ready to buy a Surfboard'], ['Trip', 'Trip paid for', 'travel'], ['Japan', 'Japan covered', 'travel'], ['Emergency fund', 'Emergencies covered', 'rainy', true], ['  ', 'Goal covered'], ['wedding', 'Wedding covered']].forEach(([n, want, k, em]) => { const o = mk(n, k, em); eq('purpose ' + JSON.stringify(n), M.purposeOf(o.S, o.g), want); });
console.log('checks', checks, '| mismatches', bad.length); bad.forEach(b => console.log('  ', b)); process.exit(bad.length ? 1 : 0);
