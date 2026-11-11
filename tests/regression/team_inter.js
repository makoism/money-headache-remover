const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const p = await b.newPage(); const errs = [];
  p.on('console', m => { if (['error', 'warning'].includes(m.type())) errs.push(m.type() + ': ' + m.text()); });
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  await p.setViewport({ width: 1180, height: 900 });
  await p.goto('file:///home/claude/work/money-map-team.html#2026-11', { waitUntil: 'load' });
  await p.evaluate(() => (localStorage.clear(), indexedDB.deleteDatabase('money-map-safe'))); await p.reload({ waitUntil: 'load' });
  const w = ms => new Promise(r => setTimeout(r, ms));
  /* the sticky summary bar can cover a field scrolled to the very top: centre each target before clicking */
  const _click = p.click.bind(p); p.click = async (sel, o) => { try { await p.$eval(sel, e => e.scrollIntoView({ block: 'center' })); } catch (e) { /* not on the page */ } return _click(sel, o); };
  const q = async s => p.$eval(s, e => e.textContent.trim()).catch(() => 'MISSING:' + s);
  const val = async s => p.$eval(s, e => e.value).catch(() => 'MISSING:' + s);
  const log = (k, v) => console.log(k.padEnd(40), v);
  const openRow = async id => { const open = await p.$eval(`.row[data-id=${id}]`, e => e.classList.contains('open')); if (!open) { await p.click(`.row[data-id=${id}] .row-t`); await w(200); } };
  const ok = (name, cond) => { console.log(cond ? 'PASS' : 'FAIL', name); if (!cond) process.exitCode = 1; };
  await w(500);

  // 0. the six jars on a fresh sample (pesos)
  const lg = await p.$$eval('#legend .lg', e => e.map(x => x.innerText.replace(/\s+/g, ' ').trim()));
  ok('legend shows six jars', lg.length === 6);
  ok('jar order', ['Necessities', 'Long-term savings', 'Play', 'Education', 'Financial freedom', 'Give'].every((n, i) => lg[i].startsWith(n)));
  ok('necessities 55%', lg[0].includes('₱19,250') && lg[0].includes('55%'));
  ok('give 5%', lg[5].includes('₱1,750') && lg[5].includes('5%'));
  log('legend', JSON.stringify(lg));
  ok('jar note in line', (await q('#jarNote')).startsWith('Necessities take 55% of your income, in line with the 55% guide.'));
  ok('hero is the play money', (await q('#heroNum')) === '₱3,500');
  ok('chip on plan', (await q('#chip')).includes('On plan'));
  ok('verdict: nothing to spare', (await q('#verdict')).startsWith('Everything is covered, with nothing to spare.'));
  const rowNames = await p.$$eval('#rowsOut .row .nm', e => e.map(x => x.childNodes[0].textContent.trim()));
  ok('ledger rows follow the jars', JSON.stringify(rowNames) === JSON.stringify(['Necessities', 'One-time costs', 'Other card spending', 'Long-term savings', 'Play (spending money)', 'Education', 'Financial freedom (investing)', 'Give']));
  log('rows', JSON.stringify(rowNames));
  ok('bar has six jar segments plus rest', (await p.$$eval('#bar .seg-b', e => e.length)) === 7);
  ok('left over row hidden in sample', (await p.$$eval('#legend .lg', e => e.every(x => !x.textContent.includes('Left over')))));
  await p.click('[data-tab="basics"]'); await w(200);
  ok('jar guide lists six jars', (await p.$$eval('#jarList .j', e => e.length)) === 6);
  ok('jar guide percentages', JSON.stringify(await p.$$eval('#jarList .j b', e => e.map(x => x.textContent))) === JSON.stringify(['55%', '10%', '10%', '10%', '10%', '5%']));
  ok('emergency hint mentions 3 to 6 months', (await p.$eval('#sets', e => e.innerText)).includes('three to six months of necessities'));
  await p.click('[data-tab="goals"]'); await w(300);
  ok('goals page names the jar', (await q('#goalsSub')).includes('Long-term savings jar') && (await q('#goalsSub')).includes('₱3,500') && (await q('#goalsSub')).includes('10% of your income'));
  await p.click('[data-tab="month"]'); await w(200);
  await openRow('goals'); await w(200);
  ok('emergency fund note in months', (await q('#n-goal-rainy')).includes('about 3 months of your necessities') && (await q('#n-goal-rainy')).includes('about 6'));
  await p.click('.row[data-id=goals] .row-t'); await w(100);

  // 1. one-month edit in the header, next month untouched
  await p.click('#h-a'); await p.keyboard.type('40000'); await p.keyboard.press('Enter'); await w(300);
  ok('salary edit formats', (await val('#h-a')) === '₱40,000');
  ok('banner hides after first edit', await p.$eval('#sample', e => e.hidden));
  ok('Nov left over now 5,000', (await q('#leftTotal')) === '₱5,000');
  ok('left over shows in the legend', lg.length === 6 && (await p.$$eval('#legend .lg', e => e.some(x => x.textContent.includes('Left over')))));
  await p.click('#nextM'); await w(300);
  ok('Dec salary back to usual', (await val('#h-a')) === '₱35,000');
  ok('Dec left over 0', (await q('#leftTotal')) === '₱0');
  await p.click('#prevM'); await w(200);
  ok('summary line', (await q('#chgTxt')).includes('Salary ₱40,000 (usually ₱35,000)'));
  await p.click('#undoAll'); await w(300);
  ok('undo all', (await val('#h-a')) === '₱35,000');
  // education: skip it for one month, then back
  await p.click('#h-edu'); await p.keyboard.type('0'); await p.keyboard.press('Enter'); await w(300);
  ok('education zero this month', (await val('#h-edu')) === '₱0' && (await q('#leftTotal')) === '₱3,500');
  ok('jar note flags education below the guide', (await q('#jarNote')).includes('Education 0% (aim 10%)'));
  await p.click('#nextM'); await w(300);
  ok('education back next month', (await val('#h-edu')) === '₱3,500');
  await p.click('#prevM'); await w(200); await p.click('#undoAll'); await w(300);
  // a bigger rent pushes necessities above the guide
  await openRow('bills'); await p.$eval('#i-bill-rent', el => { el.value = 14000; el.dispatchEvent(new Event('input', { bubbles: true })); }); await w(300);
  ok('necessities above guide message', (await q('#jarNote')).startsWith('Necessities take 75% of your income, above the 55% guide.') && (await q('#jarNote')).includes('habit matters more'));
  await p.click('.row[data-id=bills] .row-t'); await w(100); await p.click('#undoAll'); await w(300);
  ok('back to the sample', (await q('#jarNote')).startsWith('Necessities take 55%'));

  // 2. currency
  await p.click('[data-tab="basics"]'); await w(200);
  await p.select('#curSel', '€'); await w(300);
  await p.click('[data-tab="month"]'); await w(300);
  ok('currency symbol in hero', (await q('#heroNum')) === '€3,500');
  ok('currency symbol in inputs', (await p.$eval('#p-month .cs', e => e.textContent)) === '€');
  await p.click('[data-tab="basics"]'); await p.select('#curSel', 'CHF'); await p.click('[data-tab="month"]'); await w(300);
  log('CHF hero', await q('#heroNum'));
  await p.click('[data-tab="basics"]'); await p.select('#curSel', '$'); await w(200);

  // 3. start from zero (two taps)
  await p.click('#blankBtn'); await w(200);
  ok('first tap only arms', (await q('#blankBtn')).startsWith('Tap again'));
  await p.click('#blankBtn'); await w(500);
  ok('lands on this month', await p.$eval('#p-month', e => !e.hidden));
  log('blank hero', (await q('#heroNum')) + ' | chip hidden=' + (await p.$eval('#chip', e => e.hidden)));
  ok('blank verdict asks for salary', (await q('#verdict')).startsWith('Start with your take-home pay'));
  ok('all totals zero', (await q('#inTotal')) === '$0' && (await q('#outTotal')) === '$0');
  await p.click('#h-a'); await p.keyboard.type('50000'); await p.keyboard.press('Enter'); await w(200);
  await p.click('.row[data-id=bills] .row-t'); await w(200);
  await p.$eval('#i-bill-rent', el => { el.value = 15000; el.dispatchEvent(new Event('input', { bubbles: true })); }); await w(300);
  ok('salary and rent only', (await q('#leftTotal')) === '$35,000');
  await p.click('.row[data-id=bills] .row-t'); await w(100);
  // keep salary for later months
  await openRow('a'); await p.click('[data-keep="a"]'); await w(200);
  await p.click('#nextM'); await w(300);
  ok('kept salary next month', (await val('#h-a')) === '$50,000');
  // goal with zero target shows a prompt
  await p.click('[data-tab="goals"]'); await w(300);
  ok('unset goal says so', (await q('#jv-travel')).includes('No goal yet'));
  // type a trip target in Basics
  await p.click('[data-tab="basics"]'); await w(200);
  await p.$eval('#st-travelTarget', el => { el.value = 3000; el.dispatchEvent(new Event('change', { bubbles: true })); }); await w(300);
  await p.click('[data-tab="goals"]'); await w(300);
  log('trip card after target', (await q('#jv-travel')) + ' | ' + (await q('#js-travel')));

  // 4. AI prompt + JSON round trip
  const before = await q('#leftTotal'), beforeIn = await q('#inTotal');
  await p.click('[data-tab="basics"]'); await w(400);
  const prompt = await val('#aiBox');
  ok('prompt has how it works', prompt.includes('HOW THE PAGE WORKS') && prompt.includes('CURRENT SETUP JSON'));
  ok('prompt lists salary 50000', prompt.includes('- Salary (take-home, per month): 50000'));
  const json = prompt.slice(prompt.indexOf('CURRENT SETUP JSON') + 'CURRENT SETUP JSON\n'.length);
  let parsed; try { parsed = JSON.parse(json); } catch (e) { parsed = null; }
  ok('prompt JSON parses', !!parsed && parsed.v === 1 && parsed.cfg.travelTarget === 3000 && parsed.steps['bill:rent'].length >= 1);
  ok('prompt JSON is explicit for every amount', ['a', 'envelope', 'goal:moving', 'bill:loan', 'bill:food', 'invest', 'education', 'give'].every(k => parsed.steps[k]));
  ok('prompt explains the jars', prompt.includes('six jars') && prompt.includes('Necessities 55%') && prompt.includes('Give 5%') && prompt.includes('JAR SPLIT FOR NOV 2026'));
  ok('prompt keys include the new ones', prompt.includes('education, give, bill:rent, bill:util, bill:food'));
  ok('prompt has no personal terms', !/Mako|NISA|Mercari|Japan|Tokyo/i.test(prompt));
  // round trip: back to samples, load the JSON, same numbers
  await p.click('#bkReset'); await p.click('#bkReset'); await w(300);
  await p.click('[data-tab="month"]'); await w(300);
  ok('samples back', (await val('#h-a')) === '$35,000');
  await p.click('[data-tab="basics"]'); await w(300);
  await p.$eval('#bk', (el, v) => { el.value = v; }, json); await p.click('#bkLoad'); await w(400);
  log('load message', await q('#bkMsg'));
  await p.click('[data-tab="month"]'); await w(300);
  ok('round trip restores salary', (await val('#h-a')) === '$50,000');
  ok('round trip restores left over', (await q('#leftTotal')) === before && (await q('#inTotal')) === beforeIn);
  // copy button does not throw and reports something
  await p.click('[data-tab="basics"]'); await w(200);
  await p.click('#aiCopy'); await w(400);
  log('copy message', await q('#aiMsg'));

  // 5. yen-sized numbers: sliders and chart axis adapt
  await p.click('#bkReset'); await p.click('#bkReset'); await w(300);
  await p.select('#curSel', '¥'); await p.click('[data-tab="month"]'); await w(300);
  await p.click('#h-a'); await p.keyboard.type('320000'); await p.keyboard.press('Enter'); await w(200);
  await openRow('a'); await p.click('[data-keep="a"]'); await w(200);
  await openRow('env'); await w(200);
  const sl = await p.$eval('#r-env', e => ({ max: +e.max, step: +e.step }));
  log('yen slider', JSON.stringify(sl));
  ok('yen slider scales', sl.max >= 50000 && sl.step >= 100);
  await p.click('[data-tab="goals"]'); await w(500);
  log('axis labels', JSON.stringify(await p.$$eval('#chartbox svg text', e => e.map(x => x.textContent).filter(t => /K|M|^\d+$/.test(t)).slice(0, 8))));

  // 6. persistence
  await w(900); await p.reload({ waitUntil: 'load' }); await w(500);
  ok('persists currency', (await p.$eval('#curSel', e => e.value)) === '¥');
  ok('save status text', (await q('#saveTxt')).includes('browser'));
  // 7. keyboard tabs
  await p.focus('[data-tab="month"]'); await p.keyboard.press('ArrowRight'); await w(200);
  ok('arrow key moves tab', (await p.$eval('[data-tab="months"]', e => e.getAttribute('aria-selected'))) === 'true');
  console.log('ERRORS:', JSON.stringify(errs));
  await b.close();
})();
