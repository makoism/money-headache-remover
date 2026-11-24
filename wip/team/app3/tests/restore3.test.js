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
    over.schedules[0] = Object.assign({}, over.schedules[0], { name: 'Main job (later)', at: '2026-12-10T20:00:00.000+09:00', by: 'phn002' });   // a clock some hours ahead of this one
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
    ck('the new `at` is later than any `at` seen, even a clock some hours ahead of this one', Date.parse(at) > Date.parse('2026-12-10T20:00:00.000+09:00'), at);
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

  /* ---- a restored copy missing a whole section, and settings with no change time ---- */
  {
    const now = '2026-12-10T09:00:00.000+09:00';
    const over = clone(BOOK);
    over.plan = { budgets: [{ id: 'b1', name: 'Food', a: 30000, at: '2026-12-01T09:00:00.000+09:00', by: 'phn002' }], shares: [], goals: { list: [{ id: 'g1', a: 5, at: '2026-12-01T09:00:00.000+09:00' }] } };
    over.home.country = { v: 'US' };
    const restored = clone(BOOK); delete restored.plan; delete restored.checkins;
    over.checkins = [{ id: 'c1', settled: [], at: '2026-12-01T09:00:00.000+09:00' }];
    const out = Bk.restamp(restored, over, { now, by: 'dsk001', day: '2026-12-10' });
    const at = out.accounts[0].at;
    ck('a section the restored copy lacks: its records here are marked gone, at any depth', out.plan && out.plan.budgets[0].gone && out.plan.budgets[0].at === at && out.plan.goals.list[0].gone && out.checkins[0].gone, JSON.stringify(out.plan) + JSON.stringify(out.checkins));
    ck('a setting with no change time that the restore sets is stamped too ({ v } gets `at` and `by`)', out.home.country.v === 'JP' && out.home.country.at === at && out.home.country.by === 'dsk001' && out.home.mode.at === at, JSON.stringify(out.home));
    ck('a plain list with no ids (the currencies) is left as it is: the one known limit', S.canon(out.home.curs) === S.canon(BOOK.home.curs));
  }

  /* ---- a copy from a clock far ahead never moves this device's clock [M4, AI1: store/clock.js holdArriving] ---- */
  const NOW = '2026-11-24T10:00:00.000+09:00', DAYMS = 86400000, notAhead = (c, now) => { const t = window.BurrowClock.newestAt(c); return !t || Date.parse(t) <= Date.parse(now) + DAYMS; };
  {
    const restored = { v: 3, events: [{ id: 'e1', amt: 5, at: '2027-11-24T10:00:00.000+09:00', told: '2027-11-24T10:00:00.000+09:00', by: 'x' }, { id: 'e2', amt: 7, at: '2026-01-01T00:00:00.000+09:00', by: 'x' }] };
    const over = { v: 3, events: [{ id: 'e3', amt: 9, at: '2026-11-20T00:00:00.000+09:00', by: 'a' }] };
    const out = Bk.restamp(restored, over, { by: 'a', now: NOW, day: '2026-11-24' });
    ck('a backup with a record a year ahead, restored today, stamps nothing in 2027', out.events.every(e => !String(e.at).startsWith('2027') && !e.held && Date.parse(e.at) <= Date.parse(NOW) + DAYMS), JSON.stringify(out));
    ck('its `told` is kept as written (the figures read the order of `told`)', out.events.find(e => e.id === 'e1').told === '2027-11-24T10:00:00.000+09:00');
    const ahead = Bk.restamp(restored, { v: 3, events: [{ id: 'e3', at: '2028-01-01T00:00:00.000+09:00' }] }, { by: 'a', now: NOW });
    ck('nor does a copy here that already holds a time far ahead', !/202[78]-/.test(JSON.stringify(ahead.events.map(e => e.at))), JSON.stringify(ahead.events));
  }
  {
    const v = makeVault(), api0 = C.client({ fetch: v.fetch, base: () => 'http://vault.test' }), pk = window.BurrowPack, k0 = await C.keysFor(C.newCode());
    const far = clone(BOOK); far.events[0] = Object.assign({}, far.events[0], { at: '2027-11-24T10:00:00.000+09:00', by: 'phn002' });
    let r = await C.syncOnce({ api: api0, pack: pk, S, keys: k0, device: {}, copy: far, now: '2027-11-24T10:00:00.000+09:00' });   // B, a clock a year ahead, sends
    r = await C.syncOnce({ api: api0, pack: pk, S, keys: k0, device: {}, copy: null, now: NOW });
    ck('the cloud pull holds a record from a clock a year ahead: nothing on this device is ahead of its own now', r.ok && notAhead(r.copy, NOW) && !!r.copy.events[0].held, JSON.stringify(r.copy.events[0]));
    const puts = v.log.filter(x => x.method === 'PUT').length;
    const again = await C.syncOnce({ api: api0, pack: pk, S, keys: k0, device: r.device, copy: r.copy, now: '2026-11-24T10:01:00.000+09:00' });
    ck('pulled again, it is held the same way: nothing changed, nothing sent', again.ok && !again.pushed && v.log.filter(x => x.method === 'PUT').length === puts && S.canon(again.copy) === S.canon(r.copy));
    const clk = window.BurrowClock.makeClock(); clk.see(again.copy);
    ck('the next own write on this device is stamped today, not next year', clk.stamp(NOW).startsWith('2026-11-24'));
    const vs = await C.fetchVersions({ api: api0, keys: k0 });
    const g = vs.ok && vs.versions.length ? await C.fetchRev({ api: api0, pack: pk, keys: k0, rev: vs.versions[0].rev, now: NOW }) : { ok: false };
    const cur = await C.fetchRev({ api: api0, pack: pk, keys: k0, rev: v.rows.get(k0.id).rev, now: NOW });
    ck('a cloud version read back is held the same way', cur.ok && notAhead(cur.copy, NOW) && (!g.ok || notAhead(g.copy, NOW)), JSON.stringify(cur).slice(0, 200));
  }

  /* ---- two devices, the fake vault ---- */
  const vault = makeVault();
  const api = C.client({ fetch: vault.fetch, base: () => 'http://vault.test' });
  const pack = window.BurrowPack, keys = await C.keysFor(C.newCode());
  const sync = async d => { const r = await C.syncOnce({ api, pack, S, keys, device: d.dev, copy: d.copy, now: '2026-12-07T12:00:00.000+09:00' }); if (!r.ok) throw new Error('sync ' + r.why); return { copy: r.copy, dev: r.device, r }; };
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
    const s2 = async d => { const r = await C.syncOnce({ api: api2, pack, S, keys, device: d.dev, copy: d.copy, now: '2026-12-07T12:00:00.000+09:00' }); return { copy: r.copy, dev: r.device }; };
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
  ck('both devices end on the same copy', S.canon(A.copy) === S.canon(Bd.copy), (() => { const d = []; for (const k of Object.keys(A.copy)) if (S.canon(A.copy[k]) !== S.canon(Bd.copy[k])) d.push(k + ' ' + JSON.stringify((A.copy[k] || []).filter((r, i) => S.canon(r) !== S.canon((Bd.copy[k] || [])[i])).slice(0, 2)) + ' VS ' + JSON.stringify((Bd.copy[k] || []).filter((r, i) => S.canon(r) !== S.canon((A.copy[k] || [])[i])).slice(0, 2))); return d.join(' / '); })());

  // B changes a record and adds one before A has seen them; A restores and sends: B's change is asked, both kept; B's new record stays
  Object.assign(Bd.copy.schedules.find(s => s.id === s1), { name: 'Side work (B, unseen)', at: '2026-12-07T11:00:00.000+09:00', by: 'phn002' });
  Bd.copy.events.push({ id: 'phn002-dddddddddd-1', k: 'spend', acct: BOOK.accounts[0].id, date: '2026-12-07', a: 120, told: '2026-12-07T11:00:00.000+09:00', at: '2026-12-07T11:00:00.000+09:00', by: 'phn002' });
  Bd = await sync(Bd);
  A = await sync({ copy: Bk.restamp(backup, A.copy, { now: '2026-12-07T11:05:00.000+09:00', by: 'dsk001', day: '2026-12-07', also: [A.dev.base] }), dev: A.dev });
  const k1 = (A.copy.keptVersions || []).find(k => k.of === s1);
  ck('a change B made that A had not seen is asked, with both versions kept', !!k1 && k1.ask && k1.versions.some(v => v.name === 'Side work (B, unseen)') && A.copy.schedules.find(s => s.id === s1).name === BOOK.schedules[1].name, JSON.stringify(k1));
  ck('a record B added that A had not seen stays', !!A.copy.events.find(e => e.id === 'phn002-dddddddddd-1' && !e.gone));

  // the server's earlier versions (?versions=1), and one of them restored (?rev=N) through the same restamp
  const vs = await C.fetchVersions({ api, keys });
  ck('the earlier versions are listed, newest first, each with its revision and time', vs.ok && vs.versions.length >= 5 && vs.versions.every((v, i) => typeof v.rev === 'number' && typeof v.updated === 'number' && (i === 0 || v.rev < vs.versions[i - 1].rev)), JSON.stringify(vs).slice(0, 300));
  const first = vs.versions[vs.versions.length - 1];
  const got = await C.fetchRev({ api, pack, keys, rev: first.rev });
  ck('the oldest one reads back as the first copy sent', got.ok && shown(got.copy) === shown(backup) && got.copy.rev === undefined, JSON.stringify(got).slice(0, 200));
  ck('a revision the server does not keep is said, not read', (await C.fetchRev({ api, pack, keys, rev: 999 })).why === 'gone');
  A = await sync({ copy: Bk.restamp(got.copy, A.copy, { now: '2026-12-07T11:10:00.000+09:00', by: 'dsk001', day: '2026-12-07', also: [A.dev.base] }), dev: A.dev });
  Bd = await sync(Bd);
  ck('restored from the server\'s earlier version, B holds exactly it', shown(Bd.copy) === shown(got.copy), shown(Bd.copy).slice(0, 200));
  const putsNow = vault.log.filter(x => x.method === 'PUT').length;
  ck('listing and reading versions sent nothing', vault.log.filter(x => x.method === 'GET' && /versions=1|rev=/.test(x.query)).length === 3 && putsNow > 0);

  /* ---- a restore holds: nothing added after the backup comes back with the next send and take (qc-foundation, restore
     confirm, finding 1). A setting, a plan item, an account and a money event are each added after the backup, on this
     device and on the other one. In the join a side that lacks an item never changed it, so the restore has to write
     each of them marked gone; a setting the backup lacks was left out of what was saved, and came back. ---- */
  {
    const v3 = makeVault(), api3 = C.client({ fetch: v3.fetch, base: () => 'http://vault.test' }), k3 = await C.keysFor(C.newCode());
    const s3 = async d => { const r = await C.syncOnce({ api: api3, pack, S, keys: k3, device: d.dev, copy: d.copy, now: '2026-12-07T12:00:00.000+09:00' }); if (!r.ok) throw new Error('sync ' + r.why); return { copy: r.copy, dev: r.device, r }; };
    /* what a person has: every record and every setting not marked gone, at any depth, without when or by whom */
    const live = x => (Array.isArray(x) ? x.filter(r => !(r && r.gone)).map(live)
      : x && typeof x === 'object' ? Object.fromEntries(Object.entries(x).filter(([k, e]) => !(e && e.gone) && !['at', 'by', 'told', 'held', 'keptVersions', 'rev'].includes(k)).map(([k, e]) => [k, live(e)]).filter(([, e]) => !(e && typeof e === 'object' && !Array.isArray(e) && !Object.keys(e).length)))
        : x);
    const has = c => S.canon(live(c));
    const first = clone(BOOK);
    first.imports = { cats: { 'k:old shop': { v: 'food', src: 'person', at: '2026-11-20T09:00:00.000+09:00', by: 'dsk001' } } };
    let A3 = await s3({ copy: first, dev: {} }), B3 = await s3({ copy: null, dev: {} });
    const bk = clone(A3.copy);   // the backup, made now
    const plain = clone(BOOK);   // and one from before any lesson, plan limit or shared screen choice
    const acct = BOOK.accounts[0].id, t = (d, h) => `2026-12-0${d}T${h}:00:00.000+09:00`;
    const addAll = (c, by, d, tag) => {
      c.imports = c.imports || {}; c.imports.cats = Object.assign({}, c.imports.cats, { ['k:shop ' + tag]: { v: 'transport', src: 'person', card: BOOK.accounts[1].id, at: t(d, '09'), by } });
      c.plan = Object.assign({}, c.plan); c.plan.limits = Object.assign({}, c.plan.limits, { ['ceiling' + tag]: { v: { a: 50000, cur: 'JPY' }, at: t(d, '09'), by } });
      c.ui = Object.assign({}, c.ui, { ['show' + tag]: { v: 'cards', at: t(d, '09'), by } });
      c.plan.budgets = (c.plan.budgets || []).concat([{ id: by + '-budget' + tag + '0-1', name: 'Food ' + tag, place: 'free', cur: 'JPY', per: 'month', from: '2026-12-01', steps: [{ from: '2026-12-01', amount: 30000 }], told: t(d, '09'), at: t(d, '09'), by }]);
      c.accounts.push({ id: by + '-acct' + tag + '00000-1', name: 'Wallet ' + tag, type: 'cash', cur: 'JPY', owner: null, told: t(d, '09'), at: t(d, '09'), by });
      c.events.push({ id: by + '-event' + tag + '0000-1', k: 'spend', acct, date: '2026-12-0' + d, a: 1200, told: t(d, '09'), at: t(d, '09'), by });
    };
    addAll(A3.copy, 'dsk001', 3, 'a'); A3 = await s3(A3); B3 = await s3(B3);
    addAll(B3.copy, 'phn002', 4, 'b'); B3 = await s3(B3); A3 = await s3(A3);
    const added = c => ['a', 'b'].map(g => [!!(c.imports.cats['k:shop ' + g] && !c.imports.cats['k:shop ' + g].gone), !!(c.plan.limits['ceiling' + g] && !c.plan.limits['ceiling' + g].gone), !!(c.ui['show' + g] && !c.ui['show' + g].gone),
      c.plan.budgets.some(r => r.name === 'Food ' + g && !r.gone), c.accounts.some(r => r.name === 'Wallet ' + g && !r.gone), c.events.some(r => /-event/.test(r.id) && r.by !== undefined && r.id.includes('event' + g) && !r.gone)].join());
    ck('before the restore both devices hold everything added after the backup', S.canon(A3.copy) === S.canon(B3.copy) && added(A3.copy).join() === Array(12).fill(true).join(), added(A3.copy).join(' / '));
    for (const [what, file] of [['the backup', bk], ['a backup from before any lesson, plan limit or screen choice', plain]]) {
      const before = clone(A3.copy);
      const out = Bk.restamp(file, A3.copy, { now: '2026-12-07T10:00:00.000+09:00', by: 'dsk001', day: '2026-12-07', also: [A3.dev.base] });
      ck(what + ' restored: this device holds it and nothing more', has(out) === has(file), has(out).slice(0, 300));
      const g = ((out.imports || {}).cats || {})['k:shop a'];
      ck(what + ': a lesson added after it is kept, marked gone, with the new change time and this device', !!g && g.gone === '2026-12-07' && g.v === 'transport' && g.by === 'dsk001' && g.at === out.accounts[0].at, JSON.stringify(g));
      A3 = await s3({ copy: out, dev: A3.dev });
      ck(what + ': after the next send this device still holds it and nothing more', A3.r.pushed && has(A3.copy) === has(file), has(A3.copy).slice(0, 300));
      B3 = await s3(B3);
      ck(what + ': the other device takes it and holds it and nothing more', has(B3.copy) === has(file), added(B3.copy).join(' / '));
      A3 = await s3(A3); B3 = await s3(B3); A3 = await s3(A3);
      ck(what + ': after one more send and take on each, both still hold it and nothing more', has(A3.copy) === has(file) && has(B3.copy) === has(file) && S.canon(A3.copy) === S.canon(B3.copy), added(A3.copy).join(' / ') + ' // ' + added(B3.copy).join(' / '));
      ck(what + ': a setting, a plan item, an account and a money event added after it, on either device: none is back', added(A3.copy).concat(added(B3.copy)).join() === Array(24).fill(false).join(), added(A3.copy).join(' / '));
      ck(what + ': nothing is asked', S.afterSync(B3.copy).questions.length === 0 && !(B3.copy.keptVersions || []).some(k => k.ask));
      // Put it back: everything added after the backup is here again, on both
      A3 = await s3({ copy: Bk.restamp(before, A3.copy, { now: '2026-12-07T10:30:00.000+09:00', by: 'dsk001', day: '2026-12-07', also: [A3.dev.base] }), dev: A3.dev });
      B3 = await s3(B3); A3 = await s3(A3);
      ck(what + ': Put it back brings all of it back, on both devices', has(A3.copy) === has(before) && has(B3.copy) === has(before) && added(B3.copy).join() === Array(12).fill(true).join(), added(B3.copy).join(' / '));
    }
  }

  console.log(bad ? `restore3: ${bad} FAIL of ${n}` : `restore3: ALL PASS (${n})`);
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
