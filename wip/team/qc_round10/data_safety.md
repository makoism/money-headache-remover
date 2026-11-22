# QC round 10, Data safety: FAIL (2 blockers)

Saved by MAIN 13 from the agent's reply. 412x915, cloud_lib server, two profiles. All 7 jobs done; CLOUD MOVE PASS, CLOUD FAIL PASS. Bill line removal (the act_keep removeLine case) passed 4 of 4, two with a reload 0.3 s after Tap again.

## Blockers
1. Undo silently deletes receipts logged after the change it reverses. Remove "Rent or mortgage", Tap again, log ¥3,333 on Receipts, reload, tap Undo on "Rent or mortgage was removed. You can undo until 25 Nov 2026.": Rent comes back and the ¥3,333 receipt is gone. Same after "Set all to zero" (its confirm says "Receipts stay."): a ¥4,444 receipt logged after it is gone after Undo. Fix: Undo brings back only what the action changed, or asks first ("Undo also removes what you did since: 1 receipt (¥4,444).").
2. A second removal silently ends the first one's 3-day Undo: remove Rent, then Utilities, then Food, reload: only Food's Undo is offered; Rent can no longer come back before the promised date.

## Confusing
1. The send-failed notice starts 1,488 px down Home; the header still says "Saved in this browser" (MAKO_RUN 3.6).
2. The bill line confirm does not say what is lost: "Tap again: removes Rent or mortgage, ¥85,000 a month, from every month. You can undo for 3 days."
3. Lost code: only the code screen says what happens; add under Find my copy: "Lost the code and every device? The cloud copy can't be opened. A backup file (Settings, Restore) brings your numbers back."

## Polish
1. Visual first: a cloud picture for the cloud state (MAKO_RUN 3.6).
Files: /tmp/qc/data/.
