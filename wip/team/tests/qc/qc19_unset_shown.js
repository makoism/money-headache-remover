/* QC round 7 money accuracy blocker 1: a burrow that holds money but has no goal amount ("Unset") disappeared from Home's bar and Burrows grid
   while its money still counted in Saved and the proof line ("Bank $3,145 + burrows $640" with only $440 of pieces shown).
   Every burrow that holds money shows on Home ("Emergency fund $200, no goal yet") and the pieces add up to Saved. Also the tiny case ($1 saved).
   Made-up numbers.  Run: node tests/qc/qc19_unset_shown.js */

const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const num = s => +String(s).replace(/[^0-9.\-]/g, '');
/* the plan: $2,000 pay, $3,000 bank, two bills, Education, Investing, Giving, and the emergency fund with money but no goal amount */
const setUp = (p, o) => p.evaluate(o => { const S = __t.S; S.ui.cur = '$';
  S.cfg.bankStart = 3000; S.cfg.minBank = 0; S.steps = { a: [{ from: '2026-11', v: 2000 }] }; S.once = {}; S.items = {};
  const defs = { 'bill:rent': o.rent, 'bill:food': o.food, education: 180, invest: 180, give: 80 };
  S.plan.lines.forEach(l => { l.def = defs[l.key] || 0; });
  S.plan.goals = S.plan.goals.filter(g => g.emergency); const eg = S.plan.goals[0]; eg.target = 0; eg.start = o.saved; delete eg.monthly; eg.stretch = 0;
  S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); }, o);
const look = p => p.evaluate(() => {
  const T = e => (e ? e.innerText.replace(/\s+/g, ' ').trim() : '');
  const key = [...document.querySelectorAll('#hMap .mp-where + .mp-key li')].map(li => ({ part: li.dataset.part || '', t: T(li), b: T(li.querySelector('b')) }));
  const saved = [...document.querySelectorAll('#hMap .mp-four li')].map(li => ({ l: T(li.querySelector('.mp-l')), b: T(li.querySelector('b')) })).find(x => x.l === 'Saved');
  const tiles = [...document.querySelectorAll('#hBur .hb-b')].map(T);
  return { key, saved: saved ? saved.b : '', proof: T(document.querySelector('#hMap .mp-proof')), tiles, home: T(document.querySelector('#p-home')) };
});
const run = async (p, tag, o, want) => {
  await setUp(p, o); await L.tab(p, 'tab-month'); await L.tab(p, 'tab-home'); await w(500);
  const v = await look(p);
  const piece = v.key.find(k => /^Emergency fund/.test(k.t));
  ck(tag + ': the emergency fund is a piece of the bar', !!piece && num(piece.b) === o.saved, v.key);
  ck(tag + ': the bar says it has no goal yet', !!piece && /no goal yet/.test(piece.t), piece);
  const pieces = v.key.filter(k => k.part !== 'bank').reduce((a, k) => a + num(k.b), 0);
  ck(tag + ': the bar pieces add up to Saved', Math.abs(pieces - num(v.saved)) < 0.005, { pieces, saved: v.saved, key: v.key });
  ck(tag + ': the proof line counts the same burrows', v.proof.indexOf('burrows ' + v.saved) >= 0, v.proof);
  ck(tag + ': the Burrows grid has a tile for it', v.tiles.some(t => /^Emergency fund/.test(t) && t.indexOf(want) >= 0), v.tiles);
  ck(tag + ': no NaN or Infinity on Home', !/NaN|Infinity|undefined/.test(v.home), v.home.match(/.{60}(NaN|Infinity|undefined).{30}/));
  return v;
};
(async () => {
  const { b, p, errs } = await R.phone({ w: 390, h: 844, dpr: 1, mobile: true, keep: true });
  await clock(p, '2026-11-19T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await L.zero(p); await w(400); await skip(p);
  await run(p, '$200 saved, no goal amount', { rent: 900, food: 300, saved: 200 }, '$200, no goal yet');
  await run(p, '$1 saved, tiny bills', { rent: 0.01, food: 0.01, saved: 1 }, '$1, no goal yet');
  /* the tile opens the goal's editor, to set its amount */
  await p.evaluate(() => { const t = [...document.querySelectorAll('#hBur .hb-b')].find(e => /^Emergency fund/.test(e.innerText.trim())); if (t) t.click(); }); await w(800);
  const ed = await p.evaluate(() => { const a = document.activeElement; return { burOpen: document.body.classList.contains('bv-on'), focus: a ? a.getAttribute('data-g') || a.id : '' }; });
  ck('tapping the tile opens its editor on Burrows, not the burrow screen', !ed.burOpen && ed.focus === 'target', ed);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc19_unset_shown: ${bad} FAIL` : 'qc19_unset_shown: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc19_unset_shown: FAIL'); process.exit(1); });
