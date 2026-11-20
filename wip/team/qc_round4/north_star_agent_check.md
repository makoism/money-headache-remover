QC round 4 on 38.31: north-star check (wip/team/QC_AGENT.md)

- **Role:** The task did not name one. A sibling had already taken money and numbers, so I took the north-star brief. This was not a blind run: I read wip/team/QC10_FIX_ROUND.md while looking for the brief.
- **Setup:** /tmp/qc_build/build.html, served from this machine with a pretend cloud server. Phones at 412x915 and 320x640, desktop at 1300x900, made-up numbers only.
- **Screenshots:** /tmp/qc/north-star-b/shots/
- **Report file:** I did not write REPORT.md because I am not allowed to write report files. This reply is the whole report.

## Jobs
1. Setup to a true Home: DONE (but see B1 and F1)
2. Check your bank: DONE
3. A card paid in full: DONE ("Bank after the cards are paid: $3,600")
4. Log and fix a spend: DONE. $54 changed to $45, shown once in Receipts, and Free to spend went from $271 to $280.
5. Move numbers to another phone: DONE. Home, Receipts and Plan read the same on both phones apart from toasts.

## BLOCKERS
**B1. Nothing lies. Setup, any size.**
- Yen is ticked by default, even in an en-US browser set to New York time.
- Steps: tap Next with yen, see ¥ on Your money, tap Back, pick Dollar, then finish (pay 3,000, balance 1,500, rent 1,200, food 400).
- What you see: setup ends "On plan" and "This is yours to spend". Home then says "Short", Free to spend $0, "under your safety minimum of $20,000", and that Dec, Jan and Feb also end under the minimum.
- Settings shows Minimum balance 20000. Picking Dollar before the first Next gives 300.
- Fix: set the default minimum again when the currency changes, unless the person typed one. Add a test for the Back path.

## FAILS
**F1. Hand-holding. Home right after setup (412 and 1300).**
- Setup ends with "This is yours to spend". Home then says "Your bank is less than your bills still to pay and Free to spend, so Free to spend is planned, not safe to spend yet."
- Nothing says what to do, or when it becomes safe. The plan counts this month's pay as still to come, but this check leaves it out.
- Fix: add the next step on the spot, like "When your Nov pay is in, tap Check your bank". Don't say "yours to spend" in setup when Home will say "not yet". This touches the start-figure question for Mako.

**F2. Nothing lies. Setup done screen, with Already saved left blank.**
- It says "$325 of $4,800 so far". Nothing is saved yet.
- Fix: "Nothing saved yet. Your plan adds $325 a month, starting in Nov."

## CONFUSING
- **C1.** The Free to spend popup offers "Per day $33" with no "not safe yet", while its tile says "not safe to spend yet".
- **C2.** Help, Explain this tab on Home is "1 of 1". It covers only Log spend and says "tap Log" (the button says "Log spend").
- **C3.** Two names for one thing: Home says "safety minimum", Plan and Settings say "minimum balance".
- **C4.** With no card added, the More card says "your bank after the cards is less than...".
- **C5.** The Emergency fund setup step asks the person to go back two steps and subtract the amount by hand. Offer to do it for them.
- **C6.** In a borrowed month the emergency fund still gets $325 while $1,000 is borrowed from it. Nothing says why.
- **C7.** Receipts opens with a long how-to for scanning with an AI app. The person's own receipts are several screens down.
- **C8.** Undo after loading a cloud copy (Settings, I have a code) disappears once you leave Settings. It comes back only the next time the app opens.

## POLISH
- **P1.** The Log spend card has an empty gap of about 60 px between "Add a date or a note" and "Scan receipt".
- **P2.** The setup split shows "11%" next to "$325 a month" (11% of $3,000 is $330).

## Waiting for Mako's full run (not counted as failures)
- **Q1:** Home has no "They add up" line. It does not say "do not add up" either.
- **Q4:** Home's first screen is text. The pictures start below the fold.
- **Check your bank vs the figure the plan starts from:** after I typed $4,200, Home still plans from $1,500 and says "the two can differ". In a borrowed month Home says both "Your balance covers it" and "Your bank is less than your bills...".
- **Counting a card in the month it is paid:** the $600 card lowers "Bank after the cards" only.
- **Short-month fixes across months:** one fix was offered (Borrow $1,000), for Nov only.
- **One word for short:** "Short by $1,500" sits next to "$1,000 under your $300 minimum".
- **Borrowed row's percent beside places past 100:** I could not check it. My borrowed month showed no percents on Plan.

## Checked and found nothing wrong
- No em dashes or banned words on any screen.
- Nothing runs off the screen at 320, 412 or 1300.
- No page errors.
- The pay-day coin animation works.
- The Borrowed row and the sentence explaining it are there.
- Loading a cloud copy warns before it replaces anything.

VERDICT: FAIL