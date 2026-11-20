/* Launch checklist Q3 (north-star QC, 2026-11-19): how Plan reads after a borrow from the emergency fund. Made-up numbers, yen and dollars with cents.
   (a) Two rows were both named "Borrowed". One is borrowed money that stays in the bank, the other is borrowed money that pays for part of the plan.
       Each has its own name now, and the bar's tooltip uses the same words as the row.
   (b) The rows read 117% and "Borrowed 17%" and the sentence said the places "add up to 117%". Now the sentence says the pay is 100% and
       the other 17% is the borrowed money.
   (c) The button borrows what brings the bank back up to the minimum balance (220.50 here). The part of it the plan needs (200.50, what the bills
       are over the pay) and the part that stays in the bank (20) are two rows that add up to the amount on the button, and the sentence names
       its amount as the part that pays for the plan, in the row's words.
   Run: node tests/qc/qc9_plan_borrow.js   (PAGE=<built page> to run it on another build, for example the one before the fix) */
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const num = s => parseFloat(String(s).replace(/−/g, '-').replace(/[^\d.-]/g, '')) || 0;
const near = (a, b) => Math.abs(a - b) < 0.006;
const look = p => p.evaluate(() => {
  const r = document.querySelector('#bar [data-k="rest"]');
  return { verdict: document.getElementById('verdict').innerText, btns: [...document.querySelectorAll('#fixBtns button')].map(b => b.innerText.trim()), title: document.getElementById('whereTitle').innerText,
    rows: [...document.querySelectorAll('#legend .lg')].map(e => ({ name: e.querySelector('span').childNodes[0].textContent.trim(), sub: (e.querySelector('small') || {}).innerText || '', v: e.querySelector('b').innerText, pct: e.querySelector('em').innerText,
      left: Math.round(e.getBoundingClientRect().left), right: Math.round(e.getBoundingClientRect().right), cut: e.scrollWidth > e.clientWidth + 1 })),
    note: document.getElementById('jarNote').innerText, dock: document.getElementById('dockNum').innerText + ' ' + document.getElementById('dockTxt').innerText,
    tip: r.dataset.tip.replace(/<br>/g, ' | ').replace(/<[^>]+>/g, ''), tipHead: (r.dataset.tip.match(/<b>([^<]*)<\/b>/) || [])[1] || '', restAria: r.getAttribute('aria-label'), barAria: document.getElementById('bar').getAttribute('aria-label'),
    page: document.getElementById('p-month').innerText, wide: document.documentElement.scrollWidth, vw: innerWidth };
});
(async () => {
  let errsAll = [];
  for (const cur of ['$', '¥']) {
    /* pay 1,200, bills 1,400.50 (dollars) or the same times 100 in yen, bank 100, minimum balance 120, 800 already in the emergency fund */
    const k = cur === '$' ? 1 : 100, pay = 1200 * k, rent = 1000 * k, food = 400.5 * k, bank = 100 * k, min = 120 * k;
    const bills = rent + food, overPay = bills - pay, need = min - (bank + pay - bills), kept = need - overPay;   /* 200.50 over pay, 220.50 to borrow, 20 of it stays in the bank */
    const T = `[${cur}] `;
    const { b, p, errs } = await R.phone({ w: 412, h: 915, dpr: 1, mobile: true, keep: true });
    await clock(p, '2026-11-19T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
    await L.zero(p); await p.evaluate(c => { __t.S.ui.cur = c; }, cur);
    await L.base(p, { pay, bank, min, defs: { 'bill:rent': rent, 'bill:food': food, envelope: 0, education: 0, invest: 0, give: 0 }, noTrip: true, eT: 3000 * k, eS: 800 * k, eM: 0 });
    await w(300); await skip(p);
    await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); });
    await L.tab(p, 'tab-month'); await w(500);

    /* ---- before the borrow: the button offers what the inputs say is missing ---- */
    const a = await look(p), offer = a.btns.find(t => /^Borrow /.test(t)) || '';
    ck(T + `the button offers ${need}: what brings the bank from ${bank + pay - bills} up to the ${min} minimum`, near(num(offer), need), a.btns);
    ck(T + 'the sentence above the button names the same amount', a.verdict.includes(offer.replace(/^Borrow (\S+) .*/, '$1')), a.verdict);
    await p.evaluate(() => document.querySelector('[data-fx="borrow"]').click()); await w(900);

    /* ---- after the borrow ---- */
    const s = await look(p), names = s.rows.map(r => r.name), bor = s.rows.filter(r => /borrow/i.test(r.name + ' ' + r.sub));
    const keptRow = s.rows.find(r => /stays in the bank/.test(r.name + ' ' + r.sub)), usedRow = s.rows.find(r => /pays for part of this plan/.test(r.name + ' ' + r.sub));
    ck(T + 'no two rows share a name', new Set(names).size === names.length, names);
    ck(T + 'no row is named just "Borrowed"', !names.includes('Borrowed'), names);
    ck(T + 'there are two borrowed rows: one stays in the bank, one pays for part of this plan', bor.length === 2 && !!keptRow && !!usedRow && keptRow !== usedRow, bor);
    ck(T + `the row that stays in the bank is ${kept}`, !!keptRow && near(num(keptRow.v), kept), keptRow);
    ck(T + `the row that pays for part of this plan is ${overPay}`, !!usedRow && near(num(usedRow.v), overPay), usedRow);
    const tb = (s.title.match(/and (\S+) borrowed/) || [])[1];
    ck(T + `the two rows add up to the amount borrowed in the title (${tb}) and on the button (${need})`, !!keptRow && !!usedRow && near(num(keptRow.v) + num(usedRow.v), need) && near(num(tb), need), s.title);
    ck(T + 'each row says in its name what the money does, so the names differ where the eye lands', !!keptRow && /stays in the bank/.test(keptRow.name) && !!usedRow && /pays for part of this plan/.test(usedRow.name), bor.map(r => r.name));
    /* one piece, one name: the bar's tooltip for the same money uses the row's words */
    ck(T + 'the bar tooltip says "stays in the bank", the same words as the row', /stays in the bank/.test(s.tip) && !/kept in the bank/.test(s.tip), s.tip);
    ck(T + 'the bar piece is the same amount as the row that stays in the bank', near(num(s.restAria), kept), s.restAria);
    ck(T + 'the bar piece and its tooltip are named as the row, not "Left"', !!keptRow && s.tipHead === keptRow.name && s.restAria.startsWith(keptRow.name + ' ') && !/\bLeft\b/.test(s.tip + ' ' + s.barAria), { tip: s.tip, aria: s.restAria, bar: s.barAria });
    /* (b) the percents reconcile: places are 100 + the borrowed part, and the sentence says which is which */
    const billsRow = s.rows.find(r => /^Bills/.test(r.name)), placed = s.rows.filter(r => !/borrow/i.test(r.name)).reduce((x, r) => x + (parseInt(r.pct) || 0), 0), bp = usedRow ? parseInt(usedRow.pct) || 0 : 0;
    ck(T + `the places (${placed}%) are 100% plus the borrowed row's percent (${bp}%)`, bp > 0 && placed === 100 + bp, s.rows.map(r => r.name + ' ' + r.pct));
    ck(T + 'the bills percent is the bills over the pay, within 1 point', !!billsRow && Math.abs(parseInt(billsRow.pct) - bills / pay * 100) < 1, billsRow);
    ck(T + 'nothing on Plan says the places "add up to" more than 100%', !/add(s)? up to 1\d\d%/.test(s.page), s.note);
    ck(T + `the sentence says the pay is 100% and the other ${bp}% is borrowed`, /100%/.test(s.note) && new RegExp('\\b' + bp + '%').test(s.note) && new RegExp('other ' + bp + '% is the borrowed ').test(s.note), s.note);
    ck(T + 'the sentence says its amount is the part that pays for part of this plan, the row\'s own words', /pays for part of this plan/.test(s.note), s.note);
    ck(T + 'the amount in the sentence is the row that pays for part of this plan', (s.note.match(/[$¥][\d,.]*\d/g) || []).some(x => near(num(x), overPay)) && !(s.note.match(/[$¥][\d,.]*\d/g) || []).some(x => near(num(x), need)), s.note);
    ck(T + `the top line says ${overPay} more planned than pay and ${need} borrowed`, near(num((s.dock.match(/[$¥][\d,.]*\d/) || [])[0]), overPay) && near(num((s.dock.match(/, (\S+) borrowed/) || [])[1]), need), s.dock);
    ck(T + 'nothing is cut off or wider than the 412 wide phone', s.wide <= s.vw && s.rows.every(r => !r.cut && r.left >= 0 && r.right <= s.vw), { wide: s.wide, rows: s.rows.filter(r => r.cut || r.right > s.vw) });

    /* ---- some of the borrowed money in the bank is then spent past the plan: still one name per row ---- */
    const spent = 5 * k;
    await p.evaluate(a => { const S = __t.S; S.receipts = [{ id: 'q9b1', d: '2026-11-10', a, c: 'envelope', cn: 'Free to spend', n: '' }]; __t.persist(); __t.restructure(); }, spent);
    await L.tab(p, 'tab-home'); await L.tab(p, 'tab-month'); await w(500);
    const o = await look(p), on = o.rows.map(r => r.name), k2 = o.rows.find(r => /stays in the bank/.test(r.name)), sp = o.rows.find(r => /borrow/i.test(r.name) && /spending past plan/.test(r.name));
    ck(T + 'after spending past plan: no two rows share a name and none is just "Borrowed"', new Set(on).size === on.length && !on.includes('Borrowed'), on);
    ck(T + `after spending past plan: ${kept - spent} still stays in the bank and ${spent} was used for spending past plan`, !!k2 && !!sp && near(num(k2.v), kept - spent) && near(num(sp.v), spent), o.rows.filter(r => /borrow/i.test(r.name)));
    const borSum = o.rows.filter(r => /borrow/i.test(r.name)).reduce((x, r) => x + num(r.v), 0);
    ck(T + 'after spending past plan: the bar tooltip lists both borrowed pieces under their row names and amounts', !!k2 && !!sp && o.tip.includes(k2.name + ' ' + k2.v) && o.tip.includes(sp.name + ' ' + sp.v), o.tip);
    ck(T + `after spending past plan: the borrowed rows still add up to ${need}`, near(borSum, need), o.rows.filter(r => /borrow/i.test(r.name)));
    errsAll = errsAll.concat(errs); await b.close();
  }
  ck('no page errors', errsAll.length === 0, errsAll);
  console.log(bad ? `QC9 PLAN BORROW FAIL ${bad}` : 'QC9 PLAN BORROW PASS');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log('FAIL crashed: ' + e.stack); process.exit(1); });
