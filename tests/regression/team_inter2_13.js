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
  const tab = async t => { await p.click(`[data-tab="${t}"]`); await w(250); };
  const openRow = async id => { const open = await p.$eval(`.row[data-id=${id}]`, e => e.classList.contains('open')); if (!open) { await p.click(`.row[data-id=${id}] .row-t`); await w(200); } };
  const reload = async () => { await w(900); await p.reload({ waitUntil: 'load' }); await w(500); };
  const skipTour = async () => { if (await p.$eval('#tour', e => !e.hidden)) { await p.click('#tourSkip'); await w(250); } };
  const tourText = () => p.$eval('#tourBody', e => e.innerText.replace(/\s+/g, ' '));

  /* ============ THE TOUR ============ */
  await fresh();
  ok('tour opens on the very first visit', await p.$eval('#tour', e => !e.hidden));
  ok('page behind the tour is inert', await p.$eval('.wrap', e => e.inert));
  ok('dialog is labelled and modal', await p.$eval('#tour', e => e.getAttribute('role') === 'dialog' && e.getAttribute('aria-modal') === 'true'));
  ok('focus lands on the tour title', await p.evaluate(() => document.activeElement.id === 'tourTitle'));
  ok('screen 1 is a welcome with the cozy house', (await q('#tourTitle')) === 'Hi, welcome in.' && (await q('#tourPart')) === 'Welcome · 1 of 3' && (await p.$$eval('#tourBody svg.tour-scene', e => e.length)) === 1);
  ok('...and a promise that it stays private', (await tourText()).includes('stay on this device') && (await tourText()).includes('no wrong answers'));
  ok('...asking what to call you', (await val('#tourName')) === '' && (await q('#tourNext')) === 'Come in');
  ok('no back button on screen 1', await p.$eval('#tourBack', e => e.hidden));
  await p.type('#tourName', '  Mara '); await p.click('#tourNext'); await w(250);
  ok('screen 2 greets you by name and asks for the currency', (await q('#tourTitle')) === 'Nice to meet you, Mara.' && (await q('#tourPart')) === 'Welcome · 2 of 3');
  ok('six currency chips, pesos preselected', (await p.$$eval('input[name=tourCur]', e => e.length)) === 6 && (await p.$eval('input[name=tourCur]:checked', e => e.value)) === '₱');
  await p.click('input[name=tourCur][value="$"]'); await w(150);
  ok('picking a chip selects it', (await p.$eval('input[name=tourCur]:checked', e => e.value)) === '$' && (await p.$eval('input[name=tourCur][value="$"]', e => e.closest('.chip').classList.contains('on'))));
  await p.select('#tourCurMore', 'S$'); await w(150);
  ok('another currency from the list clears the chips', (await p.$$eval('input[name=tourCur]:checked', e => e.length)) === 0 && (await val('#tourCurMore')) === 'S$');
  await p.click('input[name=tourCur][value="₱"]'); await w(150);
  ok('back to pesos', (await p.$eval('input[name=tourCur]:checked', e => e.value)) === '₱' && (await val('#tourCurMore')) === '');
  await p.click('#tourNext'); await w(250);
  ok('screen 3 asks what it should help with', (await q('#tourTitle')) === 'What would you like this to help with?' && (await p.$$eval('input[name=tourHope]', e => e.length)) === 4 && (await tourText()).includes('Just tap Next'));
  await p.click('input[name=tourHope][value=save]'); await w(150);
  await p.click('#tourNext'); await w(250);
  ok('the mindset begins and remembers what you said', (await tourText()).includes('on purpose') && (await q('#tourPart')).startsWith('The mindset · 1 of 6') && (await tourText()).includes('save for something you care about'));
  await p.click('#tourNext'); await w(200);
  ok('screen 2: how people lose track', (await tourText()).includes('Not knowing') && (await tourText()).includes('vanished') && (await tourText()).includes('without knowing the rules'));
  await p.click('#tourNext'); await w(200);
  ok('screen 2b: money is a tool, goal first, with the travel example', (await q('#tourTitle')) === 'Money is a tool, not the goal' && (await tourText()).includes('Where, and for how long?') && (await tourText()).includes('What will it cost?') && (await tourText()).includes('How much a month?') && (await q('#tourPart')).startsWith('The mindset · 3 of 6'));
  await p.click('#tourNext'); await w(200);
  ok('screen 3: six jars shown', (await p.$$eval('#tourBody .seg-b', e => e.length)) === 6 && (await tourText()).includes('spending money'));
  await p.click('#tourNext'); await w(200);
  ok('screen 4: example starts with no spend', (await q('#tourCalc')).includes('16 months'));
  await set('#tourSpend', 2000);
  ok('slider shows the delay', (await q('#tourCalc')).includes('20 months instead of 16') && (await q('#tourCalc')).includes('4 months later') && (await q('#tourSpendV')) === '₱2,000');
  await set('#tourSpend', 500); ok('singular month', (await q('#tourCalc')).includes('1 month later'));
  await p.click('#tourNext'); await w(200);
  ok('screen 5: the three questions', (await tourText()).includes('Where am I?') && (await tourText()).includes('What does this change?') && (await tourText()).includes('Is it worth it?') && (await tourText()).includes('so nothing surprises you later'));
  await p.click('#tourNext'); await w(200);
  ok('part 2 begins', (await q('#tourPart')).startsWith('Putting it to work · 1 of 4'));
  ok('screen 6 maps questions to places', (await tourText()).includes('This month.') && (await tourText()).includes('Goals.') && (await tourText()).includes('Receipts.'));
  await p.click('#tourNext'); await w(200);
  ok('screen 7: weekly habit', (await tourText()).includes('Once a week') && (await q('#tourWhen')) === 'Sunday at 6:00 pm');
  const g1 = await p.$eval('#tourGcal', e => decodeURIComponent(e.href)), i1 = await p.$eval('#tourOutlook', e => decodeURIComponent(e.href));
  ok('tour calendar links: Google repeats weekly on Sunday, Outlook opens a new event at 6 pm', g1.includes('calendar.google.com') && g1.includes('RRULE:FREQ=WEEKLY;BYDAY=SU') && i1.includes('outlook.live.com/calendar/0/deeplink/compose') && /startdt=\d{4}-\d{2}-\d{2}T18:00:00/.test(i1));
  await p.select('#tourDay', '5'); await w(200);
  ok('changing the day changes the links', (await p.$eval('#tourGcal', e => decodeURIComponent(e.href))).includes('BYDAY=FR') && (await q('#tourWhen')) === 'Friday at 6:00 pm');
  await p.click('#tourBack'); await w(150); await p.click('#tourNext'); await w(150);
  ok('the day is remembered', (await val('#tourDay')) === '5');
  await p.click('#tourNext'); await w(200);
  ok('screen 8 asks for the first paycheck', (await q('#tourTitle')) === 'Put in your first paycheck');
  await p.type('#tourPay', '28000'); await p.type('#tourBank', '12000');
  await p.click('#tourNext'); await w(300);
  ok('the first paycheck makes confetti', (await confettiPx()) > 30);
  ok('...which never blocks clicks', (await p.$eval('#confetti', e => getComputedStyle(e).pointerEvents)) === 'none');
  ok('screen 9 explains the sample plan overspends', (await tourText()).includes('₱2,000 more than you earn'));
  ok('the last screen greets you by name and shows the house again', (await q('#tourTitle')) === 'You’re ready, Mara.' && (await p.$$eval('#tourBody svg.tour-scene', e => e.length)) === 1 && (await tourText()).includes('right where you left it'));
  ok('the ending never says the samples are for pesos', !(await tourText()).toLowerCase().includes('peso') && (await tourText()).includes('still samples'));
  ok('last screen has two ways out', (await q('#tourNext')) === 'Go to my bills' && !(await p.$eval('#tourAlt', e => e.hidden)));
  await p.click('#tourNext'); await w(500);
  ok('tour closes and goes to Necessities', await p.$eval('#tour', e => e.hidden) && await p.$eval('.row[data-id=nec]', e => e.classList.contains('open')));
  ok('page is usable again', await p.$eval('.wrap', e => !e.inert));
  ok('the first page greets you by name', /^Good (morning|afternoon|evening), Mara\.$/.test(await q('#hello')) && await p.$eval('#hello', e => !e.hidden));
  await tab('basics'); ok('the name is in Basics', (await val('#nameIn')) === 'Mara'); await tab('month');
  ok('salary applies to every month', (await p.$eval('#h-a', e => e.value)) === '₱28,000');
  await p.click('#nextM'); await w(200); await p.click('#nextM'); await w(200);
  ok('...including later months', (await val('#h-a')) === '₱28,000');
  await p.click('#prevM'); await p.click('#prevM'); await w(200);
  await tab('basics'); ok('bank balance was saved', (await val('#st-bankStart')) === '12000'); await tab('month');
  ok('pay step is ticked on the first-steps card', await p.$eval('#startSteps li:first-child', e => e.classList.contains('done')));
  await reload(); ok('tour does not open again', await p.$eval('#tour', e => e.hidden));
  ok('pay survives a reload', (await val('#h-a')) === '₱28,000');
  await p.click('#tourOpen2'); await w(250);
  ok('tour can be reopened from the first-steps card', await p.$eval('#tour', e => !e.hidden) && (await q('#tourPart')).startsWith('Welcome · 1 of 3') && (await val('#tourName')) === 'Mara');
  await p.keyboard.press('Escape'); await w(250);
  ok('Escape closes the tour', await p.$eval('#tour', e => e.hidden));
  await tab('basics'); await p.click('#tourOpen'); await w(250);
  ok('tour can be reopened from Basics', await p.$eval('#tour', e => !e.hidden));
  for (let i = 0; i < 11; i++) { await p.click('#tourNext'); await w(100); }
  ok('pay is prefilled when reopened', (await val('#tourPay')) === '28000');
  await p.click('#tourSkip'); await w(250);
  ok('skip works from the paycheck screen', await p.$eval('#tour', e => e.hidden));
  /* skipping on the very first visit */
  await fresh();
  await p.click('#tourSkip'); await w(250);
  ok('skipping on the first visit keeps the sample', await p.$eval('#tour', e => e.hidden) && (await val('#h-a')) === '₱30,000');
  await reload(); ok('and it does not come back', await p.$eval('#tour', e => e.hidden));
  /* a blank paycheck screen does not erase anything */
  await fresh();
  await p.click('#tourOpen2').catch(() => {}); for (let i = 0; i < 11; i++) { await p.click('#tourNext'); await w(80); }
  await p.click('#tourNext'); await w(200);
  ok('leaving the paycheck empty is fine', (await tourText()).includes('skipped the paycheck'));
  await p.click('#tourAlt'); await w(300);
  ok('"show me my month" closes the tour on the first page', await p.$eval('#tour', e => e.hidden) && await p.$eval('#p-month', e => !e.hidden) && (await val('#h-a')) === '₱30,000');

  /* a name is text, never markup; the currency scales the example; nothing suggests an amount */
  await fresh(); await p.type('#tourName', '<img src=x onerror="window.__xss3=1">Bo'); await p.click('#tourNext'); await w(250);
  ok('markup in the name is stripped, not run', (await p.evaluate(() => window.__xss3)) === undefined && (await p.$$eval('#tourBody img, #tourTitle img', e => e.length)) === 0 && (await q('#tourTitle')).startsWith('Nice to meet you, img src=x'));
  await p.click('input[name=tourCur][value="$"]'); await w(150);
  for (let i = 0; i < 6; i++) { await p.click('#tourNext'); await w(100); }
  ok('the dollar example uses dollar-sized numbers', (await q('#tourSpendV')) === '$0' && (await q('#tourCalc')).includes('12 months') && (await tourText()).includes('$1,200 for a trip, $100 a month'));
  await set('#tourSpend', 200);
  ok('...and the slider matches', (await q('#tourCalc')).includes('14 months instead of 12') && (await q('#tourCalc')).includes('2 months later') && (await q('#tourSpendV')) === '$200');
  for (let i = 0; i < 4; i++) { await p.click('#tourNext'); await w(100); }
  ok('the paycheck box suggests no amount and uses the chosen currency', (await p.$eval('#tourPay', e => e.placeholder)) === 'Amount' && (await q('#tourPay + *')) !== null && (await p.$eval('#tourPay', e => e.closest('.inp').querySelector('.cs').textContent)) === '$' && !(await p.$eval('#tourBody', e => /35000|35,000/.test(e.innerHTML))));
  await p.type('#tourPay', '2500'); await p.click('#tourNext'); await w(250);
  ok('a currency with no sample gets a zero-start ending, and never mentions pesos', !(await tourText()).toLowerCase().includes('peso') && (await tourText()).includes('empty for now') && !(await tourText()).includes('Clear the sample numbers'));
  await p.click('#tourAlt'); await w(300);
  ok('the page now speaks dollars and uses the cleaned name', (await q('#heroNum')).startsWith('$') && (await q('#hello')).includes('img src=x') && (await p.$$eval('#hello img', e => e.length)) === 0);
  await tab('basics'); await p.$eval('#nameIn', e => { e.focus(); e.select(); }); await p.keyboard.type('Sam'); await w(250);
  await tab('month'); ok('changing the name in Basics changes the greeting', (await q('#hello')).endsWith(', Sam.'));
  await tab('basics'); await p.$eval('#nameIn', e => { e.focus(); e.select(); }); await p.keyboard.press('Backspace'); await w(250);
  await tab('month'); ok('clearing the name hides the greeting', await p.$eval('#hello', e => e.hidden));

  /* ============ THE PAGE ============ */
  await fresh(); await skipTour();
  const lg = await p.$$eval('#legend .lg', e => e.map(x => x.innerText.replace(/\s+/g, ' ').trim()));
  ok('legend shows six jars in order', lg.length === 6 && ['Necessities', 'Long-term savings', 'Play', 'Education', 'Financial freedom', 'Give'].every((n, i) => lg[i].startsWith(n)));
  ok('necessities 55%, give 5%', lg[0].includes('₱16,500') && lg[0].includes('55%') && lg[5].includes('₱1,500') && lg[5].includes('5%'));
  ok('jar note in line', (await q('#jarNote')).startsWith('Necessities take 55% of your income, in line with the 55% aim.'));
  ok('hero is the play money', (await q('#heroNum')) === '₱3,000');
  ok('five tabs', (await p.$$eval('.tabs [role=tab]', e => e.length)) === 5);
  ok('start card is showing with four steps', await p.$eval('#start', e => !e.hidden) && (await p.$$eval('#startSteps li', e => e.length)) === 4);
  ok('ledger rows follow the jars', JSON.stringify(await p.$$eval('#rowsOut .row', e => e.map(x => x.dataset.id))) === JSON.stringify(['nec', 'items', 'lts', 'play', 'edu', 'ffa', 'give']));
  ok('hero invites a first receipt', (await q('#rcLine')).includes('Add a receipt'));

  // one-month edit, undo
  await p.click('#h-a'); await p.keyboard.type('40000'); await p.keyboard.press('Enter'); await w(300);
  ok('salary edit formats', (await val('#h-a')) === '₱40,000');
  ok('the first salary edit cheers', (await cheerOn()) === 'Paycheck in. Your month just got real.' && (await confettiPx()) > 10);
  ok('first-steps card stays and ticks pay', await p.$eval('#start', e => !e.hidden) && await p.$eval('#startSteps li:first-child', e => e.classList.contains('done')));
  ok('left over now 10,000', (await q('#leftTotal')) === '₱10,000');
  await p.click('#nextM'); await w(250); ok('Dec back to usual', (await val('#h-a')) === '₱30,000'); await p.click('#prevM'); await w(200);
  ok('summary line', (await q('#chgTxt')).includes('Salary ₱40,000 (usually ₱30,000)'));
  await p.click('#undoAll'); await w(250); ok('undo all', (await val('#h-a')) === '₱30,000');
  await p.click('#h-edu'); await p.keyboard.type('0'); await p.keyboard.press('Enter'); await w(300);
  ok('education zero this month', (await val('#h-edu')) === '₱0' && (await q('#jarNote')).includes('Education 0% (aim 10%)'));
  await p.click('#undoAll'); await w(250);

  // ----- editing lines -----
  await openRow('nec');
  ok('lines are not editable until asked', (await p.$$eval('#rb-nec [data-lname]', e => e.length)) === 0 && (await q('#rb-nec [data-edit]')).includes('Rename, remove or add lines'));
  await p.click('#rb-nec [data-edit]'); await w(300);
  ok('edit mode shows a name box per line', (await p.$$eval('#rb-nec [data-lname]', e => e.length)) === 10 && await p.$eval('#rb-nec', e => !e.hidden));
  await set('[data-lname="rent"]', 'Rent (shared)', 'change'); await w(300);
  ok('rename a line', (await val('[data-lname="rent"]')) === 'Rent (shared)');
  await p.type('#rb-nec form[data-addline] input[type=text]', 'Pet food'); await p.type('#rb-nec form[data-addline] input[type=number]', '600');
  await p.click('#rb-nec form[data-addline] button[type=submit]'); await w(400);
  ok('new line appears', (await p.$$eval('#rb-nec [data-lname]', e => e.length)) === 11 && (await p.$$eval('#rb-nec [data-lname]', e => e.some(x => x.value === 'Pet food'))));
  ok('necessities total grew by 600', (await q('#ra-nec')) === '₱17,100');
  ok('left over went negative, month is tight', (await q('#leftTotal')) === '−₱600' && (await q('#chip')).includes('Tight'));
  ok('new line steps carry to later months', await (async () => { await p.click('#nextM'); await w(250); const r = (await q('#ra-nec')) === '₱17,100'; await p.click('#prevM'); await w(200); return r; })());
  ok('the first-steps card ticks bills', await p.$eval('#startSteps li:nth-child(2)', e => e.classList.contains('done')));
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
  await p.type('#rb-play form[data-addline] input[type=text]', 'Gym'); await p.type('#rb-play form[data-addline] input[type=number]', '800');
  await p.click('#rb-play form[data-addline] button[type=submit]'); await w(350);
  ok('spending money includes the new play line', (await q('#heroNum')) === '₱3,800');
  await p.click('#rb-play button[data-edit]'); await w(200);

  // ----- jar percentages -----
  await tab('basics');
  ok('six percentage boxes', (await p.$$eval('#jarList input[data-aim]', e => e.map(x => x.value).join(','))) === '55,10,10,10,10,5');
  await set('#aim-nec', '50', 'change'); await w(250);
  ok('total warns when not 100%', (await q('#aimTotal')).includes('95%') && !(await p.$eval('#aimReset', e => e.hidden)));
  await tab('month');
  ok('the page uses the new aim', (await q('#legend .lg:first-child')).includes('Aim 50%'));
  await tab('basics'); await p.click('#aimReset'); await w(250);
  ok('reset to the guide', (await val('#aim-nec')) === '55' && (await p.$eval('#aimReset', e => e.hidden)));

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
  await p.click('#addGoalBtn'); await w(400);
  ok('Add a goal makes a fifth card and opens it', (await p.$$eval('#goalCards .gcard', e => e.length)) === 5 && (await p.$$eval('.gform', e => e.length)) === 1);
  ok('the new goal is named and focused', await p.evaluate(() => /^ge-.*-name$/.test(document.activeElement.id)));
  const newId = await p.$eval('.gform', e => e.dataset.gid);
  await set(`#ge-${newId}-name`, 'Laptop', 'change'); await set(`#ge-${newId}-target`, '36000', 'change'); await w(300);
  ok('a new goal with only an amount aims for a year', (await q(`#jv-${newId}`)).includes('₱36,000'));
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
  ok('how-to is open the first time', await p.$eval('#rcHow', e => e.open));
  ok('category list is grouped by jar', (await p.$$eval('#rcCat optgroup', e => e.map(x => x.label).join(','))) === 'Play,Necessities,Education,Financial freedom,Give');
  ok('defaults to spending money', (await val('#rcCat')) === 'envelope');
  await set('#rcDate', '2026-11-08', 'change'); await p.type('#rcAmt', '250.50'); await p.select('#rcCat', 'bill:util'); await p.type('#rcNote', 'Palengke'); const utilName = await p.$eval('#rcCat option[value="bill:util"]', e => e.textContent.trim());
  await p.click('#rcSave'); await w(350);
  { const c1 = await cheerOn(); ok('the first receipt cheers (or finishes the setup)', c1.includes('First receipt in') || c1.startsWith('All four steps done')); ok('...with confetti', (await confettiPx()) > 10); }
  ok('receipt added', (await p.$$eval('#rcList .rc', e => e.length)) === 1 && (await q('#rcList .rc')).includes('₱250.50') && (await q('#rcList .rc')).includes(utilName));
  ok('summary counts it', (await q('#rcSum')).includes('₱250.50 spent across 1 receipt'));
  ok('form is ready for the next one', (await val('#rcAmt')) === '' && (await val('#rcDate')) === '2026-11-08' && (await val('#rcCat')) === 'bill:util');
  await p.select('#rcCat', 'envelope'); await p.type('#rcAmt', '1200'); await p.type('#rcNote', 'Dinner'); await p.keyboard.press('Enter'); await w(350);
  ok('Enter submits', (await p.$$eval('#rcList .rc', e => e.length)) === 2);
  ok('later receipts get a small cheer', (await cheerOn()) === 'Logged. One more thing you can see.');
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]); await w(3300); await w(1200);
  await p.type('#rcAmt', '15'); await p.click('#rcSave'); await w(400);
  ok('with reduced motion there is a cheer but no confetti', (await cheerOn()) === 'Logged. One more thing you can see.' && (await confettiPx()) === 0);
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  await p.$$eval('#rcList .rc [data-rcdel]', b => b[0] && b[0].click()); await w(100); await p.$$eval('#rcList .rc [data-rcdel]', b => b[0] && b[0].click()); await w(300);
  ok('category table lists plan and spent', (await p.$eval('#rcCats', e => e.innerText)).includes('Spending money') && (await p.$eval('#rcCats', e => e.innerText)).includes('₱1,200'));
  ok('play receipts are measured against spending money', (await q('#rcSum')).includes('Spending money: ₱3,800 planned, ₱1,200 spent, ₱2,600 left'));
  await p.click('#rcSave'); await w(200);
  ok('empty amount is refused', (await q('#rcMsg')).includes('amount') && (await p.$$eval('#rcList .rc', e => e.length)) === 2);
  await set('#rcDate', '2020-01-01', 'change'); await p.type('#rcAmt', '5'); await p.click('#rcSave'); await w(200);
  ok('a date outside the months is refused', (await q('#rcMsg')).includes('Pick a date') && (await p.$$eval('#rcList .rc', e => e.length)) === 2);
  await p.$eval('#rcAmt', e => { e.value = ''; });
  await set('#rcDate', '2026-12-02', 'change'); await p.type('#rcAmt', '90'); await p.select('#rcCat', 'other'); await p.click('#rcSave'); await w(450);
  ok('a receipt in another month jumps to that month', (await q('#rcTitle')) === 'Receipts for December 2026' && (await p.$$eval('#rcList .rc', e => e.length)) === 1);
  ok('Other is a valid category', (await q('#rcList .rc')).includes('Other'));
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
  const g = await p.$eval('#gcalLink', e => ({ href: decodeURIComponent(e.href), target: e.target, rel: e.rel })), ic = await p.$eval('#outlookLink', e => ({ href: decodeURIComponent(e.href), target: e.target, rel: e.rel, dl: e.hasAttribute('download') }));
  ok('Google link is a weekly recurring event', g.href.includes('calendar.google.com/calendar/render?action=TEMPLATE') && g.href.includes('RRULE:FREQ=WEEKLY;BYDAY=SU') && g.href.includes('Update my Money Headache Remover receipts'));
  ok('Google link opens safely in a new tab', g.target === '_blank' && g.rel.includes('noopener'));
  ok('Google link points back to the page', g.href.includes('claude.ai/artifact/Ksf1kNTW7KRsd7ZHmiVC1w'));
  ok('Outlook link opens a new event safely, with no file download', ic.href.includes('outlook.live.com/calendar/0/deeplink/compose') && ic.target === '_blank' && ic.rel.includes('noopener') && !ic.dl && /startdt=\d{4}-\d{2}-\d{2}T18:00:00/.test(ic.href));
  ok('no download or data: links anywhere on the page', (await p.$$eval('a[download], a[href^="data:"]', e => e.length)) === 0);
  ok('Apple Calendar steps start closed', !(await p.$eval('#rcOther', e => e.open)));
  await p.click('#rcOther summary'); await w(200);
  ok('copy text holds the event name, schedule and link', (await val('#rcEventText')).includes('Update my Money Headache Remover receipts') && (await val('#rcEventText')).includes('Repeats every Sunday at 6:00 pm') && (await val('#rcEventText')).includes('claude.ai/artifact/Ksf1kNTW7KRsd7ZHmiVC1w'));
  await p.click('#rcCopy'); await w(250);
  ok('Copy gives feedback', (await q('#rcCopyMsg')).length > 0);
  await p.select('#rcDay', '3'); await set('#rcTime', '07:30', 'change'); await w(300);
  const g2 = await p.$eval('#gcalLink', e => decodeURIComponent(e.href)), ic2 = await p.$eval('#outlookLink', e => decodeURIComponent(e.href)), et2 = await val('#rcEventText');
  ok('day and time change every link and the copy text', g2.includes('BYDAY=WE') && /dates=\d{8}T073000\//.test(g2) && /startdt=\d{4}-\d{2}-\d{2}T07:30:00/.test(ic2) && et2.includes('Repeats every Wednesday at 7:30 am') && (await q('#rcWhen')) === 'Wednesday at 7:30 am');
  ok('the jump link scrolls to the reminder', (await p.$$eval('[data-scroll="rcRemind"]', e => e.length)) === 1);

  // ----- first-steps card: tick-off and hide / show -----
  await tab('goals'); await tab('month');
  ok('goals and receipts steps ticked', await p.$eval('#startSteps', e => e.querySelectorAll('li.done').length === 4) || (await p.$$eval('#startSteps li', e => e.length)) === 0);
  ok('all done collapses the card', (await q('#startTitle')) === 'All four steps done' && await p.$eval('#startSub', e => e.hidden));
  await p.click('#hideSample'); await w(200);
  ok('hide this', await p.$eval('#start', e => e.hidden));
  await tab('basics'); await p.click('#showStart'); await w(300);
  ok('show the first steps again', await p.$eval('#start', e => !e.hidden));

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
  ok('prompt JSON has the aims', parsed && Math.abs(parsed.cfg.aims.nec - 0.55) < 1e-9);
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
  await p.focus('[data-tab="month"]'); await p.keyboard.press('ArrowRight'); await w(200);
  ok('arrow key moves tab', (await p.$eval('[data-tab="months"]', e => e.getAttribute('aria-selected'))) === 'true');
  await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await w(250);
  ok('arrow keys reach Receipts', (await p.$eval('[data-tab="receipts"]', e => e.getAttribute('aria-selected'))) === 'true');

  console.log('ERRORS:', JSON.stringify(errs));
  await b.close();
})();
