'use strict';
// engine/sync.js, the version one sync (SCHEMA_V3 2.3; DECISIONS_ROUND2 AQ, AT, AW), ported once from the frozen
// reference rules/sync_v1_ref.js. Three checks:
//   1. every case of rules/sync_v1.json, answered by the engine, equals its hand-worked expected result (compared as
//      run_rules.js compares: keys sorted, a list of records in id order);
//   2. the two-device fuzz (rules/fuzz_two_devices.js, AQ6) on the engine's sync: 300 seeds of random offline edits on
//      two devices with ordinary ids, then a sync through the revision, with every invariant of the fuzz;
//   3. the file loads in a page (no require, no Buffer): run in a bare context with the other engine files before it.
const { t, done, eq, ok } = require('./t.js');
const fs = require('fs'), path = require('path'), vm = require('vm');
const RULES = path.join(__dirname, '../../foundation_review/rules');
const S = require('../sync.js');

function canon(x) {
  if (Array.isArray(x)) {
    const byId = x.length > 1 && x.every(i => i && typeof i === 'object' && typeof i.id === 'string');
    return '[' + (byId ? x.slice().sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)) : x).map(canon).join(',') + ']';
  }
  if (x && typeof x === 'object') return '{' + Object.keys(x).sort().map(k => JSON.stringify(k) + ':' + canon(x[k])).join(',') + '}';
  return JSON.stringify(x);
}

// 1. the cases
const spec = JSON.parse(fs.readFileSync(path.join(RULES, 'sync_v1.json'), 'utf8'));
let cases = 0;
for (const c of spec.cases) {
  cases++;
  t(`${c.id} ${c.title}`, () => {
    const input = Object.assign({}, spec.defaults || {}, JSON.parse(JSON.stringify(c.input)));
    let got;
    try { got = S.ask(c.question, input); } catch (e) { got = { threw: e.message }; }
    if (canon(got) !== canon(c.expected)) throw new Error(`\n     expected ${canon(c.expected).slice(0, 600)}\n     got      ${canon(got).slice(0, 600)}`);
  });
}
t('every case of sync_v1.json was asked (66 when written)', () => ok(cases >= 66, String(cases)));

// 2. the fuzz, with the engine standing in for the reference. The fuzz also reads the reference's own `laRule` and
// `CAL` to list due days with the reference look ahead; those two stay the reference's, every sync function is the engine's.
{
  const refPath = require.resolve(path.join(RULES, 'sync_v1_ref.js'));
  const ref = require(refPath);
  let calls = 0;
  const shim = Object.assign({}, ref, S, { laRule: ref.laRule, CAL: ref.CAL, sync: (...a) => { calls++; return S.sync(...a); } });
  const keep = require.cache[refPath];
  require.cache[refPath] = Object.assign({}, keep, { exports: shim });
  const fuzzPath = require.resolve(path.join(RULES, 'fuzz_two_devices.js'));
  delete require.cache[fuzzPath];
  const F = require(fuzzPath);
  require.cache[refPath] = keep;
  const SEEDS = Number(process.env.SYNC_FUZZ_SEEDS || 300);
  const fails = [];
  for (let seed = 1; seed <= SEEDS; seed++) for (const f of F.runSeed(seed)) fails.push(`seed ${seed}: ${f.what}: ${String(f.detail).slice(0, 200)}`);
  t(`the two-device fuzz on the engine's sync: ${SEEDS} seeds`, () => eq(fails.slice(0, 5), []));
  t('the fuzz really called the engine\'s sync', () => ok(calls > SEEDS, String(calls)));
  delete require.cache[fuzzPath];
}

// [BZ1] the saved Undo journal: joined by id, never a question, the latest 200 kept, old copies with none read as before
{
  const at = n => `2026-11-24T1${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}:00.000+09:00`;
  const step = (n, by, extra) => Object.assign({ id: by + '-s' + String(n).padStart(4, '0'), label: 'logSpend', moment: at(n), day: '2026-11-24', by, added: [], edited: [], removed: [], revived: [] }, extra || {});
  const book = j => Object.assign({ rev: 3, accounts: [], events: [] }, j ? { journal: j } : {});
  t('[BZ1] two journals join by id with no question; an undone entry wins over the same entry not undone', () => {
    const a = step(1, 'k7m2qa'), b = step(2, 'p4r9zz'), c = step(3, 'k7m2qa');
    const base = book([a]), mine = book([Object.assign({}, a, { undone: 'k7m2qa-u1' }), c]), theirs = book([a, b]);
    const out = S.sync(base, mine, theirs);
    eq(out.journal.map(x => x.id), [a.id, b.id, c.id]);
    eq(out.journal[0].undone, 'k7m2qa-u1');
    eq(out.keptVersions, undefined);
    eq(S.afterSync(out).questions, []);
  });
  t('[BZ1] the joined journal keeps the latest 200 steps, so pruned steps do not come back from the base', () => {
    const all = Array.from({ length: 230 }, (_, i) => step(i, 'k7m2qa'));
    const out = S.sync(book(all.slice(0, 210)), book(all.slice(30, 230)), book(all.slice(5, 210)));
    eq(out.journal.length, 200);
    eq(out.journal[0].id, all[30].id);
  });
  t('[BZ1 migration] a copy with no journal joins with one that has it, and two copies with none stay with none', () => {
    const a = step(1, 'k7m2qa');
    eq(S.sync(book(), book([a]), book()).journal.map(x => x.id), [a.id]);
    eq(S.sync(book(), book(), book([a])).journal.map(x => x.id), [a.id]);
    eq('journal' in S.sync(book(), book(), book()), false);
  });
}

// 3. it runs in a page
t('sync.js loads in a page after dates, units, ids, schedules and ledger (no require, no Buffer)', () => {
  const ctx = { TextEncoder, console };
  ctx.window = ctx; vm.createContext(ctx);
  for (const f of ['dates.js', 'units.js', 'ids.js', 'schedules.js', 'ledger.js', 'sync.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), ctx, { filename: f });
  const P = ctx.BurrowEngine.sync;
  ok(P && typeof P.syncDevice === 'function');
  eq(JSON.stringify(P.impIds({ account: 'bank', lines: [{ ref: 'ä 1', date: '2026-12-01', a: 5, dir: 'out' }] })), '["imp:bank:ref:%C3%A4%201"]');
  eq(JSON.stringify(P.push({ cloud: { rev: 4 }, baseRev: 4 })), '{"accepted":true,"rev":5}');
});

done('sync.test.js');
