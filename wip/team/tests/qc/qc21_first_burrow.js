/* QC round 8 wording polish: the "First burrow" badge read "A goal is on track." next to it. Once earned it says
   "You started your first burrow." Before it is earned it still says how to get it, and the On track badge keeps its own line.
   Run: PAGE=/abs/money-map-team.html node tests/qc/qc21_first_burrow.js */

const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const tiles = p => p.evaluate(() => { const o = {}; document.querySelectorAll('#hBadges .hb').forEach(li => { const b = li.querySelector('b'); o[b.textContent.trim()] = { on: li.classList.contains('on'), line: li.querySelector('span:last-child').textContent.trim() }; }); return o; });
const show = async (p, bd) => { await p.evaluate(bd => { __t.S.ui.bd = bd; __t.persist(); }, bd); await L.tab(p, 'tab-month'); await L.tab(p, 'tab-home');
  await p.evaluate(() => { const m = document.getElementById('hMoreBtn'); if (m && m.getAttribute('aria-expanded') !== 'true') m.click(); }); await w(500); return tiles(p); };
(async () => {
  const { b, p, errs } = await L.start({ w: 390, h: 844, dpr: 1, mobile: true });
  const a = await show(p, { rcpt1: true });
  ck('not earned: First burrow says how to get it', a['First burrow'] && !a['First burrow'].on && a['First burrow'].line === 'Add a burrow with a goal amount.', a['First burrow']);
  const c = await show(p, { rcpt1: true, goal1: true });
  ck('earned: First burrow says "You started your first burrow."', c['First burrow'] && c['First burrow'].on && c['First burrow'].line === 'You started your first burrow.', c['First burrow']);
  ck('no badge tile says "A goal is on track." under First burrow', !Object.values(c).some(t => t.line === 'A goal is on track.' && t === c['First burrow']));
  ck('other earned badges still say Earned', c['First receipt'] && c['First receipt'].line === 'Earned', c['First receipt']);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc21_first_burrow: ${bad} FAIL` : 'qc21_first_burrow: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc21_first_burrow: FAIL'); process.exit(1); });
