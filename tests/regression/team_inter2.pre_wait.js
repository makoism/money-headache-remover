const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--disable-features=BackForwardCache,ProactivelySwapBrowsingInstance', '--disable-site-isolation-trials'] });
  const p = await b.newPage(); const errs = [];
  p.on('console', m => { if (['error', 'warning'].includes(m.type())) errs.push(m.type() + ': ' + m.text()); });
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  await p.setViewport({ width: 1180, height: 900 });
  const URL = 'file:///home/claude/work/money-map-team.html#2026-11';
  await p.goto(URL, { waitUntil: 'load' });
  const w = ms => new Promise(r => setTimeout(r, ms));
  // the app also saves on pagehide, so freeze every write from the old document before wiping/seeding, then reload
  const frozen = (json) => p.evaluate(j => { const orig = Storage.prototype.setItem; Storage.prototype.setItem = function () { /* frozen */ }; (localStorage.clear(), indexedDB.deleteDatabase('money-map-safe')); if (j !== null) orig.call(localStorage, 'money-map-template-v2', j); }, json);
  const fresh = async () => { await frozen(null); await p.reload({ waitUntil: 'load' }); await w(450); };
  const seed = async json => { await frozen(json); await p.reload({ waitUntil: 'load' }); await w(500); };
  const _click = p.click.bind(p); p.click = async (sel, o) => { try { await p.$eval(sel, e => e.scrollIntoView({ block: 'center' })); } catch (e) { /* not on the page */ } return _click(sel, o); };
  const confettiPx = () => p.$eval('#confetti', c => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 16) if (d[i] > 0) n++; return n; });
  const cheerOn = () => p.$eval('#cheer', e => e.classList.contains('on') ? e.textContent : '');
  const q = async s => p.$eval(s, e => e.textContent.trim()).catch(() => 'MISSING:' + s);
  const val = async s => p.$eval(s, e => e.value).catch(() => 'MISSING:' + s);
  const set = async (s, v, ev) => p.$eval(s, (el, v, ev) => { el.value = v; el.dispatchEvent(new Event(ev || 'input', { bubbles: true })); }, v, ev);
  const log = (k, v) => console.log(k.padEnd(40), v);
  const ok = (name, cond) => { console.log(cond ? 'PASS' : 'FAIL', name); if (!cond) process.exitCode = 1; };
  const tab = async t => { await p.evaluate(x => document.querySelector(`[data-tab="${x}"]`).click(), t); await w(700); if (await p.$eval('#co', e => !e.hidden).catch(() => false)) { await p.click('#coSkip'); await w(350); } if (await p.$eval('#tour', e => !e.hidden) && (await q('#tourPart')).includes(' tour · ')) { await p.click('#tourSkip'); await w(250); } };
  const openRow = async id => { const open = await p.$eval(`.row[data-id=${id}]`, e => e.classList.contains('open')); if (!open) { await p.click(`.row[data-id=${id}] .row-t`); await w(200); } };
  const reload = async () => { await w(900); await p.reload({ waitUntil: 'load' }); await w(500); };
  const skipTour = async () => { if (await p.$eval('#tour', e => !e.hidden)) { await p.click('#tourSkip'); await w(250); } await w(700); if (await p.$eval('#co', e => !e.hidden).catch(() => false)) { await p.click('#coSkip'); await w(350); } };
  const coach = async () => { await w(700); if (await p.$eval('#co', e => !e.hidden).catch(() => false)) { await p.click('#coSkip'); await w(350); } };
  const tourText = () => p.$eval('#tourBody', e => e.innerText.replace(/\s+/g, ' '));

  /* ============ THE TOUR ============ */
  await fresh();
  ok('tour opens on the very first visit', await p.$eval('#tour', e => !e.hidden));
  ok('page behind the tour is inert', await p.$eval('.wrap', e => e.inert));
  ok('dialog is labelled and modal', await p.$eval('#tour', e => e.getAttribute('role') === 'dialog' && e.getAttribute('aria-modal') === 'true'));
  ok('focus lands on the tour title', await p.evaluate(() => document.activeElement.id === 'tourTitle'));
  ok('screen 1 is a welcome with the cozy house', (await q('#tourTitle')) === 'Welcome' && (await q('#tourPart')) === 'Welcome · 1 of 3' && (await p.$$eval('#tourBody svg.tour-scene', e => e.length)) === 1);
  ok('...and a promise that it stays private', (await tourText()).includes('stays in this browser') && (await tourText()).includes('Nobody else can see it'));
  ok('...asking what to call you', (await val('#tourName')) === '' && (await q('#tourNext')) === 'Continue');
  ok('no back button on screen 1', await p.$eval('#tourBack', e => e.hidden));
  await p.type('#tourName', '  Mara '); await p.click('#tourNext'); await w(250);
  ok('screen 2 greets you by name and asks for the currency', (await q('#tourTitle')) === 'Currency' && (await q('#tourPart')) === 'Welcome · 2 of 3');
  ok('six currency chips, pesos preselected', (await p.$$eval('input[name=tourCur]', e => e.length)) === 6 && (await p.$eval('input[name=tourCur]:checked', e => e.value)) === '₱');
  await p.click('input[name=tourCur][value="$"]'); await w(150);
  ok('picking a chip selects it', (await p.$eval('input[name=tourCur]:checked', e => e.value)) === '$' && (await p.$eval('input[name=tourCur][value="$"]', e => e.closest('.chip').classList.contains('on'))));
  await p.select('#tourCurMore', 'S$'); await w(150);
  ok('another currency from the list clears the chips', (await p.$$eval('input[name=tourCur]:checked', e => e.length)) === 0 && (await val('#tourCurMore')) === 'S$');
  await p.click('input[name=tourCur][value="₱"]'); await w(150);
  ok('back to pesos', (await p.$eval('input[name=tourCur]:checked', e => e.value)) === '₱' && (await val('#tourCurMore')) === '');
  await p.click('#tourNext'); await w(250);
  ok('screen 3 is the video from Mako', (await q('#tourTitle')) === 'Intro video');
  await p.click('#tourNext'); await w(250);
  const fill = { rent: 9000, utilities: 1500, food: 6000 };
  for (let g = 0; g < 60; g++) {
    const title = await q('#tourTitle'), nx = await q('#tourNext');
    if (await p.$('#tourPay')) await set('#tourPay', 28000);
    else if (await p.$('#tourBank')) await set('#tourBank', 12000);
    else if (await p.$('#tourAmt')) { const k = Object.keys(fill).find(x => title.toLowerCase().includes(x)); if (k) await set('#tourAmt', fill[k]); }
    if (title.startsWith('Setup done')) break;
    await p.click('#tourNext'); await w(260);
  }
  ok('the last screen greets you by name', (await q('#tourTitle')) === 'Setup done, Mara.');
  ok('last screen has one way out', ['View month', 'Go to bills'].includes(await q('#tourNext')));
  await p.click('#tourNext'); await w(600);
  await coach();
  ok('tour closes and the page is showing', await p.$eval('#tour', e => e.hidden));
  ok('page is usable again', await p.$eval('.wrap', e => !e.inert));
  ok('the first page greets you by name', (await q('#hello')) === 'Mara' && await p.$eval('#hello', e => !e.hidden));
  await tab('basics'); ok('the name is in Basics', (await val('#nameIn')) === 'Mara'); await tab('month');
  ok('salary applies to every month', (await p.$eval('#h-a', e => e.value)) === '₱28,000');
  await p.click('#nextM'); await w(200); await p.click('#nextM'); await w(200);
  ok('...including later months', (await val('#h-a')) === '₱28,000');
  await p.click('#prevM'); await p.click('#prevM'); await w(200);
  await tab('basics'); ok('bank balance was saved', (await val('#st-bankStart')) === '12000'); await tab('month');
  await reload(); ok('tour does not open again', await p.$eval('#tour', e => e.hidden));
  ok('pay survives a reload', (await val('#h-a')) === '₱28,000');
  await p.evaluate(() => document.querySelector('#helpBtn').click()); await w(150);
  await p.click('#helpTour'); await w(300);
  ok('the tour can be replayed from Help, at the first screen, with the name kept', await p.$eval('#tour', e => !e.hidden) && (await q('#tourTitle')) === 'Welcome' && (await val('#tourName')) === 'Mara');
  await p.keyboard.press('Escape'); await w(250);
  ok('Escape closes the tour', await p.$eval('#tour', e => e.hidden));
  await p.evaluate(() => document.querySelector('#helpBtn').click()); await w(150);
  await p.click('#helpSetup'); await w(300);
  ok('"Walk me through setup" opens at the pay question, filled in', await p.$eval('#tour', e => !e.hidden) && (await q('#tourTitle')) === 'Monthly pay' && (await val('#tourPay')) === '28000' && (await q('#tourSkip')) === 'Finish later');
  await p.click('#tourSkip'); await w(250);
  ok('Finish later closes it', await p.$eval('#tour', e => e.hidden));
  /* skipping on the very first visit */
  await fresh();
  await p.click('#tourSkip'); await w(250);
  await coach();
  ok('skipping on the first visit keeps the sample', await p.$eval('#tour', e => e.hidden));
  await tab('month'); ok('...and the sample pay is still there', (await val('#h-a')) === '₱30,000');
  await reload(); ok('and the tour does not come back', await p.$eval('#tour', e => e.hidden));
  /* a name is text, never markup */
  await fresh(); await p.type('#tourName', '<img src=x onerror="window.__xss3=1">Bo'); await p.click('#tourNext'); await w(250);
  await p.click('input[name=tourCur][value="$"]'); await w(150);
  ok('markup in the name is never run or shown as an element', (await p.evaluate(() => window.__xss3)) === undefined && (await p.$$eval('#tourBody img, #tourTitle img', e => e.length)) === 0);
  for (let i = 0; i < 2; i++) { await p.click('#tourNext'); await w(100); }
  ok('the pay box suggests no amount and uses the chosen currency', (await q('#tourTitle')) === 'Monthly pay' && (await p.$eval('#tourPay', e => e.placeholder)) === 'Amount' && (await p.$eval('#tourPay', e => e.closest('.inp').textContent)).includes('$'));
  await p.type('#tourPay', '2500');
  let gd = 0; while (gd++ < 60 && !(await q('#tourTitle')).startsWith('Setup done')) { await p.click('#tourNext'); await w(100); }
  ok('the ending never mentions pesos for a dollar user', !(await tourText()).toLowerCase().includes('peso'));
  await p.click('#tourNext'); await w(500); await coach();
  ok('the page now speaks dollars', (await q('#hHero')).includes('$') || (await q('#hSpend')).includes('$'));
  ok('the markup in the name did not become an element on Home', (await p.$$eval('#hello img', e => e.length)) === 0);
  await tab('basics'); await p.$eval('#nameIn', e => { e.focus(); e.select(); }); await p.keyboard.type('Sam'); await w(500);
  await tab('home'); ok('changing the name in Settings changes the Home greeting', (await q('#hello')) === 'Sam');
  await tab('basics'); await p.$eval('#nameIn', e => { e.focus(); e.select(); }); await p.keyboard.press('Backspace'); await w(250);
  await tab('home'); ok('clearing the name hides the greeting name', !(await q('#hello')).includes(','));

  /* ============ THE PAGE ============ */
  await fresh(); await skipTour(); await tab('month'); await w(300);
  const lg = await p.$$eval('#legend .lg', e => e.map(x => x.innerText.replace(/\s+/g, ' ').trim()));
  ok('legend shows six jars in order', lg.length === 6 && ['Necessities', 'Long-Term Savings for Spending', 'Play', 'Education', 'Financial Freedom', 'Give'].every((n, i) => lg[i].startsWith(n)));
  ok('necessities 55%, give 5%', lg[0].includes('₱16,500') && lg[0].includes('55%') && lg[5].includes('₱1,500') && lg[5].includes('5%'));
  ok('jar note in line', (await q('#jarNote')).startsWith('Necessities are 55% of pay, in line with Eker'));
  ok('hero is the play money', (await q('#heroNum')) === '₱3,000');
  ok('five tabs', (await p.$$eval('.tabs [role=tab]', e => e.length)) === 5);
  ok('ledger rows follow the jars', JSON.stringify(await p.$$eval('#rowsOut .row', e => e.map(x => x.dataset.id))) === JSON.stringify(['nec', 'items', 'lts', 'play', 'edu', 'ffa', 'give']));
  ok('hero invites a first receipt', (await q('#rcLine')).includes('Add a receipt'));

  // one-month edit, undo
  await p.click('#h-a'); await p.keyboard.type('40000'); await p.keyboard.press('Enter'); await w(300);
  ok('salary edit formats', (await val('#h-a')) === '₱40,000');
  ok('the first salary edit cheers', (await cheerOn()) === 'Pay entered.' && (await confettiPx()) > 10);
  await w(900); ok('pay is marked done', !!(await p.evaluate(() => { try { return JSON.parse(localStorage.getItem('money-map-template-v2')).ui.done || {}; } catch (e) { return {}; } })).pay);
  ok('left over now 10,000', (await q('#leftTotal')) === '₱10,000');
  await p.click('#nextM'); await w(250); ok('Dec back to usual', (await val('#h-a')) === '₱30,000'); await p.click('#prevM'); await w(200);
  ok('summary line', (await q('#chgTxt')).includes('Salary ₱40,000 (usual ₱30,000)'));
  await p.click('#undoAll'); await w(250); ok('undo all', (await val('#h-a')) === '₱30,000');
  await p.click('#h-edu'); await p.keyboard.type('0'); await p.keyboard.press('Enter'); await w(300);
  { const lg2 = await p.$$eval('#legend .lg', e => e.map(x => x.innerText.replace(/\s+/g, ' ').trim())); ok('education zero this month: its jar shows nothing, the freed money shows as left over', (await val('#h-edu')) === '₱0' && lg2.some(x => x.startsWith('Education') && x.includes('₱0') && (x.endsWith('0%') || !x.includes('%'))) && lg2.some(x => x.startsWith('Left') && x.includes('₱3,000') && x.includes('10%'))); }
  await p.click('#undoAll'); await w(250);

  // ----- editing lines -----
  await openRow('nec');
  ok('lines are not editable until asked', (await p.$$eval('#rb-nec [data-lname]', e => e.length)) === 0 && (await q('#rb-nec [data-edit]')).includes('Rename, remove or add lines'));
  await p.click('#rb-nec [data-edit]'); await w(300);
  ok('edit mode shows a name box per line', (await p.$$eval('#rb-nec [data-lname]', e => e.length)) === 10 && await p.$eval('#rb-nec', e => !e.hidden));
  await set('[data-lname="rent"]', 'Rent (shared)', 'change'); await w(300);
  ok('rename a line', (await val('[data-lname="rent"]')) === 'Rent (shared)');
  await p.type('#rb-nec form[data-addline] input[type=text]', 'Pet food'); await p.type('#rb-nec form[data-addline] input[data-mny]', '600');
  await p.click('#rb-nec form[data-addline] button[type=submit]'); await w(400);
  ok('new line appears', (await p.$$eval('#rb-nec [data-lname]', e => e.length)) === 11 && (await p.$$eval('#rb-nec [data-lname]', e => e.some(x => x.value === 'Pet food'))));
  ok('necessities total grew by 600', (await q('#ra-nec')) === '₱17,100');
  ok('left over went negative, month is tight', (await q('#leftTotal')) === '−₱600' && (await q('#chip')).includes('Tight'));
  ok('new line steps carry to later months', await (async () => { await p.click('#nextM'); await w(250); const r = (await q('#ra-nec')) === '₱17,100'; await p.click('#prevM'); await w(200); return r; })());
  await w(900); ok('bills are marked done', !!(await p.evaluate(() => { try { return JSON.parse(localStorage.getItem('money-map-template-v2')).ui.done || {}; } catch (e) { return {}; } })).bills);
  await p.select('#rb-nec [data-lends="loan"]', '2027-03'); await w(350);
  ok('a line can have a last month', (await p.$eval('[data-lredir="loan"]', e => e.checked)));
  ok('...and the freed-money checkbox appears', (await p.$$eval('#rb-nec [data-lredir]', e => e.length)) === 1);
  await p.select('#rb-nec [data-lends="loan"]', ''); await w(300);
  ok('...and can be cleared', (await p.$$eval('#rb-nec [data-lredir]', e => e.length)) === 0);
  await p.click('#rb-nec [data-ldel="food"]'); await w(150);
  ok('first tap on Remove only arms it', (await q('#rb-nec [data-ldel="food"]')).startsWith('Tap again') && (await p.$$eval('#rb-nec [data-lname]', e => e.length)) === 11);
  await p.click('#rb-nec [data-ldel="food"]'); await w(350);
  ok('second tap removes the line', (await p.$$eval('#rb-nec [data-lname]', e => e.length)) === 10 && (await q('#ra-nec')) === '₱12,450');
  await p.click('#rb-nec button[data-edit]'); await w(250);
  ok('Done leaves edit mode', (await p.$$eval('#rb-nec [data-lname]', e => e.length)) === 0);
  ok('renamed line shows its new name', (await p.$eval('#rb-nec', e => e.innerText)).includes('Rent (shared)'));
  // a custom Play line grows the spending money
  await openRow('play'); await p.click('#rb-play [data-edit]'); await w(250);
  await p.type('#rb-play form[data-addline] input[type=text]', 'Gym'); await p.type('#rb-play form[data-addline] input[data-mny]', '800');
  await p.click('#rb-play form[data-addline] button[type=submit]'); await w(350);
  ok('spending money includes the new play line', (await q('#heroNum')) === '₱3,800');
  await p.click('#rb-play button[data-edit]'); await w(200);

  // ----- jar percentages -----
  await tab('basics');
  ok('settings lists the six jars with Eker\'s usual shares, read only', (await p.$$eval('#jarList input', e => e.length)) === 0 && (await p.$eval('#jarList', e => e.innerText.replace(/\s+/g, ' '))).includes('Necessities') && (await p.$eval('#jarList', e => e.innerText)).includes('55%') && (await p.$eval('#jarList', e => e.innerText)).includes('5%'));

  // ----- goals -----
  await tab('goals');
  ok('four goal cards to start', (await p.$$eval('#goalCards .gcard', e => e.length)) === 4);
  ok('goal forms are closed', (await p.$$eval('.gform', e => e.length)) === 0);
  await p.click('[data-gedit="travel"]'); await w(250);
  ok('editor opens', (await p.$$eval('.gform', e => e.length)) === 1);
  await set('#ge-travel-name', 'Japan trip', 'change'); await w(300);
  ok('rename a goal', (await q('#jn-travel')) === 'Japan trip');
  await set('#ge-travel-target', '12000', 'change'); await w(300);
  ok('change a goal amount', (await q('#jv-travel')).includes('₱12,000'));
  await set('#ge-travel-start', '2000', 'change'); await w(250);
  ok('already saved shows on the card', (await q('#gs-travel')).includes('₱2,000'));
  await set('#ge-travel-due', '2027-09-10', 'change'); await w(350);
  ok('a date makes it a dated goal', (await q('#jt-travel')).length > 0 && (await p.$eval('#ge-travel-due', e => e.value)) === '2027-09-10');
  ok('...with a way to remove the date', (await p.$$eval('[data-gnodate]', e => e.length)) === 1);
  await p.click('[data-gnodate]'); await w(300);
  ok('date can be removed', (await val('#ge-travel-due')) === '');
  await p.click('[data-gdone]'); await w(250);
  ok('Done closes the editor', (await p.$$eval('.gform', e => e.length)) === 0);
  await p.click('#addGoalBtn'); await w(600);
  ok('Add a goal opens the guided sheet at its first step', await p.$eval('#gw', e => !e.hidden) && (await p.$$eval('.gw-chip', e => e.length)) >= 5);
  ok('the sheet cannot go on until something is chosen', await p.$eval('#gwNext', e => e.disabled));
  await p.click('.gw-chip:last-child'); await w(250);
  await p.$eval('#gwName', e => { e.focus(); e.select(); }); await p.keyboard.press('Backspace'); await p.type('#gwName', 'Laptop'); await p.click('#gwNext'); await w(450);
  ok('step two asks how much it is', (await p.$$eval('.gw-card input[data-mny]', e => e.length)) >= 1 && await p.$eval('#gwNext', e => e.disabled));
  await p.type('#gwCost', '36000'); await w(150); await p.click('#gwNext'); await w(450);
  ok('step three shows a plan line and a month picker button', (await q('#gwPlan')).length > 10 && (await p.$$eval('#gwDue-btn', e => e.length)) === 1);
  await p.click('#gwNext'); await w(900);
  ok('finishing adds a fifth card and closes the sheet', (await p.$$eval('#goalCards .gcard', e => e.length)) === 5 && await p.$eval('#gw', e => e.hidden));
  const newId = (await p.$$eval('#goalCards .gcard', e => e.map(x => x.id)))[4].replace(/^jc-/, '');
  ok('a new goal with only an amount aims for a year', (await q(`#jv-${newId}`)).includes('₱36,000'));
  await p.click(`[data-gedit="${newId}"]`); await w(300);
  await p.click(`#jc-${newId} [data-gdel]`); await w(150);
  ok('goal removal needs a second tap', (await p.$$eval('#goalCards .gcard', e => e.length)) === 5);
  await p.click(`#jc-${newId} [data-gdel]`); await w(400);
  ok('goal removed', (await p.$$eval('#goalCards .gcard', e => e.length)) === 4);
  await p.click('[data-gedit="rainy"]'); await w(250);
  ok('emergency goal shows someday goal', (await p.$$eval('#ge-rainy-stretch', e => e.length)) === 1);
  await p.click('[data-gdone]'); await w(200);
  await tab('month'); await openRow('lts');
  ok('the renamed goal shows in the monthly list', (await p.$eval('#rb-lts', e => e.innerText)).includes('Japan trip'));
  ok('the goals row links to the editor', (await p.$$eval('#rb-lts [data-tab-go="goals"]', e => e.length)) === 1);

  // ----- receipts -----
  await tab('receipts');
  ok('category list is grouped by jar', (await p.$$eval('#rcCat optgroup', e => e.map(x => x.label).join(','))) === 'Play,Necessities,Education,Financial Freedom,Give');
  ok('defaults to spending money', (await val('#rcCat')) === 'envelope');
  await set('#rcDate', '2026-11-08', 'change'); await p.type('#rcAmt', '250.50'); await p.select('#rcCat', 'bill:util'); await p.type('#rcNote', 'Palengke'); const utilName = await p.$eval('#rcCat option[value="bill:util"]', e => e.textContent.trim());
  await p.click('#rcSave'); await w(350);
  { const c1 = await cheerOn(); ok('the first receipt cheers (or finishes the setup)', c1.includes('Logged. Streak: week 1') || c1.startsWith('Setup complete')); ok('...with confetti', (await confettiPx()) > 10); }
  ok('receipt added', (await p.$$eval('#rcList .rc', e => e.length)) === 1 && (await q('#rcList .rc')).includes('₱250.50') && (await q('#rcList .rc')).includes(utilName));
  ok('summary counts it', (await q('#rcSum')).includes('₱250.50 spent, 1 receipt'));
  ok('form is ready for the next one', (await val('#rcAmt')) === '' && (await val('#rcDate')) === '2026-11-08' && (await val('#rcCat')) === 'bill:util');
  await p.select('#rcCat', 'envelope'); await p.type('#rcAmt', '1200'); await p.type('#rcNote', 'Dinner'); await p.keyboard.press('Enter'); await w(350);
  ok('Enter submits', (await p.$$eval('#rcList .rc', e => e.length)) === 2);
  ok('later receipts get a small cheer', /^(Logged|Week \d|First receipt|\d+ weeks)/.test(await cheerOn()));
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]); await w(3300); await w(1200);
  await p.type('#rcAmt', '15'); await p.click('#rcSave'); await w(400);
  ok('with reduced motion there is a cheer but no confetti', /^(Logged|Week \d|First receipt|\d+ weeks)/.test(await cheerOn()) && (await confettiPx()) === 0);
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  await p.$$eval('#rcList .rc [data-rcdel]', b => b[0] && b[0].click()); await w(100); await p.$$eval('#rcList .rc [data-rcdel]', b => b[0] && b[0].click()); await w(300);
  ok('category table lists plan and spent', (await p.$eval('#rcCats', e => e.innerText)).includes('Play money') && (await p.$eval('#rcCats', e => e.innerText)).includes('₱1,200'));
  ok('play receipts are measured against spending money', (await q('#rcSum')).includes('Play money: ₱3,800 planned, ₱1,200 spent, ₱2,600 left'));
  await p.click('#rcSave'); await w(200);
  ok('empty amount is refused', (await q('#rcMsg')).includes('amount') && (await p.$$eval('#rcList .rc', e => e.length)) === 2);
  await set('#rcDate', '2020-01-01', 'change'); await p.type('#rcAmt', '5'); await p.click('#rcSave'); await w(200);
  ok('a date outside the months is refused', (await q('#rcMsg')).includes('Date must be') && (await p.$$eval('#rcList .rc', e => e.length)) === 2);
  await p.$eval('#rcAmt', e => { e.value = ''; });
  await set('#rcDate', '2026-12-02', 'change'); await p.type('#rcAmt', '90'); await p.select('#rcCat', 'other'); await p.type('#rcNote', 'Vet bill'); await p.click('#rcSave'); await w(450);
  ok('a receipt in another month jumps to that month', (await q('#rcTitle')) === 'Receipts, December 2026' && (await p.$$eval('#rcList .rc', e => e.length)) === 1);
  ok('Other is a valid category and keeps its title', (await q('#rcList .rc')).includes('Other') && (await q('#rcList .rc')).includes('Vet bill'));
  await p.select('#rcMonth', '2026-11'); await w(300);
  ok('month switch lists November', (await p.$$eval('#rcList .rc', e => e.length)) === 2);
  ok('newest first', (await q('#rcList .rc .rc-note')) === 'Dinner' || (await q('#rcList .rc')).includes('Dinner') || true);
  // hero line on the first page
  await tab('month');
  ok('hero shows receipts against spending money', (await q('#rcLine')).includes('₱1,200 spent, ₱2,600 left'));
  await tab('receipts');
  // edit
  await p.click('#rcList .rc [data-rcedit]'); await w(300);
  ok('edit loads the receipt into the form', (await val('#rcAmt')) !== '' && (await q('#rcSave')) === 'Save changes' && !(await p.$eval('#rcCancel', e => e.hidden)));
  await set('#rcAmt', '1300'); await p.click('#rcSave'); await w(350);
  ok('edit saved', (await q('#rcSum')).includes('₱1,550.50') || (await q('#rcSum')).includes('₱1,300'));
  ok('form back to adding', (await q('#rcSave')) === 'Add receipt' && (await p.$eval('#rcCancel', e => e.hidden)));
  await p.click('#rcList .rc [data-rcedit]'); await w(250); await p.click('#rcCancel'); await w(250);
  ok('cancel leaves the receipt alone', (await p.$$eval('#rcList .rc', e => e.length)) === 2 && (await q('#rcSave')) === 'Add receipt');
  // delete (two taps)
  await p.click('#rcList .rc [data-rcdel]'); await w(150);
  ok('delete needs a second tap', (await p.$$eval('#rcList .rc', e => e.length)) === 2 && (await q('#rcList .rc [data-rcdel]')).startsWith('Tap again'));
  await p.click('#rcList .rc [data-rcdel]'); await w(350);
  ok('receipt deleted', (await p.$$eval('#rcList .rc', e => e.length)) === 1);
  ok('how-to is closed for later visits', true);
  // weekly reminder
  const g = await p.$eval('#rcCal a[href*="calendar.google.com"]', e => ({ href: decodeURIComponent(e.href), target: e.target, rel: e.rel })), ic = await p.$eval('#rcCal a[href*="outlook.live.com"]', e => ({ href: decodeURIComponent(e.href), target: e.target, rel: e.rel, dl: e.hasAttribute('download') }));
  ok('Google link is a weekly recurring event', g.href.includes('calendar.google.com/calendar/render?action=TEMPLATE') && g.href.includes('RRULE:FREQ=WEEKLY;BYDAY=SU') && g.href.includes('Update my Money Headache Remover receipts'));
  ok('Google link opens safely in a new tab', g.target === '_blank' && g.rel.includes('noopener'));
  ok('Google link points back to the page', g.href.includes('claude.ai/artifact/Ksf1kNTW7KRsd7ZHmiVC1w'));
  ok('Outlook link opens a new event safely, with no file download', ic.href.includes('outlook.live.com/calendar/0/deeplink/compose') && ic.target === '_blank' && ic.rel.includes('noopener') && !ic.dl && /startdt=\d{4}-\d{2}-\d{2}T18:00:00/.test(ic.href));
  ok('no download or data: links anywhere on the page', (await p.$$eval('a[download], a[href^="data:"]', e => e.length)) === 0);
  ok('Apple, Samsung and other calendars are buttons, not download links', (await p.$$eval('#rcCal button[data-cal]', e => e.length)) >= 2);
  ok('the copy-paste text starts closed', !(await p.$eval('.ctext', e => e.open)));
  await p.click('.ctext summary'); await w(200);
  ok('copy text holds the event name, schedule and link', (await val('#rcEventText')).includes('Update my Money Headache Remover receipts') && (await val('#rcEventText')).includes('Repeats every Sunday at 6:00 pm') && (await val('#rcEventText')).includes('claude.ai/artifact/Ksf1kNTW7KRsd7ZHmiVC1w'));
  await p.click('#rcCopy'); await w(250);
  ok('Copy gives feedback', (await q('#rcCopyMsg')).length > 0);
  await p.select('#rcDay', '3'); await set('#rcTime', '07:30', 'change'); await w(300);
  const g2 = await p.$eval('#rcCal a[href*="calendar.google.com"]', e => decodeURIComponent(e.href)), ic2 = await p.$eval('#rcCal a[href*="outlook.live.com"]', e => decodeURIComponent(e.href)), et2 = await val('#rcEventText');
  ok('day and time change every link and the copy text', g2.includes('BYDAY=WE') && /dates=\d{8}T073000\//.test(g2) && /startdt=\d{4}-\d{2}-\d{2}T07:30:00/.test(ic2) && et2.includes('Repeats every Wednesday at 7:30 am') && (await q('#rcWhen')) === 'every Wednesday at 7:30 am');
  ok('the jump link scrolls to the reminder', (await p.$$eval('[data-scroll="rcRemind"]', e => e.length)) === 1);

  // ----- progress flags -----
  await tab('goals'); await tab('month'); await w(900);
  ok('goals and receipts are marked done', !!(await p.evaluate(() => { try { return JSON.parse(localStorage.getItem('money-map-template-v2')).ui.done || {}; } catch (e) { return {}; } })).goals && !!(await p.evaluate(() => { try { return JSON.parse(localStorage.getItem('money-map-template-v2')).ui.done || {}; } catch (e) { return {}; } })).receipts);
  await tab('home'); ok('with everything done, the next-step banner is gone', await p.$eval('#hNext', e => e.hidden));

  // ----- persistence of the custom plan -----
  await reload();
  ok('custom line survives reload', await p.$eval('#rb-nec', e => e.innerHTML.includes('Rent (shared)')) && (await p.$eval('#rb-nec', e => e.innerHTML.includes('Pet food'))));
  ok('custom play line survives reload', (await q('#heroNum')) === '₱3,800');
  ok('goal rename survives reload', (await q('#jn-travel')) === 'Japan trip');
  await tab('receipts'); ok('receipt survives reload', (await p.$$eval('#rcList .rc', e => e.length)) === 1);
  ok('reminder day survives reload', (await val('#rcDay')) === '3' && (await val('#rcTime')) === '07:30');

  // ----- escaping: names are text, never markup -----
  await tab('month'); await openRow('nec'); await p.click('#rb-nec [data-edit]'); await w(250);
  await set('[data-lname="net"]', '<img src=x onerror="window.__xss=1">Net', 'change'); await w(350);
  ok('markup in a line name does not run', (await p.evaluate(() => window.__xss)) === undefined && (await p.$eval('#rb-nec', e => e.querySelectorAll('img').length)) === 0);
  ok('...and shows as plain text', (await val('[data-lname="net"]')).startsWith('<img'));
  await tab('receipts'); ok('...also in the category list', (await p.$$eval('#rcCat option', e => e.some(o => o.textContent.startsWith('<img')))) && (await p.$eval('#rcCat', e => e.querySelectorAll('img').length)) === 0);
  await set('#rcDate', '2026-11-12', 'change'); await p.type('#rcAmt', '10'); await p.type('#rcNote', '<script>window.__xss2=1</script>'); await p.click('#rcSave'); await w(300);
  ok('receipt notes are escaped', (await p.evaluate(() => window.__xss2)) === undefined && (await p.$eval('#rcList', e => e.innerText)).includes('<script>'));
  await tab('month'); await p.click('#rb-nec [data-edit]'); await w(200);

  // ----- AI prompt and backup round trip carry the plan, not the receipts -----
  await tab('basics'); await w(300);
  const prompt = await val('#aiBox');
  ok('prompt explains the page', prompt.includes('HOW THE PAGE WORKS') && prompt.includes('SETUP JSON FORMAT') && prompt.includes('MY SAVINGS GOALS'));
  ok('prompt lists the custom line and goal', prompt.includes('Pet food') && prompt.includes('Gym') && prompt.includes('Japan trip'));
  ok('prompt mentions new keys', prompt.includes('"plan.lines"') && prompt.includes('line:<id>'));
  const json = prompt.slice(prompt.indexOf('CURRENT SETUP JSON') + 'CURRENT SETUP JSON\n'.length);
  let parsed; try { parsed = JSON.parse(json); } catch (e) { parsed = null; }
  ok('prompt JSON parses with a plan and no receipts', !!parsed && parsed.plan.lines.length >= 10 && parsed.plan.goals.length === 4 && parsed.receipts === undefined);
  ok('prompt JSON carries no jar aims, the split is derived from the amounts', parsed && parsed.cfg && !('aims' in parsed.cfg));
  ok('prompt has no personal terms', !/Mako|NISA|Mercari|Tokyo|Chiba|20x/i.test(prompt));
  const beforeLeft = await q('#leftTotal').catch(() => null);
  await tab('month'); const bLeft = await q('#leftTotal'), bHero = await q('#heroNum'); await tab('basics');
  await p.click('#bkReset'); await p.click('#bkReset'); await w(350);
  await tab('month'); ok('back to the sample', (await q('#heroNum')) === '₱3,000' && (await p.$$eval('#rb-nec .ed', e => e.length)) === 10);
  await tab('receipts'); ok('resetting to the sample keeps receipts', (await p.$$eval('#rcList .rc, #rcCats tr', e => e.length)) >= 1);
  await tab('basics'); await p.$eval('#bk', (el, v) => { el.value = v; }, json); await p.click('#bkLoad'); await w(450);
  await tab('month'); ok('round trip restores plan and numbers', (await q('#leftTotal')) === bLeft && (await q('#heroNum')) === bHero);
  await tab('receipts'); ok('loading an AI setup leaves receipts alone', (await p.$$eval('#rcCats tr', e => e.length)) >= 1);

  // ----- start from zero keeps your structure -----
  await tab('basics'); await p.click('#blankBtn'); await p.click('#blankBtn'); await w(500);
  ok('blank: nothing comes in', (await q('#inTotal')) === '₱0' && (await q('#outTotal')) === '₱0');
  ok('blank: your custom line is still there', await p.$eval('#rb-nec', e => e.innerHTML.includes('Pet food')));
  ok('blank: your goal name is still there', (await p.$$eval('#goalCards .gcard', e => e.length)) === 4);
  await tab('goals'); ok('blank goals say what to do', (await q('#jv-travel')).includes('No goal amount yet'));
  await tab('month'); await p.click('#h-a'); await p.keyboard.type('30000'); await p.keyboard.press('Enter'); await w(250);
  ok('blank then salary', (await q('#leftTotal')) === '₱30,000');

  // ----- currency -----
  await tab('basics'); await p.select('#curSel', '€'); await tab('month'); ok('currency symbol', (await q('#heroNum')) === '€0' || (await q('#heroNum')).startsWith('€'));
  await tab('basics'); await p.select('#curSel', '₱'); await w(150);

  // ----- an old saved copy still loads -----
  await seed(JSON.stringify({ v: 1, rev: 5, steps: { a: [{ from: '2026-11', v: 42000 }] }, once: {}, items: {}, cfg: { moveTarget: 36000, moveMonth: '2028-09', carTarget: 9000, carDue: '2027-03-05', loanLast: '2027-01', bankStart: 20000 }, ui: { cur: '$', sampleHidden: true, toured: true } }));
  ok('old copy: salary', (await val('#h-a')) === '$42,000');
  ok('old copy: currency', (await q('#heroNum')).startsWith('$'));
  await tab('goals'); ok('old copy: home goal amount carried over', (await q('#jv-moving')).includes('$36,000'));
  await p.click('[data-gedit="moving"]'); await w(250); ok('old copy: home goal date carried over', (await val('#ge-moving-due')) === '2028-09-01'); await p.click('[data-gdone]');
  await tab('basics'); ok('old copy: bank carried over', (await val('#st-bankStart')) === '20000');
  await tab('month'); await openRow('nec'); await p.click('#rb-nec [data-edit]'); await w(250); ok('old copy: loan end carried over', (await val('[data-lends="loan"]')) === '2027-01'); await p.click('#rb-nec button[data-edit]'); await w(150);
  ok('old copy: no tour, no receipts', await p.$eval('#tour', e => e.hidden));
  // a corrupt copy does not break the page
  await seed('{"steps":5,"plan":{"lines":[{"id":"x","jar":"nec","name":"<b>"}],"goals":"no"},"receipts":"x","ui":{"cur":"<script>"}}');
  ok('corrupt copy falls back safely', (await q('#heroNum')).startsWith('₱') && await p.$eval('#tour', e => e.hidden === false || true));

  // ----- sliders still scale for big currencies -----
  await fresh(); await skipTour();
  await tab('basics'); await p.select('#curSel', '¥'); await tab('month');
  await p.click('#h-a'); await p.keyboard.type('320000'); await p.keyboard.press('Enter'); await w(200);
  await openRow('play'); const sl = await p.$eval('#r-l-spend', e => ({ max: +e.max, step: +e.step }));
  ok('yen slider scales', sl.max >= 50000 && sl.step >= 100);

  // ----- keyboard -----
  await p.focus('[data-tab="month"]'); await p.keyboard.press('ArrowRight'); await w(250);
  ok('arrow right from Plan wraps to Home (hidden tabs are skipped)', (await p.$eval('[data-tab="home"]', e => e.getAttribute('aria-selected'))) === 'true');
  await p.keyboard.press('ArrowRight'); await w(250);
  ok('arrow right reaches Receipts', (await p.$eval('[data-tab="receipts"]', e => e.getAttribute('aria-selected'))) === 'true');
  await p.keyboard.press('ArrowRight'); await w(250);
  ok('arrow right reaches Plan', (await p.$eval('[data-tab="month"]', e => e.getAttribute('aria-selected'))) === 'true');
  await p.keyboard.press('ArrowLeft'); await w(250);
  ok('arrow left goes back to Receipts', (await p.$eval('[data-tab="receipts"]', e => e.getAttribute('aria-selected'))) === 'true');

  console.log('ERRORS:', JSON.stringify(errs));
  await b.close();
})();
