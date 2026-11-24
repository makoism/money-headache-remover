# app3: for Mako

## Cloud copy: the five server changes went live on 24 Nov
You approved all five and they went live on 24 Nov, so the cloud copy can be on more than one device now. Nothing changes for the old app.
1. **Refuse a write that names no base when a copy already exists.** Today a second device could overwrite the first device's copy. Recommended: yes, this is the important one.
2. **Refuse a copy in an unknown format or a newer shape.** It stops an older or broken page writing something the app can't read. Recommended: yes.
3. **Keep dated earlier versions**, not only the last one, so a bad copy can be undone. Recommended: yes, the last 10.
4. **Leave a "deleted" marker when you delete the cloud copy**, so another device doesn't send it back up. Recommended: yes.
5. **Raise the daily write limit**, which is 400 today. One send every 90 seconds fits normal use, but a tab left open all day could pass it. Recommended: raise it to 1,500.

## Starting with your real numbers (one page)

**Before you start**
- Open the private link in Chrome itself, not inside another app, and while online. After the first open it also works offline.
- Pick a quiet moment just after a pay day if you can. The fewer bills between your last pay and today, the fewer questions.
- Have your bank app open. Your card apps help too.

**Setup (about 5 minutes)**
Each part has its own **Save**. Press it as you go: "Saved" shows beside it, with Undo in the band at the top. You can stop half way and come back; what you saved is still there. **See my money** at the end puts it together. If you come back on a later day, your bank, cards and bills ask to be checked again, because their figures are of the day you typed them.
1. **What does your bank show today?** Type the number your bank app shows right now. Don't adjust it.
2. **Pay:** the 10th, and the amount that lands in your bank (after tax: the take-home figure on your payslip), and the second income on the same day. Choose what happens when the 10th is a weekend or holiday (the working day before, for most Japanese salaries).
3. **Cards:** for each card, what is on it now, the payment day (10th and 11th), and the close day. Leave the close day as "not sure" if you don't know it. The app then counts everything on the card as due on the next payment day, which is the safe side.
4. **Bills:** each with its amount and due day. For any bill due since your last pay, it asks "Has it gone out of your bank yet?". Look at your bank app before you answer.
5. **Keep at least:** leave it blank for none, or type the lowest your bank should ever go.

**After setup**
- Home shows safe to spend until your next pay, with the sum behind it. If a number looks wrong, the sum shows where it came from.
- Log a spend in Receipts. Only the amount is needed.
- **Check your bank** whenever you like, and at least after each pay day. Untick anything that hasn't gone through yet, then type what the bank shows. Something you untick stays on the list until it lands.
- In Settings, **save a backup file** after setup and after each check-in for the first weeks. The cloud copy can be on your phone and your computer together.
- Statements: Add statements on Home. Answer every question it asks before Add.

**If something looks wrong:** take a screenshot and send it. Don't fix numbers by hand. The walk tests mean a wrong figure is a bug we want to see.

---

## Bank comparison
The old comparison (STEP8_COMPARE.md) checked what changes for someone moving their 38.28 data to a new build. You have no data in the old app (BE), so nothing moves and there is nothing to compare. In its place, the real-page walk (app3/tests/e3_walk.js, in every check) compares the new app's bank and safe-to-spend figures with hand-worked figures for your shape, every step from setup on 24 Nov to 15 Feb (71 checks; walk 4 report in app3/walk/README.md). All match.

---

## For Mako's run (23 Nov night JST)

Every item already has a working default. None of them block using the app.

## Server changes needed (cloud copy; nothing has been changed or deployed)
1. A write that names no base is refused when a copy already exists. Today another device's copy can be overwritten.
2. Refuse a copy whose format is not gz1, or whose shape is newer (E3).
3. Keep dated versions, not only the one copy before.
4. Leave a "deleted" marker when the cloud copy is deleted, so another device does not send it back up.
5. Watch the 400 writes a day limit (one send every 90 s).

## The private publish (BG; app3/publish3.sh, tested by tests/e3_publish.js; nothing changed in the old app or the worker)
The worker needs no change: it answers only /api/*, and the path is a plain folder of public/. These are the old app's
limits, with what would remove each one. app3 works without any of them.
1. Before app3's own worker has installed (the very first open), the old worker (scope /) passes the path through to the
   network. If that first open is offline, it would show the old page. Fix: in public/sw.js, `if (u.pathname.startsWith('/n/')) return;` in fetch.
2. When the old worker changes, its activate step removes every cache but its own, including app3's kept copy. app3
   keeps a new copy on its next open with a connection. Fix: in public/sw.js activate, only remove caches named money-headache-*.
3. If the old app was installed to the home screen, its manifest scope is the whole site, so opening the path from inside
   that window stays in the old app's window. Opening the link in the browser is fine.
4. build_site.sh empties public/ before building, which would remove the app3 folder. Run app3/publish3.sh after it, or
   keep public/n/ in build_site.sh.

## Feel and wording
- Tab bar at the top. It covered form fields on a phone when it was at the bottom.
- Undo: the bar shows for 8 s. Should Undo still be offered after a reload? The old app kept it for 3 days.
- Receipts: a day after today is refused. A refund given back to no line comes back to the account only.
- "Add statements" sits under Home. Should it have its own tab?
- A card statement's printed close day becomes the card's close day.
- A big check-in gap in a past period shows as Free to spend overspent. Should it have its own line?
- Goal pace reads "about ¥16,250 each pay to reach it by 1 Aug 2027".
- Overdue reads "¥25,000 due 27 Nov has not been seen. Tick it at Check your bank when it has gone".
- Cloud code look (XXXX-XXXX-XXXX-XXXX-XXXX in groups of four; the MHR- prefix is gone from the screen, and a code typed with it still works), the turn-off words, 90 s between sends, a new build loading by itself when the page goes to the background.
- With the cloud copy on, restoring a backup does not remove records added on another device since.
- Names left open in screens/names.js: Bank today or In your bank; This pay period or Until next pay; and the others listed there.
- Privacy words for statements and Ask.

## Draft words from the screen fixes (for your copy pass)
- Setup (24 Nov, your first run): pay reads "How much lands in your bank each pay day, after tax?" with "Your payslip's take-home figure, not the amount before tax". Everyday spending reads "About how much do you spend each pay period on food, transport and small things?" with "Money you spend without planning each item. For example groceries, lunches, coffee, train fares and small shopping. Not your bills or card payments: those come below". Each part's button reads "Save", the last one "See my money". For your run: is "Save" under each part clear, or should it name the part ("Save your pay")?
- First screen: "I already use the burrow on another device" opens Settings with the line "Type the cloud code from your other device, or restore a backup file you saved there".
- Receipts: the card over Free to spend left and Safe to spend was headed "Left to spend now", a third name for those figures. It now reads "Where you stand". The rows keep the names from screens/names.js.
- Receipts, under the list: "Tap a spend to change it" (refunds and money moved open the same way).
- Setup, under Keep at least: "Safe to spend leaves this much in your bank as a cushion".
- Setup, under a card's "Day its statement closes": "Spends after this day go on the next payment".

## Ask and Reminders
- Bill reminders carry no amount, because calendars often sync to Google or Apple. Should they show it?
- Ask and Reminders are header links beside Settings. At 320 wide, "the burrow" wraps onto two lines.
- Reminder choices are not kept between visits. Should they be?
- Defaults: the day after pay plus the middle of the period, 2 days before each bill, 09:00.
- Ask can log a spend, change a line, change Free to spend, and set money aside. Should it also add bills or goals?

## Help words (the "?" marks; drafts for your copy pass, all in screens/help.js)
One help piece serves every "?", so changing a line there changes it everywhere. The short video of you comes later; these are the written words.
- Safe to spend: "What you can spend before your next pay and still cover everything due before it. Bills and card payments due by then are already taken off."
- The status line (Fine for now and the others): "How things stand today, in one line. It changes when you check your bank or log a spend."
- This pay period: "Your money runs from one pay to the next, not by calendar month."
- This pay period, when the pay day falls on a weekend or holiday: "Your pay is due on 10 Jan, but that day is a weekend or a holiday, so it lands on 12 Jan. The pay period moves with it."
- A line added partway through a period (Plan, "Why only part?"): "This line started partway through the pay period, so only the part for the days left counts now. The full amount counts from your next pay."
- Also for your pass: the bank after the cards line reads "After your cards are paid on 10 and 11 Dec: Main bank ¥364,400. Your pay on 10 Dec is in it. If everything on the cards now is taken. This is the bank, not safe to spend".

## Notes from the last gate pair (24 Nov early JST): listed, not built (BN)
- Right after setup, safe to spend is only today's share of the everyday money for the days left in the period. Home doesn't say why; only Plan does. Should Home say it, or should the first period count in full?
- "Safe to spend" is capped at Free to spend left once that is set. Before it is set, it is everything after bills. The help "?" explains this, but the same name covers both.
- The sum line "− ¥297,576 (more than Free to spend left this period)" is hard to read for a newcomer.
- The card box line "If everything on the cards now is taken." reads as half a sentence, and it doesn't name the bills taken off.
- Gaps found at Check your bank count as spending but aren't listed in Receipts ("spent ¥6,700" above "Nothing logged"). Should each gap be a row?
- The gap toast sometimes leaves out "It counts as spending".
- Logging on a card can raise safe to spend (the card is paid on pay day, from the next pay). True, but surprising.
- Using a cloud code on a second device replaces what is there without asking first. Fine on an empty device. Should it ask?
- A goal with a date says "next due 30 Jun". "By 30 Jun" may read better.
- When plan lines alone need more than the bank can spare, there is no warning, only "nothing safe to spend".
- The month-end "keep it or put it toward a goal" question from the old app doesn't exist in app3. Wanted?

## Slice 6, the other lives (lane/slice6, 24 Nov JST): listed, not built
- Setup now asks how often pay lands (a day, two days a month, every 1, 2 or 4 weeks, or no fixed pay), the country, and more accounts (a second bank, cash, an e-wallet). The words are drafts for your copy pass.
- A line added in the pay period that holds the setup day counts its share from the setup day, not the day it was added (rule I4): Sam's Groceries added a day after setup counted 11 days, not 10. Decided by the coordinator: I4 stays.
- The nudge for a yearly cost ("Set aside about $80 each pay to have $480 ready by 1 Mar") goes away once a goal of the same name exists. A goal is not linked to its bill (that would be a saved-data change).
- With no fixed pay, Home shows "Lasts about N weeks at this rate" even with no budget lines; then it counts bills only.
- A second bank with bills and no pay into it goes below zero in the look ahead (Lia's Bank B). Home warns; it does not suggest moving money from the other bank. Should it?
- Changing how often pay lands proposes each per-pay line as the same money a year ($400 every 2 weeks is $866.67 a month); the person can change it.
- (slice 6b) Pay can now change to and from two days a month and no fixed pay. Changed to no fixed pay, the period running ends the day before the change and the plan runs by the day from then; Plan lists the pay periods before it again once a pay day is back. Changed from no fixed pay, the new pay day starts with its first pay; until that pay is ticked the plan still runs by the day.
- (slice 6b, BQ3) With no fixed pay, "Free to spend left" starts again each calendar month: the month's amount less what was spent on it that month. In the month of setup, or of the change to no fixed pay, it counts from that day, its share by days left.
- (slice 6b) A second income can land every 1, 2, 3 or 4 weeks or on two days a month; setup and the pay form offer every 3 weeks.
- Pay day in two steps reads "Today: ¥286,000 (Main bank today) + ¥180,000 (Main job 10 Dec) ... = ¥472,000 at the end of the day. Safe to spend counts on this pay coming in today".

## Open: a restore while the cloud copy is on (24 Nov)
An earlier version or a backup restored while the cloud copy is on goes through the three-way join with the newer cloud copy. Its records carry older change times, so the newer copy may win and the restore may not stick. Proposed rule: a restore restamps the records it brings back (new `at`), so it wins the join. It is one step with Undo. To be built and tested on a lane.
