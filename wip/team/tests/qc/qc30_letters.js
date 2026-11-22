/* QC round 10 numbers gate should-fix 1: letters inside an amount were dropped and the rest logged: "1o0" logged 10, "1a2" 12, "12a" 12,
   "1e3" 13, and "12.3.4" logged 12.34. Now a receipt amount with a letter or a second point is refused when it is logged, with a plain
   message, and the box keeps what was typed so it can be fixed. A clean amount then logs as before. Log spend on Receipts and on Home,
   typed and pasted. Made-up numbers.  Run: PAGE=/abs/money-map-team.html node tests/qc/qc30_letters.js */
const PAGE = process.env.PAGE || process.env.BUILD || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
(async () => {
  const { b, p, errs } = await L.start({ w: 390, h: 844, dpr: 1, mobile: true });
  const n = () => p.evaluate(() => (__t.S.receipts || []).length);
  const raw = id => p.evaluate(id => Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').get.call(document.getElementById(id)), id);
  const go = async box => { if (box === 'rcAmt') await L.tab(p, 'tab-receipts'); else { await L.tab(p, 'tab-home'); await p.evaluate(() => { const q = document.getElementById('hQuick'); q && q.classList.remove('v1x'); }); } };
  const clear = box => p.evaluate(id => { const e = document.getElementById(id); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(e, ''); delete e.dataset.neg; }, box);
  const log = async box => { await p.click(box === 'rcAmt' ? '#rcSave' : '#hSave'); await w(500); return p.evaluate(id => (document.getElementById(id) || {}).innerText || '', box === 'rcAmt' ? 'rcMsg' : 'hMsg'); };
  for (const box of ['rcAmt', 'hAmt']) {
    for (const s of ['1o0', '1a2', '12a', '1e3', '12.3.4']) {
      await go(box); await clear(box);
      const n0 = await n();
      await p.focus('#' + box); await p.keyboard.type(s, { delay: 40 }); await w(200);
      const msg = await log(box);
      ck(`${box} "${s}": nothing is logged`, await n() === n0, await n() - n0);
      ck(`${box} "${s}": the box keeps "${s}"`, await raw(box) === s, await raw(box));
      ck(`${box} "${s}": a plain message says it is not an amount`, new RegExp('"' + s.replace(/\./g, '\\.') + '" is not an amount').test(msg), msg);
    }
    /* pasted the same way */
    await go(box); await clear(box); const n1 = await n();
    await p.focus('#' + box);
    await p.evaluate(id => { const e = document.getElementById(id), dt = new DataTransfer(); dt.setData('text/plain', '1o0'); e.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })); }, box);
    await p.keyboard.sendCharacter('1o0'); await w(200);
    const pm = await log(box);
    ck(`${box} pasted "1o0": nothing is logged and the message says why`, await n() === n1 && /"1o0" is not an amount/.test(pm), [await n() - n1, pm, await raw(box)]);
    /* fixed: a clean amount logs as before */
    await clear(box); await p.focus('#' + box); const good = box === 'rcAmt' ? '100' : '101'; await p.keyboard.type(good, { delay: 40 }); await w(200);
    const n2 = await n(); const okm = await log(box);
    const last = await p.evaluate(() => (__t.S.receipts || []).slice(-1)[0]);
    ck(`${box} "${good}" after a refusal: logged as ${good}`, await n() === n2 + 1 && last && last.a === +good, [okm, last]);
  }
  ck('no page errors', errs.length === 0, errs.slice(0, 3));
  await b.close();
  console.log(bad ? `qc30_letters: ${bad} FAIL` : 'qc30_letters: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc30_letters: FAIL'); process.exit(1); });
