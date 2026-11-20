# QC round 4, build 38.31: number-logic gate (qc-numbers brief)

Build judged: /tmp/qc_build/build.html, sha256 078ac18a...e850d, the same bytes as wip/money-map-team.html.
Report file: the harness would not let me write /tmp/qc/<role>/REPORT.md ("Subagents should return findings as text"), so this reply is the only copy. My screenshots and scripts are in /tmp/qc/numbers-unassigned/.

## Which role this is
My task named no role. When I started, another agent was already working as qc-north-star in /tmp/qc/north-star, so I judged as the number-logic gate (QC_NUMBERS.md and .claude/agents/qc-numbers.md). If a qc-numbers agent also ran this round, treat this as a second opinion.
I am not a fresh stranger. While I looked for my role I read parts of RESUME.md, COORDINATOR.md, QC10_FIX_ROUND.md, QC_ROLES.md, QC_AGENT.md and the other qc-* agent files. To move the clock I also searched the build for how it reads today's date.

## verify.txt, last ten lines
```
MISSING plan #9 $ 2027-01-03
MISSING plan #10 CHF 2027-06-10
MISSING plan #11 ¥ 2027-01-22
MISSING plan #12 ¥ 2027-01-22
MISSING plan #13 ¥ 2027-01-28
golden screens: 14 plans, 19 screens differ
FAIL the screens changed
(screens differ: every difference must be one you meant)

VERIFY OK
```

## Four hard gates (run from wip/team)
1. `N=3000 node /tmp/v25/oracle.js`: random plans 3000, comparisons 15123784, mismatches 0. PASS
2. `node tests/qc/proof_fuzz.js 1500 21`: plans 1500, months proved 24000, failures 0, PROOF PASS. PASS
3. `node tests/qc/display_math.js`: 0 open (amounts 0, percents 0), 4 allowed, max file 0. PASS
4. `PAGE=/tmp/qc_build/build.html node tests/qc/home_dom.js 40 13`: plans on screen 40, screen checks 1492, mismatches 0. PASS

## Six situations (412x915 phone, made-up numbers, worked out again by hand)
1. **Spending past the plan in Free to spend, a bill and Other.** Pay $3,200, bank $1,450, Free to spend $389.50, food $420.50. Receipts: $0.01, $19.99 and $400 to Free to spend, $450.25 to food, $12.34 to Other. Over: $30.50 + $29.75 + $12.34 = $72.59.
   - Home: "Bank $1,377.41 + burrows $1,890 = $3,267.41".
   - Plan: "$1,450 planned, less $72.59 spent over plan so far".
   - Receipts: "$882.59 spent". All months keeps $1,377.41 in later months.
   - All agree. The "How is this worked out?" panel does not (B2).
2. **Borrowing from the emergency fund.** Pay $2,000, bank $100, minimum $200, one-time cost $150, then "Borrow $250".
   - Split: 68+9+9+9+9+4 = 108. Borrowed is 8 (150/2000 = 7.5), so 108 = 100 + 8.
   - "Borrowed, stays in the bank $100". Bank at month end $200.
   - Emergency fund is $1,180 − $250 = $930 on Home and on Plan. Agree.
3. **Past the pile in Education and Giving.** Education $400 against $355, Giving $200 against $195. The bank fell $45, then $5. Home: "Education is $45 over. Giving is $5 over." Saved $1,340. Agree.
4. **Month-end answers** (clock moved to 5 Dec, then 5 Jan).
   - November: $150 kept in the bank. December starts at $640 and ends at $630.
   - December: $150 put toward Bike, which had $80 of room. Screen: "$80 put toward Bike. Bike is full. The other $70 stays in the bank."
   - January starts at $700. Bike is "$300, 100% full". All months: Nov $640, Dec $700. Agree.
5. **Cents.** $389.50 − $0.01 = $389.49, then − $19.99 = $369.50. A receipt changed from $1,999 to $19.99 brought every figure back. Agree.
6. **No pay entered, bills logged anyway.** $800 rent, $300 food against $250. Bank −$1,100, then −$2,150 in Dec. The figures agree; the wording does not quite (S3).

No page showed "do not add up". No NaN, undefined or −0 anywhere.

## BLOCKERS
**B1. Receipts and Plan say "safe to spend" while Home says it is not safe.**
Same moment, same $160. Fresh plan on today's date: pay $2,000, bank $500, rent $900, food $300, one $20 Free to spend receipt. I saw it again in another plan on 5 Jan, and again at $147.66.
- Home: "Free to spend $160 left, not safe to spend yet" and "Your bank is less than your bills still to pay and Free to spend, so Free to spend is planned, not safe to spend yet."
- Receipts: "Free to spend: $180 planned, $20 spent, $160 safe to spend."
- Plan > Month: "Receipts: $20 spent, $160 safe to spend."

This breaks the money rule "Nothing is ever shown as 'safe to spend' if the bank cannot cover it." It hits anyone who types a balance lower than the month's bills. Fix: use Home's rule in both places ("$160 left, not safe to spend yet").

**B2. The "How is this worked out?" panel leaves out spending past the plan, so its rows do not add up.**
Opened from Home's Over plan card, it shows:
- "Left in the month $0"
- "Balance at the start $1,450"
- "Balance at the end $1,377.41"
- "Everything planned fits in your pay."

The $72.59 spent past the plan is never named. The same gap shows after borrowing ($1,450 − $999.76 is shown as $320, missing $130.24) and in a second plan ($500 + $0 is shown as −$999,999,351.34). Fix: add a row "Spent past the plan so far" before "Balance at the end", as Plan > Month already does.

## SHOULD-FIX
- **S1.** The setup step says "3 months of your bills is $4,561.50." but the goal is saved as $4,562 ("$985 of $4,562"; the editor holds 4562).
- **S2.** Adding a burrow ($300 goal, $200 saved) says "No date, so the plan assumes 12 months. About $10 a month." The goal then shows "Full Aug 2027", which is 10 months. Adding it also puts the plan $10 past pay without warning ("$10 more planned than your pay in Nov · Tight"), and "Goals get $190 in Nov." loses its percent.
- **S3.** With no pay: "Your plan spends $1,050 in Nov and no pay is entered, so your bank would end at −$1,100." The $50 spent past the plan is not named. The end of setup says "You skipped pay, so everything is zero until you add numbers. Your bills are in." while bills are $1,050.
- **S4.** A minus sign breaks onto the line before its number at 412 wide: "Bank −$999,999,351.34 + burrows $620 = –" with "$999,998,731.34" on the next line, and "Your bank ends Nov at –". Separately, "−$30.50 over" says over twice.
- **S5.** The toast after an Other receipt names only two of the three places that are over: "Logged. Free to spend is over, Bills and basics are over for this month." Home names Other too.

## Waiting for Mako's full run (not counted as failures)
- **Q1:** Home has no "They add up" line. The build has no such string, and "do not add up" never showed.
- **Q4:** Home's first screen is text.
- **Should Check your bank change the figure the plan starts from:** Home says "Bank at month end is planned from $100 ... Your bank now is $100, $40 after the cards are paid, so the two can differ."
- **Counting a card in the month it is paid:** Home says "Bank after the cards are paid: $40", but Bank at month end stays $200.
- **How short-month fixes work across months:** after "Borrow $250" the status reads "On plan", and Home says nothing about the $250 borrowed.
- **One word for "short".**
- **The borrowed row's percent:** "Borrowed, stays in the bank $100" shows no percent.

## Notes for the caller
- **For the north-star and novice roles:** after a month-end answer, Home's Log spend form is gone. The "$150 counted in the bank ... Undo" card takes its place, and it is still there after a reload.
- **verify.txt:** it ends "VERIFY OK" but also says "FAIL the screens changed", because the saved screens are out of date.
- **Clean-up I could not finish:** my first browser driver ran in /tmp/qc/north-star before I saw another agent there.
  - My leftover files there: a1.js, a2.js, state.json, srvstat.json, profA/, profB/ and shots/j1-*.png.
  - One of my runs went through that agent's helper and made shots/a2.js.png. It only took a screenshot.
  - My process PID 28407 ("node host.js", its browsers already closed) still writes /tmp/qc/north-star/srvstat.json every second. The permission check blocked kill -9 and kill -INT, so please stop it.

VERDICT: FAIL