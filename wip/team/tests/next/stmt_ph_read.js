/* stmt_ph.js against the made-up Philippine statements in fixtures_ph. Pure node, no browser, no network, no AI.
   Run: node tests/next/stmt_ph_read.js   Ends with STMT PH PASS or STMT PH FAIL n. */
const fs = require('fs'), path = require('path');
const P = require(path.join(__dirname, '..', '..', 'stmt_ph.js')), dir = path.join(__dirname, 'fixtures_ph');
let bad = 0, n = 0; const ok = (c, what) => { n++; if (!c) { bad++; console.log('FAIL ' + what); } };
const eq = (a, b, what) => ok(a === b, `${what}: got ${a}, want ${b}`);
const text = f => fs.readFileSync(path.join(dir, f), 'utf8'), files = fs.readdirSync(dir).sort();
const C = P.phCents, reads = {}; files.forEach(f => { reads[f] = P.phRead(text(f), { file: f }); });

/* 1. money and dates */
eq(C('1,234.50'), 123450, 'cents'); eq(C('-0.62'), -62, 'cents minus'); eq(C('(1,500.00)'), -150000, 'cents brackets'); eq(C('845.50-'), -84550, 'cents trailing minus'); eq(C('12'), null, 'not money'); eq(C('1,23.50'), null, 'bad commas');
eq(P.phAnyDate('January 08, 2026'), '2026-01-08', 'long date'); eq(P.phAnyDate('08/05/2026'), '2026-08-05', 'month first'); eq(P.phAnyDate('21-Aug-2026'), '2026-08-21', 'day mon year'); eq(P.phAnyDate('02/30/2026'), '', 'no 30 Feb');

/* 2. every fixture: read without AI, every row accounted for, sums equal the statement's own figures */
const want = { 'bdo_card_2026-09.txt': ['bdo', 'card', 9], 'bdo_savings_2026-08.txt': ['bdo', 'bank', 13], 'bpi_savings_2026-08.txt': ['bpi', 'bank', 6], 'bpi_savings_noyear_2026-01.txt': ['bpi', 'bank', 4], 'gcash_2026-08-20_to_09-15.txt': ['gcash', 'ewallet', 10], 'gcash_2026-08.txt': ['gcash', 'ewallet', 12], 'maya_savings_2026-08.txt': ['maya', 'bank', 5], 'metrobank_card_2026-01.txt': ['metrobank', 'card', 4], 'metrobank_savings_2026-08.txt': ['metrobank', 'bank', 3], 'unionbank_2026-08.csv': ['unionbank', 'bank', 4] };
eq(files.length, Object.keys(want).length + 2, 'fixture count');
const printed = (f, re) => { const m = text(f).split('\n').map(l => re.exec(l)).filter(Boolean)[0]; return m ? C(m[1]) : null; };
files.forEach(f => {
  const r = reads[f], w = want[f]; if (/_dates\.txt$/.test(f)) return; if (!w) return ok(false, f + ' has no expectation');
  ok(r.ok, `${f} read: ${r.why}`); eq(r.provider, w[0], f + ' provider'); eq(r.kind, w[1], f + ' kind'); eq(r.rows.length, w[2], f + ' rows'); eq(r.unread.length, 0, f + ' unread lines');
  /* counted a second way: lines that start with a date and end with money (the period and heading lines have no money) */
  const dated = text(f).split('\n').filter(l => { const cells = f.endsWith('.csv') ? P.phCsvRows(l)[0] || [] : null; const d = P.phLeadDate((cells ? cells[0] : l.trim()) + ' '); return d && (cells ? cells.length >= 4 : /\d\.\d{2}( CR)?$/.test(l.trim())) && !/^(statement|payment)/i.test(l); }).length;
  eq(r.rows.length, dated, f + ' every dated line became a row');
  const sIn = r.rows.filter(x => x.dir === 'in').reduce((s, x) => s + x.c, 0), sOut = r.rows.filter(x => x.dir === 'out').reduce((s, x) => s + x.c, 0);
  eq(sIn, r.totalIn, f + ' in'); eq(sOut, r.totalOut, f + ' out');
  r.rows.forEach(x => { ok(Number.isInteger(x.c) && x.c > 0, f + ' whole cents'); ok(/^\d{4}-\d{2}-\d{2}$/.test(x.date), f + ' date'); ok(/^ph1:/.test(x.lid), f + ' line id'); ok(x.conf >= 0 && x.conf <= 1 && x.k && x.cat, f + ' guess'); });
  eq(new Set(r.rows.map(x => x.lid)).size, r.rows.length, f + ' line ids are all different');
  if (w[1] === 'card') { eq(r.closing, printed(f, /^Total Amount Due ([\d,.]+)/), f + ' total due'); eq(r.prev + sOut - sIn, r.due, f + ' previous + purchases - payments = due'); eq(sIn, printed(f, /^Payments.*? ([\d,.]+)$/), f + ' payments box'); }
  else {
    eq(r.opening + sIn - sOut, r.closing, f + ' opening + in - out = closing');
    const pc = printed(f, /^(?:ENDING BALANCE|Ending [Bb]alance):? (?:PHP )?([\d,.]+)/); if (pc !== null) eq(r.closing, pc, f + ' printed closing'); else ok(f.endsWith('.csv'), f + ' should print a closing balance');
    const pd = printed(f, /^Total (?:Debits?|Withdrawals|debits):? (?:PHP )?([\d,.]+)/), pcr = printed(f, /^Total (?:Credits?|Deposits|credits):? (?:PHP )?([\d,.]+)/);
    if (pd !== null) eq(sOut, pd, f + ' printed total out'); if (pcr !== null) eq(sIn, pcr, f + ' printed total in');
  }
});
/* figures typed here by hand, so the test does not only agree with itself */
eq(reads['gcash_2026-08.txt'].closing, 60068, 'GCash August closing'); eq(reads['bdo_savings_2026-08.txt'].closing, 7781492, 'BDO closing'); eq(reads['bdo_card_2026-09.txt'].due, 554475, 'BDO card due'); eq(reads['bpi_savings_2026-08.txt'].order, 'newest', 'BPI is newest first');
eq(reads['bdo_card_2026-09.txt'].stmtDate, '2026-09-05', 'cut-off'); eq(reads['bdo_card_2026-09.txt'].dueDate, '2026-09-26', 'due date'); eq(reads['bdo_card_2026-09.txt'].min, 85000, 'minimum due');
const inst = reads['bdo_card_2026-09.txt'].rows.find(r => r.inst); ok(inst && inst.inst.n === 3 && inst.inst.of === 12 && inst.inst.left === 1125000, 'instalment 3 of 12, 11,250.00 still owed');
/* dates with no year: the year comes from the statement, and the new year is crossed the right way */
eq(reads['metrobank_card_2026-01.txt'].rows.map(r => r.date).join(), '2025-12-18,2025-12-28,2025-12-30,2026-01-04', 'card dates across the new year');
eq(reads['metrobank_card_2026-01.txt'].rows[2].post, '2026-01-02', 'post date'); eq(reads['bpi_savings_noyear_2026-01.txt'].rows.map(r => r.date).join(), '2025-12-29,2025-12-31,2026-01-02,2026-01-05', 'BPI dates with no year');
/* the date is the statement line's, never the file name's */
eq(P.phRead(text('gcash_2026-08.txt'), { file: 'statement-1999-01.pdf' }).rows[0].date, '2026-08-02', 'file name ignored');
ok(reads['metrobank_savings_2026-08.txt'].rows.some(r => /CHECK DEPOSIT RENTAL INCOME UNIT 3B/.test(r.text)), 'wrapped description joined');
const gg = reads['gcash_2026-08-20_to_09-15.txt'].rows.find(r => /GGives/.test(r.text)); ok(gg && gg.dir === 'out' && gg.cat === 'loan' && gg.k === 'repay', 'GGives deduction is a loan payment');

/* 3. refuse aloud, never guess: a changed amount, a missing row, a wrong total */
const g = text('gcash_2026-08.txt');
let r = P.phRead(g.replace('1,845.32', '1,845.23')); ok(!r.ok && /chain/.test(r.why), 'a changed amount is refused: ' + r.why);
r = P.phRead(g.split('\n').filter(l => !/Meralco/.test(l)).join('\n')); ok(!r.ok, 'a missing row is refused');
r = P.phRead(g.replace(/Total Debit .*/, 'Total Debit 1.00')); ok(!r.ok && /totals/.test(r.why), 'a wrong printed total is refused');
r = P.phRead(text('bdo_card_2026-09.txt').replace('2,345.75', '2,345.57')); ok(!r.ok, 'a card statement that does not add up is refused');
r = P.phRead('hello\nthis is not a statement'); ok(!r.ok && r.rows.length === 0, 'not a statement');
r = P.phRead(''); ok(!r.ok, 'empty');
r = P.phRead(g.replace('Payment to Meralco 7012345600038 1,845.32 2,304.68', 'Payment to Meralco 7012345600038 1,845.32')); ok(!r.ok, 'a row with no balance is refused');

/* 3b. 03/08/2026 is never read silently: the order is proved from the file, or the read is refused and the person is asked */
const amb = text('ambiguous_dates.txt'); r = P.phRead(amb); ok(!r.ok && r.ask === 'dateOrder' && /day from the month/.test(r.why) && r.rows.length === 0, 'ambiguous dates are refused: ' + r.why);
r = P.phRead(amb, { dateOrder: 'dm' }); ok(r.ok && r.rows.map(x => x.date).join() === '2026-08-03,2026-08-03,2026-09-05', 'answered day first: ' + r.rows.map(x => x.date).join());
r = P.phRead(amb, { dateOrder: 'md' }); ok(r.ok && r.rows.map(x => x.date).join() === '2026-03-08,2026-03-08,2026-05-09', 'answered month first');
r = P.phRead(text('dayfirst_dates.txt')); ok(r.ok && r.dateOrder === 'dm' && r.rows.map(x => x.date).join() === '2026-08-03,2026-08-25,2026-09-05', 'a day over 12 proves day first: ' + r.why);
eq(P.phDateOrder('01/02/2026 a 1.00 2.00\n01/03/2026 b 1.00 3.00\n02/01/2026 c 1.00 4.00'), 'md', 'in order only as month first');
eq(P.phDateOrder('01/02/2026 a\n01/03/2026 b\n02/01/2026 c\n13/01/2026 d\n01/14/2026 e'), '', 'both proofs at once is a refusal'); eq(P.phDateOrder('2026-08-03 x\n05 Aug 2026 y'), 'same', 'no numeric dates, nothing to decide'); eq(reads['bdo_savings_2026-08.txt'].dateOrder, 'md', 'BDO fixture is proved month first');
P.phRead(text('dayfirst_dates.txt')); eq(P.phAnyDate('08/05/2026'), '2026-08-05', 'the order of one file does not leak into the next');

/* 4. overlap and double import add nothing */
const A = reads['gcash_2026-08.txt'], B = reads['gcash_2026-08-20_to_09-15.txt'];
let m = P.phMerge([A, B]); eq(m.rows.length, 16, 'two overlapping GCash statements: 16 lines, not 22'); eq(m.dupes, 6, 'six lines were in both');
eq(m.rows.filter(x => x.dir === 'in').reduce((s, x) => s + x.c, 0) - m.rows.filter(x => x.dir === 'out').reduce((s, x) => s + x.c, 0), B.closing - A.opening, 'merged rows take the first opening to the last closing');
m = P.phMerge([A, P.phRead(text('gcash_2026-08.txt'), { file: 'copy.pdf' })]); eq(m.rows.length, 12, 'the same file twice'); eq(m.dupes, 12, 'twelve repeats');
const all = files.filter(f => want[f]).map(f => reads[f]), first = P.phPrepare(all, [], []), ev1 = P.phEvents(first.rows);
const known = []; ev1.forEach(e => { known.push(e.src.lid); if (e.src.lid2) known.push(e.src.lid2); });
const again = P.phPrepare(files.filter(f => want[f]).map(f => P.phRead(text(f), { file: f })), known, []);
eq(again.already, again.rows.length, 'second import: every line is already logged'); eq(P.phEvents(again.rows).length, 0, 'second import adds no event'); eq(again.totals.in + again.totals.out + again.totals.moved, 0, 'second import adds no money');
ok(again.rows.every(x => x.keep === false), 'already logged lines come back unticked');
/* the two identical Jollibee charges one minute apart are two lines, not one */
eq(A.rows.filter(x => /Jollibee/.test(x.text) && x.dir === 'out').length, 2, 'two real charges stay two');

/* 5. own transfers pair up, reversals pair up, and neither counts as spending or income */
eq(first.transfers, 6, 'six own transfers paired'); eq(first.reversals, 5, 'five charge and reversal pairs');
const row = re => first.rows.filter(x => re.test(x.text));
const pairOf = x => first.rows.find(y => y.lid === x.pair);
[[/INSTAPAY TO GCASH/, 'gcash'], [/INSTAPAY TO BPI/, 'bpi'], [/SEND TO MAYA/, 'maya'], [/Transfer to Metrobank/, 'metrobank'], [/to BPI$/, 'bpi'], [/BDO CREDIT CARD/, 'bdo_card']].forEach(([re, to]) => { const o = row(re)[0], i = o && pairOf(o); ok(o && i && i.acct.split(':')[0] === to && i.c === o.c && i.dir === 'in' && o.dir === 'out', 'pair ' + re); });
ok(row(/Cash-in from BDO/).filter(x => x.date === '2026-09-01')[0].pair === undefined, 'a cash-in with no other side stays unpaired, and is still not income');
ok(!row(/PAYROLL|Payroll/).some(x => x.pair) && !row(/ATM/i).some(x => x.pair), 'pay and cash are never paired');
const t = first.totals, cents = re => row(re).reduce((s, x) => s + x.c, 0);
const income = cents(/PAYROLL|Payroll/) + cents(/^interest/i) + cents(/Received GCash/) + cents(/CHECK DEPOSIT/);
eq(t.in, income, 'income is pay, interest, money from a person and the deposit, nothing else');
const kept = first.rows.filter(x => !x.pair && !x.rev && x.k === 'spend'); eq(t.out, kept.reduce((s, x) => s + x.c, 0), 'spending is the unpaired, unreversed spend rows');
ok(!kept.some(x => /Shopee|LATE PAYMENT|MERCURY DRUG.*REVERSAL/.test(x.text)), 'reversed charges are not spending');
eq(kept.filter(x => /MERCURY DRUG/.test(x.text)).length, 1, 'one of the two Mercury Drug charges was reversed, one stays'); eq(kept.filter(x => /Jollibee/.test(x.text)).length, 1, 'one Jollibee charge stays');
/* events: one per paired transfer, the balance of each account still ties */
const tr = ev1.filter(e => e.acct2); eq(tr.length, 6, 'six transfer events with both accounts'); ok(tr.every(e => e.acct !== e.acct2 && e.src.lid && e.src.lid2 && (e.k === 'transfer' || e.k === 'repay')), 'transfer events are whole');
eq(ev1.length, first.rows.length - 6, 'one event per line, and one per pair'); ok(ev1.every(e => e.date && e.a > 0 && Math.round(e.a * 100) === e.a * 100 || Math.abs(e.a * 100 - Math.round(e.a * 100)) < 1e-6), 'event amounts keep their cents');
const bdoNet = first.rows.filter(x => x.acct === 'bdo:6789').reduce((s, x) => s + (x.dir === 'in' ? x.c : -x.c), 0); eq(reads['bdo_savings_2026-08.txt'].opening + bdoNet, 7781492, 'BDO lines still add up to its closing balance after pairing');

/* 6. things logged by hand first (a receipt, a typed spend) are flagged, not added twice */
const hand = [{ id: 'e1', k: 'spend', date: '2026-08-06', a: 1845.32 }, { id: 'e2', k: 'spend', date: '2026-08-24', a: 289 }, { id: 'e3', k: 'in', date: '2026-08-15', a: 28500 }];
const p3 = P.phPrepare(all, [], hand); eq(p3.maybe, 3, 'three lines match what was typed');
ok(row(/x/) && p3.rows.find(x => /Meralco/.test(x.text)).maybe === 'e1' && p3.rows.find(x => /Meralco/.test(x.text)).keep === false, 'the Meralco line is flagged and unticked');
eq(p3.rows.filter(x => /Jollibee/.test(x.text) && x.maybe).length, 1, 'one typed Jollibee matches one line only'); eq(p3.rows.filter(x => /PAYROLL CREDIT/.test(x.text) && x.maybe).length, 1, 'one typed pay matches one pay line');

/* 7. the shape stmt.js uses today */
const sr = P.phToStmtRead(A, 'a.pdf'); ok(sr.rows.length === 12 && sr.closing === 600.68 && sr.kind === 'ewallet' && sr.rows.every(x => x.d && x.a > 0 && (x.dir === 'in' || x.dir === 'out') && x.f === 'a.pdf' && x.lid), 'phToStmtRead gives stmt.js rows');
ok(!/0917|0188|0199/.test(JSON.stringify(sr)), 'no phone or account digits in the rows handed on');

console.log(`${n} checks`); console.log(bad ? 'STMT PH FAIL ' + bad : 'STMT PH PASS');
process.exit(bad ? 1 : 0);
