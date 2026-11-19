/* H1 (novice walk, 2026-11-19), finding 11, the parts where something covers a control or a number (checklist U2). Built page, made-up numbers.
   A. Home on a phone (390x844, 320x568): the Help button sits on a full-width shelf at the bottom, never floating over a card. The shelf is
      solid, takes the taps, and the page can scroll its last control clear of it. On desktop (1280x800) Help touches no control at any scroll.
   B. Setup: a message (toast) never lands on Back, Next or Done, on any step, also when it wraps to two lines.
   C. Setup at 320x568: any field or button in a step, once focused, sits clear of the faded strip above Back and Next.
   D. Setup, Free to spend: the colour bar and every piece of it stay inside the column, and the bar's right end is rounded like its left.
   Run: node tests/qc/h1_cover.js */
let bad = 0; const ck = (n, c, x) => { console.log(c ? 'PASS' : 'FAIL', n, c ? '' : (x || '')); if (!c) bad++; };
const L = require('./lib_r12.js'); const R = L.R; const w = R.w;
const PAGE = 'file://' + (process.env.BUILD || '/home/claude/work/money-map-team.html') + '?sfxtest';
const FADE = 80;   /* the faded strip at the foot of the setup scroll area (style.css .tour-scroll mask) */
(async () => {
  let errsAll = [];
  /* ---- A: Home ---- */
  for (const [W, H] of [[390, 844], [320, 568], [1280, 800]]) {
    const phone = W < 600;
    const { b, p, errs } = await L.start({ w: W, h: H, dpr: 1, mobile: phone });
    await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '¥'; });
    await L.base(p, { pay: 280000, bank: 412000, min: 0, defs: { 'bill:rent': 95000, 'bill:food': 45000, envelope: 30000, education: 0, invest: 10000, give: 0 }, tT: 0, tM: 0, eT: 300000, eS: 0, eM: 20000, noTrip: true });
    for (let i = 0; i < 3; i++) { await p.evaluate(() => { const s = document.getElementById('tourSkip'); if (s && s.offsetParent) s.click(); }); await w(300); }
    await p.evaluate(() => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true }; S.ui.sampleHidden = true; __t.ACT.setCard(null, { name: 'Made-up Visa', owed: 38000, payDay: 27 }); __t.ACT.setBankNow(380000); });
    await L.tab(p, 'tab-month'); await L.tab(p, 'tab-home'); await w(4200);   /* the messages from the set-up above are gone */
    const max = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    const hits = []; let shelf = true, shelfWhy = '';
    for (let y = 0; ; y = Math.min(max, y + Math.round(H * 0.4))) {
      await p.evaluate(y => scrollTo(0, y), y); await w(120);
      const r = await p.evaluate(() => { const hb = document.getElementById('helpBtn'), h = hb.getBoundingClientRect(), help = document.getElementById('help');
        const vis = e => (e.offsetParent || e.getClientRects().length) && getComputedStyle(e).visibility !== 'hidden';
        const under = [...document.querySelectorAll('.wrap button, .wrap input, .wrap select, .wrap a, .wrap summary, .wrap b')].filter(vis).filter(e => { const q = e.getBoundingClientRect(); return q.width > 0 && q.height > 0 && q.left < h.right && q.right > h.left && q.top < h.bottom && q.bottom > h.top; }).map(e => (e.id || e.className || e.tagName) + ':' + e.textContent.trim().slice(0, 16));
        const my = h.top + h.height / 2, pts = [8, innerWidth / 2, h.left - 12].map(x => { const e = document.elementFromPoint(x, my); return !!e && help.contains(e); });
        const row = hb.closest('.help-row'), bg = getComputedStyle(row, '::before'), solid = bg.content !== 'none' && !/rgba\([^)]*,\s*0\)|transparent/.test(bg.backgroundColor) || /gradient/.test(bg.backgroundImage);
        return { under, pts, solid, top: Math.round(h.top) }; });
      if (phone) { if (!r.pts.every(Boolean) || !r.solid) { shelf = false; shelfWhy = `at scroll ${y}: ${JSON.stringify(r)}`; } }
      else if (r.under.length) hits.push(`scroll ${y}: ${r.under.join(', ')}`);
      if (y >= max) break;
    }
    if (phone) {
      ck(`${W}x${H} Home: Help sits on a solid full-width shelf, not floating over the cards`, shelf, shelfWhy);
      await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await w(200);
      const end = await p.evaluate(() => { const h = document.getElementById('helpBtn').getBoundingClientRect(), vis = e => (e.offsetParent || e.getClientRects().length) && getComputedStyle(e).visibility !== 'hidden';
        const low = [...document.querySelectorAll('.wrap button, .wrap input, .wrap select, .wrap a, .wrap summary, .wrap b')].filter(vis).map(e => [e, e.getBoundingClientRect()]).filter(([e, q]) => q.height > 0 && q.bottom > h.top - 8 && q.top < innerHeight);
        return low.map(([e]) => (e.id || e.className || e.tagName) + ':' + e.textContent.trim().slice(0, 16)); });
      ck(`${W}x${H} Home: at the end of the page nothing is left under the shelf`, end.length === 0, end.join(', '));
    } else ck(`${W}x${H} Home: Help touches no control or number at any scroll`, hits.length === 0, hits.slice(0, 3).join(' | '));
    errsAll = errsAll.concat(errs); await b.close();
  }
  /* ---- B, C, D: setup ---- */
  for (const [W, H] of [[390, 844], [320, 568]]) {
    const { b, p, errs } = await R.phone({ w: W, h: H, dpr: 1, mobile: true });
    await p.goto(PAGE); await w(1500);
    const toastHits = [], fieldHits = []; let steps = 0, barSeen = false;
    for (let i = 0; i < 16; i++) {
      await p.evaluate(() => { const set = (id, v) => { const e = document.getElementById(id); if (e && !e.value && !e.readOnly) { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); } };
        set('tourPay', 3200); set('tourBank', 1500); if (!document.getElementById('tourCardT')) set('tourAmt', 400);
        const c = [...document.querySelectorAll('input[name="tourBill"]')].find(x => /card/i.test(x.value)); if (c && !c.checked) c.click(); });
      await w(250);
      const title = await p.evaluate(() => { const t = document.querySelector('#tour h2, .tour h2'); return t ? t.innerText.trim() : ''; }); steps++;
      /* B: a short and a long message */
      for (const msg of ['Badge: Pay set.', 'Made-up message that is long enough to wrap onto a second line on a phone.']) {
        await p.evaluate(m => __pix.celebrate('small', m), msg); await w(450);
        const hit = await p.evaluate(() => { const c = document.getElementById('cheer').getBoundingClientRect(), vis = e => e.offsetParent || e.getClientRects().length;
          return [...document.querySelectorAll('.tour-foot button, .tour-top button')].filter(vis).filter(e => { const q = e.getBoundingClientRect(); return q.width > 0 && q.left < c.right && q.right > c.left && q.top < c.bottom && q.bottom > c.top; }).map(e => e.id || e.textContent.trim()); });
        if (hit.length) toastHits.push(`${title} (${msg.length} letters): on ${hit.join(', ')}`);
      }
      /* C: focus every field in turn */
      if (H === 568) {
        const n = await p.evaluate(() => [...document.querySelectorAll('#tourBody input:not([type=checkbox]):not([type=radio]):not([type=range]), #tourBody select, #tourBody button, #tourBody summary')].filter(e => e.offsetParent && (e.tagName === 'SUMMARY' || !e.closest('details:not([open])')))   /* not what a closed fold hides */.length);
        for (let k = 0; k < n; k++) {
          const f = await p.evaluate(async (k, FADE) => { const e = [...document.querySelectorAll('#tourBody input:not([type=checkbox]):not([type=radio]):not([type=range]), #tourBody select, #tourBody button, #tourBody summary')].filter(e => e.offsetParent && (e.tagName === 'SUMMARY' || !e.closest('details:not([open])')))   /* not what a closed fold hides */[k]; if (!e) return null;
            e.focus(); await new Promise(r => setTimeout(r, 450)); const q = e.getBoundingClientRect(), s = document.getElementById('tourScroll').getBoundingClientRect();
            return { id: e.id || e.name || e.className || e.tagName, top: Math.round(q.top), bottom: Math.round(q.bottom), clear: Math.round(s.bottom - FADE), sTop: Math.round(s.top), ok: q.bottom <= s.bottom - FADE + 1 && q.top >= s.top - 1 }; }, k, FADE);
          if (f && !f.ok) fieldHits.push(`${title}: ${JSON.stringify(f)}`);
        }
      }
      /* D: the colour bar on Free to spend */
      const bar = await p.evaluate(() => { const bar = document.querySelector('#tourBody .tour-bar'); if (!bar) return null; const B = bar.getBoundingClientRect(), col = document.getElementById('tourBody').getBoundingClientRect();
        const segs = [...bar.children].filter(e => e.getBoundingClientRect().width > 0), last = segs[segs.length - 1], first = segs[0], lr = last.getBoundingClientRect();
        const rad = e => parseFloat(getComputedStyle(e).borderTopRightRadius) || 0, radL = e => parseFloat(getComputedStyle(e).borderTopLeftRadius) || 0;
        return { barR: Math.round(B.right), colR: Math.round(col.right), vw: innerWidth, lastR: Math.round(lr.right), inside: B.right <= col.right + 1 && B.right <= innerWidth - 12 && segs.every(s => s.getBoundingClientRect().right <= B.right + 1),
          flush: Math.abs(lr.right - B.right) <= 1, endR: Math.max(rad(last), getComputedStyle(bar).overflow === 'hidden' ? rad(bar) : 0), endL: Math.max(radL(first), getComputedStyle(bar).overflow === 'hidden' ? radL(bar) : 0), lastW: Math.round(lr.width) }; });
      if (bar) { barSeen = true; ck(`${W}x${H} Free to spend: the colour bar and its pieces stay inside the column`, bar.inside && bar.flush, JSON.stringify(bar)); ck(`${W}x${H} Free to spend: the bar's right end is rounded like its left`, bar.endR > 0 && bar.endR === bar.endL && bar.lastW >= 2 * bar.endR, JSON.stringify(bar)); }
      if (/done/i.test(title) && i > 3) break;
      const ok = await p.evaluate(() => { const n = document.getElementById('tourNext'); if (n && n.offsetParent) { n.click(); return true; } return false; }); if (!ok) break; await w(900);
    }
    ck(`${W}x${H} setup: walked ${steps} steps`, steps >= 8);
    ck(`${W}x${H} setup: no message lands on Back, Next, Done or the top buttons`, toastHits.length === 0, toastHits.slice(0, 4).join(' | '));
    if (H === 568) ck(`${W}x${H} setup: a focused field or button sits clear of the faded strip above Back and Next`, fieldHits.length === 0, fieldHits.length + ': ' + fieldHits.slice(0, 4).join(' | '));
    ck(`${W}x${H} setup: the Free to spend colour bar was seen`, barSeen);
    errsAll = errsAll.concat(errs); await b.close();
  }
  ck('no page errors', errsAll.length === 0, errsAll.join(' | '));
  console.log(bad ? 'H1 COVER FAIL ' + bad : 'H1 COVER PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('FAIL the test stopped: ' + e.message); console.log('H1 COVER FAIL'); process.exit(1); });
