/* Setup from statements, the tables-first way: numbers typed first, then Make it exact reads every file in parallel through the relay
   (fixed-shape answers), sorts merchants into categories, shows what was read, writes the numbers and keeps the rows as receipts.
   Also: the any-AI paste route, a locked PDF, an Excel file, the Make it exact card on Home. */
const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const fs = require('fs');
const { w, P, runTour } = require('/tmp/v22/lib.js');
const BASE = process.env.BASE || 'http://127.0.0.1:8788';
let pass = 0, fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); c ? pass++ : fail++; };
const title = p => p.$eval('#tourTitle', e => e.textContent);
const state = p => p.evaluate(() => JSON.parse(localStorage.getItem('money-map-template-v2')));
const BANK_CSV = `Account Statement - BPI Savings 1234-5678-90
Date,Description,Debit,Credit,Balance
2026-09-01,Balance Forward,,,12450.00
2026-09-01,GCASH TRANSFER TO 0917*** MAMA,3000.00,,9450.00
2026-09-02,SM SUPERMARKET MAKATI,2180.50,,7269.50
2026-09-03,GRAB PHILIPPINES,245.00,,7024.50
2026-09-05,NETFLIX.COM,399.00,,6625.50
2026-09-05,SPOTIFY P,149.00,,6476.50
2026-09-10,PLDT HOME FIBR,1699.00,,4777.50
2026-09-12,GLOBE POSTPAID,999.00,,3778.50
2026-09-15,PAYROLL CREDIT VIDEOWORKS INC,,21000.00,24778.50
2026-09-15,RENT - APT 4B ORTIGAS,9000.00,,15778.50
2026-09-16,MERALCO BILL PAYMENT,2310.45,,13468.05
2026-09-19,HOME CREDIT LOAN PAYMENT,1850.00,,11618.05
2026-09-20,MAYNILAD,480.00,,11138.05
2026-09-22,PUREGOLD QC,1875.25,,9262.80
2026-09-30,PAYROLL CREDIT VIDEOWORKS INC,,21000.00,30262.80
2026-09-30,BPI CREDIT CARD PAYMENT,6500.00,,23762.80
2026-10-01,GCASH TRANSFER TO 0917*** MAMA,3000.00,,20762.80
2026-10-02,SM SUPERMARKET MAKATI,2410.00,,18352.80
2026-10-04,GRAB PHILIPPINES,198.00,,18154.80
2026-10-05,NETFLIX.COM,399.00,,17755.80
2026-10-05,SPOTIFY P,149.00,,17606.80
2026-10-10,PLDT HOME FIBR,1699.00,,15907.80
2026-10-12,GLOBE POSTPAID,999.00,,14908.80
2026-10-15,PAYROLL CREDIT VIDEOWORKS INC,,21000.00,35908.80
2026-10-15,RENT - APT 4B ORTIGAS,9000.00,,26908.80
2026-10-16,MERALCO BILL PAYMENT,2455.15,,24453.65
2026-10-19,HOME CREDIT LOAN PAYMENT,1850.00,,22603.65
2026-10-20,MAYNILAD,495.00,,22108.65
2026-10-21,PUREGOLD QC,1640.25,,20468.40
2026-10-25,UPWORK FREELANCE PAYOUT,,4500.00,24968.40
2026-10-30,PAYROLL CREDIT VIDEOWORKS INC,,21000.00,45968.40
2026-10-30,BPI CREDIT CARD PAYMENT,7120.00,,38848.40
2026-10-31,GCASH CASH IN,2000.00,,36848.40
`;
const mkPdf = extra => Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R' + (extra || '') + '>>\n%%EOF');
fs.mkdirSync('/tmp/v28', { recursive: true });
fs.mkdirSync('/tmp/v28/imp', { recursive: true });
fs.writeFileSync('/tmp/v28/imp/bank.csv', BANK_CSV); fs.writeFileSync('/tmp/v28/imp/locked.pdf', mkPdf('/Encrypt 3 0 R')); fs.writeFileSync('/tmp/v28/imp/card.pdf', mkPdf('')); fs.writeFileSync('/tmp/v28/imp/junk.xlsx', 'this is not a workbook');
if (!fs.existsSync('/tmp/v28/wallet.xlsx')) throw new Error('missing /tmp/v28/wallet.xlsx (made by python3, see the fixture note in tests/README)');
const fresh = async b => { const p = await b.newPage(); const errs = []; await p.setViewport({ width: 390, height: 844 }); p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 160)); }); await p.evaluateOnNewDocument(() => { try { localStorage.clear(); indexedDB.deleteDatabase('money-map-safe'); } catch (e) {} }); return { p, errs }; };
/* run the first screens until Your statements */
const toStmts = async p => { let hit = false; await runTour(p, P.b, async () => { if ((await title(p)) === 'Your statements') { hit = true; throw new Error('stop'); } }).catch(() => {}); return hit; };
const vis = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); return !!e && !e.hidden && !e.closest('[hidden]'); }, sel);
/* the statements screen has one box per account: upload into the n-th box (0-based), name it, pick its kind, add another */
const upload = async (p, files, box) => { const inputs = await p.$$('[data-acctfile]'); const input = inputs[box || 0]; await input.uploadFile.apply(input, files); await w(400); };
const nameBox = async (p, i, name, kind) => { await p.evaluate((i, name, kind) => { const boxes = document.querySelectorAll('.acct'), b = boxes[i]; const ni = b.querySelector('[data-acctname]'); ni.value = name; ni.dispatchEvent(new Event('input', { bubbles: true })); if (kind) { const r = b.querySelector(`input[value="${kind}"]`); r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); } }, i, name, kind); await w(100); };
const addBox = async p => { await p.click('#acctAdd'); await w(250); };
const progress = p => p.$eval('#impProg', e => e.innerText.replace(/\s+/g, ' ').trim()).catch(() => '');
const coach = async p => { for (let i = 0; i < 12; i++) { const v = await p.evaluate(() => { const c = document.querySelector('#co'); return !!c && !c.hidden && c.getBoundingClientRect().width > 0; }); if (!v) break; await p.click('#coNext').catch(() => {}); await w(250); } };
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  /* 1. a copy without Claude (the relay says off): the any-AI route is the screen, and the typed path is one link away */
  let { p, errs } = await fresh(b);
  await p.setRequestInterception(true);
  p.on('request', r => { if (/\/api\/health/.test(r.url())) r.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, ai: false, vault: false }) }); else r.continue(); });
  await p.goto(BASE + '/?i=0#2026-11', { waitUntil: 'load' }); await w(900);
  ok(await toStmts(p), 'the video and the currency come first, then Your statements');
  ok(await p.$eval('#tourNext', e => e.hidden) && (await p.$eval('#srcSkip', e => e.textContent)) === 'Type the numbers instead', 'no Next button on the statements screen; the typed path is a link');
  await w(600);
  ok(!(await vis(p, '#srcUploadPanel')) && (await p.$eval('#srcAiPanel', e => e.open && /Use your own AI/.test(e.querySelector('summary').textContent))), 'without Claude, the any-AI route stands open as the way');
  const answer = 'Here you go:\n```json\n' + JSON.stringify({ summary: 'From your files.', pay: { amount: 40000, how: 'monthly' }, other_income: null, balance: { amount: 5000, date: '2026-11-01' }, bills: [{ id: 'rent', amount: 9000, note: 'landlord' }, { id: 'food', amount: 7000 }], subscriptions: [{ name: 'Netflix', amount: 279 }], loans: [], card_other: null, questions: [], skipped: [] }) + '\n```';
  await p.$eval('#impPaste', (e, v) => { e.value = v; }, answer); await p.click('#impCheck'); await w(500);
  ok((await title(p)) === 'Check what was found', 'a pasted answer opens the review: ' + await title(p));
  let rows = await p.$$eval('.imp-row', es => es.map(e => ({ on: e.classList.contains('on'), l: e.querySelector('b').textContent, a: e.querySelector('input[data-impa]').value })));
  ok(!!(rows.find(r => r.l === 'Monthly pay' && r.on && r.a === '40000') && rows.find(r => r.l === 'Netflix' && r.on && r.a === '279')), 'review lists pay and the subscription from the paste');
  ok(!(await p.$('#impKeep')), 'a pasted summary has no rows to keep');
  await p.click('#tourBack'); await w(400);
  ok((await title(p)) === 'Your statements', 'Back returns to Your statements');
  await p.evaluate(() => document.querySelector('#srcSkip').scrollIntoView({ block: 'center' })); await p.click('#srcSkip'); await w(400);
  ok((await title(p)) === 'Your money' && !!(await p.$('#tourPay')) && !!(await p.$('#tourExtra')) && !!(await p.$('#tourBank')), 'Type the numbers instead: pay, other income and balance on one screen');
  ok(errs.length === 0, 'no page errors (any-AI) ' + JSON.stringify(errs.slice(0, 3)));
  await p.close();
  /* 2. the app's own address: the upload is the screen */
  ({ p, errs } = await fresh(b));
  await p.goto(BASE + '/?i=1#2026-11', { waitUntil: 'load' }); await w(900);
  ok(await toStmts(p), 'Your statements again, with the relay on');
  await w(700);
  ok((await vis(p, '#srcUploadPanel')) && (await p.$eval('#srcAiPanel', e => !e.open && /Prefer your own AI/.test(e.querySelector('summary').textContent))), 'with Claude reachable, the upload is the screen and the any-AI route is a folded alternative');
  const sub = await p.$eval('.acct .src-sub', e => e.textContent);
  ok(/CSV, Excel, PDF or screenshots/.test(sub), 'the caption names every file type on the relay route: ' + sub);
  ok((await p.$$eval('.acct', es => es.length)) === 1 && (await p.$eval('.acct input[value="bank"]', e => e.checked)), 'one account box to start with, a bank');
  await upload(p, ['/tmp/v28/imp/locked.pdf']);
  await p.click('#impRead'); await w(2500);
  const lockOut = await p.$eval('#impOut', e => e.textContent), lockProg = await progress(p);
  ok((await title(p)) === 'Your statements' && /asks for a password/.test(lockProg) && /Nothing could be read/.test(lockOut), 'a locked PDF fails alone, with the reason on its line: ' + lockProg.slice(0, 80));
  await p.click('.acct [data-imprm="0"]').catch(() => {}); await w(200);
  /* three accounts, named the way the person says them: the bank, a card, a wallet (the broken workbook goes with the wallet) */
  await nameBox(p, 0, 'BPI');
  await upload(p, ['/tmp/v28/imp/bank.csv'], 0);
  await addBox(p); ok((await p.$$eval('.acct', es => es.length)) === 2 && (await p.$eval('.acct:nth-child(2) input[value="card"]', e => e.checked)), 'Add another account makes a card box');
  await nameBox(p, 1, 'Mercari Card', 'card'); await upload(p, ['/tmp/v28/imp/card.pdf'], 1);
  await addBox(p); await nameBox(p, 2, 'GCash', 'wallet'); await upload(p, ['/tmp/v28/wallet.xlsx', '/tmp/v28/imp/junk.xlsx'], 2);
  const chips = await p.$$eval('.acct', es => es.map(e => e.querySelector('[data-acctfiles]').textContent));
  ok(/bank\.csv/.test(chips[0]) && /card\.pdf/.test(chips[1]) && /wallet\.xlsx/.test(chips[2]) && /junk\.xlsx/.test(chips[2]), 'each file sits in its own account box: ' + chips.map(c => c.slice(0, 30)).join(' | '));
  ok((await p.$eval('#impRead', e => e.textContent)) === 'Read 4 files', 'the button counts the files');
  await p.click('#impRead'); await w(5000);
  ok((await title(p)) === 'Check what was found', 'the review opens after the read: ' + await title(p));
  const body = await p.$eval('#tourBody', e => e.textContent.replace(/\s+/g, ' '));
  ok(/What was read \(40 rows\)/.test(body) && /BPI \(bank\): 1 file, 32 rows, 2026-09 to 2026-10, 2 full months/.test(body) && /bank\.csv: 32 rows, 2026-09-01 to 2026-10-31, 2 full months/.test(body), 'What was read lists the bank by the name given, with its file: ' + (body.match(/What was read.{0,120}/) || [''])[0]);
  ok(/Mercari Card \(card\): 1 file, 4 rows, 2026-10, 1 full month/.test(body) && /GCash \(wallet\): 1 file, 4 rows/.test(body), 'the card and the wallet by their names (the broken workbook is not a read): ' + (body.match(/Mercari Card.{0,60}/) || [''])[0] + ' / ' + (body.match(/GCash \(wallet\).{0,40}/) || [''])[0]);
  ok(/junk\.xlsx: could not be read as a spreadsheet/.test(body), 'a broken workbook failed alone and is named in the review');
  rows = await p.$$eval('.imp-row', es => es.map(e => ({ on: e.classList.contains('on'), l: e.querySelector('b').textContent, a: e.querySelector('input[data-impa]').value })));
  const row = l => rows.find(r => r.l === l) || {};
  ok(row('Monthly pay').on && row('Monthly pay').a === '42000' && /twice a month, around the 15th and the 30th/.test(body), 'pay from two paydays a month, with when it arrives: ' + row('Monthly pay').a);
  ok(row('Rent or mortgage').a === '9000' && row('Internet').a === '1699' && row('Phone').a === '999', 'rent, internet and phone exact: ' + [row('Rent or mortgage').a, row('Internet').a, row('Phone').a].join(','));
  ok(+row('Utilities').a === 2870 && +row('Food and groceries').a === 4053 && +row('Transport').a === 402, 'utilities and food average the two full months (whole units); transport adds the wallet\'s own month: ' + [row('Utilities').a, row('Food and groceries').a, row('Transport').a].join(','));
  ok(row('NETFLIX.COM').a === '399' && row('SPOTIFY P').a === '149' && /HOME CREDIT/.test(rows.map(r => r.l).join('|')) && row('HOME CREDIT LOAN PAYMENT').a === '1850', 'subscriptions and the loan, one line each');
  ok(row('Card: other spending').on && +row('Card: other spending').a === 5450, 'card spending itemised from the card statement, not from the bank\'s card payments: ' + row('Card: other spending').a);
  ok(+row('Balance now').a === 40698, 'balance adds the latest closing balance of the bank and the wallet, not the card: ' + row('Balance now').a);
  const qs = await p.$$eval('.imp-q p', es => es.map(e => e.textContent));
  ok(qs.some(q => /3,000 sent to GCASH TRANSFER/.test(q)) && qs.some(q => /4,500 from UPWORK/.test(q)), 'questions about the transfer and the one-off income: ' + qs.join(' | '));
  // a wrong category, corrected: the numbers follow
  await p.evaluate(() => { document.querySelectorAll('.imp-fold')[1].open = true; });
  const before = +row('Food and groceries').a;
  await p.select('select[data-cat="sm supermarket makati"]', 'play'); await w(600);
  rows = await p.$$eval('.imp-row', es => es.map(e => ({ l: e.querySelector('b').textContent, a: e.querySelector('input[data-impa]').value })));
  const food2 = +(rows.find(r => r.l === 'Food and groceries') || {}).a;
  ok(Math.abs(before - food2 - (2180.5 + 2410) / 2) < 1, 'moving the supermarket to play takes it out of food: ' + before + ' to ' + food2);
  ok(await p.evaluate(() => document.querySelector('select[data-cat="sm supermarket makati"]').value === 'play'), 'the correction stays selected after the rebuild');
  await p.click('[data-mx="sm supermarket makati"]'); await w(300);
  const mx = await p.evaluate(() => { const x = document.querySelector('.imp-m[data-mk="sm supermarket makati"] .imp-m-x'); return { hid: x.hidden, rows: [...x.querySelectorAll('li')].map(li => li.textContent.replace(/\s+/g, ' ')) }; });
  ok(!mx.hid && mx.rows.length === 2 && /2026-10-02/.test(mx.rows[0]) && /2,410/.test(mx.rows[0]) && /SM SUPERMARKET MAKATI/.test(mx.rows[0]) && /BPI/.test(mx.rows[0]), 'tapping a merchant shows its rows as printed, newest first, with the account: ' + mx.rows.join(' | '));
  await p.screenshot({ path: '/tmp/v30/review_rows.png' });
  ok(/Monthly amounts are the average over the months each account covers: .*BPI Sep 2026 to Oct 2026 \(2 full months\).*Mercari Card Oct 2026 \(1 full month\)/.test(body), 'the review says which months each account is averaged over, by name: ' + (body.match(/Monthly amounts[^.]*\./) || [''])[0]);
  ok(await p.$eval('#impKeep', e => e.checked), 'keeping the rows as receipts is ticked by default');
  const keepLabel = await p.$eval('.imp-keep', e => e.textContent);
  ok(/Keep the 27 spending rows as receipts/.test(keepLabel), 'the tick names the count: ' + keepLabel.slice(0, 50));
  await p.click('#tourNext'); await w(900);
  ok((await title(p)) === 'Split the rest', 'Use these numbers skips the typed screens and goes on to the split: ' + await title(p));
  let S = await state(p);
  const last = k => { const a = S.steps[k]; return a && a[a.length - 1].v; };
  ok(last('a') === 42000 && last('bill:rent') === 9000 && last('bill:net') === 1699 && last('bill:util') === 2870 && S.cfg.bankStart === 40698, 'the plan holds the exact numbers: ' + JSON.stringify([last('a'), last('bill:rent'), last('bill:net'), S.cfg.bankStart]));
  ok(S.ui.src === 'import' && S.ui.cats && S.ui.cats['sm supermarket makati'] === 'play' && S.ui.cats['meralco bill payment'] === 'util', 'the categories are remembered, corrections included');
  const rc = S.receipts || [];
  ok(rc.length === 27 && S.ui.imp.receipts === 27 && rc.every(r => r.s) && rc.some(r => r.s === 'BPI') && rc.some(r => r.s === 'Mercari Card' && /LAZADA/.test(r.n)), 'the 27 spending rows are receipts, each carrying its account by name: ' + rc.length + ' ' + [...new Set(rc.map(r => r.s))].join(','));
  ok(Array.isArray(S.ui.accts) && S.ui.accts.map(a => a.name + ':' + a.kind).join(',') === 'BPI:bank,Mercari Card:card,GCash:wallet', 'the accounts are remembered for next time: ' + JSON.stringify(S.ui.accts));
  ok(rc.some(r => /SM SUPERMARKET/.test(r.n) && r.c === 'envelope') && rc.some(r => /MERALCO/.test(r.n) && r.c === 'bill:util') && rc.some(r => /LAZADA/.test(r.n) && r.c === 'card') && !rc.some(r => /PAYROLL|CREDIT CARD PAYMENT|GCASH TRANSFER|CASH IN|PAYMENT RECEIVED/.test(r.n)), 'receipts sit on their lines; income, card payments and transfers are not receipts');
  ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 3)));
  await p.close();
  // the Make it exact card on Home, and an upload from there closes the tour again
  ({ p, errs } = await fresh(b));
  await p.goto(BASE + '/?i=2#2026-11', { waitUntil: 'load' }); await w(900);
  await runTour(p, P.a); await w(1000); await coach(p);
  await p.type('#hAmt', '120'); await p.keyboard.press('Enter'); await w(700);
  let card = await p.$eval('#hNext', e => ({ hid: e.hidden, t: e.textContent.replace(/\s+/g, ' ') }));
  ok(!card.hid && /Make it exact/.test(card.t) && /Upload/.test(card.t), 'after the first steps, Home offers Make it exact: ' + card.t.slice(0, 60));
  await p.click('#hNext [data-exact]'); await w(800);
  ok((await title(p)) === 'Your statements' && (await p.$eval('#srcSkip', e => e.textContent)) === 'Not now', 'Upload opens the tour at Your statements, with Not now as the way out');
  await w(700);
  /* a long CSV (three months, 300 rows) is read in parts and comes back as one file */
  const long = ['Account Statement - BPI Savings 1234-5678-90', 'Date,Description,Debit,Credit,Balance'];
  let bal = 50000; ['2026-08', '2026-09', '2026-10'].forEach(m => { const lastDay = m === '2026-09' ? 30 : 31; for (let i = 0; i < 100; i++) { const d = `${m}-${String(i === 99 ? lastDay : 1 + (i % 28)).padStart(2, '0')}`; const inn = i % 50 === 10; const amt = inn ? 21000 : 100 + i * 1.5; bal += inn ? amt : -amt; long.push(`${d},${inn ? 'PAYROLL CREDIT VIDEOWORKS INC' : ['SM SUPERMARKET MAKATI', 'GRAB PHILIPPINES', 'MERALCO BILL PAYMENT', 'PUREGOLD QC'][i % 4]},${inn ? '' : amt.toFixed(2)},${inn ? amt.toFixed(2) : ''},${bal.toFixed(2)}`); } });
  fs.writeFileSync('/tmp/v28/imp/long.csv', long.join('\n') + '\n');
  let calls = 0; p.on('request', r => { if (r.method() === 'POST' && /\/api\/ai/.test(r.url())) calls++; });
  await upload(p, ['/tmp/v28/imp/long.csv']); await p.click('#impRead');
  for (let i = 0; i < 60; i++) { await w(250); if ((await title(p)) === 'Check what was found') break; }
  ok(calls === 4, 'a 300-row CSV is read in three parts, then one category job: ' + calls + ' requests');
  ok((await title(p)) === 'Check what was found', 'the review opens from Home\'s card too');
  const body2 = await p.$eval('#tourBody', e => e.textContent.replace(/\s+/g, ' '));
  ok(/What was read \(300 rows\)/.test(body2) && /Bank account \(bank\): 1 file, 300 rows, 2026-08 to 2026-10, 3 full months/.test(body2) && /long\.csv: 300 rows, 2026-08-01 to 2026-10-31, 3 full months/.test(body2), 'the parts come back as one file with every row and its months, under an unnamed box called Bank account: ' + (body2.match(/long\.csv[^,]*,[^,]*,[^,]*,[^.]*/) || [''])[0]);
  await p.click('#tourNext'); await w(900);
  ok(await p.evaluate(() => document.getElementById('tour').hidden), 'Use these numbers closes the tour instead of going on to the jars');
  S = await state(p);
  ok(last('a') === 42000 && (S.receipts || []).filter(r => r.s === 'Bank account').length === 294 && (S.receipts || []).some(r => r.a === 120 && !r.s), 'numbers exact, 294 receipts kept (each naming the account), the one logged by hand still there: ' + (S.receipts || []).filter(r => r.s).length);
  card = await p.$eval('#hNext', e => ({ hid: e.hidden, t: e.textContent.replace(/\s+/g, ' ') }));
  ok(card.hid || !/Make it exact/.test(card.t), 'the Make it exact card is gone');
  ok(errs.length === 0, 'no page errors (Home card) ' + JSON.stringify(errs.slice(0, 3)));
  await b.close();
  console.log(`PAGE IMPORT: ${pass} pass, ${fail} fail`); process.exit(fail ? 1 : 0);
})().catch(e => { console.log('CRASH', e.stack); process.exit(2); });
