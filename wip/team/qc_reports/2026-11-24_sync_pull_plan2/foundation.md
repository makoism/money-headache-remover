FAIL

Version 2 takes in all three faults from the first review. The base is sound: no engine, saved-data or server change is needed. It fails on one thing its own F3 opens up, confirmed by running the engine: the other device's change or removal of a spend can be undone on both devices with no question. Two smaller plan gaps sit beside it. The fixes are plan lines and tests, about 3 to 4 hours.

I read the code and ran one node script against engine/sync.js. No check3, no browser.

## OWNER'S WORDS

- **M61** (nobody loses data): **broken as written** (F1).
- **M20** (same item changed on both: ask, keep the other): **broken in the same case.** Nothing is asked, nothing is kept.
- **M67** (money always joins up): **met for one spend, not met for a burst** (F2). "Send at once" does fix log once, close, look on the desktop.
- **M11, M4** (logs weekly; "here are my new receipts"): **silent.** His real way is several entries in a minute, then close. The plan tests one.
- **M1** (assistant always on screen): **silent, at risk** (F3).
- **M36** (how fresh): **met** in Settings by the last-checked time. Silent on a timer that has stopped (builder note 2).
- **M66** (server limits): **met.** Outside pieces are named and go to the owner before shipping.
- **M45** (no coin twice): **met** by Version 2 F3, if the take at layer close is joined again (see F1).
- **M14, M13:** met. Undo is refused if the record changed since (act3.js:272).
- **M19, M33:** met as the way in. He never taps Send.
- **M21** (iPhone): silent. See WATCH.
- **M64:** met. No deploy in this slice.

## GRID

The plan adds no kind of record. I counted how each kind crosses devices.
- Kinds (7): events, schedules, accounts, plan lines and places, check-ins, settings, kept versions.
- Moments (8): added, changed, removed, undone on the other device, each when this device is in step, and each when the book here could not be replaced at the time.
- 56 cells: 35 covered, 0 not applicable, **21 empty.**
- The empty ones: changed, removed and undone, for all 7 kinds, when the book was not replaced but the base was saved. Added is covered, because the join never deletes (sync.js:185).
- They are empty in the page (cloud3_page.js), not in the base. The engine is right when the base is not moved.
- Cloud copy itself: on, join, stop, delete, deleted elsewhere are on the screens. One empty cell for the builder: "Stop here" with a second tab open (builder note 1).

## FOUNDATIONAL

None in the engine or the saved shape. Three plan faults.

### F1. The base must never be saved ahead of the book

- **Who and when:** Mako on the desktop with a statement review open. On the phone he changed a spend from 1,200 to 2,100 and removed another. The desktop takes the copy. F3 says the book is not replaced while the review is open. He reloads, or the device kills the page.
- **What the code does:** the page saves the new base and revision after every sync, whether or not the book was replaced (cloud3_page.js:82). F3 keeps that line and skips the replace. On the next open the device holds the old book, the new base and the same revision. syncDevice then joins nothing and writes the old book over the cloud (sync.js:348-355).
- **What I ran** (made-up records, real id shapes):
  - Book here: 1,200 and 800. Cloud: 2,100, the 800 removed, a new 500.
  - Written to the cloud: 1,200 and 800. Pushed, not joined, 0 questions.
  - The other device then takes it: 1,200, 800, 500. Its change and removal are gone. 0 questions, 0 kept versions.
  - Control, base not moved: 2,100, removed, 500. Correct.
- **Two paths do this today,** and more syncs make them more likely:
  - Saving the joined book fails (device full, read-only) and the base is still saved (cloud3_page.js:78-82).
  - A write is refused, then the retry fails. The page saves the newer base and drops the joined copy (cloud3_page.js:69, cloud3.js:116-118). I ran this too: same result.
- **Worse with Version 2:** the timer skips the fetch when the revision equals baseRev, so a device in this state reads as in step.
- **What the plan needs:**
  - One rule: base and baseRev are saved only together with the book that holds them. If the book is not replaced, for any reason, the base does not move.
  - A take put off for an open layer is thrown away and done again when the layer closes. That fresh join is also what pairs a statement line with the spend typed on the phone (sync.js:283-300).
  - On a failed sync, keep the base the device started with.
  - Three tests, each failing today: reload with the review open after a take; save refused during a take; a refused write then a failed retry. In each, the other device's change and removal survive on both.
- **Cost:** about 2 hours now. Later it is a removed spend that comes back on both devices with no trace.

### F2. A burst, then close: the owner's weekly way

- **Who and when:** Mako logs three receipts in 30 seconds, or the assistant adds five. He closes the phone.
- **What the plan does:** the first change goes at once. The rest wait for the minute. Closing leaves them to the leaving send, which the plan says cannot be relied on past about 64 KB (about month 8; not tested yet).
- **What he sees:** the desktop shows one receipt of five with a fresh "last checked" time. A part picture that looks whole (M7).
- **What the plan needs:**
  - A send a few seconds after the last change in a burst, not only at the minute. D5 ("at most every 1 to 2 minutes") is the team's line, not the owner's: bring it to the coordinator with this recommendation.
  - On leaving, a plain send when the copy is too big for the outliving kind.
  - A test: three spends in 20 seconds, the page hidden at 25, a copy over 64 KB, the other device shows all three.
- **Cost:** 1 hour now.

### F3. Say which open layers hold a take back

- back3.js lists eight layers (back3.js:18-27). The first is the assistant.
- AI first makes the chat the thing open most of the time (AI_FIRST_PLAN.md:12-15). If it counts as "work in progress", a person who lives in the chat never gets a take.
- Name them in the plan: statement review, setup, Check your bank, a Plan form and a receipt being changed hold a take back. The assistant, Reminders and Settings do not. The write door reads the book fresh at each step (act3.js:215), so the chat is safe.
- A test: chat open, the other device logs a spend, Home under it shows it.
- **Cost:** 30 minutes now.

## Builder notes (the page, not the base)

1. Each tab caches the cloud state (cloud3_page.js:25). With a timer, a second tab still holding "on" writes "on" back within a minute of "Stop here" in the first. Read the state fresh at each timed sync, and add this to the two-tab test.
2. When the timer stops ("code not accepted", "newer version"), only Settings says so. Say it once on Home through the one message queue, or a desktop left open shows old numbers for weeks with no sign.
3. The revision-only call must treat "deleted on another device" (410) as a full sync does.

## WATCH

- **Many people on one address.** The server allows 60 calls a minute per address ("functions/api/vault/[id].js":35). Phone networks put many users behind one address. Fine at a private address. Check before a public launch.
- **Kept versions are the last 10 writes, not 10 days.** More sends make them span minutes. Thinning by day is a later server change, with the owner's yes.
- **The whole copy is sent every time.** The ledger and statement import grow it. Records carry ids and change times, so sending only changes later needs no data move.
- **iPhone.** Timers and leaving sends behave differently there and the tests run Chrome only. Say so in the scope notes.

## Checked and sound

- The way in is right: he logs and looks, and never sends.
- Revision-only check: the server answers with no copy ("functions/api/vault/[id].js":60-63), and its revision equals the device's baseRev after a take and after a send (sync.js:350-355, cloud3.js:105-111).
- Added records survive every case above (sync.js:185-188).
- Two tabs: the second tab's stale base joins correctly and sends nothing (read from the code, not run).
- A half-typed receipt survives the shared redraw (start3.js:50-54).

Files:
- /home/user/money-headache-remover/.claude/worktrees/next/wip/team/foundation_review/SYNC_PULL_PLAN.md
- /home/user/money-headache-remover/.claude/worktrees/next/wip/team/app3/src/cloud3_page.js
- /home/user/money-headache-remover/.claude/worktrees/next/wip/team/app3/src/cloud3.js
- /home/user/money-headache-remover/.claude/worktrees/next/wip/team/app3/src/back3.js
- /home/user/money-headache-remover/.claude/worktrees/next/wip/team/engine/sync.js
- /home/user/money-headache-remover/.claude/worktrees/next/functions/api/vault/[id].js
- Script for F1 (pass the worktree path as its one argument): /tmp/claude-0/-home-user-money-headache-remover/df4d19d8-6228-577e-a7be-cf8fc631c93b/scratchpad/base_ahead.js
