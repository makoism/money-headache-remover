#!/usr/bin/env node
/* Screen pack for QC reviewers: screenshots and the words of every main screen of app3, so a reviewer starts from
   pictures and text and opens a browser only to tap through a flow. Read-only on the app.
   Run: node wip/team/qc/pack3.js <out folder> [today YYYY-MM-DD]
   It saves, for the made-up book (?try=mako) and for an empty first open, at phone 390x844 and desktop 1300x900:
   <state>_<size>_<screen>.png and .txt. Screens it could not open are listed in MISSING.txt (a reviewer reports them). */
'use strict';
const Q = require('./qc3.js'), fs = require('fs'), path = require('path');
const out = process.argv[2], today = process.argv[3] || '2026-12-10';
if (!out) { console.error('give an output folder'); process.exit(2); }
fs.mkdirSync(out, { recursive: true });
const SCREENS = ['Home', 'Receipts', 'Plan', 'Settings', 'Reminders', 'Ask'];
const missing = [];
(async () => {
  for (const state of ['sample', 'empty']) for (const size of ['phone', 'desktop']) {
    for (const name of SCREENS) {
      const d = await Q.open({ today, sample: state === 'sample', desktop: size === 'desktop', dpr: 2 });
      try {
        const el = d.p.getByText(name, { exact: true }).first();
        if (!(await el.count())) { missing.push(`${state} ${size}: no "${name}" to tap`); continue; }
        await el.click({ timeout: 3000 }); await d.p.waitForTimeout(500);
        const base = path.join(out, `${state}_${size}_${name.toLowerCase()}`);
        await d.p.screenshot({ path: base + '.png', fullPage: true });
        fs.writeFileSync(base + '.txt', await Q.text(d.p));
        if (d.errs.length) missing.push(`${state} ${size} ${name}: ${d.errs.join(' | ')}`);
      } catch (e) { missing.push(`${state} ${size} ${name}: ${String(e.message).split('\n')[0]}`); }
      finally { await d.close(); }
    }
  }
  fs.writeFileSync(path.join(out, 'MISSING.txt'), missing.join('\n') + '\n');
  console.log(`screen pack in ${out}: ${fs.readdirSync(out).filter(f => f.endsWith('.png')).length} screens, ${missing.length} not opened or with errors`);
  process.exit(0);
})();
