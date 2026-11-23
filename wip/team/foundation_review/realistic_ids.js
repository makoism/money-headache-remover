#!/usr/bin/env node
// The realistic-ids check [AJ1, LESSONS lesson 3 second addendum].
// Every test names schedules, places, accounts, goals, cards, loans, plans and records with short made-up ids
// ("pay", "trip", "b"). The app never makes ids like that: everything a person types gets an ordinary id,
// `<6 letters>-<10 chars>-<n>` (SCHEMA_V3 section 0). This check copies scenarios/ and rules/ with their
// references into a temp folder, rewrites every short made-up id into the ordinary form (the same id the same
// way everywhere in one file, inside built ids too: `set:`, `auto:`, `skip:`, `pe:`, `ps:`, `rm:`, `close:`,
// `fee:`, `<schedule>@<date>`), and runs both suites on the rewritten copies (and check_specs.js on the scenarios).
// Left as they are: `mv:` ids and the 38.31 copies the move reads (those are the ids a moved copy really has),
// device parts (`by`), and words that are not ids (`free`, kinds, currencies, prose).
// Usage: node realistic_ids.js [scenarios|rules] [--show]   (--show prints every id rewritten and the failing lines)
// run_scenarios.js and run_rules.js call it at their end for their own suite, so it runs every time.
// Any FAIL in a rewritten run makes the check fail.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const here = __dirname;
const SLUG = /^[a-z][a-z0-9_]*$/;
// Words that look like slugs but name no record: places and lines the app names itself, kinds, answers.
const NOT_IDS = new Set(['any', 'amounts', 'once', 'free', 'waiting', 'bills', 'fees', 'other', 'none', 'cfg', 'true', 'false', 'dont_know', 'month', 'week']);
// Fields whose value is never an id (prose, kinds, currencies, device parts) and subtrees left as they are.
const SKIP_KEYS = new Set(['why', 'note', 'notes', 'story', 'title', 'life', 'name', 'kind', 'k', 'question', 'frequency',
  'weekend_holiday', 'currency', 'cur', 'curs', 'country', 'code', 'src', 'dir', 'by', 'decisions', 'lines_note',
  'raw', 'frozen', 'idb', 'ui', 'field', 'avail', 'statement', 'per', 'rhythm', 'area',
  'written_in', 'open', 'alt_note', 'held_note', 'kind2', 'type', 'question2', 'texts', 'text']);
// Fields whose slug value names a record (collected as ids).
const REF_KEYS = new Set(['id', 'account', 'acct', 'schedule', 'place', 'goal', 'card', 'loan', 'kept_in', 'main_bank',
  'mainBank', 'minBank', 'of', 'from', 'to', 'pays_from', 'plan', 'item', 'settles', 'latest', 'event', 'place2', 'waits',
  'newMain', 'into', 'goneBy', 'acct2', 'a_acct', 'paidFrom', 'line']);
// Maps whose keys are ids.
const ID_MAP_KEYS = new Set(['#map', 'schedulesTo', 'newLinks', 'goals', 'lines', 'shares', 'attached', 'accounts', 'schedules', 'places', 'ends', 'gone', 'settled', 'landing_dates', 'cards', 'loans']);
// Field names an answer uses that a case may also use as an id ("pay").
const FIELD_NAMES = new Set(['pay', 'bill', 'card', 'loan', 'goal', 'place', 'account', 'schedule', 'line', 'plan']);
// Lists whose plain strings are ids.
const ID_LIST_KEYS = new Set(['cards', 'places', 'needs', 'accounts', 'goals', 'schedules', 'loans', 'ids']);
const BUILT = /^(set|auto|skip|pe|ps|rm|close|fee):/;

function parts(s) { return s.split(/([:@])/); }   // keeps the separators
function idSegments(s) {
  // The segments of a built id or occurrence that name a record (not dates, counters, `mv:` kinds and keys).
  if (!(BUILT.test(s) || /@\d{4}-\d\d-\d\d/.test(s))) return [];
  const p = parts(s).filter(x => x !== ':' && x !== '@');
  const out = [];
  for (let i = 0; i < p.length; i++) {
    if (p[i] === 'mv') { i += 2; continue; }
    if (/^(set|auto|skip|pe|ps|rm|close|fee)$/.test(p[i]) && i < p.length - 1) continue;
    if (SLUG.test(p[i])) out.push(p[i]);
  }
  return out;
}

// In rules/move.json the copies are 38.31 copies, whose ids are what a moved copy really has: left as they are.
let skipCopies = false;
// Rules cases name records by id as map keys anywhere in their answers; a scenario's keys are ids only in the maps above.
let anyKey = false;
const skipped = key => key && (SKIP_KEYS.has(key) || (skipCopies && /^(copy|phone|desktop|cloud|edits|answers)$/.test(key)));
// A 38.31 copy anywhere else (a 38.31-format backup restored after the move) is left as it is too.
const copy3831 = x => x && typeof x === 'object' && !Array.isArray(x) && ('receipts' in x || 'cfg' in x);

function collect(x, key, ids, top, inArray) {
  if (skipped(key) || copy3831(x)) return;
  if (Array.isArray(x)) { x.forEach(y => collect(y, key, ids, false, true)); return; }
  if (x && typeof x === 'object') {
    for (const k of Object.keys(x)) {
      if (top && (k === 'asks' || k === 'cases')) continue;
      if (!inArray && ID_MAP_KEYS.has(key) && SLUG.test(k)) ids.add(k);
      collect(x[k], k, ids);
    }
    return;
  }
  if (typeof x !== 'string' || /\s/.test(x)) return;
  if (((REF_KEYS.has(key) && !(skipCopies && key === 'to')) || (inArray && ID_LIST_KEYS.has(key))) && SLUG.test(x)) ids.add(x);
  for (const seg of idSegments(x)) ids.add(seg);
}

function devices(x, key, out = new Set()) {
  if (Array.isArray(x)) x.forEach(y => devices(y, key, out));
  else if (x && typeof x === 'object') for (const k of Object.keys(x)) devices(x[k], k, out);
  else if (typeof x === 'string' && /^(by|device|deviceId|me|from_device)$/.test(key || '')) out.add(x);
  return out;
}

function copyWords(x, key, out = new Set(), inside = false) {
  const now = inside || skipped(key) || copy3831(x);
  if (Array.isArray(x)) x.forEach(y => copyWords(y, key, out, now));
  else if (x && typeof x === 'object') for (const k of Object.keys(x)) { if (now) out.add(k); copyWords(x[k], k, out, now); }
  else if (now && typeof x === 'string') for (const w of x.split(/[^a-z0-9_]+/)) out.add(w);
  return out;
}

function collectFile(doc, isRules) {
  const ids = new Set();
  if (isRules) {
    collect(doc.defaults || {}, null, ids);
    for (const c of doc.cases) { collect(c.input, null, ids); collect(c.expected, null, ids); }
  } else {
    collect(doc, null, ids, true);
    for (const a of doc.asks || []) for (const k of Object.keys(a)) if (k !== 'id') collect(a[k], k, ids);
  }
  for (const w of NOT_IDS) ids.delete(w);
  for (const d of devices(doc)) ids.delete(d);   // device parts stay as they are
  if (skipCopies) for (const w of copyWords(doc)) ids.delete(w);   // a word the 38.31 copy holds stays as it is
  return ids;
}

// Ordinary ids, `<6 letters>-<10 chars>-<n>`, made from the file name so a run is repeatable. The counters run
// with the sorted made-up ids and have one width in a file, so the rewrite keeps every id's order.
function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; }
function draw(seed, n, alphabet) { let h = seed, s = ''; for (let i = 0; i < n; i++) { h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0; h = (h + 0x9e3779b9) >>> 0; s += alphabet[h % alphabet.length]; } return s; }
function ordinaryIds(file, ids) {
  const sorted = [...ids].sort();
  const dev = draw(hash(file), 6, 'abcdefghijklmnopqrstuvwxyz');
  const ses = draw(hash(file + '#s'), 10, 'abcdefghijklmnopqrstuvwxyz0123456789');
  const width = String(sorted.length + 9).length;
  const base = 10 ** (width - 1);
  const map = new Map();
  sorted.forEach((id, i) => map.set(id, `${dev}-${ses}-${base + i}`));
  return map;
}

function rewriteString(s, map) {
  if (/\s/.test(s)) return s;
  if (map.has(s)) return map.get(s);
  if (!(BUILT.test(s) || /@\d{4}-\d\d-\d\d/.test(s))) return s;
  const p = parts(s);
  let skip = 0;
  return p.map(seg => {
    if (seg === ':' || seg === '@') return seg;
    if (skip) { skip--; return seg; }
    if (seg === 'mv') { skip = 2; return seg; }
    return map.has(seg) ? map.get(seg) : seg;
  }).join('');
}
function rewrite(x, key, map, inArray) {
  // A `why` given per account (`{ <account>: "sum" }`): its keys are ids, its words are left as they are.
  if (key === 'why' && x && typeof x === 'object' && !Array.isArray(x)) return Object.fromEntries(Object.entries(x).map(([k, v]) => [map.has(k) ? map.get(k) : k, v]));
  if (skipped(key) || copy3831(x)) return x;
  // A map at the top of an answer whose keys are all ids (the `told` of each line, mg results keyed by record).
  if (key === null && x && typeof x === 'object' && !Array.isArray(x) && Object.keys(x).length && Object.keys(x).every(k => map.has(k))) key = '#map';
  if (Array.isArray(x)) return x.map(y => rewrite(y, key, map, true));
  if (x && typeof x === 'object') {
    const o = {};
    for (const k of Object.keys(x)) o[map.has(k) && ((anyKey && !FIELD_NAMES.has(k)) || (!inArray && ID_MAP_KEYS.has(key))) ? map.get(k) : map.has(k) ? k : rewriteString(k, map)] = rewrite(x[k], k, map);
    return o;
  }
  return typeof x === 'string' ? rewriteString(x, map) : x;
}

function rewriteFile(src, dst, isRules, show) {
  const doc = JSON.parse(fs.readFileSync(src, 'utf8'));
  skipCopies = path.basename(src) === 'move.json';
  anyKey = isRules;
  const map = ordinaryIds(path.basename(src), collectFile(doc, isRules));
  let out;
  if (isRules) {
    // One id the same way in the whole file, but each case rewrites only the ids it names itself, so a word
    // that is an id in one case ("b", a bank) and an answer in another ("b", the second copy) stays apart.
    const defaultIds = collectFile({ defaults: doc.defaults, cases: [] }, true);
    const only = ids => new Map([...map].filter(([k]) => ids.has(k) || defaultIds.has(k)));
    out = Object.assign({}, doc, { defaults: rewrite(doc.defaults || {}, null, map),
      cases: doc.cases.map(c => { const m = only(collectFile({ cases: [c] }, true));
        return Object.assign({}, c, { input: rewrite(c.input, null, m), expected: rewrite(c.expected, null, m) }); }) });
  } else {
    out = {};
    for (const k of Object.keys(doc)) {
      if (k === 'asks') out.asks = doc.asks.map(a => { const r = {}; for (const ak of Object.keys(a)) r[ak] = ak === 'id' ? a[ak] : rewrite(a[ak], ak, map); return r; });
      else out[k] = rewrite(doc[k], k, map);
    }
  }
  fs.writeFileSync(dst, JSON.stringify(out, null, 1));
  if (show) console.log(`  ${path.basename(src)}: ${[...map].map(([a, b]) => a + ' -> ' + b).join(', ') || 'no ids'}`);
  return map.size;
}

function copyDir(from, to, filter) {
  fs.mkdirSync(to, { recursive: true });
  for (const f of fs.readdirSync(from)) {
    const s = path.join(from, f);
    if (fs.statSync(s).isFile() && filter(f)) fs.copyFileSync(s, path.join(to, f));
  }
}

function run(suites, show) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'realistic-ids-'));
  let failed = false;
  const lines = [];
  try {
    copyDir(path.join(here, 'ref'), path.join(tmp, 'ref'), f => f.endsWith('.js'));
    copyDir(path.join(here, 'rules'), path.join(tmp, 'rules'), f => f.endsWith('.js'));
    copyDir(path.join(here, 'scenarios'), path.join(tmp, 'scenarios'), f => f.endsWith('.js'));
    let count = 0;
    if (show) console.log('Ids rewritten:');
    if (suites.includes('scenarios')) for (const f of fs.readdirSync(path.join(here, 'scenarios')).filter(f => f.endsWith('.json')))
      count += rewriteFile(path.join(here, 'scenarios', f), path.join(tmp, 'scenarios', f), false, show);
    if (suites.includes('rules')) for (const f of fs.readdirSync(path.join(here, 'rules')).filter(f => f.endsWith('.json')))
      count += rewriteFile(path.join(here, 'rules', f), path.join(tmp, 'rules', f), true, show);
    const env = Object.assign({}, process.env, { REALISTIC_IDS_INNER: '1' });
    // The scenarios are also checked by check_specs.js (its own readers of occurrence names), the rules by run_rules.js.
    const runs = [].concat(suites.includes('scenarios') ? [['scenarios', path.join(tmp, 'ref', 'run_scenarios.js')], ['scenario specs', path.join(tmp, 'scenarios', 'check_specs.js')]] : [],
      suites.includes('rules') ? [['rules', path.join(tmp, 'rules', 'run_rules.js')]] : []);
    for (const [name, runner] of runs) {
      const r = spawnSync(process.execPath, [runner], { cwd: path.dirname(runner), env, encoding: 'utf8' });
      const out = (r.stdout || '') + (r.stderr || '');
      const fails = out.split('\n').filter(l => /^(FAIL|BAD) /.test(l) || /^ {5}(expected|got) /.test(l));
      const last = out.trim().split('\n').pop();
      if (r.status !== 0) failed = true;
      lines.push(`realistic ids, ${name}: ${last}${r.status !== 0 ? ' (FAILED)' : ''}`);
      if (show || r.status !== 0) for (const l of fails) lines.push('  ' + l);
    }
    lines.unshift(`Realistic-ids check [AJ1]: ${count} made-up ids rewritten to the ordinary form in ${tmp}`);
  } finally {
    if (!process.env.REALISTIC_IDS_KEEP) fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log(lines.join('\n'));
  return !failed;
}

module.exports = { run, rewriteString, collectFile, ordinaryIds };

if (require.main === module) {
  const args = process.argv.slice(2);
  const named = args.filter(a => !a.startsWith('--'));
  const ok = run(named.length ? named : ['scenarios', 'rules'], args.includes('--show'));
  process.exit(ok ? 0 : 1);
}
