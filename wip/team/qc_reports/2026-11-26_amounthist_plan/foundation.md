# qc-foundation on AMOUNT_HISTORY_PLAN.md (plan review, 26 Nov 2026, lane/amounthist at de7fa578)

FAIL. The rule is sound and the saved shape can hold it. It fails on the way in (lesson 5): the assistant, the main way Mako corrects a receipt (M1, M4), has no action that changes an amount. "That lunch was 7,000, not 700" ends up as remove plus log again, which by today's rules gives other figures than the screen edit. The plan says nothing about this. The other findings are cheap to fix now, in the plan.

## OWNER'S WORDS
- M1, M3, M4 (AI first, full control, "here are my new receipts"): BROKEN by silence. chat3_core.js:603-624 offers log_spend, refund, money_in, move_money, remove, end_bill and end_line, but nothing that edits an event. The fix goes only into act3 `edit` (act3.js:196), which only the screens call.
- M6 (change, then Undo): met. An edit stays an edit.
- M12, M36 (clarity, the picture adds up): at risk. receipts3.js:363-366 lists rows by `e.date`, and the comment at receipts3.js:337 promises that "the list and the spent figure agree". After the plan, the closed period lists Lunch 7,000 but counts 700, and the check's period counts 6,300 with no row. The engine output carries no split (heldByCheck, lookahead.js:483 and 819, holds `{id, account, check}` only).
- M13, M14 (change every kind of thing, Undo everywhere): met for the screen edit. Undo keeps `before.was` (act3.js:127-131 and 341-345). See the grid for the rest.
- M20, M67 (two devices): met. `was` has no `from` or `at`, so SCHEMA_V3 section 0 treats it as a plain field and it travels with the winning record. It is moment based, so the answer does not depend on arrival order.
- M36, M44, M45 (adds up, one dataset, no coin twice): met. The change and the gap's shift land on one day, so the totals still match the bank.
- M44 ("from real transaction dates"): met as CHECKGAP already settled it. 6,300 of a 20 Dec lunch counts on 29 Dec, the same as a late-told spend does today.
- M51 (one meaning per word): broken until finding 2 below is fixed. "Corrected" means two things depending on the path taken.
- M61, M69 (nobody loses data): met. The field is optional and old pages keep it (unknown fields are kept).
- M90 (card spends come off safe to spend at once): met in intent. See the card holding point under Builder points.
- M93 to M95 (cash wallets, "about 12,000 left"): silent, but covered. A wallet count is a check in bankInfo, so a grocery-cash receipt corrected after a count follows the same rule. Add one test.
- M98 (walked as a person): partly met. The walk misses the person who tells the assistant.
- M99 (receipt batch): silent. A photo of an already-logged rough receipt is a correction and must go through `edit`. Name it for that slice.

## GRID (event amounts after a check)
Kinds: bank spend, card spend, refund, money in, transfer between own accounts, check figure. Actions: change amount, change date or account, remove, Undo. Ways in: screens and assistant. 48 cells.
- Covered: 28. Screens 19: change amount 5 (check figure not), change date or account 5 (today's rule, right per finding 5; check date not), remove 3 (money in, transfer, check), Undo 6. Assistant 9: remove 3 (money in, transfer, check, the last not verified), Undo 6 (the one Undo bar).
- Not applicable: 0.
- Empty: 20.
  - Assistant, change amount 6 and change date or account 6: the write door can do it, the action is missing (builder, finding 1).
  - Remove a bank spend, card spend or refund after the check that holds it, screens 3 and assistant 3: no rule stated, and the result differs from an edit (finding 2, engine).
  - Screens, check figure amount 1 and check date 1: named out of slice (engine).
- Outside the grid: an import replacing a typed amount (WATCH 1).

## FOUNDATIONAL (none needs a change to the saved shape if fixed in this plan)
1. Mako, 12 Jan, tells the assistant "the 20 Dec lunch was 7,000". The assistant can only remove and re-log (chat3_core.js:617-621 and 603-610). Worked through with a 29 Dec check that found 6,300 more out than logged:
   - Screen edit, under the plan: the closed period counts 700, the check's period 6,300 on the line plus a gap of 0, so it does not move.
   - Assistant path: the closed period drops to 0, and the new record is told late and counts 7,000 on 29 Dec (lookahead.js:483), so the check's period rises by 700.
   - So the same act gives two answers, and the AI-first path is the one left out.
   - Needed: a `change` action in the assistant (amount, date, account, line) through act3 `edit`, with the same ask-first rules. The plan names M1 and M4 and adds a test: "assistant correction equals screen correction".
   - Cost: now, one action. Later, every assistant correction made in between stays on the old figures.
2. Removal after the check that holds it has no stated rule. Today it means "never happened": the closed period moves and the gap grows. Correcting a record down and removing it then give different closed-period figures. Fine either way, but the rule sentence must say which applies to removal, with a test. The data holds it (`gone` keeps `a`, act3.js:140).
3. Clock basis of `until`. The plan uses the edit's `at`, which is the hybrid clock and can run up to a day ahead of the wall clock (store/clock.js nextAtWarn). Checks are ordered by `told`, which is the wall clock (e3.js:28-31, lookahead.js:130). An edit made before a check can then read as after it. Use the step's `told` (act3.js:262, `s.told`) so both sides use one clock. Cost: now, one word. Later, entries already saved keep a mixed meaning for good.
4. Engine output: carry the split per record, for example heldByCheck `{ id, check, atCheck, after }`, so Receipts can show the 6,300 on the check's period and the 700 on the closed one (M36). Engine-only, cheap now. Without it each screen will do the sum (lesson 2).

## Builder points (engine-only, add to the plan's tests)
- A correction that turns a matched check into a large gain is caught by largeGain (lookahead.js:896-901). heldGain skips the filler (line 1045), but the plan's +change still counts, so Free to spend drops by the whole correction and a weeks-old check asks "is this right?". Test: 8,000 corrected to 80,000 with Free to spend at 60,000. Judge the hold on the gap as found at the check, or hold both together.
- Card holding: lateTo uses `x.day` (lookahead.js:628) but card lines use the posted day (line 545). Take heldAt by the same day the card line uses.
- Fees (a minus a2) count by `e.day` through inPeriod (lookahead.js:1055-1058), not countDay, for late-told and corrected transfers alike. Name this or cover it.
- Undo sends `was` explicitly. The door must not add an entry when `was` is among the fields (test 5).

5. Answer to the plan's open question: a date or account changed after a check is NOT the same rule. Worked: 20 Dec moved to 11 Jan. The matched 29 Dec check gains a 700 gap in its own period, the record's 700 leaves that same period, and 11 Jan gets 700. The closed period nets the same and the running period takes the spend that the person says happened then. The other way round, CHECKGAP's late-told rule already counts it on the check's day. Today's behaviour stays truthful and `was` does not need the date. Money in, bill payments and card payments corrected after a check are not the same rule either. Their correction explains the gap, so the gap shrinking is right: a 10,000 bill corrected to 16,300 gives back the 6,300 that the check had charged to Free to spend. The plan's scope (spend and refund sums) is right. Say so in the plan.

## WATCH
1. Statement import, now partly built: a matched import replaces a typed rough line within 10% and keeps its `told` (stmt3_plan.js:232; lookahead.js:199 sets `t.a = imp.a`). That is an amount change after a check with no `was`, and the import's own read moment is overwritten. Fix before imports reach Mako: keep the read moment (for example `src.read`). Records imported before that keep today's behaviour, off by at most 10% of a rough line.
2. M88 percentage buckets: if a percentage is later taken from the pay that actually landed, a pay corrected after a check would change a closed period's buckets. Decide this in the M88 slice.
3. A stage 2 merge of separate fields within an event must keep `a`, `a2` and `was` together.

## Checked and sound
- `was` is optional, kept by old pages, and never shaped like an entry list.
- Undo goes through the journal.
- Moment based, so the result is the same whatever order the records arrive in.
- Late-told records keep amountAt 0, which is CHECKGAP unchanged.
- The bank today and what each statement owes use the amount now. That is right: a statement paid in full and later corrected settles exactly.
- Wallet counts are covered by bankInfo.
- Events are written only through act3 (plan3_write.js only adds them).
- Walked: pay on the 10th, weekly pay, freelance with no period (BQ3), setup with pay already in the bank, cash wallets, card payment days, an import.

## NOT CHECKED
- Twice a month, every two weeks and couple lives: not walked day by day. The rule does not depend on how long a period is.
- ask3_core.js beyond its action list.
- Whether the assistant's remove reaches check records.
- engine/periods.js, which computes past-period spent (the plan must give it the same rule as leftOf).
- Server settings: none are needed for this slice.
