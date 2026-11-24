FAIL

The plan needs no engine change and no saved-data change. It fails as written for three reasons that are all cheap to fix in the plan before building:
1. It does not make the owner's main way work (log on the phone, close it, look on the desktop).
2. It says a take "writes nothing" on the server, which is not true.
3. It leaves one way for the book to change under an open statement review.

I read the code and ran one node script for sizes. I ran no check3 and no browser test.

## OWNER'S WORDS

- **M67** (money always joins up): **partly met, broken for the main way.** The plan fixes a device that stays open. It does not fix a phone closed within 5 seconds of logging (F1).
- **M61** (nobody loses data): **met.** The join is untouched and a take never drops a local change (cloud3_page.js:74, sync.js:186-194).
- **M36** (says how fresh it is): **partly met.** Change D fixes "in step" while a change waits. But `sentAt` only moves on a send (cloud3_page.js:82), so after a take Settings still shows the old time. The plan is silent.
- **M66** (daily write limit): **met** for the per-copy limit. The claim about server writes is wrong (F2).
- **M20** (which to keep): **met.** The question is untouched and E shows the notice once.
- **M14** (Undo): **met.** Undo takes back one step and is refused if the record changed since (act3.js:272-273), so a take cannot make Undo roll back the other device's change.
- **M45** (no coin twice): **at risk** in one race (F3).
- **M19, M33:** met as the way in. He never taps Send.
- **M1 to M5:** silent, and that is fine. The assistant writes through act3, which reads the book fresh at each step (act3.js:215), so a take in the middle of a chat is safe.
- **M64:** met, no deploy needed. **M63, M68:** not touched.

## GRID

The plan adds no record kind and no write. I counted how each kind crosses devices by a timer take.
- Kinds: events, schedules, accounts, plan lines and places, check-ins, settings, kept versions.
- Moments: added, changed, removed, undone on the other device.
- 28 cells, all covered by the same join as today. 0 empty at the base.
- Cloud copy itself: on, join with a code, off, delete, deleted elsewhere are all on the screens. The assistant has no cloud action (none in ask3_core.js). That is not needed if sending is automatic.

Empty cells for the builder (screens and tests, not the base):
- Logged, then closed within 5 seconds (F1).
- Statement review open while the book is replaced (F3).
- Two tabs on one device: each tab holds its own in-memory cloud state (cloud3_page.js:25), and with a timer both will now sync. I believe the join makes this safe, but no test covers it. Add one.

## FOUNDATIONAL

None in the engine or the saved shape. The three plan faults follow.

### F1. Mako's own way is still not served, and gets worse as the copy grows

- **Who and when:** Mako opens the phone, logs a spend, closes it within 5 seconds. Later he looks at the desktop.
- **What the code does:**
  - Change B still waits at least 5 seconds before sending (cloud3_page.js:99).
  - Closing earlier leaves only the leaving path (cloud3_page.js:108-110).
  - That path first does a GET with no keepalive (cloud3.js:71), then decrypts, joins and packs, then does the PUT with keepalive (cloud3.js:109).
  - A page swiped away dies before the PUT starts.
- **The size limit:** browsers refuse a keepalive body over about 64 KB. I measured the PUT body with made-up books at 110 records a month:

| Months of use | PUT body |
| --- | --- |
| 1 | 10 KB |
| 6 | 50 KB |
| 12 | 99 KB |
| 24 | 196 KB |

  So from about month 8 the leaving send fails every time. The 64 KB figure is from my knowledge of Chrome, not tested here. Confirm it with a test.
- **A second gap:** leaving while a take is running only sets `again` (cloud3_page.js:54). With a take every 30 seconds that will happen often.
- **What the person sees:** the spend is not on the desktop until he opens the phone again. Nothing is lost.
- **What the plan needs:**
  - The first change after a quiet minute sends at once. D5 still holds at one write a minute.
  - Leaving while busy queues a real leaving send.
  - Add the test "log, close after 1 second, the other device shows it".
  - Tell the owner plainly what remains: a phone closed with no signal sends on the next open.
- **Cost:** about 2 hours now. Later, the same north-star blocker comes back a third time (lesson 1 warning sign).

### F2. "One GET and writes nothing" is wrong, and the outside piece is not named

- **Every vault call writes to the database.** GET included, each call writes a row to count calls per address per minute ("functions/api/vault/[id].js":34, functions/_lib.js:46). I found no clean-up of that table.
- **Volume:** a page in view makes 2,880 calls a day. The Cloudflare plan's daily caps on requests and database writes are shared with the old app and the AI relay. The plan does not name them (point 7).
- **Each take is heavy:** it downloads the whole copy (about 100 KB after a year, so about 12 MB an hour on mobile data), unpacks it, and rewrites the whole base copy to the device store (cloud3_page.js:82), all with nothing changed.
- **What nobody checked:** that people's mobile data and battery are free. The Philippines personas use prepaid data.
- **What the plan needs:**
  - The timer asks only for the revision. The server already answers `?versions=1` with `rev` and no blob.
  - It fetches the copy only when the revision differs from `baseRev` or a change is waiting. This needs a small change in cloud3.js, so the plan is not "one file".
  - Skip the device write when nothing changed.
  - Show the owner the daily request figures.
- **Cost:** about 2 to 3 hours now.

### F3. The book can still change under an open statement review

- **Who and when:** a couple, or Mako with both devices in use. The desktop has a statement review open. A pending send fires, and change C does not put sends off. Its join brings in a spend typed on the phone.
- **What the code does:**
  - "Add" uses the plan drawn before the take (stmt3.js:207-208), so the line is added as new.
  - The after-sync rematch only pairs a line and a typed record that came from different devices (sync.js:296-300). Here both are now on this device, so they are never matched.
- **What the person sees:** the spend is counted twice, with no question.
- **How likely:** rare, and possible today. More takes raise the odds a little.
- **What the plan needs:**
  - While a layer with work in progress is open, the book is not replaced at all (sends may still go). Or stmt3Add plans again on the current book before adding.
  - Use back3.js (the one piece that knows what is open, back3.js:18-28). Do not write a second detector (lesson 2).
- **Cost:** 1 hour now.

## WATCH

- **Redraw list.** The plan names Home, Plan and Receipts. start3.js:50-54 already has that redraw for "another tab saved". Use the same one function so the next screen is not missed.
- **Polling after a hard failure.** After "code not accepted" or "newer version", a 30 second timer keeps calling for ever. Stop or slow the timer on those.
- **Settings "waiting" after a reload.** It reads an in-memory flag that is false after a reload until the first sync. This is brief, and the sync itself always works out again what to send (sync.js:349-354). That confirms the plan's "to be confirmed" line: an unsent change does go on the next open.
- **Restore** (not settled 7). With takes by themselves, a restore on one device reaches the other within 30 seconds with nobody tapping. The one-line warning on the restore screen now matters more.
- **Statement import at scale and the ledger.** Copy size grows with every record. The rev-only check in F2 is what keeps this plan sound when the ledger is full.
- **The test hook that scales timers.** Keep it out of reach of the address bar on the live page.

## Checked and sound

- A take with nothing new sends nothing and cannot ping-pong between devices: both sides strip the store's own marks before comparing (cloud3.js:79, sync.js:349).
- A change made during a sync is joined and sent next time (cloud3_page.js:74).
- The write door plans from the current book inside its own queue, so no stale copy is written (act3.js:215, 238).
- Check your bank works out its gap from the current book at Save (checkin3.js:83, 144).
- The per-copy write limit holds under change B: at most 1 write a minute, against 1,500 a day.
- The service worker never answers `/api/` (sw3.js:17).
- A try book sends nothing (cloud3_page.js:53).
- A copy deleted elsewhere turns this device off once (cloud3_page.js:61-66).

Files:
- /home/user/money-headache-remover/wip/team/foundation_review/SYNC_PULL_PLAN.md
- /home/user/money-headache-remover/wip/team/app3/src/cloud3_page.js
- /home/user/money-headache-remover/wip/team/app3/src/cloud3.js
- /home/user/money-headache-remover/wip/team/app3/src/stmt3.js
- /home/user/money-headache-remover/wip/team/app3/src/back3.js
- /home/user/money-headache-remover/wip/team/app3/src/start3.js
- /home/user/money-headache-remover/functions/api/vault/[id].js
- /home/user/money-headache-remover/functions/_lib.js
- Size script: /tmp/claude-0/-home-user-money-headache-remover/df4d19d8-6228-577e-a7be-cf8fc631c93b/scratchpad/size.js
