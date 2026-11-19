/* copy_apply: applies the copy table (COPY_V1.md, then any follow-up tables) to a checkout. The voice lane owns the tables, the main session runs this.

   node tests/qc/copy_apply.js [--root DIR] [--check] [--tests-only] TABLE.md [FOLLOWUP.md ...]

   --root DIR     the checkout's wip/team folder (default: the folder this script sits in, two levels up)
   --check        change nothing, only say what would happen (also the default when a row fails)
   --tests-only   only list the test files that quote an old string
   --self         run the self test (a made-up folder in the temp dir)

   The table: rows inside ```copy fences in a markdown file. One row is

     @@ ID | file | AI: ... | Mako: ... | Next: ...
     - the old string, exactly as it is in the source file, on one line
     + the new string
     # a note (optional, any number of lines)

   Rules, all checked before anything is written (one failure and no file is touched):
   1. The old string is in its file exactly once (after the rows before it are applied). Zero or two is a failure.
   2. The old string sits inside a string or a template in a .js part, or anywhere in body.html. Not in a comment.
   3. Every ${...} in the old string is in the new string, the same number of times.
   4. No em dash, en dash, exclamation mark or semicolon in the new string that was not in the old one.
   5. After all rows, the code of every changed .js part is the same token for token. Only the inside of strings and templates differs.
   Warnings (printed, not failures): the numbers in the new string are not the numbers in the old one, an HTML tag was dropped or added.
   The new string is written the way a person reads it. Apostrophes and quotes are escaped for you to fit where the string sits
   ('don't' inside a single quoted string becomes 'don\'t', a " inside an HTML attribute becomes &quot;).

   Several tables are applied in order, so a follow-up table quotes the strings as the table before it left them.
   It then lists every test file that quotes an old string, so the tests can be fixed in the same batch.
   Exit 0: applied (or would apply). Exit 1: at least one row failed, nothing written. No browser. Needs acorn (bash tests/setup_env.sh). */
const fs = require('fs'), path = require('path'), os = require('os');
const argv = process.argv.slice(2);
const flag = f => argv.includes(f);
const opt = f => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : null; };
const TEAM0 = path.join(__dirname, '..', '..');

function loadAcorn(team) {
  for (const p of ['acorn', '/home/claude/work/tools/node_modules/acorn', path.join(team, 'node_modules', 'acorn'), path.join(TEAM0, 'node_modules', 'acorn')]) { try { return require(p); } catch (e) { /* next */ } }
  return null;
}

/* ---------- reading a table ---------- */
function readTable(file) {
  const rows = [], errs = []; let inside = false, cur = null;
  fs.readFileSync(file, 'utf8').split('\n').forEach((ln, i) => {
    const at = path.basename(file) + ':' + (i + 1);
    if (/^```copy\s*$/.test(ln)) { inside = true; return; }
    if (/^```\s*$/.test(ln)) { inside = false; cur = null; return; }
    if (!inside || !ln.trim()) return;
    if (ln.startsWith('@@ ')) {
      const p = ln.slice(3).split(' | ').map(s => s.trim());
      if (p.length < 2) { errs.push(at + ' a row header needs "@@ ID | file | verdict"'); cur = null; return; }
      cur = { id: p[0], file: p[1], verdict: p.slice(2).join(' | '), old: null, neu: null, note: '', at, table: path.basename(file) };
      rows.push(cur); return;
    }
    if (!cur) { errs.push(at + ' a line outside a row: ' + ln.slice(0, 60)); return; }
    if (ln.startsWith('- ') && cur.old === null) cur.old = ln.slice(2);
    else if (ln.startsWith('+ ') && cur.neu === null) cur.neu = ln.slice(2);
    else if (ln.startsWith('# ')) cur.note += (cur.note ? ' ' : '') + ln.slice(2);
    else errs.push(at + ' not a "- old", "+ new" or "# note" line (or a second one): ' + ln.slice(0, 60));
  });
  const seen = {};
  for (const r of rows) {
    if (r.old === null || r.neu === null || !r.old || !r.neu) errs.push(r.at + ' row ' + r.id + ' needs one "- " line and one "+ " line');
    if (seen[r.id]) errs.push(r.at + ' row id ' + r.id + ' is used twice in ' + r.table);
    seen[r.id] = 1;
  }
  return { rows, errs };
}

/* ---------- where a match sits ---------- */
const count = (hay, needle) => { let n = 0, i = -1; while ((i = hay.indexOf(needle, i + 1)) >= 0) n++; return n; };
/* a .js part: 'single', 'double', 'template', or null when the match is not inside a string */
function jsContext(src, at, acorn) {
  let found = null, inTpl = 0;
  try {
    for (const tk of acorn.tokenizer(src, { ecmaVersion: 'latest' })) {
      const lab = tk.type.label;
      if (tk.start > at) break;
      if (lab === '`') inTpl = inTpl ? 0 : 1;
      if (at >= tk.start && at < tk.end) {
        if (lab === 'string') found = src[tk.start] === "'" ? 'single' : 'double';
        else if (lab === 'template') found = 'template';
        break;
      }
    }
  } catch (e) { return { err: 'the file does not parse: ' + e.message }; }
  return { ctx: found };
}
function htmlContext(src, at) {
  const lt = src.lastIndexOf('<', at), gt = src.lastIndexOf('>', at);
  if (src.lastIndexOf('<!--', at) > src.lastIndexOf('-->', at)) return null;
  return lt > gt ? 'attr' : 'text';
}
const escFor = (s, ctx) => {
  if (ctx === 'single') return s.replace(/\\'|'/g, m => (m === "'" ? "\\'" : m));
  if (ctx === 'double') return s.replace(/\\"|"/g, m => (m === '"' ? '\\"' : m));
  if (ctx === 'template') return s.replace(/\\`|`/g, m => (m === '`' ? '\\`' : m));
  if (ctx === 'attr') return s.replace(/"/g, '&quot;');
  return s;
};
const holes = s => (s.match(/\$\{[^}]*\}/g) || []).sort().join(' ');
const tags = s => (s.match(/<\/?[a-zA-Z][^>]*>/g) || []).map(t => t.replace(/\s.*$/, '>').toLowerCase()).sort().join(' ');
const nums = s => (s.replace(/\$\{[^}]*\}/g, ' ').replace(/&#?\w+;/g, ' ').match(/\d[\d,.]*\d|\d/g) || []).sort().join(' ');

/* ---------- the test files that quote an old string ---------- */
function walk(dir, out) {
  let list = []; try { list = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return out; }
  for (const d of list) {
    if (d.name === 'node_modules' || d.name.startsWith('.')) continue;
    const p = path.join(dir, d.name);
    if (d.isDirectory()) walk(p, out); else if (/\.(js|sh|txt|json|md|html|allow|max)$/.test(d.name)) out.push(p);
  }
  return out;
}
/* the pieces of an old string a test would quote: the text between ${...}, tags and escapes, 14 characters or more */
const pieces = old => [...new Set(old.replace(/\\(['"`])/g, '$1').replace(/&amp;/g, '&').split(/\$\{[^}]*\}|<[^>]*>|\\n/).map(s => s.trim()).filter(s => s.length >= 14))];
function testsQuoting(rows, team, self) {
  const files = walk(path.join(team, 'tests'), []).concat(walk(path.join(team, '..', '..', 'tests'), []));
  const tt = path.join(team, 'test_team.js'); if (fs.existsSync(tt)) files.push(tt);
  const hits = [];
  for (const f of files) {
    if (path.resolve(f) === path.resolve(self) || /voice_lint\.js$|voice_known\.txt$/.test(f)) continue; /* the voice lane's own files */
    let src; try { src = fs.readFileSync(f, 'utf8'); } catch (e) { continue; }
    for (const r of rows) for (const p of pieces(r.old)) {
      const i = src.indexOf(p);
      if (i >= 0) { hits.push({ file: path.relative(path.join(team, '..', '..'), f), line: src.slice(0, i).split('\n').length, id: r.id, piece: p }); break; }
    }
  }
  return hits;
}

/* ---------- apply ---------- */
function run(team, tables, o) {
  const log = o.log || console.log; const acorn = loadAcorn(team);
  let all = [], errs = [], warns = [];
  for (const t of tables) { const r = readTable(t); all = all.concat(r.rows); errs = errs.concat(r.errs); }
  if (!acorn) errs.push('acorn not found. Run: bash tests/setup_env.sh');
  const hits = testsQuoting(all, team, __filename);
  if (o.testsOnly) { report(hits, log); return 0; }
  const mem = {}, changed = new Set();
  const get = f => { if (!(f in mem)) { try { mem[f] = fs.readFileSync(path.join(team, f), 'utf8'); } catch (e) { mem[f] = null; } } return mem[f]; };
  let ok = 0;
  if (acorn) for (const r of all) {
    if (r.old === null || r.neu === null) continue;
    const bad = m => errs.push(r.table + ' row ' + r.id + ' (' + r.file + '): ' + m);
    if (/[\\/]/.test(r.file) || !/\.(js|html)$/.test(r.file)) { bad('the file must be a .js part or body.html in wip/team'); continue; }
    const src = get(r.file);
    if (src === null) { bad('no such file'); continue; }
    const n = count(src, r.old);
    if (n !== 1) { bad('the old string is in the file ' + n + ' times, it has to be exactly once: ' + r.old.slice(0, 70)); continue; }
    const at = src.indexOf(r.old); let ctx;
    if (r.file.endsWith('.js')) {
      const c = jsContext(src, at, acorn);
      if (c.err) { bad(c.err); continue; }
      if (!c.ctx) { bad('the old string is not inside a string or template (a comment or code?)'); continue; }
      ctx = c.ctx;
    } else { ctx = htmlContext(src, at); if (!ctx) { bad('the old string is inside an HTML comment'); continue; } }
    if (holes(r.old) !== holes(r.neu)) { bad('the ${...} parts differ: old has [' + holes(r.old) + '], new has [' + holes(r.neu) + ']'); continue; }
    const banned = [['—', 'an em dash'], ['–', 'an en dash'], ['!', 'an exclamation mark'], [';', 'a semicolon']]
      .filter(([ch]) => count(r.neu.replace(/&#?\w+;/g, ''), ch) > count(r.old.replace(/&#?\w+;/g, ''), ch)).map(b => b[1]);
    if (banned.length) { bad('the new string adds ' + banned.join(' and ')); continue; }
    if (nums(r.old) !== nums(r.neu)) warns.push(r.table + ' row ' + r.id + ': numbers differ, old [' + nums(r.old) + '] new [' + nums(r.neu) + ']');
    if (tags(r.old) !== tags(r.neu)) warns.push(r.table + ' row ' + r.id + ': HTML tags differ, old [' + tags(r.old) + '] new [' + tags(r.neu) + ']');
    mem[r.file] = src.slice(0, at) + escFor(r.neu, ctx) + src.slice(at + r.old.length);
    changed.add(r.file); ok++;
  }
  /* the shape of the code must be untouched: the same tokens in the same order, only what is inside strings and templates may differ.
     (Some parts do not parse on their own, ui0.js opens a block that ui5.js closes, so this compares tokens and does not parse.) */
  const shape = src => { const out = []; for (const tk of acorn.tokenizer(src, { ecmaVersion: 'latest' })) out.push(tk.type.label === 'string' || tk.type.label === 'template' ? tk.type.label : tk.type.label + ':' + src.slice(tk.start, tk.end)); return out.join('\u0001'); };
  if (acorn) for (const f of changed) if (f.endsWith('.js')) {
    try { if (shape(fs.readFileSync(path.join(team, f), 'utf8')) !== shape(mem[f])) errs.push(f + ': the code around the strings changed after the rows were applied (a quote or a ${ that ends a string early?)'); }
    catch (e) { errs.push(f + ' can no longer be read as code after the rows are applied: ' + e.message); }
  }
  warns.forEach(w => log('WARN  ' + w));
  errs.forEach(e => log('FAIL  ' + e));
  report(hits, log);
  if (errs.length) { log('COPY APPLY: ' + errs.length + ' failed of ' + all.length + ' rows. Nothing was written.'); return 1; }
  if (!o.check) for (const f of changed) fs.writeFileSync(path.join(team, f), mem[f]);
  log('COPY APPLY: ' + ok + ' rows in ' + changed.size + ' files ' + (o.check ? 'would apply (check only, nothing written)' : 'applied') + ', ' + warns.length + ' warnings, ' +
    new Set(hits.map(h => h.file)).size + ' test files quote an old string.');
  return 0;
}
function report(hits, log) {
  if (!hits.length) { log('No test file quotes an old string.'); return; }
  log('Test files that quote an old string (fix these in the same batch):');
  const by = {}; hits.forEach(h => (by[h.file] = by[h.file] || []).push(h));
  /* files with the same rows (the golden screen files) share one line */
  const groups = {};
  for (const f of Object.keys(by).sort()) { const k = by[f].map(h => h.id).sort().join(' '); (groups[k] = groups[k] || []).push(f); }
  for (const k of Object.keys(groups)) {
    const fs_ = groups[k], first = by[fs_[0]];
    log('  ' + (fs_.length > 3 ? fs_[0] + ' and ' + (fs_.length - 1) + ' more like it (to ' + path.basename(fs_[fs_.length - 1]) + ')' : fs_.join(', ')));
    if (/\.json$/.test(fs_[0]) || first.length > 12) log('      rows ' + k);
    else first.forEach(h => log('      line ' + h.line + ', row ' + h.id + ': ' + h.piece.slice(0, 70)));
  }
}

/* ---------- self test ---------- */
function selfTest() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'copy_apply_')); const team = path.join(d, 'wip', 'team');
  fs.mkdirSync(path.join(team, 'tests'), { recursive: true });
  const w = (f, s) => fs.writeFileSync(path.join(team, f), s);
  const reset = () => {
    w('a.js', "/* It is not here. */\nconst a = 'It is not here.';\nconst b = `Plan exceeds pay by ${amt}.`;\nconst c = \"Twice.\" + 'Twice.';\n");
    w('body.html', '<p class="cap">Back up regularly.</p><input placeholder="Type a name"><!-- Hidden words. -->\n');
    w('tests/t.js', "assert(text.includes('Plan exceeds pay by'));\n");
  };
  const tbl = (name, body) => { const p = path.join(d, name); fs.writeFileSync(p, '```copy\n' + body + '\n```\n'); return p; };
  const quiet = { log: () => {} }; let bad = 0;
  const expect = (what, cond) => { if (!cond) { bad++; console.log('SELFTEST FAIL: ' + what); } };
  const read = f => fs.readFileSync(path.join(team, f), 'utf8');
  reset();
  const good = tbl('good.md', "@@ 2 | a.js | x\n- Plan exceeds pay by ${amt}.\n+ The plan isn't ${amt} `more`\n@@ 3 | body.html | x\n- Back up regularly.\n+ Save a backup every now and then\n@@ 4 | body.html | x\n- Type a name\n+ Type a \"name\"");
  expect('a good table applies', run(team, [good], quiet) === 0);
  expect('template text is in, backtick escaped', read('a.js').includes('`The plan isn\'t ${amt} \\`more\\``'));
  expect('attribute quote escaped', read('body.html').includes('placeholder="Type a &quot;name&quot;"'));
  expect('a follow-up table applies on top', run(team, [tbl('f.md', "@@ f1 | body.html | x\n- Save a backup every now and then\n+ Save a backup now and then")], quiet) === 0 && read('body.html').includes('Save a backup now and then'));
  reset();
  expect('both tables in one go', run(team, [good, tbl('f2.md', "@@ f1 | body.html | x\n- Save a backup every now and then\n+ Save a backup now and then")], quiet) === 0 && read('body.html').includes('Save a backup now and then'));
  reset(); const before = read('a.js') + read('body.html');
  const fails = [
    ['an old string that is there twice', "@@ 1 | a.js | x\n- Twice.\n+ Once"],
    ['an old string that is not there', "@@ 1 | a.js | x\n- Never written\n+ Once"],
    ['an old string in a comment only', "@@ 1 | a.js | x\n- /* It is not here.\n+ /* It isn't here"],
    ['a dropped ${...}', "@@ 1 | a.js | x\n- Plan exceeds pay by ${amt}.\n+ The plan is more than your pay"],
    ['an em dash', "@@ 1 | body.html | x\n- Back up regularly.\n+ Back up — often"],
    ['an exclamation mark', "@@ 1 | body.html | x\n- Back up regularly.\n+ Back up!"],
    ['an HTML comment', "@@ 1 | body.html | x\n- Hidden words.\n+ Hidden"],
    ['a single quote row that also has a good row before it (nothing written)', "@@ 0 | body.html | x\n- Back up regularly.\n+ Save a backup\n@@ 1 | a.js | x\n- Twice.\n+ Once"],
  ];
  for (const [what, body] of fails) { expect('must fail: ' + what, run(team, [tbl('bad.md', body)], quiet) === 1); expect('nothing written after: ' + what, read('a.js') + read('body.html') === before); }
  const single = tbl('s.md', "@@ 1 | a.js | x\n- const a = 'It is not here.\n+ const a = 'It isn't here");
  expect('old string that starts outside a string fails', run(team, [single], quiet) === 1);
  w('a.js', "const a = 'Reading photos is not available here.';\n");
  expect('apostrophe escaped in a single quoted string', run(team, [tbl('q.md', "@@ 1 | a.js | x\n- Reading photos is not available here.\n+ Photos can't be read here")], quiet) === 0 && read('a.js') === "const a = 'Photos can\\'t be read here';\n");
  reset(); const out = []; run(team, [good], { log: s => out.push(s), check: true });
  expect('lists the test that quotes an old string', out.join('\n').includes('t.js') && out.join('\n').includes('row 2'));
  expect('--check writes nothing', read('a.js') + read('body.html') === before);
  fs.rmSync(d, { recursive: true, force: true });
  console.log(bad ? 'copy_apply self test: ' + bad + ' FAILED' : 'copy_apply self test: ok');
  return bad ? 1 : 0;
}

if (flag('--self')) process.exit(selfTest());
const rootArg = opt('--root');
const tables = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--root');
if (!tables.length) { console.log('usage: node tests/qc/copy_apply.js [--root DIR] [--check] [--tests-only] TABLE.md [FOLLOWUP.md ...]'); process.exit(1); }
process.exit(run(rootArg ? path.resolve(rootArg) : TEAM0, tables.map(t => path.resolve(t)), { check: flag('--check'), testsOnly: flag('--tests-only') }));
