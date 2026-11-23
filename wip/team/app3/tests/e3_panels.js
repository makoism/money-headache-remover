#!/usr/bin/env node
/* Only the tapped tab's panel shows (north-star finding: the Receipts block spilled into Home and over Plan, Settings and
   Reminders until a reload). Every tab after every other tab, each sheet (Settings, Reminders, Ask) opened and closed
   from each tab, and Check your bank left by a tab tap. "Shows" is what the eye sees (a laid-out box), not the hidden
   attribute, so a style rule that beats [hidden] is caught. Made-up numbers only (?try=mako). */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const TABS = ['home', 'receipts', 'plan'];
/* which panels and sheets have a box on the screen */
const seen = p => p.evaluate(() => {
  const vis = e => !!e && getComputedStyle(e).display !== 'none' && e.getClientRects().length > 0;
  return {
    panels: [...document.querySelectorAll('[data-panel]')].filter(vis).map(e => e.dataset.panel),
    sheets: [...document.querySelectorAll('.a3-sheet')].filter(vis).map(e => e.id),
    bar: vis(document.querySelector('#a3StmtBar')),
    tabs: vis(document.querySelector('.a3-tabs'))
  };
});
const only = (s, tab) => s.panels.length === 1 && s.panels[0] === tab && s.sheets.length === 0 && s.bar === (tab === 'home') && s.tabs;
(async () => {
  const { b, p, errs } = await T.open();
  await p.goto(T.URL0 + '?try=mako&today=2026-11-25'); await T.w(400);
  ck('at first only Home shows', only(await seen(p), 'home'), JSON.stringify(await seen(p)));
  for (const a of TABS) for (const c of TABS) {
    await p.tap(`[data-tab="${a}"]`); await T.w(120);
    await p.tap(`[data-tab="${c}"]`); await T.w(120);
    const s = await seen(p);
    ck(`${a} then ${c}: only ${c} shows`, only(s, c), JSON.stringify(s));
  }
  for (const t of TABS) for (const [go, sheet, close] of [['#a3SetGo', 'a3Set', '#a3SetClose'], ['#a3RemGo', 'a3Rem', '#a3RemClose'], ['#a3AskGo', 'a3Ask', '#a3AskClose']]) {
    await p.tap(`[data-tab="${t}"]`); await T.w(120);
    await p.tap(go); await T.w(200);
    const open = await seen(p);
    ck(`${sheet} over ${t}: only the sheet shows`, open.panels.length === 0 && open.sheets.join() === sheet && !open.bar, JSON.stringify(open));
    await p.tap(close); await T.w(200);
    const s = await seen(p);
    ck(`${sheet} closed: back on ${t} alone`, only(s, t), JSON.stringify(s));
  }
  /* Check your bank is a sheet over Home; a tab tap leaves it for that tab alone */
  for (const t of ['receipts', 'plan']) {
    await p.tap('[data-tab="home"]'); await T.w(120);
    await p.tap('#a3CheckGo'); await T.w(200);
    const open = await seen(p);
    ck(`Check your bank: only the sheet shows (${t} next)`, open.panels.length === 0 && open.sheets.join() === 'a3Check', JSON.stringify(open));
    await p.tap(`[data-tab="${t}"]`); await T.w(200);
    const s = await seen(p);
    ck(`Check your bank then ${t}: only ${t} shows`, only(s, t), JSON.stringify(s));
  }
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close(); T.done('e3_panels');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
