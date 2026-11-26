# qc-novice, plan review (M98): SHORTGAP_PLAN.md at 87f31fd5

VERDICT: FAIL
CHECK: no check3.txt (plan round, no build)

## Three scenes

Scene 1. Kenta, 25, 1 Dec, on the train. Main bank 201,400, a second bank (Beta, 32,000) that pays Card A (54,000 on 10 Dec). Opens Home: "how much can I spend before pay?" Sees 179,400 and a line telling him to move 22,000 to Beta. On 5 Dec he moves it in his bank app. On 6 Dec he checks his main bank in the app (it now says 179,400) and opens Home again.

Scene 2. Same Kenta, 12 Dec. He decides Beta should pay Rent and Power too (both 28 Dec), because "Beta is my bills bank". He wants to see what that means and when he has to top it up. He gets paid, forgets, comes back on 27 Dec at 23:00.

Scene 3. Aya, 25, two banks she spends from (Main and Salary bank), a third (Savings) that holds her trip goal and pays her phone. Savings will be short. She would rather the phone came out of Main, or take it from the trip money, or deal with it next week.

## Step by step

1. Home headline 179,400 (rule 4/5). Expects: "the 22,000 for Beta is already taken off". Plan has the main bank's `why` list "Move to Beta Bank by 10 Dec", and Home already prints that sum, so the reason is visible. Good. Missing: the old headline was 107,400; on update day it jumps by 72,000 with no word. One line ("we now only take off what Beta needs this period") would stop "where did 72,000 come from?".

2. Move line. Expects ONE clear date that keeps the card from bouncing. The plan gives three different dates for the same move: F1 ruling "22,000 by 9 Dec, 79,400 by 27 Dec"; Screens section "by 10 Dec ... by 28 Dec"; rule 8 "Move to Beta Bank by 10 Dec"; Tests "22,000 on 10 Dec ... 79,400 on 28 Dec"; Not in scope "Moves dated other than by the bill's day". If the build follows the tests, Kenta reads "by 10 Dec", moves on the morning of the 10th, and the card has already been taken. BLOCKER (plan contradicts itself on the very number the person acts on).

3. Two lines that disagree. Rule 8 keeps Beta's own warnings: today they read "Beta Bank goes 22,000 below zero on 10 Dec" and "Later on: Beta Bank goes 101,400 below zero on 28 Dec". Next to them the new line says "79,400 more by 27 Dec". Kenta sees 101,400 and 79,400 for the same thing and three dates (9, 10, 27, 28). Rule 7 says "the screens show the move line instead" of the warning; rule 8 says the warnings stay. Pick one for Home: when covered, show only the move line (the warning's words can live in Beta's own card). BLOCKER for M12/M51: two amounts and dates for one job.

4. "I did it" (Scene 1, 6 Dec). The most likely thing a person does after "move 22,000" is move it in the bank app. The plan gives the line no tap ("Done, I moved it", "Remind me later", "Pay this from Main instead"). If he then updates the main bank figure, the app sees 22,000 less in Main and still takes the 22,000 cover off: 157,400, the same coin counted twice (M45). The plan names this F4 "WATCH, the controls lane's". From the person's side it is the very next minute of this feature, so it is a step he cannot get out of. BLOCKER (M45, M91).

5. Moving Rent and Power to Beta (Scene 2). Expects "nothing changes now, you will need 79,400 more in Beta by 27 Dec". The plan gets this right in the numbers (179,400 before and after). Missing: the moment he changes which bank pays, the app does not say so. A quiet line under the change ("Beta will need 79,400 more by 27 Dec, from Main") would answer his question where he asked it.

6. After pay, 27 Dec at 23:00. Gap is now (rule: "a gap today: the move is dated today"). Home says "move 79,400 ... by today" or "by 27 Dec" at 23:00. A bank transfer made at 23:00, or on a Sunday before a Monday bill, may not land in time. The plan never thinks about the day before being a weekend or a bank holiday for the transfer itself. Ask the person ("Your bank may not move money on Sundays") or date it the last working day.

7. Partial cover (Scene 3 and rule 6). Main can spare only some. The plan says the rest stays a shortfall, and rule 7 says a covered account sets no short. Which wins when it is half covered? The person needs one sentence: "Move 10,000 from Main to Savings by 9 Dec. Even then Savings is 5,000 short". Not written down. CONFUSING; could become two verdicts on Home (F2).

8. Choice of payer (Scene 3). The app picks "the one with most room". Aya wants Main (where her pay goes) or wants to change the phone bill's bank instead. Both are out of scope. The line gives her one answer only, and no "not now". BLOCKER under M91 ("a question the app asks with only one answer in mind"). At minimum the line needs a way to: change which bank pays the bill; say later; say done.

9. Goal money in Savings (plan: "goal money in Beta is not spent by the cover"). Good. But Aya's natural thought is "take it from the trip". The plan never offers it, nor says why not. Fine to refuse, but the help under the move line should say "your trip money stays put".

10. Cash short (plan: "a move out of the paying bank is a cash withdrawal"). Section H says cash is taken out once a month on pay day for envelopes (M92, M96). A line "Move 3,000 from Main to Play wallet by 9 Dec" reads like "take out more cash mid month". Should say "take out 3,000 cash" and join the pay day cash list (H walk a), not a separate move.

## Words a 25-year-old would not know
- "cover" (if it reaches the screen): guessed "insurance".
- "can spare it" (today's move line end): guessed "has extra", ok-ish.
- "minimum" in "below its minimum of 0": guessed "minimum payment" on the card. Use "below zero" when the minimum is 0.
- "headroom", "spendFrom", "shortfall": plan words, must not reach the screen.

## OWNER'S WORDS
- M7 NOT MET in plan: headline right, but Home gives two amounts and up to four dates for one move (step 2, 3).
- M12 NOT MET: same.
- M45 NOT MET: step 4, a move done in the bank app is taken off twice.
- M47 MET: amber line kept.
- M51 NOT MET: "move by 9 Dec" vs "goes under on 10 Dec" vs "by 10 Dec".
- M52/M53 COULD NOT TELL: one line, no picture; fine if step 3 is fixed.
- M91 NOT MET: no later, no done, no other payer.
- M96 / H walk (a) NOT MET: cash short not joined to the pay day cash list.
- M98 MET in part: the plan walks one person; scenes 1 step 4 and scene 3 are missing.

## COUNT
Scenes 3. Plan steps walked 10: fine 2 (1, 5 numbers), missing a choice 4 (4, 5 words, 8, 9), moments not thought of 3 (4, 6, 10), contradictions 2 (2, 3). Places a person would give up 2 (step 4 "it still says move 22,000 and my number went down", step 8 "I don't want it from that bank"). Words not explained 3 that can reach the screen.

## BLOCKERS
1. Dates contradict across the plan (9/27 vs 10/28), including the tests. Make every section, rule 8 and the tests say 9 Dec and 27 Dec, and drop the "Not in this slice: moves dated other than by the bill's day" line or reword it.
2. Covered account still shows "goes 22,000 below zero on 10 Dec" and "Later on ... 101,400" beside "79,400 more by 27 Dec". One line on Home when covered.
3. No way to say "I moved it" (or Later, or Pay from Main instead) from the move line; the bank app move gets counted twice. Bring the F4 answer into this slice or at least put "Done" (records the move, Undo) on the line.
4. Only one payer, chosen by the app, no other choice (M91).

## CONFUSING
- Partial cover: write the one sentence Home shows.
- Headline jump on update day (107,400 to 179,400): one line once.
- Cash short: "take out X cash", not "move".

## POLISH
- Change of paying bank: say the new top-up need right under the change.
- Weekend or late night "by today".

## FOR MAKO'S EYE
- "Move 22,000 from Main to Beta by 9 Dec, and 79,400 more by 27 Dec" in one line vs two lines, one per date.

## NOT CHECKED
- The app itself (plan round). The assistant's wording of covers (only that the summary names them).
