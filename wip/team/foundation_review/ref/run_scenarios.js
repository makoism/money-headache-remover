#!/usr/bin/env node
// Runs every ask in scenarios/*.json through the reference model (lookahead_ref.js)
// and prints PASS or FAIL per ask with the expected figure and the model's figure.
// Usage: node run_scenarios.js [file.json ...] [--why] [--model other_model.js]
//   --why    prints the model's sum on safe to spend asks
//   --model  runs the asks against another copy of the model (for example the one before a change)
// Any FAIL makes the run fail: the last line never says all passed when one did not.
// A model that throws on an ask is a FAIL for that ask, and the run goes on.
'use strict';
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'scenarios');
const args = process.argv.slice(2);
const showWhy = args.includes('--why');
const mi = args.indexOf('--model');
const modelPath = mi >= 0 ? path.resolve(args[mi + 1]) : './lookahead_ref.js';
const { lookahead, minor, fmt } = require(modelPath);
const named = args.filter((a, i) => !a.startsWith('--') && !(mi >= 0 && i === mi + 1));
const files = named.length ? named.map(f => path.isAbsolute(f) ? f : path.join(dir, path.basename(f)))
  : fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort().map(f => path.join(dir, f));

// Each answer as a short line, so expected and model can be compared as text.
// [S6] An item in another currency than the ask's (pay in dollars into a yen bank) is shown in its own currency.
function itemsLine(list, cur) { return list.map(i => `${i.item} ${i.lands} ${fmt(i.amount, i.currency || cur)}${i.currency && i.currency !== cur ? ' ' + i.currency : ''}`).sort().join('; ') || 'none'; }   // order does not matter
const nextPayLine = e => e.days === null ? 'no next pay' : e.late ? `late, expected since ${e.next_pay}` : `${e.days} days to ${e.next_pay}`;

function expectedLine(ask, cur) {
  const e = ask.expected, mm = x => fmt(minor(x, cur), cur);
  const mItems = list => list.map(i => ({ ...i, amount: minor(i.amount, i.currency || cur) }));
  const apart = list => (list && list.length ? ' | apart ' + itemsLine(mItems(list), cur) : '');   // [S6]
  switch (ask.question) {
    case 'days_to_next_pay': return nextPayLine(e);
    case 'due_before_next_pay': return `${itemsLine(mItems(e.items), cur)} | total ${mm(e.total)}`;
    case 'check_in_list': return `${itemsLine(mItems(e.items), cur)} | total ${mm(e.total)}${apart(e.apart)}`
      + (e.matched && e.matched.length ? ' | matched ' + itemsLine(mItems(e.matched), cur) : '');   // [S6] pay in another currency apart; [U2] already matched by an import
    case 'later_on': return e.map(x => `${x.account} ${x.month} ${fmt(minor(x.balance, cur), cur)}`).sort().join('; ') || 'none';   // [B11, S4]
    case 'may_still_post': return itemsLine(mItems(e.items), cur);
    case 'not_seen_yet': return `${itemsLine(mItems(e.items), cur)} | in ${mm(e.money_in)} out ${mm(e.money_out)}`;
    case 'card_due': return `${mm(e.amount)} on ${e.payment_date}, ${e.statement}`;
    case 'total': return mm(e) + (ask.beside ? ' beside ' + Object.entries(ask.beside).map(([c, v]) => `${c} ${fmt(minor(v, c), c)}`).join(', ') : '');
    case 'place': return `kept ${mm(e.kept)}, next due ${e.due}`;
    case 'warnings': return e.map(w => `${w.account} ${w.code}`).sort().join('; ') || 'none';
    default: return mm(e);
  }
}

function modelLine(ask, r, cur) {
  switch (ask.question) {
    case 'bank_today': return fmt(r.accounts[ask.account].bank, cur);
    case 'safe_to_spend': return fmt(r.accounts[ask.account].headroom, cur);
    case 'headline': return fmt(r.safeToSpend.headline, cur);
    case 'days_to_next_pay': return nextPayLine(r.daysToNextPay);
    case 'due_before_next_pay': return `${itemsLine(r.dueBeforeNextPay.items, cur)} | total ${fmt(r.dueBeforeNextPay.total, cur)}`;
    case 'check_in_list': return `${itemsLine(r.checkIn.toConfirm, cur)} | total ${fmt(r.checkIn.toConfirm.reduce((t, i) => t + i.amount, 0), cur)}`
      + ((r.checkIn.apart || []).length ? ' | apart ' + itemsLine(r.checkIn.apart, cur) : '')   // [S6]
      + ((r.checkIn.matched || []).length ? ' | matched ' + itemsLine(r.checkIn.matched, cur) : '');   // [U2]
    case 'later_on': return (r.laterOn || []).map(l => `${l.account} ${l.day.slice(0, 7)} ${l.balance == null ? '?' : fmt(l.balance, cur)}`).sort().join('; ') || 'none';   // [B11, S4]
    case 'may_still_post': return itemsLine(r.mayStillPost, cur);
    case 'not_seen_yet': return `${itemsLine(r.notSeenYet.items, cur)} | in ${fmt(r.notSeenYet.money_in, cur)} out ${fmt(r.notSeenYet.money_out, cur)}`;
    case 'card_due': { const n = r.cards[ask.account].next; return `${fmt(n.amount, cur)} on ${n.payment_date}, ${n.statement}`; }
    case 'owed_now': return fmt((r.cards[ask.account] || r.owed[ask.account]).owedNow, cur);
    case 'total': {
      const b = Object.entries(r.total.beside);
      return fmt(r.total.amount, cur) + (ask.beside ? ' beside ' + b.map(([c, v]) => `${c} ${fmt(v, c)}`).join(', ') : '');
    }
    case 'not_explained': {
      const a = r.accounts[ask.account] || r.cards[ask.account];
      // `on`: the check's day, when the ask is made later (an import read after the check) [O1]; else the ask's date.
      const f = (a.fillers || []).filter(x => (x.to || x.day) === (ask.on || ask.date) && (!ask.from || x.from === ask.from));
      return fmt(f.reduce((t, x) => t + x.amount, 0), cur);
    }
    case 'total_after_cards': return fmt(r.total.afterCards, cur);   // [O5] total less what the cards owe
    case 'place': { const p = r.places[ask.place]; return `kept ${fmt(p.kept, cur)}, next due ${p.due}`; }
    case 'warnings': return r.warnings.map(w => `${w.account} ${w.code}`).sort().join('; ') || 'none';
    default: return 'unknown question';
  }
}

let pass = 0, fail = 0;
for (const fp of files) {
  const sc = JSON.parse(fs.readFileSync(fp, 'utf8'));
  console.log(`\n${path.basename(fp)}`);
  for (const ask of sc.asks) {
    const acc = sc.accounts.find(a => a.id === ask.account);
    // [O6] An ask about no one account is in the home currency in force on its date.
    const cur = acc ? acc.currency : (sc.home_curs || []).filter(h => h.from <= ask.date).reduce((c, h) => h.cur, sc.currency);
    const want = expectedLine(ask, cur);
    let got, r;
    try { r = lookahead(sc, ask.date, { at: ask.at }); got = modelLine(ask, r, cur); } catch (err) { got = 'model error: ' + err.message; }
    const ok = want === got;
    if (ok) pass++; else fail++;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${ask.id} ${ask.date} ${ask.question}${ask.account ? ' ' + ask.account : ''}: expected ${want}; model ${got}`);
    if (showWhy && r && ask.question === 'safe_to_spend') console.log(`     model why: ${r.accounts[ask.account].why}`);
  }
}
console.log(`\n${pass} passed, ${fail} failed, ${pass + fail} asks`);
process.exit(fail ? 1 : 0);
