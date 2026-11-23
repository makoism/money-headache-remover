// store/clock.js: the D4/AH1 clock, D8 date questions, "today" worked out again on return.
'use strict';
const path = require('path');
const RULES = path.join(__dirname, '..', '..', 'foundation_review', 'rules');
const merge = require(path.join(RULES, 'merge.json'));
const M = require(path.join(RULES, 'merge_ref.js'));

const TOKYO = { timezoneId: 'Asia/Tokyo' }, LA = { timezoneId: 'America/Los_Angeles' };

module.exports = [
  { name: 'the clock agrees with merge.json (next_at, next_at_warn, clock_ask, seen) in Tokyo and Los Angeles', run: async t => {
    const cases = merge.cases.filter(c => ['next_at', 'next_at_warn', 'clock_ask', 'seen'].includes(c.question));
    t.assert(cases.length >= 20, 'merge.json has the clock cases', cases.length);
    for (const tz of [TOKYO, LA]) {
      const p = await t.page(await t.context(tz));
      const got = await p.evaluate(cs => cs.map(c => {
        const C = window.BurrowClock, i = c.input;
        if (c.question === 'next_at') return C.nextAt(i.now, i.lastSeen);
        if (c.question === 'next_at_warn') return C.nextAtWarn(i.now, i.lastSeen, i.lastDay);
        if (c.question === 'clock_ask') return C.clockAsk(i.today, i.lastDay);
        return C.newestAt(i.copy);
      }), cases);
      cases.forEach((c, n) => t.assert.eq(got[n], c.expected, tz.timezoneId + ' ' + c.id));
    }
    t.log(cases.length + ' merge.json clock cases, two time zones');
  } },

  { name: 'a copy that arrives more than a day ahead is held exactly as merge_ref.holdArriving holds it', run: async t => {
    const cases = merge.cases.filter(c => c.question === 'receive');
    t.assert(cases.length >= 10, 'merge.json has receive cases', cases.length);
    const p = await t.page(await t.context(TOKYO));
    const got = await p.evaluate(cs => cs.map(c => window.BurrowClock.holdArriving(c.input.theirs, c.input.mine, c.input.now)), cases);
    cases.forEach((c, n) => t.assert.eq(got[n], M.holdArriving(c.input.theirs, c.input.lastSeen, c.input.mine, c.input.now), c.id));
    t.log(cases.length + ' arriving copies held the same way as the reference');
  } },

  { name: 'own writes: never behind anything seen, a long gap is never held, a clock set back still moves forward', run: async t => {
    const p = await t.page(await t.context(TOKYO), pg => pg.clock.install({ time: new Date('2026-11-23T10:00:00+09:00') }));
    const r = await p.evaluate(() => {
      const C = window.BurrowClock, c = C.makeClock();
      const a = c.stamp();
      c.see({ events: [{ id: 'x', at: '2026-11-23T10:05:00.000+09:00' }] });   // another device five minutes ahead
      const b = c.stamp(), b2 = c.stamp();
      return { a, b, b2, seen: c.seen() };
    });
    t.assert.eq(r.a, '2026-11-23T10:00:00.000+09:00', 'first stamp is now with the Tokyo offset');
    t.assert.eq(r.b, '2026-11-23T10:05:00.001+09:00', 'after seeing a newer at, the stamp is that plus 1 ms');
    t.assert.eq(r.b2, '2026-11-23T10:05:00.002+09:00', 'two stamps in one moment still differ');
    await p.clock.setSystemTime(new Date('2026-12-14T10:00:00+09:00'));   // three weeks away
    t.assert.eq(await p.evaluate(() => window.BurrowClock.makeClock({ lastSeen: '2026-11-23T10:05:00.002+09:00' }).stamp()),
      '2026-12-14T10:00:00.000+09:00', 'three weeks away: the write takes its real time [AH1]');
    await p.clock.setSystemTime(new Date('2026-11-20T10:00:00+09:00'));   // clock set back
    t.assert.eq(await p.evaluate(() => window.BurrowClock.makeClock({ lastSeen: '2026-11-23T10:05:00.002+09:00' }).stamp()),
      '2026-11-23T10:05:00.003+09:00', 'a clock set back still writes after what it has seen');
  } },

  { name: 'today is the local calendar day, never the UTC one, in Tokyo before 9:00 and in Los Angeles in the evening', run: async t => {
    const tk = await t.page(await t.context(TOKYO), pg => pg.clock.install({ time: new Date('2026-11-23T08:30:00+09:00') }));
    t.assert.eq(await tk.evaluate(() => [window.BurrowClock.todayStr(), window.BurrowClock.nowIso()]),
      ['2026-11-23', '2026-11-23T08:30:00.000+09:00'], 'Tokyo 08:30');
    const la = await t.page(await t.context(LA), pg => pg.clock.install({ time: new Date('2026-11-23T20:00:00-08:00') }));
    t.assert.eq(await la.evaluate(() => [window.BurrowClock.todayStr(), window.BurrowClock.nowIso()]),
      ['2026-11-23', '2026-11-23T20:00:00.000-08:00'], 'Los Angeles 20:00');
  } },

  { name: 'whole day numbers step one day at a time across daylight saving (Los Angeles, March and November)', run: async t => {
    const p = await t.page(await t.context(LA));
    const r = await p.evaluate(() => {
      const C = window.BurrowClock, out = [];
      for (const start of ['2026-03-06', '2026-10-30']) {
        let n = C.dayNum(start); const days = [];
        for (let i = 0; i < 5; i++) days.push(C.dayStr(n + i));
        out.push(days);
      }
      out.push(C.addDays('2026-12-30', 3), C.daysBetween('2026-11-23', '2027-11-23'));
      return out;
    });
    t.assert.eq(r[0], ['2026-03-06', '2026-03-07', '2026-03-08', '2026-03-09', '2026-03-10'], 'March change');
    t.assert.eq(r[1], ['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03'], 'November change');
    t.assert.eq(r[2], '2027-01-02', 'across a year end');
    t.assert.eq(r[3], 365, 'a year of days');
  } },

  { name: 'D8 on opening: one day back is fine, two days back or more than 40 ahead asks, a confirmed date is kept', run: async t => {
    const p = await t.page(await t.context(TOKYO));
    const r = await p.evaluate(() => {
      const C = window.BurrowClock;
      return [
        C.openDay({ lastSeen: '2026-11-23' }, '2026-11-23'),
        C.openDay({ lastSeen: '2026-11-23' }, '2026-11-22'),
        C.openDay({ lastSeen: '2026-11-23' }, '2026-11-21'),
        C.openDay({ lastSeen: '2026-11-23' }, '2027-01-03'),
        C.openDay({ lastSeen: '2026-11-23' }, '2027-01-02'),
        C.openDay({}, '2026-11-21'),
        C.openDay({ lastSeen: '2026-11-23' }, '2026-11-21', { confirmed: true }),
      ];
    });
    t.assert.eq(r[0], { ask: null, lastSeen: '2026-11-23' }, 'same day');
    t.assert.eq(r[1], { ask: null, lastSeen: '2026-11-23' }, 'one day back: no question, the last open stays the later day');
    t.assert.eq(r[2], { ask: 'back', lastSeen: '2026-11-23' }, 'two days back asks and changes nothing yet');
    t.assert.eq(r[3], { ask: 'ahead', lastSeen: '2026-11-23' }, '41 days ahead asks');
    t.assert.eq(r[4], { ask: null, lastSeen: '2027-01-02' }, '40 days ahead is fine');
    t.assert.eq(r[5], { ask: null, lastSeen: '2026-11-21' }, 'first open ever');
    t.assert.eq(r[6], { ask: null, lastSeen: '2026-11-21' }, 'once the person confirms the date, it is the last open');
  } },

  { name: '"today" is worked out again at midnight and when the app comes back into view', run: async t => {
    const p = await t.page(await t.context(TOKYO), pg => pg.clock.install({ time: new Date('2026-11-23T23:59:30+09:00') }));
    await p.evaluate(() => { window.days = []; window.w = window.BurrowClock.watchToday((d, old) => window.days.push(old + '>' + d)); });
    t.assert.eq(await p.evaluate(() => window.w.today()), '2026-11-23', 'starts on the 23rd');
    await p.clock.runFor(60000);
    t.assert.eq(await p.evaluate(() => [window.w.today(), window.days]), ['2026-11-24', ['2026-11-23>2026-11-24']], 'midnight passed while open');
    // Away for two days with the page in the background (timers do not run): coming back recomputes.
    await p.clock.setSystemTime(new Date('2026-11-26T08:00:00+09:00'));
    await p.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    t.assert.eq(await p.evaluate(() => [window.w.today(), window.days.length]), ['2026-11-26', 2], 'back in view');
    await p.evaluate(() => window.w.stop());
    await p.clock.setSystemTime(new Date('2026-11-28T08:00:00+09:00'));
    await p.evaluate(() => window.dispatchEvent(new Event('focus')));
    t.assert.eq(await p.evaluate(() => window.days.length), 2, 'stopped: no more calls');
  } },
];
