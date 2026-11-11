const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--disable-features=BackForwardCache,ProactivelySwapBrowsingInstance', '--disable-site-isolation-trials'] });
  const p = await b.newPage(); const errs = [];
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_/.test(m.text())) errs.push(m.text()); });
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  await p.setViewport({ width: 1100, height: 900 });
  await p.goto('file:///home/claude/work/money-map-team.html#2026-11', { waitUntil: 'load' });
  const w = ms => new Promise(r => setTimeout(r, ms));
  const frozen = json => p.evaluate(j => { const orig = Storage.prototype.setItem; Storage.prototype.setItem = function () {}; (localStorage.clear(), indexedDB.deleteDatabase('money-map-safe')); if (j !== null) orig.call(localStorage, 'money-map-template-v2', j); }, json);
  const fresh = async () => { await frozen(null); await p.reload({ waitUntil: 'load' }); await w(450); };
  const reload = async () => { await w(1000); await p.reload({ waitUntil: 'load' }); await w(550); };
  const q = async s => p.$eval(s, e => e.textContent.trim()).catch(() => 'MISSING:' + s);
  const val = async s => p.$eval(s, e => e.value).catch(() => 'MISSING:' + s);
  const ok = (name, cond, extra) => { console.log(cond ? 'PASS' : 'FAIL', name, cond ? '' : (extra || '')); if (!cond) process.exitCode = 1; };
  const tourText = () => p.$eval('#tourBody', e => e.innerText.replace(/\s+/g, ' '));
  const title = () => q('#tourTitle'), part = () => q('#tourPart');
  const hidden = s => p.$eval(s, e => e.hidden);
  const next = async () => { await p.click('#tourNext'); await w(200); };
  const stored = () => p.evaluate(() => JSON.parse(localStorage.getItem('money-map-template-v2') || '{}'));
  const toPay = async () => { for (let i = 0; i < 6; i++) await next(); };
  const typeAt = async (sel, v) => { await p.$eval(sel, e => { e.value = ''; e.focus(); }); if (v !== '') await p.type(sel, String(v)); };
  const tabClick = async t => { await p.evaluate(x => document.querySelector(`[data-tab="${x}"]`).click(), t); await w(300); };
  const closeTabTour = async () => { if (!(await hidden('#tour')) && (await part()).includes(' tour · ')) { await p.click('#tourSkip'); await w(250); } };
  const walkAll = async (fill, seenParts, texts) => {
    for (let g = 0; g < 50; g++) {
      const t = await title(); if (seenParts) { const pt = (await part()).split(' · ')[0]; if (seenParts[seenParts.length - 1] !== pt) seenParts.push(pt); }
      if (texts) texts.push(await tourText());
      if (fill) await fill(t);
      const nx = await q('#tourNext'); await p.click('#tourNext'); await w(200);
      if (nx === 'View month' || nx === 'Done' || nx === 'Go to bills') break;
    }
    await w(500);
  };
  const persona = async t => {
    if (await p.$('#tourPay')) await typeAt('#tourPay', 30000);
    else if (await p.$('#tourExtra')) await typeAt('#tourExtra', 5000);
    else if (await p.$('#tourBank')) await typeAt('#tourBank', 20000);
    else if (await p.$('#tourAmt')) { const m = { 'What is your rent or mortgage?': 9000, 'What do utilities cost?': 1500, 'What do you spend on food and groceries?': 6000, 'What does your internet cost?': 1000, 'What does your phone cost?': 800, 'What does getting around cost?': 2000 }; await typeAt('#tourAmt', m[t] !== undefined ? m[t] : ''); }
    else if (t === 'What are you saving for?') await p.click('input[name=tourGoalPick][value=travel]');
    else if (await p.$('#tourGCost')) { await typeAt('#tourGName', 'Japan trip'); await typeAt('#tourGCost', 30000); await typeAt('#tourGSaved', 5000); await p.$eval('#tourGDue', e => { e.value = '2027-09-01'; e.dispatchEvent(new Event('change', { bubbles: true })); }); }
    else if (await p.$('input[name=tourEm]')) await typeAt('#tourGSaved', 20000);
  };

  /* ===== 1. the shape of the tour ===== */
  await fresh();
  ok('first visit opens the tour on the welcome', !(await hidden('#tour')) && (await title()) === 'Hi, welcome in.');
  ok('one progress segment per part: eight', (await p.$$eval('#tourDots i', e => e.length)) === 8);
  ok('first screen says "Skip the tour", not "Finish later"', (await q('#tourSkip')) === 'Skip the tour' && await hidden('#tourPartSkip'));
  await toPay();
  ok('on the paycheck screen the link says "Finish later" and "Skip this part" shows', (await title()) === 'Put in your first paycheck' && (await q('#tourSkip')) === 'Finish later' && !(await hidden('#tourPartSkip')));
  ok('the paycheck box is focused', await p.evaluate(() => document.activeElement.id === 'tourPay'));

  /* ===== 2. Enter moves on, Back keeps what was typed ===== */
  await p.type('#tourPay', '30000'); await p.keyboard.press('Enter'); await w(250);
  ok('Enter moves to the next question', (await title()) === 'Does anything else come in each month?');
  await p.click('#tourBack'); await w(250);
  ok('Back returns to the paycheck with the number still there', (await title()) === 'Put in your first paycheck' && (await val('#tourPay')) === '30000');

  /* ===== 3. reload in the middle of the first visit picks up where it stopped ===== */
  await next(); await next(); await next();
  ok('now on the lowest-balance screen', (await title()).startsWith('What is the lowest balance'));
  ok('...which suggests a tenth of the pay', (await val('#tourFloor')) === '3000');
  await reload();
  ok('after a reload the tour is back on the same screen', !(await hidden('#tour')) && (await title()).startsWith('What is the lowest balance'));
  ok('...with the paycheck kept', (await stored()).steps.a[0].v === 30000);

  /* ===== 4. Finish later, then pick it up from the first page ===== */
  await next();
  ok('bills: the list of what you pay each month', (await title()) === 'Which of these do you pay every month?');
  await next();
  await typeAt('#tourAmt', 9000);
  ok('rent screen', (await title()) === 'What is your rent or mortgage?');
  await p.click('#tourSkip'); await w(300);
  ok('Finish later closes the tour', await hidden('#tour'));
  ok('...and the first page now offers to continue', (await q('#tourOpen2')).length > 0 && !(await p.$eval('#tourOpen2', e => e.closest('[hidden]') !== null)));
  await p.click('#tourOpen2'); await w(300);
  ok('"Guide me" resumes on the rent screen with the amount kept', (await title()) === 'What is your rent or mortgage?' && (await val('#tourAmt')) === '9000');

  /* ===== 5. skipping a part ===== */
  await p.click('#tourPartSkip'); await w(250);
  ok('Skip this part lands on the first screen of the next part', (await title()) === 'Give your money a purpose before you spend it' && (await part()).startsWith('Where it goes'));
  await p.click('#tourPartSkip'); await w(250);
  ok('...and again moves on to the goals', (await title()) === 'Money is a tool, not the goal' && (await part()).startsWith('Your goals · 1'));
  await next();
  ok('the goal part has no total until you pick what you are saving for', (await title()) === 'What are you saving for?' && (await part()) === 'Your goals · 2');
  await p.click('#tourSkip'); await w(300);

  /* ===== 6. a full run with real numbers ===== */
  await fresh();
  const parts = [], texts = [];
  await walkAll(persona, parts, texts);
  ok('the parts come in the planned order', JSON.stringify(parts) === JSON.stringify(['Welcome', 'The mindset', 'Your money', 'Your bills', 'Where it goes', 'Your goals', 'Your spending money', 'Keeping it up']), JSON.stringify(parts));
  ok('no em dashes on any screen', texts.every(t => !t.includes('—')));
  ok('the tour closed on the first page', await hidden('#tour'));
  const st = await stored();
  ok('pay, other income and bank are saved', st.steps.a[0].v === 30000 && st.steps.b[0].v === 5000 && st.cfg.bankStart === 20000);
  ok('the lowest balance is saved', st.cfg.minBank === 3500, String(st.cfg.minBank));
  const lineAmt = id => { const l = st.plan.lines.find(x => x.id === id); return st.steps[l.key] ? st.steps[l.key][0].v : null; };
  ok('each bill landed in its line', lineAmt('rent') === 9000 && lineAmt('util') === 1500 && lineAmt('food') === 6000 && lineAmt('net') === 1000 && lineAmt('phone') === 800 && lineAmt('gas') === 2000);
  ok('bills that were not ticked are zero', lineAmt('ins') === 0 && lineAmt('loan') === 0);
  const necSum = 9000 + 1500 + 6000 + 1000 + 800 + 2000;
  const em = st.plan.goals.find(g => g.emergency), trip = st.plan.goals.find(g => g.name === 'Japan trip');
  ok('the emergency fund is three months of those bills', em && em.target === 3 * necSum && em.start === 20000, JSON.stringify(em));
  ok('the trip has its cost, savings and date', trip && trip.target === 30000 && trip.start === 5000 && trip.due === '2027-09-01', JSON.stringify(trip));
  ok('only the goals picked exist', st.plan.goals.length === 2);
  ok('the setup is marked complete', st.ui.setup === true && st.ui.done.pay && st.ui.done.bills && st.ui.done.goals && st.ui.gset === true);
  const aimSum = Object.values(st.cfg.aims || {}).reduce((a, c) => a + c, 0);
  ok('the jar percentages add to 100', Math.abs(aimSum - 1) < 0.001, String(aimSum));
  ok('first page: the big number is a spending money amount', /^₱[\d,]+$/.test(await q('#heroNum')) && (await q('#heroNum')) !== '₱0');
  ok('first page: the verdict is not an overspend', !/over|short/i.test(await q('#chip')), await q('#chip'));
  ok('first page: the start card says one step is left', (await q('#startTitle')).startsWith('One step left'), await q('#startTitle'));
  await reload();
  ok('after a reload the tour stays closed and the numbers stay', (await hidden('#tour')) && (await val('#h-a')) === '₱30,000');

  /* ===== 7. a short tour of each tab, the first time ===== */
  await tabClick('goals');
  ok('first time on Goals: a tour opens', !(await hidden('#tour')) && (await part()) === 'Goals tour · 1 of 3' && (await title()) === 'A goal is something with a price');
  ok('...with "Skip" and no "Skip this part"', (await q('#tourSkip')) === 'Skip' && await hidden('#tourPartSkip'));
  await next(); await next();
  ok('the last one says "Got it"', (await q('#tourNext')) === 'Got it' && (await title()) === 'What the sliders do');
  await next();
  ok('Got it closes it', await hidden('#tour'));
  await tabClick('month'); await tabClick('goals');
  ok('second time on Goals: no tour', await hidden('#tour'));
  await tabClick('months');
  ok('first time on All months: its own tour of two screens', !(await hidden('#tour')) && (await part()).startsWith('All months tour · 1 of 2'));
  await p.keyboard.press('Escape'); await w(900);
  ok('Escape closes it and counts as seen', await hidden('#tour') && (await stored()).ui.seen.months === true);
  await tabClick('goals');
  await p.focus('[data-tab="goals"]'); await p.keyboard.press('ArrowRight'); await w(350);
  ok('arrow keys move to the next tab without a tour', await hidden('#tour') && (await p.$eval('[data-tab="receipts"]', e => e.getAttribute('aria-selected'))) === 'true');
  await tabClick('basics');
  ok('clicking an unseen tab does open its tour', !(await hidden('#tour')) && (await part()).startsWith('Basics tour'));
  await closeTabTour();
  await tabClick('receipts'); await closeTabTour();
  await p.click('#helpBtn'); await w(150); await p.click('#helpTab'); await w(300);
  ok('Help, "Show me around this tab" replays the tour for the tab you are on', !(await hidden('#tour')) && (await part()).startsWith('Receipts tour'));
  await closeTabTour();
  const tabTexts = [];
  for (const t of ['month', 'months', 'goals', 'receipts', 'basics']) {
    await tabClick(t); await p.click('#helpBtn'); await w(120); await p.click('#helpTab'); await w(250);
    for (let g = 0; g < 8; g++) { tabTexts.push(await tourText()); const nx = await q('#tourNext'); await p.click('#tourNext'); await w(150); if (nx === 'Got it') break; }
  }
  ok('every tab tour reads cleanly with no em dashes', tabTexts.length >= 12 && tabTexts.every(t => !t.includes('—')), String(tabTexts.length));
  ok('"Walk me through setup" from Help opens at the paycheck, with the number kept', await (async () => { await p.click('#helpBtn'); await w(120); await p.click('#helpSetup'); await w(300); return (await title()) === 'Put in your first paycheck' && (await val('#tourPay')) === '30000'; })());
  await p.click('#tourSkip'); await w(250);
  ok('no page errors', errs.length === 0, errs.join(' | '));
  await b.close();
})();
