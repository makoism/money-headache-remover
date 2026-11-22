/* QC round 5 wording B1: Settings > Restore, paste text that is not a backup, tap Load backup: the button asked "Tap again: replaces your
   pay, bills, goals and receipts..." before checking the text, and after the second tap nothing could be seen. The text is checked first:
   the button does not arm, and a message in sight says what to do. A real backup still asks first.  Made-up numbers.
   Run: node tests/qc/qc12_bad_backup.js */
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
const L = require('./lib_r12.js'); const R = L.R, w = R.w;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 400)); } };
const skip = async p => { for (const id of ['tourSkip', 'coSkip']) { await p.evaluate(id => { const s = document.getElementById(id); if (s && s.offsetParent) s.click(); }, id); await w(350); } };
const state = p => p.evaluate(() => { const m = document.getElementById('bkMsg'), b = document.getElementById('bkLoad'), r = m ? m.getBoundingClientRect() : null;
  const inView = !!(r && r.height > 0 && r.bottom > 0 && r.top < innerHeight && !m.closest('[hidden]'));
  return { msg: m ? m.textContent.trim() : '', inView, btn: b ? b.textContent.trim() : '', armed: !!(b && b.dataset.armed) }; });
(async () => {
  for (const [W, H] of [[390, 844], [412, 915]]) {
    const { b, p, errs } = await R.phone({ w: W, h: H, dpr: 1, mobile: true });
    await p.goto('file://' + PAGE + '?sfxtest'); await w(1200); await skip(p);
    await L.settings(p); await w(500);
    const good = await p.evaluate(() => JSON.stringify(__t.S));
    await p.evaluate(() => { const t = document.getElementById('bk'); t.scrollIntoView({ block: 'center' }); t.value = 'not a backup'; t.dispatchEvent(new Event('input', { bubbles: true })); }); await w(200);
    await p.evaluate(() => document.getElementById('bkLoad').click()); await w(800);
    let s = await state(p);
    ck(`${W}x${H} not a backup: the button does not ask to replace the numbers`, !s.armed && !/Tap again/.test(s.btn), s);
    ck(`${W}x${H} not a backup: a message in sight says it isn't a backup and what to do`, s.inView && /isn't a backup/.test(s.msg) && /Copy text|Choose file/.test(s.msg), s);
    await p.evaluate(() => document.getElementById('bkLoad').click()); await w(800);
    s = await state(p);
    ck(`${W}x${H} a second tap: still the message, nothing replaced`, s.inView && /isn't a backup/.test(s.msg) && (await p.evaluate(() => JSON.stringify(__t.S))) === good, s);
    /* a real backup still asks first */
    await p.evaluate(g => { const t = document.getElementById('bk'); t.value = g; t.dispatchEvent(new Event('input', { bubbles: true })); }, good); await w(200);
    await p.evaluate(() => document.getElementById('bkLoad').click()); await w(800);
    s = await state(p);
    ck(`${W}x${H} a real backup: the button asks first`, s.armed && /Tap again/.test(s.btn), s);
    await p.evaluate(() => document.getElementById('bkLoad').click()); await w(800);
    s = await state(p);
    ck(`${W}x${H} a real backup: the second tap loads it`, /Loaded/.test(s.msg), s);
    const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
    ck(`${W}x${H}: no page errors`, e2.length === 0, e2.slice(0, 3));
    await b.close();
  }
  console.log(bad ? `qc12_bad_backup: ${bad} FAIL` : 'qc12_bad_backup: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc12_bad_backup: FAIL'); process.exit(1); });
