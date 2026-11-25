/* No file under screens/ does money maths (DECISIONS_ROUND2 C: "no screen works out a money figure itself";
   sweep2_repeats B1: Receipts worked out its own safe-to-spend). Every figure comes from the engine; screens only
   write it. This scans every .js file under screens/ (outside test/), including screens added later, after taking out
   comments, strings and regular expressions, and fails on:
     arithmetic between two values (+ - * / % and their = forms; joining text with + is fine), Math rounding or
     min/max/abs, reduce, toFixed, parseFloat, parseInt.
   money.js is the formatter and the one exception: it turns minor units into digits and back, and its own test checks it
   offers nothing but writing and reading. A line that does arithmetic on something that is not money (time, a count)
   says so with a "not money:" comment, and those lines are listed here so they stay few. */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { test, run } = require('./harness');

const ROOT = path.join(__dirname, '..');
const EXEMPT = ['money.js'];

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return d.name === 'test' || d.name === 'node_modules' ? [] : files(p);
    return d.name.endsWith('.js') ? [p] : [];
  });
}

/* tokens with their line numbers: strings become S, regular expressions R, comments go */
function tokens(src) {
  const out = []; let i = 0, line = 1;
  const operand = () => { const t = out[out.length - 1]; return t && (/^[\w$]/.test(t.v) && !/^(return|typeof|case|in|of|new|delete|void|throw|else|do)$/.test(t.v) || t.v === ')' || t.v === ']' || t.v === 'S' || t.v === 'R'); };
  const push = v => out.push({ v, line });
  function str(q) {
    const start = line; i++;
    while (i < src.length && src[i] !== q) {
      if (src[i] === '\\') i++;
      else if (q === '`' && src[i] === '$' && src[i + 1] === '{') {   // a template's ${...} is code: scan it
        i += 2; let depth = 1; const from = i;
        while (i < src.length && depth) { if (src[i] === '{') depth++; else if (src[i] === '}') depth--; if (src[i] === '\n') line++; i++; }
        const inner = tokens(src.slice(from, i - 1)); out.push({ v: 'S', line: start }); inner.forEach(t => out.push({ v: t.v, line: start + t.line - 1 })); continue;
      }
      if (src[i] === '\n') line++;
      i++;
    }
    i++; out.push({ v: 'S', line: start });
  }
  while (i < src.length) {
    const c = src[i], c2 = src.slice(i, i + 2);
    if (c === '\n') { line++; i++; continue; }
    if (/\s/.test(c)) { i++; continue; }
    if (c2 === '//') { const e = src.indexOf('\n', i); const text = src.slice(i, e < 0 ? src.length : e); if (/not money:/.test(text)) push('NOTMONEY'); i = e < 0 ? src.length : e; continue; }
    if (c2 === '/*') { const e = src.indexOf('*/', i + 2); for (const ch of src.slice(i, e)) if (ch === '\n') line++; i = e + 2; continue; }
    if (c === '"' || c === "'" || c === '`') { str(c); continue; }
    if (c === '/' && !operand()) {   // a regular expression
      i++; let cls = false;
      while (i < src.length && (cls || src[i] !== '/')) { if (src[i] === '\\') i++; else if (src[i] === '[') cls = true; else if (src[i] === ']') cls = false; i++; }
      i++; while (/[a-z]/.test(src[i] || '')) i++;
      push('R'); continue;
    }
    const w = /^[A-Za-z_$][\w$]*|^\d[\d._eExXa-fA-F]*/.exec(src.slice(i));
    if (w) { push(w[0]); i += w[0].length; continue; }
    const op = /^(===|!==|\*\*=|\*\*|=>|==|!=|<=|>=|&&|\|\||\?\?|\+\+|--|\+=|-=|\*=|\/=|%=|\?\.|\.\.\.)/.exec(src.slice(i));
    if (op) { push(op[0]); i += op[0].length; continue; }
    push(c); i++;
  }
  return out;
}

/* every place a file does maths: { line, what } */
function maths(src) {
  const t = tokens(src), found = [];
  const marked = new Set(t.filter(x => x.v === 'NOTMONEY').map(x => x.line));
  const ts = t.filter(x => x.v !== 'NOTMONEY');
  const isOperand = x => x && (/^[\w$]/.test(x.v) && !/^(return|typeof|case|in|of|new|delete|void|throw|else|do)$/.test(x.v) || x.v === ')' || x.v === ']' || x.v === 'S' || x.v === 'R');
  ts.forEach((x, k) => {
    const prev = ts[k - 1], next = ts[k + 1];
    let what = null;
    if (['-', '*', '/', '%', '**'].includes(x.v) && isOperand(prev)) what = 'arithmetic ' + x.v;
    if (x.v === '+' && isOperand(prev) && prev.v !== 'S' && !(next && next.v === 'S')) what = 'arithmetic +';
    if (['+=', '-=', '*=', '/=', '%=', '**='].includes(x.v)) what = 'arithmetic ' + x.v;
    if (x.v === 'Math' && next && next.v === '.' && /^(round|floor|ceil|trunc|abs|max|min)$/.test((ts[k + 2] || {}).v)) what = 'Math.' + ts[k + 2].v;
    if (/^(reduce|reduceRight|toFixed|parseFloat|parseInt)$/.test(x.v)) what = x.v;
    if (what && !marked.has(x.line)) found.push({ line: x.line, what });
  });
  return found;
}

test('the scan itself catches money maths and lets plain text through', () => {
  assert.deepStrictEqual(maths('const left = r.total.amount - r.cards.x.owedNow;').map(f => f.what), ['arithmetic -']);
  assert.deepStrictEqual(maths('const t = items.reduce((a, i) => a + i.amount, 0);').map(f => f.what), ['reduce', 'arithmetic +']);
  assert.deepStrictEqual(maths('x = Math.round(a / 100);').map(f => f.what), ['Math.round', 'arithmetic /']);
  assert.deepStrictEqual(maths('total += 5;').map(f => f.what), ['arithmetic +=']);
  assert.deepStrictEqual(maths("const s = 'Short by ' + amount + ' on ' + day; const r = /a+b-c/g; // a - b"), []);
  assert.deepStrictEqual(maths('const s = `${a - b} left`;').map(f => f.what), ['arithmetic -']);
  assert.deepStrictEqual(maths('const n = -1; f(a ? -1 : 1);'), []);
  assert.deepStrictEqual(maths('const at = now() + ms;   // not money: time'), []);
});

test('no file under screens/ does money maths (money.js, the formatter, aside)', () => {
  const all = files(ROOT);
  assert.ok(all.length >= 6, 'files scanned: ' + all.length);
  const bad = [];
  for (const f of all) {
    if (EXEMPT.includes(path.relative(ROOT, f))) continue;
    for (const m of maths(fs.readFileSync(f, 'utf8'))) bad.push(`${path.relative(ROOT, f)}:${m.line} ${m.what}`);
  }
  assert.deepStrictEqual(bad, [], bad.join('\n'));
});

test('lines marked "not money" are few and named here, so the mark is not a way round the rule', () => {
  const marked = [];
  for (const f of files(ROOT)) fs.readFileSync(f, 'utf8').split('\n').forEach((l, i) => { if (/not money:/.test(l)) marked.push(path.relative(ROOT, f) + ': ' + l.split('not money:')[1].trim()); });
  assert.deepStrictEqual(marked.sort(), [
    'messages.js: a count',
    'messages.js: milliseconds until the next message runs out',
    'messages.js: px on the screen',
    'messages.js: px on the screen',
    'messages.js: px on the screen',
    'messages.js: time',
    'messages.js: time',
  ]);
});

run('no money maths under screens/');
