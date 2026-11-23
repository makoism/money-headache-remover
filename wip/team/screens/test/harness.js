/* The smallest test runner: each test is a name and a function. Any failure makes the run fail and the last line says
   FAIL with the count. Nothing retries, and no passing summary is printed after a failure (sweep2_repeats A10). */
'use strict';
const tests = [];
function test(name, fn) { tests.push({ name, fn }); }
async function run(label) {
  let failed = 0;
  for (const t of tests) {
    try { await t.fn(); console.log('ok   ' + t.name); }
    catch (e) { failed++; console.log('FAIL ' + t.name + '\n     ' + String((e && e.stack) || e).split('\n').slice(0, 4).join('\n     ')); }
  }
  if (failed) { console.log(`FAIL ${label}: ${failed} of ${tests.length} failed`); process.exitCode = 1; }
  else console.log(`PASS ${label}: ${tests.length} of ${tests.length}`);
  return failed;
}
module.exports = { test, run };
