// Purpose and progress (v34.0): the reason behind a goal travels everywhere and progress reads as motion. (The v34 top-up part was
// retired 2026-11-18; see the note in the middle.) Runs on a faked clock (December 3rd) so November is "last month".
const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const { w, P, runTour } = require('/tmp/v22/lib.js');
let pass = 0, fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); c ? pass++ : fail++; };
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
async function open(b, iso, keep) {
  const p = await b.newPage(); const errs = []; await p.setViewport({ width: 390, height: 844 });
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await p.evaluateOnNewDocument((iso, keep) => {
    try { if (!keep && !sessionStorage.getItem('__keep')) { localStorage.clear(); indexedDB.deleteDatabase('money-map-safe'); } sessionStorage.setItem('__keep', '1'); } catch (e) {}
    const real = Date, fixed = new real(iso).getTime(), start = real.now();
    class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } }
    window.Date = D;
  }, iso, !!keep);
  await p.goto('file://' + PAGE + '?sfxtest&m=' + Math.random() + '#2026-12', { waitUntil: 'load' }); await w(800);
  return { p, errs };
}
const coach = async p => { for (let i = 0; i < 12; i++) { const vis = await p.evaluate(() => { const c = document.querySelector('#co'); return !!c && !c.hidden && c.getBoundingClientRect().width > 0; }); if (!vis) break; await p.click('#coN').catch(() => {}); await w(150); } };
const txt = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); return e ? e.innerText.replace(/\s+/g, ' ').trim() : null; }, sel);
const nextCard = p => p.evaluate(() => { const e = document.querySelector('#hNext'); return { hid: e.hidden, t: e.textContent.replace(/\s+/g, ' ') }; });
const tab = (p, t) => p.evaluate(t => (document.querySelector(`[data-tab="${t}"]`) || document.querySelector(`[data-tab-go="${t}"]`)).click(), t);
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  let { p, errs } = await open(b, '2026-12-03T10:00:00');
  // ---- setup with a reason typed on the trip screen
  const WHY = 'A week in Hokkaido with Mum';
  let seenDone = '';
  await runTour(p, P.a, async () => {
    const t = await p.$eval('#tourTitle', e => e.textContent);
    if (t === 'Trip' && await p.$('#tourGWhy')) { await p.type('#tourGWhy', WHY); }
    if (/Setup done/.test(t)) seenDone = await txt(p, '#tour');
  });
  await w(1200); await coach(p);
  ok(/Main goal Japan trip A week in Hokkaido with Mum/.test(seenDone), 'Setup done leads with the goal and the reason: ' + seenDone.slice(0, 160));
  ok(/of ¥300,000 so far, and your plan adds ¥[\d,]+ a month\. Full/.test(seenDone), 'Setup done says what each month adds and when it is full');
  /* RETIRED 2026-11-18: 'Setup done mentions where leftover play money can go' described the v34 top-up; since 38.30 the month end asks instead (wording, not numbers or data) */
  // ---- Home hero
  let hero = await txt(p, '#hHero');
  ok(hero.includes(WHY), 'the hero headline is the reason: ' + hero.slice(0, 120));
  ok(/\+¥[\d,]+ this month\. ¥[\d,]+ to go\./.test(hero), 'the hero says what this month adds and what is to go');
  ok(!/covered/.test(hero), 'no generated "covered" phrase when a reason is given');
  const play = await txt(p, '#hSpend');
  ok(/What's left at month end can go toward Japan trip/.test(play), 'the play money card says where what is left can go: ' + play.slice(-80));
  // ---- Home goals list carries the reason
  const list = await txt(p, '#hGoals');
  ok(list.includes(WHY), 'the Home goals list shows the reason');
  // ---- Goals tab card and editor
  await tab(p, 'goals'); await w(400);
  ok((await txt(p, '#goalCards')).includes(WHY), 'the Goals tab card shows the reason');
  await p.click('[data-gedit]'); await w(300);
  const whyIn = await p.$('[data-g="why"]'); ok(!!whyIn, 'the goal editor has a Why field');
  await p.$eval('[data-g="why"]', e => { e.value = ''; }); await p.type('[data-g="why"]', 'Snow, onsen, Mum'); await p.$eval('[data-g="why"]', e => e.dispatchEvent(new Event('change', { bubbles: true }))); await w(400);
  ok((await txt(p, '#goalCards')).includes('Snow, onsen, Mum'), 'editing the reason updates the card');
  await p.click('[data-gdone]'); await w(300);
  await tab(p, 'home'); await w(400);
  ok((await txt(p, '#hHero')).includes('Snow, onsen, Mum'), 'the hero follows the edited reason');
  // ---- Month legend and All months marks
  await tab(p, 'month'); await w(400);
  const legend = await txt(p, '#legend');
  ok(/Goals Japan trip/.test(legend) /* 38.29 words */, 'the Month legend names the goal under its jar: ' + legend.slice(0, 90));
  await tab(p, 'months'); await w(400);
  const marks = await p.$$eval('#monthTable .mt-g', els => els.map(e => e.textContent.trim()));
  ok(marks.length === 1 && /Japan trip full/.test(marks[0]), 'All months marks the month the goal fills: ' + JSON.stringify(marks));
  const fullRow = await p.$eval('#monthTable .mt-g', e => e.closest('tr').dataset.ym);
  const hero2 = await txt(p, '#hHero');
  // ---- the reason reaches the assistant's picture
  const pic = await p.evaluate(() => (window.__pix && typeof asstPicture === 'function') ? null : null);
  /* RETIRED 2026-11-18 (Mako's process change: steps 1 and 2 time-boxed): the v34 top-up checks that stood here ("Home offers last month's
     unspent play money", "Keep as play", the plan lines lowered and the goal deposit raised, Undo, the two-goal picker). 38.30 replaced that
     design with the month-end question stored as an answer marker (the plan is never rewritten, no "Keep as play"), so these checks tested
     behaviour that no longer exists. The replacement is guarded by tests/qc/leftover_choice, leftover_thin, leftover_stale, leftover_cents
     and leftover_reload. The second goal and its reason are still added here for the checks below. */
  await p.evaluate(() => { const { S, addGoal, updateGoal, persist, restructure } = __t; const id = addGoal(S, 'Deposit'); updateGoal(S, id, { target: 500000, start: 0, why: 'Our own place' }); persist(); restructure(); });
  await w(400);
  // ---- the assistant's picture carries the reason
  const picture = await p.evaluate(() => __t.asstPicture());
  ok(/for: Our own place/.test(picture) && /for: Snow, onsen, Mum/.test(picture), 'the assistant sees each reason');
  // ---- the add-goal wizard asks for the reason
  await p.evaluate(() => __t.S.plan.goals.length < 6 && document.querySelector('[data-gw]') && document.querySelector('[data-gw]').click()); await w(400);
  const gw = await p.$('#gwWhy'); ok(!!gw, 'the add-goal wizard has a Why field');
  if (gw) { await p.click('#gw [data-kind="buy"]'); await p.type('#gwWhy', 'A bike for the commute'); await p.click('#gwNext'); await w(300); await p.type('#gwCost', '60000'); await p.click('#gwNext'); await w(300); await p.click('#gwNext'); await w(900); }
  const bike = await p.evaluate(() => (__t.S.plan.goals.find(g => g.why === 'A bike for the commute') || {}).name);
  ok(!!bike, 'the wizard saves the reason with the new goal: ' + bike);
  // ---- a saved copy keeps the reasons after a reload
  await p.reload({ waitUntil: 'load' }); await w(900);
  const whys = await p.evaluate(() => __t.S.plan.goals.map(g => g.why || ''));
  ok(whys.includes('Snow, onsen, Mum') && whys.includes('Our own place') && whys.includes('A bike for the commute'), 'reasons survive a reload: ' + whys.join(' | '));
  ok(!errs.length, 'no page errors ' + JSON.stringify(errs));
  await b.close();
  console.log(`PURPOSE: ${pass} pass, ${fail} fail`); process.exit(fail ? 1 : 0);
})().catch(e => { console.log('CRASH', e.stack); process.exit(2); });
