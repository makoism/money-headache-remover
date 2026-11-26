#!/usr/bin/env node
/* [CHECKFIX_PLAN slice 10] Change or remove a bank check later, on the screens (M13, M14, M6, M36, M37, M47, M61). The
   made-up Mako book (one bank, two cards) with a Food line, checked at Check your bank on 28 Nov (200,000, the three
   bills ticked) and on 11 Dec (pay and both card payments ticked, the bank 3,000 under what the app expected, Card A
   typed 0). Today 12 Dec, phone size:
   - Home: the bank's Checks link (and its figure) opens "Checks of Main bank", newest first: 11 Dec, 28 Nov, 20 Nov
     (where it started);
   - the 28 Nov check: no Remove (only the newest); an empty box says "Type the figure your bank showed" and Back loses
     nothing; 195,000 saved: the check keeps was, the Undo bar names it; Undo puts 200,000 back;
   - changed again, reload: Settings > Recent changes names it with Undo, which works;
   - the 11 Dec check: "The gap went to: Free to spend", Change to Food: the check-in keeps fillerPlace, Food spent 3,000;
   - Remove this check asks first with the plan's words (Card A's payment stays ticked); No writes nothing; Yes marks
     the check, the pay and Card B's payment gone with one goneBy; the list no longer has it;
   - a minus figure on the 28 Nov check (now the newest) asks first because it takes all of safe to spend, then saves;
   - Check your bank with the gap logged on Food writes fillerPlace, no fixed spend (F2);
   - [coordinator, slice 10] a figure far from what the app expected (more than double, less than half, or off by more
     than the pay) asks once on the Checks sheet and at Check your bank: Fix it keeps the typed figure, nothing saved;
     Yes saves. Made-up yen. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs'), path = require('path');
const E = path.join(__dirname, '../../engine/');
const LA = require(E + 'lookahead.js'), CK = require(E + 'checkin.js'), IDS = require(E + 'ids.js');
const DAY = '2026-12-12', BANK = 'k7m2qa-f3n8p1x6wd-1', CARD_A = 'k7m2qa-f3n8p1x6wd-2', FOOD = 'k7m2qa-f00dlin3xx-1';
function seed() {
  let b = JSON.parse(fs.readFileSync(path.join(__dirname, '../fixtures/mako_madeup_book.json'), 'utf8'));
  b.plan.budgets.push({ id: FOOD, name: 'Food', place: 'bills', cur: 'JPY', per: 'pay', from: '2026-11-20', steps: [{ from: null, amount: 40000 }], told: '2026-11-20T12:00:00.000+09:00', at: '2026-11-20T12:00:00.000+09:00', by: 'k7m2qa' });
  const newId = IDS.idMaker('s33dck');
  const check = (day, figs) => {
    const r = LA.lookahead(b, day), expected = {}, lands = {};
    for (const x of r.checkIn.toConfirm) { expected[x.item] = x.amount; lands[x.item] = x.lands; }
    const base = { day, told: day + 'T12:00:00.000+09:00', newId, ticked: r.checkIn.toConfirm.map(x => x.item), unticked: [], amounts: {}, expected, lands, landed: {} };
    if (typeof figs === 'function') figs = figs(LA.lookahead(CK.apply(b, CK.checkIn(b, Object.assign({}, base, { figures: {} }))), day));
    b = CK.apply(b, CK.checkIn(b, Object.assign(base, { figures: figs })));
  };
  check('2026-11-28', { [BANK]: 200000 });
  check('2026-12-11', r => ({ [BANK]: r.accounts[BANK].bank - 3000, [CARD_A]: 0 }));
  return b;
}
const saved = p => p.evaluate(async () => { const s = await BurrowStore.open(); try { const r = await s.load(); return r.copy; } finally { s.close(); } });
(async () => {
  const prof = fs.mkdtempSync(require('os').tmpdir() + '/a3ckfix-');
  const { b, p, errs } = await T.open({ profile: prof });
  try {
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
    await p.evaluate(async bk => { const s = await BurrowStore.open(); await s.load(); const r = await s.save(bk, { full: true }); s.close(); return r.ok; }, seed());
    await p.reload(); await T.w(500);
    const rows = () => p.$$eval('#a3Checks [data-checkopen]', bs => bs.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
    const open = async i => { await p.evaluate(n => document.querySelectorAll('#a3Checks [data-checkopen]')[n].click(), i); await T.w(300); };
    const err = () => p.$eval('#a3ChecksErr', e => e.textContent).catch(() => '');
    const bar = () => p.evaluate(() => { const m = document.querySelector('#a3Msg .burrow-msg'); return m ? m.textContent.replace(/\s+/g, ' ') : ''; });
    const undo = () => p.evaluate(() => { const x = [...document.querySelectorAll('#a3Msg button')].find(y => /Undo/.test(y.textContent)); if (x) x.click(); return !!x; });
    const setFig = async v => { await p.$eval('#a3CheckFig', e => { e.value = ''; }); if (v) await p.type('#a3CheckFig', v); };
    const chk = (bk, d) => bk.events.find(e => e.k === 'check' && e.acct === BANK && e.date === d && !e.gone);
    /* the door */
    ck('Home: the bank has a Checks link', !!(await p.$(`#a3Home [data-checks="${BANK}"]`)));
    await p.click(`#a3Home [data-checks="${BANK}"]`); await T.w(400);
    ck('Checks of Main bank, newest first, with where each came from', await p.$eval('#a3ChecksT', e => e.textContent) === 'Checks of Main bank'
      && JSON.stringify(await rows()).match(/11 Dec.*typed at Check your bank.*28 Nov.*¥200,000.*20 Nov.*where it started.*¥286,000/), JSON.stringify(await rows()));
    ck('the chat knows the sheet', await p.evaluate(() => BurrowApp3.chat.screen()) === 'checks');
    /* an older check: change, no remove, empty box */
    await open(1);
    ck('the 28 Nov check opens with its figure and no Remove (only the newest)', /^200,?000$/.test(await p.$eval('#a3CheckFig', e => e.value)) && !(await p.$('#a3ChecksRemove')), await p.$eval('#a3CheckFig', e => e.value));
    let before = JSON.stringify(await saved(p));
    await setFig(''); await p.click('#a3ChecksSave'); await T.w(300);
    ck('an empty box says what to type and writes nothing', await err() === 'Type the figure your bank showed' && JSON.stringify(await saved(p)) === before, await err());
    await p.click('#a3ChecksBack'); await T.w(300);
    ck('Back goes to the list, nothing lost', (await rows()).length === 3 && JSON.stringify(await saved(p)) === before);
    await open(1); await setFig('195000'); await p.click('#a3ChecksSave'); await T.w(700);
    let bk = await saved(p);
    ck('saved: 195,000, with was keeping 200,000, and the check-in typedA follows', chk(bk, '2026-11-28').a === 195000 && chk(bk, '2026-11-28').was[0].a === 200000
      && bk.checkins.find(k => k.id === chk(bk, '2026-11-28').grp).figures.find(f => f.acct === BANK).typedA === 195000);
    ck('the Undo bar names it', /Main bank, 28 Nov: ¥200,000 to ¥195,000/.test(await bar()), await bar());
    ck('Undo puts 200,000 back', await undo(), await p.$eval('#a3Msg', e => e.innerHTML)); await T.w(700);
    ck('after Undo: 200,000, no was', chk(await saved(p), '2026-11-28').a === 200000 && !chk(await saved(p), '2026-11-28').was);
    /* again, then a reload: Undo from Recent changes */
    await p.click(`#a3Home [data-checks="${BANK}"]`).catch(() => {}); await T.w(300);
    if (!(await p.$('#a3Checks [data-checkopen]'))) { await p.click(`#a3Home [data-checks="${BANK}"]`); await T.w(300); }
    await open(1); await setFig('195000'); await p.click('#a3ChecksSave'); await T.w(700);
    await p.reload(); await T.w(700);
    await p.click('#a3SetGo'); await T.w(400);
    const recent = await p.$$eval('#a3SetChanges [data-changes] li', ls => ls.map(l => l.textContent.replace(/\s+/g, ' ').trim()));
    ck('after a reload, Recent changes names the change', /28 Nov: ¥200,000 to ¥195,000/.test(recent[0] || ''), JSON.stringify(recent));
    await p.evaluate(() => { const li = [...document.querySelectorAll('#a3SetChanges [data-changes] li')].find(l => /28 Nov/.test(l.textContent)); li.querySelector('[data-undoj]').click(); }); await T.w(700);
    ck('its Undo works after the reload', chk(await saved(p), '2026-11-28').a === 200000);
    await p.click('#a3SetClose'); await T.w(300);
    /* where the gap went */
    await p.click(`#a3Home [data-checks="${BANK}"]`); await T.w(300); await open(0);
    ck('the newest says where its gap went', /The gap went to: Free to spend/.test(await p.$eval('[data-gapwent]', e => e.textContent)));
    await p.click('#a3GapChange'); await T.w(200);
    ck('Change offers the lines and "Nothing, back to Free to spend"', await p.$$eval('#a3GapSel option', os => os.map(o => o.textContent).join('|')) === 'Nothing, back to Free to spend|Food');
    await p.select('#a3GapSel', 'line:' + FOOD); await p.click('#a3GapSave'); await T.w(700);
    bk = await saved(p);
    const ci11 = bk.checkins.find(k => k.id === chk(bk, '2026-12-11').grp);
    ck('the check-in keeps Food for the bank (fillerPlace)', JSON.stringify(ci11.fillerPlace) === JSON.stringify({ [BANK]: FOOD }));
    ck('Food has spent the 3,000 gap', await p.evaluate(() => (BurrowApp3.E3.view(BurrowApp3.E3.today()).period.lines.find(l => l.name === 'Food') || {}).spent) === 3000);
    ck('the sheet now says Food', /The gap went to: Food/.test(await p.$eval('[data-gapwent]', e => e.textContent)));
    /* [coordinator, slice 10] a tick taken back later: on Receipts in its stretch, and on the card's sheet on Plan */
    await p.click('#a3ChecksBack'); await T.w(200); await p.click('#a3ChecksX'); await T.w(300);
    await p.tap('[data-tab="receipts"]'); await T.w(400);
    const tickRows = await p.$$eval('#rcList [data-tick]', ls => ls.map(l => l.textContent.replace(/\s+/g, ' ').trim()));
    ck('Receipts lists the payments ticked on 10 and 11 Dec, each with Remove this tick', tickRows.some(t => /^Ticked: Card A's payment/.test(t)) && tickRows.some(t => /^Ticked: Card B's payment/.test(t)) && tickRows.every(t => /Remove this tick/.test(t)), JSON.stringify(tickRows));
    const cardB = (await saved(p)).events.find(e => e.k === 'repay' && e.acct2 === 'k7m2qa-f3n8p1x6wd-3' && !e.gone);
    before = JSON.stringify(await saved(p));
    await p.$eval(`#rcList [data-untick="${cardB.id}"]`, e => e.click()); await T.w(300);
    const tq = await p.$eval('#rcTickSure [data-sure]', e => e.textContent.replace(/\s+/g, ' ')).catch(() => '');
    ck('Remove this tick asks first', /^Untick Card B's payment of ¥23,000, 11 Dec\? It goes back to not ticked, so it is expected again\. You can Undo it/.test(tq), tq);
    await p.$eval('#rcTickSure [data-sureno]', e => e.click()); await T.w(200);
    ck('No writes nothing', JSON.stringify(await saved(p)) === before);
    await p.$eval(`#rcList [data-untick="${cardB.id}"]`, e => e.click()); await T.w(300);
    await p.$eval('#rcTickSure [data-sureyes]', e => e.click()); await T.w(700);
    bk = await saved(p);
    ck('Yes: the tick is gone (no was), its row too, and Card B\'s payment is expected again', bk.events.find(e => e.id === cardB.id).gone && bk.events.find(e => e.id === cardB.id).was === undefined && !(await p.$(`#rcList [data-untick="${cardB.id}"]`))
      && await p.evaluate(() => { const r = BurrowApp3.E3.view(BurrowApp3.E3.today()); return (r.cards['k7m2qa-f3n8p1x6wd-3'].overdue || []).length > 0 || r.checkIn.toConfirm.some(x => /f3n8p1x6wd-3@/.test(x.item)); }));
    ck('Undo puts the tick back', await undo()); await T.w(700);
    ck('after Undo: ticked again', !(await saved(p)).events.find(e => e.id === cardB.id).gone);
    await p.tap('[data-tab="plan"]'); await T.w(400);
    await p.evaluate(() => { const b = [...document.querySelectorAll('#a3Plan button[data-owed]')].find(x => /Card A/.test(x.textContent)); if (b) b.click(); }); await T.w(400);
    const sheetTicks = await p.$$eval('#a3Plan [data-ticks] [data-tick]', ls => ls.map(l => l.textContent.replace(/\s+/g, ' ').trim())).catch(() => []);
    ck('Card A\'s own sheet on Plan lists its payment ticked, with Remove this tick', sheetTicks.length === 1 && /^Ticked: Card A's payment/.test(sheetTicks[0]) && /Remove this tick/.test(sheetTicks[0]), JSON.stringify(sheetTicks));
    await p.click('#plBack'); await T.w(200);
    await p.tap('[data-tab="home"]'); await T.w(300);
    await p.click(`#a3Home [data-checks="${BANK}"]`); await T.w(300); await open(0);
    /* remove the newest */
    before = JSON.stringify(await saved(p));
    await p.click('#a3ChecksRemove'); await T.w(300);
    const q = await p.$eval('[data-sure]', e => e.textContent.replace(/\s+/g, ' ').trim());
    ck('Remove asks first, in the plan\'s words, naming Card A\'s payment that stays', /^Remove the check of Main bank on 11 Dec\? Its figure ¥[\d,]+ goes, and the 3 payments ticked with it go back to not ticked\. Card A's payment stays ticked: its figure was typed with it\. You can Undo it/.test(q), q);
    await p.$eval('[data-sure] [data-sureno]', e => e.click()); await T.w(300);
    ck('No writes nothing', JSON.stringify(await saved(p)) === before);
    await p.click('#a3ChecksRemove'); await T.w(300);
    await p.$eval('[data-sure] [data-sureyes]', e => e.click()); await T.w(800);
    bk = await saved(p);
    const gone = bk.events.filter(e => e.grp === ci11.id && e.gone);
    ck('Yes: the check and the ticks of Main bank gone with one goneBy, no was; Card A\'s figure and payment stay', gone.length === 4 && new Set(gone.map(e => e.goneBy)).size === 1 && gone.every(e => e.was === undefined)
      && bk.events.filter(e => e.grp === ci11.id && !e.gone).length === 2 && !bk.checkins.find(k => k.id === ci11.id).gone, JSON.stringify(gone.map(e => [e.k, e.acct])));
    ck('the list no longer has it', (await rows()).length === 2 && /^28 Nov/.test((await rows())[0]), JSON.stringify(await rows()));
    /* a minus figure, asked first */
    await open(0); await setFig('-5000'); await p.click('#a3ChecksSave'); await T.w(400);
    const farQ = await p.$eval('#a3ChecksSure [data-far]', e => e.textContent.replace(/\s+/g, ' ')).catch(() => '');
    ck('[far] a figure far from what the app expected asks first: "That is ... less than expected. Is -5,000 right?"', /^That is ¥[\d,]+ less than expected\. Is \S*5,000 right\?/.test(farQ), farQ);
    await p.$eval('#a3ChecksSure [data-farfix]', e => e.click()); await T.w(300);
    ck('[far] Fix it keeps the typed figure in the box, nothing saved', /5,?000$/.test(await p.$eval('#a3CheckFig', e => e.value)) && chk(await saved(p), '2026-11-28').a === 200000, await p.$eval('#a3CheckFig', e => e.value));
    await p.$eval('#a3ChecksSave', e => e.click()); await T.w(400);
    await p.$eval('#a3ChecksSure [data-faryes]', e => e.click()); await T.w(400);
    const ask = await p.$eval('#a3ChecksSure [data-sure]', e => e.textContent.replace(/\s+/g, ' ')).catch(() => '');
    ck('[M6] a change that takes all of safe to spend asks first', /^This takes safe to spend from ¥[\d,]+ to ¥0/.test(ask) && chk(await saved(p), '2026-11-28').a === 200000, ask);
    await p.$eval('#a3ChecksSure [data-sureyes]', e => e.click()); await T.w(800);
    ck('[M47] Yes saves a figure below zero', chk(await saved(p), '2026-11-28').a === -5000);
    ck('Undo', await undo()); await T.w(700);
    if (await p.$('#a3ChecksBack')) { await p.click('#a3ChecksBack'); await T.w(200); }
    await p.click('#a3ChecksX'); await T.w(300);
    ck('Back closes the sheet and Home is there', await p.$eval('#a3Checks', e => e.hidden) && !(await p.$eval('#a3Home', e => e.hidden)));
    /* [far] Check your bank: a figure ten times what the app expects asks once; Fix it keeps it, Yes saves */
    await p.click('#a3CheckGo'); await T.w(400);
    const exp = await p.evaluate(b => BurrowApp3.E3.view(BurrowApp3.E3.today()).accounts[b].bank, BANK);
    before = JSON.stringify(await saved(p));
    await p.type(`[data-bankfig="${BANK}"]`, String(exp * 10)); await T.w(300);
    await p.evaluate(b => { const x = document.querySelector(`[data-gapyes="${b}"]`); if (x && !x.closest('[hidden]')) x.click(); }, BANK); await T.w(200);
    await p.$eval('#a3CheckSave', e => e.click()); await T.w(400);
    const far1 = await p.$eval('#a3CheckFar [data-far]', e => e.textContent.replace(/\s+/g, ' ')).catch(() => '');
    ck('[far] Check your bank asks "That is ... more than expected. Is ... right?" with Yes and Fix it', /^That is ¥[\d,]+ more than expected\. Is ¥[\d,]+ right\?\s*Yes\s*Fix it$/.test(far1.trim()), far1);
    await p.$eval('#a3CheckFar [data-farfix]', e => e.click()); await T.w(300);
    ck('[far] Fix it: the typed figure stays in the box, nothing saved', (await p.$eval(`[data-bankfig="${BANK}"]`, e => e.value)).replace(/\D/g, '') === String(exp * 10) && JSON.stringify(await saved(p)) === before);
    await p.$eval(`[data-bankfig="${BANK}"]`, e => { e.value = ''; });
    /* F2: Check your bank keeps where the gap goes */
    await p.type(`[data-bankfig="${BANK}"]`, String(exp - 2000)); await T.w(300);
    await p.evaluate(b => { const x = document.querySelector(`[data-gapyes="${b}"]`); if (x && !x.closest('[hidden]')) x.click(); }, BANK); await T.w(200);
    await p.click(`[data-gapspend="${BANK}"]`); await p.select(`[data-gapline="${BANK}"]`, 'line:' + FOOD);
    await p.click('#a3CheckSave'); await T.w(700);
    bk = await saved(p);
    const last = bk.checkins.slice(-1)[0];
    ck('[F2] Check your bank keeps Food for the gap (fillerPlace), no fixed spend', JSON.stringify(last.fillerPlace) === JSON.stringify({ [BANK]: FOOD }) && !bk.events.some(e => e.grp === last.id && e.k === 'spend'), JSON.stringify(last));
    ck('[FD1] its check names the check before it in prev', bk.events.find(e => e.grp === last.id && e.k === 'check').prev === chk(bk, '2026-11-28').id);
    ck('no page errors', !errs.length, errs.join(' | '));
  } finally { await b.close(); fs.rmSync(prof, { recursive: true, force: true }); }
  T.done('e3_checkfix');
})();
