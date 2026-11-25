(Saved by LANE C from the reviewer's reply: qc-foundation on the last section of MONTHRULE_PLAN.md, "The month a change is made in (CA6)", 25 Nov 2026 about 20:20 JST. Shortened.)

VERDICT: PASS. No blockers. The rule holds the lives asked about with no engine rework and no saved-data change.

Tried in a scratch copy: month_change.test.js 4 of 4, run_all ALL PASS (30 runs, 779 asks), plan3_write (39), chat3_core (24), answers3 (13) pass. Nothing existing moves; no existing test covers this moment apart from the new cases.

Owner's words: M36, M51 met (the Plan screen already reads the amount in force today, plan3.js:26 to 31; the engine read the month's first day, lookahead.js:1074: two figures for one thing, made one). M13, M14, M12 met. M20, M67 not broken.

Walked (bank 2,000,000, everyday 40,000, Food 30,000, set up 1 Nov; old rule then new):
- Raised to 60,000 on 16 Dec, 25,000 spent: left 15,000, then 35,000. On 15 Dec both give 15,000.
- Lowered to 20,000: 5,000 over, headline 0.
- Line ended 16 Dec with 12,000 spent: the old rule kept 18,000 held until the 1st for a line the Plan screen already hides; the new rule holds 0 and canSpare rises by exactly 18,000 (1,931,300 to 1,949,300). The strongest reason for the change.
- Food lowered to 10,000 with 12,000 spent: held 0, never negative.
- Setup 20 Nov, raised to 60,000 on 25 Nov, 5,000 spent: counts 60,000 x 11 / 30 = 22,000, left 17,000 (was 14,666 and 9,666). 1 Dec gives a full 60,000.
- Step dated ahead (20 Dec, seen 16 Dec): old amount until the 20th, then 50,000 with 25,000 left. Dated 1 Jan: December unchanged.
- Two changes in one month (12th to 60,000, 16th to 30,000): 35,000 left on the 14th, 5,000 on the 16th. Two on the same day: the later `at` wins; reversed and shuffled records give the same.
- Undo (share marked gone): back to 15,000. Changed on 31 Dec: 35,000 that day, 60,000 on 1 Jan.
- Three values and "lasts about" stay consistent; no second route reads the month's amount.

The rejected alternative (sharing the month by days) is less sound: 37,741 for Food, a figure nobody typed; an ended line would still hold 2,516; fragile with same-day changes and Undo; differs from the pay-period path.

Notes for the builder: 1. test 4 must use setup 20 Nov (counts 22,000, left 17,000). 2. add: a line ended mid-month, two same-day changes shuffled, Undo, the last day, a step dated ahead. 3. Math.max(today, countFrom) is always today: pass today. 4. update the stale comment at lookahead.js:1190, BQ3, CA4 and CA6's text. 5. a weekly line with no fixed pay now also changes from today: name it. 6. in the setup month a raise is shared from the setup day, not from today: one for Mako's run.

Watch: three copies of "in force today" (lookahead stepAmount, schedules.js:131 stepOn, plan3.js:29 to 30): pin them with one check. A future "months gone by" view must pick the amount in force on the month's last day. app3/src/chat3_core.js:178 reads a pay or bill amount as the last step in saved order, not by `from` then `at`: after a sync merge the assistant could quote another figure than the engine. By-day lives still have no independent checker.
