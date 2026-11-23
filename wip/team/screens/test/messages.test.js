/* screens/messages.js: one message queue, one message shown at a time in one band (sweep2_repeats A7). */
'use strict';
const assert = require('assert');
const { test, run } = require('./harness');
const msgs = require('../messages.js');

/* a clock the test moves by hand */
function fakeClock() {
  let t = 0, timers = [], n = 0;
  return {
    now: () => t,
    setTimeout: (fn, ms) => { const id = ++n; timers.push({ id, at: t + ms, fn }); return id; },
    clearTimeout: id => { timers = timers.filter(x => x.id !== id); },
    tick(ms) { const end = t + ms; for (;;) { timers.sort((a, b) => a.at - b.at); const x = timers[0]; if (!x || x.at > end) break; timers.shift(); t = x.at; x.fn(); } t = end; },
  };
}
const make = () => { const c = fakeClock(); const q = msgs.createQueue({ now: c.now, setTimeout: c.setTimeout, clearTimeout: c.clearTimeout }); return { c, q }; };
const shown = q => (q.current() ? q.current().text : null);

test('a toast shows, then goes by itself', () => {
  const { c, q } = make();
  q.post({ kind: 'toast', text: 'Saved' });
  assert.strictEqual(shown(q), 'Saved');
  c.tick(msgs.LIFE.toast);
  assert.strictEqual(shown(q), null);
});

test('only one message is ever shown; the rest wait their turn', () => {
  const { c, q } = make();
  q.post({ kind: 'toast', text: 'Logged' });
  q.post({ kind: 'toast', text: 'Card saved' });
  assert.strictEqual(shown(q), 'Card saved');
  assert.strictEqual(q.waiting(), 1);
});

test('a toast that ran out of time while waiting is dropped, never shown late', () => {
  const { c, q } = make();
  q.post({ kind: 'toast', text: 'Logged' });
  q.post({ kind: 'undo', text: 'Spend removed', action: { label: 'Undo', run: () => {} } });
  c.tick(msgs.LIFE.undo);
  assert.strictEqual(shown(q), null);
});

test('an Undo comes before toasts and notices, and its button runs once and closes it', () => {
  const { q } = make();
  let undone = 0;
  q.post({ kind: 'notice', text: 'Your other device is newer', key: 'sync' });
  q.post({ kind: 'toast', text: 'Logged' });
  const id = q.post({ kind: 'undo', text: 'Spend removed', action: { label: 'Undo', run: () => { undone++; } } });
  assert.strictEqual(shown(q), 'Spend removed');
  q.act(id); q.act(id);
  assert.strictEqual(undone, 1);
  assert.strictEqual(shown(q), 'Logged');
});

test('two Undos: the newest shows, the older one stays reachable after it and keeps its own time', () => {
  const { c, q } = make();
  q.post({ kind: 'undo', text: 'Bill removed', action: { label: 'Undo', run: () => {} } });
  c.tick(2000);
  const b = q.post({ kind: 'undo', text: 'Spend removed', action: { label: 'Undo', run: () => {} } });
  assert.strictEqual(shown(q), 'Spend removed');
  q.dismiss(b);
  assert.strictEqual(shown(q), 'Bill removed');
  c.tick(msgs.LIFE.undo - 2000);
  assert.strictEqual(shown(q), null);
});

test('a notice from sync or the move stays until it is closed, and one key holds one message', () => {
  const { c, q } = make();
  q.post({ kind: 'notice', text: 'Saving to the cloud', key: 'sync' });
  q.post({ kind: 'notice', text: 'Saved to the cloud', key: 'sync' });
  assert.strictEqual(shown(q), 'Saved to the cloud');
  assert.strictEqual(q.waiting(), 0);
  c.tick(3600000);
  assert.strictEqual(shown(q), 'Saved to the cloud');
  q.dismiss(q.current().id);
  assert.strictEqual(shown(q), null);
});

test('a toast posted over a notice shows, then the notice comes back', () => {
  const { c, q } = make();
  q.post({ kind: 'notice', text: 'Your numbers moved to the new version', key: 'move' });
  q.post({ kind: 'toast', text: 'Logged' });
  assert.strictEqual(shown(q), 'Logged');
  c.tick(msgs.LIFE.toast);
  assert.strictEqual(shown(q), 'Your numbers moved to the new version');
});

test('the same toast twice in a row shows once', () => {
  const { q } = make();
  q.post({ kind: 'toast', text: 'Saved' });
  q.post({ kind: 'toast', text: 'Saved' });
  assert.strictEqual(q.waiting(), 0);
});

test('a message needs a known kind and some words; an Undo needs its action', () => {
  const { q } = make();
  assert.throws(() => q.post({ kind: 'popup', text: 'x' }), /kind/);
  assert.throws(() => q.post({ kind: 'toast', text: '' }), /words/);
  assert.throws(() => q.post({ kind: 'undo', text: 'Removed' }), /action/);
});

test('every change is told to the band, so the band is the only place a message appears', () => {
  const c = fakeClock(); const seen = [];
  const q = msgs.createQueue({ now: c.now, setTimeout: c.setTimeout, clearTimeout: c.clearTimeout, onChange: m => seen.push(m ? m.text : null) });
  q.post({ kind: 'toast', text: 'Saved' });
  c.tick(msgs.LIFE.toast);
  assert.deepStrictEqual(seen, ['Saved', null]);
});

run('messages.js');
