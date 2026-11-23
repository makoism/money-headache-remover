#!/usr/bin/env node
/* app3 opens with no network at all: one file, everything inside it. Offline, served over http once and from the file,
   Home draws, Check your bank opens, and the page asks for nothing outside itself. */
'use strict';
const T = require('./lib3.js'), { ck } = T;
const http = require('http'), fs = require('fs'), path = require('path');
(async () => {
  const html = fs.readFileSync(process.env.APP3 || path.join(__dirname, '../index.html'));
  const srv = http.createServer((q, r) => { if (q.url.split('?')[0] === '/' || q.url.startsWith('/index.html')) { r.writeHead(200, { 'content-type': 'text/html' }); r.end(html); } else { r.writeHead(404); r.end(); } });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const port = srv.address().port, asked = [];
  const { b, p, errs } = await T.open();
  p.on('request', r => { const u = r.url().split('?')[0]; if (!/\/(index\.html)?$/.test(u) && !u.startsWith('data:')) asked.push(r.url()); });
  await p.goto(`http://127.0.0.1:${port}/?try=mako&today=2026-11-23`); await T.w(300);
  await p.setOfflineMode(true);
  await p.reload({ waitUntil: 'load' }).catch(() => {});
  const fromFile = async () => { await p.goto(T.URL0 + '?try=mako&today=2026-11-23'); await T.w(300); };
  await fromFile();
  ck('offline, Home draws from the file', /Safe to spend/.test(await p.$eval('#a3Home', e => e.textContent)));
  await p.click('#a3CheckGo'); await T.w(200);
  ck('offline, Check your bank opens', !(await p.$eval('#a3Check', e => e.hidden)));
  ck('the page asked for nothing but itself', asked.length === 0, asked.join(' '));
  ck('no page errors', errs.length === 0, errs.join(' | '));
  await b.close(); srv.close(); T.done('offline');
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });
