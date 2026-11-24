/* ---------- the cloud copy on the page (SCHEMA_V3 1, 2.2, 2.3; DECISIONS_ROUND2 D5, E3, AQ1 to AQ4, AW2, AW5, AW7, BD5) ----------
   Turning it on makes a code, shows it once and asks the person to keep it; "I have a code" ties this device to a copy
   made on another one. While it is on: the copy is taken on opening, sent when the person leaves the app (going to the
   background or closing the tab) and after a change at most every 90 seconds, and Send now sends at once. Each sync is
   CLOUD3.syncOnce (fetch, join with the engine's sync against this device's base, write with the revision it is based
   on). The same record changed on two devices, and any one-device check that fails after the join, waits as a question in
   Settings; the version not picked stays kept (keptVersions) so it can come back. A cloud copy deleted on another device
   (the vault's 410) turns it off here with its own words (gone), until it is turned on again with a new code.
   This device's cloud state is device-only (SCHEMA_V3 2.2: code, base, baseRev, when last sent, when it fell behind),
   kept beside the book (E3.rec 'cloud'), never in the copy that is sent or in a backup.
   Where the vault is: the page's own address when it is served (the site), else the site's address (RELAY3, from
   wip/team/RELAY at build time). A try book never sends anything.
   Earlier versions: the vault keeps the copy's last 10 earlier versions (?versions=1, one read with ?rev=N). Settings
   lists them by when they were sent, and one is restored the way a backup file is (restoreBook3 in settings3.js: the copy
   here kept first, every record restamped so it reaches the other devices with the next send), after saying so. */
const C3 = { st: null, busy: false, again: false, timer: 0, lastSync: 0, dirty: false, applying: false, shown: null, why: null, reach: null };
const CLOUD_EVERY3 = 90000, CLOUD_SOON3 = 5000;
const cloudBase3 = () => (/^https?:$/.test(location.protocol) ? location.origin : (typeof RELAY3 === 'string' ? RELAY3.replace(/\/$/, '') : ''));
const cloudApi3 = () => CLOUD3.client({ base: cloudBase3 });
function deviceBy3() {
  try {
    let d = localStorage.getItem('burrow3.device');   // the same key store/idb.js keeps the device part under
    if (!d || !/^[a-z0-9]{6}$/.test(d)) { d = E3.newId().slice(0, 6); localStorage.setItem('burrow3.device', d); }
    return d;
  } catch (e) { return E3.newId().slice(0, 6); }
}
const nowIso3 = () => (typeof BurrowClock === 'object' ? BurrowClock.nowIso() : new Date().toISOString());
async function cloudState3() { if (!C3.st) C3.st = (await E3.rec('cloud')) || { on: false }; return C3.st; }
async function putCloud3(st) { C3.st = st; await E3.rec('cloud', st); }
async function reachable3() {
  const b = cloudBase3(); if (!b) return false;
  try {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 6000);
    const r = await fetch(b + '/api/health', { cache: 'no-store', signal: ctl.signal }); clearTimeout(t);
    const j = r.ok ? await r.json() : null;
    return !!(j && j.vault);
  } catch (e) { return false; }
}
const WHY3 = {
  net: 'The cloud cannot be reached right now. Your money is safe on this device, and it sends again by itself.',
  code: 'The cloud copy does not accept this code any more. Turn it off here, then turn it on again to start a new one.',
  busy: 'The cloud is busy. It tries again by itself.',
  server: 'The cloud did not take the copy. It tries again by itself.',
  newer: 'The cloud copy was saved by a newer version of the app. Update the app to use it. Nothing here was changed.',
  key: 'The cloud copy could not be opened with this code.',
  damaged: 'The cloud copy could not be read. Nothing here was changed.',
  fmt: 'The cloud copy is not one this version can read. Update the app. Nothing here was changed.',
  deleted: 'The cloud copy was deleted on another device. This device keeps its money. Turn the cloud copy on again with a new code to share it.',
};
const when3 = ms => { const d = new Date(ms); return d.toDateString() === new Date().toDateString() ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); };

/* one sync; the book here takes what it gives, joined again with any change made while it ran */
async function syncNow3(opts) {
  opts = opts || {};
  const st = await cloudState3();
  if (!st.on || E3.mode === 'try') return null;
  if (C3.busy) { C3.again = true; return null; }
  C3.busy = true; clearTimeout(C3.timer);
  const snap = E3.book;
  try {
    const keys = await CLOUD3.keysFor(st.code);
    const r = await CLOUD3.syncOnce({ api: cloudApi3(), pack: BurrowPack, S: BurrowEngine.sync, keys, device: { base: st.base, baseRev: st.baseRev }, copy: snap, keepalive: !!opts.leaving, now: nowIso3() });
    C3.lastSync = Date.now();
    if (!r.ok && r.why === 'deleted') {   // 410: deleted on another device; this device stops until it is turned on again
      C3.why = null; C3.dirty = false;
      await putCloud3({ on: false, gone: Date.now() });
      if (!SET3.open) msg3(WHY3.deleted);
      return r;
    }
    if (!r.ok) {
      C3.why = r.why;
      await putCloud3(Object.assign({}, st, { base: r.device.base, baseRev: r.device.baseRev, failAt: st.failAt || Date.now() }));
      return r;
    }
    C3.why = null; C3.dirty = false;
    let next = r.copy;
    if (E3.book !== snap) { next = BurrowEngine.sync.sync(snap, E3.book, r.copy); C3.dirty = true; }   // changed while it ran: joined, sent next time
    if (S3same(next, E3.book) === false) {
      if (r.firstJoin && E3.book) await keepCopy3('Before this device joined the cloud copy');
      C3.applying = true;
      const ok = await E3.replace(next);
      C3.applying = false;
      if (ok) { renderHome3(); if (typeof renderPlan3 === 'function') { try { renderPlan3(); } catch (e) { /* the plan lane's own */ } } }
    }
    await putCloud3(Object.assign({}, st, { base: r.device.base, baseRev: r.device.baseRev, sentAt: r.pushed || !st.sentAt ? Date.now() : st.sentAt, failAt: 0 }));
    const qs = r.questions.length;
    if (qs && !SET3.open) msg3('Your devices changed the same thing. Open Settings to choose which to keep.');
    return r;
  } finally {
    C3.busy = false;
    if (SET3.open) paintCloud3();
    if (C3.again) { C3.again = false; later3(CLOUD_SOON3); }
    else if (C3.dirty) later3(CLOUD_EVERY3);
  }
}
const S3same = (a, b) => BurrowEngine.sync.canon(CLOUD3.noRev(a || {})) === BurrowEngine.sync.canon(CLOUD3.noRev(b || {}));
function later3(ms) { clearTimeout(C3.timer); C3.timer = setTimeout(() => syncNow3(), ms); }
/* after a save: send within 5 seconds, but at most every 90 seconds [D5] */
function changed3() {
  if (C3.applying || !C3.st || !C3.st.on) return;
  C3.dirty = true;
  later3(Math.max(CLOUD_SOON3, C3.lastSync + CLOUD_EVERY3 - Date.now()));
}
/* the start file calls this once the book is loaded: take the cloud copy on opening */
async function startCloud3() {
  if (E3.mode === 'try') return;
  E3.onSaved(changed3);
  const st = await cloudState3();
  if (st.on) syncNow3();
}
const leaving3 = () => { if (C3.st && C3.st.on && C3.dirty) syncNow3({ leaving: true }); };
document.addEventListener('visibilitychange', () => { if (document.hidden) leaving3(); });
addEventListener('pagehide', leaving3);

/* ---------- the card in Settings ---------- */
function cloudCard3() {
  return `<div class="a3-card" data-card="cloud"><h2>Cloud copy</h2>
    <p class="a3-next" id="a3CloudState">Checking.</p>
    <div id="a3CloudBody"></div>
    <div id="a3CloudQs"></div></div>`;
}
function wireCloud3() { paintCloud3(); }
async function paintCloud3() {
  const body = $('#a3CloudBody'), state = $('#a3CloudState'); if (!body) return;
  const st = await cloudState3();
  if (!SET3.open) return;
  if (C3.shown) {   // a new code, shown once
    state.textContent = 'Write this code down, or keep it in a password manager. It is the only way to open the cloud copy, from this device or another. Nobody else can get it back for you.';
    body.innerHTML = `<p class="a3-code" data-cloud="code">${esc3(CLOUD3.codeShow(C3.shown))}</p>
      <div class="a3-actions"><button type="button" class="a3-btn solid" id="a3CloudSaved">I saved the code</button><button type="button" class="a3-btn" id="a3CloudCancel">Cancel</button></div>`;
    $('#a3CloudSaved').addEventListener('click', async () => {
      const code = C3.shown; C3.shown = null;
      await putCloud3({ on: true, code, base: null, baseRev: null, sentAt: 0, failAt: 0 });
      paintCloud3(); await syncNow3();
    });
    $('#a3CloudCancel').addEventListener('click', () => { C3.shown = null; paintCloud3(); });
    return;
  }
  if (!st.on) {
    state.textContent = st.gone ? WHY3.deleted : 'Off. Your money is on this device only. A cloud copy is locked with a code only you have, and keeps your phone and computer the same.';
    body.innerHTML = `<div class="a3-actions">${E3.book ? '<button type="button" class="a3-btn solid" id="a3CloudOn">Keep a copy in the cloud</button>' : ''}
        <button type="button" class="a3-btn" id="a3CloudHave">I have a code</button></div><div id="a3CloudForm"></div>`;
    if ($('#a3CloudOn')) $('#a3CloudOn').addEventListener('click', turnOn3);
    $('#a3CloudHave').addEventListener('click', haveCode3);
    paintQuestions3();
    return;
  }
  const busy = C3.busy && !st.sentAt;
  state.textContent = C3.why ? WHY3[C3.why] || WHY3.server
    : busy ? 'On. Sending the first copy.'
    : st.sentAt ? `On. Last in step with the cloud at ${when3(st.sentAt)}.` : 'On.';
  const behind = st.failAt ? `<p class="a3-warn" data-cloud="behind">Changes made since ${esc3(when3(st.failAt))} are on this device only for now.</p>` : '';
  body.innerHTML = `${behind}<div class="a3-actions"><button type="button" class="a3-btn" id="a3CloudNow">Send now</button>
      <button type="button" class="a3-btn" id="a3CloudShow">Show code</button>
      <button type="button" class="a3-btn" id="a3CloudVers">Earlier versions</button>
      <button type="button" class="a3-btn" id="a3CloudOff">Turn off</button></div><div id="a3CloudForm"></div>`;
  $('#a3CloudNow').addEventListener('click', async () => { state.textContent = 'Sending.'; await syncNow3(); });
  $('#a3CloudShow').addEventListener('click', () => { $('#a3CloudForm').innerHTML = `<p class="a3-code" data-cloud="code">${esc3(CLOUD3.codeShow(st.code))}</p>`; });
  $('#a3CloudOff').addEventListener('click', offAsk3);
  $('#a3CloudVers').addEventListener('click', versions3);
  paintQuestions3();
}
/* the cloud's earlier versions, newest first; one is restored after asking (draft words, FOR_MAKO copy pass) */
async function versions3() {
  const f = $('#a3CloudForm'); f.innerHTML = '<p class="a3-sub">Looking for earlier versions.</p>';
  const st = await cloudState3();
  const keys = await CLOUD3.keysFor(st.code);
  const r = await CLOUD3.fetchVersions({ api: cloudApi3(), keys });
  if (!SET3.open || !$('#a3CloudForm')) return;
  if (!r.ok) { f.innerHTML = `<p class="a3-warn">${esc3(WHY3[r.why] || WHY3.server)}</p>`; return; }
  if (!r.versions.length) { f.innerHTML = '<p class="a3-sub" data-cloud="versions">The cloud has no earlier versions of this copy yet.</p>'; return; }
  f.innerHTML = `<p class="a3-next" data-cloud="versions">The cloud keeps the last ${r.versions.length === 1 ? 'version' : r.versions.length + ' versions'} before the one it holds now. Restoring one replaces the money on this device; what is here now is kept, and Put it back brings it back. ${esc3(OTHERS3)}</p>
    <ul class="a3-rows">${r.versions.map(v => `<li data-cloudver="${v.rev}"><span>${v.updated ? 'Sent ' + esc3(when3(v.updated)) : 'An earlier version'}</span><button type="button" class="a3-btn">Restore this one</button></li>`).join('')}</ul>
    <div id="a3CloudVerAsk"></div>`;
  for (const li of f.querySelectorAll('[data-cloudver]')) li.querySelector('button').addEventListener('click', () => verAsk3(+li.dataset.cloudver, li.querySelector('span').textContent));
}
function verAsk3(rev, label) {
  const ask = $('#a3CloudVerAsk');
  ask.innerHTML = `<p class="a3-warn" data-cloud="verask">${esc3(label)}: this replaces the money on this device with that version. What is here now is kept, and Put it back brings it back. ${esc3(OTHERS3)}</p>
    <div class="a3-actions"><button type="button" class="a3-btn solid" id="a3CloudVerGo">Restore it</button><button type="button" class="a3-btn" id="a3CloudVerNo">Cancel</button></div>`;
  $('#a3CloudVerNo').addEventListener('click', () => { ask.innerHTML = ''; });
  $('#a3CloudVerGo').addEventListener('click', async () => {
    const st = await cloudState3();
    const g = await CLOUD3.fetchRev({ api: cloudApi3(), pack: BurrowPack, keys: await CLOUD3.keysFor(st.code), rev, now: nowIso3(), mine: E3.book });
    if (!g.ok) { setMsg3(g.why === 'gone' ? 'The cloud does not keep that version any more. Nothing changed.' : WHY3[g.why] || WHY3.server, true); ask.innerHTML = ''; return; }
    const ok = await restoreBook3(g.copy, 'Before an earlier cloud version was restored');
    setMsg3(ok ? 'Restored the earlier copy from the cloud. It goes to your other devices with the next send.' : 'This could not be saved on this device. Nothing changed.', !ok);
    if ($('#a3CloudForm')) $('#a3CloudForm').innerHTML = '';
    paintKept3();
    const save = $('#a3BkSave'); if (save) save.disabled = !E3.book;
  });
}
async function turnOn3() {
  $('#a3CloudState').textContent = 'Checking the cloud can be reached.';
  if (!(await reachable3())) { $('#a3CloudState').textContent = 'The cloud cannot be reached from here right now. Check the connection and try again.'; return; }
  C3.shown = CLOUD3.newCode(); paintCloud3();
}
function haveCode3() {
  const f = $('#a3CloudForm');
  f.innerHTML = `<div class="a3-field"><label for="a3CloudCode">Your cloud code</label>
      <input class="a3-in a3-text" id="a3CloudCode" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX">
      <p class="a3-err" id="a3CloudErr" role="alert"></p></div>
    <div class="a3-actions"><button type="button" class="a3-btn solid" id="a3CloudUse">Use this code</button></div>`;
  $('#a3CloudUse').addEventListener('click', () => useCode3());
  $('#a3CloudCode').focus();
}
async function useCode3(sure) {
  const err = $('#a3CloudErr'), code = CLOUD3.codeClean($('#a3CloudCode').value);
  if (!CLOUD3.codeValid(code)) { err.textContent = 'The code is 20 letters and digits, like XXXX-XXXX-XXXX-XXXX-XXXX. Check that none is missing.'; return; }
  err.textContent = 'Looking for the cloud copy.';
  const keys = await CLOUD3.keysFor(code);
  const c = await CLOUD3.fetchCloud({ api: cloudApi3(), pack: BurrowPack, keys });
  if (!c.ok) { err.textContent = c.why === 'code' ? 'This code does not open a cloud copy. Check every character.' : WHY3[c.why] || WHY3.server; return; }
  if (!c.copy) { err.textContent = 'There is no cloud copy for this code. Check every character against the code you saved.'; return; }
  /* [LISTFIX B5] a device that already has its own numbers is told what happens before anything changes: the cloud copy
     comes here, the numbers here are kept as a whole copy first, and Settings asks which to keep (the engine's
     whole-copy question). Nothing changes until "Use the code" */
  if (sure !== true && BurrowEngine.sync.hasData(E3.book)) {
    err.textContent = '';
    const ask = $('#a3CloudJoin') || $('#a3CloudForm').appendChild(document.createElement('div'));
    ask.id = 'a3CloudJoin';
    ask.innerHTML = `<p class="a3-warn" data-cloud="joinask">This device already has its own numbers. Using the code brings the cloud copy here. The numbers on this device are kept as a copy first, and then you choose which to keep.</p>
      <div class="a3-actions"><button type="button" class="a3-btn solid" id="a3CloudJoinYes">Use the code</button><button type="button" class="a3-btn" id="a3CloudJoinNo">Not now</button></div>`;
    $('#a3CloudJoinYes').addEventListener('click', () => { ask.remove(); useCode3(true); });
    $('#a3CloudJoinNo').addEventListener('click', () => ask.remove());
    return;
  }
  await putCloud3({ on: true, code, base: null, baseRev: null, sentAt: 0, failAt: 0 });
  err.textContent = '';
  await syncNow3();
  setMsg3(E3.book ? 'This device now shares the cloud copy.' : '');
  paintCloud3();
}
function offAsk3() {
  $('#a3CloudForm').innerHTML = `<p class="a3-warn" data-cloud="offask">Stop here: this device stops sending and taking changes. The cloud copy stays for your other devices, and your code still opens it.<br>
      Delete it: the cloud copy is removed and your code opens nothing after that. Another device that still has it on stops sending, and says so.<br>
      Either way, the money on this device stays, but nothing keeps it if this device is lost. Save a backup file first if you are not sure.</p>
    <div class="a3-actions"><button type="button" class="a3-btn" id="a3CloudStop">Stop here</button>
      <button type="button" class="a3-btn" id="a3CloudDel">Delete the cloud copy</button>
      <button type="button" class="a3-btn" id="a3CloudKeep">Keep it on</button></div>`;
  $('#a3CloudStop').addEventListener('click', () => turnOff3(false));
  $('#a3CloudDel').addEventListener('click', () => turnOff3(true));
  $('#a3CloudKeep').addEventListener('click', () => { $('#a3CloudForm').innerHTML = ''; });
}
async function turnOff3(del) {
  const st = await cloudState3();
  clearTimeout(C3.timer); C3.dirty = false; C3.why = null;
  if (del && st.code) {
    const r = await cloudApi3().del(await CLOUD3.keysFor(st.code));
    if (!r.ok) { setMsg3('The cloud copy could not be deleted right now, so it is still on. Try again when you are online.', true); return; }
  }
  await putCloud3({ on: false });
  setMsg3(del ? 'The cloud copy is deleted. Your money is on this device only.' : 'The cloud copy is off on this device. Your money is on this device only.');
  paintCloud3();
}

/* ---------- questions after a sync [AQ3, AQ4, AW2, AW6] ---------- */
const QWORDS3 = {
  x8: 'A change to a schedule now starts on a day your other device had already settled.',
  closed: 'An account closed on one device still holds money after joining the two.',
  minimum: 'Your main bank has a minimum written in two places.',
  shares: 'More was put aside from one place than it holds, after joining the two devices.',
  main: 'Your main bank and its minimum were changed on both devices.',
};
const PICKS3 = {
  x8: [['offer', 'Start the change after what is settled'], ['back', 'Take the change back']],
  closed: [['reopen', 'Open the account again'], ['move', 'Move what is left to the main bank']],
  minimum: [['own', 'Keep the account\'s own minimum'], ['main', 'Keep the main bank minimum']],
  shares: [['undo', 'Undo the newer putting aside'], ['undoOlder', 'Undo the older one']],
};
function nameOf3(k) {
  if (k.of === 'copy') return 'All your money';
  const v = k.versions.slice(-1)[0] || {};
  return v.name ? v.name : k.in ? `A setting (${k.of})` : k.of;
}
function versionLine3(k, v) {
  const at = v.at ? when3(Date.parse(v.at)) : 'an unknown time';
  if (k.of === 'copy') return `The copy saved ${at}, with ${(v.events || []).filter(e => e && !e.gone).length} records`;
  return `${v.gone ? 'Removed' : v.name ? `"${v.name}"` : 'Changed'}, changed ${at}`;
}
function paintQuestions3() {
  const box = $('#a3CloudQs'); if (!box || !E3.book) { if (box) box.innerHTML = ''; return; }
  const S = BurrowEngine.sync, qs = S.afterSync(E3.book).questions;
  if (!qs.length) { box.innerHTML = ''; return; }
  const kept = id => (E3.book.keptVersions || []).find(k => k.id === id);
  box.innerHTML = `<p class="a3-acct">To choose (${qs.length})</p>` + qs.map((q, i) => {
    if (q.q === 'which') {
      const k = kept(q.kept);
      const opts = `${k.versions.map((v, j) => `<li><span>${esc3(versionLine3(k, v))}</span><button type="button" class="a3-btn" data-q="${i}" data-pick="${j}">Keep this one</button></li>`).join('')}${k.both ? `<li><span>Both changes together</span><button type="button" class="a3-btn" data-q="${i}" data-pick="both">Keep both</button></li>` : ''}`;
      return `<div class="a3-q" data-cloudq="which"><p class="a3-next"><b>${esc3(nameOf3(k))}</b> was changed on two devices. Which one should stay? The other is kept, so it can come back.</p><ul class="a3-rows">${opts}</ul></div>`;
    }
    const picks = q.q === 'main' ? (q.options || []).map(o => [o, `Keep the view from device ${o}`]) : PICKS3[q.q] || [];
    return `<div class="a3-q" data-cloudq="${esc3(q.q)}"><p class="a3-next">${esc3(QWORDS3[q.q] || 'Something needs a choice after joining your devices.')}</p>
      <div class="a3-actions">${picks.map(([p, t]) => `<button type="button" class="a3-btn" data-q="${i}" data-pick="${esc3(p)}">${esc3(t)}</button>`).join('')}</div></div>`;
  }).join('');
  for (const b of box.querySelectorAll('[data-q]')) b.addEventListener('click', () => answer3(qs[+b.dataset.q], b.dataset.pick));
}
async function answer3(q, pick) {
  const S = BurrowEngine.sync, base = { copy: E3.book, now: nowIso3(), by: deviceBy3() };
  let next;
  try {
    if (q.q === 'which') next = S.answer(Object.assign(base, { of: q.of, pick: pick === 'both' ? 'both' : +pick }));
    else next = S.answerCheck(Object.assign(base, { question: q, pick }));
  } catch (e) { setMsg3('That choice could not be made. Nothing changed.', true); return; }
  const ok = await E3.put(next);   // an edit with this device's clock; every version stays kept
  if (ok !== true) { setMsg3(ok && ok.text ? ok.text : 'This could not be saved on this device. Nothing changed.', true); paintQuestions3(); return; }
  renderHome3();
  setMsg3('Kept. The other version can still come back.');
  paintQuestions3();
}
