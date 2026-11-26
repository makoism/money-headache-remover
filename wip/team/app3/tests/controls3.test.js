#!/usr/bin/env node
/* The controls table (src/controls3.js; CONTROLS_PLAN section 4, BZ watch "rows from the lists"; M13, M3, M14). Counted,
   in node, no browser:
   1. every act3 list (PATHS) and every account type a spend can be paid from has a row;
   2. every PLAN3W step and every act3 action is named by a door (or listed as a helper);
   3. every step name the assistant's `change` tool offers is named by a door;
   4. every door not marked todo names only actions that exist and assistant steps the tool offers, and has a screen;
   5. a door marked todo says which slice builds it.
   It prints how many doors are still todo. A new list, account type, step or assistant step with no row fails here. */
'use strict';
const A3 = require('../src/act3.js'), W = require('../src/plan3_write.js'), CC = require('../src/chat3_core.js');
const T = require('../src/controls3.js');
let bad = 0, n = 0;
const ck = (name, v, more) => { n++; if (v) console.log('PASS ' + name); else { bad++; console.log('FAIL ' + name + (more ? ': ' + more : '')); } };
const rows = T.ROWS, doors = [];
for (const r of rows) for (const k of T.DOOR_KINDS) for (const d of [].concat(r[k] || [])) doors.push(Object.assign({ row: r.kind, door: k }, d));
const named = new Set(), aiNamed = new Set();
for (const d of doors) { for (const a of [].concat(d.action || [])) named.add(a); for (const a of [].concat(d.ai || [])) aiNamed.add(a); }

/* 1. lists and account types */
const lists = new Set(rows.map(r => r.list).filter(Boolean));
const noList = Object.keys(A3.PATHS).filter(l => !lists.has(l));
ck('every act3 list has a row', !noList.length, noList.join(', '));
const types = new Set([].concat(...rows.map(r => r.types || [])));
const noType = Object.keys(A3.SPEND_FROM || {}).filter(t => !types.has(t));
ck('act3 says which account types a spend can be paid from', Object.keys(A3.SPEND_FROM || {}).length > 3);
ck('every account type has a row', !noType.length, noType.join(', '));
/* 2. every step and action */
const steps = Object.keys(W).filter(k => typeof W[k] === 'function' && !T.HELPERS.includes(k));
const noStep = steps.filter(s => !named.has(s));
ck('every PLAN3W step is named by a door', !noStep.length, noStep.join(', '));
const acts = A3.ACTION_NAMES || [];
ck('act3 names its actions', acts.length >= 7, acts.join(','));
const noAct = acts.filter(a => !named.has(a));
ck('every act3 action is named by a door', !noAct.length, noAct.join(', '));
/* 3. every assistant step */
const change = CC.TOOLS.find(t => t.name === 'change'), DO = change.input_schema.properties.steps.items.properties.do.enum;
const noAi = DO.filter(a => !aiNamed.has(a));
ck('every assistant step is named by a door', !noAi.length, noAi.join(', '));
/* 4 and 5. each door */
const exists = a => typeof W[a] === 'function' || acts.includes(a) || T.OTHER_ACTIONS.includes(a);
const broken = [], noSlice = [];
for (const d of doors) {
  const where = d.row + '.' + d.door;
  for (const k of ['ai_todo', 'screen_todo']) if (d[k] && !/^(E\d+|later: )/.test(d[k])) noSlice.push(where + ' ' + k);
  if (d.todo) { if (!/^(E\d+|stage 2|later: .+)$/.test(d.todo)) noSlice.push(where); continue; }
  for (const a of [].concat(d.action || [])) if (!exists(a)) broken.push(where + ' action ' + a);
  for (const a of [].concat(d.ai || [])) if (!DO.includes(a)) broken.push(where + ' assistant ' + a + ' (not offered: mark the door todo with ai_todo)');
  if (!d.screen && !d.no_screen) broken.push(where + ' has no screen');
}
ck('every built door names real actions, offered assistant steps and a screen', !broken.length, broken.join('; '));
ck('every todo door says which slice builds it', !noSlice.length, noSlice.join(', '));
const todo = doors.filter(d => d.todo), aiTodo = doors.filter(d => !d.todo && d.ai_todo), scTodo = doors.filter(d => !d.todo && d.screen_todo);
console.log(`doors: ${doors.length}, built: ${doors.length - todo.length}, still todo: ${todo.length} (${todo.map(d => d.row + '.' + d.door + ' ' + d.todo).join('; ')}); built on the screens but not yet by asking: ${aiTodo.length} (${aiTodo.map(d => d.row + '.' + d.door + ' ' + d.ai_todo).join('; ')}); by asking but not on the screens after setup: ${scTodo.length} (${scTodo.map(d => d.row + '.' + d.door + ' ' + d.screen_todo).join('; ')})`);
console.log(bad ? `controls3: ${bad} of ${n} FAILED` : 'controls3: ALL PASS');
process.exit(bad ? 1 : 0);
