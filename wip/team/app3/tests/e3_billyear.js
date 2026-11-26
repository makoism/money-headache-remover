#!/usr/bin/env node
/* [E1b, M13] a yearly bill after setup (qc-controls controls1 blocker 2): Plan > Add a bill asks how often (once a month or
   once a year); once a year asks the month and the day; the bill is saved with a yearly rule and shows on Plan with its
   day; its sheet changes the month and day from a date, as a monthly bill's day; a month the day does not have says what
   to do and loses nothing; Undo takes it back; after a reload it is still there. On the kept made-up book (e3_act_book.js),
   25 Nov 2026, phone size. Made-up yen. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const fs = require('fs');
const { actBook } = require('./e3_act_book.js');
const DAY = '2026-11-25';
const saved = p => p.evaluate(async () => { const s = await BurrowStore.open(); try { const r = await s.load(); return r.copy; } finally { s.close(); } });
(async () => {
  const prof = fs.mkdtempSync(require('os').tmpdir() + '/a3byear-');
  const { b, p, errs } = await T.open({ profile: prof });
  try {
    const bk0 = actBook();
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
    await p.evaluate(async bk => { const s = await BurrowStore.open(); await s.load(); const r = await s.save(bk, { full: true }); s.close(); return r.ok; }, bk0);
    await p.reload(); await T.w(400);
    const plan = async () => { await p.tap('[data-tab="plan"]'); await T.w(300); if (await p.$('#plBack')) { await p.click('#plBack'); await T.w(200); } };
    const btn = label => p.evaluate(l => { const x = [...document.querySelectorAll('[data-plbtn]')].find(y => y.textContent.trim() === l); if (x) x.click(); return !!x; }, label);
    const fill = async (sel, v) => { await p.$eval(sel, e => { e.value = ''; }); await p.type(sel, v); };
    const err = () => p.$eval('#plErr', e => e.textContent);
    const shown = sel => p.$eval(sel, e => !e.closest('.a3-field').hidden);
    const undo = () => p.evaluate(() => { const x = [...document.querySelectorAll('#a3Msg button')].find(y => /Undo/.test(y.textContent)); if (x) x.click(); return !!x; });
    const billRow = name => p.evaluate(n => { const x = [...document.querySelectorAll('[data-card="plan-bills"] [data-bill]')].find(y => y.textContent.includes(n)); return x ? x.textContent.replace(/\s+/g, ' ').trim() : null; }, name);
    await plan();
    await p.click('#plAddBill'); await T.w(300);
    ck('Add a bill asks how often, once a month by default', (await p.$eval('#pl-every', e => [e.value, [...e.options].map(o => o.textContent).join('|')])).join(' ') === 'month On a day each month|Once a year');
    ck('once a month: no month box', !(await shown('#pl-month')) && await shown('#pl-day'));
    await p.select('#pl-every', 'year'); await T.w(100);
    ck('once a year: the month box shows, with the day', await shown('#pl-month') && await shown('#pl-day'));
    ck('the day box says day of the month for both', /Day/.test(await p.$eval('label[for="pl-day"]', e => e.textContent)));
    await fill('#pl-name', 'Car tax'); await fill('#pl-amount', '39500'); await p.select('#pl-month', '2'); await fill('#pl-day', '30');
    await btn('Add'); await T.w(400);
    ck('30 February: it says what to do and the sheet stays open', /Pick a day that month has/.test(await err()) && !!(await p.$('#plBack')), await err());
    ck('nothing saved yet', !(await saved(p)).schedules.some(s => s.name === 'Car tax'));
    await p.select('#pl-month', '5'); await fill('#pl-day', '31');
    await btn('Add'); await T.w(500);
    let bk = await saved(p), s = bk.schedules.find(x => x.name === 'Car tax' && !x.gone);
    ck('saved as a yearly bill on 31 May', s && s.kind === 'bill' && JSON.stringify(s.rules[0].rule) === '{"every":"year","date":"05-31"}', JSON.stringify(s && s.rules));
    ck('it shows on Plan once a year with its next day', /Car tax.*31 May/.test(await billRow('Car tax') || ''), await billRow('Car tax'));
    /* Undo, then add it again */
    ck('Undo is offered', await undo()); await T.w(500);
    ck('after Undo it is gone', !(await billRow('Car tax')) && (await saved(p)).schedules.find(x => x.id === s.id).gone);
    await p.click('#plAddBill'); await T.w(300);
    await fill('#pl-name', 'Car tax'); await fill('#pl-amount', '39500'); await p.select('#pl-every', 'year'); await p.select('#pl-month', '5'); await fill('#pl-day', '31');
    await btn('Add'); await T.w(500);
    bk = await saved(p); s = bk.schedules.find(x => x.name === 'Car tax' && !x.gone);
    /* its sheet: the month and the day, changed from a date */
    await p.evaluate(id => document.querySelector(`[data-bill="${id}"]`).click(), s.id); await T.w(300);
    ck('its sheet shows the month and day it has', (await p.$eval('#pl-month', e => e.value)) === '5' && (await p.$eval('#pl-day', e => e.value)) === '31');
    await p.select('#pl-month', '6'); await fill('#pl-day', '31');
    await btn('Save'); await T.w(400);
    ck('31 June: it says what to do', /Pick a day that month has/.test(await err()), await err());
    await fill('#pl-day', '15'); await btn('Save'); await T.w(500);
    bk = await saved(p); s = bk.schedules.find(x => x.id === s.id);
    const last = s.rules.slice(-1)[0];
    ck('a new rule from the change day, once a year on 15 June; the first kept', s.rules.length === 2 && JSON.stringify(last.rule) === '{"every":"year","date":"06-15"}' && last.from && last.at, JSON.stringify(s.rules));
    ck('Plan shows 15 June', /Car tax.*15 Jun/.test(await billRow('Car tax') || ''), await billRow('Car tax'));
    ck('Undo puts 31 May back', await undo()); await T.w(500);
    ck('after Undo: 31 May', /Car tax.*31 May/.test(await billRow('Car tax') || ''), await billRow('Car tax'));
    /* a monthly bill's sheet has no month box */
    const rent = bk.schedules.find(x => x.name === 'Rent');
    await p.evaluate(id => document.querySelector(`[data-bill="${id}"]`).click(), rent.id); await T.w(300);
    ck('a monthly bill\'s sheet has no month box', !(await p.$('#pl-month')));
    await p.click('#plBack'); await T.w(200);
    await p.reload(); await T.w(500); await plan();
    ck('after a reload the yearly bill is still there', /Car tax.*31 May/.test(await billRow('Car tax') || ''), await billRow('Car tax'));
    ck('no page errors', !errs.length, errs.join(' | '));
  } finally { await b.close(); fs.rmSync(prof, { recursive: true, force: true }); }
  T.done('e3_billyear');
})();
