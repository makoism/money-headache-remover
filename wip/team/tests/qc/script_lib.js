/* Shared helper for the script_*.js checks (cost rule 3: findings that came back become scripts).
   open(): one phone-sized page with a made-up plan that has cents, a goal and a receipt, setup done.
   sweep(): visits every screen a person can reach from the tabs and hands each one to a callback.
   Not a test by itself. Made-up numbers only. */
const L = require('./lib_r12.js'); const R = L.R; const w = R.w;
const PAGE = process.env.BUILD || '/home/claude/work/money-map-team.html';
exports.R = R; exports.L = L; exports.w = w;
exports.open = async ({ w: W = 390, h = 844, theme = 'dark', plan = 'cents', onTour = null } = {}) => {
  const o = await R.phone({ w: W, h, dpr: 1, mobile: true });
  const { p } = o;
  await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme }]);
  await p.goto('file://' + PAGE + '?sfxtest'); await w(1200);
  if (onTour) await onTour(p);   /* the first screen a new person sees, before the tour is skipped */
  await p.evaluate(() => { const s = document.getElementById('tourSkip'); s && s.click(); }); await w(400);
  await p.evaluate(() => { const s = document.getElementById('coSkip'); s && s.click(); }); await w(400);
  await p.evaluate(t => { const e = document.querySelector('[data-theme-set="' + t + '"]'); e && e.click(); }, theme); await w(200);
  const th = await p.evaluate(() => document.documentElement.getAttribute('data-theme')); if (th !== theme) throw new Error('theme did not switch to ' + theme + ' (it is ' + th + ')');
  if (plan !== 'samples') {
    await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '$'; });
    await L.base(p, { pay: 3250.5, bank: 1840.25, min: 200, defs: { 'bill:rent': 1175.4, 'bill:food': 420.15, envelope: 365.8, education: 60, invest: 150, give: 45.5 }, tT: 2400, tM: 210.35, eT: 6000, eS: 1310.6, eM: 175 });
    await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true }; S.ui.sampleHidden = true; __t.persist(); __t.restructure(); });
    await L.rc(p, '37.45', 'envelope', null, 'lunch');
    await L.rc(p, '112.9', 'bill:food', null, 'shop');
  }
  return o;
};
/* other made-up states on the same page (no reload): 'zero' every number 0, 'over' Free to spend overspent and the bank short,
   'blank' nothing entered at all after Set all to zero */
exports.state = async (p, kind) => {
  if (kind === 'blank') { await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '$'; const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true }; S.ui.sampleHidden = true; __t.persist(); __t.restructure(); }); return; }
  if (kind === 'cents-done') { await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true }; S.ui.sampleHidden = true; __t.persist(); __t.restructure(); }); return; }
  if (kind === 'zero') { await L.base(p, { pay: 0, bank: 0, min: 0, defs: { 'bill:rent': 0, 'bill:food': 0, envelope: 0, education: 0, invest: 0, give: 0 }, tT: 0, tM: 0, eT: 0, eS: 0, eM: 0 }); }
  if (kind === 'over') { await L.base(p, { pay: 2100.75, bank: 95.3, min: 150, defs: { 'bill:rent': 1450.2, 'bill:food': 380.6, envelope: 240.45, education: 35, invest: 0, give: 20.25 }, tT: 1800, tM: 140.15, eT: 4000, eS: 655.4, eM: 90 });
    await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true }; S.ui.sampleHidden = true; __t.persist(); __t.restructure(); });
    await L.rc(p, '310.65', 'envelope', null, 'bike'); await L.rc(p, '95.3', 'envelope', null, 'gift'); }
  await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true }; S.ui.sampleHidden = true; __t.persist(); __t.restructure(); });
};
/* each screen: [name, async p => go there]. Plan sub views are clicked by their data-sub button. */
const tab = async (p, t) => { await p.evaluate(t => document.getElementById(t).click(), t); await w(+(process.env.SCRIPT_WAIT || 300)); };
exports.tab = tab;
const sub = s => async p => { await tab(p, 'tab-month'); await p.evaluate(s => { const e = document.querySelector('[data-sub="' + s + '"]'); e && e.click(); }, s); await w(+(process.env.SCRIPT_WAIT || 300)); };
exports.SCREENS = [
  /* Home with More open shows everything Home shows, plus the rest */
  ['Home (More open)', async p => { await tab(p, 'tab-home'); await p.evaluate(() => { [...document.querySelectorAll('#p-home button,#p-home summary')].filter(e => /^(More|Show)\b/.test(e.innerText.trim()) && (e.offsetParent || e.getClientRects().length)).forEach(e => e.click()); }); await w(500); }],
  ['Receipts', async p => { await tab(p, 'tab-receipts'); }],
  ['Plan / Month', sub('month')],
  ['Plan / Goals', sub('goals')],
  ['Plan / All months', sub('months')],
  ['Settings', async p => { await p.evaluate(() => document.getElementById('gearBtn').click()); await w(+(process.env.SCRIPT_WAIT || 300) + 100); }],
];
exports.sweep = async (p, fn) => { for (const [name, go] of exports.SCREENS) { await go(p); await fn(name); } await tab(p, 'tab-home'); };
/* the text a person can see: innerText of the open panel, the header, the dock and any open dialog */
exports.visibleText = p => p.evaluate(() => document.body.innerText);
exports.report = () => { let bad = 0; const ck = (n, c, x) => { console.log(c ? 'PASS' : 'FAIL', n, c ? '' : (x || '')); if (!c) bad++; }; return { ck, done: () => { console.log(bad ? 'FAILED ' + bad : 'ALL PASS'); process.exit(bad ? 1 : 0); } }; };
