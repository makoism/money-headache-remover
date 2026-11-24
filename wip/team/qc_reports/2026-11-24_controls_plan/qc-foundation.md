# qc-foundation: CONTROLS_PLAN.md (wip-38.31 at 1d169fb, 24 Nov 2026)

FAIL

CHECK: no check3.txt (a plan review, so there is no build to check).

OWNER'S WORDS
- M13 every kind can be added, changed and removed: MET, except that people (couples) and pay-later have no row.
- M14 Undo everywhere: NOT MET. Undo is lost when the page reloads (finding 2).
- M38 periods run pay to pay: NOT MET when a job changes (finding 1).
- M46 unspent money never drops out silently: NOT MET when a job changes (finding 1).
- M45 nothing counted twice: MET, apart from correction A.
- M61 and M69 nothing deleted: MET.
- M67 and M20 money joins up across devices: NOT MET (finding 3).

## FOUNDATIONAL

**1. Ending the pay that starts the periods rewrites the past.**
- **Who:** anyone who changes jobs: from the 25th to the 10th, or from every two weeks to monthly.
- **The moment:** on 5 Jan: "my old job ended, the new one pays on the 10th".
- **What the base does:** the plan moves the undated `startsPeriod` flag to the new pay. The engine draws every period, past and current, only from the pays of whichever pay holds the flag now (lookahead.js:345, 361-371, 1031).
- **What I saw:** I ran it on the made-up book. Before the change: period 25 Dec to 24 Jan, Food 23,000 left, two past periods. After: the period has no start, Food reads "spent 44,000, over 4,000" (every spend since setup), and there are no past periods.
- **Why that matters:** a confident false overspend, and past periods vanish. The plan's own line "Periods before it are unchanged" is false. BY1 accepted the undated flag because that case had "no life in version one". endPay creates it.
- **What the base needs:** a dated starter, in the saved data and the engine:
  - dated `startsPeriod` entries on the pay (`{ from, at, by }`, like `rules`);
  - past periods drawn from whichever pay held the flag on that day.
- **Cost:** about a day now, before slice 7. Later, every book where the flag moved has lost the switch date, so its periods are rebuilt by guesswork.

**2. Undo dies with the page, and the plan's rule for it cannot be built on today's data.**
- **Who:** Mako on Android with the app installed (M33). Android throws away background apps within minutes.
- **The moment:** he tells the assistant "I closed my old e-wallet", checks his bank app, and comes back to a reloaded page. The Undo bar is gone.
- **What the base does:** after a reload, `undo()` finds only what a step added (`grp`) or removed (`goneBy`). It never finds what it edited: `edited = mem ? mem.edited : []` (act3.js:269). An edit saves no step mark and no old value (act3.js:118-131).
- **Why the plan's answer does not work:**
  - F-A ("refuse a step with edits after a reload") cannot tell whether a step made edits.
  - An edit-only step (setKeep, changeAccount, changeCheck) cannot be found at all.
  - The plan's fallback, Reopen, leaves the closing transfer in place, so it is not an Undo.
- **What the base needs:** a saved step journal, on the device or synced: step id, label, and the old values of each edit.
- **Cost:** about a day now, in slice 2. Later, every step made before the journal can never be undone.

**3. A true remove on one device swallows money logged on another.**
- **Who:** a couple on two phones, or one person on phone and desktop.
- **The moment:** on the desktop, an e-wallet "added by mistake" passes the no-history test and is removed. Meanwhile the phone, offline, logs a 3,000 spend on it.
- **What the base does:** after the merge, the engine skips gone accounts (lookahead.js:75), so the spend moves nothing.
- **What I saw:** on the made-up book, `afterSync` returns `{"questions":[],"notices":[]}`. Nothing is asked.
- **Lines too:** a spend on a removed line falls silently into Free to spend (ledger.js:63).
- **Why the plan misses it:** M20's which-to-keep question compares two versions of one record, not a live record naming a gone one.
- **What the base needs:** an engine and sync rule. A live record that names a gone account, line or schedule brings it back, with a notice, like the reopen rule for closed accounts (AP1).
- **Cost:** a few hours now. Later, totals are wrong in real books until the rule exists.

## Plan corrections (no base change)

**A. removeImport must put back what its lines replaced.**
- Typed records are marked gone in saved data with `goneBy` set to the import line:
  - by sync's rematch (sync.js:305);
  - when the same payment is read from both a bank and a card import (stmt3_plan.js:236).
- The plan says matched records "were never marked gone in saved data". That is wrong in both cases above.
- Taking only the import out leaves that spend or card payment counted nowhere.
- Fix: in the same step, restore every record whose `goneBy` names one of the import's lines.

**B. changeCheck must handle the gap spend.**
- A check-in can log its gap as a spend marked `dayInside` (checkin3.js:148).
- If the figure is corrected later, that spend keeps the old gap. The line then shows wrong spending and a false gain.
- Fix: change or remove that spend (same `grp` and account) in the same step.

**C. "Latest check-in" needs a definition.**
- Define it per account, and count check-ins written by imports.
- Otherwise a bank check followed by a card import can never be removed.

## WATCH

- **People and pay-later have no rows.** e3_controls step 1 will fail on `people`. Build the table's rows from the act3 lists and account types, not by hand, before couples (stage 2) or pay-later (lane A) merge.
- **Closing an account in another currency** needs a `convert`, not a `transfer` (stage 2 currency).
- **sync.js reads the wrong field.** Lines 289 and 425 read `a.kind`, but accounts have `type`. The effects:
  - cards get a 1-day match window instead of 7;
  - closed cards and loans get the wrong sign in `figureAtClose`.
  It is harmless only while every close writes a check on the closing day.
- **Yen is the default (M34) and Philippine people are planned.** Someone who types peso amounts under yen can only fix it with Start again and re-entry. A rescaling relabel could come later, but it rewrites every amount, so keep it out of v1.

## Checked and sound

- **Close keeps history.** The closing records, the "closed with money" refusal (P6) and the reopen rule (AP1) match between the engine (lookahead.js:288) and sync (sync.js:453).
- **Removing a goal is safe.** The engine already reads a gone place by its day and sends its money to Waiting (lookahead.js:836, 848). The plan's "ask where the money goes" sits safely on that.
- **Ending the only pay works.** It goes through the no-fixed-pay cut (BQ1), and past periods hold.
- **A gone `set:` tick comes back cleanly** (act3.js:100).
- **Undo within one visit is complete,** and it refuses when a later step touched the same record.
- **Keep at least** as a field write fits `home.main` and the main-and-minimum question (sync.js:500).
- **Lives walked:** paid on the 10th (Mako), twice a month, two-weekly, weekly, freelance with a zero month, set up on the 20th, a couple, cash and e-wallet. Only findings 1 and 3 gave wrong numbers.

Scripts: /tmp/claude-0/-home-user-money-headache-remover/56d83688-aae8-5b59-9405-fa6c42a7ff6e/scratchpad/jobchange.js, goneacct.js
