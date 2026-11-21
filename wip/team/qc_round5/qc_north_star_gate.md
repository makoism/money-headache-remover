# North-star QC gate, round 5, gate 1

Result: FAIL

Build judged: /tmp/qc_build/build.html (Version 38.31 shown in the footer).
Report path: the caller asked for wip/team/qc_round5/qc_north_star_gate.md inside the repository. My brief does not let me write inside the repository, so the report is here: /tmp/qc/north-star/REPORT.md.

## verify.txt, last ten lines
```
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
It ends `VERIFY OK`, so I went on. But the same output says "FAIL the screens changed" and "20 screens differ". Someone on the build side should confirm that every one of those 20 changes was meant.

## Jobs (real browser, screens only, made-up numbers, empty storage)
1. Setup to a true Home: DONE, with finding 1. I entered $ Dollar, name Sam, pay 3000, balance 1200, rent 1100, food 400, and kept the default split and emergency fund. Home shows my numbers. Free to spend is "$330 ... left, not safe to spend yet" because "Your bank is less than your bills still to pay and Free to spend". The same screen also says "$330 is free to spend" (finding 1).
2. Check your bank: STUCK. Home shows "In your bank now $1,350 / Balance you entered on 21 Nov". The finish rule is "nothing on Home contradicts it", and that is not met. The box says "You are okay. Bills are covered and burrows are planned for. $330 is free to spend." But $1,350 does not cover $1,500 of bills plus $330, and the bank card above says so. Settings still shows "Money today (bank plus cash)" as 1200 (finding 4).
3. A card paid in full: DONE. I added "Visa", 250, day 28, and Home read "What's on the cards is already spent. Bank after the cards are paid: $1,100".
4. Log and fix a spend: DONE. I logged $45 Free to spend from Home in about 3 seconds. Receipts listed "$45 Free to spend 21 Nov 2026". I used Edit to change it to 54. Receipts then showed "$54 spent, 1 receipt" once, and Free to spend went from $285 to $276 on Receipts and on Home. Delete asks first ("Tap again: delete $54, ...").
5. Move numbers to another phone: DONE. I used cloud_lib with two separate profiles at 412x915. On A: Settings, "Keep a copy in the cloud", "Next: get my code", then read code "MHR-SKGZ-VSN6-8EWW-WUCA-VEHM" off the screen and tapped "I saved it". On B's welcome screen: "Used this before on another phone? Enter your recovery code", typed the code, tapped "Find my copy" ("It was saved 21 Nov, 4:10 AM and has 2 receipts in it. This device has no numbers of its own yet, so nothing is replaced."), then "Load". Home, Receipts, Plan (with More opened) and the Settings fields matched A word for word. The only differences were A's leftover toasts.

## Findings, worst first

### 1. Home says Free to spend is safe and not safe on the same screen (blocks job 2)
- Rule: "Nothing lies or breaks: ... no number that contradicts another number on the same screen." North star: "what is safe to spend".
- Where: Home, 412x915. Also seen at 360x740 and 1280x800 (as the "Over plan" variant).
- What: the card says "Free to spend $330 planned: left in Nov, not safe to spend yet" and "Your bank is less than your bills still to pay and Free to spend, so Free to spend is planned, not safe to spend yet." The box right under it (shown after "More: Free to spend, goals, cards, streak", and always shown when a line is over) says "You are okay. Bills are covered and burrows are planned for. $330 is free to spend." After an over-plan spend it says "Over plan ... $276 is free to spend." while the tile above still says "$276 ... not safe to spend yet". I saw this on four separate loads.
- Steps: empty storage. Setup with pay 3000, balance 1200, rent 1100, food 400, defaults for the rest. On Home tap "More: Free to spend, goals, cards, streak" and read the box under "Bank $1,200 + burrows $1,170 = $2,370".
- The one right answer: while the bank (after cards) is less than bills still to pay plus Free to spend, no part of Home may say "$X is free to spend" without "not safe to spend yet". The status box should give the same verdict as the bank card. For example: "Your pay covers your bills. $330 is planned for Free to spend, but it is not safe to spend yet: your bank after the cards, $1,100, is less than the $1,830 still to go out."

### 2. One small unplanned spend makes Home say bills are both "left" and "over"
- Rule: "no number that contradicts another number on the same screen"; Fresh eyes ("what each number means").
- Where: Home, 412x915, 360x740 and 1280x800.
- What: I logged $12.50 under Transport, a line I never planned. Home then shows the tile "Bills and basics $1,500 left to pay, $12.50 over", the card "Bills left $1,500 planned: still to pay in Nov", the box "Over plan. Bills went past the plan. Bills and basics are $12.50 over." and the toast "Logged. Bills and basics are over for this month." A person who has spent $12.50 of a $1,500 bills plan is told both that all $1,500 is still to pay and that bills are over.
- Steps: on Home, Log spend, Amount 12.50, Category Transport, tap Log spend.
- Suggested fix: say which line is over, in words: "Transport has no plan yet, $12.50 over. Add it to your bills on Plan?" Do not call all of Bills and basics "over" while $1,500 is shown as left. Whether "left to pay" should become $1,487.50 is a number-logic question for the number agent.

### 3. "Not safe to spend yet" with no "when" and no "what to do"
- Rule: Hand-holding: "would a person ... know what it means, why it matters to them and what to do next".
- Where: Home, 412x915, straight after setup.
- What: the first Home a new person sees says "Free to spend is planned, not safe to spend yet." Nothing says when it becomes safe (setup never asks for pay day) or what to do (wait for pay? check the bank after pay?). The job asks the person to be able to say what is safe to spend now. The screen implies $0 but never says so.
- Suggested fix: one line under it, such as "It becomes safe when your $3,000 pay arrives. After pay day, tap Check your bank." Ask for the pay day in setup if it is needed for this.

### 4. Two different "money today" figures, and the bank check does not reach the picture
- Rule: Job 2 ("one name per figure"); North star: "The picture must tie to reality".
- Where: Home and Settings, 412x915.
- What: after "Check your bank" with 1350, Home shows "In your bank now $1,350". Settings, "Balance: Money today (bank plus cash)" still shows 1200, and its help text says "Update it whenever you check your bank." The month-end picture stays "Bank at month end $1,200 ... planned from $1,200 ... Your bank now is $1,350, $1,100 after the cards are paid, so the two can differ." It also stayed at $1,200 when I typed 4,200. A stranger cannot tell which balance is true or why the picture ignores the one they just checked.
- Suggested fix: use one name and one figure for "money now". Either have Check your bank update the starting balance, or explain the gap in a sentence a person can act on ("Your plan started with $1,200 on 1 Nov; since then $150 more came in than planned").

### 5. The self-check sentence the brief names is not on Home
- Rule: QC_AGENT.md 38.31: "On Home, under 'Where your money sits', look for 'They add up: what you started with, plus your pay, less what is planned and spent, comes to the same total.'"
- Where: Home, 412x915, before and after receipts and with More open.
- What: neither that sentence nor "These numbers do not add up" appears. In its place is only "Bank $1,200 + burrows $1,170 = $2,370 at the end of Nov." (later "Bank $1,187.50 + burrows $1,170 = $2,357.50").
- Suggested fix: show the proof line the brief names, or update the brief if it was reworded on purpose.

### 6. Two toasts on top of each other
- Rule: "no overlap or cut-off text on phone and desktop".
- Where: Home, 412x915, right after logging an over-plan spend (screenshot /tmp/qc/north-star/t_bills_over.png).
- What: the toast "Logged $12.50: Transport. Undo" sits on top of a second green toast whose text ("Logged. Bills and basics are over for this month.") is hidden. The second toast also covers the text under "Bank at month end".
- Suggested fix: queue toasts or merge them into one.

### 7. The recovery code says it "cannot be looked up again" next to a "Show code" button
- Rule: Wording / "Nothing lies".
- Where: Settings, Cloud copy, 412x915.
- What: "It cannot be looked up again: if you lose it and lose this device ..." is shown directly under the buttons "Show code" and "Use it on another device". Tapping "Show code" shows the code again.
- Suggested fix: "If you lose this code and this device, nobody can open the cloud copy. On this device you can see it again with Show code."

### 8. Settings privacy text clashes with features on other screens
- Rule: Wording / Fresh eyes.
- Where: Settings, Saved data, 412x915.
- What: "reading a statement or a receipt photo sends that file to Claude", but Receipts says "Photos can't be read here. Use an AI app below." "Neither one moves to other devices" sits a few lines above the Cloud copy section, which exists to do exactly that.
- Suggested fix: keep the Saved data paragraph in step with Receipts and Cloud copy.

### 9. Placeholder cut off in setup
- Rule: "no overlap or cut-off text on phone".
- Where: Setup, "Your money", 412x915, Balance now field.
- What: the placeholder shows "Rough is fine. Overdrawn? Type a" and the rest is cut.
- Suggested fix: shorten it to "Rough is fine" and put the overdrawn hint in the help line under the field.

### 10. Same place, two colours
- Rule: Visual first ("a picture a kid could read").
- Where: Home "Where your money sits" bar and Plan top band (Emergency fund in teal), compared with the setup bar and the Plan "$3,000 pay, by place" list (Goal burrows / Emergency fund dot in pale grey), 412x915.
- Suggested fix: one colour per place on every screen.

### 11. Setup says "usual shares" but shows different numbers
- Rule: Fresh eyes / "no number that contradicts another number on the same screen".
- Where: Setup, "Split the rest", 412x915.
- What: the screen says "it starts at the usual shares", and its own "Where your pay goes, in short" lists "Goal burrows 10%", "Free to spend 10%". The sliders start at 11%, with Giving at 6%.
- Suggested fix: say "starts at the usual shares, scaled to fit what your bills leave", or show the scaled numbers in the short list.

Note: other sessions killed my test browsers twice while I worked. Data in the saved profile survived each restart, and no finding above depends on timing. Each one was seen on at least two separate loads.

Screenshots (deviceScaleFactor 2): /tmp/qc/north-star/j1_okay.png, /tmp/qc/north-star/t_bills_over.png, /tmp/qc/north-star/n360_home_p2.png, /tmp/qc/north-star/desk_home_p1.png, /tmp/qc/north-star/j3_03.png, /tmp/qc/north-star/j5_B_loaded.png

Jobs: 1 DONE, 2 STUCK, 3 DONE, 4 DONE, 5 DONE

VERDICT: FAIL
