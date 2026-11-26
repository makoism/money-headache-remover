#!/usr/bin/env node
/* [qc-foundation on the AI-first candidate, F1; M36, M37, M45] A bank figure given to the assistant works like Check
   your bank: what the app expected to have gone out of (or into) that account by today is listed on the change card,
   ticked, and asked about first; on OK the check is written with them ticked. Before: the figure was written with
   nothing listed, the engine read rent as part of the gap and kept it expected, and a tick the next day could only
   land after the figure, so Main read 132,000 while the bank showed 204,000. Made-up yen, set up Tue 24 Nov 2026:
   Main 286,000, pay 240,000 on the 10th, Rent 72,000 on the 27th, Phone 4,800 on the 20th (already out), Free to spend
   60,000. Rent really left on 27 Nov and about 10,000 was spent: the bank shows 204,000 on 30 Nov.
   1. "my bank shows 204,000": the card asks first and names Rent; on OK Main is 204,000, Rent is no longer expected,
      Free to spend left is 50,000; the next day nothing is left to tick and Main stays 204,000.
   2. The same, but the person says rent has not gone yet (not: [B1]): Rent stays expected, Main 204,000.
   3. With nothing expected on the account (figure on 25 Nov), the figure goes in as before, with no list. */
'use strict';
const path = require('path');
const R = path.join(__dirname, '../../');
const L = require(R + 'engine/lookahead.js'), I = require(R + 'engine/ids.js');
const A3 = require('../src/act3.js'), K = require('../src/chat3_core.js'), FAKE = require('./fake_ai.js');
let bad = 0, n = 0;
const ck = (name, v, got) => { n++; if (v) console.log('PASS ' + name); else { bad++; console.log('FAIL ' + name + ': ' + got); } };
function page(day) {
  const h = { day, book: null }, NID = I.idMaker('dev1ab', Math.random); let TK = 0;
  const TOLD = () => { TK++; return h.day + 'T12:' + String(Math.floor(TK / 60) % 60).padStart(2, '0') + ':' + String(TK % 60).padStart(2, '0') + '.000+09:00'; };
  const door = A3.make({ book: () => h.book, put: async x => { h.book = x; return true; }, told: TOLD, newId: NID, today: () => h.day, check: x => L.lookahead(x, h.day) });
  h.deps = f => ({ send: f.send, today: () => h.day, told: TOLD, newId: NID, book: () => h.book, mode: () => (h.book ? 'kept' : 'none'), anon: 'device0123456789', invite: 'acorn', door, start: async b => { h.book = b; return true; }, discard: async () => { h.book = null; return true; } });
  h.state = K.fresh(); return h;
}
const say = (words, calls) => ({ words, calls });
async function talk(h, msg, calls, opts) {
  const f = FAKE.make([say('', calls), b => say('ok: ' + FAKE.results(b).map(r => r.text).join(' | '))]);
  const r = await K.turn(h.state, msg, h.deps(f)); h.state = r.state;
  const cards = r.shown.filter(t => t.who === 'card' && t.card);
  if (!(opts && opts.hold)) for (const t of cards) if (t.card.status === 'ask') { const c = await K.confirm(h.state, t.id, h.deps(FAKE.make([]))); h.state = c.state; }
  return cards.map(t => t.card);
}
async function setup(h) {
  const d = { country: 'JP', currency: 'JPY', banks: [{ name: 'Main', amount: 286000 }], pays: [{ name: 'Pay', amount: 240000, every: 'month', day: 10, shift: 'before', afterTax: true }],
    cards: [], bills: [{ name: 'Rent', amount: 72000, day: 27 }, { name: 'Phone', amount: 4800, day: 20 }], asked: [{ name: 'Phone', out: true }], free: 60000, min: null };
  await talk(h, 'setup', Object.keys(d).map(k => ({ name: 'draft_set', input: { section: k, value: d[k] } })));
  await talk(h, 'fill', [{ name: 'fill_book', input: {} }]);
}
const main = h => { const x = L.lookahead(h.book, h.day); return x.accounts[h.book.accounts.find(a => a.name === 'Main').id].bank; };
const rentDue = h => (L.lookahead(h.book, h.day).checkIn.toConfirm || []).some(o => o.amount === 72000);
const freeLeft = h => { const p = L.lookahead(h.book, h.day).period; return p && p.free && p.free.left; };
(async () => {
  {
    const h = page('2026-11-24'); await setup(h);
    ck('set up: Main 286,000', main(h) === 286000, main(h));
    h.day = '2026-11-30';
    const cards = await talk(h, 'my bank shows 204,000', [{ name: 'change', input: { steps: [{ do: 'bank_figure', account: 'A1', amount: 204000 }] } }]);
    const c = cards[0] || {};
    ck('1. the figure card asks first', c.status === 'ask' || c.ask, JSON.stringify(c.status) + ' ' + c.ask);
    ck('1. the card names Rent of 27 Nov, 72,000, as gone out', /Rent/.test((c.lines || []).join(' ')) && /72,000/.test((c.lines || []).join(' ')), (c.lines || []).join(' | '));
    ck('1. after OK: Main 204,000', main(h) === 204000, main(h));
    ck('1. after OK: Rent is no longer expected', !rentDue(h), JSON.stringify(L.lookahead(h.book, h.day).checkIn.toConfirm));
    ck('1. after OK: Free to spend left 50,000 (60,000 less the 10,000 spent)', freeLeft(h) === 50000, freeLeft(h));
    h.day = '2026-12-01';
    ck('1. next day: Main still 204,000', main(h) === 204000, main(h));
  }
  {
    const h = page('2026-11-24'); await setup(h);
    h.day = '2026-11-30';
    await talk(h, 'my bank shows 204,000, rent has not gone yet', [{ name: 'change', input: { steps: [{ do: 'bank_figure', account: 'A1', amount: 204000, not: ['B1'] }] } }]);
    ck('2. Main 204,000', main(h) === 204000, main(h));
    ck('2. Rent is still expected', rentDue(h), JSON.stringify(L.lookahead(h.book, h.day).checkIn.toConfirm));
  }
  {
    const h = page('2026-11-24'); await setup(h);
    h.day = '2026-11-25';
    const cards = await talk(h, 'my bank shows 285,000', [{ name: 'change', input: { steps: [{ do: 'bank_figure', account: 'A1', amount: 285000 }] } }]);
    const c = cards[0] || {};
    ck('3. nothing expected: the figure goes in with no list', main(h) === 285000 && !/gone out|came in/.test((c.lines || []).join(' ')), main(h) + ' ' + (c.lines || []).join(' | '));
  }
  console.log(bad ? `chatfig: ${bad} of ${n} FAILED` : `chatfig: ALL PASS (${n})`);
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
