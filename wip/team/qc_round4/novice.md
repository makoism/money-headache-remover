# QC round 4, 38.31: Novice (qc-novice)

**Role:** My brief named no role, so I claimed the Novice role, which nobody had taken. The claim is in /tmp/qc/novice-unassigned/CLAIM.txt, the same way the data-safety reviewer claimed its role. I did not write REPORT.md: my standing instructions say not to write report files, so the full report is only in this reply.

**verify.sh, last ten lines** (from /tmp/qc_build/verify.txt). The build is unchanged since it was staged at 17:29 (md5 ec3748b7f655f8b2b323821b90f8c80f). I did not run verify.sh again, because it rebuilds the repo file while other agents are working.
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

**Jobs.** Phone at 412x915, empty storage, screens only, Dollar. Made-up numbers: pay 3,200, balance 1,500, rent 1,100, food 400.
1. Get me set up: **DONE.** Home shows bank $1,500, Bills and basics $1,500 (1,100 + 400) and Free to spend $385.
2. What is safe to spend today: **DONE**, but only after Check your bank. Home then said "$372.50 safe to spend", which is $385 less the $12.50 lunch. Before that, Home said "not safe to spend yet" and its own popup gave a daily amount (B2).
3. Does this match my bank: **DONE.** Home shows "$4,700, Balance you entered on 21 Nov". The month-end figures still start from $1,500, which is waiting for Mako.
4. Card I pay in full: **DONE.** Home shows "Bank after the cards are paid: $4,080", which is 4,700 − 620.
5. I just bought lunch: **DONE** in well under 60 s. After Edit, Receipts shows $12.50 once, and Free to spend went from 385 to 372.50.
6. Undo: **DONE.** I undid a wrong Free to spend amount on Plan (3,850) and a wrong $50 spend. Home's text was identical to before after each Undo, and the numbers survive a reload.
7. Save for a trip: **DONE.** "Lisbon trip $95, 7% full" shows on Home. Free to spend did not change; the $95 is planned past pay (C1).
8. Help: **DONE by naming the gaps.** I reached Help from Home, Receipts, Plan and Settings. An open burrow has no way to Help (only "Back home" and "Add money"), and neither does setup (only "Finish later").

## BLOCKERS
**B1. Says money is saved when nothing is.**
- The setup done screen says "$385 of $4,500 so far, and your plan adds $385 a month", but I left Already saved blank.
- An open burrow says "Lisbon trip $95 of $1,200, 7% full", with no "planned" tag.
- The More card says "$385 of $4,500 … +$385 this month".
- Plan > Burrows shows "$385 of $4,500" and "Saved so far: $0" on the same card.
- This is already queue item E and is still in this build. Suggested text: "$0 saved now, $385 by the end of Nov".

**B2. "Not safe to spend" next to a daily amount.**
- The Home tile says "Free to spend $385 left, not safe to spend yet".
- Tapping it shows "Per week for the 10 days left $270, Per day $39" and never says the money is not safe.
- This is already queue item B and is still in this build. The popup should repeat "not safe to spend yet" and leave out the per-week and per-day rows.

## CONFUSING
- **C1.** Adding a burrow when all of the pay is placed never says where the $95 a month comes from. It quietly becomes "Tight month … Plans $95 more than your pay" and "Coming up: Dec is tight, Jan is tight, Feb is tight". A beginner expects Free to spend to go down. Add to the last step: "All your pay already has a place. Take $95 a month from: Free to spend / your bank."
- **C2.** Two words for one setting: Plan says "The mark is your $580 ceiling." and "Above the $580 ceiling.", while Settings calls it "Free to spend cap". Use "cap" in both places: "The mark is your $580 cap (Settings)."
- **C3.** "Your minimum balance $320" appears in "How is this worked out?" and on Plan, but setup never asked for it and nothing says what it is for. Add: "The least you want in the bank. You get a warning below it."
- **C4.** The setup Emergency fund step says "tap Back to the Your money step and lower that balance by this amount". That asks a beginner to do the sum and go back. Ask "Same account as your balance? Yes / No" and subtract it for them.
- **C5.** Receipts opens on "Scan receipts … paste it into ChatGPT". The receipt I just logged is 2.4 screens further down. Put the receipt list first.
- **C6.** Right after I added Visa on Home, Plan > Burrows says "Nothing here yet: add a card or loan". Add: "Cards you pay in full are on Home."

## POLISH
- **P1.** The "Badge: First receipt." toast is hidden behind the "Logged $125: Free to spend. Undo" bar (/tmp/qc/novice-unassigned/shots/j5-02-crop.png). This is QC10 F5, now reproduced at 412x915.
- **P2.** The toast "Saved: $4,700 in your bank today." uses "Saved", which is the name of the burrows card. Suggest "Bank updated: $4,700 today."
- **P3.** Picking "1 year" gives "about $95 a month for 13 months", but the More card says "12 months".
- **P4.** The Bills step says "rough numbers are fine" on a screen with no number boxes.
- **P5.** Two input boxes:
  - The card amount box has no "$" like the other money boxes.
  - The "Balance now" hint text is cut off at "Overdrawn? Type a".
- **P6.** Visual first: the card line on Home is text only.

## Waiting for Mako's full run (not failures)
- Q1: Home has no "they add up" line.
- Q4: Home's first screen is text.
- Whether Check your bank should change the figure the plan starts from. Here Home says $4,700 now, "Bank at month end … planned from $1,500", Total $2,815, and Settings "Money today" still says $1,500.
- Counting a card in the month it is paid: the Visa $620 is not in "Bills, one-time costs and card payments".
- How short-month fixes should work across months.
- One word for "short": the Plan header says "Short", Home says "Tight month", Plan says "Over pay by".
- The borrowed row's percent beside places past 100: this walk never reached it.

No page errors, only AudioContext autoplay warnings. Screenshots are in /tmp/qc/novice-unassigned/shots/.

VERDICT: FAIL