#!/usr/bin/env node
/* [E1b, M13, M61] Reminders keep their choices (qc-controls controls1 blocker 1: they looked saved and came back as before
   after a reload). On the kept made-up book, phone size: untick Rent, pick 3 days before, 08:30 and untick the middle of
   the pay period; the sheet says each choice is saved on this phone; after Close and a reload every choice is as left;
   ticking Rent again is kept too. The sheet says plainly that a calendar already filled changes only with a new calendar
   file. Made-up yen. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs');
const { actBook } = require('./e3_act_book.js');
const DAY = '2026-11-25';
(async () => {
  const prof = fs.mkdtempSync(require('os').tmpdir() + '/a3remkeep-');
  const { b, p, errs } = await T.open({ profile: prof });
  try {
    const bk0 = actBook(), rent = bk0.schedules.find(s => s.name === 'Rent').id;
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
    await p.evaluate(async bk => { const s = await BurrowStore.open(); await s.load(); const r = await s.save(bk, { full: true }); s.close(); return r.ok; }, bk0);
    await p.reload(); await T.w(500);
    const open = async () => { await p.evaluate(() => document.querySelector('#a3RemGo').click()); await T.w(500); };
    const state = () => p.evaluate(r => ({ after: document.querySelector('#a3RemAfter').checked, mid: document.querySelector('#a3RemMid').checked, before: document.querySelector('#a3RemBefore').value,
      time: document.querySelector('#a3RemTime').value, rent: document.querySelector(`[data-rembill="${r}"]`).checked, kept: (document.querySelector('[data-rem="kept"]') || {}).textContent || '' }), rent);
    await open();
    let s = await state();
    ck('fresh: the defaults', s.after && s.mid && s.before === '2' && s.time === '09:00' && s.rent, JSON.stringify(s));
    ck('the sheet says a calendar already filled changes only with a new file', /calendar/i.test(s.kept) && /again/.test(await p.$eval('#a3Rem', e => e.textContent)), s.kept);
    await p.click(`[data-rembill="${rent}"]`); await T.w(200);
    await p.click('#a3RemMid'); await T.w(200);
    await p.select('#a3RemBefore', '3'); await T.w(200);
    await p.$eval('#a3RemTime', e => { e.value = '08:30'; e.dispatchEvent(new Event('change', { bubbles: true })); }); await T.w(400);
    s = await state();
    ck('after the changes it says they are saved on this phone', /Saved on this phone/.test(s.kept), s.kept);
    await p.click('#a3RemClose'); await T.w(200);
    await open();
    s = await state();
    ck('closed and opened again: as left', !s.rent && !s.mid && s.after && s.before === '3' && s.time === '08:30', JSON.stringify(s));
    await p.click('#a3RemClose'); await T.w(200);
    await p.reload(); await T.w(700);
    await open();
    s = await state();
    ck('after a reload: every choice as left (Rent off, middle off, 3 days before, 08:30)', !s.rent && !s.mid && s.after && s.before === '3' && s.time === '08:30', JSON.stringify(s));
    const n = await p.$eval('#a3RemCount', e => e.textContent);
    ck('the calendar file counts only what is picked', /reminders in the file/.test(n), n);
    await p.click(`[data-rembill="${rent}"]`); await T.w(400);
    await p.click('#a3RemClose'); await T.w(200);
    await p.reload(); await T.w(700); await open();
    s = await state();
    ck('Rent ticked again is kept too', s.rent && !s.mid, JSON.stringify(s));
    ck('no page errors', !errs.length, errs.join(' | '));
  } finally { await b.close(); fs.rmSync(prof, { recursive: true, force: true }); }
  T.done('e3_remkeep');
})();
