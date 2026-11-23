/* Shared pieces for app3's browser tests: a phone-sized page on the built app3/index.html, the engine in node for the
   expected figures, and the old app's keys seeded with made-up text so a test can prove they never change. */
'use strict';
const path = require('path'), fs = require('fs');
const puppeteer = require(process.env.TOOLS_PUPPETEER || '/home/claude/work/tools/node_modules/puppeteer-core');
const PAGE = process.env.APP3 || path.join(__dirname, '../index.html');
const URL0 = 'file://' + PAGE;
const E = path.join(__dirname, '../../engine/');
const L = require(E + 'lookahead.js');
const book = () => JSON.parse(fs.readFileSync(path.join(__dirname, '../fixtures/mako_madeup_book.json'), 'utf8'));
const w = ms => new Promise(r => setTimeout(r, ms));
let bad = 0, n = 0;
const ck = (name, ok, extra) => { n++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : ' ' + (extra === undefined ? '' : String(extra).slice(0, 400)))); if (!ok) bad++; };
const done = label => { console.log(bad ? `${label}: ${bad} FAIL of ${n}` : `${label}: ALL PASS (${n})`); process.exit(bad ? 1 : 0); };
async function open(opt = {}) {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'], userDataDir: opt.profile });
  const p = await b.newPage(); const errs = [], requests = [];
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/ERR_FILE_NOT_FOUND/.test(m.text())) errs.push('console: ' + m.text()); });
  p.on('request', r => { if (/^https?:/.test(r.url())) requests.push(r.url()); });
  await p.setViewport({ width: opt.w || 390, height: opt.h || 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: opt.scheme || 'dark' }]);
  return { b, p, errs, requests };
}
/* the old app's two copies, made-up text, written the way the old app writes them */
const OLD_KEY = 'money-map-template-v2';
const OLD_TEXT = JSON.stringify({ rev: 1763600000000, cfg: { bankStart: 123456 }, steps: { a: [{ from: '2026-11', v: 240000 }] }, once: {}, items: {}, receipts: [{ id: 'r1', a: 1200 }], ui: { cur: '¥', note: 'made-up' } });
async function seedOld(p) {
  return p.evaluate((k, t) => new Promise(res => {
    localStorage.setItem(k, t);
    const rq = indexedDB.open('money-map-safe', 1);
    rq.onupgradeneeded = () => rq.result.createObjectStore('kv');
    rq.onsuccess = () => { const db = rq.result, tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put({ rev: 1763600000000, t: 1763600000000, json: t }, 'state'); tx.oncomplete = () => { db.close(); res(true); }; };
    rq.onerror = () => res(false);
  }), OLD_KEY, OLD_TEXT);
}
async function readOld(p) {
  return p.evaluate(k => new Promise(res => {
    const ls = localStorage.getItem(k);
    const rq = indexedDB.open('money-map-safe');
    rq.onsuccess = () => { const db = rq.result; if (!db.objectStoreNames.contains('kv')) { db.close(); res({ ls, idb: null }); return; } const g = db.transaction('kv').objectStore('kv').get('state'); g.onsuccess = () => { db.close(); res({ ls, idb: JSON.stringify(g.result) }); }; };
    rq.onerror = () => res({ ls, idb: 'error' });
  }), OLD_KEY);
}
const OLD_IDB = JSON.stringify({ rev: 1763600000000, t: 1763600000000, json: OLD_TEXT });
/* what the page shows, by data-fig */
const figs = p => p.evaluate(() => [...document.querySelectorAll('[data-fig]')].map(e => ({ fig: e.dataset.fig, amt: e.dataset.amt === undefined ? null : Number(e.dataset.amt), text: e.textContent.trim(), card: (e.closest('[data-card]') || {}).dataset ? e.closest('[data-card]').dataset.card : null })));
const shot = async (p, name) => { const dir = path.join(__dirname, '../shots'); fs.mkdirSync(dir, { recursive: true }); await p.screenshot({ path: path.join(dir, name + '.png'), fullPage: true }); };
module.exports = { open, URL0, L, book, w, ck, done, seedOld, readOld, OLD_KEY, OLD_TEXT, OLD_IDB, figs, shot };
