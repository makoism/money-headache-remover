/* LAUNCH_CHECKLIST.md v1 points on Home, on the built page. Made-up numbers.
   A1  Home asks what the bank app shows today, shows that balance first (before any planned figure), with the day it was typed, and labels
       every Home figure "now" or "planned". Typing a balance there saves it with today's date (cfg.bankAt, the same as Settings).
   A4  One line "You owe X" when cards, loans or debt goals exist, X the model's own figure (mapOf owed); no line when nothing is owed.
   Run: node tests/qc/v1_home.js */
let bad = 0; const ck = (n, c, x) => { console.log(c ? 'PASS' : 'FAIL', n, c ? '' : (x || '')); if (!c) bad++; };
const L = require('./lib_r12.js'); const R = L.R; const w = R.w;
const setup = async (p, extra) => {
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '$'; });
  await L.base(p, { pay: 3200, bank: 1500, min: 200, defs: { 'bill:rent': 1100, 'bill:food': 400, envelope: 300, education: 50, invest: 100, give: 30 }, tT: 1200, tM: 150, eT: 5000, eS: 900, eM: 200 });
  await p.evaluate(x => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true }; S.ui.sampleHidden = true; S.cfg.bankAt = x.at;
    if (!x.at) delete S.cfg.bankAt; if (x.card) S.plan.debts = [{ id: 'd1', name: 'Card', kind: 'card', balance: 1800, apr: 18, min: 60, extra: 0 }];
    __t.persist(); __t.restructure(); }, extra || {});
  await L.tab(p, 'tab-month'); await L.tab(p, 'tab-home'); await w(600);
  /* Set all to zero opens setup again, and leaving setup saves its balance box with today's date (ui45s leave): close it, then set the
     date the case needs, twice, since the tour can come back a moment later */
  for (let k = 0; k < 2; k++) {
    await w(500); for (let i = 0; i < 3; i++) { await p.evaluate(() => { const s = document.getElementById('tourSkip'); if (s && s.offsetParent) s.click(); }); await w(300); }
    await p.evaluate(x => { const S = __t.S; if (x.at) S.cfg.bankAt = x.at; else delete S.cfg.bankAt; __t.persist(); __t.restructure(); }, extra || {});
    await L.tab(p, 'tab-month'); await L.tab(p, 'tab-home'); await w(400);
  }
};
(async () => {
  let { b, p, errs } = await L.start({ w: 390, h: 844, dpr: 1, mobile: true, keep: true });
  await setup(p, { at: '2026-11-18' });
  const now = await p.evaluate(() => { const n = document.querySelector('#hMap .mp-now'), h = document.querySelector('#hMap .mp-h'); return n ? { t: n.innerText, first: !!h && !!(n.compareDocumentPosition(h) & Node.DOCUMENT_POSITION_FOLLOWING) } : null; });
  ck('A1 Home has an "In your bank now" card', !!now && /In your bank now/.test(now.t) && /\$1,500\b/.test(now.t), now && now.t);
  ck('A1 the bank now card comes before the planned month picture', !!now && now.first);
  ck('A1 the card is labelled "now" and says the day it was typed', !!now && /\bnow\b/.test(now.t) && /Balance you entered on 18 Nov/.test(now.t), now && now.t);
  const labels = await p.evaluate(() => [...document.querySelectorAll('#hMap .mp-four .mp-n')].map(e => e.innerText.replace(/\s+/g, ' ')));
  ck('A1 each of the four numbers says "planned" (' + labels.length + ')', labels.length === 4 && labels.every(s => /planned/i.test(s)), labels.join(' | '));
  const tags = await p.evaluate(() => ['#hMap .mp-h', '#hMap .mp-where-h', '#hBur h2'].map(s => { const e = document.querySelector(s); return e ? e.innerText : '(missing ' + s + ')'; }));
  ck('A1 "This month", "where your money sits" and Burrows are labelled planned', tags.every(t => /planned/i.test(t)), tags.join(' | '));
  /* check your bank, from Home */
  const ask0 = await p.evaluate(() => !!document.querySelector('#mpBankIn'));
  ck('A1 the question is folded away while a dated balance is there', !ask0);
  await p.evaluate(() => document.getElementById('mpCheck').click()); await w(400);
  const q = await p.evaluate(() => { const i = document.getElementById('mpBankIn'), l = i && document.querySelector('label[for="mpBankIn"]'); return l ? l.innerText : ''; });
  ck('A1 "Check your bank" asks "What does your bank app show today?"', /What does your bank app show today\?/.test(q), q);
  await L.typeIn(p, '#mpBankIn', '1640.5'); await p.evaluate(() => document.getElementById('mpBankSave').click()); await w(700);
  const st = await p.evaluate(() => ({ v: __t.S.cfg.bankStart, at: __t.S.cfg.bankAt, today: (d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'))(new Date()), t: (document.querySelector('#hMap .mp-now') || {}).innerText || '' }));
  ck('A1 the typed balance is saved with today\'s date (' + st.v + ', ' + st.at + ')', st.v === 1640.5 && st.at === st.today, JSON.stringify(st));
  ck('A1 the card shows the new balance', /\$1,640\.50/.test(st.t), st.t);
  /* a minus balance is allowed (overdrawn), letters are refused by the shared amount rule */
  await p.evaluate(() => document.getElementById('mpCheck').click()); await w(300);
  await L.typeIn(p, '#mpBankIn', '-120'); await p.evaluate(() => document.getElementById('mpBankSave').click()); await w(600);
  ck('A1 an overdrawn balance can be typed', await p.evaluate(() => __t.S.cfg.bankStart) === -120);
  /* no balance typed yet: Home asks at once (a fresh page: after the saves above, Set all to zero's kept copy can bring the dated balance back) */
  await b.close();
  ({ b, p, errs } = await L.start({ w: 390, h: 844, dpr: 1, mobile: true, keep: true }));
  await setup(p, { at: '' });
  const ask = await p.evaluate(() => { const n = document.querySelector('#hMap .mp-now'); return n ? { t: n.innerText, i: !!document.getElementById('mpBankIn') } : null; });
  ck('A1 with no balance typed yet, Home asks the question straight away', !!ask && ask.i && /What does your bank app show today\?/.test(ask.t) && !/Balance you entered/.test(ask.t), ask && ask.t);
  /* A4 */
  const owe0 = await p.evaluate(() => (document.getElementById('hMap').innerText.match(/You owe[^\n]*/) || [''])[0]);
  ck('A4 no "You owe" line when nothing is owed', owe0 === '', owe0);
  await setup(p, { at: '2026-11-18', card: true });
  const o = await p.evaluate(() => { const V = __t.viewOf ? null : null; const t = (document.getElementById('hMap').innerText.match(/You owe[^\n]*/) || [''])[0]; return { t, owed: __t.homeMap ? __t.homeMap().owed : null }; });
  const owed = await p.evaluate(() => { const C = __t.calcAll(__t.S); return C.byYm[C.months[0].ym].debts.d1.bal; });
  ck('A4 "You owe" line shows what is owed (' + o.t + ', card ' + owed + ')', new RegExp('You owe \\$' + owed.toLocaleString('en-US') + '\\b').test(o.t) && /planned/i.test(o.t), o.t);
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();
  console.log(bad ? 'V1 HOME FAIL ' + bad : 'V1 HOME PASS'); process.exit(bad ? 1 : 0);
})();
