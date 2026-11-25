# Plan: two named figures on Home when the everyday budget is the limit (24 Nov 2026, MAIN 16)

Read wip/team/MAKO_SAYS.md first.

Serves: **M7** (see at a glance where all the money is and what is safe to spend, "nothing is unknown"), **M12** (clarity or he stops using it), **M36** (the picture adds up to the accounts), **M51** (one meaning per word), **M52, M53** (a kid can figure it out). Touches: M10 (which four numbers, not settled 5), not settled 8 (the coordinator shows Mako both figures at his run), M3 and M17 (what the assistant is told and says).
The main way the owner uses this: he opens Home to see what he can spend (NORTH_STAR; M7). With AI first he also asks the assistant "what can I spend?" and must get the same two names and figures.

## The fault (qc-novice on lane/homefix 3a4f514; coordinator 11, 24 Nov)
Day one, ¥182,400 in the bank, nothing due, set up one day before pay with ¥60,000 a period for everyday things. Home says "¥1,818 is safe to spend" and a sum "¥182,400 (what your accounts can spare) − ¥180,582 (held back ...) = ¥1,818". A new person reads "the app says I can spend almost nothing". The figure is right by the rules and the words are wrong.

## The cause
The engine's safe to spend is the smaller of two true figures (engine/lookahead.js, rules G2, BJ5):
- A. what the accounts can spare after everything due before next pay and the minimum;
- B. what is left of Free to spend for this period (the first period gets its share for the days left, I4, BP2).
Home prints only the smaller one under one name. When B is the smaller, ¥180,582 of the person's money has no name and no place on the screen. "Held back" says something holds it. Nothing does.

## The change (screens only: no engine change, no saved-data change)
1. **Two names, in the one name table (screens/names.js), used by every screen and by the assistant:**
   - "Everyday money left until pay" = B (working name).
   - "Your bank can spare" = A (working name).
   Both are working names until Mako chooses (not settled 8).
2. **Home, whenever A and B differ and B is the smaller:** both figures are shown side by side with the same weight, each with its name and its own "?" help, and one plain line under them: "You set ¥60,000 a pay period for everyday things. N days are left, so ¥1,818 of it is left. The other ¥180,582 your bank can spare is not planned for anything." The words "safe to spend" are not put on B alone. "Held back" is removed everywhere.
3. **When A is the smaller (bills or the minimum are the limit):** as today, one figure, named "Your bank can spare", with its sum. The line says the everyday budget has more left than the bank can spare.
4. **When they are equal, or no Free to spend is set:** one figure.
5. **Status and next step (screens/status.js)** read the same two values, so the verdict line never says "not safe" or "¥1,818 safe" beside ¥180,582 spare.
6. **Receipts and Plan** use the same names where they print either figure (the toast after a Free to spend spend says it comes off "Everyday money left until pay").
7. **The assistant's summary (ask3_core.js summary; chat3_core.js figures on the AI lanes)** sends both figures under the same two names, so its answers match Home.
8. **Pay day with the pay not ticked** (the reviewer's second finding): the headline is "Pay day. Check your bank to tick off your pay." with the button, and no ¥0 presented as safe to spend.
9. **A pay change dated later** (third finding): Plan shows "changes to ¥264,000 from 26 Dec, day 15" under the pay, and reopening the pay form shows the coming change. Read from the schedule's steps (already saved; plan3_write.js). No new saved field.

## Tests first
- e3_twofigs (page): the day-one book above shows both names, both figures, the one line; no "held back", no bare "safe to spend" on B; the two figures and the line are the hand-worked values. A book where bills are the limit shows one figure. A book with no Free to spend shows one figure.
- screens/test names: both names exist once, and no screen source prints either figure under another word (extends e3_names).
- ask3_core.test: the summary carries both figures by name.
- e3_payday: the pay-day headline words. e3_paychange: the later-dated change is on Plan and in the form.
- qc-numbers ties every sum behind both figures by hand. qc-novice part 4: a first-time reader can say why each figure is what it is.

## What does not change
The engine's rule (the smaller of A and B is what the status judges on), the saved shape, any figure. Only which figures are shown and what they are called.

## Lives walked
- Mako, set up the day before pay: the case above.
- Paid weekly with a small everyday budget and rent due: A is the smaller most weeks, one figure.
- Freelance, no fixed pay, no Free to spend set: one figure, "Your bank can spare".
- Overspent the everyday budget (B is 0 or below) with money in the bank: both shown; the line says the everyday money for this period is used up and how much the bank can still spare. Never red (M47).
- Bank below zero: A is negative; the amber line from lane/blockers stays the headline.
