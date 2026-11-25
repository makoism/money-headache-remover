#!/usr/bin/env node
/* Every line of wip/team/MAKO_SAYS.md is named somewhere that checks it (QC_ROLES.md "Scripts beat reviewers" e;
   MAKO_SAYS "How it is kept": "A line here that no plan, test or reviewer covers is a fault in the process"; M80).
   The ids are read from the file (a line that starts "- M12."), so a new line Mako adds is asked about on the next
   check with no change here. A line counts as named when its id is written in:
     a test       wip/team/app3/tests, wip/team/engine/test, wip/team/screens/test, wip/team/store/test,
                  tests/vault_server, or a row of app3/FEATURES.json (each row names its test)
     a brief      .claude/agents/*.md, by its id, or by its section: QC_COMMON rule 2 gives each reviewer whole sections
                  ("sections A to F"), and a reviewer marks every line of its sections on every build
     a scope file wip/team/qc_reports/<round>/scope*.txt (the lines a build leaves for later on purpose)
   It prints, for every line, who names it; then the lines only a reviewer's section holds (no script checks them yet),
   and the lines nobody names. A line nobody names fails, unless it is in KNOWN below with its reason (the failure is
   kept and counted, and written in tests/QCSCRIPTS_FOUND.md for the coordinator, who owns MAKO_SAYS and the briefs).
   This file and wording_lint.test.js's own M62 check aside, a file that only lists ids proves nothing: this file is
   never counted. */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '../../../..');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const ls = (d, re) => (fs.existsSync(path.join(ROOT, d)) && fs.statSync(path.join(ROOT, d)).isDirectory() ? fs.readdirSync(path.join(ROOT, d)).filter(f => re.test(f)).map(f => d + '/' + f) : []);

/* lines nobody names: a real gap in the process, kept failing here until a test, a brief or a scope file names them */
const G = 'section G, how the team works with him: no test, no brief and no scope file names it (no reviewer is given section G; CLAUDE.md and RESUME carry the rule)';
const KNOWN = {
  'M70 is named by a test, a brief or a scope file': G,
  'M71 is named by a test, a brief or a scope file': G,
  'M72 is named by a test, a brief or a scope file': G,
  'M73 is named by a test, a brief or a scope file': G,
  'M74 is named by a test, a brief or a scope file': G,
  'M75 is named by a test, a brief or a scope file': G,
  'M76 is named by a test, a brief or a scope file': G,
  'M77 is named by a test, a brief or a scope file': G,
  'M78 is named by a test, a brief or a scope file': G,
  'M79 is named by a test, a brief or a scope file': G,
  'M80 is named by a test, a brief or a scope file': G,
  'M81 is named by a test, a brief or a scope file': G,
  'M82 is named by a test, a brief or a scope file': G,
};
/* an "M1" that is not MAKO_SAYS's M1: the old plan's own numbering, written before MAKO_SAYS existed */
const NOT_OURS = { 'wip/team/app3/tests/e3_try.js': ['M1'], 'wip/team/engine/test/move.test.js': ['M1'] };

let bad = 0, n = 0, known = 0;
const seen = new Set();
const ck = (name, ok, extra) => {
  n++; seen.add(name);
  if (name in KNOWN) { if (ok) { bad++; console.log('FAIL ' + name + ' (listed in KNOWN but it passes now: take it out of KNOWN and QCSCRIPTS_FOUND.md)'); } else { known++; console.log('KNOWN FAIL ' + name + ' [' + KNOWN[name] + ']'); } return; }
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || !extra ? '' : ' ' + extra)); if (!ok) bad++;
};

/* the lines, and the section each is in */
const lines = [];
{
  let sec = null;
  for (const l of rd('wip/team/MAKO_SAYS.md').split('\n')) {
    const h = l.match(/^## ([A-Z])\. /); if (h) sec = h[1];
    if (/^## Not settled/.test(l)) sec = null;
    const m = l.match(/^- (M\d+)\. (.*)$/); if (m) lines.push({ id: m[1], sec, text: m[2] });
  }
}
ck('MAKO_SAYS.md has its lines, each with an id and a section', lines.length >= 82 && lines.every(l => l.sec) && new Set(lines.map(l => l.id)).size === lines.length, lines.length + ' lines read');

const ids = text => new Set(text.match(/\bM\d{1,3}\b/g) || []);
const tests = [].concat(ls('wip/team/app3/tests', /\.(js|mjs)$/), ls('wip/team/engine/test', /\.(js|mjs)$/), ls('wip/team/screens/test', /\.(js|mjs|sh)$/), ls('wip/team/store/test', /\.(js|mjs)$/), ls('tests/vault_server', /\.(js|mjs)$/))
  .filter(f => path.basename(f) !== 'm_lines.test.js');
const byTest = {};   // id -> [test files]
for (const f of tests) for (const id of ids(rd(f))) { if ((NOT_OURS[f] || []).includes(id)) continue; (byTest[id] = byTest[id] || []).push(path.basename(f)); }
for (const row of JSON.parse(rd('wip/team/app3/FEATURES.json')).features) for (const id of ids(row.name)) { const t = path.basename(row.test); byTest[id] = byTest[id] || []; if (!byTest[id].includes(t)) byTest[id].push(t); }

const briefs = ls('.claude/agents', /\.md$/), byBrief = {}, bySection = {};
for (const f of briefs) {
  const t = rd(f), who = path.basename(f, '.md');
  for (const id of ids(t)) (byBrief[id] = byBrief[id] || []).push(who);
  /* "section A", "sections C and D", "sections A to F", "section E and any line" */
  for (const m of t.matchAll(/MAKO_SAYS(?:\.md)?[^.\n]{0,40}?\bsections? ([A-Z])(?: (to|and) ([A-Z]))?/g)) {
    const a = m[1].charCodeAt(0), b = m[3] ? m[3].charCodeAt(0) : a;
    const secs = m[2] === 'to' ? Array.from({ length: b - a + 1 }, (_, i) => String.fromCharCode(a + i)) : m[3] ? [m[1], m[3]] : [m[1]];
    for (const s of secs) { bySection[s] = bySection[s] || []; if (!bySection[s].includes(who)) bySection[s].push(who); }
  }
}
/* QC_COMMON rule 2 gives each role its sections too: a brief that says "follow QC_COMMON" takes them from there */
{
  const common = rd('wip/team/qc/QC_COMMON.md'), rule = (common.match(/Your lines are:([^\n]*)/) || [])[1] || '';
  for (const part of rule.split(';')) {
    const m = part.match(/(?:(?:sections? )?\b([A-Z])(?: and ([A-Z]))?|every section) for ((?:qc-[a-z-]+(?: and )?)+)/); if (!m) continue;
    const secs = m[1] ? [m[1]].concat(m[2] ? [m[2]] : []) : [...new Set(lines.map(l => l.sec))].filter(s => s <= 'F');
    for (const who of m[3].split(' and ')) if (briefs.some(f => path.basename(f, '.md') === who)) for (const s of secs) { bySection[s] = bySection[s] || []; if (!bySection[s].includes(who)) bySection[s].push(who); }
  }
}
const scopes = [], byScope = {};
{
  const base = 'wip/team/qc_reports';
  for (const d of fs.existsSync(path.join(ROOT, base)) ? fs.readdirSync(path.join(ROOT, base)) : []) for (const f of ls(base + '/' + d, /^scope.*\.(txt|md)$/)) { scopes.push(f); for (const id of ids(rd(f))) (byScope[id] = byScope[id] || []).push(f.replace(base + '/', '')); }
}

const onlySection = [], nobody = [];
for (const l of lines) {
  const t = byTest[l.id] || [], b = byBrief[l.id] || [], s = bySection[l.sec] || [], sc = byScope[l.id] || [];
  const who = [].concat(t.length ? ['tests: ' + t.join(', ')] : [], b.length ? ['briefs by id: ' + b.join(', ')] : [], s.length ? ['reviewers by section ' + l.sec + ': ' + s.join(', ')] : [], sc.length ? ['scope: ' + sc.join(', ')] : []);
  if (!t.length && !b.length && !sc.length && s.length) onlySection.push(l);
  if (!who.length) nobody.push(l);
  ck(`${l.id} is named by a test, a brief or a scope file`, who.length > 0, `nobody names it: "${l.text.slice(0, 90)}"`);
  if (who.length) console.log('     ' + who.join('; '));
}
for (const k of Object.keys(KNOWN)) if (!seen.has(k)) { bad++; console.log('FAIL ' + k + ' (listed in KNOWN but no check has that name any more)'); }

const named = lines.filter(l => byTest[l.id]).map(l => l.id);
console.log(`\nM LINES: ${lines.length} in MAKO_SAYS.md (${lines[0].id} to ${lines[lines.length - 1].id}); ${tests.length} test files, ${briefs.length} briefs and ${scopes.length} scope files read`);
console.log(`NAMED BY A TEST (${named.length}): ${named.join(' ') || 'none'}`);
console.log(`HELD ONLY BY A REVIEWER'S SECTION, no script checks them (${onlySection.length}): ${onlySection.map(l => l.id).join(' ') || 'none'}`);
console.log(`NOBODY NAMES (${nobody.length}): ${nobody.map(l => l.id).join(' ') || 'none'}`);
for (const l of nobody) console.log(`  ${l.id}. ${l.text}`);
console.log(bad ? `m_lines: ${bad} FAIL of ${n}` + (known ? ` (and ${known} KNOWN FAIL)` : '') : `m_lines: ALL PASS (${n - known})` + (known ? ` and ${known} KNOWN FAIL (the lines in this test's KNOWN table, each in tests/QCSCRIPTS_FOUND.md)` : ''));
process.exit(bad ? 1 : 0);
