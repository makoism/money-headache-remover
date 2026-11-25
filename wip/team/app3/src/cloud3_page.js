/* ---------- the cloud copy on the page (SCHEMA_V3 1, 2.2, 2.3; DECISIONS_ROUND2 D5, E3, AQ1 to AQ4, AW2, AW5, AW7, BD5) ----------
   Turning it on makes a code, shows it once and asks the person to keep it; "I have a code" ties this device to a copy
   made on another one. While it is on: the copy is taken on opening and by itself while in view (CS2); a change is sent
   at once, a burst again 5 seconds after its last change, never two sends inside 10 seconds, up to 1,200 a day (CS1);
   it is also sent when the person leaves the app (going to the background or closing the tab), and Send now sends at
   once. Each sync is
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
const C3 = { st: null, busy: false, again: false, timer: 0, tick: 0, lastPush: 0, lastChange: 0, failed: false, lastCheck: 0, checkedAt: 0, dirty: false, applying: false, shown: null, why: null, stop: null, said: false, reach: null };
/* The cloud clocks [CS1, CS2]: a take every 60 seconds while in view, and one on coming back into view unless the last
   check was under 10 seconds ago. Tests run them faster through one number their harness puts in the page before these
   scripts run. It is read once, here: nothing typed in the address bar, and nothing a page already open can set, changes it. */
const CT3 = (() => { const k = typeof root3.__burrow3CloudSpeed === 'number' && root3.__burrow3CloudSpeed >= 1 && root3.__burrow3CloudSpeed <= 100 ? root3.__burrow3CloudSpeed : 1; return { take: 60000 / k, back: 10000 / k, soon: 5000 / k, gap: 10000 / k }; })();
/* [CS1] the day's guard: after this many sends in one day (the server's day, UTC) this device sends no more by itself.
   The server allows 1,500 a day for one copy; Settings says when the guard is reached. Send now still sends. */
const CLOUD_DAY3 = 1200;
const cloudDay3 = () => new Date().toISOString().slice(0, 10);
const sentToday3 = st => (st && st.sends && st.sends.day === cloudDay3() ? st.sends.n : 0);
const guard3 = st => sentToday3(st) >= CLOUD_DAY3;
const countSend3 = st => ({ day: cloudDay3(), n: sentToday3(st) + 1 });
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
/* What the device keeps now, read again before every sync: another tab may have stopped the cloud copy or changed the code.
   The base stays this tab's own while the code is the same: it goes with the book this tab holds [CS3] */
async function freshCloud3() {
  const d = (await E3.rec('cloud')) || { on: false }, mine = C3.st;
  C3.st = mine && mine.on && d.on && mine.code === d.code && mine.baseRev != null ? Object.assign({}, d, { base: mine.base, baseRev: mine.baseRev }) : d;
  return C3.st;
}
/* after a sync: what it learned is kept, unless another tab stopped the cloud copy or changed the code meanwhile */
async function keepCloud3(st, patch) {
  const d = await E3.rec('cloud');
  if (d && (!d.on || d.code !== st.code)) { C3.st = d; return false; }
  await putCloud3(Object.assign({}, st, patch));
  return true;
}
/* [B3] is a change waiting to be sent: worked out from the book against the base, never from memory (a reload, a
   second tab and a killed page all keep the answer) */
function waiting3(st) {
  if (!st || !st.on || !E3.book) return false;
  return st.base == null ? true : S3same(E3.book, st.base) === false;
}
/* [CS4, B2] the layers that hold a take back: while one is open, or covered by the assistant, Reminders or Settings, the
   book is not replaced under it. Only the revision is asked; a change here is still sent when the cloud has not moved.
   A take that would have brought something is thrown away (heldMiss) and a fresh sync runs when the layer closes.
   What is open is asked of back3.js, the one piece that knows */
const HOLD3 = ['stmt', 'setup', 'check', 'plan-form', 'rc-edit'];
const held3 = () => typeof BACK3 === 'object' && !!BACK3.holding && BACK3.holding().some(k => HOLD3.includes(k));
function heldClosed3() { if (C3.heldMiss && !held3()) { C3.heldMiss = false; syncNow3(); } }
/* a sync that cannot get better by trying again: the timer stops until the person acts, and Home says so once */
const STOP3 = {
  code: 'The cloud copy has stopped here because the cloud does not accept this code any more - open Settings to start a new one',
  newer: 'The cloud copy has stopped on this device until the app is updated, and your money here is as it was',
  fmt: 'The cloud copy has stopped on this device until the app is updated, and your money here is as it was',
  key: 'The cloud copy has stopped on this device because this code could not open it - open Settings to see more',
  save: 'What your other device changed could not be saved on this device, so the cloud copy has stopped here - free some space, then open the app again',
};
/* the Home notice when the copy was deleted on another device (Settings says it at more length, WHY3.deleted) */
const GONE3 = 'The cloud copy was deleted on another device and this device keeps its money - turn it on again in Settings with a new code';
function stop3(why) {
  C3.stop = why; C3.why = why; clearTimeout(C3.tick); clearTimeout(C3.timer);
  if (!C3.said) { C3.said = true; MSG3.post({ kind: 'notice', key: 'cloud', text: STOP3[why] }); }
}
/* a sync or a check that failed. waiting: something here has not been sent, so Settings says since when */
async function failed3(st, why, waiting) {
  if (why === 'day') {   // [B5] the server has had this copy's saves for the day: the guard's own state and words, not "busy"
    C3.why = null;
    await keepCloud3(st, { sends: { day: cloudDay3(), n: CLOUD_DAY3 } });
    return;
  }
  if (why === 'deleted') {   // 410: deleted on another device; this device stops until it is turned on again
    C3.why = null; C3.dirty = false; clearTimeout(C3.tick);
    await putCloud3({ on: false, gone: Date.now() });
    if (!SET3.open) MSG3.post({ kind: 'notice', key: 'cloud', text: GONE3 });
    return;
  }
  C3.why = why;
  /* a send that did not land: since when, and why (kept on the device, so a reload still says it was not taken) */
  if (waiting && (!st.failAt || st.failWhy !== why)) await keepCloud3(st, { failAt: st.failAt || Date.now(), failWhy: why });
  if (STOP3[why]) stop3(why);
  homeSay3();
}
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
  save: 'What your other device changed could not be saved on this device, so the cloud copy has stopped here. Your money here is as it was. Free some space, then open the app again.',
  day: 'On. This device has sent 1,200 times today, the most it sends in one day. What you change now is safe on this device and is sent tomorrow, or with Send now. Changes from your other devices still arrive.',
  fmt: 'The cloud copy is not one this version can read. Update the app. Nothing here was changed.',
  deleted: 'The cloud copy was deleted on another device. This device keeps its money. Turn the cloud copy on again with a new code to share it.',
};
const when3 = ms => { const d = new Date(ms); return d.toDateString() === new Date().toDateString() ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); };

/* one sync; the book here takes what it gives, joined again with any change made while it ran.
   opts.act: the person asked (Send now, a code typed, turning it on), which also starts a stopped timer again and
   sends past the day's guard. opts.leaving: the page is going away */
async function syncNow3(opts) {
  opts = opts || {};
  if (E3.mode === 'try') return null;
  /* [AI_JOIN_FIXES B; M61, M67] the setup chat's fill was held back while it could be undone (BV2.9), and a cloud copy
     turned on then sent nothing and said nothing. A cloud copy that is on ends the hold: the first copy goes, and the
     fill's Undo is over (the card then says how to change things) */
  if (E3.held && E3.held() && (await cloudState3()).on) await E3.release();
  if (C3.busy) { C3.again = opts.leaving ? 'leaving' : C3.again || true; return null; }   // leaving while a sync runs: a real leaving send follows it
  C3.busy = true; clearTimeout(C3.timer); C3.failed = false; C3.first = false;
  try {
    const st = await freshCloud3();
    if (!st.on) return null;
    if (opts.act) { C3.stop = null; C3.said = false; }
    else if (C3.stop) return null;
    const snap = E3.book, wasWaiting = waiting3(st), take = !opts.act && guard3(st);
    const hold = st.base != null && held3();   // a first join is the person's own act and is never held
    const keys = await CLOUD3.keysFor(st.code);
    const r = await CLOUD3.syncOnce({ api: cloudApi3(), pack: BurrowPack, S: BurrowEngine.sync, keys, device: { base: st.base, baseRev: st.baseRev }, copy: snap, keepalive: !!opts.leaving, take, holdBack: hold, now: nowIso3() });
    C3.lastCheck = Date.now();
    if (wasWaiting && !take) C3.lastPush = Date.now();   // a send was tried: the next one keeps its distance, sent or not
    if (!r.ok) { C3.failed = true; await failed3(st, r.why, wasWaiting || C3.dirty); return r; }   // [CS3] the book was not replaced: the base stays
    if (r.held) { C3.heldMiss = true; C3.why = null; return r; }   // [B4] thrown away: "Last checked" does not move
    const sends = r.pushed ? { sends: countSend3(st) } : {};
    C3.why = null; C3.dirty = false;
    let next = r.copy;
    if (E3.book !== snap) { next = BurrowEngine.sync.sync(snap, E3.book, r.copy); C3.dirty = true; }   // changed while it ran: joined, sent next time
    /* [CS3] the base is saved only together with the book that holds it: after the book was replaced, or when the book
       here already is that copy. A book that could not be saved keeps the base it started with, so the next sync joins
       again from the same place and nothing the other device changed or removed is undone */
    if (S3same(next, E3.book) === false && hold) { C3.heldMiss = true; C3.dirty = true; return r; }   // never replaced under a held layer, so the base stays too
    if (S3same(next, E3.book) === false) {
      if (r.firstJoin && E3.book) await keepCopy3('Before this device joined the cloud copy');
      C3.applying = true;
      const ok = await E3.replace(next);
      C3.applying = false;
      if (ok) { try { redraw3(); } catch (e) { /* a screen's own fault: the book is saved */ } }   // the one redraw, as when another tab saved
      else {   // [B1] it would write again at every timed sync and still not land: stop, and say so once
        await keepCloud3(st, Object.assign({ failAt: st.failAt || Date.now() }, sends));
        stop3('save');
        return r;
      }
    }
    C3.checkedAt = Date.now();
    await keepCloud3(st, Object.assign({ base: r.device.base, baseRev: r.device.baseRev, sentAt: r.pushed || !st.sentAt ? Date.now() : st.sentAt, failAt: 0, failWhy: null }, sends));
    const qs = r.questions.length;
    if (qs && !SET3.open) msg3('Your devices changed the same thing - choose which to keep in Settings');
    return r;
  } finally {
    C3.busy = false;
    if (SET3.open) paintCloud3();
    homeSay3();
    after3();
  }
}
/* when a sync or a check ends: a leaving send asked for meanwhile goes now; a change made meanwhile is sent at its time.
   After a sync that failed nothing is set off here: the timed take tries again, and so does coming back online */
function after3() {
  const again = C3.again; C3.again = false;
  if (C3.stop) return;
  if (again === 'leaving' && C3.heldMiss) { syncNow3({ leaving: true }); return; }
  if (C3.heldMiss) return;   // the cloud moved under a held layer: nothing more until it closes (heldClosed3)
  if (again === 'leaving') { syncNow3({ leaving: true }); return; }
  if ((again || C3.dirty) && !C3.failed && !guard3(C3.st)) later3(C3.first ? gapIn3() : sendIn3());   // a first change that met a running sync still goes at once
}
const S3same = (a, b) => BurrowEngine.sync.canon(CLOUD3.noRev(a || {})) === BurrowEngine.sync.canon(CLOUD3.noRev(b || {}));
function later3(ms) { clearTimeout(C3.timer); C3.timer = setTimeout(() => syncNow3(), ms); }
/* [CS1] when a waiting change is sent: 5 seconds after the last change, and never inside 10 seconds of the last send */
const sendIn3 = () => Math.max(0, C3.lastChange + CT3.soon - Date.now(), C3.lastPush + CT3.gap - Date.now());
/* after a save [CS1]: the first change is sent at once; a burst is sent again 5 seconds after its last change; never
   more than one send every 10 seconds. (This replaces D5's "at most every 1 to 2 minutes".) */
function changed3() {
  if (C3.applying || !C3.st || !C3.st.on || C3.stop) return;
  const quiet = Date.now() - CT3.soon > C3.lastChange;   // no change in the last 5 seconds: this one starts a burst
  C3.dirty = true; C3.lastChange = Date.now();
  homeSay3();
  if (guard3(C3.st)) return;   // the day's guard: kept here, sent tomorrow or by Send now
  if (!quiet && C3.first) return;   // the at-once send of this burst has not left yet: it carries this change too
  C3.first = quiet;
  later3(quiet ? gapIn3() : sendIn3());
}
const gapIn3 = () => Math.max(0, C3.lastPush + CT3.gap - Date.now());
/* ---------- the take [CS2]: on coming into view and every 60 seconds while in view ----------
   The timed check asks only for the cloud copy's revision. The copy is fetched (a full sync) only when that revision is
   not the one this device's base has, or a change here is waiting. With nothing changed nothing is written anywhere. */
const inView3 = () => document.visibilityState === 'visible';
async function take3() {
  if (E3.mode === 'try' || C3.busy || C3.stop) return;
  let st = null, full = false;
  C3.busy = true;
  try {
    st = await freshCloud3();
    if (!st.on) return;
    const hold = st.base != null && held3();
    full = st.base == null || (waiting3(st) && !guard3(st) && !hold);   // past the day's guard a waiting change is not a reason to fetch the copy
    if (!full) {
      const v = await CLOUD3.revOnly({ api: cloudApi3(), keys: await CLOUD3.keysFor(st.code) });
      C3.lastCheck = Date.now();
      if (!v.ok) await failed3(st, v.why, false);
      else if (v.rev !== st.baseRev) { if (hold) C3.heldMiss = true; else full = true; }   // [CS4] held: thrown away, taken after the close
      else if (hold && waiting3(st) && !guard3(st)) full = true;   // the cloud has not moved: this book is sent as it is
      else { C3.checkedAt = Date.now(); C3.why = null; }   // in step: the book shows what was checked
    }
  } finally {
    C3.busy = false;
    if (!full) { if (SET3.open) paintCloud3(); homeSay3(); after3(); }
  }
  if (full) await syncNow3();
}
function tick3(ms) {
  clearTimeout(C3.tick);
  if (E3.mode === 'try' || !inView3()) return;
  C3.tick = setTimeout(async () => { await take3(); if (C3.st && C3.st.on && !C3.stop) tick3(CT3.take); }, ms);
}
/* back in view (or online again): a take now, unless one ran in the last 10 seconds; then the timer */
function cameBack3() { if (C3.started && inView3()) tick3(Math.max(0, C3.lastCheck + CT3.back - Date.now())); }
/* the start file calls this once the book is loaded: the cloud copy is taken on opening, always as a full sync [B3] */
async function startCloud3() {
  if (E3.mode === 'try') return;
  E3.onSaved(changed3);
  if (typeof BACK3 === 'object' && BACK3.onChange) BACK3.onChange(heldClosed3);
  const st = await freshCloud3();
  if (st.on) await syncNow3();
  C3.started = true;   // from here coming back into view takes too (the page's own first showing is the opening sync above)
  tick3(CT3.take);
}
const leaving3 = () => { if (C3.st && C3.st.on && !C3.stop && !guard3(C3.st) && (C3.dirty || waiting3(C3.st))) syncNow3({ leaving: true }); };
document.addEventListener('visibilitychange', () => { if (document.hidden) { clearTimeout(C3.tick); leaving3(); } else cameBack3(); });
addEventListener('pagehide', leaving3);
addEventListener('pageshow', cameBack3);
addEventListener('online', cameBack3);

/* ---------- the cloud copy's one status (coordinator item 8; M36, M61, M67) ----------
   Worked out here only, and read by Settings (its state line) and Home (one plain line when it is not in step). Never
   "in step" while anything saved is not yet sent (waiting3: the saved book against the base) or after the cloud refused a
   send, until a send lands. Gives { key, settings, home }; home is '' when in step or off */
const REFUSED3 = { server: 'The cloud did not take your last change. It tries again by itself.', busy: 'The cloud is busy and did not take your last change. It tries again by itself.', code: WHY3.code };
const HOME3_REFUSED = 'The cloud copy did not take your last change - it tries again by itself';
function cloudStatus3(st) {
  st = st || C3.st;
  if (E3.mode === 'try' || !st || !st.on) return { key: 'off', settings: '', home: '' };
  const waiting = waiting3(st);
  const checked = Math.max(C3.checkedAt || 0, st.sentAt || 0);
  if (C3.stop) return { key: 'stopped', settings: WHY3[C3.stop] || WHY3.server, home: 'The cloud copy has stopped on this device - open Settings to see why' };
  if (guard3(st)) return { key: 'refused', settings: WHY3.day, home: waiting ? 'This device has sent its most for today, so your changes go to the cloud copy tomorrow' : '' };
  const why = C3.why && C3.why !== 'net' ? C3.why : waiting && st.failAt ? st.failWhy : null;
  if (why && waiting) return { key: 'refused', settings: REFUSED3[why] || WHY3[why] || REFUSED3.server, home: HOME3_REFUSED };
  if (C3.why && C3.why !== 'net') return { key: 'trouble', settings: WHY3[C3.why] || WHY3.server, home: '' };
  if (C3.heldMiss) return { key: 'held', settings: 'On. Your other device changed something. It comes in when you finish what is open here.', home: '' };
  if (C3.busy && !st.sentAt) return { key: 'sending', settings: 'On. Sending the first copy.', home: '' };
  if (waiting) return { key: 'waiting', settings: C3.why === 'net' ? WHY3.net : 'On. A change made here is waiting to be sent. It goes by itself.', home: 'A change is waiting to go to the cloud copy' };
  if (C3.why === 'net') return { key: 'trouble', settings: WHY3.net, home: '' };
  return { key: 'instep', checked, settings: checked ? `On. In step with the cloud, last checked at ${when3(checked)}.` : 'On.', home: '' };
}
/* Home's one cloud line (home3.js reads it); Home is drawn again only when the line changes */
const cloudHome3 = () => cloudStatus3().home;
/* [M20, M36; qc-data-safety B3] how many "which to keep" questions wait (the engine's own list, read from the book, so it
   is the same after a reload and with the cloud copy off): Home says so until each is answered, with the way to Settings */
function cloudChoose3() {
  if (E3.mode === 'try' || !E3.book) return 0;
  try { return BurrowEngine.sync.afterSync(E3.book).questions.length; } catch (e) { return 0; }
}
function homeSay3() {
  const now = cloudHome3() + '|' + cloudChoose3();
  if (now === C3.homeSaid) return;
  C3.homeSaid = now;
  try { if (E3.book) renderHome3(); } catch (e) { /* a screen's own fault */ }
}

/* ---------- the card in Settings ---------- */
function cloudCard3() {
  return `<div class="a3-card" data-card="cloud"><h2>Cloud copy</h2>
    <p class="a3-next" id="a3CloudState">Checking.</p>
    <div id="a3CloudBody"></div>
    <div id="a3CloudQs"></div><div id="a3CloudKept"></div></div>`;
}
function wireCloud3() { paintCloud3(); }
async function paintCloud3() {
  const body = $('#a3CloudBody'), state = $('#a3CloudState'); if (!body) return;
  const st = await cloudState3();
  if (!SET3.open) return;
  if (C3.shown) {   // a new code, shown once
    body.dataset.mode = 'code';
    state.textContent = 'Write this code down, or keep it in a password manager. It is the only way to open the cloud copy, from this device or another. Nobody else can get it back for you.';
    body.innerHTML = `<p class="a3-code" data-cloud="code">${esc3(CLOUD3.codeShow(C3.shown))}</p>
      <div class="a3-actions"><button type="button" class="a3-btn solid" id="a3CloudSaved">I saved the code</button><button type="button" class="a3-btn" id="a3CloudCancel">Cancel</button></div>`;
    $('#a3CloudSaved').addEventListener('click', async () => {
      const code = C3.shown; C3.shown = null;
      await putCloud3({ on: true, code, base: null, baseRev: null, sentAt: 0, failAt: 0 });
      paintCloud3(); await syncNow3({ act: true }); tick3(CT3.take);
    });
    $('#a3CloudCancel').addEventListener('click', () => { C3.shown = null; paintCloud3(); });
    return;
  }
  if (!st.on) {
    body.dataset.mode = 'off';
    state.textContent = st.gone ? WHY3.deleted : 'Off. Your money is on this device only. A cloud copy is locked with a code only you have, and keeps your phone and computer the same.';
    body.innerHTML = `<div class="a3-actions">${E3.book ? '<button type="button" class="a3-btn solid" id="a3CloudOn">Keep a copy in the cloud</button>' : ''}
        <button type="button" class="a3-btn" id="a3CloudHave">I have a code</button></div><div id="a3CloudForm"></div>`;
    if ($('#a3CloudOn')) $('#a3CloudOn').addEventListener('click', turnOn3);
    $('#a3CloudHave').addEventListener('click', haveCode3);
    paintQuestions3();
    return;
  }
  /* the one status. [B4, M36] "last checked" is when this device last checked with the cloud and its book showed what
     was there: a take or a send, never a take that was held and thrown away */
  const cs = cloudStatus3(st);
  state.dataset.checked = String(Math.max(C3.checkedAt || 0, st.sentAt || 0));
  state.dataset.status = cs.key;
  state.textContent = cs.settings;
  const behind = st.failAt ? `<p class="a3-warn" data-cloud="behind">Changes made since ${esc3(when3(st.failAt))} are on this device only for now.</p>` : '';
  /* the buttons are drawn once: a timed check that ends while the person reads "Turn off" or the code never wipes it */
  if (body.dataset.mode !== 'on') {
    body.dataset.mode = 'on';
    body.innerHTML = `<div id="a3CloudBehind"></div><div class="a3-actions"><button type="button" class="a3-btn" id="a3CloudNow">Send now</button>
      <button type="button" class="a3-btn" id="a3CloudShow">Show code</button>
      <button type="button" class="a3-btn" id="a3CloudVers">Earlier versions</button>
      <button type="button" class="a3-btn" id="a3CloudOff">Turn off</button></div><div id="a3CloudForm"></div>`;
    $('#a3CloudNow').addEventListener('click', async () => { $('#a3CloudState').textContent = 'Sending.'; await syncNow3({ act: true }); tick3(CT3.take); });
    $('#a3CloudShow').addEventListener('click', () => { $('#a3CloudForm').innerHTML = `<p class="a3-code" data-cloud="code">${esc3(CLOUD3.codeShow(C3.st.code))}</p>`; });
    $('#a3CloudOff').addEventListener('click', offAsk3);
    $('#a3CloudVers').addEventListener('click', versions3);
  }
  $('#a3CloudBehind').innerHTML = behind;
  paintQuestions3();
}
/* the cloud's earlier versions, newest first; one is restored after asking (draft words, FOR_MAKO copy pass) */
async function versions3() {
  const f = $('#a3CloudForm'); f.innerHTML = '<p class="a3-sub">Looking for earlier versions</p>';
  const st = await cloudState3();
  const keys = await CLOUD3.keysFor(st.code);
  const r = await CLOUD3.fetchVersions({ api: cloudApi3(), keys });
  if (!SET3.open || !$('#a3CloudForm')) return;
  if (!r.ok) { f.innerHTML = `<p class="a3-warn">${esc3(WHY3[r.why] || WHY3.server)}</p>`; return; }
  if (!r.versions.length) { f.innerHTML = '<p class="a3-sub" data-cloud="versions">The cloud has no earlier versions of this copy yet</p>'; return; }
  f.innerHTML = `<p class="a3-next" data-cloud="versions">The cloud keeps the last ${r.versions.length === 1 ? 'version' : r.versions.length + ' versions'} before the one it holds now. Restoring one replaces the money on this device. What is here now is kept, and Put it back brings it back. ${esc3(OTHERS3)}</p>
    <ul class="a3-rows">${r.versions.map(v => `<li data-cloudver="${v.rev}"><span>${v.updated ? 'Sent ' + esc3(when3(v.updated)) : 'An earlier version'}</span><button type="button" class="a3-btn">Restore this one</button></li>`).join('')}</ul>
    <div id="a3CloudVerAsk"></div>`;
  for (const li of f.querySelectorAll('[data-cloudver]')) li.querySelector('button').addEventListener('click', () => verAsk3(+li.dataset.cloudver, li.querySelector('span').textContent));
}
function verAsk3(rev, label) {
  const ask = $('#a3CloudVerAsk');
  ask.innerHTML = `<p class="a3-warn" data-cloud="verask">${esc3(label)}: this replaces the money on this device with that version. What is here now is kept, and Put it back brings it back. ${esc3(OTHERS3)}<br>Anything you logged after this version was sent goes, on every device. Put it back brings it back.</p>
    <div class="a3-actions"><button type="button" class="a3-btn solid" id="a3CloudVerGo">Restore it</button><button type="button" class="a3-btn" id="a3CloudVerNo">Cancel</button></div>`;
  $('#a3CloudVerNo').addEventListener('click', () => { ask.innerHTML = ''; });
  $('#a3CloudVerGo').addEventListener('click', async () => {
    const st = await cloudState3();
    const g = await CLOUD3.fetchRev({ api: cloudApi3(), pack: BurrowPack, keys: await CLOUD3.keysFor(st.code), rev, now: nowIso3(), mine: E3.book });
    if (!g.ok) { setMsg3(g.why === 'gone' ? 'The cloud does not keep that version any more, so nothing changed' : WHY3[g.why] || WHY3.server, true); ask.innerHTML = ''; return; }
    const ok = await restoreBook3(g.copy, 'Before an earlier cloud version was restored');
    setMsg3(ok ? 'Restored the earlier copy from the cloud - it goes to your other devices with the next send' : 'This could not be saved on this device, so nothing changed', !ok);
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
  await syncNow3({ act: true }); tick3(CT3.take);
  setMsg3(E3.book ? 'This device now shares the cloud copy' : '');
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
  $('#a3CloudDel').addEventListener('click', delAsk3);
  $('#a3CloudKeep').addEventListener('click', () => { $('#a3CloudForm').innerHTML = ''; });
}
/* [coordinator's ruling 26 Nov, M61, M66] Delete asks first: the server then keeps only the mark that it was deleted, so
   every earlier saved version goes too. Keep it is the easy choice and sends nothing */
function delAsk3() {
  $('#a3CloudForm').innerHTML = `<p class="a3-warn" data-cloud="delask">Delete the cloud copy for good? The earlier saved versions on the server go too, and this cannot be undone. The money on this device stays</p>
    <div class="a3-actions"><button type="button" class="a3-btn solid" id="a3CloudDelNo">Keep it</button>
      <button type="button" class="a3-btn" id="a3CloudDelYes">Delete it for good</button></div>`;
  $('#a3CloudDelNo').addEventListener('click', () => { $('#a3CloudForm').innerHTML = ''; });
  $('#a3CloudDelYes').addEventListener('click', () => turnOff3(true));
  $('#a3CloudDelNo').focus();
}
async function turnOff3(del) {
  const st = await cloudState3();
  clearTimeout(C3.timer); clearTimeout(C3.tick); C3.dirty = false; C3.why = null; C3.stop = null; C3.said = false;
  if (del && st.code) {
    const r = await cloudApi3().del(await CLOUD3.keysFor(st.code));
    if (!r.ok) { setMsg3('The cloud copy could not be deleted right now, so it is still on - try again when you are online', true); return; }
  }
  await putCloud3({ on: false });
  setMsg3(del ? 'The cloud copy is deleted and your money is on this device only' : 'The cloud copy is off on this device and your money is on this device only');
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
/* [M20] each kept version says what tells it apart, so a person can choose: its amount (the page's one formatter), its
   days and name when those differ between the versions, and which device it came from (each record's own `by`) */
function amountNow3(v) {
  if (Array.isArray(v.steps) && v.steps.length) {
    const today = E3.today(), on = v.steps.filter(x => x && (x.from == null || String(x.from) <= today));
    const st = (on.length ? on : v.steps).slice(-1)[0];
    return st && typeof st.amount === 'number' ? st.amount : null;
  }
  return typeof v.a === 'number' ? v.a : typeof v.amount === 'number' ? v.amount : null;
}
const daysOf3 = v => (Array.isArray(v.rules) && v.rules.length ? [].concat(...v.rules.map(r => (r && r.rule && r.rule.days) || [])) : []).join(', ');
const fromWhom3 = v => (!v.by ? '' : v.by === deviceBy3() ? 'from this device' : 'from your other device');
/* what tells one version apart from the others kept with it: its amount, and its days and account when they differ */
function apart3(k, v) {
  const all = k.versions.filter(x => !x.gone);
  const differ = f => new Set(all.map(f)).size > 1;
  const amt = amountNow3(v), cur = v.cur || (v.acct ? E3.curOf(v.acct) : null), parts = [];
  if (amt !== null && cur) parts.push(money3(amt, cur));
  if (daysOf3(v) && differ(daysOf3)) parts.push(`day ${daysOf3(v)}`);
  if (v.acct && differ(x => x.acct || '')) parts.push(`from ${E3.nameOf(v.acct)}`);
  return parts;
}
function versionLine3(k, v) {
  const at = v.at ? when3(Date.parse(v.at)) : 'an unknown time';
  if (k.of === 'copy') return `The copy saved ${at}, with ${(v.events || []).filter(e => e && !e.gone).length} records`;
  const who = fromWhom3(v);
  if (v.gone) return ['Removed', who, `changed ${at}`].filter(Boolean).join(', ');
  return [[v.name ? `"${v.name}"` : 'Changed'].concat(apart3(k, v)).join(' '), who, `changed ${at}`].filter(Boolean).join(', ');
}
/* [M20] after a choice the other version stays for Undo: each record kept two ways that is no longer asked shows which
   one is in use and what the other was, with "Use the other one". Read from keptVersions, so a reload keeps it */
const pathOf3 = (b, p) => String(p || '').split('.').reduce((o, x) => (o && x ? o[x] : o), b);
function otherLines3() {
  const S = BurrowEngine.sync, out = [];
  for (const k of (E3.book && E3.book.keptVersions) || []) {
    if (k.ask || k.of === 'copy' || !k.in) continue;
    const list = pathOf3(E3.book, k.in); if (!Array.isArray(list)) continue;
    const cur = list.find(r => r && r.id === k.of); if (!cur) continue;
    const inUse = k.versions.find(v => S.same(v, cur)); if (!inUse) continue;
    const others = k.versions.map((v, i) => ({ v, i })).filter(x => !S.same(x.v, cur));
    if (others.length) out.push({ k, cur, inUse, others });
  }
  return out;
}
const sayVersion3 = (k, v) => (v.gone ? ['removed'] : apart3(k, v)).concat(fromWhom3(v) ? [fromWhom3(v)] : []).join(' ');
function paintOther3() {
  const box = $('#a3CloudKept'); if (!box) return;
  const lines = otherLines3();
  box.innerHTML = lines.map((x, n) => x.others.map(o => `<div class="a3-q" data-cloudkept="${n}"><p class="a3-next"><b>${esc3(x.cur.name || nameOf3(x.k))}</b>: you kept ${esc3(sayVersion3(x.k, x.inUse))} - the other was ${esc3(sayVersion3(x.k, o.v))}</p>
      <div class="a3-actions"><button type="button" class="a3-btn" data-useother="${n}:${o.i}">Use the other one</button></div></div>`).join('')).join('');
  for (const b of box.querySelectorAll('[data-useother]')) b.addEventListener('click', () => { const [n, i] = b.dataset.useother.split(':').map(Number); useOther3(lines[n], i); });
}
/* the other version back: the engine's own answer (every version stays kept), with an Undo that puts the one before back */
async function pickVersion3(of, matches) {
  const S = BurrowEngine.sync, k = (E3.book.keptVersions || []).find(r => r.of === of);
  const i = k ? k.versions.findIndex(matches) : -1;
  if (i < 0) return false;
  let next;
  try { next = S.answer({ copy: E3.book, of, pick: i, now: nowIso3(), by: deviceBy3() }); } catch (e) { return false; }
  return (await E3.put(next)) === true;
}
async function useOther3(x, i) {
  const S = BurrowEngine.sync, before = x.inUse, want = x.k.versions[i], name = x.cur.name || nameOf3(x.k);
  if (!(await pickVersion3(x.k.of, v => S.same(v, want)))) { setMsg3('That choice could not be made, so nothing changed', true); return; }
  renderHome3(); if (SET3.open) paintQuestions3();
  MSG3.post({ kind: 'undo', key: 'act3', text: `${name}: the other one is back`, action: { label: 'Undo', run: async () => {
    if (await pickVersion3(x.k.of, v => S.same(v, before))) { renderHome3(); if (SET3.open) paintQuestions3(); }
  } } });
}
function paintQuestions3() {
  const box = $('#a3CloudQs'); if (!box || !E3.book) { if (box) box.innerHTML = ''; return; }
  paintOther3();
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
  const drawn = qs.map(q => (q.q === 'which' ? stampsOf3(E3.book, q.of) : null));   // what the rows were drawn from
  for (const b of box.querySelectorAll('[data-q]')) b.addEventListener('click', () => answer3(qs[+b.dataset.q], b.dataset.pick, drawn[+b.dataset.q]));
}
/* [M20, M61] a "which to keep" answer is written only on the book its row was drawn from: the question still open, its
   kept record and the item unchanged since (another tab answered it, or the item was changed again, and a stale row would
   otherwise overwrite that newer change) */
function itemOf3(book, k) {
  if (!k || k.of === 'copy' || !k.in) return undefined;
  const holder = pathOf3(book, k.in);
  return Array.isArray(holder) ? holder.find(r => r && r.id === k.of) : holder ? holder[k.of.split('.').pop()] : undefined;
}
function stampsOf3(book, of) {
  const k = ((book && book.keptVersions) || []).find(r => r.of === of), it = itemOf3(book, k);
  return { ask: !!(k && k.ask), k: k ? k.at || '' : '', item: it && it.at ? it.at : '' };
}
const STALE3 = 'This was already chosen or changed somewhere else, so nothing changed';
/* Undo right after Keep: the item and its kept versions as they were before the answer, written with a newer time so the
   other devices take the Undo too. Refused when either changed since the answer */
async function undoAnswer3(of, before, answered) {
  const now = stampsOf3(E3.book, of), was = stampsOf3(answered, of);
  if (now.k !== was.k || now.item !== was.item) { setMsg3(STALE3, true); return; }
  const clock = BurrowClock.makeClock(); clock.see(E3.book);
  const stamp = { at: clock.stamp(), by: deviceBy3() };
  const kb = (before.keptVersions || []).find(r => r.of === of);
  let out;
  if (of === 'copy') out = JSON.parse(JSON.stringify(before));
  else {
    out = JSON.parse(JSON.stringify(E3.book));
    const holder = pathOf3(out, kb.in), it = itemOf3(before, kb);
    if (Array.isArray(holder)) { const i = holder.findIndex(r => r && r.id === of); if (it && i >= 0) holder[i] = Object.assign(JSON.parse(JSON.stringify(it)), stamp); }
    else if (holder && it) holder[of.split('.').pop()] = Object.assign(JSON.parse(JSON.stringify(it)), stamp);
  }
  out.keptVersions = (out.keptVersions || []).map(r => (r.of === of ? Object.assign(JSON.parse(JSON.stringify(kb)), stamp) : r));
  const ok = await E3.put(out);
  if (ok !== true) { setMsg3('This could not be saved on this device, so nothing changed', true); return; }
  renderHome3(); if (SET3.open) paintQuestions3();
}
async function answer3(q, pick, drawn) {
  if (drawn) {
    const now = stampsOf3(E3.book, q.of);
    if (!now.ask || now.k !== drawn.k || now.item !== drawn.item) { setMsg3(STALE3, true); paintQuestions3(); return; }
  }
  const S = BurrowEngine.sync, before = E3.book, base = { copy: E3.book, now: nowIso3(), by: deviceBy3() };
  let next;
  try {
    if (q.q === 'which') next = S.answer(Object.assign(base, { of: q.of, pick: pick === 'both' ? 'both' : +pick }));
    else next = S.answerCheck(Object.assign(base, { question: q, pick }));
  } catch (e) { setMsg3('That choice could not be made, so nothing changed', true); return; }
  const ok = await E3.put(next);   // an edit with this device's clock; every version stays kept
  if (ok !== true) { setMsg3(ok && ok.text ? ok.text : 'This could not be saved on this device, so nothing changed', true); paintQuestions3(); return; }
  renderHome3();
  if (q.q === 'which') MSG3.post({ kind: 'undo', key: 'act3', text: 'Kept - the other version can still come back', action: { label: 'Undo', run: () => undoAnswer3(q.of, before, next) } });
  else setMsg3('Kept - the other version can still come back');
  paintQuestions3();
}
