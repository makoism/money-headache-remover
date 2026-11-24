/* QC reviewers' way into app3 (the new Burrow page). Read-only helper: it opens the built page in a real browser.
   Usage, from any folder:
     const Q = require('<repo>/wip/team/qc/qc3.js');
     const d = await Q.open({ today: '2026-12-10' });        // one device, empty storage, phone 390x844
     await d.p.screenshot({ path: '/tmp/qc/<role>/home.png' });
     await d.close();
   Options: w, h (size), desktop: true (1300x900, no touch), scheme: 'light' | 'dark', today: 'YYYY-MM-DD' (the page's
   day), sample: true (the read-only made-up book, ?try=mako), url (a served address, see serve()), page (another built
   file; default wip/team/app3/index.html, or the APP3 environment variable).
   Each open() is a new device with its own empty storage. To reload and keep storage, use d.p.reload(). To act as the
   same device later, pass profile: '<folder>' to both opens.
   d.errs collects page errors and console errors; a reviewer reports any.
   Two devices and the cloud copy: const s = await Q.serve(); then Q.open({ url: s.url }) twice. The server is made up
   and local (app3/tests/fake_vault.js); nothing leaves the machine. s.vault holds what it stored. */
'use strict';
const path = require('path'), fs = require('fs'), os = require('os');
const { chromium } = require(process.env.QC_PLAYWRIGHT || '/opt/node-tools/node_modules/playwright');
const PAGE = process.env.APP3 || path.join(__dirname, '../app3/index.html');
async function open(o = {}) {
  const page = o.page || PAGE;
  const q = [];
  if (o.today) q.push('today=' + o.today);
  if (o.sample) q.push('try=mako');
  const base = o.url || 'file://' + page;
  const url = base + (q.length ? (base.includes('?') ? '&' : '?') + q.join('&') : '');
  const view = o.desktop ? { viewport: { width: o.w || 1300, height: o.h || 900 } }
    : { viewport: { width: o.w || 390, height: o.h || 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: o.dpr || 1 };
  view.colorScheme = o.scheme || 'dark';
  const dir = o.profile || fs.mkdtempSync(path.join(os.tmpdir(), 'qc3-'));
  const ctx = await chromium.launchPersistentContext(dir, Object.assign({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--disable-gpu'] }, view));
  const p = ctx.pages()[0] || await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('PAGE ERROR ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/ERR_FILE_NOT_FOUND/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto(url); await p.waitForTimeout(400);
  return { p, ctx, errs, url, profile: dir, close: async () => { await ctx.close(); if (!o.profile) fs.rmSync(dir, { recursive: true, force: true }); } };
}
/* every word a person can see on the page right now, and every thing they can tap */
const text = p => p.evaluate(() => document.body.innerText);
const taps = p => p.evaluate(() => [...document.querySelectorAll('button, a, input, select, textarea, [role=button], summary')]
  .filter(e => e.offsetParent !== null)
  .map(e => ({ tag: e.tagName.toLowerCase(), id: e.id || '', label: (e.innerText || e.getAttribute('aria-label') || e.placeholder || e.name || '').trim().slice(0, 80), w: Math.round(e.getBoundingClientRect().width), h: Math.round(e.getBoundingClientRect().height) })));
async function serve(page) {
  const { makeVault, serve: sv } = require('../app3/tests/fake_vault.js');
  const vault = makeVault();
  const s = await sv(vault, () => fs.readFileSync(page || PAGE));
  return { url: `http://127.0.0.1:${s.port}/`, vault, server: s };
}
module.exports = { open, text, taps, serve, PAGE };
if (require.main === module) (async () => {
  const d = await open({ today: '2026-12-10' });
  console.log((await text(d.p)).slice(0, 300)); console.log((await taps(d.p)).length + ' things to tap', d.errs);
  await d.close();
  const s = await serve(); const e = await open({ url: s.url }); console.log('served ok:', (await text(e.p)).length > 50, e.errs); await e.close(); process.exit(0);
})();
