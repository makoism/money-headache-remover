/* QC round 9 wording blocker 1: with the cloud copy on, two lines still said the numbers stay only in this browser:
   Settings, Reset and setup ("They're saved in this browser only", while the samples or zeros show) and the setup Currency step
   ("Your numbers stay in this browser"). Settings Saved data already follows the cloud copy (qc13_saved_cloud.js).
   With the cloud copy on, each line must name the locked cloud copy and never say "only" or "stay in this browser";
   with it off, they keep the plain this-browser words. Made-up numbers only.
   Run: PAGE=/abs/money-map-team.html node tests/qc/qc28_cloud_where.js */
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
process.env.BUILD = PAGE;
let bad = 0; const ck = (n, c, saw) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) { bad++; if (saw !== undefined) console.log('     saw ' + JSON.stringify(saw).slice(0, 500)); } };
const wrongOn = t => /browser only|stay in this browser|this device only/i.test(t);
(async () => {
  const L = require('./lib_r12.js'), w = L.R.w;
  const { b, p, errs } = await L.start({ w: 390, h: 844, dpr: 1, mobile: true });
  const read = () => p.evaluate(() => window.__cloudWhere.read());
  /* the samples show (the first open); the page's test hook (?sfxtest) switches the cloud copy flag */
  await p.evaluate(() => window.__cloudWhere.set(false)); const off = await read();
  ck('cloud off, samples: Reset and setup says this browser', /this browser/.test(off.make), off.make);
  ck('cloud off: the Currency step says this browser', /this browser/.test(off.tour), off.tour);
  await p.evaluate(() => window.__cloudWhere.set(true)); const on = await read();
  ck('cloud on, samples: Reset and setup names the locked cloud copy and not "only"', /locked cloud copy/.test(on.make) && !wrongOn(on.make), on.make);
  ck('cloud on: the Currency step names the locked cloud copy and not "stay in this browser"', /locked cloud copy/.test(on.tour) && !wrongOn(on.tour), on.tour);
  /* everything at zero */
  await p.evaluate(() => window.__cloudWhere.set(false, true)); const z0 = await read();
  await p.evaluate(() => window.__cloudWhere.set(true)); const z1 = await read();
  ck('cloud off, after a clear: Reset and setup says this browser', /this browser/.test(z0.make), z0.make);
  ck('cloud on, after a clear: Reset and setup names the locked cloud copy and not "only"', /locked cloud copy/.test(z1.make) && !wrongOn(z1.make), z1.make);
  const e2 = errs.filter(e => !/favicon|net::ERR_FILE_NOT_FOUND|fonts/.test(e));
  ck('no page errors', e2.length === 0, e2.slice(0, 3));
  await b.close();
  console.log(bad ? `qc28_cloud_where: ${bad} FAIL` : 'qc28_cloud_where: ALL PASS'); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('crashed: ' + e.stack); console.log('qc28_cloud_where: FAIL'); process.exit(1); });
