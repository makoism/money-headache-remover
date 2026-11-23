#!/usr/bin/env node
/* app3 opens with no network at all: one file, everything inside it. Offline, from the file,
   Home draws, Check your bank opens, and the page asks for nothing outside itself. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
(async () => {
  const asked = [];
  const { b, p, errs } = await T.open();
  p.on('request', r => { const u = r.url().split('?')[0]; if (!/\/(index\.html)?$/.test(u) && !u.startsWith('data:')) asked.push(r.url()); });
  await p.setOfflineMode(true);
  const fromFile = async () => { await p.goto(T.URL0 + '?try=mako&today=2026-11-23'); await T.w(300); };
  await fromFile();
  ck('offline, Home draws from the file', /Safe to spend/.test(await p.$eval('#a3Home', e => e.textContent)));
  await p.click('#a3CheckGo'); await T.w(200);
  ck('offline, Check your bank opens', !(await p.$eval('#a3Check', e => e.hidden)));
  ck('the page asked for nothing but itself', asked.length === 0, asked.join(' '));
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close(); T.done('offline');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
