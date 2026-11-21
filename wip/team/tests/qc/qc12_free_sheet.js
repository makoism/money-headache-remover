/* QC round 5 novice B2: at 390x844 the Free to spend sheet on Home put its amounts off the right edge (to 547px) and squeezed
   "Not safe to spend yet" to a word per line. At 320 to 412 wide nothing in the sheet sticks out past the screen.
   Made-up numbers.  Run: node tests/qc/qc12_free_sheet.js */


const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const clock = (p, iso) => p.evaluateOnNewDocument(iso => { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }, iso);
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const click = async (p, sel) => { await p.evaluate(s => { const e = document.querySelector(s); if (e) e.click(); }, sel); await w(600); };
const t = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); return e ? e.innerText.replace(/\s+/g, ' ').trim() : ''; }, sel);
(async () => {
  for (const [W, H] of [[320, 640], [360, 780], [390, 844], [412, 915]]) {
    const { b, p, errs } = await R.phone({ w: W, h: H, dpr: 1, mobile: true, keep: true });
    await clock(p, '2026-11-19T10:00:00'); await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
    await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '¥'; });
    await L.base(p, { pay: 300000, bank: 300000, min: 0 }); await w(400); await skip(p);
    await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; S.ui.toured = true; __t.persist(); __t.restructure(); });
    await L.rc(p, 2000, 'envelope', '2026-11-19', 'Made-up lunch'); await w(400);
    await L.tab(p, 'tab-home'); await w(300);
    if (await p.$('#mpCheck')) await click(p, '#mpCheck');
    await L.typeIn(p, '#mpBankIn', '100000'); await click(p, '#mpBankSave');
    /* the Free to spend chest on Home, as a person taps it */
    const opened = await p.evaluate(() => { const r = document.querySelector('#mpRooms [data-room="play"]') || document.querySelector('[data-why="free"]'); if (!r) return false; r.scrollIntoView({ block: 'center' }); r.click(); return true; }); await w(700);
    const out = await p.evaluate(() => { const box = document.querySelector('#why'); if (!box || box.hidden) return { open: false };
      const wide = [...box.querySelectorAll('*')].filter(e => e.getClientRects().length && e.getBoundingClientRect().width > 0).map(e => ({ t: (e.innerText || e.tagName).replace(/\s+/g, ' ').slice(0, 40), r: Math.round(e.getBoundingClientRect().right), l: Math.round(e.getBoundingClientRect().left) })).filter(x => x.r > innerWidth + 1 || x.l < -1);
      const words = [...box.querySelectorAll('*')].filter(e => e.children.length === 0 && e.getClientRects().length && (e.innerText || '').trim().split(/\s+/).length >= 3).filter(e => { const r = e.getBoundingClientRect(), lh = parseFloat(getComputedStyle(e).lineHeight) || 18; return r.width < 70 && r.height > lh * 2.5; }).map(e => e.innerText.slice(0, 40));
      return { open: true, wide: wide.slice(0, 5), squeezed: words.slice(0, 5), text: box.innerText.replace(/\s+/g, ' ').slice(0, 200) }; });
    ck(`${W}x${H}: tapping Free to spend opens its sheet, the not safe yet one`, opened && out.open && /Not safe to spend yet/.test(out.text), out);
    ck(`${W}x${H}: nothing in the sheet sticks out past the screen`, out.open && out.wide.length === 0, out.wide);
    ck(`${W}x${H}: no sentence squeezed to a word per line`, out.open && out.squeezed.length === 0, out.squeezed);
    const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
    ck(`${W}x${H}: no page errors`, e2.length === 0, e2.slice(0, 3));
    await b.close();
  }
  console.log(bad ? `qc12_free_sheet: ${bad} FAIL` : 'qc12_free_sheet: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc12_free_sheet: FAIL'); process.exit(1); });
