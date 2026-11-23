#!/usr/bin/env node
/* BI2 on the page: after a statement is read, Receipts lists each record once. Walk 2's made-up book
   (walk/v2/bookJan7.json) kept through the store, shown as on 15 Dec 2026: the statement's SUPER 3,000 and FOOD MART
   4,000 are the groceries and food typed before, and its two "TO TRIP ACCT" lines are the two moves. Receipts lists
   through the engine's countOnce, so each pair is one row and the moves stay moves. */
'use strict';
const fs = require('fs'), path = require('path');
const T = require('./lib3.js'), { ck } = T;
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '../walk/v2/bookJan7.json'), 'utf8'));
const book = raw.book || raw;
const DAY = '2026-12-15';
const P_known = bk => { const c = (bk.imports && bk.imports.cats) || {}, o = {}; for (const k of Object.keys(c)) if (c[k] && c[k].move) o[k.slice(2)] = c[k].move; return o; };
(async () => {
  const res = T.L.lookahead(book, DAY), away = Object.keys(res.dropped || {});
  ck('the engine sets the pairs aside (groceries, food, two trip lines, the ticked items)', away.length >= 11, away.length);
  const prof = fs.mkdtempSync(require('os').tmpdir() + '/a3once-');
  const { b, p, errs } = await T.open({ profile: prof });
  await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
  const put = await p.evaluate(async bk => { const s = await BurrowStore.open(); const r = await s.save(bk, { full: true }); if (s.db) s.db.close(); return r; }, book);
  ck('the walk\'s book is kept through the store', put && put.ok, JSON.stringify(put));
  await p.reload(); await T.w(400);
  await p.tap('[data-tab="receipts"]'); await T.w(300);
  const list = () => p.$$eval('#rcList [data-rc]', rs => rs.map(r => ({ id: r.dataset.rc, text: r.textContent.replace(/\s+/g, ' ').trim() })));
  const rows = await list();
  await p.click('#rcOlder'); await T.w(300);   // the period before pay, 10 Nov to 9 Dec, where the statement's lines fall
  rows.push(...await list());
  ck('Receipts lists rows', rows.length > 0, rows.length);
  ck('no row the engine set aside is listed', rows.every(r => !away.includes(r.id)), rows.filter(r => away.includes(r.id)).map(r => r.text).join(' | '));
  ck('no "TO TRIP ACCT" line beside the two moves', !rows.some(r => /TO TRIP/.test(r.text)) && rows.filter(r => /Moved to/.test(r.text)).length === 2, rows.map(r => r.text).join(' | '));
  const n = re => rows.filter(r => re.test(r.text)).length;
  ck('the 3,000 groceries is one row', n(/3,000/) === 1, rows.filter(r => /3,000/.test(r.text)).map(r => r.text).join(' | '));
  ck('the 4,000 food is one row', n(/4,000/) === 1, rows.filter(r => /4,000/.test(r.text)).map(r => r.text).join(' | '));
  await T.shot(p, 'stmt_once_receipts');
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();

  /* [BJ4] walk 3: the same bank statement read on 15 Dec on walk 2's Free to spend book, where the 5 Dec move of 5,000 to
     the Trip account was never typed. Both "TO TRIP ACCT" lines are moves; money sent out that names no account is asked. */
  {
    const rawF = JSON.parse(fs.readFileSync(path.join(__dirname, '../walk/v2/bookFree.json'), 'utf8'));
    const bf = rawF.book || rawF;
    bf.events = bf.events.filter(e => !(e.src && e.src.type === 'statement') && e.note !== 'extra for trip' && e.date <= DAY);
    bf.checkins = (bf.checkins || []).filter(c => !c.from);
    const TRIP = bf.accounts.find(a => a.name === 'Trip account').id;
    const prof2 = fs.mkdtempSync(require('os').tmpdir() + '/a3move-');
    const { b, p, errs } = await T.open({ profile: prof2 });
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
    await p.evaluate(async bk => { const s = await BurrowStore.open(); await s.save(bk, { full: true }); if (s.db) s.db.close(); }, bf);
    await p.reload(); await T.w(400);
    await p.click('#a3StmtGo'); await T.w(200);
    await p.$eval('#a3StmtAny', e => { e.open = true; });
    await p.$eval('#a3StmtPaste', (e, v) => { e.value = v; }, JSON.stringify({ statements: [{ account: 'Main bank', kind: 'bank', rows: [
      { date: '2026-12-01', text: 'TO TRIP ACCT', amount: 20000, dir: 'out', cat: 'transfer_out' },
      { date: '2026-12-05', text: 'TO TRIP ACCT', amount: 5000, dir: 'out', cat: 'transfer_out' },
      { date: '2026-12-12', text: 'FURIKOMI 0123', amount: 7000, dir: 'out', cat: 'transfer_out' }] }] }));
    await p.click('#a3StmtCheck'); await T.w(400);
    const q = await p.$eval('#a3StmtMoves', e => e.textContent).catch(() => '');
    ck('[BJ4] "Is this a move to one of your accounts?" asks about the line naming no account, with "No, it went to someone else"', /FURIKOMI/.test(q) && !/TRIP/.test(q) && /No, it went to someone else/.test(q), q);
    ck('[walk 4] until it is answered nothing is added: Add waits and says why, and the line is still in the review', (await p.$eval('#a3StmtAdd', e => e.disabled && e.textContent)) === 'Answer the question above' && /FURIKOMI/.test(await p.$eval('#a3Stmt', e => e.textContent)), await p.$eval('#a3StmtAdd', e => e.textContent));
    await p.select('[data-move]', 'no'); await T.w(300);
    ck('[BJ4] answered "No, it went to someone else": all three can be added', (await p.$eval('#a3StmtAdd', e => e.textContent)) === 'Add 3 lines');
    await T.shot(p, 'stmt_move_review');
    await p.click('#a3StmtAdd'); await T.w(700);
    const kept = await p.evaluate(async () => { const s = await BurrowStore.open(); const r = await s.load(); if (s.db) s.db.close(); return r.copy; });
    const imps = kept.events.filter(e => e.src && e.src.type === 'statement');
    ck('[BJ4] both TRIP lines were written as moves to the Trip account, and only the line said to go to someone else as a spend', imps.length === 3 && imps.filter(e => e.k === 'transfer' && e.acct2 === TRIP).length === 2 && imps.filter(e => e.k === 'spend').map(e => e.a).join() === '7000', JSON.stringify(imps.map(e => [e.k, e.a, e.acct2 === TRIP])));
    const ps = require('../../engine/periods.js').periods(kept, DAY), past = ps.past.find(x => x.start <= '2026-12-05' && x.end >= '2026-12-05');
    ck('the period\'s spending stays at 20,000', past.free.spent === 20000, JSON.stringify(past.free));
    ck('the answer is remembered for the shop', P_known(kept).furikomi === 'no', JSON.stringify(kept.imports && kept.imports.cats));
    ck('no page errors (moves)', errs.length === 0, errs.join(' | '));
    await b.close();
  }
  T.done('e3_stmt_once');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
