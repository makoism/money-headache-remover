# Cards in the headline: everything owed on the cards comes off safe to spend

Planning helper, 25 Nov 2026, branch lane/cardsplan (made from lane/ai-join at c952278b). Format copied from THREE_VALUES_PLAN.md and AFTER_CARDS_PLAN.md. Every figure here is made up.

## Settled: what is built, and where (26 Nov 2026)
This is no longer a question for Mako. He settled it on 26 Nov, and the coordinator ruled the scope:
- **M90** ("Number one, obviously"): setup always asks for a play amount; safe to spend is the play money left this pay period and every card spend comes off it at once; the bank after the cards are paid stays on Home; **if someone skips the play amount, what is on the cards comes off safe to spend too.**
- **M93**: play money is cash in the wallet; groceries and other expenses go on the card ("Play money is cash, everything else is card").
- **M95**: play money is updated roughly, by asking how much was spent or how much cash is left.
- **Ruling R1** (CASH_PLAN.md section 14, coordinator 15): yes, **only where the play amount is skipped**. This plan's rule (the cards-now walk) applies only while no play amount is in force on the day (`playOn(day)` in lookahead.js, CASH_PLAN.md section 17 F1). With a play amount in force, nothing about the headline changes: safe to spend is play money left, and only play spends on a card come off it (R5). The words name the cards as the cause, with a one-line way out: "Set a play amount" (M91).
- CASH_PLAN.md sections 17, 16, 15 and 14 win over this file wherever they differ. Where the sections below describe what happens "with Free to spend set", read them as the reasoning that was weighed: that branch is not built (its figures stay as today's engine gives them, byte for byte).
- Built as CASH_PLAN slice 1 on lane/cash-1, test first. qc-foundation read this plan (qc_reports/2026-11-26_cardsplan/foundation.md, F1 only, taken in CASH_PLAN section 17).

## The meaning (settled by M90 and R1)
With no play amount in force: **safe to spend = the bank today, less bills before the next pay, less everything owed on the cards paid in full.** Today (before this slice) a card spend whose card is paid on or after the next pay leaves safe to spend where it was.

## Mako's lines it serves and touches
- Serves: M7 (see what is safe to spend, "nothing is unknown"), M12 (clarity), M30 (almost all spending is on the cards, so the bank alone is not the truth), M36 (the picture adds up), M40 (cards: what is on each, when paid, the bank after), M45 (no coin counted twice), M51 (one meaning per word), M77 (a fact becomes a failing test the same day).
- Touches: M6 (asks first for a change over safe to spend: a lower headline means more asks), M27 and M28 (his cards are paid on the 10th and 11th, his pay lands on the 10th), M31 and M38 (pay to pay), M47 (below zero is amber, no shame), MAKO_SAYS Not settled 8 (what "safe to spend" means beside "no job" money).
- The main way in (M1, M4, M5): he logs a card spend by telling the assistant. The change card must show safe to spend dropping by the spend. Today it shows "stays the same" with a line explaining why (chat3_core.js noteOf). After this change that line goes.

## This was decided once before (read this first)
DECISIONS_ROUND2 F14 (line 60) answered scenarios/README.md Q14 (line 413): "Cards are not taken off as one lump today: the walk takes each statement off on its payment day ... It replaces 'everything on the card today'". So the proposed meaning is the reading F14 replaced. Every scenario ask that F14 touched still carries the old reading as `alt.Q14` (with its own hand-worked "why"). That gives this plan a ready cross check (section 6). Q14 also names the life it hurts: "Ramil, paid weekly, two pays land before his card payment, so this says his e-wallet is 700 short on 2 Dec when it is not." M90 and R1 settled it with that cost known (section 8).

## The working checked against the engine
I built Mako's made-up book with engine/build_book.js (ANSWERS from engine/test/mako_madeup.js, set up 24 Nov, Phone already out, ids from ids.js idMaker) and ran lookahead on today's engine and on a scratch copy with the change (the copy lives only in my scratchpad; nothing in the repo was changed). The scratch copy did steps 1 to 3 of the change below and used the cards-now walk for the whole account (it did not yet keep the goal warning on the dated walk); every figure in this plan comes from it or from today's engine, as marked.
- Today: 286,000 - 7,400 (Power 26 Nov) - 72,000 (Rent 27 Nov) - 5,200 (Internet 27 Nov) = **201,400**. Lunch 900 on Card A: still 201,400 (Card A owed 54,000 to 54,900, paid 10 Dec, the pay day).
- Proposed: 286,000 - 84,600 - 54,000 - 23,000 = **124,400**. Lunch 900 on Card A: **123,500**. The brief's working is right.
- The bank after the cards (BK6) stays 364,400 (and 363,500 after the lunch) under both: 286,000 - 84,600 + 240,000 - 54,000 - 23,000.

## 1. The engine (wip/team/engine/lookahead.js)

### How the figure is made today
- `cardInfo(id)` (line 535) gives each card `owedNow` and `walkItems`: one item per unpaid closed statement on its payment day, one for the open part on its next payment day (line 745), and, for a card paid in full, bills charged to it after that statement as `future` items (lines 735 to 744). The open item at line 745 also holds the bills charged to the card before its close (`nextExp`).
- `walk(id, end, minimum, real)` (line 1201) walks one account to the horizon. Its card loop (lines 1223 to 1230) puts each `walkItem` on its own payment day (line 1228, F14). The lowest point less the minimum is the account's `headroom` (line 1284).
- The headline (lines 1342 to 1349): `raw` = the spend-from accounts' headroom less any shortfalls; `headline = max(0, min(cap, raw))` (cap = Free to spend left, or none).
- The three values (lines 1391 to 1405, CA3): `canSpare.amount = raw`, `everyday`, `noJob = max(0, raw - everyday left)`.
- With a pay, the lowest point is usually the day before the pay, so a card paid on or after the pay never reaches the headline. That is the whole reason lunch on Card A leaves 201,400.

### The change (one place, in the walk)
1. `walk` takes a fifth argument, `cardsNow`. When it is set, for each card **paid in full** from this account in the same currency (the loop at line 1223): one step **today** of `max(0, owedNow)`, labelled "Card A, owed now" (with the payment day beside it for the screens), and the card's non-future `walkItems` are left out (they are that same money). Its `future` items (bills charged to it later) stay on their payment days, as now.
2. At line 745 the open item's two parts are split: the part that is owed now (`nextAmount`) and the part for bills charged to the card before its close (`nextExp`), which becomes its own `future` item on the same payment day. For a card that carries a balance (`inFull === false`, H7) nothing is split and `cardsNow` does nothing (see "carrying cards" below).
3. `cardInfo` returns `carries` beside `owedNow` (line 756).
4. In the account loop (line 1280) a third walk is made: `wc = walk(id, horizon, minimum, false, true)`. From `wc`: `headroom`, `why`, `whyParts`, `todayParts`, `todayEnd`. From the dated full walk `w`, as today: `lowest`, `lowestDay`, `firstUnder`, and the `set_aside_over` goal warning (lines 1311 to 1318). From `rw` (real money), as today: `real`, `below_minimum`, `short`, `canSetAside`.
   Why the goal warning stays dated: on the cards-now walk, a goal kept in the bank would be "more than the bank can spare" whenever goals plus cards are more than the bank before pay, even when the pay lands before the card is paid (Mako's own shape). That is a false alarm about the bank. The headline already carries the cards.

### Which figure changes and which stays
| Figure | Free to spend NOT set | Free to spend set |
|---|---|---|
| `accounts[].headroom`, `why`, `whyParts` | lower by what is owed on cards paid from that account and not already taken before the lowest point | the same |
| `canSpare.amount` (= raw) | lower by the same | lower by the same |
| `safeToSpend.headline` = max(0, min(canSpare, everyday left)) (BZ3/CA3 three values rule, unchanged) | = max(0, canSpare): lower | min(canSpare, everyday left): **often unchanged**, because everyday left is usually the smaller one. It drops only when canSpare falls below everyday left |
| `noJob.amount` = max(0, canSpare - everyday left) | = max(0, canSpare): lower | lower by what is owed on the cards |
| `everyday` (full, counts, spent, left) | n/a | unchanged (a card spend on Free to spend already counts in `spent`) |
| `safeToSpend.cappedByFreeToSpend`, `why`, `whyParts` | null | read from the new raw, so "what your accounts can spare" is lower |
| `safeToSpend.shortfall` | can now be above 0 when cards alone are more than the bank can spare before pay (no `short`) | same |
| `safeToSpend.short`, `below_minimum`, `canSetAside`, `laterOn`, `lastsAboutWeeks` | unchanged (real-money or dated walks) | unchanged |
| `bankAfterCards` (BK6) | **unchanged**: it has its own dated walk at line 1446, which never takes `cardsNow` | unchanged |
| `res.total.afterCards`, `cards[]`, `dueBeforeNextPay`, `period`, `periods`, `checkIn` | unchanged | unchanged |

"The bank after the cards" keeps its meaning (BK1, BK6): the bank on the day the last card is paid, with the pays landing by then. It is dated and in the cards box only. After the change it is no longer "safe to spend plus the cards"; the gap between the two is now the pays that land before the cards are paid (Mako: 364,400 against 124,400, the 240,000 pay). The cards box words already say "This is the bank, not safe to spend" (home3.js line 76).

### periods.js and schedules.js
Not touched. periods.js lists card payments that happened (`cardPayments`, lines 53 to 54) and Free to spend spent from records; it never reads the walk. schedules.js gives occurrences and month shares; nothing there knows about the headline.

### Saved data
Nothing saved changes. No new record, no field, no migration. The change is in how one answer is worked out. A book saved before reads the new way at once, on every device, the next time the engine runs. Undo of the switch is a revert of one engine commit.

### Speed
One more walk per account per lookahead. engine/test/speed.test.js must still pass; if it does not, `wc` can reuse `w`'s steps with the card steps moved (one pass), never a second copy of the rule.

## 2. The screens: which words become untrue
- **screens/help.js line 18**, the "?" beside safe to spend: "Bills and card payments due by then are already taken off." Untrue: everything owed on the cards is taken off, whatever its day. Draft for Mako's copy pass: "Bills due by then and everything on your cards now are already taken off."
- **screens/status.js lines 176 to 178** (`plan_over`): when cards alone take raw below zero, `shortfall > 0` with no `short`, no below-zero warning and no goal warning, so the status reads "plan_over" ("the plan needs more than the accounts can spare") with `planShortDay` (lines 193 to 203) naming the dated walk's first day under, which may be none. Untrue for that cause. Needs a new reason code, `cards_over`, chosen when the walk with cards dated has no shortfall: "Your cards owe more than your bank can spare before pay. Your pay on {day} covers them" (words for Mako). And when the headline is 0 for this reason, state "zero" with "nothing_safe" (line 189) says "Nothing's safe to spend until pay on 10 Dec", which is true, but the reason line should name the cards.
- **screens/status.js capParts (lines 261 to 268)**: no words become untrue. Its first part is "what your accounts can spare", which now has the cards taken off. That is the new meaning; the label stays.
- **home3.js** `capSay` (lines 181 to 188): "Your accounts can spare X, but only Y of your Free to spend is left" stays true with the new X. The sum under the headline (`whyWords3`, line 51, from `whyParts`) now lists "Card A, owed now" and "Card B, owed now" before the bills. True, and it is the place where he sees why the figure is lower (M36). `todayWords3` (lines 45 to 49) unchanged in words. The "Due before next pay" box (line 229) still lists a card payment due before pay (Card C on 27 Nov); the same money also appears in the sum as "Card C, owed now". It is counted once; only the words show it twice. `afterCards3` (lines 64 to 79) unchanged.
- **receipts3.js lines 90 to 101** (`rcCardWords3`): the comment "a new spend on a card leaves the bank only when the card is paid, so safe to spend may not drop, or may even rise" becomes untrue (both halves: it now drops at once, and the "rise" case is gone, see section 5 case D). The line on screen, "It goes on Card A and leaves your bank when the card is paid on 10 Dec", stays true. Draft to add: "Safe to spend drops now".
- **plan3.js**: no line becomes untrue (lines 33 and 342 talk about plan lines and goals).
- **checkin3.js**: no line becomes untrue. A typed card figure above what the app had now lowers safe to spend at once (it did not before when the card was paid after the pay). Worth one line under the card boxes for Mako's run: "What is on your cards comes off safe to spend".
- **setup3.js**: no line becomes untrue. Line 146 ("Each card is paid in full from your bank") could add "What is on it comes off safe to spend now" (for Mako's copy pass). Line 143 (Free to spend: "Not your bills or card payments") stays true.
- **screens/names.js line 31**: the note on `bankAfterCards` still states the old BK3 rule (already flagged in AFTER_CARDS_PLAN); fix it in the same slice as the words. `safeToSpend` (lines 33 to 37) keeps its label.

## 3. The assistant
- **ask3_core.js** summary (what it is sent each round): line 52 "Safe to spend until next pay: X" carries the new X. Line 61 sends each spend-from account's sum, from `whyParts`, so the assistant now reads "- 54,000 (Card A, owed now) - 23,000 (Card B, owed now)". Line 65 (capParts) unchanged. Add one line after line 52, from the engine's own fields: "Safe to spend takes off everything owed on your cards now (Card A 54,000, Card B 23,000)", so a question like "why did it drop?" is answered from the figures sent (M3, M36). Line 79 (cards list) unchanged.
- **chat3_core.js `noteOf` (lines 658 to 668)**: its line "Safe to spend stays the same: Card A is paid from your bank on or after your next pay" becomes untrue. Under the new meaning a card spend paid in full always moves `canSpare` by its amount. The headline stays the same only when (a) Free to spend caps it and the spend was on a budget line, not on Free to spend, or (b) the headline is already 0. Replace `noteOf` with those two reasons, from the engine's fields (`cappedByFreeToSpend`, `headline === 0`), words for Mako: "Safe to spend stays at X: it is held to your Free to spend left" and "Safe to spend is already 0: your cards owe more than your bank can spare before pay". Its call at line 686 stays.
- **chat3_core.js EXPLAIN.cards (line 467)**: "What you spend on it comes out of the bank then, so safe to spend takes off what is due before your next pay." Untrue. Draft: "A card is paid in full from your bank on its payment day. Safe to spend takes off everything on it now, so a spend on a card comes off at once."
- **chat3_core.js ask-first rule (lines 786 to 790, BW, M6)**: "a change larger than safe to spend asks first" compares with the headline. A lower headline means more asks; at a headline of 0 every change with an amount asks first. That is the rule working as written, but Mako should know (section 8).
- **The assistant's own instructions** (the system words, lines 120 to 200): no sentence there says cards wait for their payment day; only EXPLAIN.cards does. Setup question 2 (line 124, "what's safe to spend until your next pay") stays true.

### Tests that hold the old line ([M30, M77])
- **app3/tests/chat3_core.test.js lines 471 to 490**: "lunch 900 on Card A: with no Free to spend the headline stays 201,400 and the card says why". New expectations, hand-worked: rows `[['Safe to spend', 124400, 123500], ['Card A, still owed', 54000, 54900]]`, `note` null. With Free to spend 30,000 (16,000 counts): `[['Safe to spend', 16000, 15100], ['Free to spend left', 16000, 15100], ['Card A, still owed', 54000, 54900]]` (unchanged, checked on the scratch copy), no note. A new case for the new note: Free to spend 30,000, a 900 card spend on a budget line: headline 16,000 to 16,000, note "held to your Free to spend left".
- **app3/tests/e3_fakeai_page.js lines 112 to 121**: the same on the real page. New: Home's `data-fig=safe` 123,500, the note absent, "Card A, still owed ¥54,000 ¥54,900" still shown.

## 4. Other lives (each run on the scratch copy, made-up yen; base: bank 168,000, pay 300,000 on the 10th, set up 24 Nov, Free to spend not set, cards close day not sure unless said: Card A 54,000 paid on the 10th, Card B 23,000 on the 11th, Card C 12,000 on the 27th)
- **Paid weekly or every two weeks** (a card paid after several pays). Weekly 80,000 on Fridays, A and B: today 168,000, new **91,000**. Every two weeks 150,000, A and B: today 168,000, new **91,000**. The pays on 27 Nov and 4 Dec land before the card day, yet the headline "until next pay on 27 Nov" takes the whole month's card bill now. weekly-11 (Ramil) goes from 1,300.00 to **-700.00** (headline 0, shortfall 700). This is the Q14 cost: true by the new meaning, surprising to a weekly-paid person. The status words must say cards, not plan (section 2).
- **No fixed pay** (the 45 day walk). Kai, bank 420,000, rent 85,000 on the 27th, everyday 60,000, a card 40,000 paid on the 10th, seen 1 Dec: **unchanged**: 156,756 can spare, 60,000 everyday left, 96,756 no job, headline 60,000. The 45 day walk already holds the card's payment before its lowest point. freelancer.json asks unchanged.
- **Cash only, no cards**: nothing changes, because the new step exists only for a card. Proof by test: slice 1 commits a golden file of the whole lookahead answer (JSON) for every no-card life in three_values.test.js and the Kai lives, made by today's engine; slice 2 asserts the new engine gives the same JSON to the byte. Also the 745 scenario asks that do not change include every no-card life.
- **Several cards, one far out**: A plus Card E 20,000, close day the 5th, paid two months after close on the 27th: today 168,000, new **94,000** (168,000 - 54,000 - 20,000). BK6 still runs its own walk to the far day.
- **A card with a known close day** (statement against not yet billed): close the 15th, 30,000 of 54,000 on the statement closed 15 Nov (paid 10 Dec), 24,000 not yet billed (paid 10 Jan): today 168,000, new **114,000**; 900 on it today: new **113,100** (today 168,000). Both parts are owed now; the new rule does not care which statement holds them.
- **A card paid by an account other than the main one**: Card A paid from Savings (500,000, a bank, so spend-from), B from Main: today **614,000**, new **591,000** (168,000 + 500,000 - 54,000 - 23,000). Note: today's engine already took Card A off, because Savings has no pay landing before the card day. Today a card counts or not depending on which account pays it; the new meaning ends that. A card paid from an account that is not spend-from (its own goal account) comes off that account's walk; it reaches the headline only through `shortfalls` when that account cannot cover it, as today.
- **A card in credit**: Card D -5,000 (in credit) with A: new **114,000** (168,000 - 54,000). Credit is never added to safe to spend (`max(0, owedNow)`), as today (BL5). A refund on a card that still owes lowers `owedNow`, so it lowers what is taken off (biweekly-13: 1,364.25 to 1,204.25, which is its recorded alt).
- **A card that carries a balance** (`inFull === false`): **left dated, unchanged**. Taking all owed at once would put a 300,000 revolving balance against one month (on the scratch copy, with no minimum rule set: headline 0, shortfall 132,000). Its planned payments stay on their days, like a loan. Mako pays in full (M27), so this is for later lives; named for Mako's run.
- **Two currencies**: a card in another currency paid from a yen bank is still not taken off until it is paid (H5, warning `card_other_currency`, status.js line 106 words stay true). A card in another currency paid from a bank in that currency comes off that bank's walk, which is not in the home headline. other_currency_card.json and owed_other_currency_lists.json asks do not change.
- **A couple**: couple_cash.json couple-06 (Jun's card paid from the joint bank): 24,000.00 to **20,500.00**, its recorded alt. The engine does not look at `owner`; a card paid from a shared bank comes off that bank's headroom whoever owns it.
- **Pay day itself**: Mako's base with Card C ticked, seen 10 Dec with the pay counted and not ticked: 156,000 under both rules (the pay covers the cards the same day, so the lowest point is the start of today; G4, todayParts). 11 Dec with the pay still unticked: 79,000 under both. After the pay is ticked both rules agree until the next card spend.

## 5. The double count risk (M45), worked by hand
The rule never adds "owed" on top of the walk. For a card paid in full, its dated payment steps are **replaced** by one step today of what is owed. A card payment that falls before the next pay was already inside the headline; it is now taken today instead of on its day, never both. Base as in section 4.

- **A. A card payment before next pay** (A, B and C; C paid 27 Nov). Today: 168,000 - 12,000 (C, 27 Nov) = **156,000**; A and B are after the pay. New: 168,000 - 54,000 - 23,000 - 12,000 = **79,000**. A naive "raw less all owed" would give 156,000 - 89,000 = 67,000, taking C twice; the walk replacement gives 79,000. Bank after the cards: 379,000 under both.
- **B. Card payments after next pay only** (A and B). Today: **168,000** (both after the pay, lowest is today). New: 168,000 - 54,000 - 23,000 = **91,000**. Bank after the cards 391,000 under both.
- **C. A card spend made today** (A, B, C, then 900 today). On C (paid 27 Nov, before pay): today 155,100, new **78,100**. On A (paid 10 Dec, the pay day): today **156,000 (unchanged)**, new **78,100**. So the new rule treats the two cards the same; today's does not.
- **D. A planned line spent on a card** (line_on_card.json line-01, 13 Dec: bank 400,000, Food 50,000 with 30,000 bought on card 1, paid 11 Jan after the 8 Jan pay). Today: 400,000 - 20,000 (Food left) = **380,000**: the 30,000 left the Food line but is not yet taken off as a card payment, so spending planned money on a card RAISED what the bank can spare by 30,000 against before the spend (the "may even rise" in receipts3.js line 90). New: 400,000 - 20,000 - 30,000 = **350,000**. Each yen once.
- **E. A card payment ticked at a check-in** (A, B, C; seen 27 Nov, C's 12,000 ticked, bank typed 156,000). Today: 156,000 before and after. New: **79,000 before and after**: owed drops 12,000 and the bank drops 12,000.
- **F. A card spend on Free to spend while Free to spend is set** (base, A and B, Free to spend 30,000, 16,000 counts): headline 16,000 before (canSpare 91,000, no job 75,000). 900 on A on Free to spend: everyday left 15,100 and canSpare 90,100, headline 15,100, no job 75,000 (unchanged). The 900 is in both figures, but the headline takes the smaller one (min), and no job is their difference, so it is counted once. Today the same spend leaves canSpare at 168,000, so no job RISES by 900 when everyday money is spent on a card: the new rule ends that too.
- **G. A card gap at a check** (typed more than the app had): the gap raises `owedNow` and counts as Free to spend spent (lookahead.js lines 1056 to 1058, CA1). As in F: min and difference, once.

## 6. The tests

### Engine asks that change (run on the scratch copy: 34 of 779 differ; 745 unchanged, including every no-card and other-currency life)
- 19 asks already carry the new figure as `alt.Q14`, each with its own why: away-04, couple-06, biweekly-02, -08, -13, -18, halves-05, -13, -19, -27, mako-02, -10, -22, -31, -35, weekly-05, -11, -17. All 19 match the scratch copy to the unit. Their `expected` becomes the alt; the F14 figure moves into `alt.F14` (so the old reading is kept, as scenarios/README.md line 188 allows).
- 15 have no alt and are worked by hand in slice 2, one line each in the ask's `why`: cad-02 and cad-05 (card_auto_debit: 270,000 to 250,000), cbp-02 (300,000 to 280,000), cbp-05 (270,000 to 250,000), cmi-03 (287,000 to 277,000), line-01 and -02 (380,000 to 350,000), line-04 (375,000 to 350,000), line-05 (380,000 to 355,000), notsure-04 (200,000 to 95,000: 400,000 - 100,000 trip - 80,000 rent - 20,000 minimum - 105,000 owed), jp-03 (110,000 to 90,000: 150,000 - 40,000 statement - 20,000 not yet billed), jp-07 (140,000 to 132,000), and the checker's four (cau131-01, cau1692-01, cau2-01, cau2-02), which come from the independent checker and change only when the checker does.
- The independent checker (oracle_v2.js on lane/checker-b, run by engine/test/run_against_checker.js) and the frozen reference model hold F14. The rule then lives in three places (engine, checker, asks): LESSONS 4 warning sign. The checker gets the one rule as one function, in the same slice, or run_against_checker is marked "differs on F14 by design" with the count, never silenced.
- platform.test.js fails only because it reruns the asks; it passes when they do.

### Engine tests that stay green on the scratch copy (checked)
mako_walk.test.js (11), three_values.test.js (21), bank_after_cards.test.js (15), reload_order, card_gap_*, two_pays_order, periods, checkin, build_book. None asserts a card headline from before.

### App tests that change
- app3/tests/answers3.test.js: "Mako's book: safe to spend 201,400" becomes 124,400; "Phone still to come is taken off" 196,600 becomes 119,600 (both from the scratch copy).
- app3/tests/chat3_core.test.js (9 fail on the scratch copy): the setup ends in 124,400 (line 88, 95, the fill text at line 70); "I spent 1,200 on lunch" (line 133 to 143): 124,400 to 123,200 and Undo to 124,400, Main bank 286,000 to 284,800; the delete case 205,700 becomes 127,500; Undo after the fill and "Use any AI": 124,400; the "check this" amounts list (the fake AI's recorded words say 201,400, so the recorded reply changes too); [H6]: 124,400; [M30, M77] as in section 3.
- Browser tests (check3 full) with a card and a numeric safe to spend: e3_chatwalk.js (lines 13 to 191: 201,400, 200,200), e3_cloudfirst.js (lines 24, 44), e3_fakeai_page.js, e3_aijoin.js, e3_aiwords.js, e3_cardgap.js, e3_chat.js, e3_fillcard.js, e3_onepay.js, e3_overdrawn.js, e3_setupfix.js, fake_ai_page.js, and the permanent walk e3_walk.js (walk 4, lines 127 to 263). Each figure is worked again by hand, never copied from the new engine. The first four of e3_walk, by hand: 24 Nov after setup 124,400 (201,400 - 77,000); after two bank spends of 3,000 together, 121,400; 25 Nov after 5,000 on Card B, 116,400 (today it stays 198,400); 28 Nov after a 2,000 refund on Card A, 118,400 (283,000 - 84,600 - 52,000 - 28,000). From 15 Jan, when the walk sets Free to spend 50,000, most figures are the cap and stay; each is still worked.
- screens/test: any status test that expects `plan_over` for a card-only shortfall moves to `cards_over`.

### New failing tests first (slice 1), each with its hand-worked figure
File engine/test/cards_in_headline.test.js, books from build_book.js with ids from ids.js idMaker (realistic ids), made-up yen:
1. Mako's shape, 24 Nov, Phone already out: headline 124,400 (286,000 - 7,400 - 72,000 - 5,200 - 54,000 - 23,000); canSpare 124,400; noJob 124,400; everyday null; whyParts list "Card A, owed now" -54,000 and "Card B, owed now" -23,000; bankAfterCards 364,400 (unchanged).
2. Lunch 900 on Card A: 123,500; Card A owed 54,900; bankAfterCards 363,500.
3. Case A: 79,000; case B: 91,000; case C: 78,100 for either card; case E: 79,000 before and after the tick.
4. Free to spend 30,000 with A and B: headline 16,000 (unchanged), canSpare 91,000 (was 168,000), noJob 75,000 (was 152,000); case F: 15,100, 90,100, 75,000.
5. Card in credit: 114,000. Card from Savings: 591,000. Known close day: 114,000, then 113,100. Far-out card: 94,000.
6. Weekly 91,000 and every two weeks 91,000, with `shortfall` 0; weekly-11's life: headline 0, shortfall 700.00, `short` null (the real walk is fine), and the status reason `cards_over`.
7. No fixed pay with a card: 156,756 / 60,000 / 96,756, headline 60,000 (unchanged).
8. Carrying card: unchanged (168,000), marked "for Mako".
9. Cash only: the golden answers, byte for byte.
10. The same figures with the records in nine orders (LESSONS 4 addendum).
11. Ties kept: headline = max(0, min(canSpare, everyday left)); noJob = max(0, canSpare - max(0, everyday left)); with no cards, every field as before.
Then app3/tests/chat3_core.test.js [M30, M77] with the new rows and no note, and screens/test for `cards_over`, red.

## 7. Slices (test first, one commit each; check3 quick after each, full before the merge)
1. The failing tests above and the golden file for no-card lives. Red.
2. The engine: `walk(..., cardsNow)`, the split at line 745, `carries` returned, the third walk for headroom and its parts. The 19 asks take their alt; the 15 are worked by hand; checker and reference model brought to the one rule or marked. Engine tests green; asks 779 of 779.
3. DECISIONS_ROUND2 gains the decision (coordinator writes it after Mako's yes): it replaces F14 for safe to spend only; F14 stays for the bank after the cards, the dated warnings and how long the money lasts.
4. status.js `cards_over`; help.js line 18; names.js line 31. Screen tests.
5. The assistant: noteOf rewritten, EXPLAIN.cards, the ask3_core line about cards; chat3_core.test.js and e3_fakeai_page.js.
6. receipts3.js words and comment; the optional setup and check-in lines (only if Mako wants them).
7. Every browser test figure worked again by hand; e3_walk walk 4 rerun as the permanent gate, then a real-page walk of Mako's month with card spends (LESSONS 4 addendum).
qc-foundation on this plan before slice 1; qc-numbers and qc-assistant after slice 5.

### What Mako sees
Safe to spend on Home is lower by what is on his cards: 124,400 instead of 201,400 in the example. The sum under it names each card ("Card A, owed now"). Every card spend, by chat or on Receipts, takes the same amount off safe to spend at once, and the change card shows it going down. The cards box and its "after your cards are paid" line read as today. With Free to spend set, the big figure usually does not move; what the bank can spare beyond the plan does.

### For Mako's run (the coordinator brings these, with the app in front of him)
- Settled by M90 and R1, not asked again (M85). Listed for his run only so he sees it working: a person with no play amount, paid weekly or every two weeks, sees the whole card bill come off this week's figure even though later pays cover it (weekly-11: the e-wallet reads 700 under when the bank never goes below zero). The words name the cards as the cause, with "Set a play amount" as the way out (M91).
- Cards that carry a balance: kept on their payment days (recommendation), or the whole balance now.
- Bills charged to a card and not posted yet (a subscription on the card due before pay): kept on the card's payment day (as built here), or taken now like a bank bill before pay.
- The new words: help.js, the `cards_over` reason, the note on a card spend that does not move the headline, EXPLAIN.cards, the Receipts line.
- With a lower headline, more changes ask first (M6, BW), and at 0 every change with an amount asks first.
- How this sits with Not settled 8 (everyday money left against no-job money): the cards now come off the no-job money.

## 8. Risks
- **Weekly and fortnightly lives read low or 0** with no real shortfall (section 4). Mitigation: `cards_over` words and the dated warnings unchanged, so nothing amber appears that is not real (M47).
- **The rule in three places** (engine, checker, asks): one function each, one slice; the run says so if they differ.
- **A third walk per account**: speed test.
- **Pay day**: the pay counted today covers the cards, so the headline jumps up on the pay day and back down the next day while the pay is unticked. Same as today; more visible now because the drop is larger. Not changed by this plan.
- **Card-billed bills not yet posted** stay dated: a person may read "everything owed" as including them. The sum lists them apart.
- **Words drift**: every line in section 2 and 3 changes in the same slice as its figure, or a screen says one thing while the figure does another (LESSONS 2).

## Not in this plan
Which figure is the headline when Free to spend is set (Not settled 8, Mako's). How the horizon is chosen. Carrying cards beyond keeping them dated. Statement import.
