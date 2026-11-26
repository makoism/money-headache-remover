/* screens/help.js: the one help piece, a "?" beside a heading and one or two plain lines under it (NORTH_STAR). */
'use strict';
const assert = require('assert');
const { test, run } = require('./harness');
const help = require('../help.js');

test('every key has one or two plain lines, no em dash, no comfort words (VOICE A1)', () => {
  for (const k of ['safeToSpend', 'status', 'period', 'periodMoved', 'lineShare']) {
    const w = help.WORDS[k];
    assert.ok(w && w.length >= 1 && w.length <= 2, k);
    for (const l of w) {
      assert.ok(!/—|–/.test(l), k + ': no em or en dash');
      assert.ok(!/(that's okay|and that is fine|no guilt|no shame|don't worry)/i.test(l), k + ': no comfort');
    }
  }
});
test('the period moved by a weekend or holiday names both days', () => {
  assert.deepStrictEqual(help.words('periodMoved', { due: '10 Jan', landed: '12 Jan' }),
    ['Your pay is due on 10 Jan, but that day is a weekend or a holiday, so it lands on 12 Jan. The pay period moves with it.']);
  assert.throws(() => help.words('periodMoved', {}), /needs due/);
  assert.throws(() => help.words('nope'), /no words/);
});
test('the button is a "?" with its key; the lines are hidden until tapped, several keys in one paragraph', () => {
  assert.match(help.button('safeToSpend'), /^<button type="button" class="burrow-help" data-help="safeToSpend" aria-expanded="false" aria-label="What this means">\?<\/button>$/);
  const t = help.text(['period', 'periodMoved'], { due: '10 Jan', landed: '12 Jan' });
  assert.match(t, /^<p class="burrow-help-text" data-helptext="period" hidden>Your money runs from one pay to the next, not by calendar month\. Your pay is due on 10 Jan/);
});

test('[coordinator 18 polish] the no Free to spend help adds to the card, never repeats its line', () => {
  const status = require('../status.js'), card = status.WORDS['reason.no_free'].text, t = help.text('noFree').replace(/<[^>]+>/g, ' ');
  assert.ok(!/leaves room for it/.test(t), t);
  assert.ok(!t.includes(card), t);
});

run('help.js');
