# Number-logic gate, QC round 5 (final gate 2)

VERDICT: FAIL

Build judged: /tmp/qc_build/build.html (byte-identical to wip/money-map-team.html, checked with cmp).
The caller asked for wip/team/qc_round5/qc_numbers_gate.md. My brief forbids writing inside the repository, so this report is at /tmp/qc/numbers/REPORT.md only. The caller should copy it there if wanted.

## verify.txt, last ten lines
```
MISSING plan #7 ¥ 2027-08-03
MISSING plan #8 € 2027-08-01
MISSING plan #9 $ 2027-01-03
MISSING plan #10 CHF 2027-06-10
MISSING plan #11 ¥ 2027-01-22
MISSING plan #12 ¥ 2027-01-22
MISSING plan #13 ¥ 2027-01-28
golden screens: 14 plans, 20 screens differ
FAIL the screens changed
(screens differ: every difference must be one you meant)

VERIFY OK
```
Note: verify ends VERIFY OK, but contains "FAIL the screens changed" (20 golden screens differ, 13 plans MISSING). Not my gate; flagged so someone confirms every difference was meant.

## The four hard gates (run from wip/team, in order)
1. `N=3000 node /tmp/v25/oracle.js`: "random plans 3000 ... comparisons 15078185 | mismatches 0". PASS
2. `node tests/qc/proof_fuzz.js 1500 21`: "plans 1500 | months proved 24000 | failures 0 / PROOF PASS". PASS
3. `node tests/qc/display_math.js`: "screen maths: 0 open (amounts 0, percents 0)"; display_math.max is 0. PASS
4. `node tests/qc/home_dom.js 40 13` (no other browser of mine running): "plans on screen 40 | screen checks 1492 | mismatches 0". PASS

## Findings, ranked

### 1. BLOCKER: "safe to spend" shown while the bank is below zero all month
Rule broken: "Spending past a plan comes out of the bank and stays out in later months. Nothing is ever shown as safe to spend if the bank cannot cover it."
Steps (390 and 320 wide, yen): fresh state, sample plan (plan spends ¥200,000 a month incl. Free to spend ¥20,000), Salary ¥250,000 from Nov 2026, bank balance at start ¥0, minimum ¥50,000. Log in Nov: ¥150,000 Other ("car repair"), ¥20,000 Free to spend. Open the app on 10 Dec 2026.
Home showed: "Free to spend | ¥20,000 | safe to spend", "Bank at month end | −¥50,000 | (short)", "Bank at month end is planned from −¥100,000", and the status: "Your bank would end ¥50,000 below zero in Dec. It starts the month ¥100,000 below zero. ... Keep Free to spend to the ¥20,000 shown". Receipts: "Free to spend: ¥20,000 planned, ¥0 spent, ¥20,000 safe to spend."
Recomputed: start −100,000 + 250,000 − 180,000 (plan without Free to spend) = −30,000 before any Free to spend. The bank cannot cover a single yen of it. The one right answer: ¥0 safe to spend (and the status must not invite spending ¥20,000).
The app contradicts itself: with no pay entered (situation 6) Plan > Month shows "¥0 safe to spend" when the bank ends below zero; here, with the bank below zero for the whole month, it shows ¥20,000.
Same fault, larger: plan with a ¥999,999,999 receipt in Dec 2026, opened 10 Feb 2028: Home "Free to spend ¥19,999 safe to spend" with "Bank at month end −¥999,238,400" and "Keep Free to spend to the ¥19,999 shown".
Evidence: /tmp/qc/numbers/homeAt_s9_statejson.png, /tmp/qc/numbers/homeAt_s8_statejson.png, state /tmp/qc/numbers/s9_state.json.

### 2. SHOULD-FIX (must-hold item not met as written): no "They add up: ..." line
QC_NUMBERS.md says Home's "Bank X + burrows Y = Z" must be followed by "They add up: ...". The string "They add up" does not exist anywhere in the build (searched the html). Every Home I read ends at e.g. "Bank ¥287,000 + burrows ¥210,000 = ¥497,000 at the end of Nov." followed by the status or Log spend. The sums themselves were always right and "These numbers do not add up" never appeared. Either the build or the brief must change; as written this check fails.

### 3. SHOULD-FIX: the same amount gets two different percents on one bar
Plan > Month, 390 wide, Nov 2026, pay ¥300,000: "Goal burrows ¥20,000 7%", "Free to spend ¥20,000 7%", "Education ¥20,000 7%", "Investing ¥20,000 6%" (sum 100 is right). With pay ¥150,000 and ¥50,000 borrowed: "Goal burrows ¥20,000 14%" next to "Free to spend / Education / Investing ¥20,000 13%". A person reads equal amounts as unequal. Right answer: equal amounts get equal percents; put the spare point on a part that is not tied (or show the rounding note).

### 4. SHOULD-FIX: "planned" labels a figure that already includes real overspending, and Plan calls a different figure "planned"
Steps: pay ¥300,000, start ¥200,000, Nov receipts Free to spend ¥25,000, Rent ¥45,000, Other ¥3,000.
Home: "Where your money sits at the end of Nov: the bank and your burrows planned / Bank at month end ¥287,000" and "Total ¥497,000 planned for the end of Nov".
Plan > Month: "Bank at month end: ¥287,000. ¥300,000 planned, less ¥13,000 spent over plan so far."
Both numbers are right (300,000 − 13,000 = 287,000), but "planned" names ¥287,000 on Home and ¥300,000 on Plan. Rule: planned and actual are never mislabelled. Right answer: Home calls ¥287,000 "expected" or "with what you spent so far", not "planned".

### 5. SHOULD-FIX: no-pay status sentence does not add up as written
Steps: yen sample plan, Salary/Second/Side pay 0, start ¥100,000, receipts Rent ¥40,000, Utilities ¥12,000 (plan ¥10,000).
Home: "Your plan spends ¥199,885 in Nov and no pay is entered, so your bank would end at −¥101,885."
100,000 − 199,885 = −99,885. The −¥101,885 (right, Plan > Month confirms "−¥99,885 planned, less ¥2,000 spent over plan so far") needs the ¥2,000 over plan, which the sentence leaves out. Right answer: name the ¥2,000 spent past the plan in the sentence.

### 6. SHOULD-FIX: changing currency from euro to yen keeps cents
Steps: euro plan with receipts €0.01 and €19.99, start €1,000.50, pay €2,345.67; Settings currency to ¥.
No question is asked; afterwards Receipts shows "¥0.01", "¥19.99", "¥41.57 spent", Home "Bank at month end is planned from ¥1,000.50", Plan "¥2,345.67 pay". New yen receipts are rounded to whole yen, so old and new yen amounts follow different rules. Right answer: ask, and round to whole yen (or say the amounts were kept as typed).

### 7. SHOULD-FIX: "doesn't need the borrow" next to "pays for part of this plan"
Pay ¥150,000, plan ¥200,000, ¥50,000 borrowed from the emergency fund, start ¥100,000, minimum ¥50,000. Plan > Month: "All pay is placed. ¥50,000 is borrowed from the emergency fund. Your plan doesn't need the borrow now." while the bar row reads "Borrowed, pays for part of this plan ¥50,000 33%". True only because the bank would end exactly at the ¥50,000 minimum without it; the two sentences read as a contradiction.

### 8. SHOULD-FIX (minor): decimals mixed in one list
Euro Receipts list: "€7", "€1.23", "€12.34", "€1", "€19.99", "€0.01". Whole amounts drop ".00" while their neighbours show cents.

## The six situations (numbers read and recomputed)
Sample yen plan unless stated: bills ¥110,000, goals ¥20,000 (5,700 + 2,500 + 2,900 + 8,900), Free to spend ¥20,000, Education ¥20,000, Investing ¥20,000, Giving ¥10,000 = ¥200,000. 390 wide, today 21 Nov 2026 unless stated.

1. Past plan in Free to spend, a bill and Other (pay 300,000, start 200,000; receipts 25,000 Free, 45,000 Rent, 3,000 Other). Home: Bills "¥70,000 left to pay, ¥5,000 over", Free "−¥5,000 over", "Bank ¥287,000 + burrows ¥210,000 = ¥497,000", status "Bills and basics are ¥5,000 over. Free to spend is ¥5,000 over. Other is ¥3,000 over." Why panel: 300,000 − 110,000 − 20,000 − 70,000 = 100,000; 200,000 + 100,000 − 13,000 = 287,000. Plan: not placed ¥87,000 29%, used for spending past plan ¥13,000 4%, bar 37+7+7+7+6+3+29+4 = 100; Left tooltip "Left ¥100,000 / ¥87,000 not placed yet (29% of pay) / ¥13,000 used for spending past plan". Receipts "¥73,000 spent". All months: Dec ¥387,000 ... Oct 2028 ¥2,727,000, goal-full months (Yearly cost May 2027 ¥100,300, Feb 2028 ¥104,100, Emergency Aug 2028 ¥116,900) all recomputed. Over the pay with no place (Free ¥150,000): bank ¥170,000, "All pay is used: ¥100,000 that had no place went to spending past plan", Left tooltip "¥100,000 used for spending past plan", bar sums 100. Agree, except finding 3 and 4.
2. Borrowed from emergency fund. Pay 150,000, borrow 50,000: places 73+14+13+13+13+7 = 133, Borrowed 33%, "Your pay is 100%. The other 33% is the borrowed ¥50,000", not placed 0: 133 + 0 = 100 + 33. Emergency ¥98,900 (140,000 + 8,900 − 50,000), bank ¥100,000, total ¥260,000. Pay 157,300, borrow 61,111, start 10,000, Free spent 27,000: 70+13+13+13+12+6 = 127 = 100 + 27; borrow split 42,700 + 7,000 + 11,411 = 61,111; "Balance would end at ¥21,411, ¥28,589 under your ¥50,000 minimum". Agree, except findings 3 and 7.
3. Education ¥26,000 and Giving ¥12,500 logged (piles 20,000 / 10,000). Bank ¥291,500 (300,000 − 6,000 − 2,500), Education ¥0, Giving ¥0, burrows ¥180,000, total ¥471,500. Also Education 30,000, Giving 15,000, Investing 25,000, double rent: "¥66,001 went past the plan", bank −¥16,001, Investing ¥25,000. Agree.
4. Opened 10 Jan 2027; Nov ¥15,000 and Dec ¥18,000 Free to spend unlogged. Before answering: "¥33,000 of Free to spend is left out until you answer". Dec to Yearly cost (room 14,200): "¥14,200 put toward Yearly cost / Yearly cost is full. The other ¥3,800 stays in the bank." Nov to the bank: "¥15,000 counted in the bank". Home Jan: bank ¥521,700, Yearly cost ¥20,000, burrows ¥361,300, total ¥883,000 (850,000 + 33,000). Plan Nov bank ¥315,000, Dec ¥418,800, All months Jan ¥102,900 not placed, Receipts "¥34,200 went to goals". Logging ¥10,000 in Dec afterwards: "¥8,000 put toward Yearly cost / ¥3,300 to go. Full Mar 2027", Plan "¥16,700 of ¥20,000", total ¥873,000; another ¥8,000: answer card drops it, Yearly cost ¥8,700, total ¥865,000. Longer emergency goal yes: Home "¥333,900, 50% full", tile "¥325,000 saved now, of ¥660,000", Plan "¥333,900 of ¥660,000 ... Not full within 2 years". Agree.
5. Euro, typed in the Home box: 0.01, 19.99, 1.005 (logged €1), "12,34" (€12.34), "1,234.5" (box refused the third decimal with a message, logged €1.23), "7a" (letter refused, €7), 0 ("Enter an amount."), −5 (refused). "€41.57 spent", "€123.43 safe to spend", bank €1,696.17 (1,000.50 + 2,345.67 − 1,650), total €3,471.17, bar 39+7+7+7+7+3+30 = 100. Agree, except findings 6 and 8.
6. No pay, Rent ¥40,000 and Utilities ¥12,000 logged. Home "No pay entered ... −¥101,885"; Plan "Short by ¥199,885", "¥0 safe to spend", bank −¥101,885; All months Dec −¥301,770. No NaN. Agree, except finding 5.

Other checks with no fault: delete a receipt and Undo (bank −¥50,000 → ¥100,000 → −¥50,000, kept after reload); plan edit after receipts (Free plan 30,000 → bank ¥282,000; rent once 50,000 → ¥277,000); two tabs logging ¥500 and ¥700 kept both (¥285,800 in both); duplicate warned; ¥999,999,999 warned; 1,000,000,001 refused; receipts on 31 Dec, 31 Jan, 29 Feb 2028 land in the right month. No NaN, undefined, Infinity or −0 on any screen read; no page errors.

Files: scripts and outputs in /tmp/qc/numbers/ (sc_*.js, *_state.json, out_*.json, ld_*.json, screenshots *.png at deviceScaleFactor 2).

VERDICT: FAIL
