// A tiny test helper for the engine's own tests: plain node, no dependencies.
// Each test file calls t(name, fn); its last line says how many passed and failed, and a failure exits 1.
'use strict';
const assert = require('assert');
let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; }
  catch (e) { fail++; console.log('FAIL ' + name + ': ' + (e && e.message)); }
}
function done(file) {
  console.log(`${file}: ${pass} passed, ${fail} failed`);
  if (fail) process.exitCode = 1;
}
module.exports = { t, done, eq: assert.deepStrictEqual, ok: assert.ok, throws: assert.throws };
