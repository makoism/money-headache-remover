# Plan: money logged on one device reaches the other by itself (24 Nov 2026, MAIN 16)

Read wip/team/MAKO_SAYS.md first.

Serves: **M67** ("Money that happened always joins up across devices"), **M61** (nobody loses data), **M36** (the picture says how fresh it is). Touches: M66 (the server's daily write limit), M20 (the "which to keep" question).
The main way the owner uses this: he logs on his phone and looks on his desktop (DECISIONS "Mako's own money"; M19, M33). He never thinks about sending.

## The fault (qc-north-star on candidate 9c65e8d, blocker 4)
Two phones on one code. Phone two logs a spend. Phone one did not show it after 30 seconds, nor after a reload, until phone two tapped "Send now". Phone two's Settings said "On. Last in step with the cloud at 04:28" the whole time.

## The cause, in src/cloud3_page.js (not a guess: read from the code)
1. **Nothing ever takes the cloud copy while the page stays open.** A sync runs on opening, after a change on this device, on leaving, and on "Send now". There is no timer and nothing on coming back into view. A phone left open, or an installed app brought back to the front, never looks.
2. **A send waits for the last sync of any kind.** `changed3` sends at `max(5 s, lastSync + 90 s)`. `lastSync` is set by every sync, a take included. So a spend logged within 90 seconds of opening the app (the usual case: open, log, close) waits up to 90 seconds. Leaving sends it, but only if the browser gives the page time.
3. **Settings says "in step" while a change is waiting.** `sentAt` is shown even when `C3.dirty` is true.

## The change (one file of code, src/cloud3_page.js, plus tests; no engine, no saved shape, no server change)
A. **Take on coming back and on a timer.** While the cloud copy is on and the page is in view: one sync when the page comes into view (`visibilitychange` to visible, `pageshow`, `online`), if the last one was more than 10 seconds ago; and one every 30 seconds while it stays in view. No timer runs while the page is hidden. A sync with nothing to send is one GET and writes nothing, so the server's write limit (1,500 a day per copy) is not touched; calls stay far under 60 a minute.
B. **A send is spaced from the last send, not the last take.** `changed3` sends at `max(5 s, lastPush + 60 s)`. D5 ("at most every 1 to 2 minutes") is kept: at most one write a minute from typing, plus leaving and Send now. Worst case 8 hours of non-stop changes is 480 writes, under the limit.
C. **A take never wipes what the person is typing.** A timer or come-back sync is put off (tried again 5 seconds later) while a box on screen has typing in progress: the focused element is an input, select or textarea, or a form or sheet is open. Sends are not put off (they do not redraw unless the join brought something new; if it did, the book is replaced as today, but the redraw of the open tab waits the same way). After the book is replaced, Home, Plan and Receipts are redrawn (the same redraw a restore does on lane/homefix).
D. **Settings tells the truth.** While a change is waiting: "On. A change made here is waiting to be sent. It goes by itself within a minute." When a take fails and nothing is waiting, no "on this device only" warning is raised (nothing is on this device only); the next take just tries again.
E. **The "which to keep" notice shows once per new question**, not on every timer sync.

## Tests first (tests/e3_cloud.js, two pages on the local fake vault; each fails on today's code)
1. Phone two logs a spend 2 seconds after joining; with no tap anywhere, phone one's Home and Receipts show it within 45 seconds (test clocks shortened by a hook that only scales the two timers).
2. Phone one is hidden and shown again: it takes the copy at once.
3. Phone one has a half-typed spend when the copy changes: the typed text is still there, and after Save both spends are on both phones.
4. Settings on phone two reads "waiting to be sent" between the spend and the send, and "in step" after.
5. Offline for three timer ticks with nothing changed: no warning; back online: in step.
6. The fake vault counts writes: ten quick spends make at most two writes in the first minute.

## What does not change
The join itself (engine/sync.js), the saved shape, the server, the code, backups, the M20 question. A try book still sends nothing.

## Lives walked
- Mako: phone and desktop, logs weekly. Opens the desktop that was left open since last week: it takes the copy on coming into view. Covered by A.
- A couple on two phones, both open at the checkout: each sees the other's spend within about 35 seconds (5 to send, up to 30 to take). The same bill changed on both: M20's question, once (E).
- Bad signal on a train: sends and takes fail quietly and try again; the warning shows only when a change is really waiting (D).
- A phone that kills the page in the background: the change is already on the device; it is sent on the next open (dirty is worked out again from the base on opening: to be confirmed in the code, and tested if not).

## Version 2 (after qc-foundation FAIL, 24 Nov 18:15 JST; report in qc_reports/2026-11-24_sync_pull_plan/foundation.md)

The review found no engine or saved-data fault, and three faults in the plan. Each is taken in:

**F1. The owner's own way (log on the phone, close it within seconds, look on the desktop) must work.**
- The first change after a quiet minute is sent at once (no 5 second wait). Later changes in the same minute wait for the minute (D5: at most one write a minute, plus leaving and Send now).
- Leaving while a sync is running queues a real leaving send, not only "again".
- The leaving send cannot be relied on once the copy is over about 64 KB (the browser's limit for a send that outlives the page; to be confirmed by a test). So the rule is "send at once", and leaving is only the backstop.
- New test: log, close the page after 1 second, the other device shows it.
- Said plainly to the owner in scope notes: a phone closed with no signal sends on its next open.

**F2. A take must be cheap, and the outside pieces are named.**
- The timer asks only for the revision (the server already answers `?versions=1` with `rev` and no copy). The copy is fetched only when the revision differs from this device's `baseRev`, or a change is waiting. This is a small addition to src/cloud3.js (`revOnly`), so the change is two files, not one.
- Nothing is written to the device when nothing changed.
- The timer is 60 seconds, runs only while the page is in view, and stops after "code not accepted" or "newer version" until the person acts.
- Outside pieces: every vault call, a read too, writes one row to the per-address call counter ("functions/api/vault/[id].js":34). A page in view all day makes 1,440 calls. The Cloudflare daily caps on requests and database writes are shared with the old app and the AI relay; the figures go to the coordinator for Mako before this ships. No server change and no deploy in this slice.

**F3. The book never changes under work in progress.**
- While a layer with work in progress is open (a statement review above all), the book is not replaced; sends may still go, and the take is applied when the layer closes. What is open is asked of src/back3.js, the one piece that knows (no second detector).
- After a replace, the one redraw start3.js already uses for "another tab saved" is called (no second list of screens).

**Also from the review**
- Settings shows when this device last checked with the cloud, moved by a take as well as a send (M36).
- A test with two tabs on one device, both syncing.
- The test hook that shortens timers cannot be reached from the address bar on the live page.
