/* QC round 4 north-star agent check B1: in setup, Next with yen, then Back and Dollar, kept the yen minimum balance (20000) made from the
   yen sample pay, so a $3,000 plan was "Short" on Home under a $20,000 minimum. The default minimum is made again when the currency
   changes; a minimum the person typed is kept. Made-up numbers.  Run: node tests/qc/qc11_cur_min.js */
let bad = 0; const ck = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (x !== undefined) console.log('     saw ' + JSON.stringify(x).slice(0, 400)); } };
const R = require('/tmp/v39/real.js'); const w = R.w;
const PAGE = process.env.BUILD || '/home/claude/work/money-map-team.html';
const has = (p, id) => p.evaluate(id => !!document.getElementById(id), id);
const tapId = async (p, id) => { await p.evaluate(id => { const n = document.getElementById(id); n && n.click(); }, id); await w(700); };
const pickCur = (p, v) => p.evaluate(v => { const i = [...document.querySelectorAll('#tourBody input[name=tourCur]')].find(x => x.value === v); if (!i) return false; i.click(); return true; }, v);
const toPay = async p => { for (let i = 0; i < 8 && !(await has(p, 'tourPay')); i++) await tapId(p, 'tourNext'); return has(p, 'tourPay'); };
const toCur = async p => { for (let i = 0; i < 8 && !(await p.evaluate(() => !!document.querySelector('#tourBody input[name=tourCur]'))); i++) await tapId(p, 'tourBack'); return p.evaluate(() => !!document.querySelector('#tourBody input[name=tourCur]')); };
const typeIn = async (p, id, v) => { await p.evaluate(id => { const e = document.getElementById(id); e.value = ''; e.focus(); }, id); await p.keyboard.type(v); await p.keyboard.press('Tab'); await w(300); };
(async () => {
  for (const typed of [false, true]) {
    const { b, p, errs } = await R.phone({ w: 412, h: 915, dpr: 1, mobile: true });
    await p.goto('file://' + PAGE + '?sfxtest'); await w(1500);
    for (let i = 0; i < 6 && !(await p.evaluate(() => !!document.querySelector('#tourBody input[name=tourCur]'))); i++) await tapId(p, 'tourNext');
    ck(`[${typed ? 'typed' : 'default'}] the currency step shows`, await pickCur(p, '¥'));
    ck(`[${typed ? 'typed' : 'default'}] Next with yen reaches Your money`, await toPay(p));
    await tapId(p, 'tourNext');   /* leave Your money with yen: the default minimum is made from the yen pay */
    const yenMin = await p.evaluate(() => __t.S.cfg.minBank);
    if (typed) await p.evaluate(() => { __t.S.cfg.minBank = 7777; delete __t.S.ui.minAuto; __t.persist(); });   /* as Settings would keep a typed one */
    ck(`[${typed ? 'typed' : 'default'}] Back reaches the currency step`, await toCur(p));
    await pickCur(p, '$'); await w(500);
    await toPay(p); await typeIn(p, 'tourPay', '3000'); await typeIn(p, 'tourBank', '1500'); await tapId(p, 'tourNext');
    const s = await p.evaluate(() => ({ cur: __t.S.ui.cur, min: __t.S.cfg.minBank }));
    if (!typed) ck('Dollar after Back: the minimum is made again from the dollar pay ($300), not the yen 20000 (' + yenMin + ')', s.cur === '$' && s.min === 300, s);
    else ck('a minimum the person typed is kept when the currency changes', s.cur === '$' && s.min === 7777, s);
    ck(`[${typed ? 'typed' : 'default'}] no page errors`, errs.length === 0, errs.slice(0, 3));
    await b.close();
  }
  console.log(bad ? `qc11_cur_min: ${bad} FAIL` : 'qc11_cur_min: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc11_cur_min: FAIL'); process.exit(1); });
