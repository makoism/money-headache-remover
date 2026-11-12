// Purpose and progress (v34.0): the reason behind a goal travels everywhere, progress reads as motion, and last month's unspent
// play money can go toward a goal in one undoable tap. Runs on a faked clock (December 3rd) so November is "last month".
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
  ok(/of ¥300,000, \+¥[\d,]+ a month\. Full/.test(seenDone), 'Setup done says what each month adds and when it is full');
  ok(/What is left of play money at month end can go toward a goal/.test(seenDone), 'Setup done mentions where leftover play money can go');
  // ---- Home hero
  let hero = await txt(p, '#hHero');
  ok(hero.includes(WHY), 'the hero headline is the reason: ' + hero.slice(0, 120));
  ok(/\+¥[\d,]+ this month\. ¥[\d,]+ to go\./.test(hero), 'the hero says what this month adds and what is to go');
  ok(!/covered/.test(hero), 'no generated "covered" phrase when a reason is given');
  const play = await txt(p, '#hSpend');
  ok(/What is left at month end can go toward Japan trip/.test(play), 'the play money card says where what is left can go: ' + play.slice(-80));
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
  ok(/Long-Term Savings for Spending Japan trip/.test(legend), 'the Month legend names the goal under its jar: ' + legend.slice(0, 90));
  await tab(p, 'months'); await w(400);
  const marks = await p.$$eval('#monthTable .mt-g', els => els.map(e => e.textContent.trim()));
  ok(marks.length === 1 && /Japan trip full/.test(marks[0]), 'All months marks the month the goal fills: ' + JSON.stringify(marks));
  const fullRow = await p.$eval('#monthTable .mt-g', e => e.closest('tr').dataset.ym);
  const hero2 = await txt(p, '#hHero');
  // ---- the reason reaches the assistant's picture
  const pic = await p.evaluate(() => (window.__pix && typeof asstPicture === 'function') ? null : null);
  // ---- the sweep: November logged with 4 receipts under play money, some left
  await tab(p, 'receipts'); await w(300);
  for (const [d, a] of [['2026-11-04', 4000], ['2026-11-11', 5000], ['2026-11-18', 6000], ['2026-11-25', 4000]]) {
    await p.$eval('#rcDate', (e, v) => { e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); }, d);
    await p.$eval('#rcAmt', e => { e.value = ''; }); await p.type('#rcAmt', String(a)); await p.select('#rcCat', 'envelope'); await p.click('#rcSave'); await w(250);
  }
  await tab(p, 'home'); await w(600);
  let c = await nextCard(p);
  ok(!c.hid && /November: ¥6,000 of play money unspent/.test(c.t), 'Home offers last month\'s unspent play money: ' + c.t.slice(0, 90));
  ok(/Put it toward Japan trip/.test(c.t) && /Keep as play/.test(c.t), 'with one goal the offer names it, and Keep as play is there');
  const reachedBefore = fullRow;
  const before = await p.evaluate(() => ({ nov: document.querySelector('#hNext').textContent }));
  /* the usual deposit: with one goal it is the whole Long-Term Savings jar (25,100 for this pay), so it is read, not assumed */
  const depBase = await p.evaluate(() => { const { S, calcAll } = __t; return calcAll(S).byYm['2026-11'].g[S.plan.goals[0].id].actual; });
  await p.click('#hNext [data-sweep]'); await w(350);
  const cheer = await txt(p, '#cheer'); await w(600);
  c = await nextCard(p);
  ok(/¥6,000 put toward Japan trip/.test(c.t) && /Undo/.test(c.t) && /to go|sooner|is full/.test(c.t), 'after the tap the card says what moved and where that leaves the goal, with Undo: ' + c.t.slice(0, 120));
  ok(/Japan trip: \+¥6,000/.test(cheer), 'the cheer names the goal and the amount: ' + cheer);
  // the model: November play down, the goal up, the next month untouched
  const chk = await p.evaluate(() => { const { S, calcAll } = __t; const C2 = calcAll(S), nov = C2.byYm['2026-11'], dec = C2.byYm['2026-12'], g = S.plan.goals[0]; return { play: nov.jar.play, dep: nov.g[g.id].actual, decPlay: dec.jar.play, out: nov.pool.out, sweep: S.ui.sweep }; });
  ok(chk.play === 25000 - 6000, 'November play money is 6,000 lower: ' + chk.play);
  ok(chk.dep === depBase + 6000, 'November deposit into the goal is 6,000 higher: ' + chk.dep + ' (base ' + depBase + ')');
  ok(chk.decPlay === 25000, 'December play money is untouched');
  ok(chk.sweep && chk.sweep['2026-11'] && chk.sweep['2026-11'].amt === 6000, 'the month is marked as answered');
  await tab(p, 'receipts'); await w(300);
  ok(/Play money: ¥19,000 planned, ¥19,000 spent, ¥0 left/.test(await txt(p, '#rcSum')) || /¥19,000/.test(await txt(p, '#rcSum')), 'Receipts for November shows the lower play money');
  await tab(p, 'home'); await w(300);
  // badge
  await w(1200);
  const badges = await p.evaluate(() => Object.keys(__t.S.ui.bd || {}));
  ok(badges.includes('topup'), 'the Top-up badge is earned: ' + badges.join(','));
  // undo
  await p.click('#hNext [data-sweepundo]'); await w(700);
  const chk2 = await p.evaluate(() => { const { S, calcAll } = __t; const C2 = calcAll(S), nov = C2.byYm['2026-11'], g = S.plan.goals[0]; return { play: nov.jar.play, dep: nov.g[g.id].actual, sweep: S.ui.sweep }; });
  ok(chk2.play === 25000 && chk2.dep === depBase, 'Undo puts November back: ' + JSON.stringify([chk2.play, chk2.dep]));
  ok(!chk2.sweep, 'Undo clears the mark, so the offer can come back');
  c = await nextCard(p);
  ok(!c.hid && /November: ¥6,000 of play money unspent/.test(c.t), 'the offer is back after Undo');
  // keep as play
  await p.click('#hNext [data-sweephide]'); await w(500);
  c = await nextCard(p);
  ok(!/unspent/.test(c.t), 'Keep as play puts the offer away: ' + c.t.slice(0, 60));
  const kept = await p.evaluate(() => __t.S.ui.sweep && __t.S.ui.sweep['2026-11']);
  ok(kept && kept.hide === true, 'kept as play is remembered');
  // reload keeps the answer
  await p.reload({ waitUntil: 'load' }); await w(900); await coach(p);
  c = await nextCard(p);
  ok(!/unspent/.test(c.t), 'after a reload the offer stays away');
  // ---- a second goal: the offer gets a picker
  await p.evaluate(() => { const { S, addGoal, updateGoal, persist, restructure } = __t; S.ui.sweep = {}; const id = addGoal(S, 'Deposit'); updateGoal(S, id, { target: 500000, start: 0, why: 'Our own place' }); persist(); restructure(); }); await w(500);
  c = await nextCard(p);
  ok(/Put it toward/.test(c.t) && !!(await p.$('#hNext [data-sweepgoal]')), 'with two goals the offer has a picker: ' + c.t.slice(0, 80));
  const opts = await p.$$eval('#hNext [data-sweepgoal] option', o => o.map(x => x.textContent));
  ok(opts.length === 2 && opts.includes('Deposit'), 'the picker lists both goals');
  await p.select('#hNext [data-sweepgoal]', await p.$eval('#hNext [data-sweepgoal] option:nth-child(2)', o => o.value));
  await p.click('#hNext [data-sweep]'); await w(800);
  const dep2 = await p.evaluate(() => { const { S, calcAll } = __t; const g = S.plan.goals.find(x => x.name === 'Deposit'), T = JSON.parse(JSON.stringify(S)); delete T.once['2026-11']['goal:' + g.id]; return calcAll(S).byYm['2026-11'].g[g.id].actual - calcAll(T).byYm['2026-11'].g[g.id].actual; });
  ok(dep2 === 6000, 'the picked goal gets the money, on top of its usual deposit: +' + dep2);
  c = await nextCard(p);
  ok(/put toward Deposit/.test(c.t) && /Our own place/.test(c.t), 'the confirmation carries the reason: ' + c.t.slice(0, 120));
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
