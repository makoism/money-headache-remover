#!/usr/bin/env node
/* Reminders on the page: the made-up Mako book (pay on the 10th, Rent on the 27th), Wed 25 Nov 2026.
   1. Defaults: check-ins the day after pay and mid period, every bill two days before, 09:00; the next days are
      REMIND3's (from the engine's calendar) in node.
   2. Changes redraw: untick mid period, a bill off, on the day, 20:30.
   3. The calendar file is made on the device: its text is REMIND3.ics of the same events (each dated day, no amount);
      Google and Outlook links are REMIND3's for the first of each series.
   4. Nothing is sent and nothing is saved: no outside request, the kept book unchanged, nothing in localStorage.
   5. No page errors; no sideways scroll at 320. Every amount is made up. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const R = require('../src/remind3.js');
const DAY = '2026-11-25', RENT = 'k7m2qa-f3n8p1x6wd-6', PHONE = 'k7m2qa-f3n8p1x6wd-8';
const seed = (p, bk) => p.evaluate(async bk0 => { const s = await BurrowStore.open(); await s.load(); const r = await s.save(bk0, { full: true }); s.close(); return r.ok; }, bk);
const saved = p => p.evaluate(async () => { const s = await BurrowStore.open(); try { const r = await s.load(); return r.copy; } finally { s.close(); } });
const noStamp = s => s.replace(/DTSTAMP:\d{8}T\d{6}Z/g, 'DTSTAMP:x');

(async () => {
  const bk = T.book();
  const prof = require('fs').mkdtempSync(require('os').tmpdir() + '/a3rem-');
  const { b, p, errs, requests } = await T.open({ profile: prof });
  await p.evaluateOnNewDocument(() => { const o = URL.createObjectURL; URL.createObjectURL = x => { window.__blob = x; return o.call(URL, x); }; });
  await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
  await seed(p, bk); await p.reload(); await T.w(500);
  const before = JSON.stringify(await saved(p));

  await p.click('#a3RemGo'); await T.w(300);
  ck('the check-in line has no full stop at its end (VOICE)', await p.$eval('#a3Rem', e => /It keeps safe to spend true(?!\.)/.test(e.textContent) && !/safe to spend true\./.test(e.textContent)));
  ck('Reminders opens as its own sheet over the tabs', await p.$eval('#a3Rem', e => !e.hidden) && await p.$eval('#a3Home', e => e.hidden));
  const c0 = R.checkins(bk, DAY);
  ck('both check-in days ticked; the next three are the engine\'s days', await p.$eval('#a3RemAfter', e => e.checked) && await p.$eval('#a3RemMid', e => e.checked)
    && (await p.$eval('#a3RemNext', e => e.textContent)) === 'Next: 25 Nov, 11 Dec, 24 Dec' && c0.items[1].day === '2026-12-11', await p.$eval('#a3RemNext', e => e.textContent));
  const rows = await p.$$eval('[data-rembillrow]', e => e.map(x => [x.dataset.rembillrow, x.querySelector('input').checked, x.textContent.replace(/\s+/g, ' ').trim()]));
  ck('every bill, ticked, two days before by default', rows.length === 4 && rows.every(r => r[1]) && (await p.$eval('#a3RemBefore', e => e.value)) === '2', JSON.stringify(rows));
  ck('Rent: next reminder 25 Nov, due 27 Nov', /^Rent ?next reminder 25 Nov, due 27 Nov$/.test((rows.find(r => r[0] === RENT) || [])[2]), JSON.stringify(rows));
  ck('the line says nothing is sent and no amount is in the reminders', /Nothing is sent anywhere/.test(await p.$eval('[data-rem="what"]', e => e.textContent)) && /never an amount/.test(await p.$eval('[data-rem="what"]', e => e.textContent)));

  /* changes */
  await p.click('#a3RemMid'); await T.w(150);
  await p.click(`[data-rembill="${PHONE}"]`); await T.w(150);
  await p.select('#a3RemBefore', '0'); await T.w(150);
  await p.$eval('#a3RemTime', e => { e.value = '20:30'; e.dispatchEvent(new Event('change', { bubbles: true })); }); await T.w(150);
  ck('untick mid period: only the days after pay', (await p.$eval('#a3RemNext', e => e.textContent)) === 'Next: 11 Dec, 9 Jan 2027, 11 Feb 2027', await p.$eval('#a3RemNext', e => e.textContent));
  const c1 = R.checkins(bk, DAY, { mid: false }), bills = R.bills(bk, DAY, { before: 0 }).filter(x => x.id !== PHONE);
  const ev = R.events({ checkins: c1, bills, time: '20:30' });
  ck('the count of reminders in the file', (await p.$eval('#a3RemCount', e => e.textContent)) === ev.length + ' reminders in the file', await p.$eval('#a3RemCount', e => e.textContent));
  await p.click('#a3RemIcs'); await T.w(300);
  const text = await p.evaluate(() => window.__blob && window.__blob.text());
  const type = await p.evaluate(() => window.__blob && window.__blob.type);
  ck('the calendar file is REMIND3.ics of the same events, made on the device', type === 'text/calendar' && noStamp(text || '') === noStamp(R.ics(ev, { now: '2026-11-25T00:00:00Z' })), (text || '').slice(0, 200));
  ck('the file has no amount and no Phone', !/¥|72,000|72000/.test(text) && !/Phone/.test(text) && /Rent is due on 27 Nov/.test(text) && /DTSTART:20261211T203000/.test(text));
  const links = await p.$$eval('[data-remlink]', e => e.map(x => [x.dataset.remlink, x.querySelector('[data-rem=google]').href, x.querySelector('[data-rem=outlook]').href]));
  const rentEv = ev.find(e => e.kind === 'bill' && e.title.startsWith('Rent'));
  ck('one link row per series: after pay and the three bills ticked', links.map(l => l[0]).join() === ['afterPay'].concat(bills.map(x => 'bill:' + x.id)).join(), JSON.stringify(links.map(l => l[0])));
  ck('Google and Outlook links are REMIND3\'s for the first of each series', links.find(l => l[0] === 'bill:' + RENT)[1] === R.gcal(rentEv) && links.find(l => l[0] === 'bill:' + RENT)[2] === R.outlook(rentEv)
    && links[0][1] === R.gcal(ev.find(e => e.kind === 'afterPay')));
  ck('Google repeats Rent on the 27th', /recur=RRULE%3AFREQ%3DMONTHLY%3BBYMONTHDAY%3D27/.test(links.find(l => l[0] === 'bill:' + RENT)[1]));

  /* nothing sent, nothing saved */
  ck('no outside request', requests.length === 0, JSON.stringify(requests));
  ck('the kept book is unchanged and nothing is in localStorage', JSON.stringify(await saved(p)) === before && (await p.evaluate(() => localStorage.length)) === 0);
  await p.click('#a3RemClose'); await T.w(200);
  ck('Close goes back to Home', await p.$eval('#a3Rem', e => e.hidden) && await p.$eval('#a3Home', e => !e.hidden));
  await p.click('#a3RemGo'); await T.w(200);
  /* [AI_JOIN_FIXES G] the old Ask sheet is gone: Settings is the other sheet opened from the header */
  await p.click('#a3SetGo'); await T.w(300);
  ck('Settings over Reminders: Reminders closes first, Settings shows', await p.$eval('#a3Rem', e => e.hidden) && await p.$eval('#a3Set', e => !e.hidden));
  await p.click('#a3SetClose'); await T.w(200);
  ck('and Home is back after', await p.$eval('#a3Home', e => !e.hidden) && await p.$eval('.a3-tabs', e => !e.hidden));
  await p.click('#a3RemGo'); await T.w(200);
  await p.setViewport({ width: 320, height: 700, isMobile: true, hasTouch: true }); await T.w(200);
  ck('no sideways scroll at 320', await p.evaluate(() => Math.max(document.documentElement.scrollWidth, document.getElementById('a3').scrollWidth) <= 320), await p.evaluate(() => Math.max(document.documentElement.scrollWidth, document.getElementById('a3').scrollWidth)));
  await T.shot(p, 'remind');
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();

  /* no pay day: says why */
  {
    const nb = T.book(); delete nb.schedules[0].startsPeriod;
    const { b, p, errs } = await T.open({ profile: require('fs').mkdtempSync(require('os').tmpdir() + '/a3rem2-') });
    await p.goto(T.URL0 + '?today=' + DAY); await T.w(300);
    await seed(p, nb); await p.reload(); await T.w(500);
    await p.click('#a3RemGo'); await T.w(300);
    ck('with no pay day set, the check-in line says why', /no pay day set/.test(await p.$eval('#a3RemNext', e => e.textContent)), await p.$eval('#a3RemNext', e => e.textContent));
    ck('no page errors (no pay day)', errs.length === 0, errs.join(' | '));
    await b.close();
  }
  T.done('e3_remind');
})();
