/* Part 2 of the screen pack (screen_pack.js calls this): the panels no tab view shows.
   Each panel is reached by tapping like a person where practical; where a state cannot be reached quickly it is set through the
   ?sfxtest hooks (__t) and the comment at that panel says so. Every panel is wrapped: one that fails is reported as
   "NOT CAPTURED <name>: <reason>" and the rest go on. A step that times out is tried once more (other browser work may be running).
   A made-up server on this machine (cloud_lib.js) stands in for the cloud; the answers of Claude are made up here too. Nothing leaves the machine.
   Made-up numbers only. */
const fs = require('fs'), os = require('os'), path = require('path');
module.exports = async (BUILD, OUT) => {
  process.env.BUILD = BUILD;                       /* cloud_lib.js serves the page named in BUILD */
  const C = require('./cloud_lib.js'), { L, R, w, seen, text, until } = C;
  const PW = 412, PH = 915;
  /* the panels, in the order of index.txt; the number in a file name is the place in this list */
  const EXPECT = [
    'cloud-step-1-what', 'cloud-step-2-code', 'cloud-step-3-here', 'cloud-step-4-other',
    'cloud-code-step-1-enter', 'cloud-code-step-2-found', 'cloud-code-step-2-found-older-copy-warning', 'cloud-code-step-3-loaded',
    'settings-cloud-copy-off', 'settings-cloud-copy-on', 'settings-cloud-copy-behind', 'settings-cloud-newer-copy',
    'home-notice-newer-copy-in-cloud', 'home-notice-cloud-copy-behind', 'home-notice-numbers-restored', 'home-notice-save-your-code', 'home-notice-back-up',
    'two-step-tap-again-remove-goal', 'undo-bar-after-remove-goal', 'undo-notice-after-reload', 'two-step-tap-again-set-all-to-zero',
    'help-open', 'ask-open', 'ask-reply-with-apply', 'ask-applied-with-undo', 'ask-undone',
    'tour-welcome-recovery-code-box', 'tour-currency', 'tour-your-money', 'tour-monthly-bills', 'tour-rent-or-mortgage', 'tour-food-and-groceries',
    'tour-split-the-rest', 'tour-emergency-fund', 'tour-free-to-spend', 'tour-setup-done-cloud-offer', 'tour-cloud-offer-code-shown',
    'home-more-open', 'home-check-your-bank', 'home-card-editor',
    'burrow-screen', 'burrow-add-money',
    'plan-goal-editor', 'plan-bill-line-editor', 'receipts-edit-form',
    'import-review-files', 'import-review-photos',
    'month-end-question', 'month-end-answered-with-undo',
    'newer-version-ready',
    'light-home', 'light-plan', 'light-settings',
    'desktop-home', 'desktop-plan', 'desktop-receipts', 'desktop-settings',
  ];
  const got = {}, why = {}, errs = []; let extra = EXPECT.length;
  const num = name => { let i = EXPECT.indexOf(name); if (i < 0) { EXPECT.push(name); i = EXPECT.length - 1; } return String(i + 1).padStart(2, '0'); };
  /* one capture. o.sel: the panel's own element (brought into view; its text comes first in the TXT). o.full: the whole page. o.w: 1280 for desktop */
  const snap = async (p, name, o = {}) => {
    if (o.sel) await p.evaluate((sel, block) => { const e = document.querySelector(sel); if (e) e.scrollIntoView({ block }); }, o.sel, o.block || 'center');
    else if (o.top) await p.evaluate(() => window.scrollTo(0, 0));
    await w(350);
    const f = `${o.w || PW}-panel-${num(name)}-${name}`;
    await p.screenshot({ path: `${OUT}/${f}.png`, fullPage: !!o.full });
    const t = await p.evaluate(sel => { const e = sel && document.querySelector(sel); return (e ? 'THE PANEL (' + sel + '):\n' + e.innerText.trim() + '\n\nTHE WHOLE SCREEN:\n' : '') + document.body.innerText; }, o.sel || '');
    fs.writeFileSync(`${OUT}/${f}.txt`, t); got[name] = f;
  };
  const need = async (p, sel, ms = 8000) => { if (!(await until(() => seen(p, sel), ms))) throw new Error('timeout: ' + sel + ' did not show'); };
  const gone = async (p, sel, ms = 8000) => { if (!(await until(async () => !(await seen(p, sel)), ms))) throw new Error('timeout: ' + sel + ' did not go away'); };
  const tap = async (p, sel, ms) => { await need(p, sel, ms); if (!(await C.tap(p, sel))) throw new Error('timeout: ' + sel + ' could not be tapped'); };
  const miss = (name, e) => { if (!got[name] && !why[name]) why[name] = String(e && e.message || e).split('\n')[0].slice(0, 220); };
  /* one panel: a failure is noted and the rest go on; a timeout is tried once more */
  const panel = async (names, fn) => {
    names = [].concat(names);
    for (let a = 0; a < 2; a++) {
      try { await fn(); return true; }
      catch (e) { if (a === 0 && /time(d)? ?out|Timeout/i.test(String(e && e.message))) { await w(800); continue; } names.forEach(n => miss(n, e)); return false; }
    }
    return false;
  };
  /* one browser: if opening it or its plan fails, every panel it was to show is noted with that reason */
  const session = async (names, open, fn) => {
    let o = null;
    try { o = await open(); await fn(o.p, o); }
    catch (e) { names.forEach(n => miss(n, e)); }
    if (o) { errs.push(...o.errs.filter(e => !/status of 500|ERR_EMPTY_RESPONSE|status of 40[49]/.test(e)).map(e => 'panels: ' + e)); try { await o.b.close(); } catch (e) { /* already closed */ } }
  };
  const tab = (p, t) => L.tab(p, t);
  const sub = async (p, s) => { await tab(p, 'tab-month'); await p.evaluate(s => { const e = document.querySelector(`[data-sub="${s}"]`); e && e.click(); }, s); await w(500); };
  const reload = async p => { await w(700); await p.reload(); await w(1800); await C.skipTour(p); };
  /* the plan every panel uses: yen, pay 280,000, bank 412,000, rent and food, a Trip goal, two receipts, one pay-in-full card.
     Typed through __t (as the tab views above do) because typing a whole plan by hand for eight browsers would take minutes.
     The reload at the end clears the "All numbers zeroed" Undo bar that zeroing leaves on screen. */
  const plan = async (p, o = {}) => {
    await L.zero(p); await p.evaluate(() => { __t.S.ui.cur = '¥'; });
    await L.base(p, { pay: 280000, bank: 412000, min: 50000, defs: { 'bill:rent': 95000, 'bill:food': 45000, envelope: 30000, education: 0, invest: 10000, give: 0 }, tT: 120000, tM: 15000, eT: 300000, eS: 60000, eM: 20000 });
    await p.evaluate(o => { const S = __t.S; S.ui.done = { pay: true, bills: true, goals: true, receipts: true }; S.ui.sampleHidden = true; delete S.ui.keep;
      S.ui.setup = true; delete S.ui.cleared;      /* as after a person's own setup, not as after Set all to zero */
      S.receipts = [];
      const r = (id, d, c, a, n) => { const l = S.plan.lines.find(x => x.key === c); S.receipts.push({ id, d, a, c, cn: l ? l.name : 'Other', n }); };
      (o.receipts || [['qp1', '2026-11-04', 'bill:food', 3840, 'Made-up grocer'], ['qp2', '2026-11-11', 'envelope', 2600, 'Made-up cinema']]).forEach(x => r(...x));
      __t.persist(); __t.restructure();
      __t.ACT.setBankNow(412000); __t.ACT.setCard(null, { name: 'Made-up card', owed: 18400, payDay: 27 });
      delete S.ui.keep; __t.persist(); }, o);
    if (!o.stay) await reload(p);
    await tab(p, 'tab-home');
  };
  /* A page that opens with a plan already saved does not ask the server what it offers until Ask is opened (or the cloud copy is on),
     and until then Settings shows no Cloud copy box. So Help, Ask is opened and closed once, as a person might. */
  const wake = async p => { await tap(p, '#helpBtn'); await tap(p, '#helpAsk'); await w(1200); await p.evaluate(() => document.getElementById('askClose').click()); await w(400); };
  const filePage = 'file://' + BUILD + '?sfxtest';
  const openFile = async (opt = {}) => { const o = await R.phone(Object.assign({ w: PW, h: PH, dpr: 1, mobile: true, keep: true }, opt)); if (opt.before) await opt.before(o.p); await o.p.goto(filePage); await w(1500); await C.skipTour(o.p); return o; };
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'qc-pack-'));
  const srv = await C.server();
  let code = '';

  /* ================= 1, 2, 3: the cloud copy (Settings steps, Settings states, Home notices) ================= */
  const cloudBox = { sel: '#vaultBox', block: 'start' };
  let A = null;
  await session(['cloud-step-1-what', 'cloud-step-2-code', 'cloud-step-3-here', 'cloud-step-4-other', 'settings-cloud-copy-off', 'settings-cloud-copy-on', 'home-notice-save-your-code', 'settings-cloud-copy-behind', 'home-notice-cloud-copy-behind',
    'cloud-code-step-1-enter', 'cloud-code-step-2-found', 'cloud-code-step-2-found-older-copy-warning', 'cloud-code-step-3-loaded', 'home-notice-back-up', 'home-notice-numbers-restored', 'home-notice-newer-copy-in-cloud', 'settings-cloud-newer-copy'],
  () => C.profile(srv.url), async p => {
    await plan(p); await wake(p);
    /* phone A turns the cloud copy on, one step at a time */
    await panel(['settings-cloud-copy-off', 'cloud-step-1-what'], async () => { await L.settings(p); await need(p, '#vaultOn'); await snap(p, 'settings-cloud-copy-off', cloudBox); await tap(p, '#vaultOn'); await need(p, '#vaultFlow [data-vf-step="what"]'); await snap(p, 'cloud-step-1-what', cloudBox); });
    await panel('cloud-step-2-code', async () => { await tap(p, '#vaultFlow [data-vf-next]'); await need(p, '#vaultCodeTxt'); code = await text(p, '#vaultCodeTxt'); await snap(p, 'cloud-step-2-code', cloudBox); });
    await panel('cloud-step-3-here', async () => { await tap(p, '#vaultSaved'); await need(p, '#vaultFlow [data-vf-step="here"]'); await until(async () => srv.st.puts >= 1 && /\d/.test(await text(p, '#vaultFlow [data-vf-sent]'))); await snap(p, 'cloud-step-3-here', cloudBox); });
    await panel('cloud-step-4-other', async () => { await tap(p, '#vaultFlow [data-vf-next]'); await need(p, '#vaultFlow [data-vf-step="other"]'); await snap(p, 'cloud-step-4-other', cloudBox); });
    await panel('settings-cloud-copy-on', async () => { await tap(p, '#vaultFlow [data-vf-done]'); await need(p, '#vaultShow'); await snap(p, 'settings-cloud-copy-on', cloudBox); });
    /* Home, "Save your recovery code": shown while the code has not been marked as saved. The steps above marked it, so the mark is
       taken off through __t (the tour's own cloud offer leaves it off too, see the tour panels below) */
    await panel('home-notice-save-your-code', async () => { await p.evaluate(() => { __t.S.ui.vaultSeen = false; __t.persist(); __t.restructure(); }); await tab(p, 'tab-home'); await need(p, '#hBk [data-vault-code]'); await snap(p, 'home-notice-save-your-code', { sel: '#hBk' });
      await p.evaluate(() => { __t.S.ui.vaultSeen = true; __t.persist(); __t.restructure(); }); });
    /* a send that fails (the made-up server answers 500): Settings and Home say the cloud copy is behind */
    await panel(['settings-cloud-copy-behind', 'home-notice-cloud-copy-behind'], async () => {
      srv.st.mode = '500'; await L.rc(p, 1200, 'envelope', null, 'Made-up bus pass');
      await L.settings(p); await need(p, '#vaultBehind', 12000); await snap(p, 'settings-cloud-copy-behind', cloudBox);
      await tab(p, 'tab-home'); await need(p, '#hBk [data-vault-retry]'); await snap(p, 'home-notice-cloud-copy-behind', { sel: '#hBk' });
    });
    srv.st.mode = 'ok';
    try { await L.settings(p); await tap(p, '#vaultRetry', 4000); await gone(p, '#vaultBehind', 12000); } catch (e) { /* the next save clears it */ }
    A = p;
    if (!/MHR-/.test(code)) throw new Error('no recovery code could be read off the screen of the first phone');

    /* phone B has numbers of its own, newer than the cloud copy: Home asks for a backup, and "I have a code" warns the cloud copy is older */
    await session(['home-notice-back-up', 'cloud-code-step-1-enter', 'cloud-code-step-2-found-older-copy-warning', 'home-notice-numbers-restored'], () => C.profile(srv.url), async q => {
      await plan(q); await wake(q); await L.rc(q, 700, 'envelope', null, 'Made-up B only');
      await panel('home-notice-back-up', async () => { await tab(q, 'tab-home'); await need(q, '#hBk [data-bk-later]'); await snap(q, 'home-notice-back-up', { sel: '#hBk' }); });
      await panel('cloud-code-step-1-enter', async () => { await L.settings(q); await tap(q, '#vaultHave'); await need(q, '#vaultIn'); await snap(q, 'cloud-code-step-1-enter', cloudBox); });
      await panel('cloud-code-step-2-found-older-copy-warning', async () => { await q.evaluate(() => { document.getElementById('vaultIn').value = ''; }); await q.type('#vaultIn', code); await tap(q, '#vaultUse'); await need(q, '#vaultFlow [data-vf-step="found"]', 12000); await need(q, '#vaultFlow [data-vf-older]');
        await snap(q, 'cloud-code-step-2-found-older-copy-warning', cloudBox); await tap(q, '#vaultKeepHere'); });
      /* Home, "Numbers restored": the page finds its saved numbers gone and loads the second copy the browser keeps. To get there the
         saved numbers are removed from storage just before the page loads again (a person gets here when the browser clears site data) */
      await panel('home-notice-numbers-restored', async () => {
        await w(1500);
        const s = await q.evaluateOnNewDocument(() => { try { localStorage.removeItem('money-map-template-v2'); } catch (e) { /* no storage */ } });
        await q.reload(); await w(2500); await q.removeScriptToEvaluateOnNewDocument(s.identifier); await C.skipTour(q);
        await tab(q, 'tab-home'); await need(q, '#hBk [data-bk-ok]'); await snap(q, 'home-notice-numbers-restored', { sel: '#hBk' });
      });
    });
    /* phone C is fresh: the code is typed, the copy is found and loaded. Then C changes something, so A is behind the cloud */
    await session(['cloud-code-step-2-found', 'cloud-code-step-3-loaded', 'home-notice-newer-copy-in-cloud', 'settings-cloud-newer-copy'], () => C.profile(srv.url), async q => {
      await L.settings(q); await tap(q, '#vaultHave'); await need(q, '#vaultIn'); await q.type('#vaultIn', code.toLowerCase().replace(/-/g, ' ')); await tap(q, '#vaultUse');
      await panel('cloud-code-step-2-found', async () => { await need(q, '#vaultFlow [data-vf-step="found"]', 12000); await snap(q, 'cloud-code-step-2-found', cloudBox); });
      await panel('cloud-code-step-3-loaded', async () => { await tap(q, '#vaultLoad'); await need(q, '#vaultFlow [data-vf-step="loaded"]', 12000); await snap(q, 'cloud-code-step-3-loaded', cloudBox); await tap(q, '#vaultFlow [data-vf-done]'); });
      const puts = srv.st.puts; await L.rc(q, 900, 'envelope', null, 'Made-up tea'); await until(() => srv.st.puts > puts, 12000);
      if (!(srv.st.puts > puts)) throw new Error('the change on the second phone was not sent to the made-up cloud');
    });
    await panel('home-notice-newer-copy-in-cloud', async () => { await reload(p); await tab(p, 'tab-home'); await need(p, '#hBk [data-vault-load]', 12000); await snap(p, 'home-notice-newer-copy-in-cloud', { sel: '#hBk' }); });
    await panel('settings-cloud-newer-copy', async () => { await L.settings(p); await need(p, '#vaultLoadNewer'); await snap(p, 'settings-cloud-newer-copy', cloudBox); });
  });

  /* ================= 5 and 10: Ask, its Apply and Undo, and import review =================
     Claude is not reachable from here, so the answers are made up: the browser answers the page's own /api/health and /api/ai
     requests itself (request interception), in the shape the site's relay answers. The page code that shows the reply, the Apply card
     and the review of found receipts is the real one. */
  const CHAT = 'Food is 45,000 yen a month in your plan (made-up answer for the screen pack). Lowering it to 40,000 would leave 5,000 more each month.\n\n```mhr\n{"actions":[{"do":"set_line","key":"bill:food","amount":40000}]}\n```';
  const FOUND = n => JSON.stringify({ summary: 'Made-up reading: ' + n + ' purchases found.', receipts: [{ date: '2026-11-06', amount: 1280, category: 'bill:food', note: 'Made-up bakery' }, { date: '2026-11-08', amount: 3450, category: 'envelope', note: 'Made-up bookshop' }, { date: '2026-11-13', amount: 760, category: 'bill:food', note: 'Made-up noodles' }].slice(0, n) });
  await session(['ask-open', 'ask-reply-with-apply', 'ask-applied-with-undo', 'ask-undone', 'import-review-files', 'import-review-photos'], async () => {
    const o = await R.phone({ w: PW, h: PH, dpr: 1, mobile: true, keep: true });
    await o.p.setRequestInterception(true);
    o.p.on('request', r => {
      const u = r.url();
      if (/\/api\/health/.test(u)) return r.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ ai: true, vault: true, invite: false }) });
      if (/\/api\/ai/.test(u)) { let b = {}; try { b = JSON.parse(r.postData() || '{}'); } catch (e) { b = {}; }
        const img = /"type":"image"/.test(r.postData() || '');
        return r.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ text: b.json ? FOUND(img ? 2 : 3) : CHAT, truncated: false }) }); }
      r.continue();
    });
    await o.p.goto(srv.url); await w(1500); await C.skipTour(o.p); return o;
  }, async p => {
    await plan(p);
    /* on a phone the Ask button is inside Help */
    await panel('ask-open', async () => { await tap(p, '#helpBtn'); await tap(p, '#helpAsk'); await need(p, '#askIn'); await w(400); await snap(p, 'ask-open', { sel: '#ask' }); });
    await panel('ask-reply-with-apply', async () => { await p.type('#askIn', 'Can I spend less on food?'); await tap(p, '#askSend'); await need(p, '#askLog .asst-row', 12000); await w(500); await snap(p, 'ask-reply-with-apply', { sel: '#ask' }); });
    const btn = (p, t) => p.evaluate(t => { const b = [...document.querySelectorAll('#askLog button')].reverse().find(b => b.offsetParent && b.innerText.trim().indexOf(t) === 0); if (!b) return false; b.scrollIntoView({ block: 'center' }); b.click(); return true; }, t);
    await panel('ask-applied-with-undo', async () => { if (!(await btn(p, 'Apply'))) throw new Error('no Apply button in the reply'); await w(2600); await snap(p, 'ask-applied-with-undo', { sel: '#ask' }); });
    await panel('ask-undone', async () => { if (!(await btn(p, 'Undo'))) throw new Error('no Undo after Apply'); await w(700); await snap(p, 'ask-undone', { sel: '#ask' }); });
    /* files: a made-up bank CSV is attached in Ask (the paperclip), Send, and the review card lists what was found before anything is added */
    await panel('import-review-files', async () => {
      const csv = path.join(tmp, 'made-up-bank.csv'); fs.writeFileSync(csv, 'date,amount,shop\n2026-11-06,1280,Made-up bakery\n2026-11-08,3450,Made-up bookshop\n2026-11-13,760,Made-up noodles\n');
      await need(p, '#askAttach'); const inp = await p.$('#askFile'); await inp.uploadFile(csv); await w(700);
      await tap(p, '#askSend'); await need(p, '#askLog .rv', 12000); await w(400); await snap(p, 'import-review-files', { sel: '#ask' });
    });
    await p.evaluate(() => document.getElementById('askClose').click()); await w(400);
    /* photos: a made-up picture is chosen in Receipts, Scan receipts; Read, and the same review shows on the Receipts screen */
    await panel('import-review-photos', async () => {
      const png = path.join(tmp, 'made-up-receipt.png'); await p.screenshot({ path: png, clip: { x: 0, y: 0, width: 240, height: 320 } });
      await tab(p, 'tab-receipts'); await need(p, '#scanPick'); const inp = await p.$('#scanPickIn'); await inp.uploadFile(png); await need(p, '#scanRead', 12000);
      await tap(p, '#scanRead'); await need(p, '#scanOut .rv', 12000); await w(400); await snap(p, 'import-review-photos', { sel: '#scanOut' });
    });
  });

  /* ================= 6: the setup tour, every step after the welcome screen =================
     Opened from the made-up server so the welcome screen offers "Enter your recovery code" and the last step offers the cloud copy. */
  const TOUR = ['tour-welcome-recovery-code-box', 'tour-currency', 'tour-your-money', 'tour-monthly-bills', 'tour-rent-or-mortgage', 'tour-food-and-groceries', 'tour-split-the-rest', 'tour-emergency-fund', 'tour-free-to-spend', 'tour-setup-done-cloud-offer', 'tour-cloud-offer-code-shown'];
  await session(TOUR, () => C.profile(srv.url, { tour: true }), async p => {
    await need(p, '#tourNext');
    await panel('tour-welcome-recovery-code-box', async () => { await tap(p, '#tourRestoreBtn'); await need(p, '#tourVaultIn'); await snap(p, 'tour-welcome-recovery-code-box', { sel: '#tour' }); });
    const type = async (sel, v) => { if (await seen(p, sel)) { await p.evaluate(sel => document.querySelector(sel).scrollIntoView({ block: 'center' }), sel); await L.typeIn(p, sel, v); } };
    const slug = t => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const AMT = { 'rent-or-mortgage': 95000, 'food-and-groceries': 45000 };
    let done = false;
    for (let i = 0; i < 16 && !done; i++) {
      await p.evaluate(() => document.getElementById('tourNext').click()); await w(900);
      const title = await p.evaluate(() => { const h = document.querySelector('#tourBody h2, #tourBody h3, #tour h2, #tour h3'); return h ? h.innerText.trim() : ''; });
      let s = slug(title || 'step-' + (i + 1)); done = /^setup-done/.test(s) || !(await seen(p, '#tourNext'));
      if (!(await seen(p, '#tour'))) break;
      /* made-up answers, typed the way a person would */
      if (s === 'currency') { await p.evaluate(() => { const r = [...document.querySelectorAll('#tour input[type=radio]')].find(r => r.value === '¥'); r && r.click(); }); await type('#tourName', 'Momo'); }
      await type('#tourPay', 280000); await type('#tourBank', 412000); await type('#tourAmt', AMT[s] || 12000); await type('#tourGCost', 300000); await type('#tourGSaved', 60000);
      const name = done ? 'tour-setup-done-cloud-offer' : 'tour-' + s;
      await panel(name, async () => { if (done) await need(p, '#tourVaultOn', 6000); await snap(p, name, { sel: '#tour', full: false }); });
    }
    if (!done) throw new Error('the setup tour did not reach "Setup done" in 16 steps');
    await panel('tour-cloud-offer-code-shown', async () => { await tap(p, '#tourVaultOn'); await need(p, '#tourVaultCode #vaultCodeTxt, #tourVaultCode .vault-code, #tourVaultCode b', 12000); await snap(p, 'tour-cloud-offer-code-shown', { sel: '#tourCloud' }); });
  });

  /* ================= 4, 5, 7, 8, 9, 12, 13: Home, a burrow, the editors, Undo, Help, the update notice, the light theme ================= */
  await session(['home-more-open', 'home-check-your-bank', 'home-card-editor', 'burrow-screen', 'burrow-add-money', 'plan-goal-editor', 'two-step-tap-again-remove-goal', 'undo-bar-after-remove-goal', 'undo-notice-after-reload',
    'plan-bill-line-editor', 'receipts-edit-form', 'help-open', 'two-step-tap-again-set-all-to-zero', 'newer-version-ready', 'light-home', 'light-plan', 'light-settings'], () => openFile(), async p => {
    await plan(p);
    await panel('home-more-open', async () => { await tap(p, '#hMoreBtn'); await p.evaluate(() => { const s = document.querySelector('#hMore > summary'); if (s && !document.getElementById('hMore').open) s.click(); }); await w(500); await snap(p, 'home-more-open', { top: true, full: true });
      await p.evaluate(() => { const b = document.getElementById('hMoreBtn'); if (b && b.getAttribute('aria-expanded') === 'true') b.click(); }); await w(400); });
    await panel('home-check-your-bank', async () => { await tab(p, 'tab-home'); await tap(p, '#mpCheck'); await need(p, '#mpBankIn'); await snap(p, 'home-check-your-bank', { sel: '#hMap .mp-now' }); await tap(p, '#mpBankNo'); });
    await panel('home-card-editor', async () => { await tap(p, '#hMap [data-card]'); await need(p, '#mpCardOwed'); await snap(p, 'home-card-editor', { sel: '#hMap .mp-cardf' }); await tap(p, '#mpCardNo'); });
    /* a burrow's own screen: tap the burrow on Home (phone_add.js opens it through a hook; a tap does the same) */
    await panel('burrow-screen', async () => { await tab(p, 'tab-home'); await tap(p, '#hBur .hb-b[data-b]'); await need(p, '#burrowView .bv-add'); await w(1800); await snap(p, 'burrow-screen'); });
    await panel('burrow-add-money', async () => { await p.evaluate(() => document.querySelector('#burrowView .bv-add').click()); await need(p, '#burrowView .bv-go'); await w(600); await snap(p, 'burrow-add-money'); });
    await p.evaluate(() => { const s = document.querySelector('#burrowView .bv-sign'); if (s && document.body.classList.contains('bv-on')) s.click(); }); await w(900);
    /* the goal editor on Plan, then Remove goal once (the "tap again" state), then again (the Undo bar), then a reload (the Undo notice that stays for days) */
    await panel('plan-goal-editor', async () => { await sub(p, 'goals'); await tap(p, '#goalCards [data-gedit]'); await need(p, '#goalCards [data-gdel]'); await snap(p, 'plan-goal-editor', { sel: '#goalCards [data-gdone]', block: 'end' }); });
    await panel('two-step-tap-again-remove-goal', async () => { await tap(p, '#goalCards [data-gdel]'); await snap(p, 'two-step-tap-again-remove-goal', { sel: '#goalCards [data-gdel]' }); });
    await panel('undo-bar-after-remove-goal', async () => { if (!/Tap again/.test(await text(p, '#goalCards [data-gdel]'))) await tap(p, '#goalCards [data-gdel]'); await tap(p, '#goalCards [data-gdel]'); await need(p, '#undoBar'); await snap(p, 'undo-bar-after-remove-goal', { sel: '#undoBar' }); });
    await panel('undo-notice-after-reload', async () => { await reload(p); await need(p, '#undoBar'); await snap(p, 'undo-notice-after-reload', { sel: '#undoBar' }); });
    try { await tap(p, '#undoGo', 3000); } catch (e) { /* no bar: nothing to take back */ }
    await panel('plan-bill-line-editor', async () => { await sub(p, 'month');
      if (!(await seen(p, '#rb-nec [data-edit]'))) await tap(p, '#rt-nec');                 /* open the Monthly bills row */
      if (!(await seen(p, '#rb-nec [data-ldel]'))) await tap(p, '#rb-nec [data-edit]');      /* Rename, remove or add lines */
      await need(p, '#rb-nec [data-ldel]'); await snap(p, 'plan-bill-line-editor', { sel: '#rb-nec', full: true }); await p.evaluate(() => { const b = [...document.querySelectorAll('#rb-nec [data-edit]')].find(b => /Done/.test(b.innerText)); b && b.click(); }); await w(400); });
    await panel('receipts-edit-form', async () => { await tab(p, 'tab-receipts'); await tap(p, '#rcList [data-rcedit]'); await need(p, '#rcCancel'); await snap(p, 'receipts-edit-form', { sel: '#rcForm' }); await tap(p, '#rcCancel'); });
    await panel('help-open', async () => { await tab(p, 'tab-home'); await tap(p, '#helpBtn'); await need(p, '#helpMenu'); await snap(p, 'help-open', { top: true }); await tap(p, '#helpBtn'); });
    await panel('two-step-tap-again-set-all-to-zero', async () => { await L.settings(p); await tap(p, '#blankBtn'); await snap(p, 'two-step-tap-again-set-all-to-zero', { sel: '#blankBtn' }); await w(4300); });
    /* "A newer version is ready" shows when the service worker finds a newer build; there is none here, so the page is told the same way
       the service worker code tells it (the mhr:update event) */
    await panel('newer-version-ready', async () => { await tab(p, 'tab-home'); await p.evaluate(() => dispatchEvent(new Event('mhr:update'))); await need(p, '#upd'); await snap(p, 'newer-version-ready', { sel: '#upd' }); await p.evaluate(() => { document.getElementById('upd').hidden = true; }); });
    /* the light theme: Settings, Look, Light */
    await panel(['light-home', 'light-plan', 'light-settings'], async () => {
      await L.settings(p); await tap(p, '#themeSeg [data-theme-set="light"]');
      await tab(p, 'tab-home'); await snap(p, 'light-home', { top: true, full: true });
      await sub(p, 'month'); await snap(p, 'light-plan', { top: true, full: true });
      await L.settings(p); await snap(p, 'light-settings', { top: true, full: true });
    });
  });

  /* ================= 11: the month-end question =================
     The page asks where last month's unspent Free to spend goes once a new month has begun. The clock of this one browser is set to
     3 December 2026, so November (30,000 planned, 10,000 logged) is last month. */
  await session(['month-end-question', 'month-end-answered-with-undo'], () => openFile({ before: p => p.evaluateOnNewDocument(() => { const real = Date, fixed = new real('2026-12-03T10:00:00').getTime(), start = real.now();
    class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; }) }), async p => {
    await plan(p, { receipts: [['qm1', '2026-11-03', 'envelope', 3000, 'Made-up cafe'], ['qm2', '2026-11-09', 'envelope', 2500, 'Made-up cinema'], ['qm3', '2026-11-15', 'envelope', 2000, 'Made-up bus'], ['qm4', '2026-11-21', 'envelope', 2500, 'Made-up lunch']] });
    await panel('month-end-question', async () => { await sub(p, 'month'); await tab(p, 'tab-home'); await need(p, '#hNext [data-sweepbank]'); await snap(p, 'month-end-question', { sel: '#hNext' }); });
    await panel('month-end-answered-with-undo', async () => { await tap(p, '#hNext [data-sweepbank]'); await need(p, '#hNext [data-sweepundo]'); await snap(p, 'month-end-answered-with-undo', { sel: '#hNext' }); });
  });

  /* ================= 14: desktop width, 1280x800 ================= */
  await session(['desktop-home', 'desktop-plan', 'desktop-receipts', 'desktop-settings'], () => openFile({ w: 1280, h: 800, mobile: false }), async p => {
    await plan(p); const o = { w: 1280, top: true, full: true };
    await panel('desktop-home', async () => { await tab(p, 'tab-home'); await snap(p, 'desktop-home', o); });
    await panel('desktop-plan', async () => { await sub(p, 'month'); await snap(p, 'desktop-plan', o); });
    await panel('desktop-receipts', async () => { await tab(p, 'tab-receipts'); await snap(p, 'desktop-receipts', o); });
    await panel('desktop-settings', async () => { await L.settings(p); await snap(p, 'desktop-settings', o); });
  });

  srv.close(); try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) { /* a temp folder */ }
  const missed = EXPECT.filter(n => !got[n]).map(n => `NOT CAPTURED ${n}: ${why[n] || 'not reached'}`);
  missed.forEach(m => console.log(m));
  return { index: EXPECT.filter(n => got[n]).map(n => got[n]), missed, errs };
};
