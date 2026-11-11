/* Stability and accuracy under random use: click, type and change things at random, then check
   (1) no page errors, no NaN / undefined / Infinity on screen, no sideways scrolling,
   (2) the Plan screen still agrees with the independent math computed from what the page saved. */
const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { M, oracle, oraclePercents, setSeed, rnd, pick, ri } = require('/tmp/v25/oracle.js');
setSeed(+(process.env.SEED || 1));
const w = ms => new Promise(r => setTimeout(r, ms));
const SESSIONS = +(process.env.N || 6), ACTIONS = +(process.env.ACTIONS || 70), PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
const fails = []; let checks = 0, acts = 0; const trace = []; let lastRaw = '';
const eq = (m, a, b) => { checks++; if (a !== b && fails.length < 40) { fails.push(m + ': screen ' + JSON.stringify(a) + ' vs independent ' + JSON.stringify(b)); if (!global.__dumped) { global.__dumped = 1; console.log('TRACE', JSON.stringify(trace.slice(-16)), '\nRAW', global.__raw); } } };
const TEXTS = process.env.TEXTS ? JSON.parse(process.env.TEXTS) : ['0', '1', '5', '99', '1200', '45000', '123456', '9999999', '-5', '12.5', '', 'abc', '0.0', '1e3', '  7 ', '１２３', '5,000', '$40', '2147483648', '99999999999999'];

async function compare(p, tag) {
  /* the page saves 500 ms after the last change; wait for that, so the saved copy is the same as what is on screen */
  for (let i = 0; i < 100; i++) { if (!(await p.evaluate(() => !!document.querySelector('#save.busy')))) break; await w(100); }
  const raw = await p.evaluate(() => localStorage.getItem('money-map-template-v2')); if (!raw) return; global.__raw = raw;
  const S = JSON.parse(raw), cur = (S.ui && S.ui.cur) || '₱', pre = cur === 'none' ? '' : (/^[A-Za-z]{2,}$/.test(cur) ? cur + ' ' : cur);
  const F = n => { n = Math.round(n); return (n < 0 ? '−' : '') + pre + Math.abs(n).toLocaleString('en-US'); };
  /* what the page computes is from its own cleaned copy; the saved copy is what it wrote, so it is already clean */
  const O = oracle(S), ym = await p.evaluate(() => document.querySelector('#monthSel').value), r = O.rows.find(x => x.ym === ym); if (!r) return;
  await p.evaluate(() => document.querySelector('#tab-month').click()); await w(150);
  const D = await p.evaluate(() => { const q = s => (document.querySelector(s) || {}).textContent; return { where: q('#whereTitle'), dock: q('#dockNum'), inT: q('#inTotal'), outT: q('#outTotal'), left: q('#leftTotal'), bank: q('#bankLine'), hero: q('#heroNum'),
    legend: [...document.querySelectorAll('#legend .lg')].map(x => [x.querySelector('span').firstChild.textContent, x.querySelector('b').textContent, x.querySelector('em').textContent]) }; });
  const pt = tag + ' ' + ym + ' ';
  eq(pt + 'where', D.where, 'Where ' + F(r.inflow) + ' goes'); eq(pt + 'dock', D.dock, F(r.left)); eq(pt + 'in', D.inT, F(r.inflow)); eq(pt + 'out', D.outT, F(r.outflow)); eq(pt + 'left', D.left, F(r.left));
  eq(pt + 'bank', D.bank, `Your balance goes from ${F(r.bankStart)} to ${F(r.bankEnd)} this month.`); eq(pt + 'play', D.hero, F(r.jar.play));
  const rest = Math.max(0, r.inflow - r.outflow), short = Math.max(0, r.outflow - r.inflow), base = short > 0 ? r.outflow : r.inflow;
  const vals = [r.jar.nec, r.goalsTotal, r.jar.play, r.jar.edu, r.jar.ffa, r.jar.give, rest], pc = oraclePercents(vals, base), showPct = base > 0 && !(short > 0);
  const exp = M.JARS.map((j, i) => [j.name, F(vals[i]), showPct ? pc[i] + '%' : '']); if (rest > 0) exp.push(['Left over', F(rest), showPct ? pc[6] + '%' : '']); if (short > 0) exp.push(['Short by', F(short), '']);
  eq(pt + 'legend', JSON.stringify(D.legend), JSON.stringify(exp));
  /* the goals */
  await p.evaluate(() => document.querySelector('#tab-goals').click()); await w(150);
  for (const g of S.plan.goals) {
    const G = await p.evaluate(id => (document.querySelector('#jv-' + id) || {}).innerText, g.id);
    eq(pt + g.id + ' goal amounts', G, g.target > 0 ? `${F(r.bal[g.id])} planned of ${F(g.target)}` : 'No goal amount yet');
  }
}
async function health(p, tag) {
  const bad = await p.evaluate(() => ({ txt: (document.body.innerText.match(/NaN|Infinity|undefined|\[object/g) || []).length, over: document.documentElement.scrollWidth - innerWidth }));
  eq(tag + ' NaN/undefined on screen', bad.txt, 0); eq(tag + ' sideways scroll', bad.over > 1, false);
  if (bad.over > 1) { const who = await p.evaluate(() => { const out = []; document.querySelectorAll('body *').forEach(e => { const r = e.getBoundingClientRect(); const sc = (() => { for (let x = e.parentElement; x; x = x.parentElement) { const o = getComputedStyle(x).overflowX; if (o === 'auto' || o === 'scroll' || o === 'hidden') return true; } return false; })(); if (r.width && r.right > innerWidth + 1 && e.offsetParent !== null && !sc) out.push(e.tagName + '#' + e.id + '.' + String(e.className).slice(0, 30) + ' right=' + Math.round(r.right) + ' text=' + (e.textContent || '').trim().slice(0, 40)); }); return { last: window.__last, vw: innerWidth, tab: (document.querySelector('[role=tab][aria-selected=true]') || {}).id, who: out.slice(0, 6) }; }); console.log('OVERFLOW', tag, JSON.stringify(who)); }
}
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  for (let s = 0; s < SESSIONS; s++) {
    const cur = pick(['₱', '¥', '€', '$']), S = M.presetState(cur);
    S.ui = Object.assign(S.ui, { setup: true, sampleHidden: true, done: { pay: true, bills: true, goals: true, receipts: true }, seen: { home: true, month: true, goals: true, receipts: true, basics: true } });
    const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 120)));
    await p.setViewport({ width: process.env.VW ? +process.env.VW : pick([390, 820, 1200]), height: 900 });
    await p.evaluateOnNewDocument(st => { if (!sessionStorage.getItem('__seen')) { localStorage.setItem('money-map-template-v2', st); sessionStorage.setItem('__seen', '1'); } }, JSON.stringify(S));
    /* downloads, file pickers, new tabs and the Ask chat's network calls are not part of this test */
    await p.evaluateOnNewDocument(() => { window.open = () => null; HTMLAnchorElement.prototype.click = function () {}; });
    await p.goto('file://' + PAGE + '#2026-11', { waitUntil: 'load' }); await w(600);
    const tag = 'S' + s + ' ' + cur;
    for (let a = 0; a < ACTIONS; a++) {
      acts++;
      await p.evaluate(() => { const b = document.querySelector('#co:not([hidden]) #coSkip'); if (b) b.click(); });
      const kind = pick(['type', 'type', 'type', 'click', 'click', 'select', 'month', 'tab', 'key']);
      try {
        if (kind === 'type') {
          const txt = pick(TEXTS);
          await p.evaluate((txt, R) => { const els = [...document.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=range]):not([type=hidden]):not([type=color]):not([type=time]):not([type=date]):not([disabled]):not([readonly])')].filter(e => e.offsetParent !== null); if (!els.length) return; const e = els[Math.floor(R * els.length)]; window.__last = (e.id || e.name || e.className) + ' <- ' + txt; e.focus(); if (e.select) e.select(); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(e, txt); e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); e.blur(); }, txt, rnd());
        } else if (kind === 'click') {
          await p.evaluate(R => { const els = [...document.querySelectorAll('button:not([disabled]), summary, [data-open], [data-edit], [data-tab-go]')].filter(e => e.offsetParent !== null && !e.closest('#askPanel') && !/download|export|ask|scan|photo|upload|csv|file|print|copy|share|reset everything|erase|forget|start from zero/i.test((e.textContent || '') + (e.id || '') + (e.className || ''))); if (!els.length) return; els[Math.floor(R * els.length)].click(); window.__last = 'click ' + (els[Math.floor(R * els.length)].textContent || '').slice(0, 30); }, rnd());
        } else if (kind === 'select') {
          await p.evaluate(R => { const els = [...document.querySelectorAll('select')].filter(e => e.offsetParent !== null && e.id !== 'curSel' && e.options.length > 1); if (!els.length) return; const e = els[Math.floor(R * els.length)]; e.selectedIndex = Math.floor(((R * 977) % 1) * e.options.length); e.dispatchEvent(new Event('change', { bubbles: true })); window.__last = 'select ' + e.id; }, rnd());
        } else if (kind === 'month') {
          await p.evaluate(ym => { const s = document.querySelector('#monthSel'); s.value = ym; s.dispatchEvent(new Event('change', { bubbles: true })); }, pick(M.MONTHS));
        } else if (kind === 'tab') {
          await p.evaluate(t => document.querySelector('#tab-' + t).click(), pick(['home', 'month', 'goals', 'receipts', 'basics']));
        } else {
          await p.keyboard.press(pick(['Enter', 'Escape', 'Tab', 'ArrowRight', 'ArrowLeft']));
        }
      } catch (e) { /* the page moved on; that is fine */ }
      trace.push(a + ' ' + kind + ' ' + (await p.evaluate(() => window.__last).catch(() => '?')));
      await w(60);
      if (a % 7 === 6) { await w(650); await health(p, tag + ' step ' + a); await compare(p, tag + ' step ' + a); }
    }
    await w(650); await health(p, tag + ' end'); await compare(p, tag + ' end');
    trace.length = 0;
    eq(tag + ' page errors', errs.join(' | '), '');
    await p.close();
  }
  await b.close();
  console.log('sessions', SESSIONS, '| random actions', acts, '| checks', checks, '| mismatches', fails.length);
  fails.forEach(f => console.log('  ', f));
  process.exit(fails.length ? 1 : 0);
})();
