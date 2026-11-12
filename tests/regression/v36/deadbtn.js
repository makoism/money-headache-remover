/* Dead-control crawler: after setup (persona Aiko), every visible button, link and summary on every tab is tapped once from the same saved state.
   A tap that changes nothing visible (no DOM change, no toast, no dialog, no focus move, no navigation, no clipboard, no file picker, no storage write) is reported. */
const L = require('/tmp/v22/lib.js'); const { w, P, runTour } = L;
const fs = require('fs');
(async () => {
  const { b, p, errs } = await L.launch(390, 844, 'dark', true);
  await runTour(p, P.a); await w(800);
  // add a receipt so lists have rows, then snapshot the state
  await w(700);
  const snap = await p.evaluate(() => localStorage.getItem('money-map-template-v2'));
  const theme = await p.evaluate(() => localStorage.getItem('money-map-theme'));
  const restore = async (tab) => {
    await p.evaluate((s, t) => { localStorage.setItem('money-map-template-v2', s); if (t) localStorage.setItem('money-map-theme', t); sessionStorage.setItem('__keep', '1'); }, snap, theme);
    await p.goto('file:///home/claude/work/money-map-team.html?sfxtest#2026-11', { waitUntil: 'load' }); await w(500);
    await p.evaluate(() => { window.__opened = []; window.open = u => { window.__opened.push(String(u)); return { closed: false, focus() {} }; }; window.__clip = 0; if (navigator.clipboard) navigator.clipboard.writeText = async () => { window.__clip++; }; window.__fileClicks = 0; HTMLInputElement.prototype.__origClick = HTMLInputElement.prototype.click; HTMLInputElement.prototype.click = function () { if (this.type === 'file') { window.__fileClicks++; return; } return this.__origClick(); }; window.__downloads = 0; const oc = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { if (this.download) { window.__downloads++; return; } return oc.call(this); }; window.confirm = () => false; });
    await p.evaluate(t => { const b = document.querySelector(`[data-tab="${t}"]`) || document.querySelector(`[data-tab-go="${t}"]`); b && b.click(); }, tab); await w(400);
  };
  const sig = () => p.evaluate(() => {
    const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const dialogs = [...document.querySelectorAll('[role=dialog], .help-menu, #cheer, #tip, .dock')].filter(e => !e.hidden && vis(e) && (e.id !== 'cheer' || e.classList.contains('on'))).map(e => e.id || e.className).join('|');
    return { html: document.body.innerHTML.length + ':' + document.body.innerText.length, dialogs, focus: document.activeElement && (document.activeElement.id || document.activeElement.tagName), scroll: scrollY, hash: location.hash, store: (localStorage.getItem('money-map-template-v2') || '').length, opened: (window.__opened || []).length, clip: window.__clip || 0, files: window.__fileClicks || 0, dl: window.__downloads || 0, details: [...document.querySelectorAll('details')].map(d => d.open ? 1 : 0).join(''), hidden: [...document.querySelectorAll('[hidden]')].length, cls: [...document.querySelectorAll('[aria-pressed],[aria-expanded],[aria-selected],[aria-checked]')].map(e => e.getAttribute('aria-pressed') + e.getAttribute('aria-expanded') + e.getAttribute('aria-selected') + e.getAttribute('aria-checked')).join('') };
  });
  const tabs = ['home', 'receipts', 'month', 'goals', 'months', 'basics'];
  const dead = [], seen = [];
  for (const tab of tabs) {
    await restore(tab);
    const ctrls = await p.evaluate(() => [...document.querySelectorAll('button, a[href], summary, [role=button], [role=tab], tr[tabindex]')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !e.disabled && !e.closest('[hidden]') && !e.closest('#tour') && !e.closest('#ask') && !e.closest('#help') && !e.closest('#rep') && !e.closest('#cam'); }).map((e, i) => ({ i, tag: e.tagName, id: e.id, text: (e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40), cls: e.className, ds: Object.assign({}, e.dataset) })));
    console.log(tab, ctrls.length, 'controls');
    for (const c of ctrls) {
      await restore(tab);
      // find the same control again by index among the same selector set
      const before = await sig();
      const ok = await p.evaluate(i => { const list = [...document.querySelectorAll('button, a[href], summary, [role=button], [role=tab], tr[tabindex]')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !e.disabled && !e.closest('[hidden]') && !e.closest('#tour') && !e.closest('#ask') && !e.closest('#help') && !e.closest('#rep') && !e.closest('#cam'); }); const e = list[i]; if (!e) return false; e.scrollIntoView({ block: 'center' }); e.click(); return true; }, c.i);
      if (!ok) { seen.push({ tab, ...c, note: 'gone' }); continue; }
      await w(450);
      const after = await sig();
      const changed = Object.keys(before).filter(k => before[k] !== after[k]);
      const label = `${tab} :: ${c.tag}${c.id ? '#' + c.id : ''} "${c.text}" ${JSON.stringify(c.ds)}`;
      seen.push({ label, changed });
      if (!changed.length) dead.push(label);
      if (process.env.DEPTH2 && changed.length) {
        const keyOf = e => e.tagName + '|' + e.id + '|' + (e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40) + '|' + JSON.stringify(Object.assign({}, e.dataset));
        const LIST = `[...document.querySelectorAll('button, a[href], summary, [role=button], [role=tab], tr[tabindex]')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !e.disabled && !e.closest('[hidden]') && !e.closest('#tour') && !e.closest('#ask') && !e.closest('#help') && !e.closest('#rep') && !e.closest('#cam'); })`;
        const baseKeys = new Set(ctrls.map(x => x.tag + '|' + x.id + '|' + x.text + '|' + JSON.stringify(x.ds)));
        const fresh = await p.evaluate((LIST, keyOfS) => { const keyOf = eval(keyOfS); return eval(LIST).map((e, i) => ({ i, k: keyOf(e) })); }, LIST, keyOf.toString());
        const news = fresh.filter(f => !baseKeys.has(f.k));
        for (const f of news) {
          await restore(tab);
          await p.evaluate(i => { const list = [...document.querySelectorAll('button, a[href], summary, [role=button], [role=tab], tr[tabindex]')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !e.disabled && !e.closest('[hidden]') && !e.closest('#tour') && !e.closest('#ask') && !e.closest('#help') && !e.closest('#rep') && !e.closest('#cam'); }); const e = list[i]; if (e) { e.scrollIntoView({ block: 'center' }); e.click(); } }, c.i);
          await w(450);
          const b2 = await sig();
          const ok2 = await p.evaluate((LIST, keyOfS, k) => { const keyOf = eval(keyOfS); const e = eval(LIST).find(x => keyOf(x) === k); if (!e) return false; e.scrollIntoView({ block: 'center' }); e.click(); return true; }, LIST, keyOf.toString(), f.k);
          if (!ok2) { seen.push({ label: label + ' >> ' + f.k, note: 'gone' }); continue; }
          await w(450);
          const a2 = await sig();
          const ch2 = Object.keys(b2).filter(k => b2[k] !== a2[k]);
          seen.push({ label: label + ' >> ' + f.k, changed: ch2 });
          if (!ch2.length) dead.push(label + ' >> ' + f.k);
        }
      }
    }
  }
  console.log('\nDEAD or no visible effect:'); dead.forEach(d => console.log(' -', d));
  fs.writeFileSync('/tmp/v36/deadbtn.json', JSON.stringify({ dead, seen }, null, 1));
  console.log('errs', errs.slice(0, 5));
  await b.close();
})();
