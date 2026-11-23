#!/usr/bin/env node
/* The backup file's core (src/backup3.js) in node, with the made-up Mako book: a file saved and read back gives the same
   copy; a file locked with a code says it is locked, refuses a wrong code and opens with the right one; two files locked
   with one code use different salts; a copy saved by a newer version is refused; an old app backup is refused (BE); a
   damaged or foreign file is refused with a plain sentence; nothing in a locked file is readable. */
'use strict';
globalThis.window = globalThis;
require('../../store/guard.js'); require('../../store/pack.js');
const B = require('../src/backup3.js');
const BOOK = require('../fixtures/mako_madeup_book.json');
let bad = 0, n = 0;
const ck = (name, ok, extra) => { n++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : ' ' + String(extra === undefined ? '' : extra).slice(0, 300))); if (!ok) bad++; };
const file = (text, name) => new File([text], name || 'f.json', { type: 'application/json' });
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
(async () => {
  let m = await B.make(BOOK, { day: '2026-12-10' });
  ck('a backup file is made, named by the day', m.ok && m.name === 'burrow-backup-2026-12-10.json');
  const env = JSON.parse(m.text);
  ck('it is the pack envelope: fmt gz1 and v 3 outside, no names inside the text', env.fmt === 'gz1' && env.v === 3 && !m.text.includes(BOOK.schedules[0].name));
  let r = await B.read(file(m.text));
  ck('read back, it is the same copy', r.ok && same(r.copy, BOOK), JSON.stringify(r).slice(0, 200));

  m = await B.make(BOOK, { day: '2026-12-10', code: 'acorn tree 7' });
  const locked = JSON.parse(m.text);
  ck('a locked file is encrypted, with its own salt', m.ok && locked.enc === 'aes-gcm' && locked.kdf && locked.kdf.salt.length > 10 && locked.kdf.rounds === 150000);
  r = await B.read(file(m.text));
  ck('read without the code, it says it is locked', !r.ok && r.why === 'locked' && r.locked && /locked with a code/.test(r.words));
  r = await B.read(file(m.text), { code: 'acorn tree 8' });
  ck('a wrong code is refused', !r.ok && r.why === 'key' && r.locked);
  r = await B.read(file(m.text), { code: ' acorn tree 7 ' });
  ck('the right code opens it (spaces around it do not matter)', r.ok && same(r.copy, BOOK));
  const m2 = await B.make(BOOK, { code: 'acorn tree 7' });
  ck('two files locked with one code have different salts', JSON.parse(m2.text).kdf.salt !== locked.kdf.salt);
  r = await B.make(BOOK, { code: 'abc' });
  ck('a code shorter than 6 is refused before anything is saved', !r.ok && r.why === 'short');

  const newer = await B.make(Object.assign({}, BOOK, { v: 4 }));
  r = await B.read(file(newer.text));
  ck('a copy saved by a newer version is refused [D6]', !r.ok && r.why === 'newer' && /newer version/.test(r.words));
  r = await B.read(file(JSON.stringify({ rev: 1763600000000, cfg: { bankStart: 123456 }, steps: { a: [] }, once: {}, items: {} })));
  ck('an old app backup is refused: version one starts empty [BE]', !r.ok && r.why === 'old' && /old app/.test(r.words));
  r = await B.read(file('{"fmt":"gz1","v":3,"data":"AAAA"}'));
  ck('a damaged file is refused', !r.ok && r.why === 'damaged');
  r = await B.read(file('hello'));
  ck('a file that is not a backup is refused', !r.ok && r.why === 'unknown' && /not a backup/.test(r.words));
  r = await B.read(file(JSON.stringify(Object.assign({}, BOOK, { rev: 7 }))));
  ck('a plain JSON copy of the shape is read, without the cloud\'s revision', r.ok && r.copy.rev === undefined && same(r.copy.schedules, BOOK.schedules));
  r = await B.make(null);
  ck('nothing to back up is said', !r.ok && r.why === 'none');
  console.log(bad ? `backup3: ${bad} FAIL of ${n}` : `backup3: ALL PASS (${n})`);
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
