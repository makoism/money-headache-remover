#!/usr/bin/env node
/* Every line of wip/team/MAKO_SAYS.md is named somewhere that checks it (QC_ROLES.md "Scripts beat reviewers" e;
   MAKO_SAYS "How it is kept": "A line here that no plan, test or reviewer covers is a fault in the process"; M80).
   The ids are read from the file (a line that starts "- M12."), so a new line Mako adds is asked about on the next
   check with no change here. A line counts as named when its id is written in:
     a test       wip/team/app3/tests, wip/team/engine/test, wip/team/screens/test, wip/team/store/test,
                  tests/vault_server, or a row of app3/FEATURES.json (each row names its test)
     a brief      .claude/agents/*.md, by its own id
     a scope file wip/team/qc_reports/<round>/scope*.txt (the lines a build leaves for later on purpose)
     the cover page wip/team/M_COVERAGE.md, by its own id (the main build session keeps it: who checks each line)
     the runbook  wip/team/RUNBOOK.md section 8, for section G only (how the team works with him: the coordinator
                  keeps those lines, no app test or reviewer can see them)
   [coordinator, 25 Nov 2026] A section handed whole to a reviewer (QC_COMMON rule 2, "sections A to F") no longer
   covers a line: a line added later would pass unseen. Every id must be found by its own id. The sections are still
   printed, for the reader.
   It prints, for every line, who names it; then the lines only a reviewer's section holds (no script checks them yet),
   and the lines nobody names. A line nobody names fails, unless it is in KNOWN below with its reason (the failure is
   kept and counted, and written in tests/QCSCRIPTS_FOUND.md for the coordinator, who owns MAKO_SAYS and the briefs).
   This file and wording_lint.test.js's own M62 check aside, a file that only lists ids proves nothing: this file is
   never counted.
   MLINES_SAYS=<a copy of MAKO_SAYS.md> reads that copy instead (to prove the check on a planted line; never in check3). */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '../../../..');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const ls = (d, re) => (fs.existsSync(path.join(ROOT, d)) && fs.statSync(path.join(ROOT, d)).isDirectory() ? fs.readdirSync(path.join(ROOT, d)).filter(f => re.test(f)).map(f => d + '/' + f) : []);

/* lines nobody names by id: kept failing here until a test, a brief, a scope file or M_COVERAGE.md names them */
const SEC = 'held only by a reviewer\'s whole section, no test, brief, scope file or M_COVERAGE.md names it by its id (the coordinator has the count; M_COVERAGE.md is the place to name it)';
const KNOWN = {};
for (const id of 'M5 M8 M20 M25 M29 M34 M35 M39 M42 M43 M49 M50 M57 M58 M59 M64 M65 M66 M68'.split(' ')) KNOWN[id + ' is named by a test, a brief or a scope file'] = SEC;
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
  for (const l of (process.env.MLINES_SAYS ? fs.readFileSync(process.env.MLINES_SAYS, 'utf8') : rd('wip/team/MAKO_SAYS.md')).split('\n')) {
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

const cover = fs.existsSync(path.join(ROOT, 'wip/team/M_COVERAGE.md')) ? ids(rd('wip/team/M_COVERAGE.md')) : new Set();
const book8 = (() => { const t = fs.existsSync(path.join(ROOT, 'wip/team/RUNBOOK.md')) ? rd('wip/team/RUNBOOK.md') : '', i = t.search(/^## 8\. /m); if (i < 0) return new Set(); const rest = t.slice(i + 3), j = rest.search(/^## /m); return ids(j < 0 ? rest : rest.slice(0, j)); })();
const onlySection = [], nobody = [];
for (const l of lines) {
  const t = byTest[l.id] || [], b = byBrief[l.id] || [], s = bySection[l.sec] || [], sc = byScope[l.id] || [];
  const cv = cover.has(l.id), rb = l.sec === 'G' && book8.has(l.id);
  const who = [].concat(t.length ? ['tests: ' + t.join(', ')] : [], b.length ? ['briefs by id: ' + b.join(', ')] : [], sc.length ? ['scope: ' + sc.join(', ')] : [], cv ? ['M_COVERAGE.md'] : [], rb ? ['RUNBOOK.md section 8'] : []);
  if (!who.length && s.length) onlySection.push(l);
  if (!who.length) nobody.push(l);
  ck(`${l.id} is named by a test, a brief or a scope file`, who.length > 0, `nobody names it by its id: "${l.text.slice(0, 90)}"`);
  if (who.length || s.length) console.log('     ' + who.concat(s.length ? ['(its section ' + l.sec + ' is also given whole to: ' + s.join(', ') + ')'] : []).join('; '));
}
for (const k of Object.keys(KNOWN)) if (!seen.has(k)) { bad++; console.log('FAIL ' + k + ' (listed in KNOWN but no check has that name any more)'); }

const named = lines.filter(l => byTest[l.id]).map(l => l.id);
console.log(`\nM LINES: ${lines.length} in MAKO_SAYS.md (${lines[0].id} to ${lines[lines.length - 1].id}); ${tests.length} test files, ${briefs.length} briefs and ${scopes.length} scope files read`);
console.log(`NAMED BY A TEST (${named.length}): ${named.join(' ') || 'none'}`);
console.log(`HELD ONLY BY A REVIEWER'S WHOLE SECTION, not named by id (${onlySection.length}): ${onlySection.map(l => l.id).join(' ') || 'none'}`);
console.log(`NOBODY NAMES (${nobody.length}): ${nobody.map(l => l.id).join(' ') || 'none'}`);
for (const l of nobody) console.log(`  ${l.id}. ${l.text}`);
console.log(bad ? `m_lines: ${bad} FAIL of ${n}` + (known ? ` (and ${known} KNOWN FAIL)` : '') : `m_lines: ALL PASS (${n - known})` + (known ? ` and ${known} KNOWN FAIL (the lines in this test's KNOWN table, each in tests/QCSCRIPTS_FOUND.md)` : ''));
process.exit(bad ? 1 : 0);
