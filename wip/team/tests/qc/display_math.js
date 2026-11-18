/* RULE: screens never do money maths.
   Every amount and every percent a person reads comes from the model (model.js, stmt.js) as a named value.
   A screen may choose, format and place a value. It may not add, subtract, round, clamp, negate or total one.

   This scanner reads the screen code in build order and lists every place that breaks the rule:
     amount   a value handed to fmt() / fmt2() that was worked out in screen code
     percent  a percent shown as text that was worked out in screen code
     bar      (listed with BARS=1, not yet enforced) a bar or fill sized by maths done in screen code

   Run:  node tests/qc/display_math.js            exit 1 if anything is found that is not in display_math.allow
         node tests/qc/display_math.js list       print every finding, allowed ones too
         BARS=1 node tests/qc/display_math.js list
   An exception needs a line in tests/qc/display_math.allow:   file.js | exact snippet | the reason
   Needs acorn and acorn-walk (tests/setup_env.sh installs them). */
const fs = require('fs'), path = require('path');
const TOOLS = process.env.TOOLS || '/home/claude/work/tools/node_modules/';
const acorn = require(TOOLS + 'acorn'), walk = require(TOOLS + 'acorn-walk');
const DIR = path.resolve(__dirname, '../..') + '/';
const MODE = process.argv[2] || 'check', BARS = !!process.env.BARS;

/* ---- the page's script, in build order, with a map back to file and line ---- */
const build = fs.readFileSync(DIR + 'build.sh', 'utf8');
const files = []; build.split('\n').filter(l => /^cat .*\.js/.test(l.trim())).forEach(l => l.replace(/\|.*$/, '').trim().split(/\s+/).slice(1).forEach(f => files.push(f)));
const MODEL_FILES = new Set(['model.js', 'stmt.js']);
let src = ''; const lineMap = [];
files.forEach(f => { const t = fs.readFileSync(DIR + f, 'utf8').replace(/\n?$/, '\n'); t.split('\n').slice(0, -1).forEach((_, i) => lineMap.push([f, i + 1])); src += t; });
const ast = acorn.parse(src, { ecmaVersion: 2022, locations: true });
const at = n => lineMap[n.loc.start.line - 1] || ['?', 0];
const text = n => src.slice(n.start, n.end).replace(/\s+/g, ' ');

/* ---- what the model offers: every top-level name in model.js and stmt.js ---- */
const MODEL = new Set(), UIFN = new Map();
ast.body.forEach(n => {
  const isModel = MODEL_FILES.has(at(n)[0]);
  const add = (name, fn) => { if (isModel) MODEL.add(name); else if (fn) UIFN.set(name, fn); };
  if (n.type === 'FunctionDeclaration') add(n.id.name, n);
  if (n.type === 'VariableDeclaration') n.declarations.forEach(d => { if (d.id.type === 'Identifier') add(d.id.name, d.init && /Function/.test(d.init.type) ? d.init : null); });
});
/* plain arithmetic helpers: using one in a screen is still doing the sum in the screen */
const ARITH = new Set(['sum', 'round2', 'flrCur', 'roundTo', 'niceUp', 'nice', 'clampAmt', 'niceStepFor', 'roundUnit']);
const FMT = new Set(['fmt', 'fmt2']);
const MATH = /^(round|floor|ceil|max|min|abs|sqrt|pow|trunc|hypot)$/;

/* ---- scopes: which function a node sits in, and what each function declares ---- */
const parentFn = new Map(), decls = new Map();   /* decls: fn node (or ast) -> Map(name -> [init nodes]) */
const declare = (fn, name, init) => { if (!decls.has(fn)) decls.set(fn, new Map()); const m = decls.get(fn); if (!m.has(name)) m.set(name, []); m.get(name).push(init || null); };
walk.ancestor(ast, {
  VariableDeclarator(n, _s, anc) { const fn = [...anc].reverse().find(a => /Function/.test(a.type)) || ast; parentFn.set(n, fn); if (n.id.type === 'Identifier') declare(fn, n.id.name, n.init); },
  AssignmentExpression(n, _s, anc) { const fn = [...anc].reverse().find(a => /Function/.test(a.type)) || ast; if (n.left.type === 'Identifier') declare(fn, n.left.name, n.operator === '=' ? n.right : n); },
  Function(n, _s, anc) { const fn = [...anc].slice(0, -1).reverse().find(a => /Function/.test(a.type)) || ast; parentFn.set(n, fn); n.params.forEach(p => { if (p.type === 'Identifier') declare(n, p.name, { type: 'Param' }); }); }
});
const lookup = (name, fn) => { for (let f = fn; f; f = f === ast ? null : (parentFn.get(f) || ast)) { const m = decls.get(f); if (m && m.has(name)) return { inits: m.get(name), fn: f }; } return null; };

/* ---- does this expression do arithmetic in screen code? returns a short reason, or '' ---- */
const fnMemo = new Map();
function fnInfo(name) {   /* a screen helper: does it return a worked-out number, or an object with worked-out fields? */
  if (fnMemo.has(name)) return fnMemo.get(name);
  const info = { ret: '', props: new Map() }; fnMemo.set(name, info);
  const f = UIFN.get(name); if (!f) return info;
  const rets = [];
  if (f.body.type !== 'BlockStatement') rets.push(f.body);
  else walk.ancestor(f.body, { ReturnStatement(r, _s, anc) { if (r.argument && !anc.slice(0, -1).some(a => /Function/.test(a.type))) rets.push(r.argument); } });
  rets.forEach(r => {
    let e = r; while (e.type === 'ConditionalExpression' || e.type === 'LogicalExpression' || e.type === 'ParenthesizedExpression') { e = e.type === 'ConditionalExpression' ? e.consequent : e.type === 'LogicalExpression' ? e.right : e.expression; }
    if (e.type === 'ObjectExpression') e.properties.forEach(p => { if (p.type === 'Property' && p.key && (p.key.name || p.key.value)) { const why = why0(p.value, f, new Set()); if (why) info.props.set(p.key.name || p.key.value, why); } });
    else { const why = why0(r, f, new Set()); if (why && !info.ret) info.ret = why; }
  });
  return info;
}
function why0(n, fn, seen) {
  if (!n) return '';
  switch (n.type) {
    case 'Literal': case 'Param': case 'ThisExpression': case 'TemplateElement': return '';
    case 'ParenthesizedExpression': return why0(n.expression, fn, seen);
    case 'TemplateLiteral': return '';   /* text */
    case 'BinaryExpression': {
      if ('+-*/%'.includes(n.operator) || n.operator === '**') {
        const str = y => (y.type === 'Literal' && typeof y.value === 'string') || y.type === 'TemplateLiteral';
        if (n.operator === '+' && (str(n.left) || str(n.right))) return why0(n.left, fn, seen) || why0(n.right, fn, seen);
        return 'maths: ' + text(n).slice(0, 60);
      }
      return '';   /* a comparison picks, it does not compute */
    }
    case 'UnaryExpression': if (n.operator === '-' && n.argument.type !== 'Literal') return 'sign flipped: ' + text(n).slice(0, 50); return n.operator === '+' ? why0(n.argument, fn, seen) : '';
    case 'ConditionalExpression': return why0(n.consequent, fn, seen) || why0(n.alternate, fn, seen);
    case 'LogicalExpression': return why0(n.left, fn, seen) || why0(n.right, fn, seen);
    case 'AssignmentExpression': return n.operator === '=' ? why0(n.right, fn, seen) : 'maths: ' + text(n).slice(0, 60);
    case 'UpdateExpression': return '';
    case 'CallExpression': {
      const c = n.callee;
      if (c.type === 'MemberExpression' && c.object.type === 'Identifier' && c.object.name === 'Math' && MATH.test(c.property.name || '')) return 'Math.' + c.property.name + ': ' + text(n).slice(0, 60);
      if (c.type === 'MemberExpression' && /^(reduce|reduceRight)$/.test(c.property.name || '')) return 'total made in the screen: ' + text(n).slice(0, 60);
      if (c.type === 'MemberExpression' && /^(toFixed|toLocaleString|toString|slice|trim)$/.test(c.property.name || '')) return why0(c.object, fn, seen);
      if (c.type === 'Identifier') {
        if (ARITH.has(c.name)) return c.name + '(): ' + text(n).slice(0, 60);
        if (c.name === 'Number' || c.name === 'parseFloat' || c.name === 'parseInt' || c.name === 'String') return n.arguments.map(a => why0(a, fn, seen)).find(Boolean) || '';
        if (MODEL.has(c.name)) return n.arguments.map(a => why0(a, fn, seen)).find(Boolean) || '';   /* the model worked it out; its inputs must not be screen maths either */
        if (UIFN.has(c.name)) { const i = fnInfo(c.name); if (i.ret) return 'screen helper ' + c.name + '() works it out (' + i.ret.slice(0, 50) + ')'; return ''; }
      }
      return '';
    }
    case 'MemberExpression': {
      if (n.object.type === 'Identifier' && !n.computed) {
        const d = lookup(n.object.name, fn);
        if (d) for (const init of d.inits) {
          if (!init) continue;
          let e = init; while (e && (e.type === 'ConditionalExpression' || e.type === 'LogicalExpression')) e = e.type === 'ConditionalExpression' ? e.consequent : e.right;
          if (e && e.type === 'ObjectExpression') { const p = e.properties.find(q => q.type === 'Property' && q.key && (q.key.name || q.key.value) === n.property.name); if (p) { const w = why0(p.value, d.fn, seen); if (w) return w; } }
          if (e && e.type === 'CallExpression' && e.callee.type === 'Identifier' && UIFN.has(e.callee.name)) { const w = fnInfo(e.callee.name).props.get(n.property.name); if (w) return 'screen helper ' + e.callee.name + '().' + n.property.name + ' (' + w.slice(0, 50) + ')'; }
        }
      }
      return '';
    }
    case 'Identifier': {
      const d = lookup(n.name, fn); if (!d) return '';
      const key = n.name + '@' + (d.fn.start || 0); if (seen.has(key)) return ''; seen.add(key);
      for (const init of d.inits) { if (!init || init.type === 'Param') continue; const w = why0(init, d.fn, seen); if (w) return n.name + ' = ' + w.replace(/^maths: /, ''); }
      return '';
    }
    default: return '';
  }
}

/* ---- the places a number is shown ---- */
const finds = [];
const fnOf = anc => [...anc].slice(0, -1).reverse().find(a => /Function/.test(a.type)) || ast;
const CSS = /(width|left|right|top|bottom|height|inset|flex-basis|stroke-dasharray|stroke-dashoffset|--[\w-]+)\s*[:=]\s*["']?\s*(calc\()?$/;
const push = (kind, n, anc, whyTxt) => { const [f, l] = at(n); if (MODEL_FILES.has(f)) return; finds.push({ kind, file: f, line: l, snip: text(n).slice(0, 110), why: whyTxt }); };
walk.ancestor(ast, {
  CallExpression(n, _s, anc) {
    if (n.callee.type === 'Identifier' && FMT.has(n.callee.name) && n.arguments[0]) { const w = why0(n.arguments[0], fnOf(anc), new Set()); if (w) push('amount', n, anc, w); }
  },
  TemplateLiteral(n, _s, anc) {
    n.expressions.forEach((e, i) => {
      const after = n.quasis[i + 1].value.raw, before = n.quasis[i].value.raw;
      if (!/^\s?%/.test(after)) return;
      const css = CSS.test(before);
      let inner = e; if (css && inner.type === 'BinaryExpression' && inner.operator === '*') { if (inner.right.type === 'Literal' && inner.right.value === 100) inner = inner.left; else if (inner.left.type === 'Literal' && inner.left.value === 100) inner = inner.right; }
      const w = why0(inner, fnOf(anc), new Set()); if (!w) return;
      if (css) { if (BARS) push('bar', e, anc, w); } else push('percent', e, anc, w);
    });
  },
  BinaryExpression(n, _s, anc) {
    if (n.operator !== '+' || !(n.right.type === 'Literal' && typeof n.right.value === 'string' && /^%/.test(n.right.value))) return;
    const par = anc[anc.length - 2], gp = anc[anc.length - 3];
    const css = (par && par.type === 'AssignmentExpression' && /\.style\b/.test(text(par.left))) || (par && par.type === 'CallExpression' && /setProperty/.test(text(par.callee))) || (gp && gp.type === 'CallExpression' && /setProperty/.test(text(gp.callee)));
    let inner = n.left; while (inner.type === 'ParenthesizedExpression') inner = inner.expression;
    if (css && inner.type === 'BinaryExpression' && inner.operator === '*' && inner.right.type === 'Literal' && inner.right.value === 100) inner = inner.left;
    const w = why0(inner, fnOf(anc), new Set()); if (!w) return;
    if (css) { if (BARS) push('bar', n, anc, w); } else push('percent', n, anc, w);
  }
});

/* ---- the allow list: exceptions with a reason ---- */
const allowFile = __dirname + '/display_math.allow';
const allow = fs.existsSync(allowFile) ? fs.readFileSync(allowFile, 'utf8').split('\n').filter(l => l.trim() && !l.startsWith('#')).map(l => l.split('|').map(x => x.trim())) : [];
const used = new Set();
const isAllowed = f => { const i = allow.findIndex(a => a[0] === f.file && f.snip.includes(a[1])); if (i >= 0) used.add(i); return i >= 0 && !!(allow[i][2] || '').trim(); };
const open = finds.filter(f => !isAllowed(f));
const show = f => `  ${f.kind.padEnd(7)} ${f.file}:${f.line}  ${f.snip}\n          why: ${f.why}`;
if (MODE === 'list') { finds.forEach(f => console.log(show(f) + (open.includes(f) ? '' : '   [allowed]'))); }
else open.slice(0, 200).forEach(f => console.log(show(f)));
const by = k => open.filter(f => f.kind === k).length;
allow.forEach((a, i) => { if (!used.has(i)) console.log('  unused allow line (remove it): ' + a.join(' | ')); });
console.log(`screen maths: ${open.length} open (amounts ${by('amount')}, percents ${by('percent')}${BARS ? ', bars ' + by('bar') : ''}), ${finds.length - open.length} allowed with a reason, ${files.length} files read`);
console.log(open.length ? 'FAIL screens do money maths' : 'PASS screens only show what the model worked out');
process.exit(open.length ? 1 : 0);
