#!/usr/bin/env node
/* A walker for every box and sheet (QC_ROLES.md "Scripts beat reviewers" b; QC_COMMON rule 5; M15 "an empty amount
   never traps them"; M13; M14). Mako's first run found an empty box that gave an error with no way out, and no reviewer
   had reported it. This walks every place of tests/qc_places.js on the built page as a person does and, for every box a
   person can type in:
     left empty                              a box that must be filled says so and nothing is saved
     "abc", "-5", "1.234" in an amount box   (yen has no decimals; a minus only where FORMS says one is allowed)
     0 and 45 in a day-of-the-month box
     every such try                          a plain message next to the box or in the form's error line, nothing saved
   then, with the last message still showing, the way out (Back, Close, Done, or another tab) works and saves nothing,
   and last, with every box right, the form's own button saves and says nothing wrong (so each message above was about
   the box that was wrong, not about another one).
   "Nothing saved" is the whole store (IndexedDB burrow3, every record) and localStorage, compared before and after.
   Setup keeps what is typed as a draft while typing, by design (DECISIONS new foundation 14); only its saved sections
   and the book count there.
   Count, do not sample (lesson 3): it prints how many boxes it found and of which kind; every sheet of the page shell
   (.a3-sheet) must have a row here; every place with a box must have a row in FORMS; and every <input>, <select> and
   <textarea> written in app3/src must be met on the walk or be listed in NOT_WALKED with the test that covers it.
   Boxes that only offer choices (a list, a tick, a file) are counted, not typed into: there is no wrong value to give.
   A real fault found here is not fixed here: it is in KNOWN with its reason, and in tests/QCSCRIPTS_FOUND.md. */
'use strict';
const fs = require('fs'), path = require('path');
const Q = require('./qc_places.js'), { w, tap } = Q;

/* real faults in the app this walker found (the check stays failing; see tests/QCSCRIPTS_FOUND.md) */
const KNOWN = {
};
const T = Q.make('e3_boxwalk', KNOWN), { ck } = T;

/* ---- the form of each place that has boxes ----
   save        the button that saves the form (a box inside a setup section uses that section's own Save)
   only        walk only the boxes whose label matches (the others belong to another row)
   mayBeEmpty  boxes that may be left empty, by label (a box marked data-optional by the page is one too)
   minusOk     amount boxes where a minus is allowed, by label
   fill        right values by label, for boxes that start empty (default: 1000 in an amount, 15 in a day, Walk in a name)
   wrongText   wrong values for a text box (default: only left empty)
   emptyQuiet  why pressing the button with the box empty may say nothing (the box must take the focus)
   atOnce      there is no Save: a change counts at once
   noValid     why the last step (every box right, then Save) is not done here, and the test that does it */
const SETUP = { save: null, fill: { 'The day of one': '2026-11-27' }, mayBeEmpty: [/^Called/, /^Its name/], minusOk: [/^What does your bank show today/, /^What it holds today/],   // a bank below zero is typed as it is (M47, tests/e3_overdrawn.js)
  noValid: 'the made-up book every other row walks is this form saved with every box right (qc_places.js buildBook)' };
const PL = extra => Object.assign({ save: '[data-plbtn="0"]' }, extra);
const RCF = extra => Object.assign({ save: '#rcSave', only: /^(?!Search)/ }, extra);
const CHAT = { save: '#a3ChatSend', emptyQuiet: 'a chat box: Send with nothing typed sends nothing and puts the cursor in the box', noValid: 'a message goes to the AI (tests/e3_chat.js, tests/e3_chatwalk.js)' };
const FORMS = {
  'First screen': Object.assign({ only: /^Your answer/ }, CHAT),
  'First screen: the assistant off, Use any AI and Send a file': { save: '#a3ChatAnyCheck', only: /^The AI's answer/, wrongText: ['', 'abc'], noValid: 'a right answer from another AI fills the setup (tests/e3_chat.js)' },
  'The assistant': Object.assign({ only: /^Ask or tell me something/ }, CHAT),
  'Setup': SETUP,
  /* the same sheet with other choices made: only the boxes those choices bring are walked again */
  'Setup: pay on two days, a second income every 2 weeks, a card with its close day, a bill once a year': Object.assign({}, SETUP, { only: /^(And on day|The day of one|How much of it was on the statement|Which month|Day of the month it leaves|Day its statement closes)/ }),
  'Setup: pay every 2 weeks, a second income on two days': Object.assign({}, SETUP, { only: /^(The day of one|Day of the month it lands|And on day)/ }),
  'Setup: pay lands today': Object.assign({}, SETUP, { only: /^Your pay lands today/ }),
  'Settings from "I already use the burrow on another device"': { save: '#a3CloudUse', only: /cloud code/, wrongText: ['', 'abc'], noValid: 'a right code calls the cloud (tests/e3_cloud.js)' },
  'Settings (new device)': { save: '#a3SetWordKeep', only: /ode word/, fill: { 'ode word': 'walkword' } },
  'Home (made-up numbers)': { atOnce: true, noValid: 'the day box already holds a right day' },
  'Receipts: Money went out': RCF(), 'Receipts: Money came in': RCF(), 'Receipts: Refund': RCF(), 'Receipts: Moved': RCF(),
  'Receipts: a receipt opened to change': RCF(),
  'Receipts: Search': { atOnce: true, only: /^Search/, wrongText: ['zzzz'], noValid: 'a search saves nothing' },
  'Plan: Free to spend': PL(), 'Plan: Add a line': PL(), 'Plan: a line': PL(), 'Plan: the pay': PL(), 'Plan: a bill': PL(), 'Plan: Add a bill': PL(),
  'Plan: Add a goal': PL(), 'Plan: a goal': PL({ save: '[data-plbtn="1"]' }), 'Plan: a goal, Set aside': PL({ only: /Set aside now/, fill: { 'Set aside now': '1000' }, noValid: 'how much can be set aside depends on what the bank can spare that day (tests/e3_plan.js)' }),
  'Plan: a card': PL({ mayBeEmpty: [/^Day the statement closes/] }), 'Plan: Add a card': PL(), 'Plan: Add a loan': PL(), 'Plan: a loan': PL(),
  'Check your bank': { save: '#a3CheckSave', mayBeEmpty: [/^What is on .* now\?/], minusOk: [/^What does .* show today\?/] },   // a bank below zero (M47, tests/e3_overdrawn.js)   // a card's figure is asked, never needed: left empty it is not checked
  'Settings': { save: '#a3SetWordKeep', only: /ode word/, fill: { 'ode word': 'walkword' } },
  'Settings: a backup file locked with a code': { save: '#a3BkSave', only: /Code for this file/, wrongText: ['', 'abc'], noValid: 'a right code saves a file to the device (tests/e3_backup.js)' },
  'Settings: I have a code': { save: '#a3CloudUse', only: /cloud code/, wrongText: ['', 'abc'], noValid: 'a right code calls the cloud (tests/e3_cloud.js)' },
  'Reminders': { atOnce: true, noValid: 'nothing is saved by Reminders: it makes a calendar file (tests/e3_remind.js)' },
  'Add statements': { save: null, noValid: 'only files to choose here (tests/e3_stmt.js)' },
  'Add statements: any AI instead': { save: '#a3StmtCheck', only: /answer/, wrongText: ['', 'abc'], noValid: 'a right answer needs a statement read first (tests/e3_stmt.js)' },
};
/* boxes written in app3/src that this walk never meets, each with why and the test that covers it */
const NOT_WALKED = {
  'checkin3.js #a3l${i}': 'the day a late pay landed: shown only for a pay that was not seen on its day (tests/e3_walk.js)',
  'checkin3.js data-gapspend': 'a tick, shown once the bank figure typed is lower than expected (tests/e3_checkgap.js)',
  'checkin3.js data-gapline': 'a list, shown once the bank figure typed is lower than expected (tests/e3_checkgap.js)',
  'settings3.js #a3BkFile': 'the hidden file chooser behind Restore from a file (tests/e3_backup.js)',
  'settings3.js #a3BkOpen': 'the code for a locked backup file: needs a locked file chosen first (tests/e3_backup.js)',
  'stmt3.js data-readacct': 'a list in the review of a statement that was read (tests/e3_stmt.js)',
  'stmt3.js data-skip': 'a tick in the review of a statement that was read (tests/e3_stmt.js)',
  'stmt3.js data-cat': 'a list in the review of a statement that was read (tests/e3_stmt.js)',
  'stmt3.js #a3pk-${esc3(l.id)}': 'a list in the review of a statement that was read (tests/e3_stmt.js)',
  'stmt3.js #a3mv-${esc3(l.id)}': 'a list in the review of a statement that was read (tests/e3_stmt.js)',
  'stmt3_ai.js #a3WordIn': 'the code word box, shown only when the page\'s server asks for one (tests/e3_invite.js)',
};
const WRONG = { amount: ['', 'abc', '-5', '1.234'], day: ['', '0', '45'], date: [''], time: [''], text: [''] };
const TYPED = Object.keys(WRONG);
const PLAIN = m => /[A-Za-z]{3}/.test(m) && !/undefined|NaN|\bnull\b|\[object|Error:|TypeError|function \(/.test(m);

/* ---- what the page shows, read from the page ---- */
const list = (p, root) => p.evaluate(root => {
  const r = document.querySelector(root); if (!r) return [];
  const vis = e => e.getClientRects().length > 0 && e.checkVisibility({ visibilityProperty: true });
  const lab = e => { const l = e.id && document.querySelector(`label[for="${CSS.escape(e.id)}"]`); return ((l ? l.textContent : '') || e.getAttribute('aria-label') || (e.closest('label') || {}).textContent || e.placeholder || '').replace(/\s+/g, ' ').trim().slice(0, 80); };
  const kind = e => (e.tagName === 'SELECT' ? 'list' : e.tagName === 'TEXTAREA' ? (e.readOnly ? 'read only' : 'text') : e.type === 'checkbox' || e.type === 'radio' ? 'tick' : e.type === 'file' ? 'file'
    : e.hasAttribute('data-amount') || e.dataset.input === 'amount' ? 'amount' : e.type === 'number' ? 'day' : e.type === 'date' ? 'date' : e.type === 'time' ? 'time' : 'text');
  const seen = {};
  r.querySelectorAll('[data-qcbox]').forEach(e => e.removeAttribute('data-qcbox'));
  return [...r.querySelectorAll('input, select, textarea')].filter(vis).map((e, i) => {
    e.setAttribute('data-qcbox', String(i));
    const label = lab(e), k = kind(e), key = label + '|' + k; seen[key] = (seen[key] || 0) + 1;
    const sec = e.closest('[data-sec]'), sb = sec && sec.querySelector('[data-save]');
    return { i, kind: k, label, name: `"${label}"${seen[key] > 1 ? ' (' + seen[key] + ')' : ''}`, value: e.value, optional: e.hasAttribute('data-optional'), ownSave: sb ? `${root} [data-save="${sb.dataset.save}"]` : '',
      tag: e.tagName.toLowerCase(), id: e.id, datas: [...e.attributes].map(a => a.name).filter(a => /^data-/.test(a) && !/^data-(qc|input|error|bound)/.test(a)), names: e.tagName === 'SELECT' ? [...e.options].map(o => o.value) : [] };
  });
}, root);
/* the messages a person can see in the form: its error lines, an alert, the line next to a box */
const MSG = '.a3-err, [role=alert], [data-err-for], .a3-warn[role=status]';
const msgs = (p, root, which) => p.evaluate(([root, MSG]) => { const r = document.querySelector(root); if (!r) return [];
  return [...r.querySelectorAll(MSG)].filter(e => e.getClientRects().length > 0 && e.checkVisibility({ visibilityProperty: true })).map(e => e.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean); }, [root, which || MSG]);
/* a measuring aid, not a person's step: the lines are wiped before each try, so a message left by the try before is
   never counted for this one */
const wipe = (p, root) => p.evaluate(([root, MSG]) => { const r = document.querySelector(root); if (r) r.querySelectorAll(MSG).forEach(e => { if (!e.children.length) e.textContent = ''; }); }, [root, MSG]);
/* everything kept on the device: every record of IndexedDB burrow3 and localStorage (setup's typed draft left out) */
const snap = p => p.evaluate(() => new Promise(res => {
  const out = { ls: Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)]) };
  const rq = indexedDB.open('burrow3');
  rq.onerror = () => res(JSON.stringify(out));
  rq.onsuccess = () => {
    const db = rq.result, names = [...db.objectStoreNames];
    if (!names.length) { db.close(); res(JSON.stringify(out)); return; }
    const tx = db.transaction(names);
    for (const n of names) { const s = tx.objectStore(n), a = s.getAll(), k = s.getAllKeys(); a.onsuccess = () => { out[n] = (out[n] || {}); out[n].v = a.result; }; k.onsuccess = () => { out[n] = (out[n] || {}); out[n].k = k.result; }; }
    tx.oncomplete = () => { db.close(); /* setup's draft: only its saved sections count (what is typed is kept while typing, by design), and a device
         record that holds nothing yet is the same as none */
      if (out.device) { for (const d of out.device.v || []) if (d && typeof d === 'object') { const s = d.setup; if (s && s.sections && Object.keys(s.sections).length) d.setup = { sections: s.sections, days: s.days }; else delete d.setup; }
        out.device = (out.device.v || []).filter(d => !(d && typeof d === 'object' && !Object.keys(d).length)); }
      res(JSON.stringify(out)); };
  };
}));
const changed = (a, b) => { const x = JSON.parse(a), y = JSON.parse(b); return Object.keys(Object.assign({}, x, y)).filter(k => JSON.stringify(x[k]) !== JSON.stringify(y[k])).map(k => k === 'ls' ? 'localStorage ' + y.ls.filter(e => !x.ls.some(f => f[0] === e[0] && f[1] === e[1])).map(e => e[0]).join(',') : 'the store\'s ' + k).join(', ') + ' changed'; };
const sel = b => `[data-qcbox="${b.i}"]`;
const put = async (p, b, v) => { await p.fill(sel(b), v); };
const leave = p => p.evaluate(() => { const a = document.activeElement; if (a && a.blur) a.blur(); });

(async () => {
  const places = Q.PLACES.concat([
    { name: 'Receipts: Search', state: 'book', sheet: null, root: '#a3Rc', out: 'tab', open: async p => { await Q.tabTo(p, 'receipts'); } },
    { name: 'Plan: a goal, Set aside', state: 'book', sheet: null, root: '#a3Plan', out: '#plBack', open: async p => { await Q.tabTo(p, 'plan'); await tap(p, '[data-goal]'); } },
  ]);
  const PART = process.argv[2];   // node tests/e3_boxwalk.js Plan : only the places with that in their name, and no counts (never a pass)
  const ctx = {}, counts = {}, met = [], walkedIn = {};
  let total = 0, tries = 0, walks = 0;
  for (const place of places) {
    if (PART && !place.name.includes(PART)) continue;
    if (!ctx[place.state]) {
      ctx[place.state] = await T.open();
      if (place.state === 'book') { const e = await Q.buildBook(ctx.book.p); if (!ck('the made-up book is built through the page (setup, a line, a goal, a loan, one spend)', e === '', e)) break; }
    }
    const p = ctx[place.state].p, form = FORMS[place.name];
    const fresh = async () => { await Q.reach(p, place); return (await list(p, place.root)); };
    let all;
    try { all = await fresh(); } catch (e) { ck(`${place.name}: can be reached`, false, e.message); continue; }
    for (const b of all) met.push(b);
    const mine = bs => bs.filter(b => !form || !form.only || form.only.test(b.label));
    let boxes = mine(all);
    if (place.sheet) walkedIn[place.sheet] = true;
    if (place.root === '#a3Chat') walkedIn.a3Chat = true;
    if (!all.length) { console.log(`     ${place.name}: no boxes`); }
    else if (!ck(`${place.name}: its ${all.length} boxes have a row in the walker (FORMS)`, !!form)) continue;
    /* every box right: the values a box already holds are right; an empty one gets a made-up right value */
    const optional = b => b.optional || ((form && form.mayBeEmpty) || []).some(r => r.test(b.label));
    const right = {};
    const fillRight = async bs => {
        for (const b of bs) {
          const given = Object.keys(form.fill || {}).find(k => b.label.includes(k));
          let v = b.value;
          if (v === '' && given) v = form.fill[given];
          else if (v === '' && b.kind === 'amount' && !optional(b)) v = '1000';
          else if (v === '' && b.kind === 'day' && !optional(b)) v = '15';
          else if (v === '' && b.kind === 'text' && /^(Name|Called)/.test(b.label) && !optional(b)) v = 'Walk ' + (++walks);
          else if (v === '' && b.kind === 'list') { const first = b.names.find(x => x !== ''); if (first !== undefined) { await p.selectOption(sel(b), first); v = first; } }
          if (v !== b.value && b.kind !== 'list') await put(p, b, v);
          right[b.name] = v;
        }
        await leave(p); await w(60);
    };
    const saveOf = b => b.ownSave || form.save;
    if (form) {
      total += boxes.length; for (const b of boxes) counts[b.kind] = (counts[b.kind] || 0) + 1;
      await fillRight(boxes);
      let lastWrong = null;
      for (const b0 of boxes.filter(b => TYPED.includes(b.kind))) {
        const wrongs = b0.kind === 'text' ? (form.wrongText || ['']) : WRONG[b0.kind];
        for (const v of wrongs) {
          const b = boxes.find(x => x.name === b0.name); if (!b) { ck(`${place.name}: ${b0.name} is there again after the form is opened again`, false); break; }
          if (v === right[b.name]) continue;   // left empty is this box's right value: the last step (every box right) covers it
          if (v === '-5' && (form.minusOk || []).some(r => r.test(b.label))) continue;
          const what = `${place.name}: ${b.name} ${v === '' ? 'left empty' : 'given "' + v + '"'}`;
          tries++;
          try {
            await put(p, b, v); await w(40);
            const typedNow = await p.$eval(sel(b), e => e.value).catch(() => null); let typedKept = false;
            await wipe(p, place.root);
            const before = await snap(p);
            if (form.atOnce) await leave(p); else await p.click(saveOf(b));
            await w(320);
            const after = await snap(p), m = await msgs(p, place.root);
            let there = await p.$(sel(b)), now = there ? await p.$eval(sel(b), e => e.value) : null;
            if (!there && form.atOnce) { boxes = mine(await list(p, place.root)); const again = boxes.find(x => x.name === b.name); if (again) { there = true; now = again.value; if (now === v) typedKept = true; b.i = again.i; } }   // the screen drew itself again around the box
            const saved = before !== after, diff = changed(before, after);
            let ok, why = '';
            if (typedKept && b.kind === 'text' && !m.length && !saved) { ck(what + ': what was typed stays, nothing saved', true); await put(p, b, right[b.name]); continue; }
            if (saved) { ok = false; why = 'it was saved (' + diff + ')' + (m.length ? ', with the message: ' + m.join(' / ') : ', and nothing was said'); }
            else if (m.length) { ok = m.every(PLAIN); why = 'the message is not plain words: ' + m.join(' / '); }
            else if (b.kind === 'text' && v !== '' && typedNow === v && form.atOnce) ok = true;   // a search: what was typed stays, nothing to refuse
            else if (form.atOnce && now !== null && now !== v) ok = true;   // the box went back to a right value by itself
            else if (v === '' && form.emptyQuiet && await p.$eval(sel(b), e => e === document.activeElement)) ok = true;
            else { ok = false; why = 'nothing was saved, and nothing says why: no message next to the box or in the form' + (form.atOnce ? ', and the box stays as typed' : ''); }
            ck(what + ': a plain message, nothing saved', ok, why);
            lastWrong = b.name;
            if (saved || !there) { boxes = mine(await fresh()); await fillRight(boxes); lastWrong = null; }
            else await put(p, b, right[b.name]);
          } catch (e) { ck(what + ': a plain message, nothing saved', false, 'the walker could not do it: ' + e.message.split('\n')[0]); boxes = mine(await fresh()); await fillRight(boxes); lastWrong = null; }
        }
      }
      /* the way out, with a message showing when the form has a box that can be wrong */
      const firstTyped = boxes.find(b => TYPED.includes(b.kind) && !form.atOnce && WRONG[b.kind].concat(form.wrongText || []).some(v => v !== right[b.name] && !(v === '' && form.emptyQuiet)));
      if (firstTyped && !form.atOnce) {
        const v = (firstTyped.kind === 'text' ? form.wrongText || [''] : WRONG[firstTyped.kind]).find(x => x !== right[firstTyped.name]);
        await put(p, firstTyped, v); await p.click(saveOf(firstTyped)); await w(250);
      }
    }
    {
      const before = await snap(p);
      let out = '';
      try {
        if (place.out === 'tab') { await tap(p, place.state === 'empty' || place.name.startsWith('Home') ? '[data-tab=plan]' : '[data-tab=home]'); }
        else await tap(p, place.out, 300);
      } catch (e) { out = 'the way out could not be pressed: ' + e.message.split('\n')[0]; }
      const s = await Q.seen(p), after = await snap(p);
      const gone = place.out === 'tab' ? s.panels.length === 1 && s.sheets.length === 0 : place.sheet ? !s.sheets.includes(place.sheet) : place.closed ? await p.evaluate(place.closed) : !(await p.$(place.out));
      const somewhere = s.panels.length + s.sheets.length === 1;
      ck(`${place.name}: the way out (${place.out === 'tab' ? 'another tab' : await wordsOf(p, place, ctx)}) works${form && !form.atOnce && boxes.some(b => TYPED.includes(b.kind)) ? ' with a message showing' : ''}, saves nothing and lands on one screen`,
        !out && gone && somewhere && before === after, out || JSON.stringify(s) + (before === after ? '' : ' and something was saved'));
    }
    /* every box right, then the form's own button: it saves and says nothing wrong */
    if (form && !form.noValid && boxes.length) {
      boxes = mine(await fresh()); await fillRight(boxes);
      const b = boxes.find(x => x.kind === 'amount' && x.value !== '') || boxes.find(x => x.kind === 'amount' && !optional(x)) || boxes[0];
      const d = boxes.find(x => x.kind === 'day' && x.value !== '');
      if (b.kind === 'amount' && b.value !== '') await put(p, b, String(Number(b.value) + 100));
      else if (d) await put(p, d, String(Number(d.value) % 28 + 1));   // no amount to change: its day   // a form opened to change: change its amount
      await wipe(p, place.root);
      const before = await snap(p);
      await p.click(b.ownSave || form.save); await w(450);
      const after = await snap(p), m = await msgs(p, place.root, '.a3-err, [role=alert], [data-err-for]');   // "kept" and "saved" notices are not errors
      ck(`${place.name}: with every box right, its button saves and says nothing wrong`, before !== after && !m.length, (before === after ? 'nothing was saved. ' : '') + m.join(' / '));
    }
  }
  for (const s of Object.keys(ctx)) await ctx[s].c.close();
  if (PART) { console.log(`e3_boxwalk: PARTIAL (only "${PART}"), ${total} boxes, ${tries} tries; page errors: ${T.errs.join(' | ') || 'none'}`); process.exit(1); }

  /* ---- the counts ---- */
  const sheets = await (async () => { const o = await T.open(); await Q.go(o.p, Q.DAY0); const s = await Q.shellSheets(o.p); await o.c.close(); return s; })();
  for (const s of sheets) ck(`the sheet #${s} of the page shell has a row in the walker and was walked`, !!walkedIn[s]);
  ck('the page shell has sheets to walk', sheets.length >= 5, sheets.join());
  ck('the assistant\'s panel (#a3Chat, the bar at the foot) has a row in the walker and was walked', !!walkedIn.a3Chat);
  /* every box written in app3/src is met on the walk, or is in NOT_WALKED with its reason */
  const SRC = path.join(__dirname, '../src'), tags = [];
  for (const f of fs.readdirSync(SRC).filter(f => /\.(js|html)$/.test(f))) {
    for (const m of fs.readFileSync(path.join(SRC, f), 'utf8').matchAll(/<(input|select|textarea)\b[^>]*>/g)) {
      const t = m[0], id = (t.match(/\bid="([^"]*)"/) || [])[1], data = (t.match(/\b(data-(?!amount|money|optional|f\b)[a-z-]+)/) || [])[1];
      const idFixed = id && f === 'plan3.js' ? id.replace('${id}', 'pl-${key}') : id;
      tags.push({ f, key: f + ' ' + (id ? '#' + id : data || t), idRe: idFixed ? new RegExp('^' + idFixed.split(/\$\{[^}]*\}/).map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.+') + '$') : null, data, tag: m[1] });
    }
  }
  const metTag = t => met.some(b => b.tag === t.tag && (t.idRe ? t.idRe.test(b.id) : t.data ? b.datas.includes(t.data) : false));
  const missed = [...new Set(tags.filter(t => !metTag(t)).map(t => t.key))];
  for (const k of missed) if (!(k in NOT_WALKED)) ck(`a box written in app3/src is met on the walk or listed in NOT_WALKED: ${k}`, false, 'the walker never saw it: add a place for it in tests/qc_places.js, or list it in NOT_WALKED with the test that covers it');
  for (const k of Object.keys(NOT_WALKED)) ck(`NOT_WALKED is true: ${k} is written in app3/src and was not met`, missed.includes(k), 'it was met, or it is gone from the source: take it out of NOT_WALKED');
  ck('no page errors on the whole walk', T.errs.length === 0, T.errs.join(' | '));
  console.log(`\nBOXES: ${total} boxes walked in ${Object.keys(FORMS).length} forms, ${tries} wrong values tried (` + Object.keys(counts).sort().map(k => `${counts[k]} ${k}`).join(', ') + ')');
  console.log(`BOXES IN THE SOURCE: ${tags.length} written in app3/src, ${new Set(tags.map(t => t.key)).size} different, ${missed.length} not met on the walk:`);
  for (const k of missed) console.log(`  NOT WALKED ${k}: ${NOT_WALKED[k] || 'no reason given'}`);
  console.log(`SHEETS: ${sheets.length} in the page shell (${sheets.join(', ')}), ${places.length} places walked`);
  await T.finish();
})().catch(e => { console.log('FAIL crashed ' + e.stack); process.exit(1); });

/* the words on the way-out button, for the check's name */
async function wordsOf(p, place) { return ({ '#plBack': 'Back', '#a3SetupX': 'Back', '#a3CheckX': 'Back', '#a3StmtX': 'Back', '#a3SetClose': 'Done', '#a3RemClose': 'Close', '#a3ChatClose': 'Close' })[place.out] || place.out; }
