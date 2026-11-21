/* Three findings of the number-logic QC (2026-11-19), all about what Home says. Made-up numbers.
   SF2  Plan's small summary line ("... has a place in Jan · On plan") was part of the page on every tab, only slid out of sight.
        Read from Home it was the first line of the page and it followed the month picked on Plan, also after a reload.
        Home is about the month the clock is in. Plan keeps its own picked month.
   SF1  With two month-end questions waiting, answering the first left Home saying "left out until you answer the question on Home"
        with no question showing until a reload. The next question now shows straight away, and the answer just made can still be undone.
   SF3  Free to spend spent past its plan was captioned "planned: over in Nov". Overspend is not a plan.
   Run: node tests/qc/qc9_home_status.js */
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 400)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const open = async (iso, o = {}) => { const x = await R.phone(Object.assign({ w: 390, h: 844, dpr: 1, mobile: true, keep: true }, o)); await clock(x.p, iso); await x.p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(x.p); return x; };
const saved = p => p.waitForFunction(() => { try { return JSON.parse(localStorage.getItem('money-map-template-v2')).rev === __t.S.rev; } catch (e) { return false; } }, { timeout: 20000 }).catch(() => { });
const reload = async p => { await w(300); await saved(p); await p.reload(); await w(1500); await skip(p); };
/* what a person, a reader or a page search finds on the open tab */
const look = p => p.evaluate(() => {
  const shown = e => !!e && e.getClientRects().length > 0, d = document.getElementById('dock'), t = document.getElementById('dockTxt'), body = document.body.innerText.replace(/[ \t]+/g, ' ');
  const map = document.getElementById('hMap'), four = [...document.querySelectorAll('#hMap .mp-four li')].map(li => li.innerText.replace(/\s+/g, ' '));
  return { first: body.trim().split('\n')[0], line: shown(t) ? t.innerText : '', lineShown: shown(d), homeOpen: !document.getElementById('p-home').hidden, planOpen: !document.getElementById('p-month').hidden,
    picked: document.getElementById('monthSel').value, homeYm: (__t.homeView ? __t.homeView() : {}).ym, status: (body.match(/[^\n]*(has a place in|not placed yet in|more planned than)[^\n]*/g) || []),
    map: map ? map.innerText.replace(/\s+/g, ' ') : '', four, proof: ((map && map.querySelector('.mp-proof')) || {}).innerText || '', mg: (document.querySelector('.mg-s') || {}).innerText || '' };
});
const card = p => p.evaluate(() => { const e = document.getElementById('hNext'), q = s => { const b = e && !e.hidden && e.querySelector(s); return b ? (b.getAttribute('data-sweepbank') || b.getAttribute('data-sweep') || 'yes') : null; };
  const ub = document.getElementById('undoBar'); return { text: e && !e.hidden ? e.innerText.replace(/\s+/g, ' ') : '', bank: q('[data-sweepbank]'), goal: q('[data-sweep]'), undo: q('[data-sweepundo]'), bar: !!ub && !ub.hidden ? ub.innerText.replace(/\s+/g, ' ') : '',
    proof: (document.querySelector('#hMap .mp-proof') || {}).innerText || '', ans: Object.keys(__t.S.ui.sweep || {}).sort().join(',') }; });
const mine = async (p, receipts) => {
  await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '¥'; });
  await L.base(p, { pay: 300000, bank: 100000, min: 0, defs: { 'bill:rent': 100000, 'bill:food': 50000, envelope: 40000, education: 10000, invest: 20000, give: 5000 }, tT: 600000, tM: 15000, eT: 900000, eS: 50000, eM: 10000 });
  await w(400); await skip(p);
  await p.evaluate(rc => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; S.receipts = rc.map((x, i) => ({ id: 'q9' + i, d: x[0], a: x[1], c: 'envelope', cn: 'Free to spend', n: '' })); __t.persist(); __t.restructure(); }, receipts);
  await L.tab(p, 'tab-month'); await L.tab(p, 'tab-home'); await w(500);
};
const tap = async (p, sel) => { await p.evaluate(s => { const e = document.querySelector(s); if (e) e.click(); }, sel); await w(700); };
(async () => {
  let errsAll = [];
  /* ---------- SF2: sample numbers, the clock in November, January picked on Plan ---------- */
  { const { b, p, errs } = await open('2026-11-19T10:00:00');
    const a0 = await look(p);
    ck('SF2 start: Home is open and is about November', a0.homeOpen && /Nov/.test(a0.map) && !/\bin Jan\b/.test(a0.map), a0.map.slice(0, 200));
    const home = async tag => { const a = await look(p);
      ck(`SF2 ${tag}: Home is open`, a.homeOpen && !a.planOpen, a);
      ck(`SF2 ${tag}: no line on Home says where pay is placed "in Jan"`, a.status.every(s => !/\bJan\b/.test(s)), a.status);
      ck(`SF2 ${tag}: Plan's summary line is not part of Home`, !a.lineShown && a.line === '' && !/has a place in|not placed yet in|more planned than/.test(a.first), { first: a.first, line: a.line, shown: a.lineShown });
      ck(`SF2 ${tag}: Home's own figures are November's`, /Nov/.test(a.map) && !/\bin Jan\b|of Jan\b/.test(a.map) && /Nov/.test(a.four.join(' ')) && !/Jan/.test(a.four.join(' ')) && !/Jan/.test(a.proof), { four: a.four, proof: a.proof });
      return a; };
    await L.tab(p, 'tab-month'); await p.select('#monthSel', '2027-01'); await w(700);
    const pl = await look(p);
    ck('SF2 Plan: January is picked and Plan shows its own summary line for Jan', pl.planOpen && pl.picked === '2027-01' && pl.lineShown && /in Jan\b/.test(pl.line), pl);
    await L.tab(p, 'tab-home'); await w(500); await home('after picking January on Plan');
    await reload(p); await home('after one reload');
    await reload(p); await home('after two reloads');
    await L.tab(p, 'tab-month'); await w(400); const pl2 = await look(p);
    ck('SF2 Plan still remembers January after the reloads, with its own line', pl2.picked === '2027-01' && pl2.lineShown && /in Jan\b/.test(pl2.line), pl2);
    await p.evaluate(() => window.scrollTo(0, 1500)); await w(1200);
    const dk = await p.evaluate(() => { const d = document.getElementById('dock'), r = d.getBoundingClientRect(); return { on: d.classList.contains('on'), top: Math.round(r.top), bottom: Math.round(r.bottom), txt: document.getElementById('dockTxt').innerText }; });
    ck('SF2 on Plan the summary line still slides in when the page is scrolled down', dk.on && dk.top >= 0 && dk.bottom > 20 && /in Jan\b/.test(dk.txt), dk);
    await L.tab(p, 'tab-receipts'); await w(300); const rc = await look(p);
    ck('SF2 Plan\'s summary line is not part of Receipts either', !rc.lineShown && rc.line === '', rc.line);
    errsAll = errsAll.concat(errs); await b.close(); }

  /* ---------- SF2 and SF3: own numbers, Free to spend spent past its plan in November, January picked on Plan ---------- */
  { const { b, p, errs } = await open('2026-11-19T10:00:00');
    await mine(p, [['2026-11-03', 20000], ['2026-11-09', 15000], ['2026-11-15', 10000]]);   /* 45,000 spent of 40,000 planned */
    const free = a => a.four.find(x => /^Free to spend/.test(x)) || '';
    const a = await look(p);
    ck('SF3 start: Free to spend is 5,000 over on Home', /(^|[^−\u2060])¥5,000 over/.test(free(a))   /* "¥5,000 over", no minus with the word over (38.31 number gate round 8, finding 2) */, a.four);
    ck('SF3 money already overspent is not called planned', !/planned/i.test(free(a)), free(a));
    ck('SF3 the other three numbers are still marked planned', a.four.filter(x => /planned/.test(x)).length === 3, a.four);
    await L.tab(p, 'tab-month'); await p.select('#monthSel', '2027-01'); await w(700); await L.tab(p, 'tab-home'); await w(500);
    for (const tag of ['after picking January', 'after one reload', 'after two reloads']) { if (tag !== 'after picking January') await reload(p); const h = await look(p);
      ck(`SF2 own numbers, ${tag}: Home says November's overspend and nothing about Jan being on plan`, h.homeOpen && /(^|[^−\u2060])¥5,000 over/.test(free(h)) && !h.lineShown && h.line === '' && h.status.length === 0 && !/Jan/.test(h.four.join(' ')), { four: h.four, line: h.line, status: h.status }); }
    errsAll = errsAll.concat(errs); await b.close(); }

  /* ---------- SF1: the clock in January 2027, November and December both have Free to spend not logged as spent ---------- */
  for (const how of ['bank', 'goal']) { const { b, p, errs } = await open('2027-01-10T10:00:00');
    await mine(p, [['2026-11-03', 9000], ['2026-11-09', 8000], ['2026-11-15', 4000], ['2026-11-21', 4000], ['2026-12-03', 9000], ['2026-12-09', 8000], ['2026-12-15', 4000], ['2026-12-21', 4000]]);   /* 25,000 of 40,000 each month: 15,000 left in each */
    const c0 = await card(p);
    ck(`SF1 ${how}: Home first asks about December`, c0.bank === '2026-12' && /December/.test(c0.text) && /15,000/.test(c0.text), c0);
    ck(`SF1 ${how}: and says 30,000 is left out until the question is answered`, /¥30,000 of Free to spend is left out until you answer the question on Home/.test(c0.proof), c0.proof);
    await tap(p, how === 'bank' ? '#hNext [data-sweepbank]' : '#hNext [data-sweep]');
    const c1 = await card(p);
    ck(`SF1 ${how}: December is answered`, c1.ans === '2026-12', c1);
    ck(`SF1 ${how}: Home still says 15,000 is left out until the question is answered`, /¥15,000 of Free to spend is left out until you answer the question on Home/.test(c1.proof), c1.proof);
    ck(`SF1 ${how}: and November's question shows straight away, with no reload`, c1.bank === '2026-11' && /November/.test(c1.text), c1);
    ck(`SF1 ${how}: the December answer can still be undone`, !!c1.undo || (/Undo/.test(c1.bar) && (how === 'bank' ? /¥15,000 counted in the bank/ : /Trip: \+¥15,000/).test(c1.bar)), c1);
    /* undo it: December is asked again */
    await p.evaluate(() => { const u = document.querySelector('#hNext [data-sweepundo]') || document.getElementById('undoGo'); u.click(); });   /* whichever Undo carries the December answer (checked just above) */ await w(700);
    const c2 = await card(p);
    ck(`SF1 ${how}: Undo takes the December answer back and December is asked again`, c2.ans === '' && c2.bank === '2026-12' && /¥30,000 of Free to spend is left out/.test(c2.proof), c2);
    /* answer both: nothing is left out, the last answer shows with Undo */
    await tap(p, '#hNext [data-sweepbank]'); await tap(p, '#hNext [data-sweepbank]');
    const c3 = await card(p);
    ck(`SF1 ${how}: with both answered nothing is said to be left out, and no question shows`, c3.ans === '2026-11,2026-12' && !/left out/.test(c3.proof) && !c3.bank, c3);
    ck(`SF1 ${how}: the last answer shows on Home with Undo`, !!c3.undo && /counted in the bank/.test(c3.text), c3);
    await reload(p); const c4 = await card(p);
    ck(`SF1 ${how}: after a reload both answers are kept and nothing is left out`, c4.ans === '2026-11,2026-12' && !/left out/.test(c4.proof) && !c4.bank, c4);
    errsAll = errsAll.concat(errs); await b.close(); }

  ck('no page errors', errsAll.length === 0, errsAll);
  console.log(bad ? 'QC9 HOME STATUS FAIL ' + bad : 'QC9 HOME STATUS PASS'); process.exit(bad ? 1 : 0);
})();
