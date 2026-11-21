/* QC round 6 north-star gate 4: Help > Explain this tab on Home showed only "1 of 1 / Log spend". It walks Home card by card now,
   one short step per card that is on screen, mindset first and then what to tap. Steps whose card is hidden are skipped.
   Three walks at 390x844: the first open (sample numbers), own numbers with a low bank (status card on), and with More open.
   Made-up numbers.  Run: node tests/qc/qc13_explain_home.js */

const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 600)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const click = async (p, sel) => { await p.evaluate(s => { const e = document.querySelector(s); if (e) e.click(); }, sel); await w(600); };
/* every card Home can show */
const CARDS = ['#hMap .mp-now', '#mpRooms', '#hMap .mp-where', '#hMap .mp-four li:nth-child(1)', '#hMap .mp-four li:nth-child(2)', '#hMap .mp-four li:nth-child(3)', '#hMap .mp-four li:nth-child(4)', '#hMap .mp-proof',
  '#hStatus', '#hNext', '#hBk', '#moveBanner', '#hQuick', '#hBur', '#hMoreBtn', '#hHero', '#hSpend', '#hGoals', '#hDebts', '#hLimits', '#hBuckets', '#hMore'];
const shown = p => p.evaluate(cs => cs.filter(s => { const e = document.querySelector(s); if (!e) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !e.closest('[hidden]'); })
  .sort((x, y) => document.querySelector(x).compareDocumentPosition(document.querySelector(y)) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1), CARDS);   /* top to bottom as the page has them */
const coOpen = p => p.evaluate(() => { const c = document.querySelector('#co'); return !!c && !c.hidden && c.classList.contains('on'); });
async function walk(p, tag) {
  await L.tab(p, 'tab-home'); await p.evaluate(() => scrollTo(0, 0)); await w(400);
  const want = await shown(p);
  await click(p, '#helpBtn'); await click(p, '#helpTab'); await w(400);
  ck(tag + ': Explain this tab opens', await coOpen(p));
  const steps = [];
  for (let i = 0; i < 40 && await coOpen(p); i++) {
    await w(500);
    const s = await p.evaluate(cs => {
      /* the lit card: the one whose box, padded by 8 and kept inside the screen as the hole is, matches the hole */
      const h = document.querySelector('#coHole').getBoundingClientRect(), pop = document.querySelector('#coPop').getBoundingClientRect();
      const fit = c => { const x = document.querySelector(c); if (!x) return 1e9; const q = x.getBoundingClientRect(); if (!(q.width > 0 && q.height > 0)) return 1e9;
        return Math.abs(Math.max(6, q.top - 8) - h.top) + Math.abs(Math.max(6, q.left - 8) - h.left) + Math.abs(Math.min(innerHeight - 6, q.bottom + 8) - h.bottom) + Math.abs(Math.min(innerWidth - 6, q.right + 8) - h.right); };
      const best = cs.slice().sort((x, y) => fit(x) - fit(y))[0], e = fit(best) < 8 ? document.querySelector(best) : document.body, r = e.getBoundingClientRect();
      const ov = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
      return { n: document.querySelector('#coN').textContent, t: document.querySelector('#coT').textContent, b: document.querySelector('#coB').textContent, next: document.querySelector('#coNext').textContent,
        back: !document.querySelector('#coBack').hidden, card: cs.find(c => document.querySelector(c) === e) || null,
        vis: r.width > 0 && r.height > 0 && ov >= Math.min(40, r.height) && !e.closest('[hidden]'), hole: h.width > 0 && h.height > 0 && h.top < r.bottom && h.bottom > r.top,
        popOn: pop.top >= 0 && pop.bottom <= innerHeight + 1 };
    }, CARDS);
    steps.push(s);
    await click(p, '#coNext');
  }
  const cards = steps.map(s => s.card);
  ck(tag + ': one step per card on Home, in reading order', JSON.stringify(cards) === JSON.stringify(want), { want, cards });
  ck(tag + ': the count reads 1 of N up to N of N', steps.every((s, i) => s.n === `${i + 1} of ${steps.length}`), steps.map(s => s.n));
  ck(tag + ': each highlighted card is on screen and lit', steps.every(s => s.vis && s.hole), steps.filter(s => !(s.vis && s.hole)).map(s => s.t));
  ck(tag + ': the step box stays on screen', steps.every(s => s.popOn), steps.filter(s => !s.popOn).map(s => s.t));
  ck(tag + ': Next on every step but the last, Done on the last', steps.every((s, i) => s.next === (i === steps.length - 1 ? 'Done' : 'Next')), steps.map(s => s.next));
  ck(tag + ': Back only after the first step', steps.every((s, i) => s.back === (i > 0)), steps.map(s => s.back));
  ck(tag + ': Done closes it', !(await coOpen(p)));
  ck(tag + ': no em dashes, short sentences', steps.every(s => !/[—–]/.test(s.t + s.b) && s.b.split(/(?<=\.)\s/).every(x => x.split(' ').length <= 26)), steps.map(s => s.b).filter(b => /[—–]/.test(b) || b.split(/(?<=\.)\s/).some(x => x.split(' ').length > 26)));
  ck(tag + ': every step is short', steps.every(s => s.b.length <= 330), steps.filter(s => s.b.length > 330).map(s => s.t + ' ' + s.b.length));
  return steps;
}
(async () => {
  const { b, p, errs } = await R.phone({ w: 390, h: 844, dpr: 1, mobile: true, keep: true });
  await clock(p, '2026-11-19T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  /* 1. the first open: sample numbers, the bank question, the next step */
  const a = await walk(p, 'first open');
  const by = (st, t) => st.find(s => s.t === t);
  ck('first open: the bank step comes first and says to check the bank app', a.length && a[0].card === '#hMap .mp-now' && /bank app/i.test(a[0].b), a[0]);
  ck('first open: Where your money sits, the status card, Burrows and More each get a step', ['#hMap .mp-where', '#hStatus', '#hBur', '#hMoreBtn'].every(c => a.some(s => s.card === c)), a.map(s => s.card));
  /* 2. own numbers, a bank lower than the bills and Free to spend: the status card stays on Home, Check your bank and Log spend show */
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '¥'; });
  await L.base(p, { pay: 300000, bank: 300000, min: 0 }); await w(400); await skip(p);
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); });
  await L.tab(p, 'tab-home'); await w(300);
  if (await p.$('#mpCheck')) await click(p, '#mpCheck');
  await L.typeIn(p, '#mpBankIn', '100000'); await click(p, '#mpBankSave');
  const c = await walk(p, 'own numbers');
  const four = ['Total', 'Free to spend', 'Bills left', 'Saved'];
  ck('own numbers: the four boxes each get a step, in order', JSON.stringify(c.filter(s => /mp-four/.test(s.card || '')).map(s => s.t)) === JSON.stringify(four), c.map(s => s.t));
  const bank = c.find(s => s.card === '#hMap .mp-now') || {};
  ck('own numbers: the bank step names Check your bank', /Check your bank/.test(bank.b || ''), bank);
  const fts = c.find(s => s.card === '#hMap .mp-four li:nth-child(2)') || {};
  ck('own numbers: the Free to spend step says what planned and safe to spend mean', /planned/i.test(fts.b || '') && /safe to spend/i.test(fts.b || ''), fts);
  const where = c.find(s => s.card === '#hMap .mp-where') || {}, proof = c.find(s => s.card === '#hMap .mp-proof') || {};
  ck('own numbers: the proof line has its step and says the Total is bank plus burrows', /bank/i.test(proof.b || '') && /burrows/i.test(proof.b || '') && /Total/.test(proof.b || ''), proof);
  ck('own numbers: Where your money sits has its step', /end of the month/i.test(where.b || ''), where);
  ck('own numbers: the status card and Log spend each get a step', c.some(s => s.card === '#hStatus') && c.some(s => s.card === '#hQuick'), c.map(s => s.card));
  ck('own numbers: no step for a card that is not on screen (Main goal is behind More)', !c.some(s => s.card === '#hHero'), c.map(s => s.card));
  /* 3. More open: the cards behind it are walked too */
  await click(p, '#hMoreBtn');
  const m = await walk(p, 'More open');
  ck('More open: Main goal, Free to spend and Burrows behind More get steps', ['#hHero', '#hSpend', '#hGoals'].every(x => m.some(s => s.card === x)), m.map(s => s.card));
  await click(p, '#hMoreBtn');
  console.log('steps (own numbers):'); c.forEach(s => console.log('  ' + s.n + ' | ' + s.t + ' | ' + s.b));
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc13_explain_home: ${bad} FAIL` : 'qc13_explain_home: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc13_explain_home: FAIL'); process.exit(1); });
