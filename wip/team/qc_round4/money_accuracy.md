QC round 4, build 38.31, /tmp/qc_build/build.html
Role: Money accuracy (QC_ROLES.md section 2). The task named no role. north-star and numbers were already taken in /tmp/qc, so I took this one and worked in /tmp/qc/money-unassigned/. Before I picked the role I had read part of RESUME.md, so I was not fully blind. I did not write REPORT.md: my standing instructions say not to write report files, so the full report is here only.

Last ten lines of verify.txt:
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
The file ends VERIFY OK, but the golden section above says FAIL, and 13 plans dated 2027 are MISSING. The builder should check whether this has the same cause as blocker 1.

## BLOCKERS

**1. The plan always starts in November 2026.** The build has `START = '2026-11'`. Anyone who sets up from 1 Dec 2026 gets a month they never lived counted as done.
- Setup on 1 Dec (clock faked, 412 wide): $ pay 3,000, balance 1,000, rent 1,000, food 400, "Already saved" 0.
- Setup done says "Emergency fund $730 of $4,200 so far".
- Plan > Burrows says "Saved so far: $365."
- Home says "Saved $2,470" and "Total $3,470".
- The true figures at the end of Dec are $1,235 in burrows and $2,235 in total, so Home overstates by $1,235.
- A second setup on 31 Jan 2027 (€ pay 2,000, balance 300, bills 2,300.40) gives "It starts the month €300.80 below zero" and "Bank at month end −€601.20", although the person typed €300 that day. The −300.80 is November's and December's shortfall taken off the €300.
- Fix: start the plan, and apply the balance, at the month of setup.

**2. Pay 0 mixes made-up amounts into a real plan.** Setup with € pay 0, balance 5,000, rent 900, food 400.
- Plan > Month shows Free to spend €165, Education €165, Investing €165 and Giving €85. The person never chose these.
- Home says "Your plan spends €1,880 in Nov and no pay is entered, so your bank would end at €3,120."
- The true figures are €1,300 spent and €3,700 at month end.
- Only the footer says "The sample numbers are made up". Nothing on the screen says which numbers are samples.
- Fix: with no pay, every place except bills is 0.

**3. A debt that is only planned to be paid off reads as done and earns "Goal full".** Test: "Loan from mum", 1,200 owed, 300 paid off, due 15 Dec 2026, checked on 20 Nov.
- Home says "Loan from mum is paid off." and "$1,200, 100% paid off".
- More shows "Done".
- Badges show "Halfway Earned" and "Goal full Earned". The emergency fund is at 20%, so the debt earned both.
- $900 is still owed today, and the brief says a debt never reads "full".
- Fix: "Paid off at the end of Nov, planned". A debt gets a paid-off badge only once it is paid.

## CONFUSING

- **Two percent rules on one screen.** Yen screen pack, Plan: "Not placed yet ¥80,000 28%" (28.57) next to "¥10,000 4%" (3.57). Dollar pack: "Goal burrows $350 11%" (10.77), while goal bars round down. Use one rule: round down everywhere, with "under 1%".
- **"Under 1%" and "0%" for the same amount.** Plan with huge pay: the row says "$1.01 under 1%", and the sentence under it says "Bills and basics are 0% of pay". The tour shows "Bills and basics 0%". Replace both with "under 1% of pay".
- **Goal amounts lose their cents**, while bills keep theirs:
  - "Already saved" 500.50 becomes "Saved so far: $501".
  - "3 months of your bills is €6,901.20" becomes "€8,000 of €6,901".
  - 999,999,999.99 saved becomes $1,000,000,000.
- **"So far" already counts this month's saving.** Setup done says "$865 of $4,200 so far, and your plan adds $365 a month", but $500 was typed. Replace with: "$500 saved. With this month's $365 it is $865 at the end of Nov."
- **The debt form names a tab that does not exist.** It says "use Cards and loans on the Goals tab instead", but the tabs are Month, Burrows and All months. Replace with "use Add card or loan below".
- **A negative balance disappears on Back.** Typing −500, then Next, then Back leaves Balance now empty, although −500 is kept. A typed 700 does show again.

## POLISH

- **Old errors stay on later steps.** "That amount is too big. The most is 1,000,000,000. Type it again." stays on the Bills step after a valid pay. "Only two digits after the point..." still shows on Setup done.
- **The kept amount is not named.** Typing 420.505 keeps 420.50, but the message only says to type it again. Say what was kept.

## Checked by hand and correct

- Dollar screen pack: pay split, Left $854.75, receipts $579.50 and $62.75 over.
- Every bank figure in All months, goal full dates and "7 months to go".
- Yen pack: sums and Jan 2028.
- Bills above pay: €300.40 short, emergency fund 3 × bills.
- Huge-pay bank and total.
- Last day of the month: "1 day left. About $365 a day."
- Debt with 0 owed is refused.
- No page errors.

## Waiting for Mako's full run (not failures)

- Q1: Home has no "they add up" line.
- Q4: Home's first screen is text.
- Whether Check your bank should change the figure the plan starts from. Seen as: "Your bank now is $1,500, so the two can differ."
- Counting a card in the month it is paid.
- How short-month fixes should work across months. Seen as: "Borrow €801.20 from emergency fund".
- One word for "short".
- The borrowed row's percent beside places past 100.

Not tested: leap day, because blocker 1 masks dates after November.

Screenshots: /tmp/qc/money-unassigned/shots/ (t36-dec1-home.png, t8-home.png, t15-pay0-month.png, t25-home-debt.png, t28-badges.png, t32-huge-plan.png).

VERDICT: FAIL