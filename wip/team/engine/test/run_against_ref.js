#!/usr/bin/env node
// Runs every ask in foundation_review/scenarios/*.json through the production engine (engine/lookahead.js) and
// compares each answer with the expected figure, in the same words as foundation_review/ref/run_scenarios.js, so the
// engine gives the same answers as the reference (which is the oracle; nothing here is copied from it).
// Each scenario is first turned into the saved shape version 3 (scenario_to_book.js, SCHEMA_V3 section 13).
// Then the realistic-ids variant [AJ1]: every short made-up id rewritten to the ordinary form, the same way the
// reference's check does it (foundation_review/realistic_ids.js), and every ask run again.
// Usage: node run_against_ref.js [file.json ...] [--why] [--fails] [--no-real]
// Any FAIL fails the run; the last line never says all passed when one did not (LESSONS lesson 2).
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { convert } = require('./scenario_to_book.js');
const { lookahead } = require('../lookahead.js');
const U = require('../units.js');

const FR = path.join(__dirname, '..', '..', 'foundation_review');
const args = process.argv.slice(2);
const showWhy = args.includes('--why'), onlyFails = args.includes('--fails'), noReal = args.includes('--no-real');
const named = args.filter(a => !a.startsWith('--'));
const minor = (x, c) => U.minorOf(x, c);
const fmt = (n, c) => U.fmt(n, c);

function itemsLine(list, cur) { return list.map(i => `${i.item} ${i.lands} ${fmt(i.amount, i.currency || cur)}${i.currency && i.currency !== cur ? ' ' + i.currency : ''}`).sort().join('; ') || 'none'; }
const nextPayLine = e => e.days === null ? 'no next pay' : e.late ? `late, expected since ${e.next_pay}` : `${e.days} days to ${e.next_pay}`;

function expectedLine(ask, cur) {
  const e = ask.expected, mm = x => fmt(minor(x, cur), cur);
  const mItems = list => list.map(i => ({ ...i, amount: minor(i.amount, i.currency || cur) }));
  const apart = list => (list && list.length ? ' | apart ' + itemsLine(mItems(list), cur) : '');
  switch (ask.question) {
    case 'days_to_next_pay': return nextPayLine(e);
    case 'due_before_next_pay': return `${itemsLine(mItems(e.items), cur)} | total ${mm(e.total)}`;
    case 'check_in_list': return `${itemsLine(mItems(e.items), cur)} | total ${mm(e.total)}${apart(e.apart)}`
      + (e.matched && e.matched.length ? ' | matched ' + itemsLine(mItems(e.matched), cur) : '');
    case 'later_on': return e.map(x => `${x.account} ${x.month} ${fmt(minor(x.balance, cur), cur)}`).sort().join('; ') || 'none';
    case 'may_still_post': return itemsLine(mItems(e.items), cur);
    case 'not_seen_yet': return `${itemsLine(mItems(e.items), cur)} | in ${mm(e.money_in)} out ${mm(e.money_out)}`;
    case 'card_due': return `${mm(e.amount)} on ${e.payment_date}, ${e.statement}`;
    case 'total': return mm(e) + (ask.beside ? ' beside ' + Object.entries(ask.beside).map(([c, v]) => `${c} ${fmt(minor(v, c), c)}`).join(', ') : '');
    case 'place': return `kept ${mm(e.kept)}, next due ${e.due}`;
    case 'warnings': return e.map(w => `${w.account} ${w.code}`).sort().join('; ') || 'none';
    case 'refused': return `refused [${e}]`;
    default: return mm(e);
  }
}
const refusedLine = err => { const codes = String(err.message).match(/\[[A-Z]+\d*\]/g); return codes ? 'refused ' + codes[codes.length - 1] : 'engine error: ' + err.message; };

function modelLine(ask, r, cur) {
  switch (ask.question) {
    case 'bank_today': return fmt(r.accounts[ask.account].bank, cur);
    case 'safe_to_spend': return fmt(r.accounts[ask.account].headroom, cur);
    case 'headline': return fmt(r.safeToSpend.headline, cur);
    case 'days_to_next_pay': return nextPayLine(r.daysToNextPay);
    case 'due_before_next_pay': return `${itemsLine(r.dueBeforeNextPay.items, cur)} | total ${fmt(r.dueBeforeNextPay.total, cur)}`;
    case 'check_in_list': return `${itemsLine(r.checkIn.toConfirm, cur)} | total ${fmt(r.checkIn.toConfirm.reduce((t, i) => t + i.amount, 0), cur)}`
      + ((r.checkIn.apart || []).length ? ' | apart ' + itemsLine(r.checkIn.apart, cur) : '')
      + ((r.checkIn.matched || []).length ? ' | matched ' + itemsLine(r.checkIn.matched, cur) : '');
    case 'later_on': return (r.laterOn || []).map(l => `${l.account} ${l.day.slice(0, 7)} ${l.balance == null ? '?' : fmt(l.balance, cur)}`).sort().join('; ') || 'none';
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
      const f = (a.fillers || []).filter(x => (x.to || x.day) === (ask.on || ask.date) && (!ask.from || x.from === ask.from));
      return fmt(f.reduce((t, x) => t + x.amount, 0), cur);
    }
    case 'total_after_cards': return fmt(r.total.afterCards, cur);
    case 'place': { const p = r.places[ask.place]; return `kept ${fmt(p.kept, cur)}, next due ${p.due}`; }
    case 'warnings': return r.warnings.map(w => `${w.account} ${w.code}`).sort().join('; ') || 'none';
    default: return 'unknown question';
  }
}

function runDir(dir, label) {
  const files = named.length ? named.map(f => path.join(dir, path.basename(f)))
    : fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort().map(f => path.join(dir, f));
  let pass = 0, fail = 0;
  for (const fp of files) {
    const sc = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const out = [];
    let conv;
    try { conv = convert(sc); } catch (err) { conv = { error: err }; }
    for (const ask of sc.asks) {
      const acc = sc.accounts.find(a => a.id === ask.account);
      const cur = acc ? acc.currency : (sc.home_curs || []).filter(h => h.from <= ask.date).reduce((c, h) => h.cur, sc.currency);
      const want = expectedLine(ask, cur);
      let got, r;
      try {
        if (conv.error) throw conv.error;
        r = lookahead(conv.book, ask.date, Object.assign({}, conv.opts, { at: ask.at }));
        got = ask.question === 'refused' ? 'not refused' : modelLine(ask, r, cur);
      } catch (err) { got = ask.question === 'refused' ? refusedLine(err) : 'engine error: ' + err.message + (process.env.STACK ? '\n' + err.stack : ''); }
      const ok = want === got;
      if (ok) pass++; else fail++;
      if (!ok || !onlyFails) out.push(`${ok ? 'PASS' : 'FAIL'} ${ask.id} ${ask.date} ${ask.question}${ask.account ? ' ' + ask.account : ''}: expected ${want}; engine ${got}`);
      if (showWhy && r && ask.question === 'safe_to_spend' && r.accounts[ask.account]) out.push(`     engine why: ${r.accounts[ask.account].why}`);
    }
    if (out.length) console.log(`\n${label ? label + ' ' : ''}${path.basename(fp)}\n` + out.join('\n'));
  }
  return { pass, fail };
}

// [AJ1] The scenario files rewritten with ordinary ids, by the reference's own rewriting (realistic_ids.js), into a
// temporary folder. Its functions are read in a sandbox so the reference's own runners are not started.
function realisticDir() {
  const src = fs.readFileSync(path.join(FR, 'realistic_ids.js'), 'utf8').replace(/^#!.*\n/, '');
  const sandbox = { require, module: { exports: {} }, exports: {}, __dirname: FR, console, process: { env: {}, argv: [] } };
  vm.createContext(sandbox);
  vm.runInContext(src.replace("if (require.main === module)", "if (false)") + '\n;globalThis.__rw = rewriteFile;', sandbox);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'engine-real-ids-'));
  let count = 0;
  for (const f of fs.readdirSync(path.join(FR, 'scenarios')).filter(f => f.endsWith('.json')))
    count += sandbox.__rw(path.join(FR, 'scenarios', f), path.join(tmp, f), false, false);
  return { tmp, count };
}

const a = runDir(path.join(FR, 'scenarios'));
console.log(`\nengine against the scenarios: ${a.pass} passed, ${a.fail} failed, ${a.pass + a.fail} asks`);
let b = { pass: 0, fail: 0 };
if (!noReal) {
  const { tmp, count } = realisticDir();
  try { b = runDir(tmp, 'realistic ids'); } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  console.log(`engine with realistic ids [AJ1] (${count} ids rewritten): ${b.pass} passed, ${b.fail} failed, ${b.pass + b.fail} asks`);
}
const allOk = !a.fail && !b.fail && a.pass > 0;
console.log(allOk ? 'ALL ASKS PASS' : 'NOT ALL ASKS PASS');
process.exit(allOk ? 0 : 1);
