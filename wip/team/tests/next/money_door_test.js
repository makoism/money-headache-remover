/* THE MONEY DOOR, TESTED (tests/next, side Q, 2026-11-19): wip/team/money_door.js on top of the real ledger, wip/team/ledger.js.
   Made-up numbers only.   node tests/next/money_door_test.js     Ends with "MONEY DOOR PASS" or "... FAIL n".

   1. The table: every kind has a label, one line, its questions and what it does to the five figures.
   2. The sweep: every kind, on nine starting pictures (Mako's shape, the six people of PERSONAS_PH.md, a Wallet-mode person with
      dollars, and somebody with nothing), with every account, every "who", several places and three amounts. Each time:
        - the figures move by exactly what the kind's way says (to the cent),
        - accounts = places = Total, every "for the card" line = its card, Lent = the "owed to you" accounts,
        - undo puts every figure and the ledger back exactly, redo brings the step back, undo again takes it out again,
        - a refusal leaves the saved copy exactly as it was.
   3. The lines, in numbers: each kind on Mako's shape with the amounts written out by hand.
   4. The people: what each persona tries, and the situations of LAUNCH_CHECKLIST.md section C, each through its kind.
   5. Nothing counted twice (A8): a bill and its receipt, a transfer seen on two statements, a card payment seen on two.
   6. Gaps: what the ledger lacks today. They print as GAP and do not fail the run (LANE_money_door.md lists them). */
const path = require('path');
const { Report, cents } = require('./lib');
const L = require(path.join(__dirname, '..', '..', 'ledger.js'));
const D = require(path.join(__dirname, '..', '..', 'money_door.js'));
const rep = Report('money door'), J = JSON.stringify, c = cents;
const TODAY = '2026-12-31', FIG = ['total', 'free', 'bills', 'saved', 'owed', 'waiting', 'lent'];

/* ---------- helpers ---------- */
const must = (tag, r) => { rep.ok(!!r && r.ok !== false, `${tag}: refused ${J(r === false ? L.ledgerWhy() : r)}`); return r; };
const led = (S, e) => must('setup ' + J(e), L.ledgerAdd(S, e));
/* everything the ledger shows, plus the events and the accounts. An account a step made for a new "who" leaves with the undo of
   that step and comes back with its redo (G3, closed), so the list of accounts is compared too, byte for byte */
const snap = S => J({ p: L.placesOf(S), led: S.ledger, accts: S.accounts });
/* the one rule and the door's own: Total from both sides, each card line, and Lent = the "owed to you" accounts */
function rule(tag, S) {
  const pr = L.ledgerProof(S), f = D.doorFigures(S), p = L.placesOf(S);
  rep.ok(pr.ok, `${tag}: the one rule is broken ${J(pr)}`);
  const sum = c(f.waiting) + c(f.bills) + c(f.saved) + c(f.lent) + (f.mode === 'track' ? c(f.free) : 0);
  rep.ok(sum === c(f.total), `${tag}: the places add up to ${sum / 100}, Total is ${f.total}`);
  rep.ok(c(p.have) === c(f.total), `${tag}: the accounts add up to ${p.have}, Total is ${f.total}`);
  let owedToYou = 0; S.accounts.forEach(a => { if (a.type === 'owedToYou' && a.cur === S.ui.cur && a.tracked !== false) owedToYou += c(p.accounts[a.id]); });
  rep.ok(owedToYou === c(f.lent), `${tag}: Lent is ${f.lent}, the "owed to you" accounts hold ${owedToYou / 100}`);
  return f;
}
/* the figures of S, written out by hand */
const figs = (tag, S, want) => { const f = rule(tag, S); for (const k in want) rep.ok(c(k.includes('.') ? f[k.split('.')[0]][k.split('.')[1]] : f[k]) === c(want[k]), `${tag}: ${k} is ${k.includes('.') ? f[k.split('.')[0]][k.split('.')[1]] : f[k]}, expected ${want[k]}`); return f; };
/* one kind, with what each figure must move by written out by hand (a figure not named must not move) */
function step(tag, S, kind, ans, want) {
  const r = D.doorApply(S, kind, ans, TODAY);
  if (!r.ok) { rep.ok(false, `${tag}: ${kind} refused ${J(r)}`); return r; }
  FIG.forEach(f => rep.ok(c(r.moved[f]) === c((want || {})[f] || 0), `${tag} (${kind}): ${f} moved ${r.moved[f]}, expected ${(want || {})[f] || 0}`));
  rule(tag, S);
  return r;
}
const refused = (tag, S, code, fn) => { const before = J(S), r = fn();
  rep.ok(r && r.ok === false && r.code === code, `${tag}: should be refused with "${code}", got ${J(r)}`);
  rep.ok(J(S) === before, `${tag}: a refused step changed the saved copy`); return r; };

/* ---------- the starting pictures ---------- */
const DAY1 = '2026-11-19';
function build(setup, opens, places) {
  const S = must('fresh', L.ledgerFresh(setup));
  opens.forEach(o => led(S, { k: 'open', acct: o[0], a: o[1], date: o[3] || DAY1, place: o[2] }));
  (places || []).forEach(m => led(S, { k: 'move', a: m[1], place: 'waiting', place2: m[0], date: DAY1 }));
  return S;
}
const PICTURES = {
  mako: () => build({ cur: 'JPY', mode: 'track', payDays: [10], accounts: [
    { id: 'bank', name: 'Main bank', type: 'bank' }, { id: 'cardA', name: 'Card A', type: 'card', payDay: 10 }, { id: 'cardB', name: 'Card B', type: 'card', payDay: 11 }] },
    [['bank', 152340, null, '2026-11-01'], ['cardA', 61200, null, '2026-11-01'], ['cardB', 23450, null, '2026-11-01']], [['bills', 30000], ['free', 30000], ['emergency', 7690]]),
  bea: () => build({ cur: 'PHP', mode: 'track', payDays: [1], accounts: [
    { id: 'bpi', name: 'BPI', type: 'bank' }, { id: 'ub', name: 'UnionBank', type: 'bank' }, { id: 'gcash', name: 'GCash', type: 'ewallet' }, { id: 'cash', name: 'Cash on hand', type: 'cash' },
    { id: 'wise', name: 'Wise', type: 'ewallet', cur: 'USD' }, { id: 'rcbc', name: 'RCBC card', type: 'card', payDay: 12, cutDay: 22 }] },
    [['bpi', 42300], ['ub', 8150], ['gcash', 3480], ['cash', 1200], ['wise', 310], ['rcbc', 14600]], [['bills', 20000], ['free', 10000], ['emergency', 5000]]),
  carlo: () => build({ cur: 'PHP', mode: 'track', payDays: [15, 30], accounts: [
    { id: 'bdo', name: 'BDO', type: 'bank' }, { id: 'gcash', name: 'GCash', type: 'ewallet' }, { id: 'cash', name: 'Cash on hand', type: 'cash' },
    { id: 'metro', name: 'Metrobank card', type: 'card', payDay: 3, cutDay: 13 }, { id: 'spl', name: 'SPayLater', type: 'paylater', payDay: 5 }, { id: 'ggives', name: 'GGives', type: 'paylater', payDay: 20 }] },
    [['bdo', 6240], ['gcash', 910], ['cash', 650], ['metro', 9800], ['spl', 5430], ['ggives', 15050]], [['bills', 3000], ['free', 1000]]),
  mika: () => build({ cur: 'PHP', mode: 'track', payDays: [30], accounts: [
    { id: 'ub', name: 'UnionBank', type: 'bank' }, { id: 'maya', name: 'Maya Savings', type: 'bank' }, { id: 'gotyme', name: 'GoTyme', type: 'bank' }, { id: 'gcash', name: 'GCash', type: 'ewallet' }, { id: 'cash', name: 'Cash on hand', type: 'cash' },
    { id: 'bpicard', name: 'BPI card', type: 'card', payDay: 26, cutDay: 5 }, { id: 'ubcard', name: 'UnionBank card', type: 'card', payDay: 7, cutDay: 17 },
    { id: 'laptop', name: 'Laptop, 0%', type: 'paylater', of: 'bpicard' }] },
    [['ub', 96400], ['maya', 150000, 'emergency'], ['gotyme', 12750, 'travel'], ['gcash', 2300], ['cash', 3000], ['bpicard', 31900], ['ubcard', 12480], ['laptop', 31500]], [['bills', 30000], ['free', 20000]]),
  juntess: () => build({ cur: 'PHP', mode: 'track', payDays: [5, 15, 30], accounts: [
    { id: 'landbank', name: 'Landbank', type: 'bank' }, { id: 'bdo', name: 'BDO', type: 'bank' }, { id: 'gcash', name: 'GCash', type: 'ewallet' }, { id: 'cash', name: 'Cash at home', type: 'cash' },
    { id: 'sb', name: 'Security Bank card', type: 'card', payDay: 29, cutDay: 8 }, { id: 'homecredit', name: 'Home Credit', type: 'paylater', payDay: 12 }] },
    [['landbank', 4870], ['bdo', 18300], ['gcash', 1640], ['cash', 7500], ['sb', 6900], ['homecredit', 17775]], [['bills', 15000], ['free', 6000]]),
  rina: () => build({ cur: 'PHP', mode: 'track', payDays: [28], accounts: [
    { id: 'bpi', name: 'BPI', type: 'bank' }, { id: 'gcash', name: 'GCash', type: 'ewallet' }, { id: 'maya', name: 'Maya', type: 'ewallet' }, { id: 'cash', name: 'Cash on hand', type: 'cash' },
    { id: 'card', name: 'BPI card', type: 'card', payDay: 16, cutDay: 25 }, { id: 'gloan', name: 'GLoan', type: 'loan', payDay: 20 }, { id: 'mate', name: 'Officemate', type: 'loan' }] },
    [['bpi', 1050], ['gcash', 6720], ['maya', 500], ['cash', 2400], ['card', 3260], ['gloan', 7400], ['mate', 5000]], [['bills', 4000], ['free', 2000]]),
  dan: () => build({ cur: 'PHP', mode: 'track', payDays: [30], accounts: [
    { id: 'metro', name: 'Metrobank', type: 'bank' }, { id: 'mari', name: 'MariBank', type: 'bank' }, { id: 'gcash', name: 'GCash', type: 'ewallet' }, { id: 'cash', name: 'Cash on hand', type: 'cash' },
    { id: 'bdo', name: 'BDO card', type: 'card', payDay: 10, cutDay: 20 }, { id: 'bdo_old', name: 'BDO card, older balance', type: 'loan', of: 'bdo', payDay: 10 },
    { id: 'metrocard', name: 'Metrobank card', type: 'card', payDay: 2, cutDay: 12 }, { id: 'bankloan', name: 'Bank loan', type: 'loan', payDay: 5 }] },
    [['metro', 11900], ['mari', 20000, 'emergency'], ['gcash', 1150], ['cash', 800], ['bdo_old', 68400], ['metrocard', 24750], ['bankloan', 95900]], [['bills', 8000], ['free', 2000]]),
  /* Wallet mode, dollars beside Total, a card not paid in full, a dollar card */
  wallet: () => { const S = build({ cur: 'PHP', mode: 'wallet', payDays: [15], accounts: [
    { id: 'bank', name: 'Bank', type: 'bank' }, { id: 'gcash', name: 'GCash', type: 'ewallet' }, { id: 'wallet', name: 'My wallet', type: 'wallet' },
    { id: 'payo', name: 'Payoneer', type: 'bank', cur: 'USD' }, { id: 'full', name: 'Card paid in full', type: 'card', payDay: 5 },
    { id: 'carry', name: 'Card not paid in full', type: 'card', inFull: false, payDay: 8 }, { id: 'loan', name: 'Loan', type: 'loan' }, { id: 'usdcard', name: 'Dollar card', type: 'card', cur: 'USD' }] },
    [['bank', 30000], ['gcash', 2000], ['payo', 120], ['full', 4000], ['carry', 3000], ['loan', 5000], ['usdcard', 50]], [['bills', 9000], ['emergency', 6000]]);
    led(S, { k: 'in', sub: 'pay', acct: 'bank', a: 20000, date: '2026-11-20' }); led(S, { k: 'hand', acct: 'bank', acct2: 'wallet', a: 4000, date: '2026-11-20' }); return S; },
  /* nothing yet: one bank at zero in yen, and dollars to bring home */
  empty: () => build({ cur: 'JPY', mode: 'track', payDays: [25], accounts: [{ id: 'bank', name: 'Bank', type: 'bank' }, { id: 'usd', name: 'Dollars', type: 'bank', cur: 'USD' }, { id: 'card', name: 'Card', type: 'card', payDay: 27 }] }, [['usd', 40]], []),
};

/* ---------- 1. the table ---------- */
{
  const ins = D.doorKinds('in'), outs = D.doorKinds('out'), ASKS = { amount: 1, date: 1, account: 1, who: 1, to: 1, place: 1, from: 1, landed: 1, second: 1, fromPay: 1 };
  rep.ok(J(ins.map(k => k.id)) === J(['pay', 'borrowed', 'paidback', 'refund', 'gift', 'sold', 'otherin']), 'Money came in: the seven kinds, in order');
  rep.ok(J(outs.map(k => k.id)) === J(['spent', 'bill', 'family', 'lent', 'paidcard', 'paidloan', 'moved', 'saved', 'otherout']), 'Money went out: the nine kinds, in order');
  rep.ok(ins.length <= 9 && outs.length <= 9, 'a short list: at most nine kinds on a side');
  D.DOOR.forEach(k => {
    rep.ok(typeof k.label === 'string' && k.label.length > 0 && k.label.length <= 32, `${k.id}: a short label`);
    rep.ok(typeof k.line === 'string' && k.line.length >= 20 && k.line.length <= 130, `${k.id}: one plain line`);
    rep.ok(!/[—–]/.test(k.label + k.line + J(k.say) + J(k.ways)), `${k.id}: no em dash`);
    rep.ok(!/\.$/.test(k.line) && (k.line.match(/\./g) || []).length === 0, `${k.id}: the line has no full stop`);
    rep.ok(k.asks[0] === 'amount' && k.asks[1] === 'date', `${k.id}: asks the amount and the date first`);
    k.asks.concat(k.maybe || []).forEach(q => rep.ok(ASKS[q] === 1, `${k.id}: unknown question ${q}`));
    k.asks.concat(k.maybe || []).filter(q => q !== 'amount' && q !== 'date').forEach(q => rep.ok(typeof k.say[q] === 'string' && !/\.$/.test(k.say[q]), `${k.id}: the question "${q}" has its words`));
    ['total', 'free', 'bills', 'saved', 'owed'].forEach(f => rep.ok(k.says[f] === 'up' || k.says[f] === 'down' || k.says[f] === 'same', `${k.id}: says what it does to ${f}`));
    rep.ok(J(D.doorSays(k.id)) === J(k.says), `${k.id}: what it says (${J(k.says)}) is not what its usual way does (${J(D.doorSays(k.id))})`);
    Object.keys(k.ways).forEach(w => rep.ok(typeof k.ways[w].so === 'string' && k.ways[w].so.length > 8, `${k.id}/${w}: the way has its words`));
  });
  rep.ok(new Set(D.DOOR.map(k => k.side + k.label)).size === D.DOOR.length, 'no two kinds on one side share a label');
}

/* ---------- 2. the sweep ---------- */
const sweepStats = {};
function sweep(name, S) {
  const home = S.ui.cur, wallet = S.ui.freeMode === 'wallet', by = {}; S.accounts.forEach(a => { by[a.id] = a; });
  /* somebody already owes this person money, so Paid back has a "who" */
  const firstIn = S.accounts.find(a => a.cur === home && a.tracked !== false && ['bank', 'ewallet', 'cash'].includes(a.type));
  must(name + ' lent to Lea', D.doorApply(S, 'lent', { amount: 500, account: firstIn.id, who: { name: 'Lea' }, date: '2026-12-01' }, TODAY));
  rule(name + ' start', S);
  const amounts = cur => (cur === 'JPY' ? [1, 1234, 9999999] : [0.01, 1234.56, 9999999.99]);
  const landed = cur => (cur === 'JPY' ? 1500 : 25.25);
  D.DOOR.forEach(k => {
    const ch = D.doorChoices(S, k.id), st = sweepStats[k.id] = sweepStats[k.id] || { ok: 0, no: 0, ways: {} };
    const accts = ch.account.length ? ch.account : [undefined];
    const whos = k.whoIs === 'name' ? [undefined, 'Mama'] : !k.whoIs ? [undefined] : ch.who.concat(ch.canAddWho ? [{ name: 'New Person' }] : []);
    const tos = k.to ? ch.to : [undefined];
    const places = k.id === 'saved' ? ['emergency', 'trip'] : [undefined, 'free', 'bills', 'waiting', 'emergency'];
    const flags = k.id === 'pay' ? [{}, { second: true }] : k.id === 'paidloan' ? [{}, { fromPay: true }] : k.id === 'saved' ? [{}, { from: 'waiting' }, { from: 'emergency' }, { from: 'bills', account: firstIn.id, to: (ch0 => ch0 || 'none')(S.accounts.filter(a => a !== firstIn && a.cur === home && a.tracked !== false && ['bank', 'ewallet', 'cash'].includes(a.type)).map(a => a.id)[0]) }] : [{}];
    for (const account of accts) for (const who of whos) for (const to of tos) for (const place of places) for (const flag of flags) {
      const cur = (by[account] || by[typeof who === 'string' ? who : ''] || { cur: home }).cur;
      for (const amount of amounts(cur)) {
        const ans = Object.assign({ amount, date: '2026-12-20', account, who, to, place }, flag);
        if (k.id === 'moved' && by[account] && by[to] && by[account].cur !== by[to].cur) ans.landed = landed(by[to].cur);
        const tag = `${name} ${k.id} ${J(ans)}`, whole = J(S), before = snap(S), next = S.ledgerNext;
        const plan = D.doorPlan(S, k.id, ans, TODAY);
        rep.ok(J(S) === whole, `${tag}: doorPlan changed the saved copy`);
        if (!plan.ok) { st.no++; rep.ok(plan.code === 'acct-kind' || plan.code === 'place-kind' || (plan.code === 'ask' && flag.account && plan.ask === 'to'), `${tag}: refused with ${J(plan)}`); continue; }
        const want = D.doorExpect(S, plan), handedBefore = D.doorFigures(S).free;
        const r = D.doorApply(S, k.id, ans, TODAY);
        if (!r.ok) { st.no++; rep.ok(r.from === 'ledger' && (r.code === 'acct-cur' || r.code === 'amount-whole'), `${tag}: refused with ${J(r)}`); rep.ok(J(S) === whole, `${tag}: a refused step changed the saved copy`); continue; }
        st.ok++; plan.parts.forEach(p => { st.ways[p.way] = (st.ways[p.way] || 0) + 1; });
        ['total', 'bills', 'saved', 'owed', 'waiting', 'lent'].forEach(f => rep.ok(c(r.moved[f]) === c(want[f]), `${tag}: ${f} moved ${r.moved[f]}, the way ${J(plan.parts)} says ${want[f]}`));
        if (!wallet) rep.ok(c(r.moved.free) === c(want.free), `${tag}: free moved ${r.moved.free}, the way says ${want.free}`);
        else if (k.id === 'pay' && !flag.second) rep.ok(c(r.after.free) === 0, `${tag}: a new pay starts the count of what was handed out at zero, got ${r.after.free}`);
        else rep.ok(c(r.after.free) - c(handedBefore) === c(want.handed), `${tag}: handed out moved ${r.after.free - handedBefore}, the way says ${want.handed}`);
        rep.ok(r.events.length === plan.events.length && r.events.every(e => e.door === k.id), `${tag}: every event carries its kind`);
        rule(tag, S);
        const made = r.made ? r.made.id : null, after = snap(S);
        rep.ok(!!D.doorUndo(S), `${tag}: undo refused`);
        rep.ok(snap(S) === before, `${tag}: undo did not put everything back exactly`);
        if (made) rep.ok(!S.accounts.some(a => a.id === made), `${tag}: undo left the account made for a new person`);
        rule(tag + ' after undo', S);
        rep.ok(!!D.doorRedo(S), `${tag}: redo refused`);
        rep.ok(snap(S) === after, `${tag}: redo did not bring the step back exactly`);
        rep.ok(!!D.doorUndo(S) && snap(S) === before, `${tag}: the second undo did not put everything back`);
        /* test hygiene only: drop the undo history, so the next combination starts clean. No account is taken out by hand any more */
        S.undone.length = 0; S.ledgerNext = next;   /* the id counter moves on after an undo, as it should: ids are never used twice */
        rep.ok(J(S) === whole, `${tag}: the copy is not as it was before the step`);
      }
    }
  });
}
Object.keys(PICTURES).forEach(name => sweep(name, PICTURES[name]()));
/* every kind was really recorded many times, and every way in the table was reached */
D.DOOR.forEach(k => {
  rep.ok(sweepStats[k.id].ok >= 20, `${k.id}: recorded only ${sweepStats[k.id].ok} times in the sweep`);
  Object.keys(k.ways).forEach(w => rep.ok(sweepStats[k.id].ways[w] > 0, `${k.id}: the way "${w}" was never reached in the sweep`));
});

/* ---------- 3. the lines, in numbers: Mako's shape ---------- */
{
  const S = PICTURES.mako(), t = 'mako';
  const start = figs(t + ' day one', S, { total: 152340, waiting: 0, free: 30000, bills: 114650, saved: 7690, owed: 84650, forCards: 84650, afterCards: 67690, lent: 0 });
  const s0 = snap(S); let n = 0; const go = (kind, ans, want) => { n++; return step(`${t} ${n}`, S, kind, ans, want); };
  go('spent', { amount: 4380, account: 'cardA', date: '2026-11-21' }, { free: -4380, bills: 4380, owed: 4380 });                 /* by card: Total stays */
  go('bill', { amount: 12000, account: 'cardB', date: '2026-11-25' }, { owed: 12000 });                                           /* a bill by card: out of Bills left, into "for Card B" */
  figs(t + ' mid-month', S, { total: 152340, free: 25620, 'cards.cardA': 65580, 'cards.cardB': 35450, owed: 101030, afterCards: 51310 });
  go('pay', { amount: 410000, account: 'bank', date: '2026-12-10' }, { total: 410000, waiting: 410000 });
  go('paidcard', { amount: 65580, account: 'bank', who: 'cardA', date: '2026-12-10' }, { total: -65580, bills: -65580, owed: -65580 });
  go('paidcard', { amount: 35450, account: 'bank', who: 'cardB', date: '2026-12-11' }, { total: -35450, bills: -35450, owed: -35450 });
  figs(t + ' cards paid', S, { owed: 0, forCards: 0, free: 25620, 'accounts.bank': 461310, total: 461310 });                      /* Free to spend never moved */
  const ken = go('lent', { amount: 3000, account: 'cardA', who: { name: 'Ken' }, date: '2026-12-12' }, { total: 3000, free: -3000, bills: 3000, lent: 3000, owed: 3000 });
  go('paidback', { amount: 3000, account: 'bank', who: ken.made.id, date: '2026-12-14' }, { free: 3000, lent: -3000 });
  go('refund', { amount: 1200, account: 'cardA', date: '2026-12-14' }, { free: 1200, bills: -1200, owed: -1200 });
  go('refund', { amount: 800, account: 'bank', date: '2026-12-14' }, { total: 800, free: 800 });
  go('gift', { amount: 10000, account: 'bank', date: '2026-12-15' }, { total: 10000, waiting: 10000 });
  go('sold', { amount: 5500, account: 'bank', date: '2026-12-15' }, { total: 5500, waiting: 5500 });
  go('otherin', { amount: 12, account: 'bank', date: '2026-12-15' }, { total: 12, waiting: 12 });
  const dad = go('borrowed', { amount: 20000, account: 'bank', who: { name: 'Dad' }, date: '2026-12-16' }, { total: 20000, waiting: 20000, owed: 20000 });
  go('paidloan', { amount: 5000, account: 'bank', who: dad.made.id, date: '2026-12-17' }, { total: -5000, bills: -5000, owed: -5000 });
  go('borrowed', { amount: 10000, account: 'bank', who: 'cardB', date: '2026-12-17' }, { total: 10000, bills: 10000, owed: 10000 });   /* cash taken on a card */
  go('family', { amount: 15000, account: 'bank', who: 'Mum', date: '2026-12-18' }, { total: -15000, bills: -15000 });
  go('family', { amount: 6000, account: 'bank', place: 'emergency', date: '2026-12-18' }, { total: -6000, saved: -6000 });           /* a surprise ask */
  go('saved', { amount: 8000, place: 'trip', date: '2026-12-18' }, { free: -8000, saved: 8000 });
  go('saved', { amount: 100000, place: 'emergency', from: 'waiting', date: '2026-12-18' }, { waiting: -100000, saved: 100000 });
  go('spent', { amount: 2000, account: 'bank', place: 'trip', date: '2026-12-19' }, { total: -2000, saved: -2000 });                 /* taken out of a burrow */
  go('bill', { amount: 85000, account: 'bank', date: '2026-12-19' }, { total: -85000, bills: -85000 });
  go('otherout', { amount: 110, account: 'bank', date: '2026-12-19' }, { total: -110, free: -110 });
  go('spent', { amount: 50000, account: 'bank', date: '2026-12-20' }, { total: -50000, free: -50000 });                              /* more than Free to spend holds */
  const f = figs(t + ' end', S, { free: -30490, 'accounts.cardA': 1800, 'accounts.cardB': 10000, owed: 26800 });
  rep.ok(f.below.includes('free'), t + ': Free to spend below zero is shown in amber, never refused');
  rep.ok(D.doorChoices(S, 'moved').to.length === 1 && D.doorApply(S, 'moved', { amount: 1, account: 'bank', to: 'bank' }, TODAY).code === 'acct-kind', t + ': with one account there is nothing to move between');
  for (let i = 0; i < n; i++) rep.ok(!!D.doorUndo(S), `${t}: undo ${i + 1} of ${n} refused`);
  rep.ok(snap(S) === s0, t + ': every step undone, the picture is not exactly day one');
  rep.ok(!S.accounts.some(a => a.id === ken.made.id || a.id === dad.made.id), t + ': every step undone, the accounts made for Ken and Dad are gone too');
  figs(t + ' undone', S, { total: start.total, free: start.free, bills: start.bills, saved: start.saved, owed: start.owed });
}

/* ---------- 4. the people (PERSONAS_PH.md) and section C ---------- */
{ /* Bea: uneven pay in dollars, family support, three peso accounts */
  const S = PICTURES.bea(), t = 'bea';
  let f = figs(t + ' day one', S, { total: 55130, owed: 14600, waiting: 5530, 'beside.USD': 310, 'accounts.bpi': 42300 });
  rep.ok(c(f.accounts.bpi) - c(f.cards.rcbc) === c(27700), t + ': BPI after the card is paid is 27,700');
  step(t + ' dollars land in Wise (C2)', S, 'pay', { amount: 450, account: 'wise', date: '2026-11-20' }, {});
  figs(t, S, { 'beside.USD': 760, total: 55130 });
  step(t + ' 3 brings USD 300 home', S, 'moved', { amount: 300, account: 'wise', to: 'bpi', landed: 16950, date: '2026-11-21' }, { total: 16950, waiting: 16950 });
  figs(t, S, { 'beside.USD': 460, 'accounts.bpi': 59250 });
  step(t + ' 5 BPI to GCash', S, 'moved', { amount: 5000, account: 'bpi', to: 'gcash', date: '2026-11-21' }, {});
  step(t + ' 4 family support (C1)', S, 'family', { amount: 8000, account: 'gcash', who: 'Mama', date: '2026-12-05' }, { total: -8000, bills: -8000 });
  step(t + ' 9 surprise ask', S, 'family', { amount: 6500, account: 'bpi', who: 'Mama', place: 'emergency', date: '2026-12-06' }, { total: -6500, saved: -6500 });
  figs(t, S, { 'burrows.emergency': -1500 });   /* the burrow held 5,000: shown in amber, not refused */
  step(t + ' software on the card', S, 'bill', { amount: 1300, account: 'rcbc', date: '2026-12-07' }, { owed: 1300 });
  step(t + ' 8 pays the card', S, 'paidcard', { amount: 15900, account: 'bpi', who: 'rcbc', date: '2026-12-12' }, { total: -15900, bills: -15900, owed: -15900 });
  figs(t + ' end', S, { owed: 0, forCards: 0 });
  rep.ok(D.doorApply(S, 'pay', { amount: 0, account: 'bpi' }, TODAY).ask === 'amount', t + ' 7: a month where nothing landed is not an event (the pay day screen takes "nothing" by itself)');
  step(t + ' sends money abroad', S, 'moved', { amount: 5650, account: 'bpi', to: 'wise', landed: 100, date: '2026-12-13' }, { total: -5650, waiting: -5650 });
}
{ /* Carlo: two pay days, pay-later */
  const S = PICTURES.carlo(), t = 'carlo';
  figs(t + ' day one', S, { total: 7800, owed: 30280, waiting: -6000 });
  step(t + ' 4 cash in', S, 'moved', { amount: 1300, account: 'bdo', to: 'gcash', date: '2026-11-19' }, {});
  step(t + ' 5 GGives part (C5)', S, 'paidloan', { amount: 2150, account: 'gcash', who: 'ggives', date: '2026-11-20' }, { total: -2150, bills: -2150, owed: -2150 });
  figs(t, S, { owed: 28130, 'accounts.gcash': 60, 'accounts.ggives': 12900 });
  step(t + ' 6 shoes on SPayLater', S, 'spent', { amount: 2400, account: 'spl', date: '2026-11-22' }, { owed: 2400 });   /* no pile shrinks today */
  step(t + ' 7 pay lands early (C3, C4)', S, 'pay', { amount: 17100, account: 'bdo', date: '2026-11-27' }, { total: 17100, waiting: 17100 });
  step(t + ' 7 rent', S, 'bill', { amount: 7500, account: 'bdo', date: '2026-11-27' }, { total: -7500, bills: -7500 });
  step(t + ' 9 pays the card', S, 'paidcard', { amount: 9800, account: 'bdo', who: 'metro', date: '2026-12-03' }, { total: -9800, bills: -9800, owed: -9800 });
  step(t + ' second half of pay (C4)', S, 'pay', { amount: 16400, account: 'bdo', date: '2026-12-15' }, { total: 16400, waiting: 16400 });
  step(t + ' family on the 15th (C1)', S, 'family', { amount: 3000, account: 'bdo', date: '2026-12-15' }, { total: -3000, bills: -3000 });
  figs(t + ' end', S, { owed: 20730, 'accounts.metro': 0, 'cards.metro': 0 });
  rep.ok(J(L.periodOf(S, '2026-12-20')) === J({ from: '2026-12-15', to: '2026-12-30' }), t + ': a month runs from one pay day to the next');
}
{ /* Mika: one bank for spending, two cards paid in full, savings elsewhere, an instalment on a card */
  const S = PICTURES.mika(), t = 'mika';
  const f = figs(t + ' day one', S, { total: 264450, saved: 162750, owed: 75880, forCards: 44380, 'accounts.laptop': 31500 });
  rep.ok(c(f.accounts.ub) - c(f.forCards) === c(52020), t + ': UnionBank after the cards are paid is 52,020');
  step(t + ' 8 card after the cut-off', S, 'spent', { amount: 2600, account: 'ubcard', date: '2026-11-20' }, { free: -2600, bills: 2600, owed: 2600 });
  rep.ok(c(L.ledgerCardDue(S, 'ubcard', '2026-11-20').onCard) === c(15080), t + ' 8: owed now (what is due on the 7th is gap G5 below)');
  step(t + ' 5 pays the BPI card', S, 'paidcard', { amount: 31900, account: 'ub', who: 'bpicard', date: '2026-11-26' }, { total: -31900, bills: -31900, owed: -31900 });
  step(t + ' 6 pay', S, 'pay', { amount: 78000, account: 'ub', date: '2026-11-27' }, { total: 78000, waiting: 78000 });
  step(t + ' family on pay day', S, 'family', { amount: 10000, account: 'ub', date: '2026-11-27' }, { total: -10000, bills: -10000 });
  step(t + ' 7 tuition from the emergency fund', S, 'family', { amount: 25000, account: 'ub', who: 'Brother', place: 'emergency', date: '2026-11-28' }, { total: -25000, saved: -25000 });
  step(t + ' saves to travel, bank to GoTyme', S, 'saved', { amount: 9000, place: 'travel', account: 'ub', to: 'gotyme', date: '2026-11-28' }, { free: -9000, saved: 9000 });
  figs(t, S, { 'accounts.gotyme': 21750, 'burrows.travel': 21750 });
  step(t + ' a phone on a 0% plan', S, 'spent', { amount: 12000, account: 'laptop', date: '2026-11-29' }, { owed: 12000 });
  /* this month's part of the plan arrives on the card by itself (ledgerInstalment, not a kind of the door) and the door's figures follow */
  const b = D.doorFigures(S); must(t + ' instalment', L.ledgerInstalment(S, 'laptop', 'bpicard', 4500, '2026-12-01')); const a = D.doorFigures(S);
  rep.ok(c(a.owed) === c(b.owed) && c(a.total) === c(b.total) && c(a.bills) === c(b.bills) && c(a.cards.bpicard) === c(4500), t + ': the instalment is not counted twice');
  rule(t + ' end', S);
}
{ /* Jun and Tess: three pay days, cash, paluwagan, a store instalment */
  const S = PICTURES.juntess(), t = 'juntess';
  const f = figs(t + ' day one', S, { total: 32310, owed: 24675 });
  rep.ok(c(f.accounts.bdo) - c(f.cards.sb) === c(11400), t + ': BDO after the card is paid is 11,400');
  step(t + ' 4 ATM', S, 'moved', { amount: 5000, account: 'bdo', to: 'cash', date: '2026-11-20' }, {});
  step(t + ' 5 a week of market and fares in one line', S, 'spent', { amount: 2350, account: 'cash', date: '2026-11-26' }, { total: -2350, free: -2350 });
  step(t + ' 6 paluwagan, the simple way', S, 'bill', { amount: 2000, account: 'cash', note: 'paluwagan', date: '2026-11-30' }, { total: -2000, bills: -2000 });
  step(t + ' 7 family in cash (C1)', S, 'family', { amount: 4000, account: 'cash', who: 'Nanay', date: '2026-12-01' }, { total: -4000, bills: -4000 });
  step(t + ' Home Credit over the counter', S, 'paidloan', { amount: 1975, account: 'cash', who: 'homecredit', date: '2026-12-12' }, { total: -1975, bills: -1975, owed: -1975 });
  step(t + ' 10 the pot arrives, the simple way', S, 'otherin', { amount: 20000, account: 'bdo', note: 'paluwagan', date: '2026-12-15' }, { total: 20000, waiting: 20000 });
  step(t + ' Tess is paid, Jun is paid', S, 'pay', { amount: 29500, account: 'bdo', date: '2026-12-05' }, { total: 29500, waiting: 29500 });
  step(t + ' second income', S, 'pay', { amount: 13200, account: 'landbank', second: true, date: '2026-12-15' }, { total: 13200, waiting: 13200 });
  rep.ok(S.ledger[S.ledger.length - 1].startsPeriod === false, t + ': a second income does not start a new month');
  /* paluwagan, the exact way, from the first round: seven rounds in, the pot, three rounds after. Nothing is gained or lost */
  const P = PICTURES.juntess(), p0 = D.doorFigures(P);
  for (let i = 0; i < 7; i++) step(t + ' round ' + (i + 1), P, 'lent', { amount: 2000, account: 'cash', who: { name: 'Paluwagan' }, place: 'bills', date: '2026-12-0' + (i + 1) }, { bills: -2000, lent: 2000 });
  step(t + ' the pot: her own 14,000 back', P, 'paidback', { amount: 14000, account: 'bdo', who: 'lent_paluwagan', place: 'bills', date: '2026-12-08' }, { bills: 14000, lent: -14000 });
  step(t + ' the pot: 6,000 of the others', P, 'borrowed', { amount: 6000, account: 'bdo', who: { name: 'Paluwagan' }, date: '2026-12-08' }, { total: 6000, waiting: 6000, owed: 6000 });
  for (let i = 0; i < 3; i++) step(t + ' round ' + (i + 8), P, 'paidloan', { amount: 2000, account: 'cash', who: 'owe_paluwagan', place: 'waiting', date: '2026-12-1' + i }, { total: -2000, waiting: -2000, owed: -2000 });
  const p1 = D.doorFigures(P); FIG.forEach(k => rep.ok(c(p1[k]) === c(p0[k]), `${t}: after a whole paluwagan ${k} is ${p1[k]}, it started at ${p0[k]}`));
  rep.ok(c(p1.accounts.cash) === c(7500 - 20000) && c(p1.accounts.bdo) === c(18300 + 20000), t + ': 20,000 went in as cash and 20,000 came out into BDO');
}
{ /* Rina: GCash and cash, first card, small loans, 13th month */
  const S = PICTURES.rina(), t = 'rina';
  figs(t + ' day one', S, { total: 10670, owed: 15660 });
  const kuya = step(t + ' 4 borrows from someone new (C5)', S, 'borrowed', { amount: 1000, account: 'gcash', who: { name: 'Kuya Ben' }, date: '2026-11-19' }, { total: 1000, waiting: 1000, owed: 1000 });
  rep.ok(kuya.made && kuya.made.type === 'loan' && kuya.made.name === 'Kuya Ben', t + ': a new person she owes becomes a loan account with only a name');
  step(t + ' 5 GLoan part leaves GCash', S, 'paidloan', { amount: 1480, account: 'gcash', who: 'gloan', date: '2026-11-20' }, { total: -1480, bills: -1480, owed: -1480 });
  step(t + ' 6 first card buy', S, 'spent', { amount: 890, account: 'card', date: '2026-11-21' }, { free: -890, bills: 890, owed: 890 });
  step(t + ' 8 pay', S, 'pay', { amount: 24800, account: 'bpi', date: '2026-11-27' }, { total: 24800, waiting: 24800 });
  step(t + ' 8 bank to GCash', S, 'moved', { amount: 15000, account: 'bpi', to: 'gcash', date: '2026-11-27' }, {});
  step(t + ' 8 sends 5,000 home', S, 'family', { amount: 5000, account: 'gcash', date: '2026-11-27' }, { total: -5000, bills: -5000 });
  step(t + ' 10 her brother asks', S, 'family', { amount: 700, account: 'gcash', who: 'Brother', place: 'free', date: '2026-12-01' }, { total: -700, free: -700 });
  step(t + ' 9 13th month pay', S, 'pay', { amount: 12830, account: 'bpi', second: true, date: '2026-12-23' }, { total: 12830, waiting: 12830 });
  step(t + ' 9 the officemate first', S, 'paidloan', { amount: 5000, account: 'bpi', who: 'mate', place: 'waiting', date: '2026-12-23' }, { total: -5000, waiting: -5000, owed: -5000 });
  figs(t + ' end', S, { 'accounts.mate': 0, owed: 15660 + 1000 - 1480 + 890 - 5000 });
  rep.ok(J(L.periodOf(S, '2026-12-24')) === J({ from: '2026-11-28', to: '2026-12-28' }), t + ': 13th month pay did not start a new month');
}
{ /* Dan: a card balance carried, a bank loan, owes more than he has */
  const S = PICTURES.dan(), t = 'dan';
  figs(t + ' day one', S, { total: 33850, owed: 189050, forCards: 24750, 'cards.bdo': 0 });   /* the 68,400 is not set aside "for the card" */
  let r = step(t + ' 3 pays 3,400 to the BDO card', S, 'paidcard', { amount: 3400, account: 'metro', who: 'bdo', date: '2026-12-10' }, { total: -3400, bills: -3400, owed: -3400 });
  rep.ok(r.events.length === 1 && r.events[0].acct2 === 'bdo_old', t + ': nothing new on the card, so it all goes to the older balance');
  step(t + ' 3 interest on the older balance', S, 'bill', { amount: 1950, account: 'bdo_old', note: 'interest', date: '2026-12-20' }, { owed: 1950 });
  figs(t, S, { 'accounts.bdo_old': 66950 });
  step(t + ' new spending on the BDO card', S, 'spent', { amount: 2000, account: 'bdo', date: '2026-12-21' }, { free: -2000, bills: 2000, owed: 2000 });
  const before = snap(S);
  r = step(t + ' pays 3,400 again', S, 'paidcard', { amount: 3400, account: 'metro', who: 'bdo', date: '2026-12-22' }, { total: -3400, bills: -3400, owed: -3400 });
  rep.ok(r.events.length === 2 && r.events[0].c === 200000 && r.events[1].c === 140000, t + ': 2,000 to what is on the card, 1,400 to the older balance');
  figs(t, S, { 'accounts.bdo': 0, 'cards.bdo': 0, 'accounts.bdo_old': 65550 });
  rep.ok(!!D.doorUndo(S) && snap(S) === before, t + ': one undo takes both parts of the card payment back');
  D.doorRedo(S);
  step(t + ' pays the Metrobank card', S, 'paidcard', { amount: 24750, account: 'metro', who: 'metrocard', date: '2026-12-02' }, { total: -24750, bills: -24750, owed: -24750 });
  step(t + ' the bank loan takes its part', S, 'paidloan', { amount: 6850, account: 'metro', who: 'bankloan', date: '2026-12-05' }, { total: -6850, bills: -6850, owed: -6850 });
  step(t + ' a loan part taken out of pay before it lands', S, 'paidloan', { amount: 1000, who: 'bankloan', fromPay: true, date: '2026-12-22' }, { owed: -1000 });
  step(t + ' overpays a card paid in full', S, 'paidcard', { amount: 500, account: 'metro', who: 'metrocard', date: '2026-12-23' }, { total: -500, bills: -500, owed: -500 });
  figs(t + ' end', S, { 'accounts.metrocard': -500, 'cards.metrocard': -500 });
}
{ /* Wallet mode, and money beside Total */
  const S = PICTURES.wallet(), t = 'wallet';
  figs(t + ' start', S, { free: 4000, 'accounts.wallet': 4000, 'beside.USD': 120, 'owedBeside.USD': 50, owed: 12000 });
  step(t + ' takes out cash to spend', S, 'moved', { amount: 5000, account: 'bank', to: 'wallet', date: '2026-11-25' }, { total: -5000, waiting: -5000, free: 5000 });
  step(t + ' spends from the wallet', S, 'spent', { amount: 300, account: 'wallet', date: '2026-11-25' }, {});
  step(t + ' pays the card from the wallet', S, 'paidcard', { amount: 1000, account: 'wallet', who: 'full', date: '2026-11-26' }, { bills: -1000, waiting: 1000, owed: -1000 });
  const r = step(t + ' lends from the wallet', S, 'lent', { amount: 500, account: 'wallet', who: { name: 'Lea' }, date: '2026-11-26' }, { total: 500, lent: 500 });
  step(t + ' is paid back into the wallet', S, 'paidback', { amount: 500, account: 'wallet', who: r.made.id, date: '2026-11-27' }, { total: -500, lent: -500 });
  step(t + ' pays the card it does not pay in full', S, 'paidcard', { amount: 800, account: 'bank', who: 'carry', date: '2026-11-28' }, { total: -800, bills: -800, owed: -800 });
  step(t + ' pays the dollar card from dollars', S, 'paidcard', { amount: 20, account: 'payo', who: 'usdcard', date: '2026-11-28' }, {});
  figs(t, S, { 'beside.USD': 100, 'owedBeside.USD': 30 });
  step(t + ' a new pay', S, 'pay', { amount: 20000, account: 'bank', date: '2026-12-15' }, { total: 20000, waiting: 20000, free: -9000 });   /* handed out since pay day starts again at zero */
}
{ /* section C6: shared costs, both ways of writing it net out exactly */
  const S = PICTURES.bea(), t = 'shared rent', f0 = D.doorFigures(S);
  step(t + ' her half', S, 'bill', { amount: 12000, account: 'bpi', date: '2026-12-01' }, { total: -12000, bills: -12000 });
  const r = step(t + ' the flatmate\'s half (C6)', S, 'lent', { amount: 12000, account: 'bpi', who: { name: 'Flatmate' }, place: 'bills', date: '2026-12-01' }, { bills: -12000, lent: 12000 });
  step(t + ' paid back (C6)', S, 'paidback', { amount: 12000, account: 'gcash', who: r.made.id, place: 'bills', date: '2026-12-03' }, { bills: 12000, lent: -12000 });
  const f1 = D.doorFigures(S); rep.ok(c(f1.total) === c(f0.total) - 1200000 && c(f1.bills) === c(f0.bills) - 1200000 && c(f1.lent) === 0, t + ': her rent cost her 12,000, not 24,000');
  const T = PICTURES.bea();
  step(t + ' all of it as a bill', T, 'bill', { amount: 24000, account: 'bpi', date: '2026-12-01' }, { total: -24000, bills: -24000 });
  step(t + ' half comes back as a refund (C7)', T, 'refund', { amount: 12000, account: 'gcash', place: 'bills', date: '2026-12-03' }, { total: 12000, bills: 12000 });
  const f2 = D.doorFigures(T); FIG.forEach(k => rep.ok(c(f2[k]) === c(f1[k]), `${t}: the two ways of writing it differ in ${k}`));
}

/* ---------- refusals leave nothing behind ---------- */
{
  const S = PICTURES.rina(), E = PICTURES.empty(), t = 'refusals';
  refused(t + ' unknown kind', S, 'kind', () => D.doorApply(S, 'lottery', { amount: 1, account: 'bpi' }, TODAY));
  refused(t + ' no amount', S, 'ask', () => D.doorApply(S, 'spent', { account: 'bpi' }, TODAY));
  refused(t + ' below zero', S, 'ask', () => D.doorApply(S, 'spent', { amount: -5, account: 'bpi' }, TODAY));
  refused(t + ' half a cent', S, 'ask', () => D.doorApply(S, 'spent', { amount: 1.005, account: 'bpi' }, TODAY));
  refused(t + ' no account', S, 'ask', () => D.doorApply(S, 'spent', { amount: 5 }, TODAY));
  refused(t + ' pay onto a card', S, 'acct-kind', () => D.doorApply(S, 'pay', { amount: 5, account: 'card' }, TODAY));
  refused(t + ' paid a card that is a loan', S, 'acct-kind', () => D.doorApply(S, 'paidcard', { amount: 5, account: 'bpi', who: 'gloan' }, TODAY));
  refused(t + ' a loan that is a card paid in full', S, 'acct-kind', () => D.doorApply(S, 'paidloan', { amount: 5, account: 'bpi', who: 'card' }, TODAY));
  refused(t + ' paid back by nobody', S, 'ask', () => D.doorApply(S, 'paidback', { amount: 5, account: 'bpi', who: { name: 'Nobody' } }, TODAY));
  refused(t + ' the place lent by hand', S, 'place-kind', () => D.doorApply(S, 'spent', { amount: 5, account: 'bpi', place: 'lent' }, TODAY));
  refused(t + ' saved into Free to spend', S, 'place-kind', () => D.doorApply(S, 'saved', { amount: 5, place: 'free' }, TODAY));
  refused(t + ' saved with no burrow', S, 'ask', () => D.doorApply(S, 'saved', { amount: 5 }, TODAY));
  refused(t + ' a day that has not come', S, 'future', () => D.doorApply(S, 'lent', { amount: 5, account: 'bpi', who: { name: 'Tomorrow' }, date: '2027-01-01' }, TODAY));
  refused(t + ' before the opening', S, 'before-open', () => D.doorApply(S, 'borrowed', { amount: 5, account: 'bpi', who: { name: 'Earlier' }, date: '2026-11-01' }, TODAY));
  refused(t + ' yen with cents', E, 'amount-whole', () => D.doorApply(E, 'lent', { amount: 5.5, account: 'bank', who: { name: 'Sen' } }, TODAY));
  refused(t + ' two currencies, nothing landed', E, 'ask', () => D.doorApply(E, 'moved', { amount: 10, account: 'usd', to: 'bank' }, TODAY));
  const whole = J(S), pv = D.doorPreview(S, 'spent', { amount: 890, account: 'card' }, TODAY);
  rep.ok(pv.ok && c(pv.moved.free) === c(-890) && J(S) === whole, t + ': a preview shows what would move and records nothing');
}

/* ---------- 5. nothing counted twice (A8) ---------- */
{
  const S = PICTURES.bea(), t = 'A8';
  /* a bill typed by hand, then its receipt */
  const bill = must(t, D.doorApply(S, 'bill', { amount: 12000, account: 'bpi', date: '2026-12-01', note: 'rent' }, TODAY));
  const twin = refused(t + ' the receipt of a bill already logged', S, 'seen', () => D.doorApply(S, 'bill', { amount: 12000, account: 'bpi', date: '2026-12-01', src: 'receipt:r-881' }, TODAY));
  rep.ok(J(twin.seen) === J([bill.events[0].id]), t + ': the refusal names the event it would repeat');
  /* the same line read from the bank statement as another kind is still the same money */
  refused(t + ' the statement line of that bill', S, 'seen', () => D.doorApply(S, 'spent', { amount: 12000, account: 'bpi', date: '2026-12-01', src: 'stmt:bpi-dec:4' }, TODAY));
  /* two real payments of the same amount: the person says so */
  step(t + ' a second real payment, confirmed', S, 'bill', { amount: 12000, account: 'bpi', date: '2026-12-01', src: 'receipt:r-882', sure: true }, { total: -12000, bills: -12000 });
  refused(t + ' the same receipt again', S, 'already', () => D.doorApply(S, 'bill', { amount: 12000, account: 'bpi', date: '2026-12-01', src: 'receipt:r-882', sure: true }, TODAY));
  rep.ok(L.ledgerHas(S, 'receipt:r-882'), t + ': the receipt is known as logged');
  /* two equal lines in one statement are two things */
  step(t + ' coffee, line 7', S, 'spent', { amount: 150, account: 'gcash', date: '2026-12-02', src: 'stmt:gcash-dec:7' }, { total: -150, free: -150 });
  step(t + ' coffee, line 8', S, 'spent', { amount: 150, account: 'gcash', date: '2026-12-02', src: 'stmt:gcash-dec:8' }, { total: -150, free: -150 });
  /* typed by hand twice: recorded, with a hint */
  const again = step(t + ' typed twice', S, 'spent', { amount: 150, account: 'gcash', date: '2026-12-02' }, { total: -150, free: -150 });
  rep.ok(again.seen.length === 2, t + ': a line typed by hand that looks like one already there is recorded and says so');
  /* the same amount two days later from one account is another thing */
  step(t + ' same amount, another day', S, 'spent', { amount: 150, account: 'gcash', date: '2026-12-04', src: 'stmt:gcash-dec:15' }, { total: -150, free: -150 });

  /* a transfer seen on two statements */
  const f0 = D.doorFigures(S);
  step(t + ' BPI statement: to GCash', S, 'moved', { amount: 5000, account: 'bpi', to: 'gcash', date: '2026-12-05', src: 'stmt:bpi-dec:9' }, {});
  refused(t + ' GCash statement: the same transfer, a day later', S, 'seen', () => D.doorApply(S, 'moved', { amount: 5000, account: 'bpi', to: 'gcash', date: '2026-12-06', src: 'stmt:gcash-dec:21' }, TODAY));
  refused(t + ' GCash statement read as money in', S, 'seen', () => D.doorApply(S, 'otherin', { amount: 5000, account: 'gcash', date: '2026-12-06', src: 'stmt:gcash-dec:21' }, TODAY));
  const f1 = D.doorFigures(S); rep.ok(c(f1.total) === c(f0.total) && c(f1.accounts.gcash) === c(f0.accounts.gcash) + 500000 && c(f1.accounts.bpi) === c(f0.accounts.bpi) - 500000, t + ': the transfer is in the picture once');
  /* a card payment seen on the bank statement and on the card statement */
  step(t + ' bank statement: card payment', S, 'paidcard', { amount: 14600, account: 'bpi', who: 'rcbc', date: '2026-12-12', src: 'stmt:bpi-dec:30' }, { total: -14600, bills: -14600, owed: -14600 });
  refused(t + ' card statement: payment received', S, 'seen', () => D.doorApply(S, 'refund', { amount: 14600, account: 'rcbc', date: '2026-12-14', src: 'stmt:rcbc-dec:2' }, TODAY));
  refused(t + ' card statement: the same payment as a payment', S, 'seen', () => D.doorApply(S, 'paidcard', { amount: 14600, account: 'bpi', who: 'rcbc', date: '2026-12-13', src: 'stmt:rcbc-dec:2' }, TODAY));
  figs(t + ' end', S, { 'accounts.rcbc': 0, 'cards.rcbc': 0, owed: 0 });
  /* dollars brought home: the Wise line and the BPI line are one event */
  step(t + ' Wise statement: USD 300 out', S, 'moved', { amount: 300, account: 'wise', to: 'bpi', landed: 16950, date: '2026-12-15', src: 'stmt:wise-dec:1' }, { total: 16950, waiting: 16950 });
  refused(t + ' BPI statement: 16,950 in', S, 'seen', () => D.doorApply(S, 'pay', { amount: 16950, account: 'bpi', date: '2026-12-16', src: 'stmt:bpi-dec:41' }, TODAY));
}

/* ---------- 6. gaps: what the ledger lacks today (LANE_money_door.md). Not failures of the door ---------- */
{
  const gap = (name, closed) => console.log((closed ? 'GAP CLOSED, update LANE_money_door.md: ' : 'GAP (open, expected): ') + name);
  { const S = PICTURES.bea(), t = 'G1', n0 = S.ledger.length, B = 'stmt:bpi-dec:9', G = 'stmt:gcash-dec:21';   /* G1, closed by the ledger core third pass: hard checks now */
    const first = D.doorApply(S, 'moved', { amount: 5000, account: 'bpi', to: 'gcash', date: '2026-12-05', src: B }, TODAY), f0 = J(D.doorFigures(S));
    const second = refused(t + ' the GCash line of the same transfer', S, 'seen', () => D.doorApply(S, 'moved', { amount: 5000, account: 'bpi', to: 'gcash', date: '2026-12-06', src: G }, TODAY));
    rep.ok(L.ledgerHas(S, G) === false && second.seen.length === 1 && second.seen[0] === first.events[0].id, t + ': a refusal records nothing; it names the event that holds this money');
    /* the person (or the import) says: yes, the same money. The event now remembers both statement lines */
    const same = typeof D.doorSame === 'function' ? D.doorSame(S, second.seen[0], G) : null;
    rep.ok(!!same && same.ok === true && L.ledgerHas(S, G) === true && L.ledgerHas(S, B) === true, t + ': the second statement line of the transfer is remembered as logged');
    rep.ok(S.ledger.length === n0 + 1 && J(D.doorFigures(S)) === f0, t + ': remembering a line adds no event and moves no figure');
    refused(t + ' the GCash file imported again, the same line', S, 'already', () => D.doorApply(S, 'moved', { amount: 5000, account: 'bpi', to: 'gcash', date: '2026-12-06', src: G }, TODAY));
    refused(t + ' the same line read as money in', S, 'already', () => D.doorApply(S, 'otherin', { amount: 5000, account: 'gcash', date: '2026-12-06', src: G }, TODAY));
    refused(t + ' the BPI file imported again', S, 'already', () => D.doorApply(S, 'moved', { amount: 5000, account: 'bpi', to: 'gcash', date: '2026-12-05', src: B }, TODAY));
    if (typeof D.doorSame === 'function') { refused(t + ' remembered twice', S, 'already', () => D.doorSame(S, second.seen[0], G)); refused(t + ' no such event', S, 'no-id', () => D.doorSame(S, 987654, 'stmt:gcash-dec:22')); refused(t + ' a typed line has no source to remember', S, 'src', () => D.doorSame(S, second.seen[0], 'typed')); }
    /* another line of the GCash file with the same amount two days on is another thing: the transfer already has its GCash line */
    step(t + ' a second, real transfer on the GCash statement', S, 'moved', { amount: 5000, account: 'bpi', to: 'gcash', date: '2026-12-07', src: 'stmt:gcash-dec:22' }, {});
    D.doorUndo(S);
    /* undo takes the event out with both of its lines; redo brings both back */
    D.doorUndo(S, first.events[0].id); rep.ok(L.ledgerHas(S, G) === false && L.ledgerHas(S, B) === false, t + ': with the transfer undone neither line counts as logged');
    D.doorRedo(S); rep.ok(L.ledgerHas(S, G) === true && L.ledgerHas(S, B) === true && J(D.doorFigures(S)) === f0, t + ': redo brings the transfer back with both lines');
    const R = JSON.parse(J(S)); rep.ok(L.ledgerClean(R).ok && L.ledgerHas(R, G) === true, t + ': saved and loaded, the second line is still known'); }
  { const S = PICTURES.bea(), saved = L.placesOf(S).saved;
    D.doorApply(S, 'lent', { amount: 390, account: 'bpi', who: { name: 'Lea' }, date: '2026-12-05' }, TODAY);
    const p = L.placesOf(S), f = D.doorFigures(S);   /* G2, closed by the ledger core third pass: a hard check now */
    rep.ok(c(p.saved) === c(saved) && !('lent' in p.burrows), 'G2 placesOf: 390 lent is not in Saved and not among the burrows');
    rep.ok(c(p.lent) === 39000 && c(p.total) === c(p.waiting) + c(p.thisMonth) + c(p.saved) + c(p.lent), 'G2 placesOf: what is lent is a figure of its own, inside Total');
    rep.ok(c(f.lent) === c(p.lent) && c(f.saved) === c(p.saved) && J(f.burrows) === J(p.burrows) && c(f.lent) === c(p.accounts.lent_lea), 'G2 the door shows the ledger\'s own figures, and Lent is what Lea owes'); }
  { const S = PICTURES.bea(), t = 'G3', LEA = { amount: 390, account: 'bpi', who: { name: 'Lea' }, date: '2026-12-05' };   /* G3, closed by the ledger core fourth pass: hard checks now */
    const accts0 = J(S.accounts), led0 = J(S.ledger), f0 = J(D.doorFigures(S));
    const r = D.doorApply(S, 'lent', LEA, TODAY), accts1 = J(S.accounts), led1 = J(S.ledger), f1 = J(D.doorFigures(S));
    rep.ok(r.ok && !!r.made && r.made.id === 'lent_lea' && S.accounts.some(a => a.id === 'lent_lea') && accts1 !== accts0, t + ': lending to Lea, a new person, makes her account');
    rep.ok(!!D.doorUndo(S), t + ': undo refused');
    rep.ok(J(S.accounts) === accts0, t + ': after undoing the first "Lent" to Lea the accounts are as before, byte for byte (her empty account does not stay)');
    rep.ok(J(S.ledger) === led0 && J(D.doorFigures(S)) === f0, t + ': undo puts the events and every figure back');
    rule(t + ' undone', S);
    /* saved and loaded with the step undone: the step and her account are still there to put back */
    const R = JSON.parse(J(S)); rep.ok(L.ledgerClean(R).ok && R.undone.length === 1 && J(R.accounts) === accts0, t + ': saved and loaded, the undone step is kept');
    rep.ok(!!D.doorRedo(R) && J(R.accounts) === accts1 && J(R.ledger) === led1 && J(D.doorFigures(R)) === f1, t + ': redo on the loaded copy brings Lea\'s account and the events back');
    rep.ok(!!D.doorRedo(S) && J(S.accounts) === accts1 && J(S.ledger) === led1 && J(D.doorFigures(S)) === f1, t + ': redo brings Lea\'s account and the events back exactly');
    rule(t + ' redone', S);
    rep.ok(!!D.doorUndo(S) && J(S.accounts) === accts0 && J(S.ledger) === led0 && J(D.doorFigures(S)) === f0, t + ': undo again takes both out');
    /* lend to Lea again after the undo: a new step. Nothing of the first try is lost, it is kept outside every sum */
    const again = D.doorApply(S, 'lent', LEA, TODAY);
    rep.ok(again.ok && J(D.doorFigures(S)) === f1 && S.undone.length === 0 && J(S.removed).includes('lent_lea'), t + ': lending again after the undo works, and the first try is kept in S.removed');
    /* a second loan to the same person: her account stays while any event names it */
    const two = D.doorApply(S, 'lent', { amount: 110, account: 'bpi', who: 'lent_lea', date: '2026-12-06' }, TODAY);
    rep.ok(two.ok && !two.made, t + ': a second loan to Lea makes no account');
    rep.ok(!!D.doorUndo(S, again.events[0].id) && S.accounts.some(a => a.id === 'lent_lea') && c(D.doorFigures(S).lent) === c(110), t + ': with the first loan undone by id, her account stays for the second (110 lent)');
    rep.ok(!!D.doorUndo(S) && J(S.accounts) === accts0 && J(D.doorFigures(S)) === f0, t + ': with the second undone too, her account is gone and every figure is as at the start');
    rep.ok(!!D.doorRedo(S) && !!D.doorRedo(S) && S.accounts.some(a => a.id === 'lent_lea') && c(D.doorFigures(S).lent) === c(500), t + ': two redos bring both loans back (500 lent)');
    rule(t + ' end', S);
    /* borrowed from somebody new: the same for a loan account */
    const S2 = PICTURES.bea(), a0 = J(S2.accounts), b = D.doorApply(S2, 'borrowed', { amount: 1000, account: 'bpi', who: { name: 'Tita Mila' }, date: '2026-12-05' }, TODAY);
    rep.ok(b.ok && !!b.made && !!D.doorUndo(S2) && J(S2.accounts) === a0, t + ': undoing "Borrowed" from a new person takes her loan account out too'); }
  { const S = PICTURES.mika();   /* her UnionBank card: cut-off the 17th, 12,480 typed on the 19th, then 2,600 spent on the 20th */
    D.doorApply(S, 'spent', { amount: 2600, account: 'ubcard', date: '2026-11-20' }, TODAY); const due = L.ledgerCardDue(S, 'ubcard', '2026-11-20');
    gap('G5 a card balance typed after the cut-off day counts as spent after it: due on the 7th shows ' + due.due + ' (should be 12,480, with 2,600 later)', c(due.due) === c(12480) && c(due.later) === c(2600)); }
  { const S = PICTURES.wallet(), t0 = c(D.doorFigures(S).total), free = () => c(D.doorFigures(S).free);   /* G4, closed by the ledger core third pass: hard checks now */
    D.doorApply(S, 'moved', { amount: 1500, account: 'wallet', to: 'bank', date: '2026-11-25' }, TODAY);
    rep.ok(free() === c(2500), 'G4 Wallet mode: 4,000 handed out, 1,500 put back in the bank: Free to spend (handed out since pay day) is 2,500, shows ' + free() / 100);
    rep.ok(c(D.doorFigures(S).total) === t0 + 150000 && c(L.placesOf(S).wallet) === c(2500), 'G4 the money put back is inside Total again');
    D.doorUndo(S); rep.ok(free() === c(4000), 'G4 undo of the put-back: 4,000 handed out again'); D.doorRedo(S); rep.ok(free() === c(2500), 'G4 redo: 2,500');
    D.doorApply(S, 'moved', { amount: 3000, account: 'wallet', to: 'gcash', date: '2026-11-26' }, TODAY);
    rep.ok(free() === 0, 'G4 more put back than was handed out since pay day: handed out shows 0, never below');
    D.doorApply(S, 'moved', { amount: 800, account: 'bank', to: 'wallet', date: '2026-11-27' }, TODAY);
    rep.ok(free() === c(800), 'G4 a later hand-out counts in full: 800, shows ' + free() / 100);
    D.doorApply(S, 'moved', { amount: 200, account: 'wallet', to: 'bank', date: '2026-11-18' }, TODAY);
    rep.ok(free() === c(800), 'G4 a late line: money put back before the last pay day does not touch what was handed out since'); }
}
rep.end();
