#!/usr/bin/env node
/* One figure, one name (LESSONS lesson 2, screens/names.js): on Home, Receipts and Plan, every figure the name table
   knows sits under its own label from names.js, and no heading or row label uses another name for a money figure (a
   name the table lists as a choice but does not use, like "Left to spend"). Before and after a spend is logged.
   Made-up numbers only (?try=mako). */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const N = require('../../screens/names.js');
const DAY = '2026-11-25';
/* the table, as data the page can use: each key's labels (with its when-words) and figure paths, and the names it lists
   but does not use (any choice that is no key's label) */
function table() {
  const keys = [], used = new Set();
  for (const k of Object.keys(N.NAMES || {})) {
    const n = N.NAMES[k], labels = [n.label].concat(Object.values(n.when || {}));
    labels.forEach(l => used.add(l.toLowerCase()));
    keys.push({ key: k, labels, figures: n.figures });
  }
  const unused = [];
  for (const k of Object.keys(N.NAMES || {})) for (const c of N.NAMES[k].choices || []) if (!used.has(c.toLowerCase())) unused.push(c);
  return { keys, unused };
}
/* a heading or row label that names a money figure names it by its label; one that has none of the labels and uses
   a name the table lists but does not use is the finding ("Left to spend now" over safe to spend) */
const look = (p, tab, tb) => p.evaluate((tab, tb) => {
  const panel = document.querySelector(`[data-panel="${tab}"]`), out = { orphans: [], aliases: [], checked: 0 };
  const norm = s => s.replace(/\s+/g, ' ').trim().toLowerCase();
  const has = (text, l) => new RegExp('(^|[^a-z])' + l.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z])').test(norm(text));
  const keyOf = path => tb.keys.find(k => k.figures.includes(path.replace(/\.[^.*]*-[^.]*\./g, '.*.')));
  for (const f of panel.querySelectorAll('[data-figure]')) {
    const k = keyOf(f.dataset.figure); if (!k) continue;
    out.checked++;
    let ok = false;
    for (let e = f; e && e !== panel && !ok; e = e.parentElement) {
      if (e.matches('[data-card], section')) { ok = k.labels.some(l => has(e.innerText, l)); break; }
      ok = k.labels.some(l => has(e.innerText, l));
    }
    if (!ok) out.orphans.push(f.dataset.figure + ' in "' + norm((f.closest('[data-card], section') || f).textContent).slice(0, 80) + '"');
  }
  for (const h of panel.querySelectorAll('h1, h2, h3, label, li > span:first-child, .a3-rcrow > span:first-child, dt')) {
    if (tb.keys.some(k => k.labels.some(l => has(h.innerText, l)))) continue;   // named by its label ("Safe to spend until next pay on 10 Dec")
    for (const a of tb.unused) if (has(h.innerText, a)) out.aliases.push('"' + norm(h.textContent).slice(0, 60) + '" uses "' + a + '", not a name in screens/names.js');
  }
  return out;
}, tab, tb);
(async () => {
  const tb = table();
  ck('the name table is read', tb.keys.length > 10 && tb.unused.includes('Left to spend'), JSON.stringify(tb.unused));
  const { b, p, errs } = await T.open();
  await p.goto(T.URL0 + '?try=mako&today=' + DAY); await T.w(400);
  const all = async when => {
    for (const tab of ['home', 'receipts', 'plan']) {
      await p.tap(`[data-tab="${tab}"]`); await T.w(300);
      const r = await look(p, tab, tb);
      ck(`${when}, ${tab}: figures named by the table were found`, r.checked > 0, r.checked);
      ck(`${when}, ${tab}: each sits under its own label from names.js`, r.orphans.length === 0, r.orphans.join(' | '));
      ck(`${when}, ${tab}: no other name for a money figure`, r.aliases.length === 0, r.aliases.join(' | '));
    }
  };
  await all('at first');
  await p.tap('[data-tab="receipts"]'); await T.w(200);
  await p.tap('#rcAmt'); await p.keyboard.type('1200'); await p.tap('#rcSave'); await T.w(500);
  await all('after a spend');
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close(); T.done('e3_names');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
