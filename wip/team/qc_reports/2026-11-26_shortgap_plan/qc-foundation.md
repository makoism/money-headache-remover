# qc-foundation: SHORTGAP_PLAN.md (plan review, lane/shortgap at baed457b, 26 Nov)

FAIL

The direction is right: a short bank's gap becomes a dated move out of the bank that pays it, worked out in the engine, with the screen only reading it. Nothing in the saved data has to change. It fails for three reasons. The rule as written does not produce the plan's own numbers. It leaves a second verdict ("Short by") standing beside the new headline. And its pinned headline goes against M90. All three are engine-output fixes that are cheap to make now and costly to make after LANE J builds on top.

## OWNER'S WORDS
- M1, M3, M4 (AI first, full picture): SILENT, partly broken. ask3_core.js:51 sends the assistant "Short by" from safeToSpend.short, and the plan keeps that untouched. The assistant would say "Short by 94,000" next to safe to spend 179,400 and would know nothing of the cover. move_money exists (chat3_core.js:201, 612), so "move it for me" or "remind me on the 9th" are natural, but the plan never names the assistant.
- M7, M12 (see what is safe, clarity): BROKEN as planned. See F2.
- M13 (change every kind of thing): SILENT. The plan's own person wants "pay Card A from Main instead". Nothing can change a card's paying bank (plan3_write.js:384 changeOwed has no payFrom, and CONTROLS_PLAN.md:81 does not list it).
- M23 (several banks): MET in intent.
- M36 (picture adds up): MET for bank figures (Beta's own walk is kept).
- M37, M38 (bank today, pay to pay): BROKEN in the pay-day case. See F1.
- M40 (cards, bank after cards): MET. The after-cards rows still show Beta at -22,000 before the move, which is true.
- M45 (no coin twice): AT RISK. See F4.
- M47 (amber, no shame): MET (no change).
- M61, M69: MET. No saved-data change.
- M90 (cards come off safe to spend; with no play amount, what is on the cards comes off too): BROKEN by the pinned numbers. See F3.
- M91 (options, including later): SILENT on "move now", "pay it from another bank" and "later".
- M98 (walk it as a person): MET in form. The walk misses the pay-day order and the check-in after the move (F1, F4).
- Section B M14 (Undo): MET. Covers are derived, and the moves the person logs use act3 Undo.

## GRID (kinds the plan touches x add / change / remove-end / undo x screen / assistant = 40 cells)
21 covered, 6 not applicable, 13 empty. All 13 empty cells are writes from a screen or the assistant. None needs a saved-shape change.
- Bank account (Beta): add from a screen after setup; change (rename, own minimum, spend-from) on screen and assistant; close and remove on both. 5 empty. All are already in CONTROLS_PLAN slices 4 and 5.
- Card's paying bank: change on screen and assistant (missing everywhere, not in CONTROLS_PLAN); remove card on both (CONTROLS slice 6). 4 empty. Builder finding: add payFrom to changeOwed and change_card.
- Move between own accounts: assistant change and assistant remove (remove takes spends only, CONTROLS_PLAN.md:53). 2 empty.
- Cover (derived, no record): add, remove and undo are not applicable. "Choose which bank covers" on screen and assistant is 2 empty, deferred by the plan. A person with two everyday banks (a couple) will need it. Later it fits an optional field on the short account (coverFrom), with no migration.
- Bill's paying bank: 8 of 8 covered (add_bill, change_bill with account, end_bill, act3 undo).

## FOUNDATIONAL (engine rule, fix in this plan before building)

F1. The rule gives 201,400, not 179,400. Who: Mako, paid on the 10th, with Card A paid from Beta on the 10th.
Step 4 puts the cover on the main bank "order 1, after a pay the same day". The walk sorts by day, then by order (lookahead.js:1234), and judges the lowest point at the end of each day (1242 to 1246). On 10 Dec the main bank ends at 201,400 + 240,000 - 22,000. Its lowest point stays 201,400 today; the repro confirms nothing comes out of it before pay. So the headline would be 201,400 in all three states, not the plan's 179,400. The plan says both "the period its bill falls in" (10 Dec starts the next period, 10 Dec to 9 Jan) and "179,400" (this period). Those two cannot both hold.
The real person decides it: Card A's 54,000 is already spent, and the bank takes Card A out on the morning of the 10th, often before pay shows or before a transfer between banks arrives. A move "by 10 Dec" made from pay money is unsafe.
Needed: the cover move lands before the bill, on the day before, or ordered before a pay on the same day (order -1). Write that into the rule and the tests, and add a test where the bill falls on pay day (the plan's own case) and one where it falls the day after.
Cost now: one line of the rule. Later: the headline and move days of every second-bank user change after screens and LANE J's change card are built on them.

F2. Two verdicts on one Home. Plan step 6 keeps the short account's warnings. safeToSpend.short is taken from the first below_minimum warning (lookahead.js:1345 to 1348), so it still names Beta. home3.js:195 to 199 prints "Short by 94,000, below zero from 10 Dec" under safe to spend 179,400, the assistant repeats it (ask3_core.js:51), and moveText still fires from the warning (home3.js:206). This is lesson 1's warning sign (two figures on one screen for one thing).
Needed: for a covered account, safeToSpend.short is null (or points at the payer if the payer goes short), and the warning carries `covered: { from }` so the screens and the assistant word it as the move, not as a shortfall.
Also: the payer is walked again, but its firstUnder, below_minimum warning, real, and realWalks[payer] (used by canSetAside at 1404) must come from the walk with the covers. Otherwise a main bank pushed under by a cover goes short with no warning, and goals can be set aside from money Beta needs. Simplest: give walk() a covers map, so every call (1272, 1312, 1366, 1404) sees the covers. Then lastsAboutWeeks and "later on" agree too.

F3. The pinned headline breaks M90. In this book there is no play amount (no budget lines, no Free to spend). M90 then says what is on the cards comes off safe to spend: Card A 54,000 and Card B 23,000. The plan pins 179,400, which still leaves Card B's 23,000 (paid from the main bank on 11 Dec) on the headline. No plan in foundation_review names M90 (grep finds it only in MAKO_SAYS.md), and by the rules on that page that is a process fault for the coordinator.
Needed: the tests pin res.canSpare and the cover moves, not the headline, and the plan says how the cover joins M90's card rule (a card's gap is never taken off twice: once as "on the cards" and once as a cover). Tell the coordinator that M90 has no plan.

## Findings for the builder (no saved-data change)
- F4 (M45): The person makes the move in their bank app, then at Check your bank types only the new main figure. The 22,000 drop is read as spending (a filler) and the cover is still taken, so it counts twice until Beta is checked. The check-in, and the assistant, should offer "moved to Beta" and log a transfer.
- Payer choice: step 3 says "the same rule as moveText", but moveText needs the payer to spare the whole amount (status.js:250). Say what happens with a partial cover, and give a tie-break by id for step 7.
- Real versus full walk: the moves come from Beta's full walk (goals and plan lines), but step 4 adds them to the payer's real walk too. A cash envelope with plan lines would then make the main bank "go below zero" on planned money, which breaks BM2 (lookahead.js:1191). Use moves from the real walk for the real walk and from the full walk for the full walk.

## WATCH
- Couple on one phone: the cover picks whichever everyday bank has the most room, which may be the partner's. It is fine for Mako, but wrong once couples arrive. Choosing the bank needs the optional field above.
- Several currencies: never covered, warned as today. Holds until a second currency becomes a stage.
- Statement import and the ledger: a covered move is never a record. An imported transfer between own accounts must match the cover so it is not counted as both (same family as F4).

## Outside pieces
None new. The assistant part relies on the existing AI relay (its switch was not checked in this review).

## Checked and sound
- Saved data: covers are derived only. They use account.payFrom, schedule acct and transfer events that already exist (SCHEMA_V3). No migration, and no number at risk.
- Paid twice a month, every two weeks, weekly: a cover after the next pay is met by that pay. A late pay (BH1, lookahead.js:1205) leaves the walk, so the cover then lowers the headline. That is safe.
- Freelance, no fixed pay: no pay in the walk, so every cover inside the horizon lowers the headline. Safe.
- Set up on the 20th with pay in the bank, three weeks away, a refund into Beta: the gap is worked from Beta's figure today, a past-due card payment walks as today (lookahead.js:1220) and gets a cover dated today, and a refund shrinks the cover. All sound.
- Recurring Rent from Beta: the horizon ends at the second pay (1125), so the test's two moves are right for 1 Dec.
