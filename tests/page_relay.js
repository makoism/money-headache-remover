/* The page served from its own address, talking to the relay (stubbed Claude behind it): Ask Claude streams, files are read, the invite form works. */
const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
const BASE = process.env.BASE || 'http://127.0.0.1:8788';
const coach = async p => { for (let i = 0; i < 12; i++) { const vis = await p.evaluate(() => { const c = document.querySelector('#co'); return !!c && !c.hidden && getComputedStyle(c).display !== 'none' && c.getBoundingClientRect().width > 0; }); if (!vis) return; await p.click('#coNext').catch(() => {}); await w(450); } };
let pass = 0, fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); c ? pass++ : fail++; };
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); const errs = []; await p.setViewport({ width: 390, height: 844 });
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 160)); });
  const apiCalls = []; p.on('request', r => { if (r.url().includes('/api/')) apiCalls.push(r.method() + ' ' + new URL(r.url()).pathname); });
  await p.evaluateOnNewDocument(() => { try { localStorage.clear(); indexedDB.deleteDatabase('money-map-safe'); } catch (e) {} });
  await p.goto(BASE + '/#2026-11', { waitUntil: 'load' }); await w(800);
  ok(await p.evaluate(() => document.title), 'page loads from the site: ' + await p.evaluate(() => document.title));
  await runTour(p, P.a); await w(1200); await coach(p);
  // Ask Claude via Help
  await p.click('#helpBtn'); await w(200); await p.click('#helpAsk'); await w(1500);
  const view = await p.evaluate(() => ({ chat: !document.querySelector('#askForm').hidden, off: !document.querySelector('#askOff').hidden, cap: document.querySelector('#askCap').textContent }));
  ok(view.chat && !view.off, 'Ask Claude opens in chat mode through the relay (no sign-in)');
  ok(/through this page/.test(view.cap), 'caption says answers come through the page: ' + view.cap.slice(0, 60));
  await p.type('#askIn', 'Where do I enter my pay?'); await p.keyboard.press('Enter'); await w(2500);
  const log = await p.evaluate(() => Array.from(document.querySelectorAll('#askLog .msg.ai')).map(e => e.textContent));
  ok(log.length && /ECHO Where do I enter my pay/.test(log[log.length - 1]), 'answer streamed back from the relay: ' + (log[log.length - 1] || '').slice(0, 70));
  ok(apiCalls.some(c => c === 'POST /api/ai'), 'the call went to /api/ai');
  // file extraction through the relay: attach a CSV, send, review card
  const csvPath = '/tmp/v28/bank.csv'; require('fs').writeFileSync(csvPath, 'date,desc,amount\n2026-11-05,Cafe,120\n2026-11-06,Bus,45.5\n');
  const input = await p.$('#askFile'); await input.uploadFile(csvPath); await w(400);
  ok(await p.evaluate(() => !document.querySelector('#askFiles').hidden && /bank.csv/.test(document.querySelector('#askFiles').textContent)), 'CSV attached in the chat');
  await p.click('#askSend'); await w(3000);
  const card = await p.evaluate(() => { const c = document.querySelector('#askLog .msg.ai.card, #askLog .card'); return c ? c.textContent : (document.querySelector('#askLog .msg.ai:last-child') || {}).textContent; });
  ok(/120/.test(card || '') && /45\.5|45\.50/.test(card || ''), 'review card lists the two receipts from the file: ' + (card || '').replace(/\s+/g, ' ').slice(0, 90));
  // a PDF statement on the Scan receipts card goes up as a document block and comes back as receipts
  const pdfPath = '/tmp/v28/card.pdf'; require('fs').writeFileSync(pdfPath, Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF'));
  await p.evaluate(() => { document.querySelector('#askClose, .ask-close') && document.querySelector('#askClose, .ask-close').click(); const t = [...document.querySelectorAll('.tabs button, [role=tab]')].find(b => b.textContent.trim() === 'Receipts'); t && t.click(); }); await w(600);
  await p.evaluate(() => { const c = document.querySelector('#co'); if (c && !c.hidden) { const s = document.querySelector('#coSkip, #coNext'); s && s.click(); } }); await w(300);
  const accept = await p.$eval('#scanPickIn', e => e.accept); ok(/pdf/.test(accept), 'the scan picker accepts PDFs: ' + accept);
  const pick = await p.$('#scanPickIn'); await pick.uploadFile(pdfPath); await w(900);
  ok(await p.evaluate(() => /PDF/.test((document.querySelector('#scanFiles') || {}).textContent || '') && !document.querySelector('#scanGo').hidden), 'the PDF is listed on the scan card with a PDF chip');
  await p.click('#scanRead'); await w(3500);
  const scanOut = await p.evaluate(() => (document.querySelector('#scanOut, #scanResult, .scan-out') || document.querySelector('#scan')).textContent);
  ok(/120/.test(scanOut) && /45\.5|45\.50/.test(scanOut), 'the scan card reviews the receipts read from the PDF: ' + scanOut.replace(/\s+/g, ' ').slice(0, 90));
  ok(errs.length === 0, 'no page errors so far ' + JSON.stringify(errs.slice(0, 3)));
  await b.close();

  // invite gate: the dev server for this part runs with INVITE_CODES (port 8789)
  if (process.env.INVITE_BASE) {
    const IB = process.env.INVITE_BASE;
    const b2 = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
    const q = await b2.newPage(); const errs2 = []; await q.setViewport({ width: 390, height: 844 });
    q.on('pageerror', e => errs2.push('PAGEERR ' + e.message));
    await q.evaluateOnNewDocument(() => { try { localStorage.clear(); indexedDB.deleteDatabase('money-map-safe'); } catch (e) {} });
    await q.goto(IB + '/#2026-11', { waitUntil: 'load' }); await w(800);
    await runTour(q, P.b); await w(1000); await coach(q);
    await q.click('#helpBtn'); await w(200); await q.click('#helpAsk'); await w(1500);
    await q.type('#askIn', 'hello'); await q.keyboard.press('Enter'); await w(1500);
    const form = await q.evaluate(() => { const i = document.querySelector('#askLog .inv-row input'); return { has: !!i, txt: (document.querySelector('#askLog .msg.ai.note') || {}).textContent || '' }; });
    ok(form.has && /code word/.test(form.txt), 'without the code word the chat shows the code form: ' + form.txt.slice(0, 60));
    await q.type('#askLog .inv-row input', 'wrongword'); await q.click('#askLog .inv-row button'); await w(1500);
    const again = await q.evaluate(() => (document.querySelector('#askLog .msg.ai.note') || {}).textContent || '');
    ok(/not accepted/.test(again), 'a wrong code word is refused with a clear line');
    await q.type('#askLog .inv-row input', 'fam'); await q.click('#askLog .inv-row button'); await w(2500);
    const ans = await q.evaluate(() => Array.from(document.querySelectorAll('#askLog .msg.ai')).map(e => e.textContent).pop() || '');
    ok(/ECHO/.test(ans), 'the right code word runs the question: ' + ans.slice(0, 50));
    ok(await q.evaluate(() => localStorage.getItem('mhr-invite') === 'fam'), 'the code word is remembered in this browser');
    ok(errs2.length === 0, 'no page errors (invite) ' + JSON.stringify(errs2.slice(0, 3)));
    await b2.close();
  }
  console.log(`PAGE RELAY: ${pass} pass, ${fail} fail`); process.exit(fail ? 1 : 0);
})().catch(e => { console.log('CRASH', e.stack); process.exit(2); });
