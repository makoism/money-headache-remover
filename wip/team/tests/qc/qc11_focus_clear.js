/* QC round 4 layout and touch (confusing 1): at 390 and 320, Tab put controls ("Your pay in Nov, and where it goes", "More", and on Plan
   "Change", "Log spend", the Free to spend row) under the fixed Help shelf along the bottom. A control that gets the keyboard focus
   scrolls clear of it. Sample numbers.  Run: node tests/qc/qc11_focus_clear.js */
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
(async () => {
  for (const [W, H] of [[390, 844], [320, 640]]) {
    const { b, p, errs } = await R.phone({ w: W, h: H, dpr: 1, mobile: true });
    await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
    for (const t of ['tab-home', 'tab-month']) {
      await L.tab(p, t); await w(400);
      await p.evaluate(() => { window.scrollTo(0, 0); document.activeElement && document.activeElement.blur(); const s = document.querySelector('.tabs button[aria-selected="true"], .tabs button'); s && s.focus(); }); await w(200);
      const under = [];
      for (let i = 0; i < 45; i++) {
        await p.keyboard.press('Tab'); await w(60);
        const r = await p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; if (e.closest('.help, .help-row, #undoBar, .tour, #why, .gw')) return null;
          const b = e.getBoundingClientRect(); if (!b.height) return null; const shelf = innerHeight - 70; return b.bottom > shelf + 1 && b.top < innerHeight ? (e.innerText || e.getAttribute('aria-label') || e.id || e.tagName).trim().slice(0, 40) + ' ' + Math.round(b.top) + '..' + Math.round(b.bottom) : null; });
        if (r) under.push(r);
      }
      ck(`${W}x${H} ${t}: no focused control sits under the Help shelf`, under.length === 0, under.slice(0, 6));
    }
    const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
    ck(`${W}x${H}: no page errors`, e2.length === 0, e2.slice(0, 3));
    await b.close();
  }
  console.log(bad ? `qc11_focus_clear: ${bad} FAIL` : 'qc11_focus_clear: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc11_focus_clear: FAIL'); process.exit(1); });
