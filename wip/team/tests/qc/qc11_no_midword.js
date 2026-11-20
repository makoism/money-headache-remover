/* QC round 4 layout and touch (confusing 1 and 2): at 320 wide a long amount in Home's "Where your money sits" key broke inside the
   number ("¥987," / "654,3" / "21"), and the "Emergency fund full" pill on Plan > All months broke inside words ("Emerg / ency").
   Amounts stay on one line and words are never split. Sample numbers.  Run: node tests/qc/qc11_no_midword.js */
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 400)); } };
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
/* each word of the element's text sits on one line */
const split = (p, sel) => p.evaluate(sel => { const out = []; document.querySelectorAll(sel).forEach(el => { if (!el.getClientRects().length) return;
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n; while ((n = walk.nextNode())) { const t = n.textContent; let re = /\S+/g, m;
    while ((m = re.exec(t))) { const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length); const tops = new Set([...r.getClientRects()].filter(x => x.width > 0).map(x => Math.round(x.top))); if (tops.size > 1) out.push(m[0]); } } }); return out; }, sel);
(async () => {
  const { b, p, errs } = await R.phone({ w: 320, h: 640, dpr: 1, mobile: true, keep: true });
  await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await p.evaluate(() => { const S = __t.S, g = S.plan.goals.find(x => x.emergency); g.name = 'Emergency fund for the new apartment near the station'; S.cfg.bankStart = 98765432; __t.persist(); __t.restructure(); }); await w(400);
  await L.tab(p, 'tab-month'); await L.tab(p, 'tab-home'); await w(600);
  const a = await split(p, '#hMap .mp-key b');
  ck('320: no amount in "Where your money sits" breaks across lines', a.length === 0, a);
  await L.tab(p, 'tab-month'); await L.clickText(p, 'All months'); await w(600);
  const c = await split(p, '#monthTable .mt-g');
  const n = await p.evaluate(() => document.querySelectorAll('#monthTable .mt-g').length);
  ck('320: the All months goal pills are there (' + n + ')', n > 0);
  ck('320: no word in an All months goal pill is split', c.length === 0, c);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc11_no_midword: ${bad} FAIL` : 'qc11_no_midword: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc11_no_midword: FAIL'); process.exit(1); });
