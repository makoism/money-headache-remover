/* Findings of the v1 QC run (2026-11-19) that were fixed before the preview:
     A. Settings, Backup and Restore: the how-to steps are readable lines, not a column one word wide (they reused the start checklist's "steps" grid)
     B. cloud copy dates are day then month ("19 Nov, 2:03 PM"), like every other date in the app
     C. the setup offer names buttons that exist (Find my copy, then Load), not "Load my numbers"
     D. the iPhone Home Screen note names the taps (Keep a copy in the cloud, I have a code, Find my copy, Load)
   Run: node tests/qc/qc8_fixes.js */
const fs = require('fs');
const { phone, w } = require('/tmp/v39/real.js');
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 300)); } };
(async () => {
  for (const W of [390, 320]) {
    const o = await phone({ w: W, h: 844, dpr: 1, mobile: true });
    await o.p.goto('file://' + PAGE + '?sfxtest#2026-11'); await w(1300);
    await o.p.evaluate(() => { ['tourSkip', 'coSkip'].forEach(i => { const e = document.getElementById(i); e && e.click(); }); }); await w(400);
    await o.p.evaluate(() => document.getElementById('gearBtn').click()); await w(600);
    const m = await o.p.evaluate(() => {
      document.querySelectorAll('details').forEach(d => { d.open = true; });
      return ['bkSteps', 'rsSteps'].map(id => { const ol = document.getElementById(id); return { id, n: ol ? ol.children.length : 0, lis: ol ? [...ol.children].map(li => ({ w: Math.round(li.getBoundingClientRect().width), h: Math.round(li.getBoundingClientRect().height), ch: li.textContent.length })) : [] }; });
    });
    m.forEach(x => {
      ck(`A ${W}px: ${x.id} has its steps`, x.n >= 2, x);
      /* a readable line: at 15px about 7px a letter, so the height is near (letters * 7 / width) lines of 22px; one word wide is ten times that */
      ck(`A ${W}px: every ${x.id} step is a readable line, not a narrow column`, x.lis.length > 0 && x.lis.every(l => l.w >= W * 0.6 && l.h <= (Math.ceil(l.ch * 9 / l.w) + 2) * 26), x.lis);
    });
    if (W === 390) {
      const line = (fs.readFileSync(PAGE, 'utf8').match(/^const vaultWhen = .*$/m) || [''])[0];
      const vaultWhen = line ? new Function(line + '; return vaultWhen;')() : () => 'vaultWhen not found';
      const d = { a: vaultWhen(new Date(2026, 10, 19, 14, 3).getTime()), b: vaultWhen(new Date(2026, 0, 5, 9, 30).getTime()), z: vaultWhen(0) };
      ck('B a cloud copy date reads day then month: 19 Nov, 2:03 PM', d.a === '19 Nov, 2:03 PM', d);
      ck('B 5 Jan, 9:30 AM', d.b === '5 Jan, 9:30 AM', d);
      ck('B no date, no words', d.z === '', d);
      const cap = await o.p.evaluate(() => (document.getElementById('installCap') || {}).textContent || '');
      ck('D the iPhone Home Screen note names the taps', ['Keep a copy in the cloud', 'I have a code', 'Find my copy', 'Load'].every(s => cap.includes(s)), cap);
      ck('D it no longer says "turn on the cloud copy first"', !/turn on the cloud copy first/.test(cap), cap);
    }
    await o.b.close();
  }
  const src = fs.readFileSync(PAGE, 'utf8');
  ck('C no line names a "Load my numbers" button', !src.includes('Load my numbers'));
  ck('C the setup offer says Find my copy, then Load', /tap Enter your recovery code, type the code in, tap Find my copy, then tap Load and they come back/.test(src));
  ck('B no month-first date is built for a line a person reads', !/month: 'short', day: 'numeric'/.test(src));
  console.log(bad ? `FAILED (${bad})` : 'ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('FAIL crashed: ' + e.message); console.log('FAILED'); process.exit(1); });
