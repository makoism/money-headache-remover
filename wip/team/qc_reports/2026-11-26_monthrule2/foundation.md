FAIL

qc-foundation on lane/monthrule at 9164de24 (round 2026-11-26_monthrule2), 26 Nov 2026. Scope is what this branch changes: the month rule for a life with no fixed pay (CA4, CA5, CA6, CA9) and the order of "this pay only" amounts (CA7). The pay-period path is otherwise the candidate's, already reviewed. Engine tests pass: month_added 15, month_change 10, month_rule 7, month_rule_lines 4, once_order 3. Two lives were run against the engine in a scratch script.

## OWNER'S WORDS
- M1, M3 (AI first, full control): BROKEN for a life with no fixed pay. The assistant cannot see plan lines (chat3_core.js:496 reads r.period.lines, which is null with no fixed pay, lookahead.js:1120, so it gets "None."). Its change cards still say "each pay period" (chat3_core.js:599, 602, 604; ask3_core.js:152, 156).
- M4 (sorts receipts): broken in part. The assistant cannot file a spend to a line it cannot name (finding F2).
- M7, M12 (nothing unknown, clarity): broken by F1 and F2.
- M13 (add, change, remove every kind of thing, after setup): met on the screens. Broken for the assistant (F2). Ending a line and adding it again under its old name is refused (see GRID).
- M14 (Undo): met. Undo marks the entry gone and the engine reads only live entries.
- M31, M38 (month follows pay; no fixed pay runs by calendar month): met.
- M36, M51 (adds up; one meaning): met for CA4, CA6 and CA7. Broken by F1, where one figure counts days from one date and spends from another.
- M44, M45, M48: met. Every calendar month adds to the amount typed, records are read in an order that does not depend on arrival, nothing is counted twice, and yen stays whole.
- M24, M46 (unspent planned money): silent. Listed as NOT BUILT in scope. The Plan screen now says "Starts again each month".
- M6: met as built (removes ask first, plan3.js:261).
- M61, M66, M67: not touched. Nothing saved changes.

## GRID (plan line and Free to spend, no fixed pay; add, change, end, add again after an end, Undo; screens and assistant)
20 cells: 14 covered, 2 not applicable (adding Free to spend again after an end), 4 empty.
- Change a line by the assistant: EMPTY. There is no L ref for a no-fixed-pay life (chat3_core.js:496; FIGURES lists only pays and bills, around chat3_core.js:227 to 236). It works only for a line added earlier in the same chat. This needs the engine to return the lines (F2).
- End a line by the assistant: EMPTY, same cause.
- Add an ended line again by its name, on the screens and by the assistant: EMPTY. sameName treats every entry not marked gone as taken (plan3_write.js:26, 41). endLine sets `ends` and does not mark the line gone (plan3_write.js:79), so a "Food" ended in December can never be called "Food" again. The write door has nothing to start an ended line again. This is a builder finding: the saved shape can hold it with no migration.

## FOUNDATIONAL

F1. A line added partway through a month counts its share from the day it was added, but its spends from the 1st.
- Who: Kai, who has no fixed pay. He sets up 1 Nov with no Free to spend and logs 50,000 of everyday spends from 1 to 17 Dec. On 18 Dec he sets Free to spend at 60,000.
- What happens (run against the engine): the share is 27,096 for 18 to 31 Dec (CA9), less 50,000 spent before the amount existed. The headline is 0, and the engine's why says "Free to spend is 22,904 over this period", seconds after he typed the amount. Without those earlier spends the headline is 27,096.
- The same happens to a line. Food 3,100 is added on 18 Dec. A receipt dated 5 Dec is filed under Food. The 14-day share is used up and nothing is held for Food for the rest of December. No test has a spend dated before the day the line was added (month_added.test.js:44, 49, 88 all spend on 20 Dec).
- Where: engine/lookahead.js:1017 to 1018 shares by shareFrom (the day added). Line 1056 counts spends from lp = countFrom (the 1st, or the setup day).
- Why it is in the base: it is an engine rule, and it is the CA9 ruling read two ways in one figure. The setup-day share (I4) is consistent: the share and the spends both start on the setup day. CA9 is not.
- Needed: a ruling, then one line. Either spends count from the same day as the share (lp = shareFrom), or spends before the day added stay with the money that was free when they were made. Then a hand-worked test with a spend dated before the day added, for a line and for Free to spend.
- Cost: now, one line and two tests. Later, every hand-worked by-day test is reworked again, after a person has been told they are "over" on money they just set.

F2. The engine's answer has no month figures for plan lines when there is no fixed pay.
- Where: planNow works out each line's amount, share, spent and left (lookahead.js:1090). The answer carries them only inside res.period (1118), and res.period is null with no fixed pay (1120). Free to spend has r.everyday. Lines have only a label inside whyParts ("Food left this month").
- Result: Kai's assistant reads "None." for his lines. It cannot change one, end one, or file a receipt to one (M1, M3, M4, M13). No screen and no assistant can say "Food: 900 left of 1,400 this month, because you added it on the 18th". The CA9 share is a figure nobody typed and nobody can read: the very fault CA4 was made to remove.
- This was written in the 25 Nov foundation review of this plan ("res.period is null with no fixed pay, so a line's own month figure is not in the answer for any screen or the assistant") and was not acted on. That is LESSONS 1's warning sign: the same reviewer finding in two rounds.
- Needed: a res.month in the answer (start, end, and for each line id, name, amount, counts, spent, left, the day added), the same shape as res.period.lines. The assistant's 'lines' read and FIGURES then read it. This changes the engine's answer only, not the saved data.
- Cost: small now. Every by-day plan feature (the unspent-money choice, M24 and M46; the two figures, Not settled 8) will need it.

The way in (LESSONS 5 and 2): commit b33868ed made the Plan screen say what the engine does with no fixed pay. The assistant, the main way in, still tells the same person "Food: 30,000 each pay period" and never says that this month counts only the days left. MONTHRULE_PLAN.md names M36, M51, M12 and M13, but not M1 or M3. A fix that names one door for a meaning shown at two doors is lesson 2's warning sign. This one is for the builder (wording from the engine's meaning, chat3_core.js and ask3_core.js), but by point 5 it is a FAIL on M1 and M3.

## WATCH
- CA4, CA5, CA6, CA7 and CA9 each came from a reviewer finding, one case at a time (LESSONS 4: the same rule edited in many places). F1 is the next case. One written definition of "this month" with no fixed pay would stop the spiral: the amount in force today, a share from the later of setup and the day added, and spends from the same day.
- Weekly lines with no fixed pay are left out of CA5's "left this month" (lookahead.js:1196, 1230). They still come off by the day whatever was spent: two meanings of "left", on the safe side. No screen makes one today (plan3_write.js:48 writes month or pay).
- Planned money left unspent at the end of a month drops back into "can spare" on the 1st without a word (M46, NOT BUILT). When that is built it must cut at calendar months for this life. The base can hold that, because it is worked out from dates.
- stepAmount with no pays: nextStart is Infinity (lookahead.js:846 to 847), so a first amount dated in the future counts today. No screen writes one for this life today. Statement import or a dated assistant step could.
- The independent checker still never makes a life with no fixed pay (CA4 watch). Every figure here rests on hand-worked tests.

## Checked and sound
- CA4 arithmetic: every calendar month adds to the amount typed, leap February included. A later month takes the amount in force on its 1st (lookahead.js:1203 to 1209).
- CA5: a line's amount left this month is held once, never below zero (1230), and is never also taken off day by day (1196).
- CA6: this month's amount is the one in force today (1088). An ended line holds 0 (endLine adds a 0 step).
- CA7: "this pay only" amounts are read by `at`, then id (lookahead.js:866 to 875). That does not depend on order.
- CA9: freeSrc.from is the sorted earliest live entry, so neither order nor Undo changes it (857 to 858). Nothing saved changes, and no migration is needed.

## NOT CHECKED
I did not reach most of the full eight-life, twelve-month walk on the pay-period path: twice a month, every two weeks, weekly, set up on the 20th, the couple on one phone, cash and e-wallet. Those parts are unchanged on this branch apart from CA7. I also did not check the three-week absence, refunds and transfers against the by-day rules, and I did not open the build in a browser. Personas were not re-read, and outside pieces were not re-checked (the scope file names the cap, the vault and the write limit).
