#!/usr/bin/env node
/* A restore while the cloud copy is on (src/backup3.js restamp; app3/FOR_MAKO.md "Open: a restore while the cloud copy is
   on"), in node, two devices on the local fake vault (tests/fake_vault.js), the made-up Mako book.
   The problem: a restored copy carries older change times, so the three-way join with the newer cloud copy could keep the
   newer records and the restore would not stick, silently; and records added since the backup came back, since a side
   that lacks a record never changed it.
   The rule: a restore (and Put it back) gives every record it brings back a new `at` (later than any seen) and this
   device's `by`, in one step; records in the copy it replaces that the restored copy lacks are marked gone; the kept
   versions stay. Checked: without the restamp the restore does not stick (the case is real); with it, A restores an older
   backup and sends, B takes it and holds exactly the restored records; Put it back on A brings back what was there, and
   that reaches B too. */
'use strict';
globalThis.window = globalThis;
require('../../store/guard.js'); require('../../store/pack.js'); require('../../store/clock.js');
const Bk = require('../src/backup3.js');
const C = require('../src/cloud3.js');
const S = require('../../engine/sync.js');
const { makeVault } = require('./fake_vault.js');
const BOOK = require('../fixtures/mako_madeup_book.json');
let bad = 0, n = 0;
const ck = (name, ok, extra) => { n++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : ' ' + String(extra === undefined ? '' : extra).slice(0, 400))); if (!ok) bad++; };
const clone = x => JSON.parse(JSON.stringify(x));
const LISTS = ['accounts', 'schedules', 'events', 'checkins', 'people', 'places'];
/* what a person sees: the live records of each list, by id, without when or by whom */
const shown = c => S.canon(Object.assign(Object.fromEntries(LISTS.map(k => [k, (c[k] || []).filter(r => r && !r.gone).map(r => S.content(r))])),
  { home: S.content(c.home || {}), plan: S.content(c.plan || {}) }));

(async () => {
  /* ---- the restamp on its own ---- */
  {
    const by = 'dsk001', now = '2026-12-10T09:00:00.000+09:00';
    const over = clone(BOOK);
    over.events.push({ id: 'dsk001-zzzzzzzzzz-1', k: 'spend', acct: BOOK.accounts[0].id, date: '2026-12-09', a: 700, told: '2026-12-09T12:00:00.000+09:00', at: '2026-12-09T12:00:00.000+09:00', by: 'phn002' });
    over.schedules[0] = Object.assign({}, over.schedules[0], { name: 'Main job (later)', at: '2026-12-30T08:00:00.000+09:00', by: 'phn002' });   // a clock ahead of this one
    over.home.main = { v: { acct: BOOK.accounts[0].id }, at: '2026-12-08T08:00:00.000+09:00', by: 'phn002' };
    over.keptVersions = [{ id: 'kept:x1', of: 'x1', in: 'schedules', versions: [], ask: false, at: '2026-12-08T08:00:00.000+09:00', by: 'phn002' }];
    const restored = clone(BOOK);
    restored.home.main = { v: { acct: BOOK.accounts[1].id }, at: '2026-11-01T08:00:00.000+09:00', by: 'dsk001' };
    restored.events[0] = Object.assign({}, restored.events[0], { gone: '2026-11-02', goneBy: 'dsk001-aaaaaaaaaa-1', at: '2026-11-02T08:00:00.000+09:00', by: 'dsk001' });
    restored.keptVersions = [{ id: 'kept:x0', of: 'x0', in: 'schedules', versions: [], ask: false, at: '2026-11-01T08:00:00.000+09:00', by: 'dsk001' }];
    const before = JSON.stringify(restored), beforeOver = JSON.stringify(over);
    const out = Bk.restamp(restored, over, { now, by, day: '2026-12-10' });
    ck('the inputs are not changed', JSON.stringify(restored) === before && JSON.stringify(over) === beforeOver);
    const at = out.schedules[0].at;
    ck('the new `at` is later than any `at` seen, even a clock ahead of this one', Date.parse(at) > Date.parse('2026-12-30T08:00:00.000+09:00'), at);
    const all = LISTS.flatMap(k => out[k] || []);
    ck('every record brought back (and every one marked gone) carries the one new `at` and this device', all.length > 0 && all.every(r => r.at === at && r.by === by), JSON.stringify(all.filter(r => r.at !== at || r.by !== by)).slice(0, 200));
    ck('a record keeps its `told` (when it was first heard)', out.events.find(e => e.id === BOOK.events[1].id).told === BOOK.events[1].told);
    ck('the content brought back is the restored copy\'s', out.schedules[0].name === BOOK.schedules[0].name && LISTS.every(k => S.canon((restored[k] || []).map(S.content)) === S.canon((out[k] || []).filter(r => !(r.gone && !(restored[k] || []).some(x => x.id === r.id))).map(S.content))));
    ck('a record gone in the restored copy stays gone', !!out.events.find(e => e.id === BOOK.events[0].id).gone);
    const extra = out.events.find(e => e.id === 'dsk001-zzzzzzzzzz-1');
    ck('a record in the copy replaced but not in the restored one is marked gone, by this device', !!extra && extra.gone === '2026-12-10' && extra.at === at && extra.by === by && extra.a === 700);
    ck('a setting with its own change time is restamped and keeps the restored value', out.home.main.at === at && out.home.main.by === by && out.home.main.v.acct === BOOK.accounts[1].id);
    ck('the kept versions of both copies stay', (out.keptVersions || []).map(k => k.id).sort().join() === 'kept:x0,kept:x1');
    const first = Bk.restamp(BOOK, null, { now, by });
    ck('with nothing here, every record is still stamped', first.events.every(e => e.at === now && e.by === by) && first.events.length === BOOK.events.length && !first.events.some(e => e.gone));
    ck('the top of the copy keeps its version number', first.v === BOOK.v);
  }

  /* ---- two devices, the fake vault ---- */
  const vault = makeVault();
  const api = C.client({ fetch: vault.fetch, base: () => 'http://vault.test' });
  const pack = window.BurrowPack, keys = await C.keysFor(C.newCode());
  const sync = async d => { const r = await C.syncOnce({ api, pack, S, keys, device: d.dev, copy: d.copy }); if (!r.ok) throw new Error('sync ' + r.why); return { copy: r.copy, dev: r.device, r }; };
  let A = await sync({ copy: clone(BOOK), dev: {} });
  let Bd = await sync({ copy: null, dev: {} });
  const backup = clone(A.copy);   // A saves a backup file now
  // later, on both devices: A renames a schedule and logs a spend; B renames another schedule and logs a spend
  const s0 = BOOK.schedules[0].id, s1 = BOOK.schedules[1].id;
  Object.assign(A.copy.schedules.find(s => s.id === s0), { name: 'Main job (renamed later)', at: '2026-12-05T09:00:00.000+09:00', by: 'dsk001' });
  A.copy.events.push({ id: 'dsk001-bbbbbbbbbb-1', k: 'spend', acct: BOOK.accounts[0].id, date: '2026-12-05', a: 4300, told: '2026-12-05T09:00:00.000+09:00', at: '2026-12-05T09:00:00.000+09:00', by: 'dsk001' });
  A = await sync(A);
  Bd = await sync(Bd);
  Object.assign(Bd.copy.schedules.find(s => s.id === s1), { name: 'Side work (renamed later)', at: '2026-12-06T09:00:00.000+09:00', by: 'phn002' });
  Bd.copy.events.push({ id: 'phn002-cccccccccc-1', k: 'spend', acct: BOOK.accounts[0].id, date: '2026-12-06', a: 980, told: '2026-12-06T09:00:00.000+09:00', at: '2026-12-06T09:00:00.000+09:00', by: 'phn002' });
  Bd = await sync(Bd);
  A = await sync(A);
  ck('before the restore both devices hold the later copy', S.canon(A.copy) === S.canon(Bd.copy) && A.copy.events.length === BOOK.events.length + 2);
  const here = clone(A.copy);   // what keepCopy keeps before the restore

  // the case is real: a plain replace (today's restore) does not stick once joined with the cloud
  {
    const v2 = makeVault(), api2 = C.client({ fetch: v2.fetch, base: () => 'http://vault.test' });
    const s2 = async d => { const r = await C.syncOnce({ api: api2, pack, S, keys, device: d.dev, copy: d.copy }); return { copy: r.copy, dev: r.device }; };
    let a = await s2({ copy: clone(here), dev: {} }), b = await s2({ copy: null, dev: {} });
    a = await s2({ copy: clone(backup), dev: a.dev }); b = await s2(b);
    ck('without the restamp, B does not end up with the restored copy (records added later come back)', shown(b.copy) !== shown(backup));
  }

  // A restores the older backup: restamped against what is here and the copy last synced, one save, then sent
  const at0 = '2026-12-07T10:00:00.000+09:00';
  const restored = Bk.restamp(backup, A.copy, { now: at0, by: 'dsk001', day: '2026-12-07', also: [A.dev.base] });
  A = await sync({ copy: restored, dev: A.dev });
  ck('A sends the restored copy', A.r.pushed);
  ck('A holds exactly the restored records', shown(A.copy) === shown(backup));
  Bd = await sync(Bd);
  ck('B takes it and holds exactly the restored records', shown(Bd.copy) === shown(backup), shown(Bd.copy).slice(0, 300));
  ck('B shows the schedule names of the backup, not the later renames', Bd.copy.schedules.find(s => s.id === s0).name === BOOK.schedules[0].name && Bd.copy.schedules.find(s => s.id === s1).name === BOOK.schedules[1].name);
  ck('the spends logged after the backup are gone on B, not deleted (they can come back)', ['dsk001-bbbbbbbbbb-1', 'phn002-cccccccccc-1'].every(id => { const e = Bd.copy.events.find(x => x.id === id); return e && e.gone; }));
  ck('nothing is asked: the restore is one clear step', S.afterSync(Bd.copy).questions.length === 0, JSON.stringify(S.afterSync(Bd.copy).questions));

  // Put it back on A: the copy kept before the restore, through the same restamp; it reaches B too
  const back = Bk.restamp(here, A.copy, { now: '2026-12-07T10:05:00.000+09:00', by: 'dsk001', day: '2026-12-07', also: [A.dev.base] });
  A = await sync({ copy: back, dev: A.dev });
  ck('Put it back on A brings back what was there', A.r.pushed && shown(A.copy) === shown(here));
  Bd = await sync(Bd);
  ck('and B takes it: what was there before the restore', shown(Bd.copy) === shown(here), shown(Bd.copy).slice(0, 300));
  A = await sync(A);
  ck('both devices end on the same copy', S.canon(A.copy) === S.canon(Bd.copy));

  console.log(bad ? `restore3: ${bad} FAIL of ${n}` : `restore3: ALL PASS (${n})`);
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
