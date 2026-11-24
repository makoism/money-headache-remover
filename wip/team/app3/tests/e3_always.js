#!/usr/bin/env node
/* Three things that must hold on every screen and sheet (QC_ROLES.md "Scripts beat reviewers" c), walked on the built
   page over every place of tests/qc_places.js, on a phone (390 wide, Mako's: M33):
   1. The assistant is one tap away (M1 "always on screen", M17 "Ask the assistant anything, any time"): the way to it
      (#a3AskGo, "Ask") shows at the top of the place, nothing covers it, and one tap opens the assistant with its box
      ready to type in. And it stays on screen when a long place is scrolled to its end.
   2. No page errors on any place (QC_COMMON: "Reports of page errors are always findings").
   3. With the cloud copy off and the assistant not used, the page makes no network calls at all (M61, M63, M69: the
      numbers stay on the device unless the person turns the cloud copy on or asks the assistant). Every request that
      is not the page's own file is listed, with the place it came from. Then the page served from a local made-up
      server (tests/fake_vault.js), cloud copy off: it may fetch only its own files (the page, the manifest, its
      icons, the worker), never the vault, the AI, or another site.
   The assistant's own sheets (Ask, and Add statements with its "Read with the AI") may ask the page's server whether
   the AI is on: those calls are counted apart and must go only to the page's own server, to /api/health, sending nothing.
   A real fault found here is not fixed here: it is in KNOWN with its reason, and in tests/QCSCRIPTS_FOUND.md. */
'use strict';
const fs = require('fs');
const Q = require('./qc_places.js'), { w } = Q;

/* real faults in the app this check found (the check stays failing; see tests/QCSCRIPTS_FOUND.md) */
const NEW = 'on a new device a tap on Ask only says "Set up first": the assistant cannot be asked anything before or during setup (M1, M2, M17; the setup chat is on lane/ai-panel, not on this base)';
const KNOWN = {
  'First screen: one tap on Ask opens the assistant, its box ready': NEW,
  'Setup: one tap on Ask opens the assistant, its box ready': NEW,
  'Setup: pay on two days, a second income every 2 weeks, a card with its close day, a bill once a year: one tap on Ask opens the assistant, its box ready': NEW,
  'Setup: pay every 2 weeks, a second income on two days: one tap on Ask opens the assistant, its box ready': NEW,
  'Setup: pay lands today: one tap on Ask opens the assistant, its box ready': NEW,
  'Settings from "I already use the burrow on another device": one tap on Ask opens the assistant, its box ready': NEW,
  'Settings (new device): one tap on Ask opens the assistant, its box ready': NEW,
  'the way to the assistant stays on screen when a long place is scrolled to its end (M1 "always on screen")': 'Ask is a small link in the header, and the header scrolls away with the page: on a long screen it takes a scroll back to the top to reach it (the panel on every screen is on lane/ai-panel)',
};
const T = Q.make('e3_always', KNOWN), { ck } = T;
const OWN = /^(file|data|blob|about|chrome-extension):/;
const ASSISTANT = /^(Ask|Add statements)/;   // the places that are the assistant itself

(async () => {
  const ctx = {}, calls = [], away = [];
  let places = 0;
  for (const place of Q.PLACES) {
    if (!ctx[place.state]) {
      const o = ctx[place.state] = await T.open({ touch: true });
      o.c.on('request', r => { if (!OWN.test(r.url())) calls.push({ place: o.at || 'opening the page', url: r.url(), method: r.method(), body: r.postData() || '' }); });
      if (place.state === 'book') { o.at = 'building the made-up book'; const e = await Q.buildBook(o.p); if (!ck('the made-up book is built through the page', e === '', e)) break; }
    }
    const o = ctx[place.state], p = o.p, e0 = T.errs.length;
    o.at = place.name; places++;
    try { await Q.reach(p, place); } catch (e) { ck(`${place.name}: can be reached`, false, e.message.split('\n')[0]); continue; }
    const ask = await p.evaluate(() => {
      const b = document.querySelector('#a3AskGo'), box = document.querySelector('#a3AskIn');
      const shows = e => !!e && e.getClientRects().length > 0 && e.checkVisibility({ visibilityProperty: true });
      const inView = e => { const r = e.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; };
      const free = e => { const r = e.getBoundingClientRect(), t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!t && (t === e || e.contains(t)); };
      scrollTo(0, 0);
      const out = { open: shows(box), there: shows(b), top: shows(b) && inView(b) && free(b), long: document.documentElement.scrollHeight > innerHeight + 8 };
      scrollTo(0, document.documentElement.scrollHeight);
      out.end = out.open ? inView(box) || (shows(b) && inView(b)) : shows(b) && inView(b) && free(b);
      scrollTo(0, 0);
      return out;
    });
    if (ask.open) ck(`${place.name}: the assistant is open here, its box ready`, true);
    else {
      ck(`${place.name}: Ask shows at the top, with nothing over it`, ask.top, JSON.stringify(ask));
      let opened = false, said = '';
      try {
        await p.click('#a3AskGo'); await w(350);
        opened = await p.evaluate(() => { const s = document.querySelector('#a3Ask'), b = document.querySelector('#a3AskIn'); return !!s && !s.hidden && !!b && b.getClientRects().length > 0 && !b.disabled; });
        said = await p.$eval('#a3Msg', e => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => '');
      } catch (e) { said = e.message.split('\n')[0]; }
      ck(`${place.name}: one tap on Ask opens the assistant, its box ready`, opened, said ? `the page says "${said}"` : 'nothing opened');
    }
    if (ask.long && !ask.end) away.push(place.name);
    ck(`${place.name}: no page errors`, T.errs.length === e0, T.errs.slice(e0).join(' | '));
    o.at = 'after ' + place.name;
  }
  ck('the way to the assistant stays on screen when a long place is scrolled to its end (M1 "always on screen")', away.length === 0, `it scrolls away on ${away.length} of ${places} places: ` + away.join('; '));
  await w(1500);   // a late call (a timer) is still a call
  for (const s of Object.keys(ctx)) await ctx[s].c.close();
  /* 3. the calls. A tap on Ask is the assistant in use, so the calls are split by where the page was when each was made:
     the assistant's own places, and everything else. Opening Ask from a place counts as the assistant. */
  const isAi = c => /\/api\/health(\?|$)/.test(c.url) && c.method === 'GET' && !c.body;
  const other = calls.filter(c => !isAi(c));
  ck(`cloud copy off, the assistant not asked anything: no network call but the assistant's own "is the AI on" (${places} places walked, Ask opened from each)`, other.length === 0, other.map(c => `${c.place}: ${c.method} ${c.url}`).join(' | '));
  const hosts = [...new Set(calls.filter(isAi).map(c => new URL(c.url).origin))], relay = fs.readFileSync(require('path').join(__dirname, '../../RELAY'), 'utf8').trim().replace(/\/$/, '');
  ck(`"is the AI on" goes only to the page's own server (wip/team/RELAY), with nothing sent: ${calls.filter(isAi).length} calls`, hosts.every(h => relay.startsWith(h)), hosts.join(' '));   // none are made on this base: the rule is here for the day one is

  /* the same with the assistant never opened: no call at all, on every place but the assistant's own */
  {
    const quiet = [], c2 = {};
    for (const place of Q.PLACES.filter(pl => !ASSISTANT.test(pl.name))) {
      if (!c2[place.state]) {
        const o = c2[place.state] = await T.open({ touch: true });
        o.c.on('request', r => { if (!OWN.test(r.url())) quiet.push(`${o.at || 'opening the page'}: ${r.method()} ${r.url()}`); });
        if (place.state === 'book') { o.at = 'building the made-up book'; await Q.buildBook(o.p); }
      }
      c2[place.state].at = place.name;
      await Q.reach(c2[place.state].p, place).catch(() => {});
      await w(120);
    }
    await w(1500);
    for (const s of Object.keys(c2)) await c2[s].c.close();
    ck(`cloud copy off and the assistant never opened: no network call at all (${Q.PLACES.filter(pl => !ASSISTANT.test(pl.name)).length} places)`, quiet.length === 0, quiet.join(' | '));
  }
  /* served from a local made-up server: only the page's own files */
  {
    const { makeVault, serve } = require('./fake_vault.js');
    const vault = makeVault(), s = await serve(vault, () => fs.readFileSync(Q.FILE));
    const o = await T.open({ touch: true }), got = [];
    o.c.on('request', r => { if (!OWN.test(r.url())) got.push({ url: r.url(), method: r.method() }); });
    const base = `http://127.0.0.1:${s.port}/`;
    await o.p.goto(base + '?today=' + Q.DAY0); await w(600);
    for (const go3 of ['#a3SetGo', '#a3SetClose', '[data-tab=receipts]', '[data-tab=plan]', '[data-tab=home]', '#a3TryGo', '#a3CheckGo', '#a3CheckX', '#a3RemGo', '#a3RemClose', '[data-tab=receipts]', '[data-tab=plan]']) { await o.p.click(go3).catch(() => {}); await w(200); }
    await w(1200);
    await o.c.close(); await s.close();
    const ownFile = g => g.method === 'GET' && g.url.startsWith(base) && /^\/(index\.html|sw3\.js|manifest3\.webmanifest|icon3-(192|512)\.png)?$/.test(new URL(g.url).pathname);
    const bad = got.filter(g => !ownFile(g));
    ck(`served from a local server, cloud copy off, the assistant never opened: only the page's own files are fetched (${got.length} requests), never the vault or the AI`, got.length > 0 && bad.length === 0, bad.map(g => g.method + ' ' + g.url).join(' | ') || 'the page was not fetched');
    ck('nothing reached the made-up vault', vault.log.length === 0, JSON.stringify(vault.log).slice(0, 300));
  }
  console.log(`\nPLACES: ${places} walked (Ask one tap away, page errors, network calls); the assistant's own "is the AI on" calls: ${calls.filter(isAi).length}; other calls: ${other.length}`);
  await T.finish();
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
