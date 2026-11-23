/* The screens' shared pieces in Chromium, loaded as plain scripts the way a page loads them. Made-up amounts only.
   Starts its own browser and closes it; it never kills other browsers. */
'use strict';
const assert = require('assert');
const path = require('path');
const { chromium } = require('playwright');
const { test, run } = require('./harness');
const status = require('../status.js');
const money = require('../money.js');
const { lookahead } = require('../../foundation_review/ref/lookahead_ref.js');

const DIR = path.join(__dirname, '..');
const ORDER = ['money', 'names', 'provenance', 'messages', 'inputs', 'status'];
let browser, errors = [];

async function page(opts) {
  const ctx = await browser.newContext(opts || {});
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(String(e)));
  await p.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width"></head><body></body></html>');
  for (const n of ORDER) await p.addScriptTag({ path: path.join(DIR, n + '.js') });
  return p;
}

test('every piece loads as a plain script and registers on BurrowScreens', async () => {
  const p = await page();
  const got = await p.evaluate(() => Object.keys(window.BurrowScreens).sort());
  assert.deepStrictEqual(got, ORDER.slice().sort());
  assert.deepStrictEqual(errors, []);
  await p.context().close();
});

test('the browser writes amounts exactly as node does', async () => {
  const p = await page();
  const cases = [[123450, 'USD'], [-1500, 'JPY'], [1999, 'CHF'], [1234, 'BHD'], [0, 'EUR']];
  const got = await p.evaluate(c => c.map(([n, k]) => BurrowScreens.money.format(n, k)), cases);
  assert.deepStrictEqual(got, cases.map(([n, k]) => money.format(n, k)));
  await p.context().close();
});

test('the browser gives the same status as node for the same engine result', async () => {
  const p = await page();
  const r = lookahead(require('../../foundation_review/scenarios/freelancer.json'), '2027-02-04', {});
  const ctx = { currency: 'PHP', origin: 'typed', names: { ewallet: 'E-wallet' } };
  const got = await p.evaluate(([r, c]) => BurrowScreens.status.statusOf(r, c).text, [r, ctx]);
  assert.deepStrictEqual(got, JSON.parse(JSON.stringify(status.statusOf(r, ctx).text)));
  await p.context().close();
});

const BOXES = `<label>Rent <input id="amt" value="1212"></label><label>Goal name <input id="name" value="Trip"></label><button id="other">Other</button>`;
async function boxes(p) {
  await p.evaluate(html => {
    document.body.insertAdjacentHTML('beforeend', html);
    window.got = [];
    BurrowScreens.inputs.bind(document.getElementById('amt'), { kind: 'amount', code: 'JPY', onValue: v => window.got.push(v) });
    BurrowScreens.inputs.bind(document.getElementById('name'), { kind: 'text' });
  }, BOXES);
}

test('a click into an amount box, then typing, replaces the old value (not "1,212250")', async () => {
  const p = await page(); await boxes(p);
  await p.click('#amt');
  await p.keyboard.type('250');
  await p.click('#other');
  assert.strictEqual(await p.inputValue('#amt'), '250');
  assert.deepStrictEqual(await p.evaluate(() => window.got), [250]);
  await p.context().close();
});

test('a click into a name box, then typing, replaces it (not "TripLisbon")', async () => {
  const p = await page(); await boxes(p);
  await p.click('#name');
  await p.keyboard.type('Lisbon');
  assert.strictEqual(await p.inputValue('#name'), 'Lisbon');
  await p.context().close();
});

test('a tap on a phone does the same', async () => {
  const p = await page({ hasTouch: true, isMobile: true, viewport: { width: 375, height: 700 } }); await boxes(p);
  await p.tap('#amt');
  await p.keyboard.type('90');
  await p.tap('#other');
  assert.strictEqual(await p.inputValue('#amt'), '90');
  await p.context().close();
});

test('Tab into a box selects it too; a second click while open puts the caret down for a small fix', async () => {
  const p = await page(); await boxes(p);
  await p.click('#amt');
  await p.keyboard.press('Tab');
  const sel = await p.evaluate(() => { const e = document.getElementById('name'); return [e.selectionStart, e.selectionEnd, e.value.length]; });
  assert.deepStrictEqual(sel, [0, 4, 4]);
  await p.click('#name');
  const caret = await p.evaluate(() => { const e = document.getElementById('name'); return e.selectionStart === e.selectionEnd; });
  assert.ok(caret, 'second click keeps a caret');
  await p.context().close();
});

test('a box a form focuses by itself is selected, and the first tap or click after that still selects (not "121,200")', async () => {
  for (const how of ['click', 'tap']) {
    const p = await page(how === 'tap' ? { hasTouch: true, isMobile: true, viewport: { width: 375, height: 700 } } : undefined); await boxes(p);
    await p.evaluate(() => document.getElementById('amt').focus());
    const sel = await p.evaluate(() => { const e = document.getElementById('amt'); return [e.selectionStart, e.selectionEnd]; });
    assert.deepStrictEqual(sel, [0, 4], how + ': focus from code selects');
    await p[how]('#amt');
    await p.keyboard.type('12000');
    assert.strictEqual(await p.inputValue('#amt'), '12000', how + ': first press after focus from code');
    await p[how]('#amt');
    const caret = await p.evaluate(() => { const e = document.getElementById('amt'); return e.selectionStart === e.selectionEnd; });
    assert.ok(caret, how + ': a press after typing is a small fix');
    await p.context().close();
  }
});

test('a bound amount box carries the shared marker', async () => {
  const p = await page(); await boxes(p);
  assert.strictEqual(await p.getAttribute('#amt', 'data-input'), 'amount');
  assert.strictEqual(await p.getAttribute('#name', 'data-input'), 'text');
  await p.context().close();
});

test('an amount that can\'t be read stays as typed and the box says why', async () => {
  const p = await page(); await boxes(p);
  await p.click('#amt');
  await p.keyboard.type('15.5');
  await p.click('#other');
  assert.strictEqual(await p.inputValue('#amt'), '15.5');
  assert.strictEqual(await p.getAttribute('#amt', 'aria-invalid'), 'true');
  assert.strictEqual(await p.getAttribute('#amt', 'data-error'), 'Yen has no decimals. Type a whole amount');
  assert.deepStrictEqual(await p.evaluate(() => window.got), []);
  await p.context().close();
});

test('messages never cover a control: one band, its own slot, every button still reachable', async () => {
  for (const viewport of [{ width: 320, height: 568 }, { width: 1280, height: 800 }]) {
    const p = await page({ viewport });
    await p.evaluate(() => {
      const s = document.createElement('style'); s.textContent = BurrowScreens.messages.BAND_CSS + '\nbody{margin:0}button{min-height:44px}'; document.head.appendChild(s);
      const many = Array.from({ length: 30 }, (x, i) => `<button class="ctl">Log spend ${i}</button>`).join('');
      document.body.innerHTML = `<div class="burrow-shell"><header><button class="ctl">Help</button></header><main class="burrow-main">${many}</main><div id="band"></div><nav><button class="ctl">Home</button><button class="ctl">Plan</button></nav></div>`;
      window.q = BurrowScreens.messages.mount(document.getElementById('band'));
      q.post({ kind: 'notice', text: 'Saved to the cloud', key: 'sync', source: 'sync' });
      q.post({ kind: 'toast', text: 'Logged' });
      q.post({ kind: 'undo', text: 'Spend removed', action: { label: 'Undo', run: () => {} } });
    });
    const bad = await p.evaluate(() => {
      const out = [];
      if (document.querySelectorAll('[data-msg]').length !== 1) out.push('messages shown: ' + document.querySelectorAll('[data-msg]').length);
      const band = document.getElementById('band').getBoundingClientRect(), main = document.querySelector('main').getBoundingClientRect();
      if (band.height === 0) out.push('band is empty');
      if (band.top < main.bottom - 0.5 && band.bottom > main.top + 0.5) out.push('band overlaps the page');
      for (const b of document.querySelectorAll('.ctl')) {
        b.scrollIntoView({ block: 'nearest' });
        const r = b.getBoundingClientRect(), at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        if (at !== b && !b.contains(at)) out.push(b.textContent + ' is covered by ' + (at ? at.outerHTML.slice(0, 60) : 'nothing'));
      }
      return out;
    });
    assert.deepStrictEqual(bad, [], JSON.stringify(viewport));
    await p.click('text=Undo');
    assert.strictEqual(await p.textContent('#band'), 'Logged');
    await p.context().close();
  }
});

test('the audit finds a sample figure on the person\'s screen and a figure with no mark', async () => {
  const p = await page();
  const out = await p.evaluate(() => {
    const pv = BurrowScreens.provenance;
    document.body.innerHTML = '<section id="s" data-origin="typed"><b data-figure="safeToSpend.headline" id="a"></b><b data-figure="total.amount" id="b"></b><b data-figure="accounts.*.bank" id="c"></b></section>';
    pv.stamp(document.getElementById('a'), pv.mark(182000, 'worked'));
    pv.stamp(document.getElementById('b'), pv.mark(300000, 'sample'));
    return pv.audit(document.getElementById('s'));
  });
  assert.deepStrictEqual(out, ['total.amount: sample value on a typed screen', 'accounts.*.bank: no typed-or-sample mark']);
  await p.context().close();
});

(async () => {
  browser = await chromium.launch();
  try { await run('screens in Chromium'); }
  finally { await browser.close(); }
})().catch(e => { console.log('FAIL screens in Chromium: ' + e.message); process.exitCode = 1; });
