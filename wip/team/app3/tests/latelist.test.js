#!/usr/bin/env node
/* [qc-assistant confirming run 6 POLISH, ruled a truth fault by coordinator 18; LESSONS 2, M7, M51] One late list that
   Home and the figures sent to the AI both read (screens/status.js lateList): on Sat 28 Nov 2026, made-up Mako book,
   Power (26 Nov, not seen) and Rent and Internet (27 Nov, may still go through) are all late and not ticked. Before:
   the AI was told only Power, while Home listed all three. */
'use strict';
const fs = require('fs'), path = require('path');
const L = require('../../engine/lookahead.js'), I = require('../../engine/ids.js');
const ST = require('../../screens/status.js'), K = require('../src/ask3_core.js');
let bad = 0, n = 0;
const ck = (name, v, got) => { n++; if (v) console.log('PASS ' + name); else { bad++; console.log('FAIL ' + name + ': ' + got); } };
const book = JSON.parse(fs.readFileSync(path.join(__dirname, '../fixtures/mako_madeup_book.json'), 'utf8'));
const DAY = '2026-11-28';
const r = L.lookahead(book, DAY);
const sch = id => (book.schedules || []).find(s => s.id === (I.occurrence(id) || {}).schedule) || {};
const isIncome = id => sch(id).kind === 'income';
const list = typeof ST.lateList === 'function' ? ST.lateList(r, isIncome) : [];
const names = list.filter(x => !x.income).map(x => sch(x.o.item).name);
ck('the one late list: Power, Rent, Internet', JSON.stringify(names) === '["Power","Rent","Internet"]', JSON.stringify(names));
const line = K.summary(book, DAY).text.split('\n').find(l => /^Late, not ticked off yet:/.test(l)) || '';
ck('the AI is told the same three, in the same order', line === 'Late, not ticked off yet: Power 26 Nov ¥7,400; Rent 27 Nov ¥72,000; Internet 27 Nov ¥5,200.', line);
ck('the AI is no longer told a shorter list under another heading', !/Due and not ticked off yet/.test(K.summary(book, DAY).text), '');
console.log(bad ? `latelist: ${bad} of ${n} FAILED` : `latelist: ALL PASS (${n})`);
process.exit(bad ? 1 : 0);
