# QC round 4, 38.31: Wording editor (qc-wording)

Last ten lines of /tmp/qc_build/verify.txt:
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

Role: my brief didn't name a role, so I took the one nobody had claimed, qc-wording. Before picking it I read QC_ROLES.md, the top of RESUME.md and the file names in qc_round4. I worked from the screen pack, my own runs at 412x915 and the text inside build.html. My screenshots and the copied texts are in /tmp/qc/wording-unassigned/. The harness wouldn't let me write REPORT.md, so this reply is the only copy of the report.

## BLOCKERS
1. **Ask sends people to buttons that do not exist.** In Help > Ask about my money > Other AI, "Copy question" copies a guide. The part of it that describes the page also goes with every question asked inside the app. The guide says "Name buttons exactly as written below" and then lists names the app no longer uses:
   - "Month, Goals and All months" (the screen says Burrows, not Goals)
   - "Log receipt" (the button is Log spend)
   - "Add goal" (the button is Add a burrow)
   - "Then Jars: the six jars ... Play ... Give ... Long-Term Savings for Spending"
   - "Keep as play"

   Claude is also sent the words "Jars" and "unassigned". Fix: rewrite the guide from today's screens, using only glossary words.
2. **Settings says the plan is empty when it is not.** I tapped Clear my plan, then typed pay of $3,000 on Plan. Settings still says "Everything starts at zero, so type over it." and "Plan cleared." In the screen pack, the yen and dollar plans are full of numbers and still show "Everything is at zero now, start with your pay". Fix: choose this text by checking whether the plan is actually empty.

## CONFUSING
- **"planned" means two different figures.** Home shows "Bank at month end $1,425" under "the bank and your burrows planned". Plan says "$1,500 planned, less $75 spent over plan so far." Suggested Home wording: "if the rest of Nov goes to plan".
- **"Saved" means two different figures.** Home says "Saved ¥210,000". Burrows says "Saved so far: ¥140,000". Suggested Home label: "Burrows at month end".
- **"past plan" and "over plan" for the same money.** Plan shows "Used for spending past plan / came out of pay with no place" next to "spent over plan". Suggested: "Spent over plan / from pay not placed yet".
- **The "Over plan" chip doesn't say what is over.** It sits above "$792 of pay not placed yet...". Suggested first line: "Food and groceries is $62.75 over plan."
- **Plan tells people to go to Plan.** The Plan tab shows "· Place it on Plan". The goal editor on Plan > Burrows says "To change it open Burrows under Plan."
- **The emergency fund box reads as if Trip is the emergency fund.** In Trip's editor, with the box unticked, it says "This is the one goal you can borrow from". Suggested: "Tick to make this your emergency fund, the one goal you can borrow from."
- **Settings > Goal burrows says "Your burrows are in here."** Giving is a burrow too, so this is wrong. Suggested: "Your goals are in here."
- **One thing, several names.** Ask says "Balance, end of Nov" and All months says "Bank, month end" for Bank at month end. Ask says "Left over" for not placed yet. Home says "safety minimum" for the minimum balance.
- **"cushion" is never explained.** It appears in "Keep it as a cushion" (suggest "Keep it in the bank") and "Building your cushion". The same Extra money list has "Spend it, free to spend" and "Investing", which should start with "Add to ...".
- **Check your bank confirms a balance nobody typed.** With the box empty, Save shows "Saved: $1,500 in your bank today."
- **The month-end question gets the bank wrong.** It says "Your bank balance doesn't include it yet." The money is in the bank. Suggested: "The plan counted it as spent."

## POLISH
- "...or skip it, it's under Help too."
- "Cards and loans with interest, and their payments are part of Bills and basics"
- "All 50% of your pay here is given out."
- "Before the uploads / Before the uploads": the heading is repeated in the first sentence.
- "encrypted" is jargon.
- "free to spend" is lowercase on the Top-up badge, on Add money and on an Ask chip.
- "Add to my page" should name the action, for example "Add 3 receipts".

## Waiting for Mako's full run (not failures)
- Q1: Home has no "They add up" line.
- Q4: Home's first screen is text.
- Whether Check your bank should change the figure the plan starts from. The wording follows that decision: "so the two can differ" gives no reason, and the figure has four names ("Balance now", "Money today (bank plus cash)", "In your bank now", "the balance your plan starts Nov with").
- Counting a card in the month it is paid.
- How short-month fixes should work across months.
- One word for "short": today there is "short month", "Short by", "Plan exceeds pay" and "Tight month".
- The borrowed row's percent beside places past 100.

VERDICT: FAIL