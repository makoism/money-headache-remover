#!/usr/bin/env node
/* [M48, M51, qc-numbers run 1 B1] Cents where the currency has them, yen whole, one way everywhere. The one formatter
   (screens/money.js) writes every amount of a currency with cents (USD, EUR, PHP) with its cents, "$300.00", never
   "$300" on one screen and "$300.00" on the next; yen and other whole currencies stay whole. Every way the app writes an
   amount goes through it: money.format, money.formatter, money.sumLine, status.js sentences, and app3's money3, fmt3
   and sum3 (src/money3.js). Typing keeps its own rule: toInput and parse never force ".00". Made-up amounts only. */
'use strict';
const path = require('path'), fs = require('fs'), vm = require('vm');
const SM = require('../../screens/money.js');
let bad = 0, n = 0;
const ck = (name, ok, extra) => { n++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : ' ' + String(extra === undefined ? '' : extra).slice(0, 300))); if (!ok) bad++; };
const eq = (name, got, want) => ck(name + ' (' + JSON.stringify(want) + ')', got === want, 'got ' + JSON.stringify(got));
const M = '−⁠';

/* 1. the formatter on its own */
eq('USD whole amount has its cents', SM.format(30000, 'USD'), '$300.00');
eq('USD zero', SM.format(0, 'USD'), '$0.00');
eq('USD five dollars', SM.format(500, 'USD'), '$5.00');
eq('USD cents kept', SM.format(30025, 'USD'), '$300.25');
eq('USD thousands commas', SM.format(123456700, 'USD'), '$1,234,567.00');
eq('USD negative', SM.format(-30000, 'USD'), M + '$300.00');
eq('USD no sign', SM.format(150000, 'USD', { sign: false }), '1,500.00');
eq('EUR whole', SM.format(2000, 'EUR'), '€20.00');
eq('PHP whole', SM.format(1500000, 'PHP'), '₱15,000.00');
eq('PHP negative', SM.format(-50, 'PHP'), M + '₱0.50');
eq('JPY stays whole', SM.format(300, 'JPY'), '¥300');
eq('JPY zero', SM.format(0, 'JPY'), '¥0');
eq('JPY thousands commas', SM.format(1234567, 'JPY'), '¥1,234,567');
eq('JPY negative', SM.format(-201400, 'JPY'), M + '¥201,400');
eq('JPY asked for cents stays whole', SM.format(300, 'JPY', { cents: true }), '¥300');
eq('BHD three decimals', SM.format(1000, 'BHD'), 'BHD 1.000');

/* 2. the screen and sentence formatter: cents whatever else is on the line */
eq('formatter USD with only whole amounts on the line', SM.formatter('USD', [30000, 500])(30000), '$300.00');
eq('formatter USD with no amounts given', SM.formatter('USD')(0), '$0.00');
eq('formatter JPY', SM.formatter('JPY', [300])(300), '¥300');
eq('sumLine USD, all whole', SM.sumLine([{ label: 'Checking today', amount: 150000 }, { label: 'Rent', amount: -90000 }], 60000, 'USD'), '$1,500.00 (Checking today) − $900.00 (Rent) = $600.00');
eq('sumLine JPY', SM.sumLine([{ label: 'Main bank today', amount: 312000 }, { label: 'Trip', amount: -100000 }], 212000, 'JPY'), '¥312,000 (Main bank today) − ¥100,000 (Trip) = ¥212,000');

/* 3. typing keeps its own rule: no ".00" forced into a box */
eq('toInput USD whole stays plain', SM.toInput(30000, 'USD'), '300');
eq('toInput USD cents', SM.toInput(30025, 'USD'), '300.25');
eq('toInput JPY', SM.toInput(300, 'JPY'), '300');
ck('parse "300" in USD is 30000', SM.parse('300', 'USD').minor === 30000);
ck('parse "$300.00" in USD is 30000 (what the screen writes reads back)', SM.parse(SM.format(30000, 'USD'), 'USD').minor === 30000);

/* 4. status.js sentences (Home's reasons and warnings) */
{
  const ST = require('../../screens/status.js');
  const src = fs.readFileSync(path.join(__dirname, '../../screens/status.js'), 'utf8');
  ck('status.js writes amounts only through money.formatter or money.format', !/toFixed|toLocaleString|Intl\.NumberFormat/.test(src));
  const ctx = { names: { a1: 'Checking' }, accounts: { a1: { currency: 'USD', bank: 10000 } } };
  eq('a warning in dollars has cents', ST.warningText({ code: 'below_minimum', account: 'a1', amount: 20000, day: '2026-12-15' }, ctx), 'Checking goes $200.00 below zero on 15 Dec');
  const yen = { names: { a1: 'Main bank' }, accounts: { a1: { currency: 'JPY', bank: 10000 } } };
  eq('a warning in yen stays whole', ST.warningText({ code: 'below_minimum', account: 'a1', amount: 20000, day: '2026-12-15' }, yen), 'Main bank goes ¥20,000 below zero on 15 Dec');
}

/* 5. app3's own short names (src/money3.js), run as the page runs them */
{
  const ctx = { console };
  ctx.globalThis = ctx; vm.createContext(ctx);
  for (const f of ['money.js', 'names.js', 'help.js', 'messages.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../../screens', f), 'utf8'), ctx, { filename: f });
  ctx.BurrowEngine = { dates: {} };
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/money3.js'), 'utf8') + '\n;globalThis.__m = { money3, fmt3, sum3, screen3, fig3 };', ctx, { filename: 'money3.js' });
  const A = ctx.__m;
  eq('money3 outside a screen, USD whole', A.money3(30000, 'USD'), '$300.00');
  eq('money3 outside a screen, JPY', A.money3(30000, 'JPY'), '¥30,000');
  eq('fmt3 for a sentence of whole dollars', A.fmt3('USD', [500])(500), '$5.00');
  eq('sum3 of whole dollars', A.sum3([{ label: 'Checking today', amount: 30000 }], 30000, 'USD'), '$300.00 (Checking today) = $300.00');
  const seen = [];
  A.screen3(() => { seen.push(A.money3(30000, 'USD'), A.money3(0, 'USD')); });
  ck('a screen of whole dollars draws every amount with cents', seen.length >= 2 && seen.slice(-2).join(' ') === '$300.00 $0.00', JSON.stringify(seen));
  const yen = [];
  A.screen3(() => { yen.push(A.money3(30000, 'JPY')); });
  ck('a yen screen draws once, whole', yen.length === 1 && yen[0] === '¥30,000', JSON.stringify(yen));
}

/* 6. no screen or assistant file writes an amount its own way (the one formatter is screens/money.js) */
{
  const dir = path.join(__dirname, '../src');
  const found = [];
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.js'))) {
    const s = fs.readFileSync(path.join(dir, f), 'utf8').split('\n');
    s.forEach((l, i) => {
      if (/toFixed\(|Intl\.NumberFormat|\.toLocaleString\((?!'en-GB', \{ day)/.test(l)) found.push(f + ':' + (i + 1));
      if (/['"`][$₱€]\$\{|['"`]¥\$\{/.test(l)) found.push(f + ':' + (i + 1) + ' (a sign written by hand)');
    });
  }
  ck('src/ writes no amount by hand (toFixed, toLocaleString, Intl, a sign before ${...})', !found.length, found.join(', '));
}

console.log(bad ? `cents3: ${bad} FAIL of ${n}` : `cents3: ALL PASS (${n})`);
process.exit(bad ? 1 : 0);
