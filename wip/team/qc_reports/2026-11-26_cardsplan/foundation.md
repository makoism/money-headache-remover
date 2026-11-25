(saved by LANE F from the reviewer's reply; the reviewer did not write the file)

FAIL (one foundational finding, cheap now; otherwise the cards plan is a sound way to build M90)

You asked me to save this as foundation.md in /home/user/cashplan/wip/team/qc_reports/2026-11-26_cardsplan/. I have not written the file: my rules say the caller saves it.

What I reviewed: the cards plan (origin/lane/cardsplan 5728e46d, wip/team/foundation_review/CARDS_IN_HEADLINE_PLAN.md), read as slice E3 of /home/user/cashplan/wip/team/foundation_review/CASH_PLAN.md, against the engine in /home/user/cashplan/wip/team/engine.

## OWNER'S WORDS
- M90: met for cards paid in full, in yen.
  - Play amount set: headline = min(canSpare, play left). A card spend with no line already counts as play spent (lookahead.js:1035), and with this plan it also comes off canSpare.
  - Bank after the cards: unchanged (BK6, lookahead.js:1446).
  - Play amount skipped: everything owed comes off.
  - Not covered: cards that carry a balance stay on their payment days (a ruling for Mako, and app3 cannot make such a card anyway, plan3_write.js:379 always writes inFull: true). Spends on cards in another currency are left out until stage 2 (lookahead.js:1046).
  - "Setup always asks for a play amount" is not in this plan. CASH_PLAN section 4 question 3 carries it.
  - The plan's header predates M90. It still asks Mako "yes or no to the meaning" and does not name M90, M93 or M95. Fix the header before slice 1 so nobody re-asks a settled question (M85).
- M1, M3, M4, M5: met. The change card shows the drop, noteOf and EXPLAIN.cards are rewritten, and the assistant's summary gains the cards line.
- M6: touched, and the plan names it. Asking first compares a change with the headline. With play set, a grocery spend on a card larger than the play money left asks first even though it never touches play money. This is for the builder.
- M13: broken for cards, silently. A card cannot be closed or removed, its paying bank cannot be changed, and the assistant cannot change a card at all (see GRID). This was already missing; the plan makes cards central without listing it.
- M14: met (no saved change, so Undo is untouched).
- M23: silent. The engine has a pay-later type (lookahead.js:34) but app3 cannot add one. People will enter a pay-later service as a card, which the plan handles correctly.
- M27, M28, M30, M31, M37, M38, M40: met. Mako's shape is worked through on his pay day and the days around it.
- M32, M41: met. "Not sure" takes everything owed.
- M36: met. Each card is named in the sum. A card due before pay appears both in the sum and in the "Due before next pay" box: counted once, worded twice (for the builder).
- M44, M45: met. The dated card steps are replaced, never added on top. Cases A to G are worked by hand, and records in nine orders are tested.
- M47: met (`cards_over` instead of a false "plan over").
- M51: met. The plan now admits that "the bank after the cards" no longer equals safe to spend plus the cards.
- M61, M66, M67: met. Nothing saved changes and nothing needs migrating.
- M91: touched and silent. Changing your mind later about the play amount cannot be done (F1).
- M93, M95: consistent. A wallet check gap counts as play money (lookahead.js:1053).

## GRID
Six kinds the plan touches: card account, card spend, card refund, card payment tick, card figure, play amount. Each was checked for add, change, end or remove, and undo, on the screens and through the assistant: 48 cells.
- **39 covered, 0 not applicable, 9 empty.** None of the empty cells is about setup only.

Empty cells:
1. Card, change, assistant. There is no change_card step (chat3_core.js:201). On the screen too, only name, pay day and close day can change: not the bank that pays it, and not whether it is paid in full (plan3.js:349 to 357).
2. Card, close or remove, screen. Only loans can be closed (plan3.js:357).
3. Card, close or remove, assistant. plan3_write.js has no closeCard; the saved shape already holds `closed`.
4. Card spend, change, assistant. There is no edit step; the only way is remove then add.
5. Refund, change, assistant: the same.
6. Card payment tick, change, assistant: the same.
7. Card figure, change, assistant: the same.
8. Play amount, stop, screen. FOUNDATIONAL (F1).
9. Play amount, stop, assistant. FOUNDATIONAL (F1).

Cells 1 to 7 are for the builder: the write door and saved shape can hold them.

## FOUNDATIONAL
**F1. Nobody can move from "play amount set" to "play amount skipped" on a later day.**
- Who: Ben (CASH_PLAN scene 3) sets play money at setup because setup always asks. Two months later he tells the assistant he would rather not keep a play amount and just wants to see what the bank can spare.
- What the base does:
  - Play money only exists once a saved entry with free != null exists (lookahead.js:838 and :855). After that it can never return to "not set".
  - setFree accepts 0 (plan3_write.js:84). That is not "skipped": it caps safe to spend at 0 every period from then on (lookahead.js:1347).
  - The only other route is removing the entries (act3.js:211). That rewrites every past period as if he never had play money, which breaks M44.
- Why this sits in the base and not on a screen: M90 now gives the two states different meanings (play left against all the cards), and this plan builds both. Moving between them is a dated fact about the plan, so the saved shape and the engine's "entry in force on a day" rule (stepAmount, lookahead.js:842) must be able to hold it. No screen can make it up.
- What the base needs: one dated entry meaning "no play amount from this period". For example, a share with `free: 'none'` (or `stop: true`), read by stepAmount as null, so freeSrc is null for periods from its `from`. setFree and the assistant's set_free gain "stop"; Undo works as for any entry.
- Cost now: small. CASH_PLAN E1 already changes the same `plan.shares[]` shape (pct), so it is one more value, one engine branch and about four asks. Later: the same engine change, plus books in the meantime where people typed 0 and live with a headline of 0, and they cannot be told apart from a real 0. No data is lost either way.

## WATCH
- **Second currency (stage 2).** Spends on a card in another currency neither count as play money nor come off safe to spend (lookahead.js:1046 and :1334). M90 will not hold for a person who travels until stage 2 brings the cards-now step into the other currency. The plan names this.
- **Carrying cards and pay-later.** Today nobody can create either in app3. When someone can, the skipped branch leaves them dated, against M90's "what is on the cards". A ruling is needed before those doors open.
- **An instalment purchase on a card** (a separate account with `of`) counts in full as play money spent on the day it is bought (lineOfSpend, lookahead.js:1035). The posted parts come off canSpare correctly (lookahead.js:562 and :1232). That is an old fault, and with play money as the headline it becomes visible.
- **A couple on one phone** has one play amount per book (freeSrc). M90 "setup always asks for a play amount" means one for the household until the engine has one per person.
- **Account fields will disagree.** After the change, accounts[].headroom comes from the cards-now walk but lowest and lowestDay come from the dated one, so lowest - minimum is no longer headroom. Today only status.js:200 joins them, and it is guarded by firstUnder. Any new screen or the 3D world must not join them either.
- **Two devices on different builds** during rollout show different safe to spend figures for the same data. Nothing is damaged; the cloud copy is the same.
- **The checker** (oracle_v2 on lane/checker-b) and the reference model must take the one rule in the same slice. Otherwise the same rule lives in three places (LESSONS 4 warning sign). The plan says so.

## What I checked and found sound
- The replacement in walk() (lookahead.js:1223 to 1230). For a card paid in full, the open item's amount is owedNow plus the card bills still to come before its close (lookahead.js:745), so splitting those bills out and taking max(0, owedNow) today counts each yen once.
  - A refund on a card that still owes a statement lowers what is taken today (52,000 against the 54,000 statement). That is right for "everything owed".
  - A cash advance, or an early card payment moved from the bank, now nets to zero today. Under the old rule a cash advance raised safe to spend until the card was paid; the new rule ends that.
  - Instalment parts not yet posted stay dated. That is correct, because they are not on the card yet.
- The headline sum (lookahead.js:1343 to 1347) and the three values (lookahead.js:1391 to 1405). With play set the headline is unchanged and only no-job money drops, so the extra-money notice in CASH_PLAN E4 never offers money the cards will take.
- Kept dated, as they should be: bankAfterCards, the goal warning, the real-money walk, canSetAside, how long the money lasts.
- People with no fixed pay are unchanged: the walk already takes every card item by the horizon end (lookahead.js:1227).
- checker/invariants.js:102 still holds, since the headroom can only go lower.
- No saved field changes, nothing needs migrating, and no server or outside setting is needed. The only outside piece is the checker branch, which the plan names.
- I walked eight lives through 12 months against the code:
  - paid on the 10th (Mako's cards on the 10th and 11th);
  - paid twice a month;
  - paid every two weeks, including months with three pays (whole card bill this fortnight, ruling R1);
  - paid weekly (Ramil reads 0 with `cards_over` and no false amber);
  - freelance with a zero month (unchanged);
  - set up on the 20th with pay already in the bank (owed comes from setup);
  - a couple on one phone (shared bank, owner ignored);
  - cash and e-wallet only (byte-for-byte golden files).
- Along the way: card payment days, bills on their due days, a yearly bill charged to a card (dated), an overspent month (headline 0, freeOver), three weeks away (overdue card payments taken today under both rules, a late pay left out until ticked), a refund, and moving money between your own accounts. None of these needs a change to the saved data.