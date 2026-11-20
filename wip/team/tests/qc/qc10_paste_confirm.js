/* SF4 (QC8_NUMBERS_SHOULD_FIX.md): in yen, paste "1,234,567" in a receipt amount and tap Log: "more than all of your pay ... Tap again
   to log it anyway". Then paste "1.23456" over it: the box went back to 1,234,567 with no message, and the next tap logged ¥1,234,567,
   the earlier warning counting as the confirmation. The one right answer: a refused paste says why, and any change to the amount box
   (even one that ends on the same figure) takes back the earlier warning, so only a tap made right after reading it logs a big amount.
   Both receipt boxes: Receipts (#rcAmt) and the quick log on Home (#hAmt). Made-up numbers.
   Run: node tests/qc/qc10_paste_confirm.js */
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const paste = async (p, sel, v) => { await p.focus(sel); await p.evaluate(s => { const e = document.querySelector(s); e.select(); }, sel); await w(100);
  await p.evaluate((s, v) => { const e = document.querySelector(s), dt = new DataTransfer(); dt.setData('text/plain', v); e.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })); }, sel, v);
  await p.keyboard.sendCharacter(v); await w(400); };
const state = (p, box, msgId) => p.evaluate((box, msgId) => ({ box: Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').get.call(document.getElementById(box)),
  msg: document.getElementById(msgId).innerText.trim(), cheer: (document.getElementById('cheer') || {}).textContent || '', n: (__t.S.receipts || []).length,
  amounts: (__t.S.receipts || []).map(r => r.a) }), box, msgId);
const tapSave = async (p, id) => { await p.evaluate(id => document.getElementById(id).scrollIntoView({ block: 'center' }), id); await p.click('#' + id); await w(600); };

(async () => {
  const { b, p, errs } = await R.phone({ w: 390, h: 844, dpr: 1, mobile: true, keep: true });
  await clock(p, '2026-11-19T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '¥'; });
  await L.base(p, { pay: 300000, bank: 100000, min: 0 }); await w(300); await skip(p);
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); });

  /* each box gets its own figures, so the double-tap guard (the same receipt twice) never answers in place of the big-amount one */
  for (const [tabId, box, msgId, save, A, B] of [['tab-receipts', '#rcAmt', 'rcMsg', 'rcSave', '1,234,567', '2,345,678'], ['tab-home', '#hAmt', 'hMsg', 'hSave', '1,500,000', '2,600,000']]) {
    const num = x => +x.replace(/,/g, '');
    const tag = box === '#rcAmt' ? 'Receipts' : 'Home quick log';
    await L.tab(p, tabId); await w(400);
    if (!(await p.evaluate(s => { const e = document.querySelector(s); return !!(e && e.getClientRects().length); }, box))) {
      await p.evaluate(() => { const d = document.querySelector('.hquick details, #hQuick details, details.hlog'); if (d) d.open = true; }); await w(300); }
    const n0 = (await state(p, box.slice(1), msgId)).n;
    await paste(p, box, A); await tapSave(p, save);
    let s = await state(p, box.slice(1), msgId);
    ck(`${tag}: ${A} asks first ("Tap again to log it anyway"), nothing logged`, /Tap again to log it anyway/.test(s.msg) && s.n === n0, s);
    await paste(p, box, '1.23456');
    s = await state(p, box.slice(1), msgId);
    ck(`${tag}: pasting 1.23456 over it says why it was not taken`, /two digits after the point|whole|no decimals|isn't|wasn't|not taken/i.test(s.cheer + ' ' + s.msg), s);
    ck(`${tag}: the earlier "Tap again" warning is taken back once the box is changed`, !/Tap again/.test(s.msg), s);
    await tapSave(p, save);
    s = await state(p, box.slice(1), msgId);
    ck(`${tag}: the next tap does not log the big amount on the old warning; it asks again (${A})`, s.n === n0 && /Tap again to log it anyway/.test(s.msg), s);
    await tapSave(p, save);
    s = await state(p, box.slice(1), msgId);
    ck(`${tag}: a second tap right after reading the new warning still logs it (the person can say yes)`, s.n === n0 + 1 && s.amounts.includes(num(A)), s);
    /* the same figure typed again by hand also counts as a change: the warning comes back before a log */
    await paste(p, box, B); await tapSave(p, save);
    await p.focus(box); await p.keyboard.press('End'); await p.keyboard.press('Backspace'); await p.keyboard.type(B.slice(-1)); await w(300);
    s = await state(p, box.slice(1), msgId);
    ck(`${tag}: retyping the last digit takes the warning back too`, !/Tap again/.test(s.msg), s);
    await tapSave(p, save);
    s = await state(p, box.slice(1), msgId);
    ck(`${tag}: and the next tap asks again instead of logging`, s.n === n0 + 1 && /Tap again to log it anyway/.test(s.msg), s);
    await p.evaluate(s => { const e = document.querySelector(s); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(e, ''); }, box);
  }
  /* QC10 round 2 north-star 5: "Logged X" on Home stayed after the receipt was changed on Receipts; the line goes once the person leaves Home */
  await L.tab(p, 'tab-home'); await w(300);
  await p.focus('#hAmt'); await p.keyboard.type('540'); await tapSave(p, 'hSave');
  const lg1 = await p.evaluate(() => document.getElementById('hMsg').innerText.trim());
  await L.tab(p, 'tab-receipts'); await w(300); await L.tab(p, 'tab-home'); await w(300);
  const lg2 = await p.evaluate(() => document.getElementById('hMsg').innerText.trim());
  ck('Home: "Logged ¥540" shows after logging', /^Logged ¥540/.test(lg1), lg1);
  ck('Home: after going to Receipts and back the old "Logged" line is gone', lg2 === '', lg2);
  /* QC10 round 3 numbers blocker 2: Undo after a quick log takes the "Logged X" line away too */
  await p.focus('#hAmt'); await p.keyboard.type('4000'); await tapSave(p, 'hSave');
  await p.evaluate(() => document.getElementById('undoGo').click()); await w(800);
  const lg3 = await p.evaluate(() => document.getElementById('hMsg').innerText.trim());
  ck('Home: after Undo the "Logged ¥4,000" line is gone', !/Logged ¥4,000/.test(lg3), lg3);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc10_paste_confirm: ${bad} FAIL` : 'qc10_paste_confirm: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc10_paste_confirm: FAIL'); process.exit(1); });
