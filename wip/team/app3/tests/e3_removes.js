#!/usr/bin/env node
/* Every remove on the screens asks first (M6, M61; qc-data-safety B1; coordinator's ruling 26 Nov: the piece, not the
   case). Two halves.
   1. COUNTED: every button in src whose words remove something (Remove, End this, Close this, Delete, Drop, Clear,
      Stop here, and a setup row's own Remove) is named in the table below with how it asks. A new one that is not in
      the table fails here, so it cannot be missed.
   2. WALKED, through the page on the kept made-up book (25 Nov 2026): each door marked 'sure' is tapped: nothing is
      written, a question shows with a yes and a no; No leaves everything as it was; Yes does it; Undo brings it back. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs'), path = require('path');
const { actBook, FOOD } = require('./e3_act_book.js');
const DAY = '2026-11-25';
/* how each asks: 'sure' = the shared question (sure3), walked below; anything else names what guards it */
const TABLE = {
  'Remove': 'sure',                       // Receipts: a spend, a refund, money in, money moved
  'End this line': 'sure',
  'End this bill': 'sure',
  'Close this loan': 'sure',
  'Close this account': 'sure on its own sheet; the button on the account\'s sheet only opens that sheet (tests/e3_acctclose.js)',
  'Remove this account': 'sure (tests/e3_acctclose.js)',
  'Close this card': 'sure (tests/e3_cardclose.js)',
  'Remove this card': 'sure (tests/e3_cardclose.js)',
  'Remove this loan': 'sure (tests/e3_cardclose.js)',
  'Remove this pay': 'sure (tests/e3_payadd.js)',
  'Remove this bill': 'sure (tests/e3_payadd.js)',
  'End this pay': 'sure (tests/e3_payadd.js)',
  'Remove this goal': 'sure, with where its money goes picked on the sheet (tests/e3_goalremove.js)',
  'Stop here': 'its own question in Settings (tests/e3_cloud.js)',
  'Delete the cloud copy': 'its own question in Settings (tests/e3_cloud.js)',
  'Delete it for good': 'the second step of Delete the cloud copy, after its own question with Keep it first (tests/e3_cloud.js)',
  'Drop it': 'its own question in Settings (tests/e3_restore.js, e3_backup.js)',
  'Clear': 'the assistant\'s error log, not money; Undo on the bar (tests/e3_ailog.js)',
  'Clear it': 'the code word kept on this device, not money (settings3.js)',
  'setup row Remove': 'a row in the setup form, with the Undo band (tests/e3_undobar.js, e3_setupfix.js); told to the coordinator 26 Nov',
};
const saved = p => p.evaluate(async () => { const s = await BurrowStore.open(); try { const r = await s.load(); return r.copy; } finally { s.close(); } });
const bare = b => JSON.stringify([b.events, b.schedules, (b.plan || {}).budgets, b.accounts]);
(async () => {
  /* ---- 1. counted ---- */
  const dir = path.join(__dirname, '../src'), found = new Set();
  const WORDS = /^(Remove|End this|Close this|Delete|Drop|Clear|Stop here)/;
  for (const f of fs.readdirSync(dir).filter(x => /\.(js|html)$/.test(x) && !/_core\.js$/.test(x))) {
    const s = fs.readFileSync(path.join(dir, f), 'utf8');
    for (const m of s.matchAll(/label: '([^']+)'/g)) if (WORDS.test(m[1])) found.add(m[1]);
    for (const m of s.matchAll(/<button\b[^>]*>([^<$`]+)<\/button>/g)) if (WORDS.test(m[1].trim())) found.add(m[1].trim());
    if (/<button\b[^>]*data-remove/.test(s)) found.add('setup row Remove');
  }
  const names = [...found].sort();
  ck(`counted: ${names.length} removing buttons in src, each named in the table`, names.every(n => TABLE[n]), 'not in the table: ' + names.filter(n => !TABLE[n]).join(', '));
  ck('counted: the table names nothing that is gone', Object.keys(TABLE).every(n => found.has(n)), 'gone: ' + Object.keys(TABLE).filter(n => !found.has(n)).join(', '));
  ck('counted: the four that change money in the book use the shared question', ['Remove', 'End this line', 'End this bill', 'Close this loan'].every(n => TABLE[n] === 'sure'));

  /* ---- 2. walked ---- */
  const prof = fs.mkdtempSync(require('os').tmpdir() + '/a3rm-');
  const { b, p, errs } = await T.open({ profile: prof });
  try {
    const bk0 = actBook();
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
    await p.evaluate(async bk => { const s = await BurrowStore.open(); await s.load(); const r = await s.save(bk, { full: true }); s.close(); return r.ok; }, bk0);
    await p.reload(); await T.w(400);
    const rent = bk0.schedules.find(x => x.name === 'Rent').id;
    const q = () => p.$eval('[data-sure]', e => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => '');
    const undo = () => p.evaluate(() => { const x = [...document.querySelectorAll('#a3Msg button')].find(y => /Undo/.test(y.textContent)); if (x) x.click(); return !!x; });
    async function door(name, open, tapRemove, words, changed) {
      await open();
      const before = bare(await saved(p));
      await tapRemove(); await T.w(300);
      ck(`${name}: the first tap writes nothing`, bare(await saved(p)) === before);
      ck(`${name}: it asks, naming what goes`, words.test(await q()), await q());
      ck(`${name}: with a yes and a no`, !!(await p.$('[data-sure] [data-sureyes]')) && !!(await p.$('[data-sure] [data-sureno]')));
      await p.$eval('[data-sure] [data-sureno]', e => e.click()); await T.w(300);
      ck(`${name}: No takes the question away and writes nothing`, !(await p.$('[data-sure]')) && bare(await saved(p)) === before);
      if (!changed) return;
      await tapRemove(); await T.w(300);
      await p.$eval('[data-sure] [data-sureyes]', e => e.click()); await T.w(500);
      ck(`${name}: Yes does it`, changed(await saved(p)), '');
      ck(`${name}: and Undo is offered`, await undo()); await T.w(500);
      ck(`${name}: Undo brings it back`, !changed(await saved(p)));
    }
    /* Receipts: log a spend, open it, Remove */
    await p.tap('[data-tab="receipts"]'); await T.w(300);
    await p.tap('#rcAmt'); await p.keyboard.type('1500'); await p.tap('#rcSave'); await T.w(500);
    const spend = (await saved(p)).events.find(e => e.k === 'spend' && e.a === 1500 && !e.gone).id;
    await door('Remove a spend', async () => { await p.$eval(`#rcList [data-rc="${spend}"] button`, e => e.click()); await T.w(300); },
      () => p.$eval('#rcRemove', e => e.click()), /Remove ¥1,500/, bk => !!bk.events.find(e => e.id === spend).gone);
    /* Plan: a line, a bill, a loan */
    const plan = async sel => { await p.tap('[data-tab="plan"]'); await T.w(300); if (await p.$('#plBack')) { await p.click('#plBack'); await T.w(200); } await p.click(sel); await T.w(300); };
    const btn = label => p.evaluate(l => { const x = [...document.querySelectorAll('[data-plbtn]')].find(y => y.textContent.trim() === l); if (x) x.click(); return !!x; }, label);
    await door('End this line', () => plan(`#a3Plan [data-line="${FOOD}"]`), () => btn('End this line'), /End Food\?/, bk => !!bk.plan.budgets.find(l => l.id === FOOD).ends);
    await door('End this bill', () => plan(`#a3Plan [data-bill="${rent}"]`), () => btn('End this bill'), /End Rent\?/, bk => !!bk.schedules.find(s => s.id === rent).ends);
    /* a loan added on the page (the book's own loan account has nothing owed, so Plan does not list it) */
    await p.tap('[data-tab="plan"]'); await T.w(300); if (await p.$('#plBack')) { await p.click('#plBack'); await T.w(200); }
    await p.click('#plAddLoan'); await T.w(200);
    for (const [k, v] of Object.entries({ name: 'Bike loan', owed: '90000', amount: '5000', payDay: '27' })) await p.$eval('#pl-' + k, (e, v) => { e.focus(); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.blur(); }, v);
    await p.click('[data-plbtn="0"]'); await T.w(500);
    const loan = ((await saved(p)).accounts.find(x => x.name === 'Bike loan') || {}).id;
    /* a loan that still owes: the refusal comes first, with no question (the question is only asked when Yes would do it) */
    await plan(`#a3Plan [data-owed="${loan}"]`); await btn('Close this loan'); await T.w(300);
    ck('Close this loan, still owing: refused in words at once, no question', !(await p.$('[data-sure]')) && /still owes ¥[\d,]+\. Use Pay it off now/.test(await p.$eval('#plErr', e => e.textContent)), await p.$eval('#plErr', e => e.textContent));
    ck('no page errors', errs.length === 0, errs.join(' | '));
  } finally { await b.close(); }
  T.done('e3_removes');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
