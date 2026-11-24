FAIL

Plan reviewed: /home/user/money-headache-remover/.claude/worktrees/next/wip/team/foundation_review/TWO_FIGURES_PLAN.md (not built). The fault it answers is real and the direction is right. It fails on three points: it needs an engine output change it says it does not need, it shows one wrong figure for people with no fixed pay, and it puts a figure on Home that the write door cannot let a person use.

## OWNER'S WORDS

- M1, M4, M5: met. The plan names the way in (Home to see, the assistant to ask).
- M3, M17: met in intent. But chat3_core.js is not on lane/next (only on lane/ai-merge), and there line 539 writes "Free to spend left" by hand. The plan must say which branch gets step 7.
- M6: silent. The assistant asks first for changes over `safeToSpend.headline` (lane/ai-merge chat3_core.js:597). That is B. With B at 1,818 it asks before every lunch while Home says the bank can spare 182,400.
- M7: broken as written. When B is smaller, no figure is called safe to spend, and the second figure cannot be spent without the app turning against the person (F2).
- M10: touched, not settled, fine.
- M13, M14: broken for the dated pay change in step 9 (grid).
- M24, M46: silent. Money "not planned for anything" gets no next step (give it a place, or decide later).
- M31, M38: not met for two lives. "Until pay" is false with no fixed pay (B starts again each calendar month, BQ3) and while a pay is late.
- M36: met for pay period lives. Broken for no fixed pay (F1).
- M45: at risk. B is inside A. Two figures of equal weight where one holds the other reads as two piles.
- M47: met. M48, M50: not touched.
- M51: at risk. names.js already has "Free to spend left" for `period.free.left`. The plan adds a second name for it and does not say the old one goes.
- M61 to M69: met. No saved data changes, figures are made up.
- "Not settled 8" is cited by the plan but is missing from MAKO_SAYS.md on lane/next (it is on lane/cand2). A decision that lives somewhere other than the branch being built: lesson 1 warning sign.

## GRID

Two kinds of record are touched: the everyday amount (plan.shares) and a pay change dated later (schedule steps and rules). Add, change, remove or end, undo, by screens and by the assistant, on a later day: 16 cells. Covered 9, empty 6, not verified 1.

- Everyday amount, screens: add, change, undo covered. Remove is covered only as "type 0" (plan3_write.js:84), and 0 is not "none": I ran it, B is 0, headline is 0, the sum takes off all 182,400. The plan's step 4 ("no Free to spend set: one figure") does not say which case 0 is.
- Everyday amount, assistant: add, change, undo covered (set_free). Remove not verified.
- Dated pay change, screens: add, change (a newer dated step), undo right after: covered. EMPTY: cancel it on a later day. changeBill compares the typed amount with today's amount (plan3_write.js:112, 146, 155; `v.amount` is the amount in force today, periods.js:63). Typing the old amount back from the same date gives "Nothing changed". Step 9 will show the coming change and leave no way to take it away once the Undo bar is gone. The saved shape can hold a cancel (one more step, BQ2 picks by `from` then `at`), so this is the write door and the screen: a builder finding, to add to step 9 with a test.
- Dated pay change, assistant: EMPTY on lane/next for add, change, cancel, undo (ask3_core.js:90 has four actions, none for pay). lane/ai-merge has `changeBill` (chat3_core.js:493), with the same cancel gap.

## FOUNDATIONAL

F1. The two figures are not in the engine's answer, and A means two different things.
- Who: Kai, freelance, no fixed pay, 420,000 in the bank, rent 85,000, everyday 60,000 a month. Set up 1 Dec.
- What the engine holds (run in node): `period` is null, headline 60,000, `whyParts[0]` 137,578. With no fixed pay the walk has already taken everyday money off A day by day to the horizon, 27 Jan (lookahead.js:1090-1107, 1155). With a pay period it has not: only lines come off (1121), and this period's everyday money only caps (1260-1263).
- What the plan would show: "The other 77,578 your bank can spare is not planned for anything". December's everyday money is taken off twice. A confident wrong figure. The plan's own freelance life has no everyday amount, so it never met this.
- Why it is the base: A exists only as `whyParts[0].amount`, a part of a worded sum, present only when capped and cut to zero when over (1279-1281). B is `period.free.left`, which does not exist with no fixed pay (1027). names.js ties each name to an engine path. There is no path for either figure in every life. Each screen and the assistant would work them out their own way: lesson 2.
- What the base needs: three fields worked out once in lookahead.js, the same meaning in every life: what the accounts can spare, everyday money left (with the day it runs to, or the month end), and the money with no job. names.js points at them. "No engine change" in the plan becomes "one small addition to the engine's answer, no saved data change".
- Cost: about two hours with tests now. Later: a hunt through Home, Status, Receipts, Plan and two assistant files.

F2. The second figure cannot be used.
- Who: the plan's own day one person. Reads "your bank can spare 180,582, not planned for anything" and buys a 50,000 fridge.
- What the engine holds (run in node): every spend goes to Free to spend, a line or a place (act3.js:8, 157; lookahead.js:956). Result: everyday money 48,000 over, headline 0, status "Free to spend is used up until pay" and "It turns safe once your pay is in" (status.js:75, 88, 182), beside "bank can spare 132,400".
- Why it is the base: the rule that the smaller figure is the verdict (G2, BJ5) says spare money is not spend money. The plan's screen says it is there, at the same weight. The plan's step 5 (the verdict never says "not safe" beside the spare figure) and its "what does not change" (the status judges on the smaller) cannot both hold.
- What the base needs: one decision before the build, brought to Mako as the cause with a recommendation, not as names to pick. Recommended: everyday money stays the one headline. The second figure is the money with no job (A less B, so the two add up to the sum), smaller, with one next action that uses writes that already exist: set it aside in a place, add some to this period's everyday money, or decide later (M24). The verdict, the assistant's ask-first line (M6) and Receipts all keep reading the headline. If Mako instead wants spare money to be spendable as it is, that is an engine rule change (a spend marked outside the plan) and should be known now.
- Cost: an hour of plan now. After the build: the status rule, the assistant's threshold and Home redone.

F3. The plan was drawn from one day. B smaller than A is the normal face of Home for anyone whose pay is more than their plan, Mako included, on most days. The plan's one line ("N days are left, so 1,818 of it is left") is only true in the setup period with nothing spent. Lives it must walk and test before building: mid period after spending (the engine gives no "spent" for everyday money, lookahead.js:1026, only counts and left); pay ticked on pay day; pay late for three weeks (run: on 16 Dec B is still 2,000 for a period whose pay day was 25 Nov); every two weeks; no fixed pay; everyday amount 0. Lesson 1 warning sign: a plan built from what the build got wrong.

## WATCH

- Several accounts: A adds every spend-from account in the home currency (lookahead.js:1257-1261). "Your bank can spare" is false for someone mostly in cash and an e-wallet. The name needs a form for more than one account when the Plan screen gains "add an account".
- Second currency: A leaves other currencies out. The line "the other X is not planned" must not claim to cover them.
- Pay day not ticked (step 8): hiding the figure is sound for that day. The day after, still not ticked, both figures come back with a B that belongs to the period before. Covered by F3's late pay life.
- The 3D world and the cloud copy: nothing here touches them.

## Server settings and outside pieces

None new. The assistant half of step 7 lives on lane/ai-merge and cannot be tried from lane/next. The plan should name the branch and the order.

## Checked and found sound

- For pay period lives the sum ties: A less B is truly money with no bill, line, goal, card payment or minimum on it through the second next pay (lookahead.js:1054, 1115-1179). Run: 182,400, 2,000 and 180,400 for a book set up on 24 Nov with pay on the 25th.
- No saved data change is needed for any step. Step 9 reads steps and rules that are already saved with their `from` day.
- Removing "held back" is right: nothing holds that money.
- Bank below zero keeps the amber line. Overspent everyday money is said plainly and never red.
- Mako's shape (cards paid on the 10th and 11th, close days not known) is taken off A through the card walk items, so A does not count card money as spare.
