#!/usr/bin/env node
/* The phone's back button (SORTED K34, K35; MAKO_SAYS M13, M14, M33: Android, installed to the home screen), through
   the built page. Made-up numbers only.
   Before: no sheet wrote a history entry, so back on any sheet left the app. Now (src/back3.js, the one piece that
   knows which sheet or form is open):
     - back closes the sheet or form on top and the app stays; what was open under it keeps what was typed;
     - a sheet closed by back keeps what was typed in it, and shows it again the next time it opens (until something
       is saved, or it is closed again untouched);
     - a sheet closed by its own button takes its history entry with it, so back never does nothing;
     - back on a tab with nothing open leaves the app, as before.
   Every sheet in the page's shell is walked (a new one with no row here fails the count), plus the Plan forms, a
   receipt being changed, a statement's second step, and setup. */
'use strict';
const L = require('./lives3.js').make('e3_back');
const { ck, w, txt } = L;
const path = require('path');
const PAGE = 'file://' + path.join(__dirname, '../index.html');
const back = async p => { await p.evaluate(() => { setTimeout(() => history.back(), 0); }); await w(400); };
const shown = (p, sel) => p.$eval(sel, e => !e.closest('[hidden]')).catch(() => false);
const inApp = p => p.evaluate(() => /index\.html/.test(location.pathname) && !!document.querySelector('#a3'));
const depth = p => p.evaluate(() => (history.state && history.state.a3) || 0);
/* each sheet: how to get to it from Home, what shows when it is open */
const SHEETS = [
  { id: 'a3Check', name: 'Check your bank', open: async p => { await p.click('#a3CheckGo'); } },
  { id: 'a3Set', name: 'Settings', open: async p => { await p.click('#a3SetGo'); } },
  { id: 'a3Rem', name: 'Reminders', open: async p => { await p.click('#a3RemGo'); } },
  { id: 'a3Stmt', name: 'Add statements', open: async p => { await p.click('#a3StmtGo'); } },
  { id: 'a3Setup', name: 'Setup', setup: true },
];
async function start(day, q) {
  const o = await L.open();
  await o.p.goto('about:blank');
  await o.p.goto(PAGE + '?today=' + day + (q || '')); await w(500);
  return o;
}
(async () => {
  /* ---- the count: every sheet in the shell has a row above ---- */
  {
    const { c, p } = await start('2026-11-24', '&try=mako');
    const ids = await p.$$eval('.a3-sheet', es => es.map(e => e.id));
    ck(`every sheet in the page is walked here (${ids.length})`, ids.length === SHEETS.length && ids.every(id => SHEETS.some(s => s.id === id)), ids.join(' '));
    /* nothing open: back leaves, as before */
    ck('nothing open: no history entry of the app\'s own', (await depth(p)) === 0);
    await back(p);
    ck('nothing open: back leaves the app', (await p.url()) === 'about:blank', await p.url());
    await c.close();
  }
  /* ---- each sheet over the made-up book: back closes it, the app stays, a second back leaves ---- */
  for (const s of SHEETS.filter(x => !x.setup)) {
    const { c, p } = await start('2026-11-24', '&try=mako');
    await s.open(p); await w(350);
    ck(`${s.name}: opens`, await shown(p, '#' + s.id));
    ck(`${s.name}: open, it holds one history entry`, (await depth(p)) === 1, await depth(p));
    await back(p);
    ck(`${s.name}: back closes it`, !(await shown(p, '#' + s.id)));
    ck(`${s.name}: the app is still there, with its tabs`, (await inApp(p)) && (await shown(p, '.a3-tabs')));
    ck(`${s.name}: no entry left behind`, (await depth(p)) === 0, await depth(p));
    /* closed by its own button: its entry goes with it */
    await p.click('[data-tab=home]'); await w(150);
    await s.open(p); await w(350);
    await p.evaluate(id => { const b = [...document.querySelectorAll('#' + id + ' button')].find(x => /^(Back|Close|Done)$/.test(x.textContent.trim())); b.click(); }, s.id); await w(350);
    ck(`${s.name}: its own button closes it and takes its entry`, !(await shown(p, '#' + s.id)) && (await depth(p)) === 0, await depth(p));
    await back(p);
    ck(`${s.name}: then back leaves the app (never a back that does nothing)`, (await p.url()) === 'about:blank', await p.url());
    await c.close();
  }
  /* ---- what was typed is kept ---- */
  {
    const { c, p } = await start('2026-11-24', '&try=mako');
    await p.click('#a3CheckGo'); await w(300);
    await p.fill('#a3Check [data-bankfig]', '123456'); await w(100);
    const ticks = await p.$$('#a3Check .a3-tick input[type=checkbox]');
    if (ticks.length) await ticks[0].uncheck();
    /* [AI_JOIN_FIXES G] the old Ask sheet that opened over it is gone (the assistant panel over a sheet: e3_chat part 10) */
    ck('Check your bank holds 123456', (await p.$eval('#a3Check [data-bankfig]', e => e.value)) === '123456');
    await back(p);
    ck('back closes Check your bank, Home shows', !(await shown(p, '#a3Check')) && (await shown(p, '#a3Home')) && (await inApp(p)));
    await p.click('#a3CheckGo'); await w(300);
    ck('opened again: the bank figure typed before is there (123456)', (await p.$eval('#a3Check [data-bankfig]', e => e.value)) === '123456', await p.$eval('#a3Check [data-bankfig]', e => e.value));
    if (ticks.length) ck('opened again: the tick taken off is still off', (await p.$eval('#a3Check .a3-tick input[type=checkbox]', e => e.checked)) === false);
    const gap = await txt(p, '#a3Check [data-expected]');
    ck('opened again: the sheet\'s own lines are drawn for it', /Expected now/.test(gap), gap);
    await back(p);
    await p.click('#a3CheckGo'); await w(300);
    ck('closed again untouched: the next time it opens empty', (await p.$eval('#a3Check [data-bankfig]', e => e.value)) === '');
    await back(p);
    /* a Plan form */
    await p.click('[data-tab=plan]'); await w(250);
    await p.click('#plAddBill'); await w(300);
    ck('Plan, Add a bill: the form shows and holds one entry', (await shown(p, '[data-card=plan-form]')) && (await depth(p)) === 1);
    await p.fill('#pl-name', 'Gym'); await p.fill('#pl-amount', '7000'); await w(100);
    await back(p);
    ck('Plan form: back closes it, Plan shows', !(await p.$('[data-card=plan-form]')) && (await shown(p, '#a3Plan')) && (await inApp(p)));
    await p.click('#plAddBill'); await w(300);
    ck('Plan form opened again: Gym and 7000 are there', (await p.$eval('#pl-name', e => e.value)) === 'Gym' && (await p.$eval('#pl-amount', e => e.value)) === '7000', await p.$eval('#pl-name', e => e.value));
    /* its own Back keeps the typing too (K35), and saving clears it */
    await p.fill('#pl-amount', '7500'); await w(100);
    await p.click('#plBack'); await w(300);
    ck('Plan form: its own Back closes it and takes its entry', !(await p.$('[data-card=plan-form]')) && (await depth(p)) === 0);
    await p.click('#plAddGoal'); await w(300);
    ck('another Plan form never gets the bill\'s typing', (await p.$eval('#pl-name', e => e.value)) === '', await p.$eval('#pl-name', e => e.value));
    await p.click('#plBack'); await w(300);
    await p.click('#plAddBill'); await w(300);
    ck('Add a bill again: Gym and 7500 still there', (await p.$eval('#pl-name', e => e.value)) === 'Gym' && (await p.$eval('#pl-amount', e => e.value)) === '7500');
    await p.fill('#pl-name', 'Gym pass'); await p.fill('#pl-day', '15'); await w(100);
    await p.click('[data-plbtn="0"]'); await w(500);
    ck('saved: the form closes', !(await p.$('[data-card=plan-form]')), await txt(p, '#plErr'));
    await p.click('#plAddBill'); await w(300);
    ck('after a save the form opens empty', (await p.$eval('#pl-name', e => e.value)) === '' && (await p.$eval('#pl-amount', e => e.value)) === '');
    await back(p);
    /* a receipt being changed */
    await p.click('[data-tab=receipts]'); await w(250);
    await p.fill('#rcAmt', '500'); await p.click('#rcSave'); await w(450);
    const row = await p.$('#a3Rc li[data-rc] .a3-rcrow');
    if (row) {
      await row.click(); await w(300);
      ck('a receipt being changed holds one entry', !!(await p.$('#rcCancel')) && (await depth(p)) === 1, await depth(p));
      await back(p);
      ck('back puts the receipt form back to a new spend, Receipts shows', !(await p.$('#rcCancel')) && (await shown(p, '#a3Rc')) && (await inApp(p)));
    } else ck('a receipt row to change was found', false);
    ck('at the end nothing is open and no entry is held', (await depth(p)) === 0, await depth(p));
    await c.close();
  }
  /* ---- one sheet swapped for another in one tap (Settings closes Reminders first; it was Ask's old sheet before
     AI_JOIN_FIXES G removed it): one entry, never one too few ---- */
  {
    const { c, p } = await start('2026-11-24', '&try=mako');
    await p.click('#a3RemGo'); await w(300);
    await p.click('#a3SetGo'); await w(400);
    ck('Settings in place of Reminders: Settings shows and holds the one entry', (await shown(p, '#a3Set')) && !(await shown(p, '#a3Rem')) && (await depth(p)) === 1, await depth(p));
    await p.click('#a3SetClose'); await w(400);
    ck('its Close: the app is still there, nothing open, no entry', (await inApp(p)) && (await shown(p, '#a3Home')) && (await depth(p)) === 0, (await p.url()) + ' ' + (await depth(p).catch(() => '?')));
    await p.click('#a3RemGo'); await w(300);
    await p.click('#a3SetGo'); await w(400);
    await back(p);
    ck('the same swap, then back: the app is still there', (await inApp(p)) && !(await shown(p, '#a3Set')), await p.url());
    await c.close();
  }
  /* ---- a reload with a sheet open: no entry of a sheet that is gone ---- */
  {
    const { c, p } = await start('2026-11-24', '&try=mako');
    await p.click('#a3SetGo'); await w(300);
    await p.reload(); await w(700);
    ck('reload with Settings open: the page comes back with nothing open and no entry held', !(await shown(p, '#a3Set')) && (await depth(p)) === 0, await depth(p));
    await back(p);
    ck('then back leaves the app', (await p.url()) === 'about:blank', await p.url());
    await c.close();
  }
  /* ---- setup: back closes it and keeps every answer, saved or only typed ---- */
  {
    const { c, p } = await start('2026-11-24', '');
    await p.click('#a3SetupGo'); await w(350);
    ck('Setup: opens with one entry', (await shown(p, '#a3Setup')) && (await depth(p)) === 1, await depth(p));
    await L.typeIn(p, '#s3Bank', '286000');
    await p.click('#a3Setup [data-save=bank]'); await w(300);
    await L.typeIn(p, '#s3PayAmt', '190000'); await w(100);
    await back(p);
    ck('Setup: back closes it, the first screen shows, the app stays', !(await shown(p, '#a3Setup')) && (await inApp(p)) && !!(await p.$('#a3SetupGo')));
    await p.click('#a3SetupGo'); await w(450);
    ck('Setup opened again: the saved bank (286000) and the typed pay (190000) are there', (await p.$eval('#s3Bank', e => e.value)) === '286000' && (await p.$eval('#s3PayAmt', e => e.value)) === '190000', (await p.$eval('#s3Bank', e => e.value)) + ' ' + (await p.$eval('#s3PayAmt', e => e.value)));
    /* Settings over setup: back closes Settings only */
    await p.click('#a3SetGo'); await w(300);
    await back(p);
    ck('Settings over Setup: back closes Settings, Setup still shows with its answers', !(await shown(p, '#a3Set')) && (await shown(p, '#a3Setup')) && (await p.$eval('#s3Bank', e => e.value)) === '286000');
    await back(p);
    ck('back again closes Setup', !(await shown(p, '#a3Setup')) && (await inApp(p)));
    await back(p);
    ck('with nothing open, back leaves', (await p.url()) === 'about:blank', await p.url());
    await c.close();
  }
  await L.finish();
})().catch(e => { console.log('FAIL e3_back crashed ' + (e && e.stack || e)); process.exit(1); });
