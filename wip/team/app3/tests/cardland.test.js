#!/usr/bin/env node
/* [qc-numbers confirming run 3, POLISH; M7, M12, M51] A card or loan payment moved off its day by a weekend or holiday
   says why, in the same words as a pay or a bill (screens/names.js landLabel): the engine's next payment carries its
   due day beside the day it lands, and the assistant's figures use both. Made-up Mako book, Card A paid on the 12th
   (Sat 12 Dec 2026, so it lands Mon 14 Dec), today 25 Nov 2026. */
'use strict';
const fs = require('fs'), path = require('path');
const L = require('../../engine/lookahead.js'), K = require('../src/ask3_core.js');
let bad = 0, n = 0;
const ck = (name, v, got) => { n++; if (v) console.log('PASS ' + name); else { bad++; console.log('FAIL ' + name + ': ' + got); } };
const book = JSON.parse(fs.readFileSync(path.join(__dirname, '../fixtures/mako_madeup_book.json'), 'utf8'));
const cardA = book.accounts.find(a => a.name === 'Card A'); cardA.payDay = 12;
const DAY = '2026-11-25';
const nx = L.lookahead(book, DAY).cards[cardA.id].next;
ck('the engine: Card A next lands 14 Dec, due 12 Dec', nx && nx.payment_date === '2026-12-14' && nx.due_date === '2026-12-12', JSON.stringify(nx));
const line = K.summary(book, DAY).text.split('\n').find(l => /^Card A \|/.test(l)) || '';
ck('the assistant is told why: on 14 Dec (12 Dec is a Saturday, so the working day after)', /next payment ¥54,000 on 14 Dec \(12 Dec is a Saturday, so the working day after\)/.test(line), line);
const lineB = K.summary(book, DAY).text.split('\n').find(l => /^Card B \|/.test(l)) || '';
ck('a card on its own day says only the day: Card B on 11 Dec', /next payment ¥23,000 on 11 Dec$/.test(lineB), lineB);
console.log(bad ? `cardland: ${bad} of ${n} FAILED` : `cardland: ALL PASS (${n})`);
process.exit(bad ? 1 : 0);
