#!/usr/bin/env node
// Runs every ask in scenarios/*.json through the reference model (lookahead_ref.js)
// and prints PASS or FAIL per ask with the expected figure and the model's figure.
// Usage: node run_scenarios.js [file.json ...] [--why]   (--why prints the model's sum on safe to spend asks)
// Any FAIL makes the run fail: the last line never says all passed when one did not.
'use strict';
const fs = require('fs');
const path = require('path');
const { lookahead, minor, fmt } = require('./lookahead_ref.js');

const dir = path.join(__dirname, '..', 'scenarios');
const args = process.argv.slice(2);
const showWhy = args.includes('--why');
const named = args.filter(a => !a.startsWith('--'));
const files = named.length ? named.map(f => path.isAbsolute(f) ? f : path.join(dir, path.basename(f)))
  : fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort().map(f => path.join(dir, f));

// Each answer as a short line, so expected and model can be compared as text.
function itemsLine(list, cur) { return list.map(i => `${i.item} ${i.lands} ${fmt(i.amount, cur)}`).sort().join('; ') || 'none'; }   // order does not matter

function expectedLine(ask, cur) {
  const e = ask.expected, mm = x => fmt(minor(x, cur), cur);
  switch (ask.question) {
    case 'days_to_next_pay': return e.days === null ? 'no next pay' : `${e.days} days to ${e.next_pay}`;
    case 'due_before_next_pay': return `${itemsLine(e.items.map(i => ({ ...i, amount: minor(i.amount, cur) })), cur)} | total ${mm(e.total)}`;
    case 'not_seen_yet': return `${itemsLine(e.items.map(i => ({ ...i, amount: minor(i.amount, cur) })), cur)} | in ${mm(e.money_in)} out ${mm(e.money_out)}`;
    case 'card_due': return `${mm(e.amount)} on ${e.payment_date}, ${e.statement}`;
    case 'total': return mm(e) + (ask.beside ? ' beside ' + Object.entries(ask.beside).map(([c, v]) => `${c} ${fmt(minor(v, c), c)}`).join(', ') : '');
    default: return mm(e);
  }
}

function modelLine(ask, r, cur) {
  switch (ask.question) {
    case 'bank_today': return fmt(r.accounts[ask.account].bank, cur);
    case 'safe_to_spend': return fmt(r.accounts[ask.account].headroom, cur);
    case 'days_to_next_pay': return r.daysToNextPay.days === null ? 'no next pay' : `${r.daysToNextPay.days} days to ${r.daysToNextPay.next_pay}`;
    case 'due_before_next_pay': return `${itemsLine(r.dueBeforeNextPay.items, cur)} | total ${fmt(r.dueBeforeNextPay.total, cur)}`;
    case 'not_seen_yet': return `${itemsLine(r.notSeenYet.items, cur)} | in ${fmt(r.notSeenYet.money_in, cur)} out ${fmt(r.notSeenYet.money_out, cur)}`;
    case 'card_due': { const n = r.cards[ask.account].next; return `${fmt(n.amount, cur)} on ${n.payment_date}, ${n.statement}`; }
    case 'total': {
      const b = Object.entries(r.total.beside);
      return fmt(r.total.amount, cur) + (ask.beside ? ' beside ' + b.map(([c, v]) => `${c} ${fmt(v, c)}`).join(', ') : '');
    }
    case 'not_explained': {
      const a = r.accounts[ask.account] || r.cards[ask.account];
      const f = (a.fillers || []).filter(x => (x.to || x.day) === ask.date);
      return fmt(f.reduce((t, x) => t + x.amount, 0), cur);
    }
    default: return 'unknown question';
  }
}

let pass = 0, fail = 0;
for (const fp of files) {
  const sc = JSON.parse(fs.readFileSync(fp, 'utf8'));
  console.log(`\n${path.basename(fp)}`);
  for (const ask of sc.asks) {
    const acc = sc.accounts.find(a => a.id === ask.account);
    const cur = acc ? acc.currency : sc.currency;
    const r = lookahead(sc, ask.date, { at: ask.at });
    const want = expectedLine(ask, cur), got = modelLine(ask, r, cur);
    const ok = want === got;
    if (ok) pass++; else fail++;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${ask.id} ${ask.date} ${ask.question}${ask.account ? ' ' + ask.account : ''}: expected ${want}; model ${got}`);
    if (showWhy && ask.question === 'safe_to_spend') console.log(`     model why: ${r.accounts[ask.account].why}`);
  }
}
console.log(`\n${pass} passed, ${fail} failed, ${pass + fail} asks`);
process.exit(fail ? 1 : 0);
