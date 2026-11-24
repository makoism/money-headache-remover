#!/usr/bin/env node
/* A bank below zero (MAKO_SAYS M36, M37, M47; SORTED K29), through the built page as a person uses it. Made-up yen only.
   A person who is overdrawn types what their bank shows, minus and all, at setup and at Check your bank. Home shows the
   figure with a plain amber line (never red, no shame), it is the same after a reload, and safe to spend and every sum
   on Home are the engine's for the kept book.

   Worked by hand, setup on 24 Nov 2026 with Bank A at -5,000, pay 300,000 on day 10, rent 80,000 on day 27:
     the bank today is -5,000; before the pay on 10 Dec the rent leaves, so the bank can spare
     -5,000 - 80,000 = -85,000: safe to spend is 0 and it is short by 85,000, below zero from today.
   Second person, setup on 24 Nov with Bank A at 300,000 and the same pay and rent; on 26 Nov the bank shows -5,000:
     300,000 - (-5,000) = 305,000 left the bank that nobody logged; the bank today is -5,000 and safe to spend is 0. */
'use strict';
const path = require('path');
const LA = require(path.join(__dirname, '../../engine/lookahead.js'));
const L = require('./lives3.js').make('e3_overdrawn');
const { ck, go, typeIn, txt, w } = L;
const { saveSections } = require('./setup_sections.js');
const amt = (p, sel) => p.$eval(sel, e => Number((e.dataset.amt !== undefined ? e : e.querySelector('[data-amt]')).dataset.amt)).catch(() => null);
/* the amber line on the bank card: its words, its classes and its colours as drawn */
const below = p => p.evaluate(() => {
  const el = document.querySelector('#a3Home [data-card=bank] [data-fig=belowzero]');
  if (!el) return null;
  const probe = document.createElement('p'); probe.className = 'a3-warn a3-bad'; document.body.appendChild(probe);
  const red = getComputedStyle(probe).color; probe.className = 'a3-warn'; const amber = getComputedStyle(probe).color; probe.remove();
  return { text: el.textContent.trim(), cls: el.className, color: getComputedStyle(el).color, red, amber };
});
const bankCardRed = p => p.$$eval('#a3Home [data-card=bank] .a3-bad, #a3Home [data-card=bank] .a3-bad-t', es => es.length);
async function setup(p, bank) {
  await p.click('#a3SetupGo'); await w(250);
  await p.fill('#s3BankName', 'Bank A');
  await typeIn(p, '#s3Bank', bank); await typeIn(p, '#s3PayAmt', '300000'); await p.selectOption('#s3PayDay', '10');
  await p.click('#s3AddBill'); await w(120);
  const row = '#a3Setup [data-sec=bills] [data-row]';
  await p.fill(`${row} [data-f=name]`, 'Rent'); await typeIn(p, `${row} [data-f=amount]`, '80000'); await p.selectOption(`${row} [data-f=day]`, '27');
  return saveSections(p);
}
/* Home against the engine, on the book the store keeps */
async function sameAsEngine(p, day, what) {
  await L.tab(p, 'home');
  const bk = await L.readBook(p), r = LA.lookahead(bk, day), id = Object.keys(r.accounts)[0];
  const bank = await amt(p, '#a3Home [data-card=bank] [data-fig=bank]'), safe = await amt(p, '#a3Home [data-fig=safe]'), short = await amt(p, '#a3Home [data-fig=short]');
  ck(`${what}: the bank figure is the engine's (${r.accounts[id].bank})`, bank === r.accounts[id].bank, bank);
  ck(`${what}: safe to spend is the engine's (${r.safeToSpend.headline})`, safe === r.safeToSpend.headline, safe);
  ck(`${what}: short by is the engine's (${r.safeToSpend.short && r.safeToSpend.short.amount})`, short === (r.safeToSpend.short ? r.safeToSpend.short.amount : null), short);
  return { r, id, bank, safe, short };
}
(async () => {
  /* ---- 1. at setup ---- */
  {
    const { c, p } = await L.open();
    await go(p, '2026-11-24');
    await p.click('#a3SetupGo'); await w(250);
    await typeIn(p, '#s3Bank', '-5000');
    const inv = await p.$eval('#s3Bank', e => e.getAttribute('aria-invalid')), err = await p.$eval('#a3Setup [data-err-for="s3Bank"]', e => e.textContent).catch(() => '');
    ck('setup: the bank box takes -5000 with no error next to it', inv !== 'true' && !err, `${inv} ${err}`);
    ck('setup: the box still shows -5000', (await p.$eval('#s3Bank', e => e.value)) === '-5000', await p.$eval('#s3Bank', e => e.value));
    await typeIn(p, '#s3PayAmt', '-300000');
    const payErr = await p.$eval('#a3Setup [data-err-for="s3PayAmt"]', e => e.textContent).catch(() => '');
    ck('setup: a pay below zero is still refused, in plain words', /below zero/.test(payErr), payErr);
    await p.reload(); await w(450);
    const e = await setup(p, '-5000');
    ck('setup: every section saves with the bank at -5,000', e === '', e);
    await p.click('#a3SetupSave'); await w(800);
    ck('setup: Home shows', await p.$eval('#a3Setup', x => x.hidden).catch(() => false), await txt(p, '#a3SetupErr'));
    const h = await sameAsEngine(p, '2026-11-24', 'setup');
    ck('setup: the bank today is -5,000', h.bank === -5000, h.bank);
    ck('setup: it is written with one minus sign, ¥5,000 below', /^−⁠?¥5,000$/.test((await txt(p, '#a3Home [data-card=bank] [data-fig=bank]')).trim()), await txt(p, '#a3Home [data-card=bank] [data-fig=bank]'));
    ck('setup: safe to spend is 0 and it is short by 85,000 (by hand: -5,000 - 80,000)', h.safe === 0 && h.short === 85000, `${h.safe} ${h.short}`);
    const why = await txt(p, '#a3Home [data-fig=shortwhy]');
    ck('setup: the sum under it ends at −¥85,000', /=\s*−⁠?¥85,000$/.test(why.trim()), why);
    const b = await below(p);
    ck('Home: a line on the bank card says it is below zero', !!b && /below zero/i.test(b.text), JSON.stringify(b));
    ck('Home: the line is amber, never red', !!b && /\ba3-warn\b/.test(b.cls) && !/a3-bad/.test(b.cls) && b.color === b.amber && b.color !== b.red, JSON.stringify(b));
    ck('Home: no shame in its words', !!b && !/overdr|debt|warning|careful|!/i.test(b.text), b && b.text);
    ck('Home: nothing on the bank card is red', (await bankCardRed(p)) === 0);
    const kept = await L.readBook(p), open = (kept.events || []).filter(x => x.k === 'open' || x.k === 'check');
    ck('the kept book holds the opening and its check at -5,000', open.length === 2 && open.every(x => x.a === -5000), JSON.stringify(open.map(x => [x.k, x.a])));
    await L.sameAfterReload(p, 'setup at -5,000');
    ck('after a reload the amber line is still there', !!(await below(p)));
    /* Check your bank on the same book: the sheet says what it expects with the same minus, and takes -12,000 */
    await p.click('#a3CheckGo'); await w(300);
    const exp = await txt(p, '#a3Check [data-expected]');
    ck('Check your bank: "Expected now −¥5,000"', /Expected now −⁠?¥5,000, last checked −⁠?¥5,000/.test(exp), exp);
    await p.fill('#a3Check [data-bankfig]', '-12000'); await p.$eval('#a3Check [data-bankfig]', x => x.dispatchEvent(new Event('input', { bubbles: true }))); await w(150);
    const gap = await txt(p, '#a3Check [data-gap]');
    ck('Check your bank: -12,000 leaves a gap of ¥7,000 that left the bank', /¥7,000 more left your bank than you logged/.test(gap), gap);
    await p.click('#a3CheckSave'); await w(600);
    ck('Check your bank: saved, no refusal', (await p.$eval('#a3Check', x => x.hidden)) === true, await txt(p, '#a3CheckErr'));
    const h2 = await sameAsEngine(p, '2026-11-24', 'checked at -12,000');
    ck('checked at -12,000: the bank today is -12,000', h2.bank === -12000, h2.bank);
    await L.sameAfterReload(p, 'checked at -12,000');
    await c.close();
  }
  /* ---- 2. a bank that was fine goes below zero at Check your bank, then comes back up ---- */
  {
    const { c, p } = await L.open();
    await go(p, '2026-11-24');
    const e = await setup(p, '300000');
    ck('second person: setup saves at 300,000', e === '', e);
    await p.click('#a3SetupSave'); await w(800);
    ck('second person: no below zero line while the bank is above zero', (await below(p)) === null);
    await go(p, '2026-11-26');
    await p.click('#a3CheckGo'); await w(300);
    await p.fill('#a3Check [data-bankfig]', '-5'); await p.click('#a3CheckSave'); await w(500);
    ck('Check your bank takes "-5" (the reviewer\'s own case)', (await p.$eval('#a3Check', x => x.hidden)) === true, await txt(p, '#a3CheckErr'));
    await L.tab(p, 'home');
    ck('the bank today is -5', (await amt(p, '#a3Home [data-card=bank] [data-fig=bank]')) === -5);
    await p.click('#a3CheckGo'); await w(300);
    await p.fill('#a3Check [data-bankfig]', '−5,000'); await p.click('#a3CheckSave'); await w(500);
    ck('Check your bank takes −5,000 typed with the long minus and a comma', (await p.$eval('#a3Check', x => x.hidden)) === true, await txt(p, '#a3CheckErr'));
    const h = await sameAsEngine(p, '2026-11-26', 'second person at -5,000');
    ck('second person: the bank today is -5,000 and safe to spend is 0', h.bank === -5000 && h.safe === 0, `${h.bank} ${h.safe}`);
    const b = await below(p);
    ck('second person: the amber line shows, not red', !!b && b.color === b.amber && !/a3-bad/.test(b.cls), JSON.stringify(b));
    await L.sameAfterReload(p, 'second person at -5,000');
    /* a card figure stays an amount owed: a minus there is still refused */
    await p.click('#a3CheckGo'); await w(300);
    await p.fill('#a3Check [data-bankfig]', '20000'); await p.click('#a3CheckSave'); await w(500);
    await L.tab(p, 'home');
    ck('back above zero at 20,000: the line is gone', (await below(p)) === null && (await amt(p, '#a3Home [data-card=bank] [data-fig=bank]')) === 20000);
    await c.close();
  }
  await L.finish();
})().catch(e => { console.log('FAIL e3_overdrawn crashed ' + (e && e.stack || e)); process.exit(1); });
