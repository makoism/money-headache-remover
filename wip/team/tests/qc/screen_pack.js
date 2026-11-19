/* Screen pack for the QC agents (process change point 2: agents get screenshots and extracted screen text, not only the page).
   Opens the staged build in a few made-up situations, at a phone (390x844) and a small phone (320x640), and saves for every tab
   a full-page screenshot (PNG, 1x) and the screen text (TXT) in OUT (default /tmp/qc_build/screens), plus index.txt listing them.
   Agents may still open the build themselves; the pack saves them the walking.
   Part 2, "panels": the screens no tab view shows (cloud copy steps, Home notices, Undo, Help, Ask, the setup tour, editors, a burrow's
   own screen, import review, the month-end question, the light theme, desktop width). Shot at 412x915 (an Android phone) as
   412-panel-<nn>-<name>.png/.txt, and at 1280x800 as 1280-panel-<nn>-<name>. A panel that cannot be reached is listed in index.txt as
   "NOT CAPTURED <name>: <reason>" and does not fail the run (only page errors do).
   Made-up numbers only. Run: node tests/qc/screen_pack.js [OUT]   (BUILD=path overrides /tmp/qc_build/build.html) */
const fs = require('fs');
const L = require('./lib_r12.js'); const R = L.R; const w = R.w;
const BUILD = process.env.BUILD || '/tmp/qc_build/build.html';
const OUT = process.argv[2] || '/tmp/qc_build/screens';
fs.mkdirSync(OUT, { recursive: true });
const panels = () => require('./screen_pack_panels.js')(BUILD, OUT);   /* part 2, in its own file */
const SIZES = [[390, 844], [320, 640], [412, 915]];   /* iPhone, small phone, Android phone */
const VIEWS = [['home', 'tab-home'], ['spending', 'tab-receipts'], ['plan-month', 'tab-month', 'month'], ['plan-goals', 'tab-month', 'goals'], ['plan-all-months', 'tab-month', 'months'], ['burrows', 'tab-goals'], ['basics', 'tab-basics']];
/* the situations: what a stranger sees first, a dollar plan with cents and some spending past the plan, a yen plan with a minus bank */
const SITUATIONS = [
  ['first-open', null],
  ['dollar-plan', async p => {
    await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '$'; });
    await L.base(p, { pay: 3250.5, bank: 1840.25, min: 300, defs: { 'bill:rent': 1150, 'bill:food': 420.75, envelope: 300, education: 50, invest: 100, give: 25 }, tT: 1200, tM: 150, eT: 5000, eS: 900, eM: 200 });
    await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true }; S.ui.sampleHidden = true;
      S.receipts = S.receipts || [];
      const r = (id, day, c, a) => { const l = S.plan.lines.find(x => x.key === c); S.receipts.push({ id, d: '2026-11-' + String(day).padStart(2, '0'), a, c, cn: l ? l.name : 'Other', n: '' }); };
      r('qa1', 3, 'bill:food', 182.4); r('qa2', 9, 'bill:food', 301.1); r('qa3', 12, 'envelope', 96);
      __t.persist(); __t.restructure(); });
  }],
  ['yen-overdrawn', async p => {
    await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '¥'; });
    await L.base(p, { pay: 280000, bank: -15000, min: 0, defs: { 'bill:rent': 95000, 'bill:food': 45000, envelope: 30000, education: 0, invest: 10000, give: 0 }, tT: 0, tM: 0, eT: 300000, eS: 0, eM: 20000, noTrip: true });
    await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true }; S.ui.sampleHidden = true; __t.persist(); __t.restructure(); });
  }],
];
(async () => {
  const index = []; let errsAll = [];
  for (const [W, H] of SIZES) for (const [name, setup] of SITUATIONS) {
    const { b, p, errs } = await R.phone({ w: W, h: H, dpr: 1, mobile: true });
    await p.goto('file://' + BUILD + '?sfxtest'); await w(1500);
    const tag = `${W}-${name}`;
    if (!setup) { /* what a stranger sees before tapping anything */
      await p.screenshot({ path: `${OUT}/${tag}-0-welcome.png` });
      fs.writeFileSync(`${OUT}/${tag}-0-welcome.txt`, await L.txt(p)); index.push(`${tag}-0-welcome`);
    }
    await p.evaluate(() => { const s = document.getElementById('tourSkip'); s && s.click(); }); await w(500);
    await p.evaluate(() => { const s = document.getElementById('coSkip'); s && s.click(); }); await w(500);
    if (setup) await setup(p);
    let k = 1;
    for (const [vn, tab, sub] of VIEWS) {
      await L.tab(p, tab);
      if (sub) { await p.evaluate(s => { const e = document.querySelector(`[data-sub="${s}"]`); e && e.click(); }, sub); await w(500); }
      await p.evaluate(() => window.scrollTo(0, 0)); await w(300);
      const f = `${tag}-${k++}-${vn}`;
      await p.screenshot({ path: `${OUT}/${f}.png`, fullPage: true });
      fs.writeFileSync(`${OUT}/${f}.txt`, await L.txt(p)); index.push(f);
    }
    errsAll = errsAll.concat(errs.map(e => tag + ': ' + e)); await b.close();
  }
  const P = await panels().catch(e => ({ index: [], missed: ['NOT CAPTURED (all panels): ' + String(e && e.message || e).split('\n')[0]], errs: [] }));
  errsAll = errsAll.concat(P.errs);
  fs.writeFileSync(`${OUT}/index.txt`, 'Screens of ' + BUILD + ' (PNG full page at 1x, TXT is the screen text). Made-up numbers.\n' +
    'Situations: first-open (fresh, sample plan), dollar-plan (cents, some spending past the plan), yen-overdrawn (bank below zero).\n' +
    index.join('\n') + '\n\nPanels\n' +
    '412x915 (1280-... is desktop width 1280x800). PNG is what the phone shows (the whole page where the name ends in a long page), TXT is the screen text, the panel itself first.\n' +
    'Plan: yen, pay 280,000, bank 412,000, two or three receipts, one goal (Trip), one pay-in-full card. A made-up server on this machine stands in for the cloud and for Claude.\n' +
    P.index.join('\n') + '\n' + (P.missed.length ? P.missed.join('\n') + '\n' : '') + '\n' +
    (errsAll.length ? 'PAGE ERRORS:\n' + errsAll.join('\n') : 'no page errors') + '\n');
  console.log(`screen pack: ${index.length} screens and ${P.index.length} panels in ${OUT}` + (P.missed.length ? `, ${P.missed.length} panels not captured` : '') + (errsAll.length ? `, PAGE ERRORS ${errsAll.length}` : ', no page errors'));
  process.exit(errsAll.length ? 1 : 0);
})();
