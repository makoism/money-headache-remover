// The ruleset holds on every screen (v35.0): one card padding and corner, one card-title size, one control height and corner,
// a plant on every setup screen and every page, nothing drawn over words, the video garden with Mako's note.
const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
let pass = 0, fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); c ? pass++ : fail++; };
const BASE = process.env.BASE || 'http://127.0.0.1:8788';
const coach = async p => { for (let i = 0; i < 12; i++) { const vis = await p.evaluate(() => { const c = document.querySelector('#co'); return !!c && !c.hidden && c.getBoundingClientRect().width > 0; }); if (!vis) break; await p.click('#coN').catch(() => {}); await w(150); } };
const tab = (p, t) => p.evaluate(t => (document.querySelector(`[data-tab="${t}"]`) || document.querySelector(`[data-tab-go="${t}"]`)).click(), t);
const uniq = a => [...new Set(a)];
async function overlaps(p) {
  return p.evaluate(() => {
    const near = (a, b) => a.width && b.width && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const out = [];
    for (const c of document.querySelectorAll('.pixc, .wrap .art')) {
      if (c.closest('.hero, .vgarden') || c.classList.contains('off')) continue;
      const host = c.parentElement; if (!host.offsetParent) continue;
      const r = c.getBoundingClientRect(); if (!r.width) continue;
      const rg = document.createRange(), walk = document.createTreeWalker(host, NodeFilter.SHOW_TEXT); let n;
      while ((n = walk.nextNode())) { if (!n.textContent.trim() || c.contains(n)) continue; rg.selectNodeContents(n); for (const q of rg.getClientRects()) if (near(q, r)) out.push((host.id || host.className) + ' text: ' + n.textContent.trim().slice(0, 24)); }
      for (const el of host.querySelectorAll('button, input, select, a')) { if (c.contains(el)) continue; const q = el.getBoundingClientRect(); if (near(q, r)) out.push((host.id || host.className) + ' control: ' + (el.textContent || el.id).trim().slice(0, 24)); }
    }
    return out;
  });
}
async function run(width, scheme) {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage(); await p.setViewport({ width, height: 844 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const L = `${width}px ${scheme}`;
  await p.goto(BASE + '/?sfxtest#2026-12', { waitUntil: 'load' }); await w(1200);
  if (scheme === 'light') { await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'light')); await w(200); }
  // the video garden
  const g = await p.evaluate(() => { const g = document.querySelector('.vgarden'); if (!g) return null; const note = document.querySelector('.from-mako'); const cs = note && getComputedStyle(note);
    return { corners: g.querySelectorAll('.art-corner').length, pix: g.querySelectorAll('.vg-pix .pix').length, note: !!note, noteText: note && note.textContent.trim(), font: cs && cs.fontFamily, arrow: !!(note && note.querySelector('.fm-arrow')), caveat: document.fonts.check('600 30px Caveat'),
      playTop: (() => { const bt = document.querySelector('#tourPlay'); const rr = bt.getBoundingClientRect(); const el = document.elementFromPoint(rr.left + rr.width / 2, rr.top + rr.height / 2); return !!el && (el === bt || bt.contains(el)); })() }; });
  ok(g && g.corners === 4 && g.pix >= 2, L + ' the video sits in a garden: four vine corners and pixel flowers ' + JSON.stringify(g && [g.corners, g.pix]));
  ok(g && g.note && /from Mako/.test(g.noteText) && g.arrow, L + ' the handwritten note with its arrow is there: ' + (g && g.noteText));
  ok(g && /Caveat/.test(g.font) && g.caveat, L + ' the note is set in the handwriting face and the face loaded: ' + (g && g.font && g.font.slice(0, 30)));
  ok(g && g.playTop, L + ' the play button is still on top of the vines');
  // a plant on every setup screen (or stepped aside), and Caveat only on the note
  const seen = [];
  await runTour(p, P.a, async () => { const t = await p.$eval('#tourTitle', e => e.textContent); const a = await p.evaluate(() => { const a = document.querySelector('#tourArt .art'); return a ? (a.classList.contains('aside') ? 'aside' : [...a.classList].find(c => c.startsWith('art-') && c !== 'art')) : (document.querySelector('.vgarden') ? 'garden' : 'none'); }); seen.push(t + ':' + a); });
  const none = seen.filter(s => /:none$/.test(s));
  ok(!none.length, L + ' every setup screen has its plant (or it stepped aside): ' + seen.join(' | '));
  await w(1500); await coach(p);
  // cards: one padding, one corner, one title size per screen
  for (const t of ['home', 'receipts', 'goals', 'month', 'months', 'basics']) {
    await tab(p, t); await w(500);
    const m = await p.evaluate(() => { const cards = [...document.querySelectorAll('.wrap .card')].filter(c => c.offsetParent && !c.matches('details.hmore2')); const cs = c => getComputedStyle(c);
      return { n: cards.length, pad: [...new Set(cards.map(c => cs(c).paddingLeft + '/' + cs(c).paddingTop))], rad: [...new Set(cards.map(c => cs(c).borderRadius))],
        h2: [...new Set(cards.filter(c => !c.classList.contains('hwin')).flatMap(c => [...c.querySelectorAll(':scope > .head > h2, :scope > h2')].map(h => cs(h).fontSize + ' ' + cs(h).fontFamily.split(',')[0])))],
        inp: [...new Set([...document.querySelectorAll('.wrap .inp, .wrap .selbox select, .wrap input[type=date], .wrap .dpb')].filter(e => e.offsetParent && !e.classList.contains('dp-native')).map(e => cs(e).minHeight + '/' + cs(e).borderRadius))],
        btn: [...new Set([...document.querySelectorAll('.wrap .btn:not(.small)')].filter(e => e.offsetParent).map(e => cs(e).minHeight))] }; });
    ok(m.pad.length === 1 && m.rad.length === 1, `${L} ${t}: ${m.n} cards share one padding and one corner: ${m.pad.join(',')} ${m.rad.join(',')}`);
    ok(m.h2.length <= 1, `${L} ${t}: card titles share one size and face: ${m.h2.join(' | ')}`);
    ok(m.inp.length <= 1, `${L} ${t}: inputs share one height and corner: ${m.inp.join(' | ')}`);
    ok(m.btn.every(h => h === '44px' || h === '52px'), `${L} ${t}: buttons are the regular or the large height only: ${m.btn.join(' | ')}`);
    const plants = await p.evaluate(() => [...document.querySelectorAll('.wrap .art, .wrap .pixc')].filter(e => e.offsetParent && !e.classList.contains('off')).length);
    ok(plants >= 1, `${L} ${t}: something green on the page: ${plants}`);
    const ov = await overlaps(p); ok(!ov.length, `${L} ${t}: nothing drawn over words or controls ${ov.join(' | ')}`);
  }
  // the band carries the reason
  await tab(p, 'receipts'); await w(300);
  const band = await p.evaluate(() => { const b = document.querySelector('#mgBand'); return b && !b.hidden ? b.textContent.replace(/\s+/g, ' ').trim() : ''; });
  ok(/Japan trip/.test(band), L + ' the band under the tabs names the goal: ' + band.slice(0, 60));
  ok(!/covered/.test(band), L + ' no generated phrase in the band');
  ok(!errs.length, L + ' no page errors ' + JSON.stringify(errs));
  await b.close();
}
(async () => {
  for (const [wd, sc] of [[390, 'dark'], [1280, 'light']]) await run(wd, sc);
  console.log(`LOOK: ${pass} pass, ${fail} fail`); process.exit(fail ? 1 : 0);
})().catch(e => { console.log('CRASH', e.stack); process.exit(2); });
