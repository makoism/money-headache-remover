const { launch, w, runTour } = require('/tmp/v22/lib.js');
const PR = { name: 'M', cur: '¥', pay: 500000, extra: 0, bank: 300000, bills: ['rent', 'util', 'food', 'net', 'phone'], amt: { rent: 120000, util: 15000, food: 60000, net: 6000, phone: 8000 }, goals: ['travel', 'rainy'], g: {} };
let bad = 0;
const ok = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } else console.log('ok  ', m); };
const skipCo = p => p.evaluate(() => { const b = document.querySelector('#co:not([hidden]) #coSkip'); if (b) b.click(); });
const setSel = (p, id, v) => p.evaluate((id, v) => { const e = document.querySelector(id); e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); }, id, v);
const state = p => p.evaluate(() => {
  const q = s => document.querySelector(s);
  return {
    freq: q('#rcFreq').value, day: q('#rcDay').value, dom: q('#rcDom').value, time: q('#rcTime').value,
    dayHidden: q('.rf-day').hidden, domHidden: q('.rf-dom').hidden, when: q('#rcWhen').textContent,
    g: q('[data-cal=google]').href, o: q('[data-cal=outlook]').href, y: q('[data-cal=yahoo]').href, text: q('#rcEventText').value,
  };
});
(async () => {
  const { b, p, errs } = await launch(420, 900);
  await runTour(p, PR); await w(900);
  await p.evaluate(() => sessionStorage.setItem('__keep', '1'));
  await skipCo(p);
  await p.evaluate(() => document.querySelector('#tab-receipts').click()); await w(500); await skipCo(p);
  let s = await state(p);
  console.log('default', JSON.stringify({ f: s.freq, d: s.day, t: s.time, when: s.when }));
  ok(s.freq === 'weekly' && !s.dayHidden && s.domHidden, 'weekly shows the weekday picker only');
  // monthly, last day, 07:30
  await setSel(p, '#rcFreq', 'monthly'); await w(200);
  await setSel(p, '#rcDom', '-1'); await w(200);
  await setSel(p, '#rcTime', '07:30'); await w(200);
  s = await state(p);
  ok(s.freq === 'monthly' && s.dayHidden && !s.domHidden, 'monthly shows the day-of-month picker only');
  ok(/last day of every month at/.test(s.when), 'words: ' + s.when);
  ok(decodeURIComponent(s.g).includes('RRULE:FREQ=MONTHLY;BYMONTHDAY=-1'), 'google link repeats monthly on the last day');
  ok(/T073000/.test(s.g), 'google link starts at 07:30');
  ok(/Repeats the last day of every month/.test(s.text), 'copy text says how it repeats');
  ok(!/recur/.test(s.o) && !/recur/.test(s.y), 'outlook/yahoo links are one-time (the page tells the person to set Repeat)');
  // reload
  await p.reload({ waitUntil: 'load' }); await w(1200); await skipCo(p);
  await p.evaluate(() => document.querySelector('#tab-receipts').click()); await w(500); await skipCo(p);
  const s2 = await state(p);
  ok(s2.freq === 'monthly' && s2.dom === '-1' && s2.time === '07:30', 'monthly / last day / 07:30 survive a reload: ' + [s2.freq, s2.dom, s2.time].join(' '));
  // every two weeks on Friday
  await setSel(p, '#rcFreq', 'biweekly'); await setSel(p, '#rcDay', '5'); await w(200);
  const s3 = await state(p);
  ok(decodeURIComponent(s3.g).includes('FREQ=WEEKLY;INTERVAL=2;BYDAY=FR'), 'biweekly Friday rule');
  ok(/every other Friday/.test(s3.when), 'words: ' + s3.when);
  await setSel(p, '#rcFreq', 'daily'); await w(200);
  const s4 = await state(p);
  ok(s4.dayHidden && s4.domHidden && decodeURIComponent(s4.g).includes('FREQ=DAILY'), 'daily hides both pickers');
  // does the tour step read the same settings?
  await p.evaluate(() => document.querySelector('#tab-basics').click()); await w(400); await skipCo(p);
  const hasRedo = await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /redo.*setup|set up again|walk me through/i.test(x.textContent)); return !!b; });
  console.log('setup-again button present:', hasRedo);
  console.log('errors', errs.join(' | ') || 'none');
  await b.close();
  console.log(bad + ' failures');
})();
