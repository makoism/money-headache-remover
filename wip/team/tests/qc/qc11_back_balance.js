/* QC round 4 money accuracy (confusing) and data safety (polish): in setup, a typed balance of -500, then Next, then Back, showed an
   empty Balance now box although -500 was kept; a typed 1250.40 came back as "1250.4". The box shows what was kept, as typed.
   Made-up numbers.  Run: node tests/qc/qc11_back_balance.js */
let bad = 0; const ck = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (x !== undefined) console.log('     saw ' + JSON.stringify(x).slice(0, 300)); } };
const R = require('/tmp/v39/real.js'); const w = R.w;
const PAGE = process.env.BUILD || '/home/claude/work/money-map-team.html';
const typeIn = async (p, id, v) => { await p.evaluate(id => { const e = document.getElementById(id); e.value = ''; e.focus(); }, id); await p.keyboard.type(v); await p.keyboard.press('Tab'); await w(250); };
const tap = async (p, id) => { await p.evaluate(id => { const n = document.getElementById(id); n && n.click(); }, id); await w(700); };
(async () => {
  for (const [typed, want] of [['-500', '-500'], ['1250.40', '1250.40']]) {
    const { b, p, errs } = await R.phone({ w: 412, h: 915, dpr: 1, mobile: true });
    await p.goto('file://' + PAGE + '?sfxtest'); await w(1500);
    for (let i = 0; i < 6 && !(await p.evaluate(() => !!document.querySelector('#tourBody input[name=tourCur]'))); i++) await tap(p, 'tourNext');
    await p.evaluate(() => { const i = [...document.querySelectorAll('#tourBody input[name=tourCur]')].find(x => x.value === '$'); i && i.click(); }); await w(400);
    for (let i = 0; i < 8 && !(await p.evaluate(() => !!document.getElementById('tourPay'))); i++) await tap(p, 'tourNext');
    await typeIn(p, 'tourPay', '3000'); await typeIn(p, 'tourBank', typed);
    await tap(p, 'tourNext'); await tap(p, 'tourBack');
    const v = await p.evaluate(() => { const e = document.getElementById('tourBank'); return e ? e.value : '(no box)'; });
    const kept = await p.evaluate(() => __t.S.cfg.bankStart);
    ck(`typed ${typed}: after Next and Back the box shows ${want} (kept ${kept})`, v === want, v);
    ck(`typed ${typed}: no page errors`, errs.length === 0, errs.slice(0, 2));
    await b.close();
  }
  console.log(bad ? `qc11_back_balance: ${bad} FAIL` : 'qc11_back_balance: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc11_back_balance: FAIL'); process.exit(1); });
