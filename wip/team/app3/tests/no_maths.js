#!/usr/bin/env node
/* RULE (like ../../tests/qc/display_math.js): app3's screens never do money maths. Every amount comes from the engine;
   a screen chooses, writes and places it. This reads every screen file in app3/src and lists each place that adds,
   takes away, multiplies, divides, rounds, totals or flips a sign. Every file in app3/src is a screen (the check-in
   writer is the engine's, engine/checkin.js) except the statements lane's two pure files, stmt3_read.js (dates and
   characters of a statement) and stmt3_plan.js (lines into records), and remind3.js (reminder days, dates only), tested in node.
   An exception needs a line in no_maths.allow:   file.js :: exact snippet :: the reason (never a money figure).
   Exit 1 on anything not allowed. Needs acorn and acorn-walk (tests/setup_env.sh installs them). */
'use strict';
const fs = require('fs'), path = require('path');
const TOOLS = process.env.TOOLS || '/home/claude/work/tools/node_modules/';
const acorn = require(TOOLS + 'acorn'), walk = require(TOOLS + 'acorn-walk');
const SRC = path.join(__dirname, '../src/');
const SCREENS = fs.readdirSync(SRC).filter(f => f.endsWith('.js') && !['stmt3_read.js', 'stmt3_plan.js', 'remind3.js'].includes(f));
const allow = fs.readFileSync(path.join(__dirname, 'no_maths.allow'), 'utf8').split('\n').filter(l => l.trim() && !l.startsWith('#'))
  .map(l => l.split(' :: ')).filter(x => x.length === 3 && x[2].trim()).map(([f, s]) => ({ f: f.trim(), s: s.trim(), used: 0 }));
const isStr = n => !!n && ((n.type === 'Literal' && typeof n.value === 'string') || n.type === 'TemplateLiteral' || (n.type === 'BinaryExpression' && n.operator === '+' && (isStr(n.left) || isStr(n.right))));
const finds = [];
for (const f of SCREENS) {
  const src = fs.readFileSync(SRC + f, 'utf8');
  const ast = acorn.parse(src, { ecmaVersion: 2022, locations: true });
  const add = (n, why) => {
    const snip = src.slice(n.start, n.end).replace(/\s+/g, ' ');
    const a = allow.find(x => x.f === f && snip.indexOf(x.s) >= 0 || (x.f === f && x.s.indexOf(snip) >= 0));
    if (a) { a.used++; return; }
    finds.push(`${f}:${n.loc.start.line}  ${why}: ${snip.slice(0, 90)}`);
  };
  walk.simple(ast, {
    BinaryExpression(n) { if ('+-*/%'.includes(n.operator) || n.operator === '**') { if (n.operator === '+' && (isStr(n.left) || isStr(n.right))) return; add(n, 'maths'); } },
    AssignmentExpression(n) { if (n.operator !== '=' && n.operator !== '||=' && n.operator !== '&&=' && n.operator !== '??=') add(n, 'maths'); },
    UnaryExpression(n) { if (n.operator === '-' && n.argument.type !== 'Literal') add(n, 'sign flipped'); },
    CallExpression(n) {
      const c = n.callee;
      if (c.type === 'MemberExpression' && c.object.type === 'Identifier' && c.object.name === 'Math') add(n, 'Math.' + (c.property.name || ''));
      if (c.type === 'MemberExpression' && /^(reduce|reduceRight|toFixed)$/.test(c.property.name || '')) add(n, 'total or rounding');
    }
  });
}
const unused = allow.filter(a => !a.used);
finds.forEach(x => console.log('FOUND ' + x));
unused.forEach(a => console.log('NOTE allow line not used: ' + a.f + ' :: ' + a.s));
console.log(`screen maths: ${finds.length} open, ${allow.length - unused.length} allowed with a reason, ${SCREENS.length} files read`);
console.log(finds.length ? 'NO MATHS FAIL' : 'NO MATHS PASS');
process.exit(finds.length ? 1 : 0);
