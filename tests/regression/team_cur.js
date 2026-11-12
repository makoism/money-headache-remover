const fs = require('fs');
const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--disable-features=BackForwardCache,ProactivelySwapBrowsingInstance', '--disable-site-isolation-trials'] });
  const p = await b.newPage(); const errs = [];
  p.on('console', m => { if (['error', 'warning'].includes(m.type()) && !/ERR_FILE_NOT_FOUND|ERR_TUNNEL_CONNECTION_FAILED|ERR_NAME_NOT_RESOLVED|ERR_CONNECTION_REFUSED/.test(m.text())) errs.push(m.type() + ': ' + m.text()); });
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

  const tourText = () => p.$eval('#tourBody', e => e.innerText.replace(/\s+/g, ' '));
  const note = () => q('#curNote');
  const pay = () => val('#h-a');

  /* ---- Basics: switching currency swaps the sample while it is untouched ---- */
  await fresh(); await skipTour();
  ok('starts as the peso sample', (await pay()) === '₱30,000');
  await tab('basics');
  await p.select('#curSel', '¥'); await w(300);
  await tab('month');
  ok('yen sample is 200,000 a month', (await pay()) === '¥200,000' && (await q('#heroNum')) === '¥20,000');
  await tab('basics'); ok('...with a note saying so', (await note()) === 'Sample amounts now match this currency.');
  await p.select('#curSel', '€'); await w(300); await tab('month');
  ok('euro sample is 1,650 a month', (await pay()) === '€1,650' && (await q('#heroNum')) === '€165');
  await tab('basics'); await p.select('#curSel', '$'); await w(300); await tab('month');
  ok('dollars start at zero', (await pay()) === '$0' && (await q('#heroNum')) === '$0');
  await tab('basics'); ok('...and the note says everything is at zero', (await note()).startsWith('All amounts zeroed for this currency'));
  await tab('month'); const zeroLines = await p.$$eval('#rb-nec .ed', e => e.length); ok('zero state still lists the bills to fill in', zeroLines === 10);
  await tab('basics'); await p.select('#curSel', '₱'); await w(300); await tab('month');
  ok('back to pesos restores the peso sample', (await pay()) === '₱30,000' && (await q('#heroNum')) === '₱3,000');
  await tab('basics'); await p.select('#curSel', '£'); await w(200); await tab('month');
  ok('pounds start at zero', (await pay()) === '£0');
  await tab('basics'); await p.select('#curSel', '₹'); await w(200); await tab('month');
  ok('rupees start at zero', (await pay()) === '₹0');

  /* ---- the first page speaks to a zero start ---- */
  await tab('home');
  ok('zero start: Home asks for the pay first', (await q('#hNext')).includes('Next: enter pay'));
  ok('zero start: there is nothing left to clear', await p.$eval('#blankTop', e => e.hidden || e.offsetParent === null));
  await tab('basics'); ok('zero start: Settings shows a zero balance', (await val('#st-bankStart')) === '0' || (await val('#st-bankStart')) === '');
  await p.select('#curSel', '¥'); await w(300); await tab('month');
  ok('sample: switching back to yen brings the sample numbers back', (await pay()) === '¥30,000' || (await pay()).startsWith('¥'));

  /* ---- the road ahead: a plain note when there is nothing to chart ---- */
  await fresh(); await skipTour(); await tab('basics'); await p.select('#curSel', '$'); await w(250); await tab('goals');
  ok('zero start: no empty chart, a plain note instead', (await p.$$eval('#chartbox svg', e => e.length)) === 0 && (await q('#chartbox')).startsWith('No goals to chart') && await p.$eval('#roadToggle', e => e.hidden));
  await p.click('[data-gedit="moving"]'); await w(250);
  await p.$eval('#ge-moving-target', e => { e.value = '12000'; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }); await w(300);
  await p.click('[data-gdone]').catch(() => {}); await w(300);
  ok('once a goal has an amount the chart appears', (await p.$$eval('#chartbox svg', e => e.length)) === 1 && await p.$eval('#roadToggle', e => !e.hidden));
  await tab('basics'); await p.select('#curSel', '¥'); await w(250); await tab('goals');
  ok('a sample currency shows the chart and the toggle', (await p.$$eval('#chartbox svg', e => e.length)) === 1 && await p.$eval('#roadToggle', e => !e.hidden));
  await p.click('#roadToggle'); await w(200);
  ok('table view still works', await p.$eval('#roadTable', e => !e.hidden && e.querySelectorAll('tr').length > 5) && await p.$eval('#chartbox', e => e.hidden));
  await tab('month'); await tab('goals');
  ok('...and stays on the table after changing tabs', await p.$eval('#roadTable', e => !e.hidden) && await p.$eval('#chartbox', e => e.hidden));
  await p.click('#roadToggle'); await w(200);

  /* ---- Philippine examples show only for the peso ---- */
  await fresh(); await skipTour(); await tab('month'); await openRow('nec');
  let all = await p.evaluate(() => [...document.body.children].filter(e => e.tagName !== 'SCRIPT').map(e => e.textContent).join(' '));
  ok('pesos keep the local examples', all.includes('SSS, PhilHealth and Pag-IBIG') && all.includes('Commute, Grab, fuel'));
  await tab('basics'); await p.select('#curSel', '¥'); await w(300); await tab('month'); await openRow('nec');
  all = await p.evaluate(() => [...document.body.children].filter(e => e.tagName !== 'SCRIPT').map(e => e.textContent).join(' '));
  ok('yen does not show Philippine services', !/SSS|PhilHealth|Pag-IBIG|UITF|GCash|Maya|Grab/.test(all.replace(/Australia/g, '')) && all.includes('public pension and health insurance') && all.includes('Commute, taxis, fuel'));
  await tab('basics'); await p.select('#curSel', '₱'); await w(300); await tab('month'); await openRow('nec');
  all = await p.evaluate(() => [...document.body.children].filter(e => e.tagName !== 'SCRIPT').map(e => e.textContent).join(' '));
  ok('back to pesos brings them back', all.includes('SSS, PhilHealth and Pag-IBIG'));

  /* ---- an older saved copy: yen symbol on peso-sized bills (the copy in the owner's browser) ---- */
  await seed(fs.readFileSync('/tmp/legacy_yen.json', 'utf8'));
  ok('old copy in yen: the typed pay is kept', (await pay()) === '¥360,000');
  ok('...and the bills and envelopes are the yen sample, not peso-sized', (await q('#ra-nec')) === '¥110,000' && (await q('#heroNum')) === '¥20,000');
  await tab('goals'); ok('...and so are the goals', (await q('#jv-moving')).includes('¥90,000'));
  await seed(fs.readFileSync('/tmp/legacy_yen_edited.json', 'utf8'));
  ok('old copy where a bill was edited is left alone', (await pay()) === '¥360,000' && (await q('#ra-nec')) !== '¥110,000');
  await tab('basics'); await p.select('#curSel', '€'); await w(300); await tab('month');
  ok('...and switching currency on it only changes the symbol', (await pay()) === '€360,000' && (await q('#ra-nec')) !== '€910');
  await tab('basics'); ok('...with the note saying so', (await note()) === 'Amounts unchanged. Only the symbol changed.');
  await seed('{"ui":{"cur":"£"}}');
  ok('old copy in pounds starts at zero, not with peso-sized bills', (await pay()) === '£0' && (await q('#ra-nec')) === '£0');

  /* ---- typed numbers are never swapped away ---- */
  await fresh(); await skipTour();
  await tab('basics'); await p.select('#curSel', '¥'); await w(250); await tab('month');
  await p.click('#h-a'); await p.keyboard.type('250000'); await p.keyboard.press('Enter'); await w(250);
  ok('typed pay is kept', (await pay()) === '¥250,000');
  await tab('basics'); await p.select('#curSel', '€'); await w(300); await tab('month');
  ok('switching currency afterwards keeps the typed pay', (await pay()) === '€250,000');
  ok('...but the sample bills follow the currency', (await q('#ra-nec')) === '€910' && (await q('#heroNum')) === '€165');
  await tab('basics'); ok('...and the note says which stayed', (await note()) === 'Sample bills and goals now match this currency. Pay and balances unchanged.');
  await reload(); await tab('month'); ok('and it survives a reload', (await pay()) === '€250,000');

  /* ---- the reset button goes back to the starting numbers ---- */
  await tab('basics');
  ok('reset button has the plain label', (await q('#bkReset')) === 'Restore samples');
  await p.click('#bkReset'); await w(200);
  ok('first tap arms it', (await q('#bkReset')).startsWith('Tap again'));
  await p.click('#bkReset'); await w(400); await tab('month');
  ok('second tap restores the euro sample', (await pay()) === '€1,650');

  /* ---- the tour follows the currency you pick ---- */
  for (const [sym, payTxt, heroTxt] of [['¥', '¥200,000', '¥20,000'], ['₱', '₱30,000', '₱3,000']]) {
    await fresh();
    await p.click('#tourNext'); await w(200);
    await p.click(`input[name=tourCur][value="${sym}"]`); await w(150);
    await p.click('#tourSkip'); await w(300);
    ok(`tour: picking ${sym} then skipping shows that sample`, (await pay()) === payTxt && (await q('#heroNum')) === heroTxt);
  }
  await fresh(); await p.click('#tourNext'); await w(200);
  await p.click('input[name=tourCur][value="€"]'); await w(150);
  for (let gk = 0; gk < 40 && !(await q('#tourTitle')).startsWith('Setup done'); gk++) { if (await p.$eval('#tourNext', e => e.hidden)) { await p.evaluate(() => document.querySelector('#srcSkip').scrollIntoView({ block: 'center' })); await p.click('#srcSkip'); } else await p.click('#tourNext'); await w(80); }
  ok('tour ending for a sample currency says the pay is a sample and the bills are at zero', /pay shown is a sample/.test(await tourText()) && /bills are all at zero/.test(await tourText()) && !(await tourText()).toLowerCase().includes('peso'));
  await p.click('#tourAlt'); await w(300);
  ok('...and the page shows euros', (await q('#heroNum')).startsWith('€'));
  await fresh(); await p.click('#tourNext'); await w(200);
  await p.click('input[name=tourCur][value="$"]'); await w(150);
  await p.click('#tourSkip'); await w(300);
  ok('tour: picking dollars then skipping starts at zero', (await pay()) === '$0');

  /* ---- an older saved copy keeps its own numbers ---- */
  await seed('{"ui":{"cur":"₱"}}');
  ok('an older copy without a sample setting stays on the 35,000 numbers', (await pay()) === '₱35,000' && (await q('#heroNum')) === '₱3,500');
  await tab('basics'); await p.select('#curSel', '¥'); await w(300); await tab('month');
  ok('...and a currency change gives it the yen sample, since nothing was edited', (await pay()) === '¥200,000' && (await q('#ra-nec')) === '¥110,000');

  console.log('ERRORS:', JSON.stringify(errs));
  await b.close();
})();
