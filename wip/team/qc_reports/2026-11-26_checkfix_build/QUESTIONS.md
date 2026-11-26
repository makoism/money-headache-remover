# Slice 10 (CHECKFIX), questions found while building (LANE N, 26 Nov 2026)

Read wip/team/MAKO_SAYS.md first. Each question: the moment, an example, what was built, the recommendation. None of these
is for Mako; all are for the coordinator.

## 1. Old books' fixed gap spends: re-work them on a figure change (F2) or not (FB)?
- The moment: Kenji's book is from before F2, so Check your bank logged each gap as a fixed spend (C1 5 Dec: 17,600 on Free
  to spend; C2 12 Dec: 62,400). On 14 Dec he fixes C1 from 182,400 to 128,400.
- The plan says two things. F2 (after the first qc-foundation run): "a change of C1 re-works C1's spend and the next
  check's spend". FB (after confirm 2, ruled by coordinator 17): the change counts on the day of the fix in both gaps
  beside the check, so closed periods and safe to spend do not move, and "Section 1's Nothing else changes is replaced by
  this rule". Doing both counts the fix twice: re-working C1's spend to 71,600 puts 54,000 into the closed period (what FB
  forbids), and FB's plus and minus parts are then added on top.
- Built: FB only. The old spends are never re-worked by a figure change (tests/checkfix3.test.js "[F2 old books]": 80,000
  logged in all, the closed period stays 17,600, this one 62,400, safe to spend unchanged). Where the gap went can still be
  changed on an old book (its spend's line), and a spend changed by hand on Receipts is never overwritten.
- Recommendation: keep it so; strike F2's re-work sentence from the plan.

## 2. The FB worked example's C2
- The brief gives C2 as 120,000. With the pay of 300,000 ticked at C2, the period's 62,400 comes out only with C2 at
  420,000 (182,400 + 300,000 - 62,400), as LANE L's amount_history.test.js has it. The tests use 420,000.
- Recommendation: read "C2 120,000" as before the pay; nothing to change.

## 3. The revive notice cannot name the devices
- The plan's words: "A bank check you removed on your phone came back, because your computer added a later one". The book
  has no device names (only `by`, a random device part), so the app cannot say phone or computer truly.
- Built: "A bank check of Main bank you removed came back, because another device added a later one" (Home's warning
  line, screens/status.js warn.revived_check).
- Recommendation: keep until devices have names (stage 2).

## 4. "No, it was ..." on the held-gain question
- The plan's button "No, it was ..." fails the wording lint (no ellipsis and no full stop in a button, VOICE.md).
- Built: "Was that figure right?" with "Yes" and "No, fix it" (it puts the cursor in the figure box).

## 5. The far-figure question (coordinator's added item) asks for banks only
- The moment: a card figure typed 0 while its payment is not ticked is "less than half" of what the app expected, but the
  card already has its own question ("Did Card A's payment go out?"), and asking both is two questions for one thing.
- Built: the one rule (engine/checkin.js farFigure: more than double, less than half, or off by more than the usual pay)
  asks for a bank, cash or e-wallet figure at Check your bank, on the Checks sheet and in the assistant's bank_figure and
  change_check. A card's figure keeps its payment question.
- Recommendation: keep it so.

## 6. Not built in this slice
- Couples on one phone ("the question names whose check it is when `by` differs"): the app has one person per book today;
  nothing to name. Left for when people are added (stage 2).
- M46 (a change that turns a past period overspent after its leftover went to a goal shows the engine's set_aside_over
  line): the change card already lists the engine's warnings that change (change3 figures and amber); no extra line was
  added. A test on that exact case is not written.
- A tick changed later or unticked: a controls3 row marked todo (its own slice).
- The loan check (built on lane/controls-6, not on this branch) writes prev through CK.checkIn, so it gets prev when the
  two branches meet; nothing else to do.

## 7. A tick taken back later keeps no history (against ruling (B))
- The moment: 12 Dec both card payments ticked at Check your bank; 15 Dec the person says Card A's tick was wrong.
- Ruling (B) says every removal of a money record keeps `was`, and the engine then keeps a removed bill or card payment
  "settled" while the check that held it stands (the figure holds the payment). Taken that way, Remove this tick would
  change nothing the person can see: the payment would stay ticked.
- Built: Remove this tick (Receipts, the card's, loan's, bill's or pay's Plan sheet, and the assistant's remove with a T
  ref) marks the tick gone as if it never happened (no `was`), the way removeCheck takes a tick, so the payment is
  expected again and the check's gap now says what the bank really did. Undo puts it back.
- Recommendation: keep it so (a wrong tick is a mistake, not money that moved), and name it in ruling (B)'s text.

## 8. Words changed on Home (coordinator's item 2)
- The bank's age is one thing: "checked today", "checked yesterday", else the check's own day ("checked 8 Dec"); the
  older "checked 3 days ago, on 8 Dec" is gone with "checked today, on 8 Dec".
- A pay or a payment past its day and not ticked is one state in words (screens/names.js pastDue): "has not come in yet"
  for a pay, "has not gone out yet" for a payment, on Home and Plan, whatever the engine calls it (late or not seen).
- A bank figure changed later gets its own Receipts row ("Your bank figure of 28 Nov changed on 12 Dec") for each of its
  two parts (FB), never a gap row over days. The engine marks such a part (`fixOf` on the filler part).
