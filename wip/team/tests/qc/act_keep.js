/* Nobody loses data, for every ACT action (the one door the setup, the statement import, the assistant and the screens use).
   The list of actions is read from the running page (Object.keys(ACT)), never written by hand, so a new action is covered the day it lands.
   For each action the test makes one call on a made-up plan and MEASURES what it did to the saved data:
     READS     nothing changed (the table below says it should not): nothing to prove.
     ADDS      nothing that was saved before is gone or different: nothing to prove.
     REPLACES  an earlier saved value is now different.
     REMOVES   an earlier saved value is gone.
   REPLACES and REMOVES must prove three things:
     1. copy:   the saved storage holds a copy of the earlier data, exactly, dated now (the app's 3-day copy, S.ui.keep);
     2. undo:   Undo in the same visit brings back exactly the earlier data (deep equal);
     3. reload: after the page is closed and opened 2 days 23 hours later, Undo is still offered and brings back exactly the earlier data.
   An action with no call in the table is printed as UNKNOWN and fails. A call that changes nothing (the action's shape changed) fails as NO EFFECT.
   Known findings live in tests/qc/act_keep.known (one pattern per line); a listed line that passes again also fails, so the list stays honest.
   Not checked here, because other scripts already prove it through the buttons: Set all to zero and Reset month (zero_safe, reset_undo),
   removing a goal or a bill line and Restore samples from the screen (remove_undo), setup run again and backup loaded (setup_undo),
   receipts logged or deleted by hand (receipt_undo), unknown fields (keep_unknown), a failed save (save_fail).
   Made-up numbers. Run: node tests/qc/act_keep.js            (about 4 minutes; one action only: node tests/qc/act_keep.js removeGoal) */
const fs = require('fs'), os = require('os'), path = require('path');
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
const BUILD = process.env.BUILD || '/home/claude/work/money-map-team.html';
const ONLY = process.argv.slice(2);
const BASE = new Date('2026-12-03T10:00:00').getTime(), ALMOST_3_DAYS = (3 * 24 - 1) * 3600e3;

/* ---- one call per action. (A, x, ak): A is ACT, x holds ids from the made-up plan, ak.S is the live state.
        quiet: the action must change nothing saved. pre: runs first, and "the earlier data" is what is there after it. ---- */
const CALLS = {
  tx: { call: (A, x, ak) => A.tx('probe', () => { ak.S.plan.goals = ak.S.plan.goals.filter(g => g.id !== x.goal); }), note: 'the door the assistant and the statement import use; here it drops a goal' },
  commit: { quiet: true, call: A => A.commit() },
  canUndo: { quiet: true, call: A => A.canUndo() },
  lastLabel: { quiet: true, call: A => A.lastLabel() },
  clearUndo: { quiet: true, call: A => A.clearUndo() },
  summary: { quiet: true, call: A => A.summary() },
  undo: { pre: A => A.setName('Robin'), call: A => A.undo() },
  setPay: { call: A => A.setPay(3100) },
  setIncome: { call: A => A.setIncome('side', 90) },
  setBalance: { call: A => A.setBalance(1800) },
  setBankNow: { call: A => A.setBankNow(1900) },
  setCard: { call: A => A.setCard('c1', { name: 'Card one', owed: 610, payDay: 10 }) },
  removeCard: { call: A => A.removeCard('c2') },
  setMinBalance: { call: A => A.setMinBalance(350) },
  setCeiling: { call: A => A.setCeiling(1500) },
  setLine: { call: A => A.setLine('bill:rent', 1250) },
  renameLine: { call: (A, x) => A.renameLine(x.line, 'Mobile') },
  setLineEnds: { pre: (A, x) => A.setLineEnds(x.line, '2027-03'), call: (A, x) => A.setLineEnds(x.line, '2027-06') },
  addLine: { call: A => A.addLine('nec', 'Water', 30) },
  removeLine: { call: (A, x) => A.removeLine(x.line) },
  addGoal: { call: A => A.addGoal({ name: 'Laptop', target: 1200, monthly: 50 }) },
  updateGoal: { call: (A, x) => A.updateGoal(x.goal, { target: 700, name: 'Holiday' }) },
  removeGoal: { call: (A, x) => A.removeGoal(x.goal) },
  setGoalSaving: { call: (A, x) => A.setGoalSaving(x.goal, 25) },
  sweep: { call: (A, x) => A.sweep(x.past, x.goal, 20) },
  unsweep: { pre: (A, x) => A.sweep(x.past, x.goal, 20), call: (A, x) => A.unsweep(x.past, x.goal, 20, [{ key: 'envelope', cut: 20 }]) },
  release: { call: (A, x) => A.release(x.past, 'bank', undefined, 20) },
  setAims: { pre: A => A.setAims({ nec: 0.5, play: 0.2 }), call: A => A.setAims({ nec: 0.6, play: 0.1 }) },
  addReceipts: { call: A => A.addReceipts([{ d: '2026-12-02', a: 9.5, c: 'envelope', n: 'made up' }]) },
  removeReceipts: { call: (A, x) => A.removeReceipts([x.rc]) },
  setName: { call: A => A.setName('Robin') },
  setCurrency: { call: A => A.setCurrency('€') },
  setHome: { call: A => A.setHome(['goal', 'play']) },
};

/* ---- the page under test: the built page with one added line that lets the test reach ACT (it sits inside the page's own function).
        If the main session adds ACT to __t this is not needed; see LANE_act_keep.md. ---- */
const html = fs.readFileSync(BUILD, 'utf8'), HOOK = 'window.__t = {';
if (html.indexOf(HOOK) < 0) { console.log('FAIL the page has no test hook to reach ACT through ("' + HOOK + '")'); process.exit(1); }
const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'act_keep_')), PAGE = path.join(DIR, 'page.html');
fs.writeFileSync(PAGE, html.replace(HOOK, 'window.__ak = { ACT, KEY, get S() { return S; } }; ' + HOOK));

/* a browser with a fresh profile; the clock starts at BASE and can be moved on before a reload; seed is the saved plan to start from */
async function open(seed) {
  const o = await R.phone({ w: 390, h: 844, dpr: 1, mobile: true, keep: true });
  await o.p.evaluateOnNewDocument((BASE, seed) => {
    const real = Date, t0 = real.now(); let shift = 0;
    try {
      shift = +(localStorage.getItem('__ak_shift') || 0);
      if (seed && !localStorage.getItem('__ak_seeded')) { localStorage.setItem('money-map-template-v2', seed); localStorage.setItem('__ak_seeded', '1'); }
    } catch (e) { }
    const now = () => BASE + shift + (real.now() - t0);
    class D extends real { constructor(...a) { if (!a.length) super(now()); else super(...a); } static now() { return now(); } }
    window.Date = D;
  }, BASE, seed || '');
  await o.p.goto('file://' + PAGE + '?sfxtest'); await w(1500);
  return o;
}
const later = async p => { await p.evaluate(ms => localStorage.setItem('__ak_shift', String(ms)), ALMOST_3_DAYS); await p.reload(); await p.waitForFunction(() => window.__ak && __ak.S, { timeout: 15000 }).catch(() => { }); await w(1800); };

/* ---- comparing saved data: every value by its path; lists of things with an id are read by id, and their order is one more value ---- */
const SKIP = [/^rev$/, /^ui\.keep(\.|$)/, /^ui\.preSplit(\.|$)/];
let VOLATILE = [];
function flat(v, pre, out) {
  if (Array.isArray(v)) {
    if (!v.length) { out[pre] = '[]'; return out; }
    const ids = v.every(e => e && typeof e === 'object' && typeof e.id === 'string');
    if (ids) { out[pre + '.#order'] = v.map(e => e.id).join(','); v.forEach(e => flat(e, pre + '[' + e.id + ']', out)); }
    else v.forEach((e, i) => flat(e, pre + '[' + i + ']', out));
  } else if (v && typeof v === 'object') {
    const ks = Object.keys(v); if (!ks.length) { out[pre] = '{}'; return out; }
    ks.forEach(k => flat(v[k], pre ? pre + '.' + k : k, out));
  } else out[pre] = JSON.stringify(v === undefined ? null : v);
  return out;
}
const view = S => { const f = flat(S, '', {}); Object.keys(f).forEach(k => { if (SKIP.some(r => r.test(k)) || VOLATILE.indexOf(k) >= 0) delete f[k]; }); return f; };
const sameOrder = (a, b) => { const keep = new Set(a.split(',')); return b.split(',').filter(id => keep.has(id)).join(',') === a; };
/* what of a is gone or different in b */
function lost(a, b) {
  const gone = [], diff = [];
  Object.keys(a).forEach(k => {
    if (/\.#order$/.test(k)) { if (b[k] !== undefined && !sameOrder(a[k], b[k]) && a[k].split(',').every(id => b[k].split(',').indexOf(id) >= 0)) diff.push(k); return; }
    if (b[k] === undefined) {
      /* a value that only moved from "nothing here" to something under it, or back, is a change, not a loss of the path */
      (a[k] === '{}' || a[k] === '[]' || a[k] === 'null') ? diff.push(k) : gone.push(k);
    } else if (b[k] !== a[k]) diff.push(k);
  });
  return { gone, diff, n: gone.length + diff.length };
}
const equal = (a, b) => { const ka = Object.keys(a).sort(), kb = Object.keys(b).sort(); return ka.length === kb.length && ka.every((k, i) => k === kb[i] && a[k] === b[k]); };
const firstDiff = (a, b) => { const ks = [...new Set(Object.keys(a).concat(Object.keys(b)))].filter(k => a[k] !== b[k] && !/\.#order$/.test(k)); return ks.slice(0, 3).map(k => `${k}: ${a[k] === undefined ? '(not there)' : a[k]} became ${b[k] === undefined ? '(gone)' : b[k]}`).join('; ') + (ks.length > 3 ? `; and ${ks.length - 3} more` : ''); };
const short = l => { const all = l.gone.map(k => k + ' gone').concat(l.diff.map(k => k + ' changed')); return all.slice(0, 3).join(', ') + (all.length > 3 ? `, and ${all.length - 3} more` : ''); };

/* ---- in the page ---- */
const getS = p => p.evaluate(() => JSON.parse(JSON.stringify(__ak.S)));
const run = (p, src) => p.evaluate(src => {
  const S = __ak.S, x = {
    goal: 'trip1', past: '2026-11', rc: (S.receipts || []).length ? S.receipts[0].id : '',
    line: (S.plan.lines.find(l => l.name === 'Phone plan') || {}).id,
  };
  try { (0, eval)('(' + src + ')')(__ak.ACT, x, __ak); return ''; } catch (e) { return String(e && e.message || e); }
}, src);
const bar = p => p.evaluate(() => { const e = document.getElementById('undoBar'); return e && !e.hidden ? document.getElementById('undoTxt').textContent : ''; });
const tapUndo = p => p.evaluate(() => document.getElementById('undoGo').click());

/* ---- the made-up plan every action starts from: pay, bills, an added bill, two goals with money, receipts, month edits, a name, a Home order ---- */
async function makeSeed() {
  const { b, p } = await open('');
  await p.evaluate(() => { const s = document.getElementById('tourSkip'); s && s.click(); }); await w(400);
  await p.evaluate(() => { const s = document.getElementById('coSkip'); s && s.click(); }); await w(400);
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '$'; });
  await L.base(p, { pay: 3000, bank: 2500, min: 200, eT: 5000, eS: 800, eM: 100, tT: 600, tM: 40, defs: { 'bill:rent': 1200, 'bill:food': 400, envelope: 300, education: 50, invest: 100, give: 20 } });
  const err = await p.evaluate(() => {
    try {
      const A = __ak.ACT, S = __ak.S;
      S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true;
      A.addLine('nec', 'Phone plan', 45); A.setIncome('side', 150); A.setCeiling(2000); A.setName('Sam'); A.setHome(['play', 'goal', 'log', 'jars']);
      if (A.setBankNow) A.setBankNow(2400);
      if (A.setCard) { A.setCard('c1', { name: 'Card one', owed: 840, payDay: 10 }); A.setCard('c2', { name: 'Card two', owed: 375, payDay: 11 }); }
      A.updateGoal('trip1', { start: 120 }); A.setLine('bill:rent', 1200); A.setLine('envelope', 300); A.setGoalSaving('trip1', 40);
      __ak.S.once['2026-11'] = Object.assign({}, __ak.S.once['2026-11'], { envelope: 300, 'goal:trip1': 40 });   /* last month already has its own figures */
      A.addReceipts([{ d: '2026-11-05', a: 31.5, c: 'envelope', n: 'made up' }, { d: '2026-11-21', a: 12, c: 'envelope', n: 'made up' }, { d: '2026-12-01', a: 8, c: 'envelope', n: 'made up' }]);
      __ak.S.once['2026-12'] = Object.assign({}, __ak.S.once['2026-12'], { 'bill:food': 430 });
      delete __ak.S.ui.keep; A.clearUndo();   /* the plan starts with no copy waiting: the copy Set all to zero kept above must not be mistaken for an action's own */
      A.commit(); return '';
    } catch (e) { return String(e && e.message || e); }
  });
  await w(1500);
  const seed = await p.evaluate(() => localStorage.getItem(__ak.KEY));
  await b.close();
  if (err || !seed) { console.log('FAIL could not make the made-up plan: ' + (err || 'nothing was saved')); process.exit(1); }
  return seed;
}

(async () => {
  const out = [], seed = await makeSeed();
  /* what a reload almost three days later changes with no action at all (for example a visit counter): left out of every comparison */
  { const { b, p } = await open(seed); const a = flat(await getS(p), '', {}); await later(p); const c = flat(await getS(p), '', {}); await b.close();
    VOLATILE = [...new Set(Object.keys(a).concat(Object.keys(c)))].filter(k => a[k] !== c[k] && !SKIP.some(r => r.test(k)));
    console.log('NOTE left out of comparisons (a reload alone changes them): ' + (VOLATILE.join(', ') || 'nothing')); }
  /* the list of actions, from the page */
  const { b: b0, p: p0 } = await open(seed);
  const names = await p0.evaluate(() => Object.keys(__ak.ACT).filter(k => typeof __ak.ACT[k] === 'function')); await b0.close();
  console.log(`NOTE ${names.length} ACT actions in this build: ${names.join(', ')}`);
  Object.keys(CALLS).filter(n => names.indexOf(n) < 0).forEach(n => console.log(`NOTE ${n} is in this test's table but no longer in the app: take it out of CALLS`));

  for (const name of names) {
    if (ONLY.length && ONLY.indexOf(name) < 0) continue;
    const c = CALLS[name];
    if (!c) { out.push(`FAIL ${name}: UNKNOWN. This action is new to the test. Add one call for it to CALLS in tests/qc/act_keep.js; until then nobody has shown it keeps a copy.`); console.log(out[out.length - 1]); continue; }
    const say = s => { out.push(s); console.log(s); };
    /* visit 1: measure, then the copy and Undo in the same visit */
    let o = await open(seed), p = o.p, e = '';
    if (c.pre) e = await run(p, c.pre.toString());
    const before = view(await getS(p));
    if (!e) e = await run(p, c.call.toString());
    await w(300);
    const after = view(await getS(p)), l = lost(before, after), changed = !equal(before, after);
    if (e) { say(`FAIL ${name}: the test's call threw "${e}". Fix the call in CALLS, or the action.`); await o.b.close(); continue; }
    if (c.quiet) { say(changed ? `FAIL ${name}: READS, but it changed saved data (${firstDiff(before, after)})` : `PASS ${name}: READS, nothing saved changed`); await o.b.close(); continue; }
    if (!changed) { say(`FAIL ${name}: NO EFFECT. The test's call changed nothing, so nothing was proven. Fix the call in CALLS.`); await o.b.close(); continue; }
    if (!l.n) { say(`PASS ${name}: ADDS, nothing saved before is gone or different`); await o.b.close(); continue; }
    const kind = l.gone.length ? 'REMOVES' : 'REPLACES';
    await w(1000);   /* the save runs half a second after the change */
    const copy = await p.evaluate(() => { try { const d = JSON.parse(localStorage.getItem(__ak.KEY)), k = d && d.ui && d.ui.keep; return k && typeof k.snap === 'string' ? { snap: JSON.parse(k.snap), age: Date.now() - k.t } : null; } catch (er) { return null; } });
    const copyOk = !!copy && equal(view(copy.snap), before) && copy.age >= 0 && copy.age < 60000;
    const copyTxt = copyOk ? 'copy kept' : !copy ? 'NO COPY in the saved data' : !equal(view(copy.snap), before) ? `COPY DIFFERS from the earlier data (${firstDiff(before, view(copy.snap))})` : 'COPY IS NOT DATED NOW';
    const how = await p.evaluate(() => { const e = document.getElementById('undoBar'); if (e && !e.hidden) { document.getElementById('undoGo').click(); return 'bar'; } if (__ak.ACT.canUndo()) { __ak.ACT.undo(); return 'ACT.undo'; } return ''; });
    await w(500);
    const back1 = view(await getS(p)), undoOk = !!how && equal(back1, before);
    const undoTxt = undoOk ? `Undo now is exact (${how})` : !how ? 'NO UNDO in the same visit' : `UNDO NOW IS NOT EXACT (${how}: ${firstDiff(before, back1)})`;
    const errs1 = o.errs.slice(); await o.b.close();
    /* visit 2: the same change, then close, open almost three days later, Undo */
    o = await open(seed); p = o.p;
    if (c.pre) await run(p, c.pre.toString());
    await run(p, c.call.toString()); await w(1300);
    await later(p);
    const offered = await bar(p); let reloadOk = false, reloadTxt = 'AFTER A RELOAD NO UNDO IS OFFERED, the earlier data is gone';
    if (offered) { await tapUndo(p); await w(700); const back2 = view(await getS(p)); reloadOk = equal(back2, before); reloadTxt = reloadOk ? 'after a reload at 2 days 23 hours Undo is exact' : `AFTER A RELOAD UNDO IS NOT EXACT (${firstDiff(before, back2)})`; }
    const errs = errs1.concat(o.errs); await o.b.close();
    const ok = copyOk && undoOk && reloadOk && !errs.length;
    say(`${ok ? 'PASS' : 'FAIL'} ${name}: ${kind} (${short(l)}). ${copyTxt}; ${undoTxt}; ${reloadTxt}${errs.length ? '; PAGE ERRORS ' + errs.join(' | ') : ''}${c.note ? ' [' + c.note + ']' : ''}`);
  }

  /* known findings: a listed FAIL does not fail the run; a listed line that matches nothing does */
  let known = [];
  try { known = fs.readFileSync(path.join(__dirname, 'act_keep.known'), 'utf8').split('\n').map(s => s.trim()).filter(s => s && s[0] !== '#'); } catch (e) { }
  const fails = out.filter(s => /^FAIL /.test(s)), fresh = fails.filter(s => !known.some(k => new RegExp(k).test(s)));
  const stale = ONLY.length ? [] : known.filter(k => !fails.some(s => new RegExp(k).test(s)));
  stale.forEach(k => console.log(`FAIL the known finding "${k}" no longer fails: take its line out of tests/qc/act_keep.known`));
  const pass = out.filter(s => /^PASS /.test(s)).length, bad = fresh.length + stale.length;
  console.log(`${pass} pass, ${fails.length - fresh.length} known findings, ${fresh.length} new failures${stale.length ? ', ' + stale.length + ' stale known lines' : ''}`);
  if (fresh.length) console.log('New failures: ' + fresh.map(s => s.slice(5).split(':')[0]).join(', '));
  try { fs.rmSync(DIR, { recursive: true, force: true }); } catch (e) { }
  console.log(bad ? 'FAILED ' + bad : 'ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('FAIL the test itself broke: ' + (e && e.stack || e)); process.exit(1); });
