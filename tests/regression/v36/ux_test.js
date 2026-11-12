/* v35.1 customer-experience fixes: dead ends, traps and wording found by walking the page as a new person */
const puppeteer = require('/home/claude/work/tools/node_modules/puppeteer-core');
const L = require('/tmp/v22/lib.js'); const { w, P, runTour } = L;
let pass = 0, fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); c ? pass++ : fail++; };
const title = p => p.$eval('#tourTitle', e => e.textContent).catch(() => null);
const PAGE = process.env.PAGE || '/home/claude/work/money-map-team.html';
const openAt = async (b, iso, keep) => { const p = await b.newPage(); const errs = []; await p.setViewport({ width: 390, height: 844 }); p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); await p.evaluateOnNewDocument((iso, keep) => { try { if (!keep && !sessionStorage.getItem('__keep')) { localStorage.clear(); indexedDB.deleteDatabase('money-map-safe'); } sessionStorage.setItem('__keep', '1'); } catch (e) {} if (iso) { const real = Date, fixed = new real(iso).getTime(), start = real.now(); class D extends real { constructor(...a) { if (!a.length) super(fixed + (real.now() - start)); else super(...a); } static now() { return fixed + (real.now() - start); } } window.Date = D; } }, iso, !!keep); await p.goto('file://' + PAGE + '?sfxtest&m=' + Math.random() + '#2026-11', { waitUntil: 'load' }); await w(700); return { p, errs }; };
(async () => {
  // ---- A. the statements step has a visible way forward
  let { b, p, errs } = await L.launch(390, 844, 'dark');
  let hit = false; await runTour(p, P.a, async () => { if ((await title(p)) === 'Your statements') { hit = true; throw new Error('stop'); } }).catch(() => {});
  ok(hit, 'reached Your statements');
  const nx = await p.$eval('#tourNext', e => ({ hidden: e.hidden, text: e.textContent, solid: e.classList.contains('solid'), y: e.getBoundingClientRect().top }));
  ok(!nx.hidden && nx.text === 'Type numbers instead' && !nx.solid && nx.y < 844, `the footer button is visible and plain: "${nx.text}"`);
  await p.click('#tourNext'); await w(400); ok((await title(p)) === 'Your money', 'it goes on to Your money');
  await b.close();
  // ---- B. nothing typed: the end screen says what is really there, Home asks for the goal amount
  ({ b, p, errs } = await L.launch(390, 844, 'dark'));
  for (let i = 0; i < 30; i++) { const nxt = await p.$eval('#tourNext', e => e.textContent); if (/^(Go to bills|Done)$/.test(nxt)) break; await p.click('#tourNext'); await w(250); }
  const doneTxt = await p.$eval('#tourBody', e => e.innerText);
  ok(/all at zero so far/.test(doneTxt) && !/still samples/.test(doneTxt), 'end screen: bills are at zero, not "still samples"');
  ok(/Plan, Money in, Salary/.test(doneTxt), 'end screen: says where pay goes');
  await p.click('#tourNext'); await w(900); await p.evaluate(() => document.querySelector('[data-tab="home"]').click()); await w(500);
  ok(/Emergency fund has no amount yet/.test(await p.$eval('#hHero', e => e.innerText)), 'Home asks for the amount of the amount-less goal');
  await p.evaluate(() => document.querySelector('[data-gset]').click()); await w(600);
  ok(await p.evaluate(() => !document.querySelector('#p-goals').hidden && !!document.querySelector('#goalCards input[data-g="target"]')), 'Set amount opens the goal editor on Goals');
  await b.close();
  // ---- C. one goal takes the Long-Term Savings jar; two goals share the real jar money (not a hundredth of it)
  ({ b, p, errs } = await L.launch(390, 844, 'dark'));
  await runTour(p, P.a); await w(900);
  const one = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('money-map-template-v2')); const g = s.plan.goals[0]; return { dep: s.steps['goal:' + g.id] && s.steps['goal:' + g.id][0].v, aims: s.cfg.aims }; });
  ok(one.dep === 25100, 'one goal (Aiko): the goal takes the whole savings jar, 25,100 a month: ' + one.dep);
  await b.close();
  ({ b, p, errs } = await L.launch(390, 844, 'dark'));
  let splitTxt = ''; await runTour(p, P.b, async () => { const t = await title(p); if (/Split goal money/.test(t)) splitTxt = await p.$eval('#tourBody', e => e.innerText.replace(/\s+/g, ' ')); });
  ok(/\$180 a month/.test(splitTxt), 'two goals (pay $3,600, savings 5%): the split screen has $180 a month to share: ' + splitTxt.slice(0, 90));
  await w(800);
  const two = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('money-map-template-v2')); return s.plan.goals.map(g => (s.steps['goal:' + g.id] || [{ v: null }])[0].v); });
  ok(two.reduce((a, c) => a + (c || 0), 0) === 180, 'and the two goals add up to $180: ' + two.join('+'));
  // a new goal from the wizard does not take over as main goal
  await p.evaluate(() => document.querySelector('[data-tab="home"]').click()); await w(400);
  const mainBefore = await p.$eval('#hHero .hw-k', e => e.textContent).catch(() => '');
  await p.evaluate(() => { const b = [...document.querySelectorAll('#hGoals button')].find(b => /^Add goal$/.test(b.textContent.trim())); b.click(); }); await w(400);
  await p.evaluate(() => document.querySelector('#gwNext').click()); await w(200);
  ok(/Pick a goal type first/.test(await p.$eval('#gwHint', e => e.textContent)), 'wizard: a tap too early says what is missing');
  await p.evaluate(() => document.querySelector('[data-kind="car"]').click()); await w(150); await p.evaluate(() => document.querySelector('#gwNext').click()); await w(300);
  await p.type('#gwCost', '1200'); await p.evaluate(() => document.querySelector('#gwNext').click()); await w(300); await p.evaluate(() => document.querySelector('#gwNext').click()); await w(900);
  const mainAfter = await p.$eval('#hHero .hw-k', e => e.textContent).catch(() => '');
  ok(mainBefore && mainAfter === mainBefore, `the main goal stays after adding one: "${mainAfter}"`);
  await b.close();
  // ---- D. receipts: comma amounts, a future date, the Plan month, the button label
  ({ b, p, errs } = await L.launch(390, 844, 'dark'));
  await p.evaluate(() => document.querySelector('#tourSkip').click()); await w(400);
  await p.evaluate(() => document.querySelector('[data-tab="receipts"]').click()); await w(400);
  await p.evaluate(() => { const a = document.querySelector('#rcAmt'); a.scrollIntoView({ block: 'center' }); a.focus(); }); await p.type('#rcAmt', '1,200');
  ok((await p.$eval('#rcAmt', e => e.value)) === '1200', 'pesos: a typed 1,200 is twelve hundred');
  await p.evaluate(() => { document.querySelector('#rcAmt').value = ''; }); await p.type('#rcAmt', '12,5');
  ok((await p.$eval('#rcAmt', e => e.value)) === '125', 'pesos: a typed comma is dropped, not a decimal point');
  await p.evaluate(() => { document.querySelector('#rcAmt').value = ''; }); await p.type('#rcAmt', '800');
  await p.evaluate(() => { const d = document.querySelector('#rcDate'); d.value = '2027-03-05'; d.dispatchEvent(new Event('input', { bubbles: true })); d.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.evaluate(() => document.querySelector('#rcSave').click()); await w(300);
  ok(/in the future. Tap again/.test(await p.$eval('#rcMsg', e => e.textContent)), 'a future date asks first');
  const n0 = await p.evaluate(() => JSON.parse(localStorage.getItem('money-map-template-v2')).receipts.length);
  await p.evaluate(() => document.querySelector('#rcSave').click()); await w(800);
  ok((await p.evaluate(() => JSON.parse(localStorage.getItem('money-map-template-v2')).receipts.length)) === n0 + 1, 'the second tap logs it');
  ok((await p.$eval('#rcTitle', e => e.textContent)) === 'Receipts, March 2027', 'the receipts list follows it to March 2027');
  await p.evaluate(() => document.querySelector('[data-tab="month"]').click()); await w(400);
  ok((await p.$eval('#monthTxt', e => e.textContent)) === 'November 2026', 'Plan opens on November, the month in hand');
  await p.evaluate(() => document.querySelector('[data-tab="receipts"]').click()); await w(300);
  ok((await p.$eval('#rcSave', e => e.textContent)) === 'Log receipt', 'the button still says Log receipt');
  // euro: a typed comma is a decimal point
  await p.evaluate(() => document.querySelector('#gearBtn').click()); await w(300); await p.select('#curSel', '€'); await w(500);
  await p.evaluate(() => document.querySelector('[data-tab="receipts"]').click()); await w(400);
  await p.evaluate(() => { const a = document.querySelector('#rcAmt'); a.scrollIntoView({ block: 'center' }); a.focus(); a.value = ''; }); await p.type('#rcAmt', '12,5');
  ok((await p.$eval('#rcAmt', e => e.value)) === '12.5', 'euros: a typed 12,5 is 12.5');
  // Settings: Zero all shown, restore box empty, Show first steps after hiding the Next card
  await p.evaluate(() => document.querySelector('#gearBtn').click()); await w(300);
  ok(!(await p.$eval('#blankBtn', e => e.hidden)), 'Zero all is on Settings');
  ok((await p.$eval('#bk', e => e.value)) === '' && /Paste/.test(await p.$eval('#bk', e => e.placeholder)), 'the Restore box starts empty with a placeholder');
  await p.evaluate(() => document.querySelector('[data-tab="home"]').click()); await w(300);
  const hid = await p.evaluate(() => { const h = document.querySelector('[data-hidenext]'); if (!h) return false; h.click(); return true; }); await w(300);
  await p.evaluate(() => document.querySelector('#gearBtn').click()); await w(300);
  ok(hid && !(await p.$eval('#showStart', e => e.hidden)), 'after Hide, Settings offers Show first steps');
  await p.evaluate(() => document.querySelector('#showStart').click()); await w(400);
  ok(!(await p.$eval('#hNext', e => e.hidden)), 'and it brings the Next card back');
  await b.close();
  // ---- E. ticking bills is not entering them: Finish later at the tick screen leaves "check bills" as the next step
  ({ b, p, errs } = await L.launch(390, 844, 'dark'));
  hit = false; await runTour(p, P.a, async () => { if ((await title(p)) === 'Monthly bills') { hit = true; throw new Error('stop'); } }).catch(() => {});
  await p.evaluate(() => document.querySelector('#tourSkip').click()); await w(600);
  ok(/Next: check bills/.test(await p.$eval('#hNext', e => e.innerText)), 'Finish later at the bills tick screen: Home says Next: check bills');
  await b.close();
  // ---- F. a clock set back never stops saving (the revision only goes up)
  b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  ({ p, errs } = await openAt(b, '2026-12-03T10:00:00'));
  await p.evaluate(() => document.querySelector('#tourSkip').click()); await w(300);
  await p.evaluate(() => { window.__t.S.ui.name = 'Later'; window.__t.persist(); }); await w(800);
  const revLater = await p.evaluate(() => JSON.parse(localStorage.getItem('money-map-template-v2')).rev);
  await p.close();
  ({ p, errs } = await openAt(b, '2026-11-20T10:00:00', true)); /* two weeks earlier, same browser */
  await p.evaluate(() => { const t = document.querySelector('#tour'); if (t && !t.hidden) document.querySelector('#tourSkip').click(); }); await w(300);
  await p.evaluate(() => { window.__t.S.ui.name = 'Earlier'; window.__t.persist(); }); await w(900);
  const after = await p.evaluate(() => JSON.parse(localStorage.getItem('money-map-template-v2')));
  ok(after.ui.name === 'Earlier' && after.rev > revLater, `a save on a clock set back still lands (rev ${revLater} -> ${after.rev})`);
  await p.close();
  // ---- G. long names: the months table and the currency sign stay inside the screen
  ({ p, errs } = await openAt(b, null));
  const pr = JSON.parse(JSON.stringify(P.a)); pr.g.travel.name = 'Save for the wedding of my sister in Cebu next year'; pr.cur = 'NZ$';
  await runTour(p, pr); await w(800);
  await p.evaluate(() => document.querySelector('[data-tab-go="months"]').click()); await w(400);
  const mt = await p.evaluate(() => { const t = document.querySelector('#monthTable table'); const r = t.getBoundingClientRect(); const cells = [...document.querySelectorAll('#monthTable tbody tr:first-child td')].map(c => Math.round(c.getBoundingClientRect().right)); return { right: Math.round(r.right), iw: innerWidth, cells }; });
  ok(mt.right <= mt.iw && mt.cells.every(x => x <= mt.iw), `All months fits the screen with a long goal name (table right ${mt.right} of ${mt.iw})`);
  await p.evaluate(() => document.querySelector('[data-tab="home"]').click()); await w(400);
  const yen = await p.evaluate(() => { const y = document.querySelector('#hForm .yen'); const r = y.getBoundingClientRect(); return { h: Math.round(r.height), t: y.textContent }; });
  ok(yen.h < 40, `the NZ$ sign stays on one line in the amount box (${yen.h}px tall)`);
  await b.close();
  console.log(`\nUX: ${pass} pass, ${fail} fail`); if (fail) process.exitCode = 1;
})();
