/* MIGRATION FROM EVERY OLD BUILD INTO THE LEDGER (tests/next, side session C, 2026-11-19).
   EXPECTED TO FAIL until step B1 (the ledger) is built. PLAN.md section D step 12: "Migration test first, from every stored version
   since 38.2x ... migration (goal starts and the bank start become opening balances, the rest starts as Chest money to place)";
   HANDOFF.md section 5, step B: "Migration with nothing lost for anyone ... write the migration test before the code".
   Run: bash tests/setup_env.sh && node tests/next/migration_fixtures.js      Ends with "MIGRATION PASS" or "MIGRATION FAIL n".

   The fixtures in tests/next/fixtures/ are saved copies written by the REAL old builds (made by tests/next/make_fixtures.js from the
   19 builds in tests/fixtures/old_builds.txt), with made-up numbers: bank start 23,400, goal starts 6,100 and 2,750 (and the
   sample's own emergency fund start), a pay of 41,000, up to three receipts, and 4,321 for food in Feb 2027 only.
   Each one is opened in the current page exactly as a person's phone would open it, and then:

   Nothing lost (runs today, should already pass): name, currency, every receipt (id and amount), every goal (target and start),
   every plan line, the bank start, and the single-month change all come through.

   Into the ledger (fails until the ledger exists):
   1. Each goal's start becomes that goal's opening balance, to the cent. A goal with no start holds nothing.
   2. The bank start becomes an opening balance of exactly that amount.
   3. The opening balances add up to exactly bank start + every goal start: nothing doubled, nothing dropped.
   4. Everything else starts as Chest money to place: Bills left and Free to spend (This month) hold nothing.
   5. Total = Chest + This month + Burrows, and Total is at least bank start + goal starts (nothing lost). The Chest is not below zero.
   6. Opening the page again does not migrate twice: the ledger is the same.
   Where the docs do not say (where the bank start sits, what "the rest" is, a bank start below zero, Education / Giving / Investing
   running totals, receipts as ledger events), the check prints WAIT; the questions are M1 to M6 in SIDE_C_QUESTIONS.md.
   The app hook is PAGE_HOOK in tests/next/lib.js. */
const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const fs = require('fs'), path = require('path');
const { PAGE_HOOK, Report, cents } = require('./lib');
const NEW = process.env.PAGE || '/home/claude/work/money-map-team.html';
const DIR = path.join(__dirname, 'fixtures');
const w = ms => new Promise(r => setTimeout(r, ms));
const rep = Report('migration');
const ver = f => f.slice(1, -5).split('.').map(Number);
const FIX = fs.readdirSync(DIR).filter(f => /^v[\d.]+\.json$/.test(f)).sort((a, b) => { const x = ver(a), y = ver(b); return x[0] - y[0] || (x[1] || 0) - (y[1] || 0); });
if (!fs.existsSync(NEW)) { console.log('no page at ' + NEW + ': run bash tests/setup_env.sh first'); process.exit(2); }
if (FIX.length < 19) rep.ok(false, `only ${FIX.length} fixtures in tests/next/fixtures (19 old builds expected): run node tests/next/make_fixtures.js`);

/* what the page holds after loading, read through the test handle (?sfxtest) */
const READ = function () {
  const S = window.__t && window.__t.S; if (!S) return null;
  return { name: S.ui.name, cur: S.ui.cur, bankStart: S.cfg.bankStart, receipts: (S.receipts || []).map(r => [r.id, r.a]),
    goals: S.plan.goals.map(g => [g.id, g.target, g.start]), lines: S.plan.lines.map(l => l.id), once: S.once, steps: S.steps,
    tourOpen: !!(document.querySelector('#tour') && !document.querySelector('#tour').hidden) };
};

(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
  let built = null;
  for (const f of FIX) {
    const fx = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')), old = JSON.parse(fx.saved), tag = 'v' + fx.build;
    const ctx = await b.createBrowserContext(), errs = [];
    const open = async () => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.setViewport({ width: 390, height: 844 });
      await p.goto('file://' + NEW + '?sfxtest#2026-11', { waitUntil: 'load' }); await w(1500); return p; };
    const p0 = await ctx.newPage();
    await p0.evaluateOnNewDocument((k, v) => { try { if (!sessionStorage.getItem('__fx')) { localStorage.setItem(k, v); sessionStorage.setItem('__fx', '1'); } } catch (e) {} }, fx.key, fx.saved);
    p0.on('pageerror', e => errs.push(e.message)); await p0.setViewport({ width: 390, height: 844 });
    await p0.goto('file://' + NEW + '?sfxtest#2026-11', { waitUntil: 'load' }); await w(1500);
    const now = await p0.evaluate(READ), hook = await p0.evaluate(PAGE_HOOK);
    if (!now) { rep.ok(false, `${tag}: the page did not load the saved copy (no test handle)`); await ctx.close(); continue; }

    /* nothing lost: what the old build saved is all still there */
    const T = fx.typed;
    if (T.name) rep.eq(`${tag}: name`, now.name, T.name);
    rep.eq(`${tag}: currency`, now.cur, old.ui && old.ui.cur ? old.ui.cur : '₱');
    rep.eq(`${tag}: receipts (id and amount)`, JSON.stringify(now.receipts), JSON.stringify((old.receipts || []).map(r => [r.id, r.a])));
    rep.eq(`${tag}: goals (id, target, start)`, JSON.stringify(now.goals), JSON.stringify(old.plan.goals.map(g => [g.id, g.target, g.start])));
    rep.eq(`${tag}: plan lines`, JSON.stringify(now.lines), JSON.stringify(old.plan.lines.map(l => l.id)));
    rep.eq(`${tag}: bank start`, now.bankStart, old.cfg.bankStart);
    if (T.once) rep.eq(`${tag}: the change for ${T.once.ym} only`, ((now.once || {})[T.once.ym] || {})[T.once.key], T.once.v);
    rep.eq(`${tag}: pay steps`, JSON.stringify(now.steps.a || null), JSON.stringify((old.steps || {}).a || null));

    /* into the ledger */
    if (built === null) { built = !!hook; if (!hook) rep.missing('the ledger in the page: __t.S.ledger and __t.placesOf (hook PAGE_HOOK in tests/next/lib.js)'); }
    if (hook) {
      const P = hook.places, bank = cents(old.cfg.bankStart || 0), starts = old.plan.goals.map(g => [g.id, cents(g.start || 0)]);
      const goalSum = starts.reduce((a, s) => a + s[1], 0), burrows = P.burrows || {};
      starts.forEach(([id, s]) => rep.eq(`${tag}: goal ${id} opens with its start`, cents(burrows[id] || 0), s));
      const opens = hook.ledger.filter((e, i) => hook.isOpening[i]), openSum = opens.reduce((a, e) => a + cents(+e.a || 0), 0);
      rep.ok(opens.some(e => cents(+e.a || 0) === bank), `${tag}: no opening balance of exactly the bank start ${bank / 100} (${JSON.stringify(opens).slice(0, 160)})`);
      rep.eq(`${tag}: opening balances add up to bank start + goal starts`, openSum, bank + goalSum);
      rep.eq(`${tag}: Bills left starts empty (the rest is Chest money to place)`, cents(P.bills || 0), 0);
      rep.eq(`${tag}: Free to spend starts empty`, cents(P.free || 0), 0);
      rep.eq(`${tag}: This month starts empty`, cents(P.thisMonth || 0), 0);
      const saved = Object.values(burrows).reduce((a, v) => a + cents(v), 0);
      rep.eq(`${tag}: Total = Chest + This month + Burrows`, cents(P.total), cents(P.chest) + cents(P.thisMonth || 0) + saved);
      rep.ok(cents(P.total) >= bank + goalSum, `${tag}: Total ${P.total} is less than bank start + goal starts ${(bank + goalSum) / 100}: money lost`);
      rep.ok(cents(P.chest) >= 0, `${tag}: the Chest is below zero`);
      if (old.ui && old.ui.cur === '¥') rep.ok(hook.ledger.every(e => Number.isInteger(+e.a)), `${tag}: a yen amount in the ledger has cents`);
      rep.waitQ('M1', 'which place the bank start sits in after migration (the Chest, or a separate bank place)');
      rep.waitQ('M2', 'what "the rest" is that starts as Chest money (only the bank start, or the money the plan says should be there today)');
      rep.waitQ('M4', 'whether Education, Giving and Investing running totals from the plan become opening balances');
      rep.waitQ('M5', 'whether receipts already logged become spend events in the ledger');
    }
    /* opening the page again must not migrate a second time */
    await p0.close(); const p1 = await open();
    const again = await p1.evaluate(PAGE_HOOK);
    if (hook) rep.eq(`${tag}: opening again leaves the ledger as it was`, JSON.stringify(again && again.ledger), JSON.stringify(hook.ledger));
    rep.ok(!errs.length, `${tag}: page errors ${JSON.stringify(errs.slice(0, 2))}`);
    await ctx.close();
  }
  rep.waitQ('M3', 'a bank start below zero (an overdrawn account): an opening balance below zero, or something else');
  rep.waitQ('M6', 'saved copies older than 25.0, which kept goal starts in settings (rainyStart, moveStart ...): in scope or not');
  await b.close();
  rep.end();
})().catch(e => { console.log('CRASH', e.stack); process.exit(2); });
