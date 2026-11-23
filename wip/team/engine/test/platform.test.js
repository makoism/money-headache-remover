'use strict';
// SCHEMA_V3 section 10: the engine never parses a date string with Date and never slices "now" from toISOString [D8];
// it gives the same answers under TZ=America/Los_Angeles and TZ=Asia/Tokyo; and the files load as plain browser
// scripts, in order, with no module system.
const { t, done, eq, ok } = require('./t.js');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');

const dir = path.join(__dirname, '..');
const FILES = ['dates.js', 'units.js', 'ids.js', 'schedules.js', 'ledger.js', 'lookahead.js'];

t('no Date parsing of a date string, no now from toISOString, no clock read in the engine files [D8]', () => {
  for (const f of FILES) {
    const src = fs.readFileSync(path.join(dir, f), 'utf8').split('\n').filter(l => !/^\s*(\/\/|\/\*|\*)/.test(l)).join('\n');
    ok(!/new Date\(\s*['"`a-zA-Z_]/.test(src.replace(/new Date\(Date\.UTC/g, '').replace(/new Date\(n \* MS\)/g, '')), f + ': new Date(<string>)');
    ok(!/toISOString/.test(src), f + ': toISOString');
    ok(!/Date\.now\(|new Date\(\)/.test(src), f + ': reads the clock');
  }
});

t('the same answers in Los Angeles and in Tokyo', () => {
  const run = tz => spawnSync(process.execPath, [path.join(__dirname, 'run_against_ref.js'), '--no-real'], { env: Object.assign({}, process.env, { TZ: tz }), encoding: 'utf8' });
  const la = run('America/Los_Angeles'), tk = run('Asia/Tokyo');
  eq(la.status, 0); eq(tk.status, 0);
  eq(la.stdout, tk.stdout);
});

t('the files load as plain browser scripts and answer', () => {
  const ctx = { console };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx, { filename: f });
  const E = ctx.BurrowEngine;
  ok(E && E.dates && E.units && E.ids && E.schedules && E.ledger && E.lookahead);
  const book = { v: 3, home: { curs: [{ from: '2026-01-01', cur: 'JPY' }], country: { v: 'JP' }, main: { v: { acct: 'b', min: null } } },
    accounts: [{ id: 'b', name: 'Bank', type: 'bank', cur: 'JPY' }],
    schedules: [{ id: 'pay', kind: 'income', name: 'Pay', acct: 'b', cur: 'JPY', startsPeriod: true, shift: 'before', rules: [{ rule: { every: 'month', days: [10] } }], steps: [{ amount: 300000 }] }],
    events: [{ id: 'o', k: 'open', acct: 'b', date: '2026-11-20', a: 100000, told: '2026-11-20T10:00+09:00', grp: 's' },
      { id: 'c', k: 'check', acct: 'b', date: '2026-11-20', a: 100000, told: '2026-11-20T10:00+09:00', grp: 's' }] };
  const r = E.lookahead.lookahead(book, '2026-11-23', { deviceOffset: '+09:00' });
  eq(r.accounts.b.bank, 100000);
  eq(r.daysToNextPay.next_pay, '2026-12-10');
});
done('platform');
