# QC round 4, 38.31: qc-north-star (final gate 1 of 2)

Build: /tmp/qc_build/build.html. Last ten lines of /tmp/qc_build/verify.txt:

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

## Notes for the caller
- **The role briefs probably did not load.** The task did not name my role, so I found it in the workflow journal (label `qc-north-star`). Every agent in this workflow runs as the built-in `workflow-subagent` type (its meta.json says so), so the `.claude/agents/qc-*.md` briefs were not loaded. The other roles may also be working without their briefs.
- **I did not judge with fully fresh eyes.** Before I found my brief I read files it forbids: QC_ROLES.md, CLAUDE.md, QC10_FIX_ROUND.md, a grep of COORDINATOR.md, and the workflow script. I reproduced every finding below in the build myself.
- **No report file.** Writing /tmp/qc/north-star/REPORT.md was refused ("Subagents should return findings as text"). This reply is the report.
- **No page errors.** There were 0 page errors in every session: phones A to D, at 320, 390, 412 and 1300 wide.

## Jobs (real browser, screens only, made-up numbers)
1. **Setup to a true Home: DONE.** I typed pay $3,200, bank $1,500, rent $1,100 and food $400.
   - At first nothing was safe to spend: "Your bank is less than your bills still to pay and Free to spend".
   - After Check your bank, $385 was safe to spend.
2. **Check your bank: DONE.** Home shows "In your bank now $4,600 / Balance you entered on 20 Nov". Whether this should change the figure the plan starts from is waiting for Mako.
3. **Card paid in full: DONE.** Home shows "Bank after the cards are paid: $3,980".
4. **Log and fix a spend: DONE.** Logging took about 3 s. After the Edit, Receipts shows "$45" once, and Free to spend went from $385 to $340.
5. **Move numbers to another phone: DONE.** The Home, Receipts and Plan text on phone B matched phone A. The only difference was one section that was open on A.

## Findings that fail the gate
1. **Rule: nothing lies / "no number that contradicts another number on the same screen".**
   - Where: on Plan > Month I tapped Next month to Dec, then opened Receipts (412x915, 20 Nov).
   - What it says: "Receipts, December 2026 / No receipts this month." and "Last month, Nov 2026 ... Nothing went over its plan. $385 went to goals."
   - What is wrong: November is the current month, and no money has gone to goals.
   - Fix: open Receipts on today's month, or name the picked month ("Dec 2026: no receipts yet"). Show the review card only for months that have ended.
2. **Rule: "no overlap or cut-off text on phone".**
   - At 390 and 412, the Receipts "Last month" table shows only the category names. "Planned" and "Spent" sit at x 326 to 638 inside a 336 px box that scrolls sideways, and nothing shows that it scrolls.
   - At 320x640, Plan > All months cuts figures in half: "−$5" for −$515 and "$1,5" for $1,500. The Status column is off screen.
   - Fix: on phones, put each figure under its name.
3. **Rule: north star, "nothing is unknown".**
   - Where: I added a $2,400 one-time cost in Dec.
   - All months shows "Dec 2026 ... −$515 Short", and the bank stays below zero through Dec 2027.
   - Home shows "Free to spend $340 safe to spend" and nothing about Dec, even after a reload.
   - The overdrawn plan on phone C does get "Coming up: Dec ends below zero, Jan ends below zero...".
   - Fix: show the Coming up line whenever any later month ends below zero or under the minimum.
4. **Rule: no contradicting numbers.**
   - Where: Home at 412, with the bank typed as $1,000 and a $620 card.
   - The tile says "Free to spend $340 left, not safe to spend yet". Tapping it opens "Per week for the 11 days left $216 / Per day $31" with no warning.
   - Also, setup ends with "yours to spend on whatever you want", then the first Home says "not safe to spend yet" and gives no next step.
   - Fix: repeat "not safe yet" in the panel, and say what makes it safe ("when your pay lands, tap Check your bank").
5. **Rule: "Safe with data".**
   - Where: after job 5, phone B still held the 5:44 PM cloud copy.
   - B changed its bank and showed "On. Last sent 20 Nov, 5:57 PM." without asking, although A had already sent later changes (the Dec cost, a borrow, receipts).
   - A's next change at 5:58 PM was sent over B's, also without asking. "Newer copy in the cloud" appeared only after B was reopened.
   - Settings promises: "If both changed the app asks which to keep".
   - Fix: before sending, check that the cloud copy is the one this device last loaded or sent; if not, stop and ask. The data-safety role should confirm this with revision numbers.
6. **Rule: nothing lies (fresh eyes).**
   - Where: I left "Already saved" blank in setup.
   - Setup done then says "$385 of $4,500 so far", and Plan > Burrows says "Saved so far: $385." on 20 Nov.
   - Fix: say "$0 saved now, $385 by the end of Nov".

## Confusing
- **Short month on Plan (Dec):** a big "$0 Free to spend" sits above "Planned $385 in Dec" and no reason is given. Help > Explain this tab then says "The big number is this month's Free to spend and it's yours to spend on whatever you want".
- **Overdrawn Home at 390x844 (phone C):** the first screen shows a red "−¥30,000" and "¥0 safe to spend" with no explanation. The "Below zero ... Open Plan to see the month." note is about 1,000 px lower. Move it under the balance.
- **Saving and borrowing in the same month:** Plan > Burrows says "Plan adds $385 in Dec. $385 borrowed in Dec." Nothing explains why. "Pick a fix:" offers one button, and the month is still at −$515 after tapping it.
- **Setup, emergency fund step:** it says "tap Back to the Your money step and lower that balance by this amount", which leaves the subtraction to a beginner. Ask yes or no and do the maths.

## Polish
- On Plan for Dec: "This month you spend $385 more than your pay". The row "Still over after borrowing $1,180" appears in a month whose status says it is covered.
- Receipts: "The balance went up $0, from $1,500 to $1,500."
- Plan > Burrows: "Cards and loans ... Nothing here yet", while Home lists "Blue card: $620 on it".
- Setup at 412: the placeholder "Rough is fine. Overdrawn? Type a minus" is cut off.
- Home shows the pay ($3,200) only inside the Pay day animation.

## Waiting for Mako's full run (not failures)
- **Q1:** Home has no "They add up" line. It does show "Bank $1,500 + burrows $1,315 = $2,815". "These numbers do not add up" never appeared.
- **Q4:** Home's first screen is text.
- **Check your bank and the start figure:** Home shows "In your bank now $4,600" next to "planned from $1,500 ... so the two can differ". Settings shows "Money today (bank plus cash)" as $1,500 with the words "What you have right now".
- **Counting a card in the month it is paid:** the $620 card is not in the month-end plan.
- **Short-month fixes across months:** one cost leaves 12 months "Short". "Lower a bill or another place" shows even when every place is ¥0.
- **One word for "short":** "Short by / Plan exceeds pay $1,300" sits next to "$120 under your $320 minimum".
- **Borrowed row percent:** percents are hidden in short months, so I could not see it.

My scripts and screenshots are in /tmp/qc/north-star/ and /tmp/qc/north-star/shots/ (outside the repo). Key shots:
- /tmp/qc/north-star/shots/a49-lastmonth.png
- /tmp/qc/north-star/shots/m320-all.png
- /tmp/qc/north-star/shots/b11-popup.png
- /tmp/qc/north-star/shots/a11.png
- /tmp/qc/north-star/shots/a36-burrows.png
- /tmp/qc/north-star/shots/a42-explain.png
- /tmp/qc/north-star/shots/c10-home.png
- /tmp/qc/north-star/shots/b13-reopen.png

VERDICT: FAIL