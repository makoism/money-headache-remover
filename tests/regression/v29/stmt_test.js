// Unit checks for stmt.js: rows in, numbers out, with no browser.
const fs = require('fs'), vm = require('vm');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync('/home/claude/work/team/stmt.js', 'utf8') + '\nthis.X = { stmtNorm, stmtCleanRows, stmtMonths, stmtMerge, stmtMerchants, stmtNumbers, stmtReceipts, STMT_CATS };', ctx);
const X = ctx.X;
let pass = 0, fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); c ? pass++ : fail++; };

// a bank export, Sep 1 to Nov 10 (Sep and Oct full, Nov partial)
const bank = [];
const add = (d, text, amount, dir) => bank.push({ date: d, text, amount, dir });
['2026-09', '2026-10'].forEach((m, i) => {
  add(m + '-01', 'GCASH TRANSFER TO 0917*** MAMA', 3000, 'out');
  add(m + '-02', 'SM SUPERMARKET MAKATI', 2180.5 + i * 230, 'out');
  add(m + '-05', 'NETFLIX.COM', 399, 'out'); add(m + '-05', 'SPOTIFY P', 149, 'out');
  add(m + '-10', 'PLDT HOME FIBR', 1699, 'out'); add(m + '-12', 'GLOBE POSTPAID', 999, 'out');
  add(m + '-15', 'PAYROLL CREDIT VIDEOWORKS INC', 21000, 'in'); add(m + '-15', 'RENT - APT 4B ORTIGAS', 9000, 'out');
  add(m + '-16', 'MERALCO BILL PAYMENT', 2310.45 + i * 144.65, 'out'); add(m + '-19', 'HOME CREDIT LOAN PAYMENT', 1850, 'out');
  add(m + '-20', 'MAYNILAD', 480 + i * 15, 'out'); add(m + '-22', 'PUREGOLD QC', 1875.25 - i * 235.25, 'out');
  add(m + '-24', 'GRAB PHILIPPINES', 310 - i * 112, 'out'); add(m + '-30', 'PAYROLL CREDIT VIDEOWORKS INC', 21000, 'in');
  add(m + '-30', 'BPI CREDIT CARD PAYMENT', 6500 + i * 620, 'out');
});
add('2026-10-25', 'UPWORK FREELANCE PAYOUT', 4500, 'in');
add('2026-11-02', 'SM SUPERMARKET MAKATI', 2410, 'out'); add('2026-11-05', 'NETFLIX.COM', 399, 'out'); add('2026-11-10', 'PAYROLL CREDIT VIDEOWORKS INC', 21000, 'in');
const bankRead = X.stmtCleanRows({ account: 'BPI Savings 1234', kind: 'bank', currency: 'PHP', period: { from: '2026-09-01', to: '2026-11-10' }, closing_balance: 32089.7, rows: bank, notes: ['Two rows were in USD and left out.'] }, 'bpi.csv', '2026-11-12');
ok(bankRead.rows.length === bank.length, 'every good row kept: ' + bankRead.rows.length);
const mo = X.stmtMonths(bankRead); ok(mo.full.join(',') === '2026-09,2026-10' && mo.partial.join(',') === '2026-11', 'full and partial months: ' + JSON.stringify(mo));
// bad rows are dropped, not fatal
const junk = X.stmtCleanRows({ kind: 'bank', rows: [{ date: 'yesterday', text: 'x', amount: 5, dir: 'out' }, { date: '2026-10-01', text: 'ok', amount: -5, dir: 'out' }, { date: '2026-10-01', text: 'ok2', amount: 5, dir: 'sideways' }, { date: '2026-10-02', text: 'fine', amount: 5, dir: 'out' }, { date: '2029-01-01', text: 'future', amount: 5, dir: 'out' }] }, 'j.csv', '2026-11-12');
ok(junk.rows.length === 1 && junk.from === '2026-10-02' && junk.to === '2026-10-02', 'bad dates, amounts and directions are dropped; the period comes from the rows: ' + JSON.stringify([junk.rows.length, junk.from, junk.to]));

const catMap = { 'gcash transfer to': 'transfer_out', 'sm supermarket makati': 'food', 'netflix com': 'subs', 'spotify p': 'subs', 'pldt home fibr': 'net', 'globe postpaid': 'phone', 'payroll credit videoworks': 'pay', 'rent apt b': 'rent', 'meralco bill payment': 'util', 'home credit loan': 'loan', 'maynilad': 'util', 'puregold qc': 'food', 'grab philippines': 'gas', 'bpi credit card': 'card_payment', 'upwork freelance payout': 'other_income' };
const catOf = k => catMap[k] || 'other';
const merchants = X.stmtMerchants(bankRead.rows);
ok(merchants.every(m => catMap[m.k] !== undefined), 'every merchant key is one the map knows: ' + merchants.filter(m => catMap[m.k] === undefined).map(m => m.k).join(' | '));
ok(merchants[0].k === 'payroll credit videoworks' && merchants[0].months.length === 3, 'merchants are ordered by money moved, with their months: ' + JSON.stringify([merchants[0].k, merchants[0].months]));

// bank only: the card payment becomes the card number
let d = X.stmtNumbers([bankRead], catOf, '2026-11-12');
ok(d.pay === 42000 && /twice a month, around the 15th and the 30th/.test(d.how), 'pay from two paydays over full months: ' + d.pay + ', ' + d.how);
ok(d.other === null, 'a one-off payout in one month is not regular income (median over two full months is 0): ' + d.other);
ok(d.balance === 32089.7 && d.balanceDate === '2026-11-10', 'balance is the closing balance: ' + d.balance);
ok(d.bills.rent === 9000 && Math.abs(d.bills.util - (2310.45 + 480 + 2455.1 + 495) / 2) < 0.01 && Math.abs(d.bills.food - ((2180.5 + 1875.25) + (2410.5 + 1640)) / 2) < 0.01 && d.bills.net === 1699 && d.bills.phone === 999 && d.bills.gas === 254, 'bills are averages over full months: ' + JSON.stringify(d.bills));
ok(d.subs.length === 2 && d.subs.find(s => /NETFLIX/.test(s.n)).a === 399, 'subscriptions per merchant: ' + JSON.stringify(d.subs));
ok(d.loans.length === 1 && d.loans[0].a === 1850 && /HOME CREDIT/.test(d.loans[0].n), 'loans per merchant: ' + JSON.stringify(d.loans));
ok(d.card === 6810, 'with no card statement, the bank\'s card payments stand in for card spending: ' + d.card);
ok(d.questions.length === 2 && /3,000 sent to GCASH/.test(d.questions[0].t) && /4,500 from UPWORK/.test(d.questions[1].t), 'questions about the transfer and the one-off income: ' + JSON.stringify(d.questions.map(q => q.t)));
ok(/USD/.test(d.skipped[0]) && d.found, 'file notes carried into skipped, and found: ' + d.skipped[0]);
ok(/^1 file \(BPI Savings 1234\), 2026-09-01 to 2026-11-10: \d+ transactions\. Pay twice/.test(d.summary), 'summary: ' + d.summary);

// add a card statement for October: itemised card spending replaces the card payment, bills on the card count
const card = [];
[['2026-10-03', 'LAZADA PH', 2199, 'out'], ['2026-10-08', 'JOLLIBEE', 420, 'out'], ['2026-10-14', 'SHELL STATION', 1500, 'out'], ['2026-10-21', 'ZARA MAKATI', 2800, 'out'], ['2026-10-30', 'PAYMENT THANK YOU', 6500, 'in']].forEach(([date, text, amount, dir]) => card.push({ date, text, amount, dir }));
const cardRead = X.stmtCleanRows({ account: 'BPI Gold Mastercard', kind: 'card', period: { from: '2026-10-01', to: '2026-10-31' }, closing_balance: 7120, rows: card }, 'oct card.pdf', '2026-11-12');
const cat2 = k => ({ 'lazada ph': 'other', jollibee: 'play', 'shell station': 'gas', 'zara makati': 'play', 'payment thank you': 'transfer_in' })[k] || catOf(k);
d = X.stmtNumbers([bankRead, cardRead], cat2, '2026-11-12');
ok(d.card === 2199 + 420 + 2800, 'with the card statement in, card spending is itemised (play and other), the bank\'s card payment is ignored: ' + d.card);
ok(d.bills.gas === 254 + 1500, 'fuel on the card adds to transport: ' + d.bills.gas);
ok(d.balance === 32089.7, 'the card\'s balance is not money: ' + d.balance);
ok(d.meta.files.length === 2 && d.meta.files[1].full.join() === '2026-10', 'meta lists each file with its full months: ' + JSON.stringify(d.meta.files.map(f => [f.file, f.rows, f.full])));

// the same file twice: rows counted once
d = X.stmtNumbers([bankRead, X.stmtCleanRows({ account: 'BPI Savings 1234', kind: 'bank', period: { from: '2026-09-01', to: '2026-11-10' }, closing_balance: 32089.7, rows: bank }, 'bpi again.pdf', '2026-11-12')], catOf, '2026-11-12');
ok(d.meta.dupes === bank.length && d.pay === 42000 && d.bills.rent === 9000, 'a repeated statement changes nothing: dupes ' + d.meta.dupes + ', pay ' + d.pay);

// a partial month only: numbers from that part, with a note
const part = X.stmtCleanRows({ kind: 'ewallet', account: 'GCash', period: { from: '2026-11-01', to: '2026-11-10' }, rows: [{ date: '2026-11-03', text: 'GLOBE LOAD', amount: 300, dir: 'out' }, { date: '2026-11-09', text: 'SALARY', amount: 15000, dir: 'in' }] }, 'gcash.pdf', '2026-11-12');
d = X.stmtNumbers([part], k => ({ 'globe load': 'phone', salary: 'pay' })[k], '2026-11-12');
ok(d.pay === 15000 && d.bills.phone === 300 && /covers only part of a month/.test(d.skipped.join(' ')), 'a partial month still gives numbers, with a note: ' + JSON.stringify([d.pay, d.bills, d.skipped]));

// receipts: spending rows on the page's lines, money in and card payments left out
const rc = X.stmtReceipts(X.stmtMerge([bankRead, cardRead]).rows, cat2);
ok(rc.every(r => r.c && r.a > 0) && !rc.some(r => /PAYROLL|PAYMENT THANK|CREDIT CARD PAYMENT/.test(r.n)), 'no income, no card bill payments among receipts');
ok(rc.find(r => /JOLLIBEE/.test(r.n)).c === 'envelope' && rc.find(r => /LAZADA/.test(r.n)).c === 'card' && rc.find(r => /MERALCO/.test(r.n)).c === 'bill:util', 'lines: play to envelope, other to card, bills to their line');
ok(!rc.some(r => /GCASH TRANSFER/.test(r.n)), 'transfers out are not receipts');
ok(X.stmtNorm('ＳＭ ＳＵＰＥＲＭＡＲＫＥＴ 1234') === 'ｓｍ ｓｕｐｅｒｍａｒｋｅｔ' && X.stmtNorm('セブンイレブン千葉駅前店') === 'セブンイレブン千葉駅前店' && X.stmtNorm('7-ELEVEN STORE 2231') === 'eleven store', 'merchant keys for wide text, Japanese and digits: ' + [X.stmtNorm('ＳＭ ＳＵＰＥＲＭＡＲＫＥＴ 1234'), X.stmtNorm('セブンイレブン千葉駅前店'), X.stmtNorm('7-ELEVEN STORE 2231')].join(' | '));
console.log(`STMT: ${pass} pass, ${fail} fail`); process.exit(fail ? 1 : 0);
