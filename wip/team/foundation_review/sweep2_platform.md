(Sweep 2, 23 Nov 2026: platform, storage and scale. Read-only review by a helper with measurements; copied from its reply.)

Platform sweep for the event-list rebuild (read-only; nothing in the repo was written)

How I measured: I built a made-up v2 copy matching SCHEMA.md (spends with card, line, posted date, note and import source; bills; checks; moves; pay) and timed it in Chromium with the CPU slowed 4x and 6x to stand in for a mid-range Android phone. Script: /tmp/sweep_platform/bench.js, runner: /tmp/sweep_platform/run.js.
- **Size per event:** about 205 characters of JSON. Expect 250 to 300 with real notes.
- **Events per year:** a card-heavy person who types most buys and imports two cards' statements makes about 3,000 a year. A heavy case is about 6,000.
- **localStorage limit (Chrome, measured):** 5.2 million characters for the whole site, all keys together.

**The headline:** the engine sums are cheap. What breaks first is the platform around them: one JSON copy in localStorage, a full Undo copy kept inside that copy, and a cloud copy that sends everything as one blob. The new storage key in SCHEMA section 1 is the cheapest moment to change these.

## 1. localStorage fills up
- **Risk:** today's 3-day Undo keeps a full copy of the numbers inside the saved copy (`S.ui.keep.snap`, ui45.js `keepCopy`). That more than doubles the size (about 2.2x). The backup file and the cloud blob carry it too. When a save fails, ui0.js `flush` shows "Not saved" and the IndexedDB second copy picks it up. But the save that tips it over is usually a big change the person wants to be able to undo.
- **When it bites:** 15,000 events (5 years at 3,000 a year) is about 3.1M characters. That fits alone, but with the Undo copy it is 6.7M and fails. Measured: with the Undo copy the limit is about 11,500 events, so 3.5 to 4 years at 3,000 a year and under 2 years at 6,000. Without it, about 25,000 events, so 5.5 to 8 years. 30,000 events (10 years) does not fit either way.
- **Change NOW:** yes, the storage choice. It is nearly free while the key is changing anyway.
- **Fix:** make IndexedDB the main store: one record per event (keyed by id, with a date index) plus one record for everything else, and write only what changed on each tap. Keep localStorage for small device things only. Undo becomes the `gone`/`goneBy` marks SCHEMA already has, so no full copy is kept. If a full copy is still wanted for a big replace (backup or cloud load), keep it as its own IndexedDB record, never inside the copy.
- **Cost:** about 2 days. That covers loading asynchronously at start-up, other-tab sync (BroadcastChannel instead of the `storage` event), moving the old IndexedDB mirror, and tests.

## 2. The browser clears the data (eviction)
- **Risk:** nothing calls `navigator.storage.persist()` (0 hits in the build).
  - **Android:** the site's storage counts as "best effort". Under low disk, Chrome removes the whole site's storage, localStorage and IndexedDB together, so the IndexedDB mirror does not protect against it. The installed app shares storage with Chrome, so "Delete browsing data, cookies and site data" also wipes it. That is the most likely real loss.
  - **iOS:** the home-screen app has its own storage, separate from Safari. Safari's 7-day removal applies to sites not used.
- **When it bites:** any time. It does not depend on size.
- **Change NOW:** no shape change.
- **Fix:**
  - Call `persist()` after setup. Installed apps on Chrome are usually granted it.
  - Show the result and `storage.estimate()` in Settings.
  - On an empty start, say plainly "Load your cloud copy or backup file".
- **Cost:** about 2 hours.

## 3. Speed on a mid Android phone
Measured at 30,000 events (10 years), CPU slowed 4x to 6x:

| Step | Time |
|---|---|
| Reading the copy at load | 90 to 130 ms |
| A simple engine pass (sort, balance from the latest check, totals by period and line, settled set) | 30 to 45 ms |
| Today's save path per tap | 270 to 410 ms |
| Cloud push per save (encrypt plus base64) | 430 to 570 ms more |

The save path reads and parses the stored copy three times (`mergeOtherReceipts`, `keepUnknown`, `storedIsNewer`) and turns the whole copy into text twice more (localStorage, then the IndexedDB mirror). At 60,000 events the save path is 570 to 770 ms and the engine pass 55 to 135 ms. `render` calls `calcAll` on every repaint, and there are 61 call sites. Destructive actions also deep-copy and diff the whole copy (`snapNoCopy`, `keepDiff`).
- **When it bites:** tap lag is felt from about 3 to 5 years of events.
- **Change NOW:** no saved snapshots or caches are needed. The engine starts each account from its latest check, so most history is never walked. Keep any per-year summary as a cache that can be rebuilt, never as truth.
- **Fix:**
  - Hold events in memory sorted, with an index by date and account.
  - Compute once per change (cached by `rev`), and work out past periods only when shown.
  - Write per record (item 1).
  - Make one test that times a 30,000-event copy under 4x CPU and fails above a budget.
- **Cost:** about 1 day inside the engine lane.

## 4. Two devices editing offline
- **Risk:** the cloud copy is one blob. On a conflict (409) the person picks "Load it" or "Keep mine" (ui42.js), and the other device's offline edits are dropped (kept locally for 3 days only).
- **Change NOW:** yes, small.
  1. Define `at` as a hybrid clock: max(now, newest `at` seen + 1 ms), with the device part breaking ties. Then a wrong clock on one device cannot always win.
  2. Split device-only state out of the shared copy: `ui` look and tour, the Undo copies, and `clock.lastSeen`. Today `clock.lastSeen` is in the shared copy, so a desktop with a wrong clock would trip the phone's "date went back" check every time.
  3. Write down that merging is a union by id, the newest `at` wins per record, and `gone` always wins over not gone.
- **Fix:** on a 409, the client downloads, merges, and sends again with `base = ver`. No server change is needed: the side branch already returns `ver`. The same thing entered on both devices is handled by the import-match rule.
- **Cost:** shape notes about 2 hours now. Merge code and tests about 1.5 days, for stage 1b.

## 5. Cloud, backup and transport limits
**Risk:** the cloud copy sends the whole copy every save (3 seconds after each change), at about 272 base64 characters per event, roughly doubled by the Undo copy. The ceilings it hits:

| Limit | Hit at |
|---|---|
| Side-branch server, 1.8M characters (413 `too_large`) | about 1 year of heavy use with the Undo copy, about 2.2 years without |
| Current main server, 3M characters | about 1.7 years with the Undo copy |
| Main server, blob and previous copy in one database row | D1 holds 2 MB per row, so it fails sooner. The side branch already handles this (`ROW_ROOM`). |
| Backup file restore | refused over 20 MB (ui5.js). 60,000 events with the Undo copy is 27 MB. |
| Restore box | a 6 to 12 MB file is put into a text box, which freezes a phone for seconds |
| "Move" link | puts the whole copy in the URL (ui41.js `moveLink`), and Chrome's URL cap is about 2 MB, so it fails within about a year. It is rebuilt on every banner render. |

- **Encryption cost:** the key is made once per session (PBKDF2, fine). Encrypt plus base64 is 0.4 to 0.6 s per save at 10 years.
- **Change NOW:** yes. Add a format field to the blob and the backup file, for example `{fmt: 'gz1'}`.
- **Fix:**
  - Gzip before encrypting. It shrank the made-up copy about 10x (real data maybe 6 to 8x): 10 years heavy is 0.6 to 1.2 MB, about 0.8 to 1.6M base64 characters, which fits under 1.8M.
  - Leave the Undo copy out.
  - Push on leaving the app, on going to the background, and at most every 1 to 2 minutes, not 3 seconds after every save.
  - Read backup files without the text box.
  - Retire or cap the move link.
  - Later: store closed years as separate pieces that never change. That needs a part key on the server, so it is not needed now.
- **Cost:** about 1 day.

## 6. Service worker update and an old page meeting new data
- **Risk:** public/sw.js fetches from the network first, then `skipWaiting` and `clients.claim`, then shows an update banner. An old page left open (desktop tab, or Android keeping the app in memory) keeps its old code. Opened offline, the cached old page is whatever was last fetched.
  - Today, a 38.31 page refuses a v2 cloud blob or backup by accident (`okBackup` needs `steps`/`once`/`cfg`). But it keeps writing its own old key and pushing the old shape. After the move to v2, edits made in such a tab are silently lost.
  - The same risk returns at every later version change.
- **Change NOW:** yes. SCHEMA section 1 already has "refuse to write if the stored `v` is newer". Make every writer check it before each write: local save, other tab, IndexedDB, backup restore, cloud. Signal across tabs with BroadcastChannel. An old page meeting newer data becomes read-only with "Update the app".
- **Other fixes:**
  - The move code reads the old key once, then leaves a marker there.
  - Precache with `{cache: 'reload'}` so a new worker never stores an old page from the HTTP cache.
  - A network timeout of about 3 seconds before falling back to the cache. On a weak connection the app otherwise hangs at start.
- **Cost:** about 0.5 day.

## 7. Time zones and clock changes
**Risks:**
- `new Date('YYYY-MM-DD')` is read as UTC, so the 14th becomes the 13th west of UTC.
- `toISOString().slice(0, 10)` on "now" gives yesterday in Japan before 9:00. Current uses are UTC-safe; keep it that way.
- Adding 86,400,000 ms to local midnight skips or repeats a day at daylight-saving changes, which matters for desktop users outside Japan.
- Flying west moves the local date back by one, so the "date went back" guard asks falsely.
- A clock once set far ahead makes `rev` (max(now, rev + 1), ui0.js `persist`) stay huge forever. The side-branch server clamps it, local code does not.
- The app left open past midnight keeps yesterday's "today".

**Change NOW:** yes, small. `clock.lastSeen` is per device (item 4), and record the time zone offset beside `at` (already ISO with an offset).

**Fix:**
- All engine date math on whole day numbers in UTC.
- Recompute "today" when the app comes back into view.
- Allow 1 day back without asking.
- A check that fails on `new Date(<date string>)` and on "now" sliced from `toISOString` in engine files.
- A test that runs the engine under `TZ=America/Los_Angeles` and `TZ=Asia/Tokyo`.

**Cost:** about 0.5 day.

## Do now, before the shape is frozen (about 4 to 5 days in all)
1. Main store in IndexedDB, per record, and no Undo copy inside the saved copy.
2. Device-only state split out of the shared copy: `ui` look, Undo copies, `clock.lastSeen`.
3. `at` as a hybrid clock, and the merge rule written down.
4. A format flag plus gzip for the cloud copy and backup files.
5. A version check on every writer.
6. Ask for persistent storage.

Speed snapshots and per-year cloud pieces can wait.

**One thing to check:** D1's 2 MB per-row limit is from memory. The side branch's `ROW_ROOM` (1.9M) suggests the vault lane already ran into it.

**Files:**
- /home/user/money-headache-remover/wip/team/ui0.js
- /home/user/money-headache-remover/wip/team/ui42.js
- /home/user/money-headache-remover/wip/team/ui43.js
- /home/user/money-headache-remover/wip/team/ui45.js
- /home/user/money-headache-remover/wip/team/ui5.js
- /home/user/money-headache-remover/wip/team/ui41.js
- /home/user/money-headache-remover/public/sw.js
- /home/user/money-headache-remover/functions/api/vault/[id].js
- origin/side/vault-server LANE_vault.md
