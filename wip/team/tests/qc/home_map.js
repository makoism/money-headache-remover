/* The Home map ("Your burrow", 38.29): the money in the bank, in the burrows, and the proof line under them, read off the real screen
   on random plans, receipts, debts and days, and checked three ways:
     1. the bank figure equals the independent recount (oracle.js, including spending past plan): not the app's own number
     2. what the screen writes adds up on the screen itself: bank + burrows = total, to the cent
     3. the page never says "These numbers do not add up" (the proof, model.js proofOf), and every figure matches the model's map
   Replaces /tmp/team_map.js (written for 38.29, lost with the old session's /tmp; rebuilt 2026-11-18 because version one is built on
   this picture and its numbers). Step 7b (version one Home) extends it to the four numbers.
   Run: node tests/qc/home_map.js [count] [seed]     Needs /tmp/v25/oracle.js (random plans) and /tmp/v39/real.js (browser helper). */
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
    if (t % 3 === 0) { S.plan.debts = []; for (let i = 0; i < ri(1, 3); i++) S.plan.debts.push({ id: 'd' + i, name: 'Debt ' + i, kind: pick(['card', 'loan', 'personal']), balance: pick([500, 5000, 60000, ri(1000, 900000)]), apr: pick([0, 12, 24, 36]), min: pick([0, 100, 3000, ri(0, 20000)]), extra: pick([0, 0, 1000, ri(0, 9000)]) }); }
    if (t % 2 === 0) S.ui.limits = true;
    S.ui = Object.assign(S.ui, { toured: true, setup: true, sampleHidden: true, done: { pay: true, bills: true, goals: true, receipts: true }, seen: { home: true, month: true, goals: true, receipts: true, basics: true } });
    if (M.setCurYm) M.setCurYm(() => ym);   /* the page knows what month it is; the model here must too */
    const C = M.calcAll(S), V = M.viewOf(S, C, ym, today), m = C.byYm[ym], floor = M.cfg(S, 'minBank'), tag = '#' + t + ' ' + cur + ' ' + today;
    const { b, p, errs } = await phone({ w: 1100, h: 900, dpr: 1 });
    await p.evaluateOnNewDocument(st => { localStorage.setItem('money-map-template-v2', st); }, JSON.stringify(S));
    await p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, today + 'T10:00:00');
    await p.goto('file://' + PAGE + '#' + ym); await w(1300);
    const T = await p.evaluate(() => { const el = document.querySelector('#hMap'); if (!el || el.hidden) return null;
      const nums = [...el.querySelectorAll('.mp-nums .mp-n')].map(li => [li.querySelector('.mp-l').textContent.trim(), li.querySelector('b').textContent.trim()]);
      const pr = el.querySelector('.mp-proof'); return { nums, proof: pr ? pr.textContent.replace(/\s+/g, ' ').trim() : '', bad: !!el.querySelector('.mp-bad'), text: el.innerText.replace(/\s+/g, ' ') }; });
    eq(tag + ' page errors', errs.join(' | '), '');
    if (!T) { checks++; fails.push(tag + ' the map is not on Home'); await b.close(); continue; }
    const O = require('/tmp/v25/oracle.js').oracle(S), r = O.rows.find(x => x.ym === ym), MP = V.map;
    const val = s => { const neg = /^[−-]/.test(s), n = +String(s).replace(/[^0-9.]/g, ''); return Math.round((neg ? -n : n) * 100); };
    /* 1. the bank, against the independent recount */
    /* version one (Mako, 2026-11-18): the tiles are the four numbers (Total, Free to spend, Bills left, Saved); the bank figure is in the proof line.
       Before, two tiles read "In burrows" and "In the bank, end of <month>"; the same figures are checked where they are now */
    const pm0 = /^Bank (.+?) \+ burrows/.exec(T.proof), bankLi = pm0 ? ['In the bank, end of ' + monShort(ym), pm0[1]] : null, burLi = T.nums.find(x => x[0] === 'Saved'), totLi = T.nums.find(x => x[0] === 'Total');
    /* the oracle does not recount cards and loans yet (RESUME.md section 5 item 9); their payments come from the model here, and fuzz_debts.js checks those */
    let debtPaid = 0; for (const x of M.MONTHS) { if (x > ym) break; debtPaid += C.byYm[x].debtPay || 0; }
    eq(tag + ' bank on the map = independent bank' + (debtPaid ? ' (less card and loan payments)' : ''), bankLi ? bankLi[1] : null, F2(Math.round((r.bankEnd - debtPaid) * 100) / 100));
    eq(tag + ' the Total tile = model total', totLi ? totLi[1] : null, F2(MP.total));
    /* every figure is the model's map */
    eq(tag + ' burrows on the map = model', burLi ? burLi[1] : null, F2(MP.saved));
    /* 2. the proof line adds up on its own */
    const pm = /^Bank (.+?) \+ burrows (.+?) = (.+?) at the end of (\w+)\./.exec(T.proof);
    checks++; if (!pm) fails.push(tag + ' proof line not in the expected form: ' + T.proof.slice(0, 160));
    else { eq(tag + ' proof line adds up to the cent', val(pm[1]) + val(pm[2]), val(pm[3])); eq(tag + ' proof line bank = map bank', pm[1], bankLi ? bankLi[1] : null); eq(tag + ' proof line burrows = map burrows', pm[2], burLi ? burLi[1] : null); eq(tag + ' proof line total = model total', pm[3], F2(MP.total)); }
    /* 3. the proof holds */
    eq(tag + ' the page never says the numbers do not add up', T.bad, false);
    eq(tag + ' model proof holds', M.proofOf(S, C, ym, MP).ok, true);
    /* goals in the burrows: at least the independent goal balances (the piles come on top) */
    const goalsC = Object.values(r.bal).reduce((a, x) => a + Math.round(x * 100), 0);
    checks++; if (val(burLi ? burLi[1] : '0') < goalsC) fails.push(tag + ' burrows on the map are less than the goals alone: ' + (burLi && burLi[1]) + ' vs ' + goalsC / 100);
    await b.close();
  }
  console.log('plans', N, '| map checks', checks, '| mismatches', fails.length); fails.forEach(f => console.log('  ' + f));
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.log('CRASH', e.stack); process.exit(2); });
