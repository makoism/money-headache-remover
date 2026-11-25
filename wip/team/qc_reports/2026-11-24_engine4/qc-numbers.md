VERDICT: FAIL

Stopped at the coordinator's 150,000 token limit. This is a part review: one life walked three weeks, five lives set up with one to three steps each. See NOT CHECKED.

CHECK: last five lines of check3.txt
```
[x] The real-page walk (walk 4 run A) as a gate: Mako's made-up shape from setup on 24 Nov to 15 Feb through the page, safe to spend and the bank at every step are the hand-worked figures  (tests/e3_walk.js: PASS)
[x] Setup, short (setup3): bank today, pay with a second income, cards with a close day or not sure, bills, the minimum; through build_book and the store  (tests/e3_setup.js: PASS)

(full level, 3 at a time, 417 s in all)
ALL GOOD
```
Build: /home/user/cardgap/wip/team/app3/index.html (lane/twofig-engine at fc7e5a6). No scope.txt, no screen pack. Phone 390x844, dark. No page errors in any run.

OWNER'S WORDS (C and D)
- M26 MET. M27 MET (10th and 11th; Jan moves to 12 Jan, pay to 8 Jan, as I worked out).
- M28 COULD NOT TELL (second income not tried).
- M29, M39 MET ("after tax ... not the amount before tax"). It states it, it does not ask.
- M30 MET (card spend leaves the bank figure alone, lowers Free to spend).
- M31, M38 MET for fixed pay. No-fixed-pay Home shows no period dates.
- M32, M41 MET. M34 MET. M35 MET. M36, M37 MET. M40 MET. M42 MET. M48 MET (dollars with cents, yen whole, "12.345" refused in yen).
- M44 NOT MET (finding 1).
- M45 MET in what I walked (late pay never counted twice).
- M33, M43, M46, M47 (colour), M49, M50, M51: COULD NOT TELL, not reached.

COUNT
- Lives walked: 1 part way (monthly on the 10th, two cards, 24 Nov to 14 Dec, 11 days opened). 5 more set up and stepped 1 to 3 times (two weeks in dollars, weekly, freelance, day after pay, two banks and cash). 0 walked the full six weeks.
- Steps compared: 48 (21 in life 1, 13 in lives 2 to 6, 14 bad inputs).
- Figures: about 300 read and tied. Wrong: 3 figures, carried over 12 steps (finding 1). Unexplained: 3 (finding 2).

BLOCKERS

1. A spend logged on the day of setup was ignored by the bank and by Free to spend, while its row sat in the list. Life 1, Japan, set up 24 Nov: bank 300000, pay 400000 on the 10th, Free 60000, Card A 120000 paid 10th not sure, Card B 45000 paid 11th closes 25, Rent 90000 on 27, Phone 8000 on 5, keep 20000. Closed the app, opened it again on 24 Nov, Receipts, Money went out 3000 from Main bank, note "lunch".
 - Screen: "Logged ¥3,000 on Free to spend". Home "Bank today ¥300,000", safe to spend "¥32,000". Receipts "spent ¥0 of ¥32,000" with the row "24 Nov, Main bank, lunch ¥3,000" under it.
 - Should be: bank 297,000, Free to spend left 29,000, safe 29,000.
 - It stayed wrong all life. 12 Dec, Receipts: "spent ¥24,200 of ¥32,000". The rows on screen add to 27,200 (4,000 + 6,000 − 1,500 + 2,500 + 1,200 + 10,000 + 2,000 + 3,000). After the pay, the past period reads "spent ¥20,200 of ¥32,000" on Receipts and on Plan. Its rows add to 23,200.
 - On 14 Dec, the day of a Check your bank, a 5000 spend the same day did count ("¥417,300 checked 14 Dec, ¥5,000 out logged since").
 - I repeated it. Same setup and spend done minutes apart: correct (297,000, 29,000). Same on life 5. The wrong run had setup and spend in two sessions whose real clock times were on each side of midnight UTC, with the page's day held at 24 Nov. So I think the app orders a same-day check and spend by clock time, and a spend with an earlier clock time than the check is dropped. I did not read the code, so the cause is a guess. What is sure: a row can sit under a period whose "spent" leaves it out, and the app says "Logged" while no figure moves. The rule "never depends on the time zone or the time of day" is broken if my guess is right (a check at 09:00, then a spend logged the same date at an earlier clock time after a time zone change).
 - Fix wanted: a spend dated the day of a check counts or does not by one stated rule, and the period's "spent" always equals its rows.

2. No fixed pay: the sum cannot be explained from what was typed. Life 4, 24 Nov, somewhere else: bank 200000, pay 150000 "No fixed pay", Free 40000, Rent 70000 on 1, keep 10000.
 - Screen: "Your plan needs more than you have", "Your plan lines need ¥1,287 more than your bank can spare. It runs short from 8 Jan", "Safe to spend with no fixed pay ¥0". The sum is one line with 39 terms: "− ¥1,315 (Free to spend by day)" 30 times, "− ¥1,317" once, Rent 1 Jan, then "− ¥1,315" 8 more times.
 - The arithmetic adds up (−1,287). Not explained anywhere: why it looks to 8 Jan; why a day costs 1,315; why December costs 40,767 when the person typed 40,000 a period (November is prorated 7/30 of 40,000 = 9,333, so a period is a calendar month and December should be 40,000, 767 less, which turns "short by ¥1,287" into short by 520).
 - A person with 200,000 in the bank and one 70,000 bill sees "¥0" on day one and cannot work out why.
 - After Money came in 150000: bank 350,000, spare 148,713, safe 9,333. Those tie.

CONFUSING
- Home, pay late (life 1, 11 and 12 Dec): the sum line "¥196,000 (Main bank today) − ¥129,700 ... = −⁠¥98,200" is printed twice, one under the other. Print it once.
- Home, life 1 from 5 Dec: "It counts everything on the cards now, as their close days are not sure" while Card B closes on day 25 and only its 45,000 statement is counted, not the 51,000 owed. Say "Card A's close day is not sure".
- Home, life 6: the Savings sum is printed twice in the same block.
- Setup says "Everyday spending", every screen after says "Free to spend".
- A spend dated before setup (1 Oct) says "Logged ¥500 on Free to spend" and moves nothing. Say it is before your bank check so the bank already has it.

TIED, for the record
- Life 1: setup (182,000 spare, 32,000 = 60,000 x 16/30, 437,000 after cards); card spend; back-dated spend; check off by 2,500 and 1,200 counted as spending (16,300); refund (17,800); bill 8,000 to 9,500 from 3 Dec, earlier ones kept; Card B spend after its close stays out of the 11 Dec payment; pay not seen on 11 Dec (short 98,200, never counted); pay landed 12 Dec (417,300, 56,000, 711,800); add, Undo, reload; same spend twice.
- Life 2: $214.28 = 300 x 10/14 rounded down, $370.40, 0.10 + 0.20 = 0.30, reload. Life 3: 2,000. Life 5: 48,333, 150,000. Life 6: 98,000, 26,250, move 20,000 leaves the total alone, cash spend, Undo.
- Bad amounts: empty, 0, −500, 1, 999999999 (asks first), 12.345, abc, "1,234", full-width digits, 1e3, 20 digits. Dates: past, future, 29 Feb 2028. All gave a plain message or a right figure.

NOT CHECKED
- Six full weeks in any life; weeks 4 to 6 of life 1 (the 8 Jan pay, the 12 Jan cards).
- Lives 2, 3, 5: refund, move, late pay, bill change, unmatched check. Life 4: everything after one money in. Life 6: late pay, bill change, check.
- Statement import. The assistant's figures (item 5), all of it. Goals, loans, plan lines, second income, pay on two days, once-a-year bills, the 31st and 29 Feb as a bill or pay day.
- Setup boxes with bad input; Check your bank boxes with bad input; "Save it anyway" on 999,999,999.
- Remove a spend, change a spend, remove a bill, End this bill, "Change the next one only".
- Order of entry, time zone, desktop and 320 sizes, light scheme, euros and pesos.
- Sheets and messages other than Check your bank, the bill sheet and Reminders (dates only tied there).
