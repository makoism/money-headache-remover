#!/usr/bin/env node
/* Statements, the writing half, pure (app3/src/stmt3_plan.js), on the made-up Mako book (one bank, Card A and Card B
   paid on the 10th and 11th, close days not sure). Every statement and amount here is made up.
   Shown as on 16 Dec 2026: Mako reads his bank (20 Nov to 15 Dec) and Card A (16 Nov to 15 Dec) at once. He had typed a
   450 coffee on Card A, on a budget line. */
'use strict';
const fs = require('fs'), path = require('path');
let bad = 0, n = 0;
const ck = (name, ok, extra) => { n++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : ' ' + String(extra === undefined ? '' : extra).slice(0, 500))); if (!ok) bad++; };
const old = new Function(fs.readFileSync(path.join(__dirname, '../../stmt.js'), 'utf8') + '\nreturn { stmtCleanRows, stmtNorm, stmtNumbers, STMT_CATS };')();
const R = require('../src/stmt3_read.js'); R.use(old);
const P = require('../src/stmt3_plan.js'); P.use(old);
const L = require('../../engine/lookahead.js'), I = require('../../engine/ids.js');
const TODAY = '2026-12-16';
const book0 = JSON.parse(fs.readFileSync(path.join(__dirname, '../fixtures/mako_madeup_book.json'), 'utf8'));
const acc = name => book0.accounts.find(a => a.name === name).id, sch = name => book0.schedules.find(s => s.name === name).id;
const BANK = acc('Main bank'), CA = acc('Card A'), CB = acc('Card B');
const COFFEE = 'k7m2qa-q8w2e4r6t1-3', FOOD = 'k7m2qa-q8w2e4r6t1-1';
const book = JSON.parse(JSON.stringify(book0));
book.events.push({ id: COFFEE, k: 'spend', acct: CA, date: '2026-11-22', a: 450, line: FOOD, note: 'coffee', told: '2026-11-22T08:10+09:00', at: '2026-11-22T08:10+09:00' });

const bankRead = R.cleanRead({ account: 'Main bank', kind: 'bank', currency: 'JPY', period: { from: '2026-11-20', to: '2026-12-15' }, rows: [
  { date: '2026-11-26', text: 'DENKI POWER CO', amount: 7400, dir: 'out' },
  { date: '2026-11-27', text: 'RENT HOUSE', amount: 72000, dir: 'out' },
  { date: '2026-11-27', text: 'NET HIKARI', amount: 5200, dir: 'out' },
  { date: '2026-12-01', text: 'SUPER MARKET', amount: 2480, dir: 'out' },
  { date: '2026-12-10', text: 'SALARY MAIN JOB', amount: 180000, dir: 'in' },
  { date: '2026-12-10', text: 'SIDE WORK', amount: 58000, dir: 'in' },
  { date: '2026-12-10', text: 'CARD A PAYMENT', amount: 54450, dir: 'out' },
  { date: '2026-12-11', text: 'CARD B PAYMENT', amount: 23000, dir: 'out' }
] }, 'bank.csv', TODAY);
const cardRead = R.cleanRead({ account: 'Card A', kind: 'card', currency: 'JPY', period: { from: '2026-11-16', to: '2026-12-15' },
  statement: { close: '2026-12-15', due: '2027-01-12', total: 2930 }, rows: [
    { date: '2026-11-22', posted: '2026-11-24', text: 'CAFE MORI', amount: 450, dir: 'out' },
    { date: '2026-12-03', text: 'BOOKS', amount: 2930, dir: 'out' },
    { date: '2026-12-10', text: 'PAYMENT THANK YOU', amount: 54450, dir: 'in' }
  ] }, 'cardA.pdf', TODAY);
const cats = {};
for (const [t, c] of [['DENKI POWER CO', 'util'], ['RENT HOUSE', 'rent'], ['NET HIKARI', 'net'], ['SUPER MARKET', 'food'], ['SALARY MAIN JOB', 'pay'], ['SIDE WORK', 'other_income'],
  ['CARD A PAYMENT', 'card_payment'], ['CARD B PAYMENT', 'card_payment'], ['CAFE MORI', 'food'], ['BOOKS', 'play'], ['PAYMENT THANK YOU', 'card_payment']]) cats[R.key(t)] = c;

// the card read is given first; banks are read first anyway
const p = P.plan(book, [cardRead, bankRead], { today: TODAY, assign: [CA, BANK], cats });
const line = (acct, date, a, dir) => p.lines.find(l => l.acct === acct && l.date === date && l.a === a && l.dir === dir);
const occ = (name, due) => sch(name) + '@' + due;
ck('every row became a line', p.lines.length === 11, p.lines.length);
ck('line ids are imp:<account>:<date>:<amount>:<in|out>:<n> [AP3]', line(BANK, '2026-11-27', 72000, 'out').id === 'imp:' + BANK + ':2026-11-27:72000:out:1');
ck('rent settles the rent item, by the frozen rules', line(BANK, '2026-11-27', 72000, 'out').status === 'settles' && line(BANK, '2026-11-27', 72000, 'out').settles[0] === occ('Rent', '2026-11-27'), JSON.stringify(line(BANK, '2026-11-27', 72000, 'out')));
ck('power and internet settle theirs', line(BANK, '2026-11-26', 7400, 'out').settles[0] === occ('Power', '2026-11-26') && line(BANK, '2026-11-27', 5200, 'out').settles[0] === occ('Internet', '2026-11-27'));
ck('the main pay settles the main job', line(BANK, '2026-12-10', 180000, 'in').settles[0] === occ('Main job', '2026-12-10'));
ck('58,000 of side work is not the 60,000 expected (no vary): a new line, the item stays to tick [A6]', line(BANK, '2026-12-10', 58000, 'in').status === 'new');
const pa = line(BANK, '2026-12-10', 54450, 'out'), pb = line(BANK, '2026-12-11', 23000, 'out');
ck('the bank\'s card payments are repays to the right card', pa.k === 'repay' && pa.to === CA && pb.k === 'repay' && pb.to === CB, JSON.stringify([pa.to, pb.to]));
ck('and settle each card\'s payment item', pa.settles[0] === CA + '@2026-12-10' && pb.settles[0] === CB + '@2026-12-11', JSON.stringify([pa.settles, pb.settles]));
const cafe = line(CA, '2026-11-22', 450, 'out');
ck('the card\'s coffee replaces the typed coffee', cafe.status === 'typed' && cafe.typed === COFFEE, JSON.stringify(cafe));
ck('the card keeps its posting date beside the buy date', cafe.posted === '2026-11-24' && cafe.date === '2026-11-22');
const thanks = line(CA, '2026-12-10', 54450, 'in');
ck('the card\'s "payment received" meets the bank\'s payment line: one payment, not two [Q1]', thanks.status === 'meets' && thanks.meets === pa.id && thanks.metImport, JSON.stringify(thanks));
ck('the counts', JSON.stringify(p.counts) === JSON.stringify({ read: 11, repeat: 0, typed: 1, settles: 6, meets: 1, new: 3, pick: 0, askmove: 0 }), JSON.stringify(p.counts));
ck('the card statement is found', p.statements.length === 1 && p.statements[0].a === 2930 && p.statements[0].close === '2026-12-15');
const m = p.merchants.find(x => x.key === R.key('BOOKS'));
ck('merchants with their rows and totals (for tapping a merchant)', m && m.rows.length === 1 && m.outA === 2930 && m.cat === 'play');

/* ---- the records ---- */
const TOLD = '2026-12-16T09:00+09:00';
const out = P.records(book, p, { told: TOLD, grp: 'k7m2qa-z9x8c7v6b5-1' });
const ev = id => out.events.find(e => e.id === id);
ck('one record per line, plus the statement and its owed figure', out.events.length === 13, out.events.length);
const c = ev(cafe.id);
ck('[BC4] the coffee keeps the typed line, so it stays on Food', c.line === FOOD);
ck('[O1] and the typed record\'s told', c.told === '2026-11-22T08:10+09:00');
ck('[H1] buy date and posting date', c.date === '2026-11-22' && c.posted === '2026-11-24');
ck('src says statement, its file, line and dates, and the account it came from [AS4]', c.src.type === 'statement' && c.src.file === 'cardA.pdf' && c.src.from === '2026-11-16' && c.src.acct === CA);
ck('the typed coffee itself is not removed here (the look ahead replaces it each time)', book.events.find(e => e.id === COFFEE) && !book.events.find(e => e.id === COFFEE).gone);
const r = ev(pa.id);
ck('the bank payment is a repay from the bank to Card A, settling its item', r.k === 'repay' && r.acct === BANK && r.acct2 === CA && r.settles[0].s === CA && r.settles[0].due === '2026-12-10');
const th = ev(thanks.id);
ck('the card side of the same payment is kept gone, by the bank line (a repeat is then known)', th.gone && th.goneBy === pa.id && th.k === 'repay' && th.acct2 === CA);
const st = out.events.filter(e => e.k === 'check');
ck('the card statement: a stmt check and the owed figure on its close day, in one group', st.length === 2 && st[0].stmt && st[0].stmtDate === '2026-12-15' && st[0].stmtPay === '2027-01-12' && st[1].a === 2930 && st[0].grp === st[1].grp && !st[1].stmt);
ck('the review ticks the card payments it read, as a check-in record naming them [S2, U2]', out.checkins.length === 1 && out.checkins[0].settled.join() === [pa.id, pb.id].join() && out.checkins[0].figures.length === 0, JSON.stringify(out.checkins));
ck('no undefined fields are written', out.events.every(e => Object.values(e).every(v => v !== undefined)));

/* ---- what the engine makes of it ---- */
const after = JSON.parse(JSON.stringify(book)); after.events = after.events.concat(out.events); after.checkins = (after.checkins || []).concat(out.checkins);
let res; try { res = L.lookahead(after, TODAY); } catch (e) { res = { threw: e.message }; }
ck('the look ahead runs on the book with the statements in', !res.threw, res.threw);
const ns = ((res.notSeenYet || {}).items || []).map(o => o.item);
ck('rent, power and internet are no longer "not seen yet"', ![occ('Rent', '2026-11-27'), occ('Power', '2026-11-26'), occ('Internet', '2026-11-27')].some(x => ns.includes(x)), ns.join(','));
const tc = ((res.checkIn || {}).toConfirm || []).map(o => o.item);
ck('the main pay and both card payments need no ticking; the side pay still does', !tc.includes(occ('Main job', '2026-12-10')) && !tc.includes(CA + '@2026-12-10') && !tc.includes(CB + '@2026-12-11') && tc.includes(occ('Side job', '2026-12-10')), tc.join(','));
const before = L.lookahead(book, TODAY);
ck('the coffee counts once on Card A (typed and read are one)', res.cards && res.cards[CA] && typeof res.cards[CA].owedNow === 'number', JSON.stringify(res.cards && res.cards[CA]).slice(0, 300));
ck('Card A owes the statement\'s 3,380 now (paid on the 10th, then the cafe and the books)', res.cards[CA].owedNow === 2930, res.cards[CA].owedNow + ' (before ' + before.cards[CA].owedNow + ')');

/* ---- duplicates once ---- */
const p2 = P.plan(after, [bankRead, cardRead], { today: TODAY, assign: [BANK, CA], cats });
ck('reading the same files again adds nothing', p2.counts.repeat === 11 && P.records(after, p2, { told: TOLD }).events.length === 0, JSON.stringify(p2.counts));
const undone = JSON.parse(JSON.stringify(after)); undone.events.forEach(e => { if (e.id === cafe.id) { e.gone = '2026-12-16'; e.goneBy = 'k7m2qa-z9x8c7v6b5-2'; } });
ck('a line taken back with Undo is offered again', P.plan(undone, [cardRead], { today: TODAY, assign: [CA], cats }).lines.find(l => l.id === cafe.id).status !== 'repeat');
const p3 = P.plan(book, [bankRead, bankRead], { today: TODAY, assign: [BANK, BANK], cats });
ck('the same file twice in one go: its lines once', p3.counts.repeat === 8 && p3.lines.filter(l => l.status !== 'repeat').length === 8, JSON.stringify(p3.counts));
const twoCoffees = R.cleanRead({ kind: 'card', rows: [{ date: '2026-12-02', text: 'CAFE', amount: 450, dir: 'out' }, { date: '2026-12-02', text: 'CAFE', amount: 450, dir: 'out' }] }, 'c.csv', TODAY);
const p4 = P.plan(book, [twoCoffees], { today: TODAY, assign: [CB], cats: {} });
ck('two real coffees of the same amount on one day are two lines (:1 and :2)', p4.lines.map(l => l.id.split(':').pop()).join() === '1,2' && p4.counts.new === 2, JSON.stringify(p4.lines.map(l => l.id)));
const refd = R.cleanRead({ kind: 'bank', rows: [{ date: '2026-12-02', text: 'X', amount: 1, dir: 'out', ref: 'TX 88/12' }] }, 'r.csv', TODAY);
ck('a printed reference names the line, written %XX [AP3]', P.plan(book, [refd], { today: TODAY, assign: [BANK] }).lines[0].id === 'imp:' + BANK + ':ref:TX%2088%2F12');

/* ---- categories and setup hints ---- */
const kc = P.catsToKeep(p, { [R.key('BOOKS')]: true }, TOLD);
const noCat = P.plan(book, [R.cleanRead({ kind: 'card', rows: [{ date: '2026-12-02', text: 'NEW SHOP', amount: 900, dir: 'out', cat: 'play' }] }, 'n.csv', TODAY)], { today: TODAY, assign: [CB], cats: {} });
ck('the reader\'s category is used when the book knows nothing of the shop', noCat.lines[0].cat === 'play');
ck('the book\'s or the person\'s category wins over the reader\'s', P.plan(book, [R.cleanRead({ kind: 'card', rows: [{ date: '2026-12-02', text: 'NEW SHOP', amount: 900, dir: 'out', cat: 'play' }] }, 'n.csv', TODAY)], { today: TODAY, assign: [CB], cats: { [R.key('NEW SHOP')]: 'food' } }).lines[0].cat === 'food');
ck('categories to remember, by shop, marked when the person chose them', kc['k:' + R.key('BOOKS')].src === 'person' && kc['k:' + R.key('RENT HOUSE')].v === 'rent');
ck('known categories are read back from imports.cats', P.knownCats({ imports: { cats: kc } })[R.key('RENT HOUSE')] === 'rent');
const full = R.cleanRead({ kind: 'bank', period: { from: '2026-10-01', to: '2026-11-30' }, closing_balance: 286000, rows: ['2026-10', '2026-11'].map(m => [
  { date: m + '-10', text: 'SALARY MAIN JOB', amount: 180000, dir: 'in' }, { date: m + '-27', text: 'RENT HOUSE', amount: 72000, dir: 'out' }]).flat() }, 'two_months.csv', TODAY);
const h = P.setupHints([full], cats, 'JPY', TODAY);
ck('setup hints come from the old reader\'s own sums: pay, rent', h.pay && h.pay.a === 180000 && h.bills.rent === 72000 && h.bank.a === 286000 && h.bank.date === '2026-11-30', JSON.stringify(h));


/* ---- which card a bank's card payment pays (MAIN 15, the real-page walk: "CARD B PAYMENT 23,000" went onto Card A) ----
   With close days "not sure", each card's item asks everything owed, so the amount almost never matches. The line's own
   words (the card's name) come first, then the payment day, then the amount; when two or more cards are still possible,
   nothing is guessed: the review asks. Shown as on 20 Dec: Card B's item of 11 Dec is overdue. */
{
  const D2 = '2026-12-20';
  const bk = JSON.parse(JSON.stringify(book0));
  bk.events.push({ id: 'k7m2qa-q8w2e4r6t1-7', k: 'spend', acct: CB, date: '2026-11-25', a: 1000, note: 'lunch', told: '2026-11-25T12:30+09:00', at: '2026-11-25T12:30+09:00' });
  const itemB = L.lookahead(bk, D2).checkIn.toConfirm.find(o => o.item === CB + '@2026-12-11');
  ck('the case: Card B\'s item of 11 Dec is still to tick on 20 Dec and asks more than the 23,000 paid', itemB && itemB.amount !== 23000, JSON.stringify(itemB));
  const pay = (text, date, a) => R.cleanRead({ kind: 'bank', rows: [{ date, text, amount: a, dir: 'out', cat: 'card_payment' }] }, 'b.csv', D2);
  const one = (rd, o) => P.plan(bk, [rd], Object.assign({ today: D2, assign: [BANK], cats: {} }, o || {})).lines[0];
  const lb = one(pay('CARD B PAYMENT', '2026-12-14', 23000));
  ck('"CARD B PAYMENT 23,000" pays Card B, by its name', lb.k === 'repay' && lb.to === CB, JSON.stringify(lb));
  ck('and settles Card B\'s overdue item', JSON.stringify(lb.settles) === JSON.stringify([CB + '@2026-12-11']), JSON.stringify(lb.settles));
  const outB = P.records(bk, P.plan(bk, [pay('CARD B PAYMENT', '2026-12-14', 23000)], { today: D2, assign: [BANK], cats: {} }), { told: D2 + 'T09:00+09:00' });
  const afterB = JSON.parse(JSON.stringify(bk)); afterB.events = afterB.events.concat(outB.events); afterB.checkins = (afterB.checkins || []).concat(outB.checkins);
  const rB = L.lookahead(afterB, D2), tcB = rB.checkIn.toConfirm.map(o => o.item);
  ck('the engine then has Card B\'s 11 Dec item settled, and Card A\'s untouched', !tcB.includes(CB + '@2026-12-11') && tcB.includes(CA + '@2026-12-10'), tcB.join(','));
  ck('Card A owes what it did; Card B owes the 1,000 not paid plus what came after', rB.cards[CA].owedNow === L.lookahead(bk, D2).cards[CA].owedNow && rB.cards[CB].owedNow === L.lookahead(bk, D2).cards[CB].owedNow - 23000, JSON.stringify([rB.cards[CA].owedNow, rB.cards[CB].owedNow]));
  const la = one(pay('CARD A PAYMENT', '2026-12-14', 23000));
  ck('the same amount named Card A pays Card A', la.to === CA);
  const byDay = one(pay('JCB', '2026-12-11', 23000));
  ck('no name: the card whose payment day it is (Card B on the 11th)', byDay.to === CB, JSON.stringify(byDay));
  const tie = one(pay('JCB', '2026-12-21', 5));
  ck('no name, no nearer day, no amount: nothing is guessed, the review asks', tie.status === 'pick' && !tie.to && tie.cards.slice().sort().join() === [CA, CB].sort().join(), JSON.stringify(tie));
  const tp = P.plan(bk, [pay('JCB', '2026-12-21', 5)], { today: D2, assign: [BANK], cats: {} });
  const throws = f => { try { f(); return false; } catch (e) { return /waiting for an answer/.test(e.message); } };
  ck('[walk 4] a line waiting for its card is counted, and nothing is written while it waits: records() refuses', tp.counts.pick === 1 && throws(() => P.records(bk, tp, { told: D2 })));
  const chosen = one(pay('JCB', '2026-12-21', 5), { cardFor: { [tie.id]: CB } });
  ck('the person\'s choice wins', chosen.to === CB && chosen.status !== 'pick');
  const kept = P.catsToKeep(P.plan(bk, [pay('JCB', '2026-12-21', 5)], { today: D2, assign: [BANK], cats: {}, cardFor: { [tie.id]: CB } }), {}, D2);
  ck('the choice is remembered for the shop, and used next time', kept['k:' + R.key('JCB')].card === CB
    && one(pay('JCB', '2026-12-22', 7), { cardOf: P.knownCards({ imports: { cats: kept } }) }).to === CB);
}

/* ---- [BJ4] a statement line moving money to the person's own account is a move, never a spend ----
   Walk 3's case on walk 2's made-up book with Free to spend (walk/v2/bookFree.json), seen on 15 Dec: the 1 Dec move of
   20,000 to the Trip account was typed, the 5 Dec one of 5,000 was not. The bank statement has both "TO TRIP ACCT". */
{
  const PR = require('../../engine/periods.js');
  const D3 = '2026-12-15';
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '../walk/v2/bookFree.json'), 'utf8'));
  const bk = raw.book || raw;
  bk.events = bk.events.filter(e => !(e.src && e.src.type === 'statement') && e.note !== 'extra for trip' && e.date <= D3);
  bk.checkins = (bk.checkins || []).filter(c => !c.from);
  const MB = bk.accounts.find(a => a.name === 'Main bank').id, TRIP = bk.accounts.find(a => a.name === 'Trip account').id;
  const GOAL = bk.places.find(g => g.name === 'Trip').id;
  const rd = rows => R.cleanRead({ kind: 'bank', rows }, 'bank_dec.csv', D3);
  const trip = rd([{ date: '2026-12-01', text: 'TO TRIP ACCT', amount: 20000, dir: 'out', cat: 'transfer_out' }, { date: '2026-12-05', text: 'TO TRIP ACCT', amount: 5000, dir: 'out', cat: 'transfer_out' }]);
  const pt = P.plan(bk, [trip], { today: D3, assign: [MB], cats: {} });
  const l1 = pt.lines.find(l => l.date === '2026-12-01'), l5 = pt.lines.find(l => l.date === '2026-12-05');
  ck('[BJ4] the 5 Dec line with no typed move is a move to the Trip account, by the account\'s name', l5.k === 'transfer' && l5.to === TRIP && l5.status === 'new', JSON.stringify(l5));
  ck('[BJ4] the 1 Dec line meets the typed move and is a move too, never a spend', l1.k === 'transfer' && l1.status === 'meets', JSON.stringify(l1));
  const ot = P.records(bk, pt, { told: D3 + 'T10:00+09:00' });
  ck('[BJ4] no spend is written', ot.events.every(e => e.k !== 'spend') && ot.events.find(e => e.id === l5.id).acct2 === TRIP, JSON.stringify(ot.events.map(e => [e.k, e.acct2])));
  const af = JSON.parse(JSON.stringify(bk)); af.events = af.events.concat(ot.events); af.checkins = (af.checkins || []).concat(ot.checkins);
  const past = PR.periods(af, D3).past.find(x => x.start <= '2026-12-05' && x.end >= '2026-12-05');
  ck('the period\'s spending stays at 20,000', past && past.free && past.free.spent === 20000, JSON.stringify(past && past.free));
  const ra = L.lookahead(af, D3);
  ck('the goal and the Trip account agree', ra.places[GOAL].kept === ra.accounts[TRIP].bank && ra.accounts[TRIP].bank === 25000, JSON.stringify([ra.places[GOAL].kept, ra.accounts[TRIP].bank]));
  const vague = rd([{ date: '2026-12-08', text: 'FURIKOMI 0123', amount: 7000, dir: 'out', cat: 'transfer_out' }]);
  const lv = P.plan(bk, [vague], { today: D3, assign: [MB], cats: {} }).lines[0];
  ck('a transfer out that names no account of yours: the review asks, nothing is written yet', lv.status === 'askmove' && lv.accts.includes(TRIP) && (() => { try { P.records(bk, P.plan(bk, [vague], { today: D3, assign: [MB], cats: {} }), { told: D3 }); return false; } catch (e) { return /waiting for an answer/.test(e.message); } })(), JSON.stringify(lv));
  const yes = P.plan(bk, [vague], { today: D3, assign: [MB], cats: {}, moveFor: { [lv.id]: TRIP } });
  ck('"it went to the Trip account": a move', yes.lines[0].k === 'transfer' && yes.lines[0].to === TRIP);
  const no = P.plan(bk, [vague], { today: D3, assign: [MB], cats: {}, moveFor: { [lv.id]: 'no' } });
  ck('"it went to someone else": a spend', no.lines[0].k === 'spend' && no.lines[0].status === 'new');
  const kc2 = P.catsToKeep(yes, {}, D3);
  ck('the answer is remembered for the shop and used next time', kc2['k:' + R.key('FURIKOMI 0123')].move === TRIP
    && P.plan(bk, [vague], { today: D3, assign: [MB], cats: {}, moveOf: P.knownMoves({ imports: { cats: kc2 } }) }).lines[0].to === TRIP);
  const shop = P.plan(bk, [rd([{ date: '2026-12-08', text: 'TRIP ADVISOR TOURS', amount: 3000, dir: 'out', cat: 'play' }])], { today: D3, assign: [MB], cats: {} }).lines[0];
  ck('a shop line that shares a word with an account stays a spend', shop.k === 'spend' && shop.status === 'new');
}
// [qc-numbers monthrule2 blocker 1, coordinator 26 Nov 07:57; M44, M45] a typed refund given back to Free to spend, then
// the bank statement shows the same 2,000 coming in: the statement line replaces the typed refund and is still a refund
// on Free to spend. Before: it kept the line but lost "refund", so it became money in, the 2,000 never came back to Free
// to spend, and Receipts had no refund to find. Made-up yen, Mako's book: spent 3,000 on 6 Dec, a 2,000 refund on 8 Dec.
{
  const PR = require('../../engine/periods.js'), D4 = '2026-12-16', bk = JSON.parse(JSON.stringify(book0));
  bk.events.push({ id: 'k7m2qa-r5f1n8d2u4-1', k: 'spend', acct: BANK, date: '2026-12-06', a: 3000, line: 'free', note: 'shoes', told: '2026-12-06T12:00+09:00', at: '2026-12-06T12:00+09:00', src: { type: 'typed' } },
    { id: 'k7m2qa-r5f1n8d2u4-2', k: 'in', sub: 'refund', acct: BANK, date: '2026-12-08', a: 2000, line: 'free', note: 'shoes back', told: '2026-12-08T12:00+09:00', at: '2026-12-08T12:00+09:00', src: { type: 'typed' } });
  const rd = R.cleanRead({ kind: 'bank', rows: [{ date: '2026-12-06', text: 'SHOE SHOP', amount: 3000, dir: 'out' }, { date: '2026-12-08', text: 'SHOE SHOP REFUND', amount: 2000, dir: 'in' }] }, 'bank_refund.csv', D4);
  const pr = P.plan(bk, [rd], { today: D4, assign: [BANK], cats: {} });
  const lr = pr.lines.find(l => l.dir === 'in');
  ck('[refund] the statement line replaces the typed refund', lr && lr.status === 'typed' && lr.typed === 'k7m2qa-r5f1n8d2u4-2', JSON.stringify(lr));
  const orr = P.records(bk, pr, { told: D4 + 'T10:00+09:00' }), er = orr.events.find(e => e.id === lr.id);
  ck('[refund] what is written is still a refund on Free to spend', er.k === 'in' && er.sub === 'refund' && er.line === 'free', JSON.stringify(er));
  const af = JSON.parse(JSON.stringify(bk)); af.events = af.events.concat(orr.events);
  const spentOf = b => { const x = PR.periods(b, D4); const w = [].concat(x.past || [], x.now ? [x.now] : []).find(q => q.start <= '2026-12-08' && q.end >= '2026-12-08'); return w && w.free ? w.free.spent : null; };
  ck('[refund] Free to spend spent is the same before and after the import: 3,000 - 2,000 = 1,000 of it', spentOf(bk) === spentOf(af), JSON.stringify([spentOf(bk), spentOf(af)]));
}
// [monthrule2 1b, way c part a] a pay ticked at a check is dated its due day, Thu 10 Dec; the bank statement read later
// says 11 Dec. The statement's day wins (statement over typed) and the review says so in one line, never silently:
// "Your Main job came in on 11 Dec, not 10 Dec, so your last period now ends 10 Dec". Made-up Mako book.
{
  const CI = require('../../engine/checkin.js'), D5 = '2026-12-16', bk = JSON.parse(JSON.stringify(book0));
  const MAIN = sch('Main job'), occM = MAIN + '@2026-12-10', r0 = L.lookahead(bk, '2026-12-14');
  const out = CI.checkIn(bk, { day: '2026-12-14', told: '2026-12-14T12:00+09:00', newId: I.idMaker('t3stdv', () => 0.3), figures: {}, ticked: [occM], unticked: [],
    amounts: {}, expected: { [occM]: 180000 }, lands: { [occM]: '2026-12-10' }, landed: {} });
  const b2 = CI.apply(bk, out);
  ck('[came] the check dated Main job 10 Dec', b2.events.some(e => e.k === 'in' && e.date === '2026-12-10' && (e.settles || []).some(x => x.s === MAIN)));
  const rd = R.cleanRead({ kind: 'bank', rows: [{ date: '2026-12-11', text: 'SALARY MAIN JOB', amount: 180000, dir: 'in' }] }, 'bank_pay.csv', D5);
  const pp = P.plan(b2, [rd], { today: D5, assign: [BANK], cats: {} });
  ck('[came] the review names the day it moved', JSON.stringify(pp.moved) === JSON.stringify([{ s: MAIN, was: '2026-12-10', now: '2026-12-11', starts: true }]), JSON.stringify(pp.moved));
  ck('[came] in words', P.movedWords(pp.moved[0], id => bk.schedules.find(x => x.id === id).name, d => d) === 'Your Main job came in on 2026-12-11, not 2026-12-10, so your last period now ends 2026-12-10', P.movedWords(pp.moved[0], id => bk.schedules.find(x => x.id === id).name, d => d));
  const same = P.plan(b2, [R.cleanRead({ kind: 'bank', rows: [{ date: '2026-12-10', text: 'SALARY MAIN JOB', amount: 180000, dir: 'in' }] }, 'bank_pay2.csv', D5)], { today: D5, assign: [BANK], cats: {} });
  ck('[came] the same day: nothing to say', same.moved.length === 0, JSON.stringify(same.moved));
}
console.log(bad ? `e3_stmt_plan: ${bad} FAIL of ${n}` : `e3_stmt_plan: ALL PASS (${n})`);
process.exit(bad ? 1 : 0);
