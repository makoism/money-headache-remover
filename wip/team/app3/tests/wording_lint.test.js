#!/usr/bin/env node
/* A wording lint (QC_ROLES.md "Scripts beat reviewers" f), for what a script can see of M54, M55 and M62. It does not
   judge whether a line sounds like Mako (qc-voice does); it holds three rules that were found by reviewers more than once.
   1. No em dash (M54; Mako's standing rule; VOICE.md Part C "Everywhere"): none anywhere in app3/src or the shared
      screen pieces (wip/team/screens/*.js), comments included, and none in any string of the built index.html (every
      string and template in its scripts, read with acorn, and the page's own words outside the scripts).
   2. Fewer full stops (M55), kept to what VOICE.md Part C states in its table, read from app3/src:
        toasts            "One line, no full stop": the words given to msg3(...) and to MSG3.post({ text })
        one line notes    "No full stop at the end": a <p class="a3-sub"> or a form's hint that is one sentence
        buttons           "no punctuation at all" at the end: no full stop
        labels, headings  "No full stop, no colon at the end"
      Errors, warnings and longer help keep their full stops (VOICE: "A full stop only where you'd stop talking, and then
      at the end too"), so a note of two sentences is not judged here.
   3. No real figures in the repo (M62): no number of 7 digits or more (1234567 or 1,234,567) in what the app is built
      from and ships as: app3 (but not tests/, fixtures/ and walk/, which hold made-up books), the shared screen pieces,
      the engine and the store (their own test folders aside), and the built index.html. The made-up amounts on this
      project stay under a million yen, so a longer number is either a constant listed in NUMBERS_OK with what it is, or
      a figure nobody made up. The team's notes (wip/team/*.md) are not read: they hold commit ids and big made-up
      examples; the count found there is printed so it is not hidden.
   A real fault found is not fixed here: it is in KNOWN with its reason, and in tests/QCSCRIPTS_FOUND.md. */
'use strict';
const fs = require('fs'), path = require('path');
const TOOLS = process.env.TOOLS || '/home/claude/work/tools/node_modules/';
const acorn = require(TOOLS + 'acorn'), walk = require(TOOLS + 'acorn-walk');
const TEAM = path.join(__dirname, '../..'), APP = path.join(__dirname, '..');
const rd = f => fs.readFileSync(f, 'utf8');
const files = (dir, re) => fs.readdirSync(dir).filter(f => re.test(f) && fs.statSync(path.join(dir, f)).isFile()).map(f => path.join(dir, f));
const rel = f => path.relative(TEAM, f);

/* real faults in the app's words this lint found (the check stays failing; see tests/QCSCRIPTS_FOUND.md) */
const KNOWN = {
};
/* numbers of 7 digits or more that are not money: what each one is */
const NUMBERS_OK = {
  86400000: 'the milliseconds in a day', 3600000: 'the milliseconds in an hour', '0123456789': 'the ten digits, for making ids and reading text',
  23456789: 'the digits a cloud code may use (no 0 or 1)', 6000000: 'the largest statement PDF sent to the AI, in bytes (PDF_MAX)',
  '0764817': 'a commit id in app3/SLICE6_PLAN.md', 5730692: 'a commit id in app3/SLICE6_PLAN.md',
};

let bad = 0, n = 0, known = 0;
const seen = new Set();
const ck = (name, ok, extra) => {
  n++; seen.add(name);
  if (name in KNOWN) { if (ok) { bad++; console.log('FAIL ' + name + ' (listed in KNOWN but it passes now: take it out of KNOWN and QCSCRIPTS_FOUND.md)'); } else { known++; console.log('KNOWN FAIL ' + name + ' [' + KNOWN[name] + ']'); } return; }
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || !extra ? '' : ' ' + extra)); if (!ok) bad++;
};
const lineOf = (text, i) => text.slice(0, i).split('\n').length;

/* ---- 1. no em dash ---- */
const SRC = files(path.join(APP, 'src'), /\.(js|css|html)$/), SCREENS = files(path.join(TEAM, 'screens'), /\.js$/);
{
  const hits = [];
  for (const f of SRC.concat(SCREENS)) { const t = rd(f); for (const m of t.matchAll(/\u2014/g)) hits.push(`${rel(f)}:${lineOf(t, m.index)}`); }
  ck(`no em dash in app3/src and screens (${SRC.length + SCREENS.length} files, comments included)`, hits.length === 0, hits.join(' '));
}
const html = rd(path.join(APP, 'index.html'));
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const strings = [];   // every string and template of the built page's scripts
for (const s of scripts) {
  walk.simple(acorn.parse(s, { ecmaVersion: 2022 }), {
    Literal(x) { if (typeof x.value === 'string') strings.push(x.value); },
    TemplateLiteral(x) { for (const q of x.quasis) strings.push(q.value.cooked == null ? q.value.raw : q.value.cooked); },
  });
}
{
  const outside = html.replace(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/g, '').replace(/<style>[\s\S]*?<\/style>/g, '');
  const hits = strings.filter(s => s.includes('\u2014')).map(s => s.slice(Math.max(0, s.indexOf('\u2014') - 30), s.indexOf('\u2014') + 30));
  ck(`no em dash in any string of the built index.html (${strings.length} strings in ${scripts.length} scripts) or in its own words`, scripts.length >= 2 && strings.length > 1000 && hits.length === 0 && !outside.includes('\u2014'), hits.slice(0, 8).join(' | ') || 'the page was not read: ' + scripts.length + ' scripts');
}

/* ---- 2. full stops, as VOICE.md Part C states ---- */
{
  const voice = rd(path.join(TEAM, 'VOICE.md'));
  ck('VOICE.md still states the rules this lint holds (toasts, one line notes, buttons, labels and headings)',
    /\| Toasts \| One line, no full stop/.test(voice) && /\| One line notes[^|]*\| No full stop at the end/.test(voice) && /\| Buttons \|[^|]*no punctuation at all/.test(voice) && /\| Labels, headings, tabs \| No full stop, no colon at the end/.test(voice),
    'the table in Part C changed: read it and change this lint to match');
  const plain = s => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const finds = { toast: [], note: [], button: [], label: [] };
  let counted = { toast: 0, note: 0, button: 0, label: 0 };
  const textOf = (x, src) => (x.type === 'Literal' && typeof x.value === 'string' ? x.value : x.type === 'TemplateLiteral' ? x.quasis.map(q => q.value.cooked).join('§') : null);
  for (const f of SRC.filter(f => f.endsWith('.js'))) {
    const src = rd(f), where = i => `${path.basename(f)}:${lineOf(src, i)}`;
    walk.simple(acorn.parse(src, { ecmaVersion: 2022 }), {
      CallExpression(x) {
        const callee = src.slice(x.callee.start, x.callee.end);
        let t = null;
        if (callee === 'msg3' && x.arguments[0]) t = textOf(x.arguments[0], src);
        if (callee === 'MSG3.post' && x.arguments[0] && x.arguments[0].type === 'ObjectExpression') { const p = x.arguments[0].properties.find(p => p.key && (p.key.name || p.key.value) === 'text'); if (p) t = textOf(p.value, src); }
        if (t == null) return;
        counted.toast++;
        if (/\.\s*$/.test(t)) finds.toast.push(`${where(x.start)} "${t}"`);
      },
      Property(x) {
        if (!x.key || (x.key.name || x.key.value) !== 'hint') return;
        const t = textOf(x.value, src); if (t == null || !t.trim()) return;
        counted.note++;
        if (/\.\s*$/.test(t) && !/[.?!:] /.test(t.trim().slice(0, -1))) finds.note.push(`${where(x.start)} "${t}"`);
      },
    });
    for (const m of src.matchAll(/<p class="a3-sub"[^>]*>([^<]*)<\/p>/g)) {
      const t = plain(m[1]); if (!t || /^\$\{[^}]*\}$/.test(t)) continue;
      counted.note++;
      if (/\.$/.test(t) && !/[.?!:] /.test(t.slice(0, -1))) finds.note.push(`${where(m.index)} "${t}"`);
    }
    for (const m of src.matchAll(/<button\b[^>]*>([^<]*)<\/button>/g)) { const t = plain(m[1]); if (!t) continue; counted.button++; if (/\.$/.test(t)) finds.button.push(`${where(m.index)} "${t}"`); }
    for (const m of src.matchAll(/<(label|h1|h2|h3)\b[^>]*>([^<]*)<\/\1>/g)) { const t = plain(m[2]); if (!t) continue; counted.label++; if (/[.:]$/.test(t)) finds.label.push(`${where(m.index)} "${t}"`); }
  }
  /* the page shell's own buttons */
  for (const m of rd(path.join(APP, 'src/shell.html')).matchAll(/<button\b[^>]*>([^<]*)<\/button>/g)) { counted.button++; if (/\.$/.test(plain(m[1]))) finds.button.push(`shell.html "${plain(m[1])}"`); }
  const RULES = { toast: 'a toast has no full stop at the end (VOICE: "Toasts: One line, no full stop")', note: 'a one line note has no full stop at the end (VOICE: "One line notes: No full stop at the end")',
    button: 'a button has no full stop (VOICE: "Buttons: no punctuation at all")', label: 'a label or heading has no full stop or colon at the end (VOICE: "Labels, headings, tabs")' };
  for (const k of Object.keys(RULES)) {
    ck(`${RULES[k]}: ${counted[k]} read in app3/src`, counted[k] > 0 && finds[k].filter(x => !(`${k}: ${x}` in KNOWN)).length === 0, finds[k].filter(x => !(`${k}: ${x}` in KNOWN)).join(' | ') || 'none were read: the lint no longer sees them');
    for (const x of finds[k]) if (`${k}: ${x}` in KNOWN) ck(`${k}: ${x}`, false);
  }
  console.log(`\nWORDS READ: ${counted.toast} toasts, ${counted.note} notes, ${counted.button} buttons, ${counted.label} labels and headings; ending in a full stop against VOICE: ${Object.values(finds).reduce((a, b) => a + b.length, 0)}`);
}

/* ---- 3. no real figures (M62): no number of 7 digits or more ---- */
{
  const LONG = /(^|[^0-9A-Za-z_.#/-])((?:[0-9]{1,3}(?:,[0-9]{3}){2,}|[0-9]{7,})(?:\.[0-9]+)?)(?![0-9A-Za-z_-])/g;
  const scan = (f, text) => { const out = [];
    for (const m of text.matchAll(LONG)) {
      const num = m[2], at = m.index + m[1].length;
      if (/rgba?\([0-9, .]*$/.test(text.slice(Math.max(0, at - 24), at)) || /^,\s*[0-9.]+\)/.test(text.slice(at + num.length, at + num.length + 8))) continue;   // a colour, not a number
      if (num in NUMBERS_OK) continue;
      out.push(`${rel(f)}:${lineOf(text, at)} ${num}`);
    } return out; };
  const text = f => /\.(js|mjs|json|md|sh|css|html|txt|webmanifest)$/.test(f);
  const own = [].concat(files(APP, /./).filter(text), SRC, SCREENS, files(path.join(TEAM, 'engine'), /\.js$/), files(path.join(TEAM, 'store'), /\.js$/));
  const hits = []; for (const f of own) hits.push(...scan(f, rd(f)));
  ck(`no number of 7 digits or more in what the app is built from and ships as (${own.length} files: app3, its src, screens, the engine, the store, the built page)`, own.length > 40 && hits.length === 0, hits.slice(0, 20).join(' | '));
  const used = new Set(); for (const f of own) for (const k of Object.keys(NUMBERS_OK)) if (rd(f).includes(k)) used.add(k);
  ck('every number in NUMBERS_OK is still in the code', Object.keys(NUMBERS_OK).every(k => used.has(k)), Object.keys(NUMBERS_OK).filter(k => !used.has(k)).join(' ') + ' is gone: take it out of NUMBERS_OK');
  /* the lint catches what it is for: a made-up long figure in a scratch text */
  ck('a planted long figure is caught, written plainly or with commas, and a colour and a listed constant are not', scan(path.join(TEAM, 'x.js'), 'const bank = 4812345;\nconst pay = "1,234,567";\nconst c = "rgba(255,255,255,0.5)"; const d = 86400000;').length === 2);
  let notes = 0; for (const f of files(TEAM, /\.md$/)) notes += scan(f, rd(f)).length;
  console.log(`LONG NUMBERS: 0 wanted in ${own.length} files; ${Object.keys(NUMBERS_OK).length} constants listed. NOT CHECKED: the team's notes (wip/team/*.md) hold ${notes} long numbers (commit ids, time stamps and big made-up examples)`);
}
for (const k of Object.keys(KNOWN)) if (!seen.has(k)) { bad++; console.log('FAIL ' + k + ' (listed in KNOWN but no check has that name any more)'); }
console.log(bad ? `wording_lint: ${bad} FAIL of ${n}` + (known ? ` (and ${known} KNOWN FAIL)` : '') : `wording_lint: ALL PASS (${n - known})` + (known ? ` and ${known} KNOWN FAIL (the lines in this test's KNOWN table, each in tests/QCSCRIPTS_FOUND.md)` : ''));
process.exit(bad ? 1 : 0);
