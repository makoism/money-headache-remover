/* QC round 10 money accuracy blocker 1: when Free to spend is held back to keep the bank at its minimum, Home showed "Free to spend $0"
   on the four numbers and on the This month chest, while the month-end bank still counted the planned $73.44 as spent, so $73.44 was
   nowhere on Home. Both now show the planned figure and say how much of it is safe to spend: "$73.44", "planned: left in Nov, $0 safe
   to spend". Case from the agent: setup at 390, dollars, pay 1,000.10, balance 0.01, rent 333.33, food 333.33 (minimum balance 100).
   Run: BUILD=/abs/money-map-team.html node tests/qc/qc28_held_free.js */
let bad = 0; const ck = (n, c, x) => { console.log(c ? 'PASS' : 'FAIL', n, c ? '' : JSON.stringify(x === undefined ? '' : x).slice(0, 400)); if (!c) bad++; };
const R = require('/tmp/v39/real.js'); const w = R.w;
const PAGE = 'file://' + (process.env.BUILD || process.env.PAGE || '/home/claude/work/money-map-team.html') + '?sfxtest';
const o = { cur: '$', pay: '1000.10', bank: '0.01', bills: { 'Rent or mortgage': '333.33', 'Food and groceries': '333.33' } };
(async () => {
  const { b, p, errs } = await R.phone({ w: 390, h: 844, dpr: 1, mobile: true });
  await p.goto(PAGE); await w(2500);
  const typ = async (sel, v) => { if (v === undefined) return; await p.click(sel, { count: 3 }); await p.keyboard.press('Backspace'); await p.type(sel, String(v)); };
  for (let i = 0; i < 24; i++) {
    const flat = await p.evaluate(() => { const t = document.querySelector('#tour'); return t && t.getClientRects().length && document.querySelector('#tourNext') ? t.innerText.replace(/\n+/g, ' / ') : null; });
    if (!flat) break;
    if (/Currency/.test(flat)) { await p.evaluate(c => { const r = [...document.querySelectorAll('#tour input[type=radio]')].find(x => x.value === c); r && r.click(); }, o.cur); await w(300); }
    if (await p.$('#tourPay')) { await typ('#tourPay', o.pay); await typ('#tourBank', o.bank); }
    if (await p.$('#tourAmt')) { const name = flat.split(' / ')[4]; await typ('#tourAmt', o.bills[name]); }
    try { await p.click('#tourNext'); } catch (e) { break; } await w(800);
  }
  await w(1500); await p.click('#tab-home'); await w(1500);
  const r = await p.evaluate(() => {
    const t = s => (s || '').replace(/⁠/g, '').replace(/\s+/g, ' ').trim();
    const tile = [...document.querySelectorAll('.mp-four li')].map(li => t(li.innerText)).find(x => /^Free to spend/.test(x)) || '';
    const chest = t(((document.querySelector('#mpRooms [data-room="play"]') || {}).innerText) || '');
    const proof = t(((document.querySelector('.mp-proof') || {}).innerText) || '');
    return { tile, chest, proof };
  });
  ck('the case is the held one: the month-end bank is $0.01', /^Bank \$0\.01 \+/.test(r.proof), r);
  ck('the Free to spend tile shows the planned $73.44', /^Free to spend \$73\.44 /.test(r.tile), r.tile);
  ck('...and says $0 of it is safe to spend', /\$0(\.00)? safe to spend/.test(r.tile), r.tile);
  ck('the This month chest shows $73.44 too', /\$73\.44/.test(r.chest), r.chest);
  ck('...and says $0 of it is safe to spend', /\$0(\.00)? safe to spend/.test(r.chest), r.chest);
  ck('no page errors', errs.length === 0, errs);
  await b.close();
  console.log(bad ? 'qc28_held_free: ' + bad + ' FAIL' : 'qc28_held_free: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed ' + e.stack); console.log('qc28_held_free: FAIL'); process.exit(1); });
