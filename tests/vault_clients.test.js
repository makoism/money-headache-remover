/* The pages already in people's browsers must keep working against the new vault server, unchanged.
   This runs the real cloud-copy code of the 38.28 page (cut from the shipped public/index.html) and of the 38.31 page
   (wip/team/ui42.js at 38.31), both frozen in tests/vault_fixtures, as two devices against the server handlers.
   Run: node tests/vault_clients.test.js
   The last block ("the new server protects old pages") is the only part that needs the new server. */
const fs = require('fs'), path = require('path'), vm = require('vm'), { webcrypto } = require('crypto');
const { makeDb, fetchFor, call } = require('./vault_d1_shim.js');
let pass = 0, failN = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); c ? pass++ : failN++; };
const env = { DB: makeDb(), VAULT_IP_PER_MINUTE: '100000' };
const wait = ms => new Promise(r => setTimeout(r, ms));

/* one browser: the page's cloud-copy code with the few things it reaches for on the rest of the page */
function device(file, name) {
  const store = {};
  const ctx = vm.createContext({
    console, crypto: webcrypto, TextEncoder, TextDecoder, btoa, atob, Uint8Array, JSON, Date, Math, Object, Array, String, Promise, Error, setTimeout, clearTimeout,
    fetch: fetchFor(env), Response,
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
  });
  vm.runInContext(`
    let S = { rev: 0, ui: { name: '${name}' }, receipts: [] }, relayInfo = { vault: true }, tab = 'home', bkNote = null, tourIsOpen = false;
    let editRow = null, editGoal = null, editRc = null, itemsSig = '';
    const relayBase = () => 'http://test.local', relayHealth = async () => relayInfo, timeoutSignal = () => undefined;
    const $ = () => null, esc = s => String(s), cheer = () => {}, sfx = () => {}, copyText = () => {}, renderBackupNudge = () => {}, persist = () => {}, flush = () => {}, restructure = () => {}, closeTour = () => {};
    const pristine = () => !S.receipts.length, okBackup = d => !!d && typeof d === 'object' && !!d.ui, normalize = d => d, upgradeLegacy = d => d;
  `, ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'vault_fixtures', file), 'utf8'), ctx, { filename: file });
  const run = code => vm.runInContext(code, ctx);
  /* wait until no save is on its way (the page sends one at a time, a moment after each change) */
  const idle = async () => { for (let i = 0; i < 200 && run('vaultBusy'); i++) await wait(10); };
  return {
    run, store,
    spend: (amount, rev) => run(`S.receipts.push({ a: ${amount} }); S.rev = ${rev};`),
    idle,
    push: async force => { await idle(); await run(`vaultPush(${force ? 'true' : ''})`); await idle(); },
    reopen: async () => { run('vaultChecked = false; vaultNote = null; vaultLoadLocal();'); await run('vaultCheck()'); await wait(120); await idle(); },
    amounts: () => run('JSON.stringify(S.receipts.map(r => r.a))'),
    note: () => run('vaultNote && vaultNote.kind'),
    keys: () => run('keysFor(vault.code).then(k => ({ id: k.id, token: k.token }))'),
  };
}
async function decryptOnServer(dev, k, q) { const r = await call(env, 'GET', k.id, k.token, undefined, q); if (r.status !== 200) return { status: r.status };
  dev.run(`var __j = ${JSON.stringify({ blob: r.j.blob, iv: r.j.iv })};`); const txt = await dev.run('keysFor(vault.code).then(k => vaultDecrypt(k, __j.blob, __j.iv))'); return { status: 200, d: JSON.parse(txt), j: r.j }; }

async function story(file, label) {
  const T = 1767000000000;                                       /* device clocks; the server never has to agree with them */
  const A = device(file, 'Aiko'), B = device(file, 'Blank');
  A.run(`S.rev = ${T};`);
  const code = await A.run('vaultTurnOn()'); await wait(120); await A.idle();
  const k = await A.keys(); let s = await decryptOnServer(A, k);
  ok(s.status === 200 && s.d.ui.name === 'Aiko', `${label}: turning on sends an encrypted copy the code opens`);
  ok(JSON.parse(A.store['mhr-vault']).code === code, `${label}: the device keeps its code`);
  A.spend(777, T + 1000); await A.push(); s = await decryptOnServer(A, k);
  ok(s.d.receipts.some(r => r.a === 777) && s.j.rev === T + 1000, `${label}: a change reaches the cloud copy`);
  const okB = await B.run(`vaultRestore('mhr-${code.toLowerCase().match(/.{1,4}/g).join(' ')}', { textContent: '' })`);
  ok(okB === true && B.amounts() === '[777]' && B.run('S.ui.name') === 'Aiko', `${label}: a second device loads the copy from the code`);
  B.spend(888, T + 2000); await B.push();
  await A.reopen(); ok(A.note() === 'newer', `${label}: the first device, opened later, is told a newer copy is in the cloud`);
  await A.run('vaultLoadNewer()'); ok(A.amounts() === '[777,888]' && A.note() === null, `${label}: "Load it" brings the newer copy in`);
  /* both change; B saves first; A is refused and asked; "Keep mine" wins */
  B.spend(999, T + 4000); await B.push();
  A.spend(111, T + 3000); await A.push();
  ok(A.note() === 'newer', `${label}: a save over a newer copy is refused and the person is asked`);
  s = await decryptOnServer(A, k); ok(s.d.receipts.some(r => r.a === 999) && !s.d.receipts.some(r => r.a === 111), `${label}: the refused save changed nothing`);
  await A.push(true); s = await decryptOnServer(A, k);
  ok(s.d.receipts.some(r => r.a === 111) && A.note() === null, `${label}: "Keep mine" overwrites`);
  const beforeOff = await call(env, 'GET', k.id, k.token, undefined, '?versions=1');
  await A.run('vaultTurnOff(true)');
  const gone = await call(env, 'GET', k.id, k.token);
  ok(gone.status === 404 && !A.store['mhr-vault'], `${label}: Turn off deletes the cloud copy (404) and forgets the code`);
  return { A, B, k, T, beforeOff, gone };
}
(async () => {
  const out = {};
  for (const [file, label] of [['client_38.28.js', '38.28 page'], ['client_38.31.js', '38.31 page']]) out[label] = await story(file, label);

  /* ---- the new server protects old pages: what they overwrote or deleted can still be reached ---- */
  for (const label of Object.keys(out)) {
    const { A, B, k, T, beforeOff, gone } = out[label];
    const kept = ((beforeOff.j.versions || []).filter(v => v.kind === 'kept'))[0];
    A.run(`vault = { code: ${JSON.stringify(B.run('vault.code'))}, rev: 0, on: true };`);
    const s = kept ? await decryptOnServer(A, k, '?ver=' + kept.ver) : { status: 0 };
    ok(s.status === 200 && s.d.receipts.some(r => r.a === 999), `${label}: the copy that "Keep mine" replaced is still on the server as a version`);
    ok(!!(gone.j.deleted && gone.j.deleted.until), `${label}: the deleted copy is kept for a while`);
    const un = await call(env, 'POST', k.id, k.token, { action: 'undelete' });
    const back = un.status === 200 ? await decryptOnServer(A, k) : { status: 0 };
    ok(back.status === 200 && back.d.receipts.some(r => r.a === 111), `${label}: and the delete can be undone`);
    await call(env, 'DELETE', k.id, k.token);
    /* the other device still has the code: its next change finds no live copy and starts one again, as it always did */
    await B.reopen(); B.spend(222, T + 9000); await B.push();
    const again = await decryptOnServer(A, k);
    ok(again.status === 200 && again.d.receipts.some(r => r.a === 222), `${label}: another device that still has the code starts the cloud copy again with its next change`);
  }
  console.log(`VAULT CLIENTS: ${pass} pass, ${failN} fail`); process.exit(failN ? 1 : 0);
})().catch(e => { console.log('CRASH', e.stack); process.exit(2); });
