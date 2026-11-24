/* Setup is saved one section at a time (DECISIONS new foundation item 14). The tests that type a whole setup and then
   press "See my money" first press each section's own Save, in order, as a person does. Works with puppeteer and
   playwright pages. Gives the words of the first field error it meets ('' when every section saved). */
'use strict';
const w = ms => new Promise(r => setTimeout(r, ms));
async function saveSections(p) {
  const secs = await p.$$eval('#a3Setup [data-save]', bs => bs.map(b => b.dataset.save));
  for (const s of secs) {
    await p.click(`#a3Setup [data-save=${s}]`);
    let state = '';
    for (let i = 0; i < 40; i++) {
      await w(50);
      state = await p.$eval(`#a3Setup [data-sec=${s}]`, e => e.dataset.state).catch(() => '');
      if (state === 'saved') break;
      const err = await p.$$eval(`#a3Setup [data-sec=${s}] [data-err-for]`, es => es.map(e => e.textContent).filter(Boolean)[0] || '');
      if (err) return err;
    }
    if (state !== 'saved') return 'not saved: ' + s;
  }
  return '';
}
module.exports = { saveSections };
