/* The encrypted cloud copy, end to end: turn on, code shown, pushes after a change, restore on a second browser, conflict, turn off. */
const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
const { webcrypto } = require('crypto'); const subtle = webcrypto.subtle;
const BASE = process.env.BASE || 'http://127.0.0.1:8788';
let pass = 0, fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); c ? pass++ : fail++; };
const coach = async p => { for (let i = 0; i < 12; i++) { const vis = await p.evaluate(() => { const c = document.querySelector('#co'); return !!c && !c.hidden && getComputedStyle(c).display !== 'none' && c.getBoundingClientRect().width > 0; }); if (!vis) return; await p.click('#coNext').catch(() => {}); await w(450); } };
const fresh = async b => { const p = await b.newPage(); const errs = []; await p.setViewport({ width: 390, height: 844 }); p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 140)); }); return { p, errs }; };
const hex = u8 => Array.from(new Uint8Array(u8), x => x.toString(16).padStart(2, '0')).join('');
async function keysFor(code) {
  const enc = new TextEncoder();
  const base = await subtle.importKey('raw', enc.encode(code), 'PBKDF2', false, ['deriveBits']);
  const root = await subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode('mhr2000-vault-v1'), iterations: 150000, hash: 'SHA-256' }, base, 256);
  const hk = await subtle.importKey('raw', root, 'HKDF', false, ['deriveBits', 'deriveKey']);
  const part = info => subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: enc.encode(info) }, hk, 256);
  const key = await subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: enc.encode('enc') }, hk, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  return { id: hex(await part('id')), token: hex(await part('token')), key };
}
const getVault = async k => { const r = await fetch(BASE + '/api/vault/' + k.id, { headers: { 'x-vault-token': k.token } }); return { status: r.status, j: r.ok ? await r.json() : null }; };
const decrypt = async (k, j) => JSON.parse(new TextDecoder().decode(await subtle.decrypt({ name: 'AES-GCM', iv: Uint8Array.from(Buffer.from(j.iv, 'base64')) }, k.key, Uint8Array.from(Buffer.from(j.blob, 'base64')))));
(async () => {
  const bA = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const { p: a, errs: errsA } = await fresh(bA);
  await a.goto(BASE + '/?a=1#2026-11', { waitUntil: 'load' }); await w(900);
  const link = await a.evaluate(() => { const e = document.querySelector('#tourRestore'); return e && !e.hidden; });
  ok(link, 'welcome shows the recovery-code link when the cloud is available');
  await runTour(a, P.a); await w(1200); await coach(a);
  await a.evaluate(() => document.querySelector('[data-tab="basics"]').click()); await w(600); await coach(a);
  ok(await a.evaluate(() => !document.querySelector('#vaultBox').hidden && /Off/.test(document.querySelector('#vaultState').textContent)), 'Settings shows Cloud backup, off');
  await a.click('#vaultOn'); await w(800);
  const codeTxt = await a.evaluate(() => (document.querySelector('#vaultCodeTxt') || {}).textContent || '');
  ok(/^MHR-[A-Z0-9]{4}(-[A-Z0-9]{4}){4}$/.test(codeTxt), 'turning on shows a code: ' + codeTxt);
  const code = codeTxt.replace(/^MHR-/, '').replace(/-/g, '');
  await w(4000);
  const k = await keysFor(code); let v = await getVault(k);
  ok(v.status === 200, 'a cloud record exists after turning on');
  let d = v.j ? await decrypt(k, v.j) : null;
  ok(d && d.ui && d.ui.name === 'Aiko', 'the record decrypts with the code and holds the name: ' + (d && d.ui && d.ui.name));
  ok(/^On\./.test(await a.$eval('#vaultState', e => e.textContent)), 'state line says On with a time: ' + await a.$eval('#vaultState', e => e.textContent));
  // a change pushes a newer rev
  await a.evaluate(() => document.querySelector('[data-tab="home"]').click()); await w(500); await coach(a);
  const nudge = await a.evaluate(() => document.querySelector('#hBk').textContent);
  ok(/Save your recovery code/.test(nudge), 'Home asks to save the code until confirmed');
  await a.click('#hBk #vaultSaved'); await w(300);
  ok(await a.evaluate(() => document.querySelector('#hBk').hidden), 'I saved it hides the card');
  await a.type('#hAmt', '777'); await a.evaluate(() => document.querySelector('#hForm').requestSubmit()); await w(5000);
  v = await getVault(k); d = await decrypt(k, v.j);
  ok(d.receipts && d.receipts.some(r => r.a === 777), 'the receipt reached the cloud copy within a few seconds');
  const revA = v.j.rev;
  ok(errsA.length === 0, 'no page errors in browser A ' + JSON.stringify(errsA.slice(0, 3)));

  // second browser: restore from the welcome screen
  const bB = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const { p: b2, errs: errsB } = await fresh(bB);
  await b2.goto(BASE + '/?b=1#2026-11', { waitUntil: 'load' }); await w(1200);
  await b2.click('#tourRestoreBtn'); await w(200);
  await b2.type('#tourVaultIn', 'mhr-' + codeTxt.slice(4).toLowerCase()); await b2.click('#tourVaultUse'); await w(4000);
  const stB = await b2.evaluate(() => ({ tour: document.querySelector('#tour').hidden, name: document.body.innerText.includes('Aiko'), has777: JSON.stringify(localStorage.getItem('money-map-template-v2')).includes('777'), code: !!localStorage.getItem('mhr-vault') }));
  ok(stB.tour && stB.name && stB.has777, 'browser B loads the copy from a lower-case code with spaces: setup closed, name and receipt present ' + JSON.stringify(stB));
  ok(stB.code, 'browser B now keeps the code and stays in sync');
  // conflict: B changes something (newer), A opens later and is told
  await coach(b2);
  await b2.evaluate(() => document.querySelector('[data-tab="home"]').click()); await w(400); await coach(b2);
  await b2.type('#hAmt', '888'); await b2.evaluate(() => document.querySelector('#hForm').requestSubmit()); await w(5000);
  v = await getVault(k); ok(v.j.rev > revA, 'B pushed a newer copy');
  await a.reload({ waitUntil: 'load' }); await w(3000);
  const noteA = await a.evaluate(() => document.querySelector('#hBk').textContent);
  ok(/Newer copy in the cloud/.test(noteA), 'A, which has its own data, is told about the newer copy: ' + noteA.replace(/\s+/g, ' ').slice(0, 70));
  await a.click('#hBk [data-vault-load]'); await w(2500);
  ok(await a.evaluate(() => JSON.stringify(localStorage.getItem('money-map-template-v2')).includes('888')), 'Load it brings the 888 receipt into A');
  ok(await a.evaluate(() => document.querySelector('#hBk').hidden), 'the notice is gone after loading');
  // turn off deletes the cloud copy
  await a.evaluate(() => document.querySelector('[data-tab="basics"]').click()); await w(500); await coach(a);
  await a.click('#vaultOff'); await w(200); await a.click('#vaultOff'); await w(2000);
  v = await getVault(k); ok(v.status === 404, 'Turn off (two taps) deletes the cloud copy');
  ok(await a.evaluate(() => !localStorage.getItem('mhr-vault')), 'the code is forgotten on this device');
  ok(errsA.length === 0 && errsB.length === 0, 'no page errors ' + JSON.stringify(errsA.concat(errsB).slice(0, 3)));
  // the Setup done screen offers the cloud copy in one tap
  const bC = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const { p: c, errs: errsC } = await fresh(bC);
  await c.goto(BASE + '/?c=1#2026-11', { waitUntil: 'load' }); await w(900);
  let shownCode = '';
  await runTour(c, P.a, async () => {
    const t = await c.$eval('#tourTitle', e => e.textContent); if (!/^Setup done/.test(t) || shownCode) return;
    ok(await c.evaluate(() => !!document.querySelector('#tourCloud #tourVaultOn')), 'Setup done offers Turn on cloud backup');
    await c.click('#tourVaultOn'); await w(1500);
    shownCode = await c.evaluate(() => (document.querySelector('#tourVaultCode .vault-code') || {}).textContent || '');
    ok(/^MHR-[A-Z0-9]{4}(-[A-Z0-9]{4}){4}$/.test(shownCode), 'one tap turns it on and shows the recovery code: ' + shownCode);
    const fully = await c.evaluate(() => { const s = document.querySelector('#vaultSaved').getBoundingClientRect(), f = document.querySelector('.tour-foot').getBoundingClientRect(); return s.bottom <= f.top + 1; });
    ok(fully, 'the screen scrolls so the code and its buttons sit above the footer');
    await c.click('#tourVaultCode #vaultSaved'); await w(300);
  });
  await w(2500); await coach(c);
  await c.evaluate(() => document.querySelector('[data-tab="basics"]').click()); await w(600); await coach(c);
  ok(await c.evaluate(() => /^On/.test(document.querySelector('#vaultState').textContent)), 'Settings then shows Cloud backup on: ' + await c.$eval('#vaultState', e => e.textContent));
  const kc = await keysFor(shownCode.replace(/^MHR-/, '').replace(/-/g, ''));
  const vc = await getVault(kc); ok(vc.status === 200 && (await decrypt(kc, vc.j)).ui.name === 'Aiko', 'the cloud copy made from the setup screen opens with that code');
  ok(errsC.length === 0, 'no page errors (setup screen) ' + JSON.stringify(errsC.slice(0, 3)));
  await bA.close(); await bB.close(); await bC.close();
  console.log(`PAGE VAULT: ${pass} pass, ${fail} fail`); process.exit(fail ? 1 : 0);
})().catch(e => { console.log('CRASH', e.stack); process.exit(2); });
