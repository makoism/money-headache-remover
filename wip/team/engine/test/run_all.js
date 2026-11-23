#!/usr/bin/env node
// Every engine check in one command: node wip/team/engine/test/run_all.js
// The unit tests of each file, the platform checks, then every scenario ask (and again with realistic ids).
// Any failure fails the run, and the last line says so.
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const runs = ['dates.test.js', 'units.test.js', 'ids.test.js', 'schedules.test.js', 'ledger.test.js', 'lookahead.test.js', 'move.test.js', 'speed.test.js', 'platform.test.js', 'run_against_ref.js'];
let bad = 0;
for (const f of runs) {
  const r = spawnSync(process.execPath, [path.join(__dirname, f)].concat(f === 'run_against_ref.js' ? ['--fails'] : []), { encoding: 'utf8' });
  const out = ((r.stdout || '') + (r.stderr || '')).trim().split('\n');
  const lines = out.filter(l => /^FAIL|passed|ASKS|error/i.test(l));
  console.log(lines.join('\n'));
  if (r.status !== 0) { bad++; console.log(`  ${f} FAILED (exit ${r.status})`); }
}
console.log(bad ? `ENGINE CHECKS FAILED: ${bad} of ${runs.length}` : `ENGINE CHECKS ALL PASS (${runs.length} runs)`);
process.exit(bad ? 1 : 0);
