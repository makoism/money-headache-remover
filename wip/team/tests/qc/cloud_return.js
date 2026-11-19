/* A person who set up before and comes back (page opened again, cloud copy off) finds Cloud copy in Settings.
   Before: the page asked the server what it offers only on the welcome screen or when Ask was opened, so on a return visit
   Settings had no Cloud copy box and the plan could not be moved to another phone. Made-up server on this machine (cloud_lib.js),
   made-up numbers, nothing leaves the machine. The test reads ids, not wording. Run: node tests/qc/cloud_return.js */
let bad = 0; const ck = (n, c, x) => { console.log(c ? 'PASS' : 'FAIL', n, c ? '' : (x || '')); if (!c) bad++; };
const C = require('./cloud_lib.js'), { L, R, w, seen, until } = C;
(async () => {
  const srv = await C.server();
  const A = await C.profile(srv.url), p = A.p;
  await L.rc(p, 1234, 'envelope', null, 'Made-up noodles');
  await p.evaluate(() => { const S = __t.S; S.ui.setup = true; S.ui.sampleHidden = true; S.ui.done = { pay: true, bills: true, goals: true }; __t.persist(); });
  await w(700); await p.reload(); await w(1800); await C.skipTour(p);
  ck('the page opened again with the plan it had, no welcome screen', !(await seen(p, '#tour')) && await p.evaluate(() => __t.S.receipts.length === 1));
  await L.settings(p);
  ck('Settings shows Cloud copy with both ways in, without opening anything else first', await until(() => seen(p, '#vaultOn'), 6000) && await seen(p, '#vaultHave'));
  ck('nothing was sent to find that out', srv.st.puts === 0 && srv.st.gets === 0, JSON.stringify(srv.st));
  ck('no page errors', A.errs.length === 0, A.errs.join(' | '));
  await A.b.close(); srv.close && srv.close();
  console.log(bad ? 'CLOUD RETURN FAIL ' + bad : 'CLOUD RETURN PASS'); process.exit(bad ? 1 : 0);
})();
