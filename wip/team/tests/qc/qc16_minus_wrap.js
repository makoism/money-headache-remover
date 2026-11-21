/* QC round 7 layout and touch, confusing 1: at 320 a minus sign split from its amount ("planned from −" / "¥15,000, the balance your plan
   starts Nov with." and "below zero (−" / "¥15,000). Wait for pay"). A minus sign always sits on the same line as its amount. Checked on
   Home at 320x640 with a made-up overdrawn yen start, each minus sign against the next character of its amount. Also checks that the
   joiner does not change any number: the text with the joiner taken out reads as before.  Run: node tests/qc/qc16_minus_wrap.js */
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
/* every minus sign in visible text: is it on the same line as the next character that is not a joiner? */
const splits = p => p.evaluate(() => {
  const out = [], seen = { n: 0 }, tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const rectOf = (node, i) => { const r = document.createRange(); r.setStart(node, i); r.setEnd(node, i + 1); return r.getClientRects()[0] || null; };
  for (let n = tw.nextNode(); n; n = tw.nextNode()) {
    const s = n.nodeValue, el = n.parentElement; if (!el || (!el.offsetParent && getComputedStyle(el).position !== 'fixed')) continue;
    for (let i = 0; i < s.length; i++) {
      if (s[i] !== '−' && s[i] !== '-') continue;
      let j = i + 1; while (j < s.length && s[j] === '\u2060') j++;
      if (j >= s.length || !/[¥$€£\d]/.test(s[j])) continue;
      const a = rectOf(n, i), b = rectOf(n, j); if (!a || !b || !a.width) continue; seen.n++;
      if (Math.abs(a.top - b.top) > 2) out.push(s.slice(Math.max(0, i - 30), j + 12));
    }
  }
  return { n: seen.n, out };
});
(async () => {
  const { b, p, errs } = await R.phone({ w: 320, h: 640, dpr: 1, mobile: true, keep: true });
  await clock(p, '2026-11-19T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '¥'; });
  await L.base(p, { pay: 280000, bank: -15000, min: 0, noTrip: true, eT: 0, eS: 0, eM: 0, defs: { 'bill:rent': 140000, 'bill:food': 0, envelope: 30000, education: 0, invest: 0, give: 0 } }); await w(400); await skip(p);
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; S.cfg.bankStart = -15000; S.cfg.bankAt = '2026-11-18'; delete S.cfg.bankNow; delete S.cfg.bankNowAt; __t.persist(); __t.restructure(); });
  await L.rc(p, 2000, 'envelope', '2026-11-19', 'Made-up coffee'); await w(400);
  await L.tab(p, 'tab-home'); await w(600);
  const t = await p.evaluate(() => document.body.innerText);
  ck('Home shows the overdrawn start, −¥15,000', /−\u2060?¥15,000/.test(t), (t.match(/.{40}15,000.{20}/g) || []).slice(0, 4));
  ck('every minus amount on Home is one unbreakable piece: the sign is joined to the currency sign', !/−¥/.test(t) && /−\u2060¥/.test(t), (t.match(/.{20}−¥.{10}/g) || []).slice(0, 4));
  ck('the joiner changes no number: taken out, the text reads −¥15,000 as before', /−¥15,000/.test(t.replace(/\u2060/g, '')));
  const s = await splits(p);
  ck(`320x640 Home: no minus sign ends a line apart from its amount (${s.n} minus amounts looked at)`, s.n > 0 && s.out.length === 0, s);
  const lines = await p.evaluate(() => { const r = []; document.querySelectorAll('#hStatus, [data-planfrom]').forEach(e => { if (e.offsetParent) r.push(e.innerText); }); return r; });
  ck('Home names the overdrawn start in the status box or the plan line', lines.some(x => /−\u2060?¥15,000/.test(x)), lines);
  for (const tb of ['tab-receipts', 'tab-month']) { await L.tab(p, tb); await w(500); const q = await splits(p); ck(`320x640 ${tb}: no minus sign split from its amount`, q.out.length === 0, q.out); }
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc16_minus_wrap: ${bad} FAIL` : 'qc16_minus_wrap: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc16_minus_wrap: FAIL'); process.exit(1); });
