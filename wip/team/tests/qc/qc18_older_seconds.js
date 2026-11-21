/* QC round 7 data safety, confusing 4: the older-copy warning showed the same minute for both copies ("saved 21 Nov, 3:11 PM" and
   "last changed 21 Nov, 3:11 PM"). When the two times fall in the same minute both show seconds (3:11:05 PM and 3:11:42 PM); otherwise
   they stay as they were. Two browser profiles and a made-up server (cloud_lib.js), made-up numbers.
   Run: node tests/qc/qc18_older_seconds.js */
const C = require('./cloud_lib.js'), { L, w, seen, text, tap, until } = C;
let bad = 0; const ck = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (x !== undefined) console.log('     saw ' + JSON.stringify(x).slice(0, 400)); } };
const SAVED = /It was saved (\d{1,2} \w{3}, \d{1,2}:\d\d(?::\d\d)? [AP]M) and has/, MINE = /\(last changed (\d{1,2} \w{3}, \d{1,2}:\d\d(?::\d\d)? [AP]M)\)/;
const fmt = (t, sec) => { const d = new Date(t); return d.getDate() + ' ' + d.toLocaleString('en-US', { month: 'short' }) + ', ' + d.toLocaleString('en-US', Object.assign({ hour: 'numeric', minute: '2-digit' }, sec ? { second: '2-digit' } : {})); };
(async () => {
  const srv = await C.server();
  /* start early in a minute, so the cloud copy and B's change land in the same minute */
  for (let i = 0; i < 70 && new Date().getSeconds() > 8; i++) await w(1000);
  const A = await C.profile(srv.url);
  await L.rc(A.p, 1234, 'envelope', null, 'Made-up noodles');
  await L.settings(A.p); await until(() => seen(A.p, '#vaultOn')); await tap(A.p, '#vaultOn'); await tap(A.p, '#vaultFlow [data-vf-next]');
  const code = await text(A.p, '#vaultCodeTxt');
  await tap(A.p, '#vaultSaved'); await until(() => srv.st.puts >= 1); await w(1200);
  const B = await C.profile(srv.url);
  await L.rc(B.p, 55, 'envelope', null, 'Made-up later on B');
  const find = async () => {
    await L.tab(B.p, 'tab-home'); await L.settings(B.p); await until(() => seen(B.p, '#vaultHave')); await tap(B.p, '#vaultHave');
    await B.p.type('#vaultIn', code); await tap(B.p, '#vaultUse'); await until(() => seen(B.p, '#vaultFlow [data-vf-older]'), 12000);
    const t = await B.p.evaluate(() => document.querySelector('#vaultFlow').innerText.replace(/\s+/g, ' '));
    await B.p.evaluate(() => { const c = document.querySelector('#vaultKeepHere'); c && c.click(); }); await w(600);
    return t;
  };
  const cloudT = (r => r.updated || r.rev)(Object.values(srv.st.store)[0]);
  let mineT = await B.p.evaluate(() => __t.S.rev);
  const same = Math.floor(cloudT / 60000) === Math.floor(mineT / 60000);
  const t1 = await find(), s1 = SAVED.exec(t1), m1 = MINE.exec(t1);
  ck('the older-copy warning shows both times', !!(s1 && m1), t1);
  if (same) {
    ck('same minute: both show seconds', s1 && m1 && s1[1] === fmt(cloudT, true) && m1[1] === fmt(mineT, true), { s: s1 && s1[1], m: m1 && m1[1], want: [fmt(cloudT, true), fmt(mineT, true)] });
    ck('same minute: the two times differ on screen', s1 && m1 && s1[1] !== m1[1], { s: s1 && s1[1], m: m1 && m1[1] });
  } else console.log('NOTE the two copies fell in different minutes this run, so the same-minute check was skipped');
  /* B's last change a few minutes later than the cloud copy: no seconds, as before */
  await B.p.evaluate(() => { __t.S.rev = Date.now() + 3 * 60000; __t.persist(); }); await w(1500);
  mineT = await B.p.evaluate(() => __t.S.rev);
  const t2 = await find(), s2 = SAVED.exec(t2), m2 = MINE.exec(t2);
  ck('different minutes: no seconds, as before', s2 && m2 && s2[1] === fmt(cloudT) && m2[1] === fmt(mineT), { s: s2 && s2[1], m: m2 && m2[1], want: [fmt(cloudT), fmt(mineT)] });
  const errs = A.errs.concat(B.errs).filter(e => !/status of 409/.test(e));
  ck('no page errors', errs.length === 0, errs.slice(0, 3));
  await A.b.close(); await B.b.close(); srv.close();
  console.log(bad ? `qc18_older_seconds: ${bad} FAIL` : 'qc18_older_seconds: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc18_older_seconds: FAIL'); process.exit(1); });
