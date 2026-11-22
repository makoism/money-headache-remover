(QC round 14 qc north star gate, on the build staged from c45f8d0. Copied from the reviewer's reply.)

FAIL

North-star QC, round 14. Build judged: /tmp/qc_build/build.html (served by the cloud_lib local server for job 5). Sizes: phone 412x915 (mobile, touch, dpr 2), desktop 1280x800 (dpr 2). Screenshots and scripts: /tmp/qc/north-star/

Report file: I tried to write /tmp/qc/north-star/REPORT.md, but the tool refused ("Subagents should return findings as text, not write report files"), so the report exists only in this reply. I did not try to get round that refusal.

verify.txt, last ten lines:
```
== screens do no money maths
screen maths: 0 open (amounts 0, percents 0), 4 allowed with a reason, 63 files read
PASS screens only show what the model worked out
within the limit (0 of 0). The limit only ever goes down; the goal is 0.

== golden screens against tests/qc/golden/3831zg.json
golden screens: 14 plans, 0 screens differ
PASS no screen changed

VERIFY OK
```

Notes on scope:
- I did not read wip/team/MAKO_RUN.md. My brief lists the only files I may read, and that file is not one of them, so none of the findings below were checked against it.
- I did not use the screen pack in /tmp/qc_build/screens. Every finding comes from my own browser runs.
- My first phone A browser was closed from outside partway through job 4. I started a fresh profile and repeated jobs 1 to 3 the same way, and the numbers came out the same.

Made-up data: Dollar, name Sam, take-home pay 3000, balance now 1200, rent 1000, food 400, emergency fund 3 months. Then Check your bank 4200, card "Blue card" 600 paid on the 28th, and one spend of 25 fixed to 52. On the job 5 phone the spend was logged as 52.

## Jobs

1. **Setup to a true Home: DONE.**
   - Home shows "In your bank now $1,200 / Balance you entered on 22 Nov", "Bills and basics $1,400 left to pay" and "Free to spend $365 left, not safe to spend yet".
   - What is safe to spend: nothing yet. Why: "Your bank is less than your bills still to pay and Free to spend".
   - The sheet "How is this worked out?" adds "It becomes safe to spend when your pay lands: then tap Check your bank on Home and type the new balance."
2. **Check your bank: DONE.** Home shows "$4,200 / Balance you entered on 22 Nov" and the toast "Bank updated: $4,200 today." See finding 1 about the $1,200 that stays next to it.
3. **A card paid in full: DONE.** Home shows "Blue card: $600 on it, paid on the 28th (entered 22 Nov)" and "What's on the cards is already spent. Bank after the cards are paid: $3,600".
4. **Log and fix a spend: DONE.**
   - I logged it from Home in about 2 seconds of tapping and typing. The toast read "Logged $25: Free to spend."
   - I fixed it in Receipts ("Changing: $25, Free to spend, 22 Nov.", then Save changes).
   - Receipts then shows one line, "$52 Free to spend 22 Nov 2026", and "$52 spent, 1 receipt. Free to spend: $365 planned, $52 spent, $313 safe to spend."
   - Free to spend on Home went from $340 to $313.
   - Delete asks for a second tap: "Tap again: delete $52, Free to spend, 22 Nov 2026".
5. **Move numbers to another phone: DONE.**
   - Phone A: Settings, Cloud copy, "Keep a copy in the cloud", "Next: get my code". The code shown was "MHR-5CTU-72VG-KEAY-7RUM-CF3A". Then "I saved it".
   - Phone B (a separate empty profile): on the welcome screen, "Used this before on another phone? Enter your recovery code". I typed the code and tapped "Find my copy".
   - It said "It was saved 22 Nov, 9:48 PM and has 1 receipt in it. This device has no numbers of its own yet, so nothing is replaced." Then Load.
   - The full Home text, the Receipts list and the full Plan text on B match A exactly. The only difference was the passing "Badge: First receipt." toast.

## Findings

1. **The month-end picture ignores the bank check, and one balance has two meanings**
   - Rules broken: "The picture must tie to reality: what the app shows adds up to what is really in the person's accounts, and it says how fresh that is." (NORTH_STAR.md) and "Nothing lies or breaks: ... no number that contradicts another number on the same screen" (QC_AGENT.md).
   - Where: Home, "Where your money sits at the end of Nov", at 412x915 and 1280x800.
   - What is wrong:
     - After Check your bank, the month-end picture does not move. With the bank at $4,200, Home still shows "Bank at month end $1,200" and "Bank $1,200 + burrows $1,235 = $2,435 at the end of Nov."
     - The only explanation is "Bank at month end is planned from $1,200, the balance your plan starts Nov with. Your bank now is $4,200, $3,600 after the cards are paid, so the two can differ."
     - I repeated this with $1,500 and got the same: "Bank at month end $1,200" and "Your bank now is $1,500, so the two can differ."
     - The $1,200 was typed in setup on 22 Nov under the label "Balance now" ("Balance is your bank accounts plus cash").
     - Settings calls the same figure "Balance at the plan's start (bank plus cash) ... Your bank and cash when the first month in the plan starts, before that month's pay."
     - Plan says "Bank at month end: $1,200 planned, the same as at the start of Nov."
     - So one figure has two names and two meanings. A person who has already been paid and types their real balance in setup has that pay counted twice in the plan, and nothing on the screen tells them. "so the two can differ" does not say which number to trust or what to do.
   - Suggested fix:
     - In setup, ask whether this month's pay has already landed, or label the field the way the app uses it ("Balance before this month's pay").
     - On Home, either plan the month end from the latest checked balance, or say in plain words why it differs (for example "Your pay of $3,000 has landed since") and offer one tap to update the plan's start.

2. **The "Split the rest" screen shows the same percent with different amounts**
   - Rules broken: "no number that contradicts another number on the same screen" (QC_AGENT.md) and "Every screen is obvious at a glance" (NORTH_STAR.md).
   - Where: setup, "Split the rest", 412x915.
   - What is wrong:
     - Three sliders all read "12%" but show different amounts: Goal burrows "12% / $365 a month", Free to spend "12% / $365 a month", Education "12% / $360 a month". 12% of $3,000 is $360.
     - The screen says "it starts at the usual shares". The open "Where your pay goes, in short" list gives the usual shares as "Goal burrows 10%", "Free to spend 10%", "Education 10%", "Investing 10%" and "Giving 5%". The sliders start at 12, 12, 12, 11 and 6.
     - Two nearly identical lines sit one after the other: "These shares are a starting point, change them to fit you" and "These shares are only a start. Drag a slider or tap a percent to change it...".
   - Suggested fix:
     - Show the percent to the precision that matches the amount, or round the amounts to the shown percent.
     - Say "the usual shares, scaled up because your bills take less than 55%" instead of "the usual shares".
     - Drop one of the two repeated lines.

3. **The Home status card says why, but not what to do**
   - Rule broken: "Where something is not obvious, does it explain itself on the spot, mindset first and then function?" (QC_AGENT.md, hand-holding).
   - Where: Home status card, 412x915, in the "Not safe to spend yet" state.
   - What is wrong:
     - The last setup screen promises "Home shows why and what to do."
     - The Home card says only why: "Your bills fit in your pay and burrows are planned for. $365 is left in Free to spend, not safe to spend yet: your bank is less than your bills still to pay and Free to spend."
     - The "what to do" ("It becomes safe to spend when your pay lands: then tap Check your bank on Home and type the new balance.") is only inside the "How is this worked out?" sheet.
     - Once the bank covers it, the whole card and its "How is this worked out?" link disappear. The only sign left is the small caption "safe to spend" under the chest.
   - Suggested fix: put the next step on the card itself. Keep a short "Safe to spend: $X" line on Home when it is safe, so the answer to "what is safe to spend" is always in the same place.

4. **Receipts is one long wall**
   - Rule broken: "One thing at a time, like Typeform: one question or one idea per screen, never a wall." (NORTH_STAR.md)
   - Where: Receipts tab, 412x915.
   - What is wrong:
     - One scroll of roughly 3,800 px holds, in this order:
       - "Scan receipts", with AI app instructions, six AI links and a reply box
       - the "Receipts" entry form
       - the month picker
       - the receipt table and list
       - "Repeating spending"
       - "Reminder", with six calendar choices and an event text box
     - The first thing a new person sees on Receipts is "Send your receipts to an AI app and paste its reply here", not their receipts.
   - Suggested fix: put the receipt list and the log form first. Fold Scan with AI, Repeating spending and Reminder into collapsed sections, each opened on its own.

5. **The card form gives no reason to add a card**
   - Rule broken: "Is it one thing at a time? Where something is not obvious, does it explain itself on the spot, mindset first and then function?" (QC_AGENT.md)
   - Where: Home, "Add a card you pay in full" form, 412x915.
   - What is wrong:
     - The form asks "Card name", "What's on the card now" and "Day of the month you pay it", with only "Open the card's app and type the full amount it shows, not only the minimum."
     - Nothing says why a card matters until after saving ("What's on the cards is already spent."). The point is that money on a card is already spent and leaves the bank on the day the card is paid.
     - Nothing says what to do with a card that is not paid in full.
   - Suggested fix: put one plain line of mindset above the fields, for example "Spending on a card is money already gone from your bank. Add it so the bank number stays true." Add a line on cards that carry a balance.

Also checked, with nothing wrong: no layout overflow, overlapping text or page errors at 412x915 or 1280x800. The only console messages were resources that failed to load on file://. On a file:// copy, the desktop Ask button opens a panel that explains itself ("This copy of the page can't reach Claude. That happens with a downloaded file.").

## Jobs
1. Setup to a true Home: DONE
2. Check your bank: DONE
3. A card paid in full: DONE
4. Log and fix a spend: DONE
5. Move numbers to another phone: DONE

VERDICT: FAIL
