/* The vault server, tested in plain node against a stand-in database (tests/vault_d1_shim.js). No wrangler, no browser.
   Run: node tests/vault_server.test.js
   Covers: the upgrade of a 38.28 database, dated versions, soft delete and undo, the server's own clock and version counter. */
const { makeDb, call, LEGACY_VAULT } = require('./vault_d1_shim.js');
const crypto = require('crypto');
let pass = 0, failN = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); c ? pass++ : failN++; };
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const DAY = 86400000, T0 = Date.UTC(2026, 0, 5, 9, 0, 0);
const realNow = Date.now; let clock = T0; Date.now = () => clock;           /* the server's clock, set by the test */
const db = makeDb(), env = { DB: db, VAULT_IP_PER_MINUTE: '100000', VAULT_WRITES_PER_DAY: '100000', VAULT_NEW_PER_IP_DAY: '100000', VAULT_NEW_PER_DAY: '100000' };
let n = 0; const who = () => { n++; return { id: sha('id' + n).slice(0, 64), token: sha('tok' + n).slice(0, 64) }; };
const blob = s => Buffer.from(String(s)).toString('base64'), IV = 'AAAAAAAAAAAAAAAA';
const iv = i => blob('iv-nonce-' + String(i).padStart(3, '0')).slice(0, 16);
let seq = 0; const put = (p, text, rev, extra) => call(env, 'PUT', p.id, p.token, Object.assign({ blob: blob(text), iv: iv(++seq), rev }, extra || {}));
const get = (p, q) => call(env, 'GET', p.id, p.token, undefined, q);

(async () => {
  /* ---- 1. a database made by the 38.28 server is upgraded by adding only ---- */
  db.raw.exec(LEGACY_VAULT);
  db.raw.exec('CREATE TABLE IF NOT EXISTS usage (day TEXT NOT NULL, k TEXT NOT NULL, calls INTEGER NOT NULL DEFAULT 0, tokens INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, k))');
  const realToday = new Date(realNow()).toISOString().slice(0, 10);
  db.raw.prepare('INSERT INTO usage (day, k, calls) VALUES (?, ?, 1), (?, ?, 1)').run('2020-01-01', 'm:203.0.113.7:1', realToday, 'all');
  const old = who();
  db.raw.prepare('INSERT INTO vault (id, token_hash, blob, iv, rev, updated_at, created_at, prev_blob, prev_iv, prev_rev, size, writes_day, writes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(old.id, sha(old.token), blob('old-latest'), IV, 2000, T0 - DAY, T0 - 5 * DAY, blob('old-prev'), IV, 1000, 14, '2026-01-04', 3);
  let r = await get(old);
  ok(r.status === 200 && r.j.blob === blob('old-latest') && r.j.rev === 2000 && r.j.hasPrev === true, 'upgrade: a copy saved by the 38.28 server still opens');
  r = await get(old, '?prev=1');
  ok(r.j.prev && r.j.prev.blob === blob('old-prev'), 'upgrade: its previous copy is still there');
  const cols = db.raw.prepare("SELECT name FROM pragma_table_info('vault')").all().map(x => x.name);
  ok(['id', 'token_hash', 'blob', 'iv', 'rev', 'updated_at', 'created_at', 'prev_blob', 'prev_iv', 'prev_rev', 'size', 'writes_day', 'writes'].every(c => cols.includes(c)), 'upgrade: every old column is still in the vault table');
  ok(db.raw.prepare("SELECT name FROM sqlite_master WHERE name = 'vault_versions'").all().length === 1, 'upgrade: a versions table was added');
  r = await put(old, 'old-next', 3000);
  const afterOld = await get(old, '?versions=1');
  ok(r.status === 200 && afterOld.status === 200 && (afterOld.j.versions || []).some(v => v.rev === 2000), 'upgrade: the first save after the upgrade keeps the old copy as a version');

  /* ---- 2. dated versions: the last copy of each of the last 7 days, plus the latest ---- */
  const a = who();
  for (let d = 0; d < 10; d++) for (let k = 0; k < 3; k++) { clock = T0 + d * DAY + k * 3600000; r = await put(a, `day${d}-save${k}`, clock); if (r.status !== 200) ok(false, 'save failed on day ' + d); }
  clock = T0 + 10 * DAY; r = await put(a, 'day10-save0', clock);
  const list = await get(a, '?versions=1');
  ok(list.status === 200 && Array.isArray(list.j.versions), 'versions: GET ?versions=1 lists them');
  const vs = list.j.versions || [], daily = vs.filter(v => v.kind === 'daily');
  ok(daily.length === 7, 'versions: 7 daily copies are kept, got ' + daily.length);
  ok(daily.every(v => typeof v.ver === 'number' && typeof v.saved === 'number' && typeof v.size === 'number' && v.blob === undefined), 'versions: each entry has ver, saved (server time) and size, and no content');
  const days = daily.map(v => v.day).sort();
  ok(days.join() === ['2026-01-08', '2026-01-09', '2026-01-10', '2026-01-11', '2026-01-12', '2026-01-13', '2026-01-14'].join(), 'versions: they are the 7 newest days: ' + days.join(' '));
  const d14 = daily.find(v => v.day === '2026-01-14'), one = d14 ? await get(a, '?ver=' + d14.ver) : { j: {} };
  ok(one.status === 200 && one.j.blob === blob('day9-save2') && typeof one.j.iv === 'string', 'versions: GET ?ver=N returns that copy, and a day keeps its last save');
  r = await get(a);
  ok(r.j.blob === blob('day10-save0') && r.j.ver === list.j.ver && typeof r.j.ver === 'number', 'versions: the plain GET is still the latest copy and carries the version counter');
  r = await get(a, '?ver=999999'); ok(r.status === 404, 'versions: asking for a version that does not exist is a 404');
  r = await call(env, 'GET', a.id, sha('wrong'), undefined, '?versions=1'); ok(r.status === 403, 'versions: the list needs the right token');

  /* ---- 3. the server's own time and counter decide "newer", not the device clock ---- */
  const b = who(); clock = T0 + 20 * DAY;
  const far = clock + 400 * DAY;                                /* a phone whose clock is a year ahead */
  r = await put(b, 'first', far);
  ok(r.status === 200 && r.j.ver === 1 && r.j.updated === clock, 'counter: the first save is version 1 and is stamped with the server time, not the device time');
  clock += 60000; r = await put(b, 'second', clock, { base: 1 });
  ok(r.status === 200 && r.j.ver === 2, 'counter: a device that saw version 1 may save, even though its clock says an older time than the stored copy');
  clock += 60000; r = await put(b, 'stale', far + 5 * DAY, { base: 1 });
  ok(r.status === 409 && r.j.error && r.j.error.code === 'conflict' && r.j.ver === 2 && typeof r.j.updated === 'number', 'counter: a device that last saw version 1 is refused when the server holds version 2, however far ahead its clock is');
  r = await get(b); ok(r.j.blob === blob('second') && typeof r.j.now === 'number' && r.j.now === clock, 'counter: the refused save changed nothing, and GET tells the server time');
  r = await put(b, 'mine', far + 5 * DAY, { base: 1, force: true });
  ok(r.status === 200 && r.j.ver === 3, 'counter: "Keep mine" (force) still saves');
  let lb = await get(b, '?versions=1'); const kept = (lb.j.versions || []).find(v => v.kind === 'kept');
  ok(!!kept && (await get(b, '?ver=' + kept.ver)).j.blob === blob('second'), 'counter: the copy that "Keep mine" replaced is kept as a version');
  for (let k = 0; k < 4; k++) { clock += 60000; await put(b, 'later' + k, clock, { base: 3 + k }); }
  lb = await get(b, '?versions=1');
  ok((lb.j.versions || []).some(v => v.kind === 'kept' && v.ver === (kept || {}).ver), 'counter: later saves on the same day do not push that kept copy out');
  /* the same request arriving twice (the answer was lost on the way) is not a conflict with itself */
  const body = { blob: blob('once'), iv: iv(900), rev: clock, base: lb.j.ver };
  const r1 = await call(env, 'PUT', b.id, b.token, body), r2 = await call(env, 'PUT', b.id, b.token, body);
  ok(r1.status === 200 && r2.status === 200 && r2.j.ver === r1.j.ver, 'counter: a save sent twice is accepted once and answered the same both times');
  /* old pages send no base: the old rule still holds for them */
  const c = who(); await put(c, 'c1', 5000); r = await put(c, 'c0', 4000);
  ok(r.status === 409 && r.j.rev === 5000 && typeof r.j.updated === 'number', 'old pages: an older rev is refused with rev and updated, as before');
  r = await put(c, 'c0', 4000, { force: true }); ok(r.status === 200 && r.j.rev === 4000, 'old pages: force still overwrites');
  r = await put(c, 'bad', 6000, { base: -1 }); ok(r.status === 400, 'a bad base is a 400');

  /* ---- 4. soft delete and undo ---- */
  const d = who(); clock = T0 + 40 * DAY;
  await put(d, 'd1', clock); clock += DAY; await put(d, 'd2', clock, { base: 1 });
  r = await call(env, 'DELETE', d.id, d.token);
  ok(r.status === 200 && r.j.deleted === true && r.j.until === clock + 30 * DAY, 'delete: answers deleted, and says until when it can be undone');
  r = await get(d);
  ok(r.status === 404 && r.j.deleted && r.j.deleted.until === clock + 30 * DAY, 'delete: the plain GET is a 404 (as old pages expect) and says the copy can still be brought back');
  r = await get(d, '?versions=1'); ok(r.status === 200 && r.j.deleted && (r.j.versions || []).length === 1, 'delete: the versions are still listed');
  r = await call(env, 'POST', d.id, sha('wrong'), { action: 'undelete' }); ok(r.status === 403, 'delete: undo needs the right token');
  clock += 29 * DAY;
  r = await call(env, 'POST', d.id, d.token, { action: 'undelete' });
  ok(r.status === 200 && r.j.restored === true && r.j.ver === 2, 'delete: undo works on day 29');
  r = await get(d); ok(r.status === 200 && r.j.blob === blob('d2') && !r.j.deleted, 'delete: after undo the latest copy is back');
  r = await get(d, '?versions=1'); ok((r.j.versions || []).length === 1, 'delete: and so are its versions');
  r = await call(env, 'POST', d.id, d.token, { action: 'nonsense' }); ok(r.status === 400, 'an unknown POST action is a 400');
  /* a save after a delete (another device that still has the code) starts a live copy again and keeps the deleted one */
  await call(env, 'DELETE', d.id, d.token); clock += 60000;
  r = await put(d, 'd3', clock);
  ok(r.status === 200, 'delete: a save after a delete is accepted, as before');
  r = await get(d); const ld = await get(d, '?versions=1');
  const keptD = (ld.j.versions || []).find(v => v.kind === 'kept');
  ok(r.status === 200 && r.j.blob === blob('d3') && !!keptD && (await get(d, '?ver=' + keptD.ver)).j.blob === blob('d2'), 'delete: the deleted copy is then kept as a version');
  /* after the keeping time it is really gone */
  const e = who(); clock = T0 + 100 * DAY; await put(e, 'e1', clock); clock += 1000; await put(e, 'e2', clock, { base: 1 });
  await call(env, 'DELETE', e.id, e.token); clock += 30 * DAY + 60000;
  r = await call(env, 'POST', e.id, e.token, { action: 'undelete' }); ok(r.status === 404, 'delete: after 30 days undo is a 404');
  r = await get(e, '?versions=1'); ok(r.status === 404, 'delete: and the versions are gone');
  ok(db.raw.prepare('SELECT COUNT(*) AS c FROM vault WHERE id = ?').get(e.id).c === 0 && db.raw.prepare("SELECT COUNT(*) AS c FROM sqlite_master WHERE name = 'vault_versions'").get().c === 1
    && db.raw.prepare('SELECT COUNT(*) AS c FROM vault_versions WHERE id = ?').get(e.id).c === 0, 'delete: nothing of it is left in the database');
  /* a delete by one person sweeps out other copies whose keeping time has passed */
  const f = who(), g = who(); clock = T0 + 200 * DAY; await put(f, 'f1', clock); await call(env, 'DELETE', f.id, f.token);
  clock += 31 * DAY; await put(g, 'g1', clock); await call(env, 'DELETE', g.id, g.token);
  ok(db.raw.prepare('SELECT COUNT(*) AS c FROM vault WHERE id = ?').get(f.id).c === 0 && db.raw.prepare('SELECT COUNT(*) AS c FROM vault WHERE id = ?').get(g.id).c === 1, 'delete: expired copies are swept out, fresh ones are not');
  r = await call(env, 'DELETE', who().id, sha('x')); ok(r.status === 200 && r.j.deleted === false, 'delete: deleting nothing answers deleted false, as before');

  /* ---- 5. from the security review (SECURITY_REVIEW.md: S2, S3, S4, S8, L2) ---- */
  /* S3: a device clock far ahead cannot block everyone else for ever: the stored rev is held to one day past the server time */
  const h = who(); clock = T0 + 300 * DAY;
  r = await put(h, 'ahead', clock + 400 * DAY);
  ok(r.status === 200 && r.j.rev === clock + DAY && r.j.now === clock, 'clock: a rev a year ahead is stored as one day ahead, and the answer tells the server time');
  clock += DAY + 60000; r = await put(h, 'honest', clock);
  ok(r.status === 200, 'clock: a day later an old page with a right clock can save again');
  /* S4: size */
  const big = n => 'A'.repeat(n), j = who(); clock += 1000;
  r = await call(env, 'PUT', j.id, j.token, { blob: big(1800004), iv: IV, rev: clock });
  ok(r.status === 413 && r.j.error.code === 'too_large', 'size: a copy over the limit is refused with 413 too_large');
  r = await call(env, 'PUT', j.id, j.token, { blob: big(1200000), iv: iv(801), rev: clock }); clock += 1000;
  const r3 = await call(env, 'PUT', j.id, j.token, { blob: big(1200004), iv: iv(802), rev: clock, base: 1 });
  const rowJ = db.raw.prepare('SELECT length(blob) + COALESCE(length(prev_blob), 0) AS n FROM vault WHERE id = ?').get(j.id);
  ok(r.status === 200 && r3.status === 200 && rowJ.n < 2000000 && (await get(j, '?ver=1')).j.blob.length === 1200000, 'size: two large saves fit (one database row stays under 2 MB) and the earlier one is a version');
  r = await call(env, 'PUT', j.id, j.token, '{"blob":"QUJD","iv":"' + IV + '","rev":5}', '', { headers: { 'content-length': '5000000' } });
  ok(r.status === 413, 'size: a body announced as far too large is refused before it is read');
  /* S2: new cloud copies are limited per address and per day; saves to an existing copy are not */
  const lim = Object.assign({}, env, { VAULT_NEW_PER_IP_DAY: '2' }), from = { ip: '198.51.100.20' };
  const n1 = who(), n2 = who(), n3 = who(); clock += 1000;
  const body1 = t => ({ blob: blob(t), iv: iv(++seq), rev: clock });
  const c1 = await call(lim, 'PUT', n1.id, n1.token, body1('n1'), '', from), c2 = await call(lim, 'PUT', n2.id, n2.token, body1('n2'), '', from), c3 = await call(lim, 'PUT', n3.id, n3.token, body1('n3'), '', from);
  ok(c1.status === 200 && c2.status === 200 && c3.status === 429 && c3.j.error.code === 'rate_limited', 'new copies: the third new cloud copy from one address in a day is refused (limit set to 2 here)');
  clock += 1000; r = await call(lim, 'PUT', n1.id, n1.token, Object.assign(body1('n1b'), { base: 1 }), '', from);
  ok(r.status === 200, 'new copies: saving to an existing copy from that address still works');
  const tot = Object.assign({}, env, { VAULT_NEW_PER_DAY: '0' });
  r = await call(tot, 'PUT', who().id, sha('t'), body1('x'), '', { ip: '198.51.100.21' });
  ok(r.status === 429, 'new copies: the limit for the whole site per day holds too');
  /* optional: the first save needs the invite word (off unless VAULT_NEW_NEEDS_INVITE is set, because 38.28 and 38.31 pages send none) */
  const inv = Object.assign({}, env, { INVITE_CODES: 'three plain words' }), invOn = Object.assign({}, inv, { VAULT_NEW_NEEDS_INVITE: '1' }), m1 = who(), m2 = who();
  r = await call(inv, 'PUT', m1.id, m1.token, body1('m1')); ok(r.status === 200, 'invite: with only INVITE_CODES set, a page that sends no invite can still start a cloud copy');
  r = await call(invOn, 'PUT', m2.id, m2.token, body1('m2')); ok(r.status === 401 && r.j.error.code === 'invite_required', 'invite: with VAULT_NEW_NEEDS_INVITE set, a new copy without the word is refused');
  r = await call(invOn, 'PUT', m2.id, m2.token, Object.assign(body1('m2'), { invite: 'Three Plain Words' })); ok(r.status === 200, 'invite: with the word it is accepted');
  clock += 1000; r = await call(invOn, 'PUT', m2.id, m2.token, Object.assign(body1('m2b'), { base: 1 })); ok(r.status === 200, 'invite: later saves need no word');
  /* S8: the counters hold no network address, and old counter rows are cleared */
  const keys = db.raw.prepare('SELECT day, k FROM usage').all();
  ok(keys.length > 0 && !keys.some(x => /10\.0\.0\.1|198\.51\.100\./.test(x.k)), 'counters: no network address is stored in the usage table');
  ok(!keys.some(x => x.day === '2020-01-01') && keys.some(x => x.day === realToday && x.k === 'all'), 'counters: rows older than a week are cleared, today\'s stay');

  Date.now = realNow;
  console.log(`VAULT SERVER: ${pass} pass, ${failN} fail`); process.exit(failN ? 1 : 0);
})().catch(e => { console.log('CRASH', e.stack); process.exit(2); });
