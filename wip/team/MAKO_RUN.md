# Mako's run: every decision waiting for you

Written 22 Nov 2026 (JST) from the notes and the QC reports of rounds 4 to 7. This is the one list. Nothing here is built. The team keeps going on everything else.

How to read an entry: the question, the choices in a few words, the screens it touches, and where the reviewers raised it. "Round 7 north star" means the north-star reviewer in round 7 (its report is in `wip/team/qc_round7/qc_north_star_gate.md`). All amounts are made up.

When the same question came from several reviewers, it is one entry here and the rounds are listed.

## The five that matter most

1. **Check your bank vs the figure the plan starts from** (entry 1.1). This fails the north-star check every round, 4 to 7. Nothing else stops that check now.
2. **Pay day, and what "safe today" means** (entry 1.2). It is the other half of the same problem: "Not safe to spend yet" never says when it turns safe.
3. **A card counted in the month it is paid** (entry 1.3). On your own list since 20 Nov.
4. **What Home shows first** (entry 3.1): the picture above the fold, the "They add up" line, and the same figures shown three ways.
5. **Where the purple wisteria hangs** (entry 4.1). It is the one item that failed the art check in round 7.

---

## 1. Money questions (and your data)

### 1.1 Check your bank vs the plan's start figure (top 1)
- **Question.** When someone taps Check your bank and types what the bank shows, should the plan start from that figure?
- **Now.** Setup says $1,200. Check your bank says $2,600. Home shows "In your bank now $2,600" and also "Bank at month end ... planned from $1,200. Your bank now is $2,600, so the two can differ." Settings still says $1,200. "Bank" names two figures on one screen.
- **Choices.**
  - A. Check your bank moves the start figure, after one question: "Has your November pay come in yet?"
  - B. Keep the start figure, and say the gap in one sentence a person can act on: "Your plan for Nov started at $1,200. Your bank today is $2,600, so you have $1,400 more than planned."
  - C. Keep both, and rename the Settings field "Balance at the start of Nov".
- **Screens.** Home bank card and Bank at month end, the proof line, Settings Balance, Explain this tab.
- **Raised by.** Every reviewer in round 4; round 5 north star and novice; round 6 north star, money accuracy and novice; round 7 north star (the only reason it fails), money accuracy and novice; the earlier fix rounds (two bank figures, $2,500 in Settings vs $2,180 on Home).
- **Sources.** `qc_round7/qc_north_star_gate.md` 1, `qc_round6/qc_north_star_gate.md` 1, `qc_round5/qc_north_star_gate.md` 4, `qc_round4/*.md` (the "Waiting for Mako" part), `QC10_FIX_ROUND.md` (first table, and round 2 "Money today"), `DECISIONS.md` (20 Nov, experience calls).

### 1.2 Pay day, and what "safe to spend today" means (top 2)
- **Question.** Should setup ask for pay day, and should Home show one "safe today" amount?
- **Now.** Right after setup Home says "Not safe to spend yet" because the bank is less than the bills still to pay plus Free to spend. It never says when it turns safe or what to do. The "How is this worked out?" sheet says "Everything planned fits in your pay". Setup and Plan say "On plan" at the same moment. The month always runs from the 1st to the last day, so weekly figures are off for someone paid on the 10th.
- **Choices.**
  - A. Add a pay day to setup. The design notes have seven choices with defaults (`PAYDAY_DESIGN.md`, kept on its own side branch).
  - B. No pay day. Add one line: "It turns safe once your pay is in. Check your bank on pay day."
  - C. Show one figure, "Safe to spend today: $X", with the same reason on Home and in the sheet.
- **Screens.** Home status and Free to spend card, the Free to spend sheet, setup, Plan status.
- **Raised by.** Round 5 north star and novice; round 6 novice (the two main problems) and north star; round 7 north star and novice; the launch checklist (pay day).
- **Sources.** `qc_round7/qc_north_star_gate.md` 2, `qc_round7/novice.md` C2, `qc_round6/novice.md` B1 B2, `qc_round5/qc_north_star_gate.md` 3, `LAUNCH_CHECKLIST.md` section Q (pay day row), `RESUME.md` section 0 (21 Nov lists).

### 1.3 A card counted in the month it is paid (top 3)
- **Question.** Should a card bill count in the month-end plan of the month it is paid?
- **Now.** A $620 card lowers only "Bank after the cards are paid". Bank at month end stays as planned.
- **Choices.** A. Count it in that month's plan. B. Keep it as a separate line next to the plan, as now.
- **Screens.** Home bank card and Bank at month end, Plan month.
- **Raised by.** Every reviewer in round 4; the first fix round.
- **Sources.** `qc_round4/*.md` ("Waiting for Mako" part), `QC10_FIX_ROUND.md` first table, `DECISIONS.md` (20 Nov).

### 1.4 Short months: how the fixes work across months
- **Question.** When a month runs short, should the fix offered cover only that month or every short month?
- **Now.** One cost can leave 12 months short and one fix is offered for one month. "Lower a bill or another place" shows even when every place is $0. A month that borrows still shows the "On plan" tick.
- **Choices.** A. One fix per month, as now. B. One fix that covers every short month. C. Point to Plan and let the person choose.
- **Screens.** Home status, Plan month, Add a burrow.
- **Raised by.** Round 4 (all reviewers), fix round 3.
- **Sources.** `QC10_FIX_ROUND.md` round 3 table, `qc_round4/*.md`.

### 1.5 Adding a burrow when all pay already has a place
- **Question.** Should Add a burrow offer a button to take the money from somewhere?
- **Now.** It says "Lower another place, or pick a later date" with no button, then adds anyway. Home then says "Tight month" for months while the chest says Free to spend is safe.
- **Choices.** A. A button "Take $100 a month from Free to spend". B. Say "This takes $100 a month from your bank balance. Add anyway?" C. Leave it.
- **Screens.** Add a burrow, Home.
- **Raised by.** Round 5, 6 and 7 novice.
- **Sources.** `qc_round7/novice.md` C1, `qc_round6/novice.md` C3, `qc_round5/novice.md` C2.

### 1.6 The minimum balance setup never asks for
- **Question.** Should setup ask for a minimum balance, or should the app name the one it set?
- **Now.** Home says "under your minimum balance of $300". Setup never asked. The sheet lists a $300 minimum nobody typed.
- **Choices.** A. Ask in setup. B. Say "the $300 safety amount we set for you (change it in Settings)".
- **Screens.** Setup, Home status, the Free to spend sheet.
- **Sources.** `qc_round5/novice.md` C3, `qc_round7/novice.md` C2.

### 1.7 A plan that starts below zero
- **Question.** Should Home say in its own line that the bank starts the month below zero?
- **Now.** Free to spend is no longer called safe in that case (fixed). There is no line that says the start is below zero, apart from "planned from -$150".
- **Choices.** A. Add "Your bank starts Nov at -$150. Pay brings it back above zero by month end." B. Leave it to the status line.
- **Screens.** Home.
- **Sources.** `qc_round5/money_accuracy.md` C3, `qc_round5/regression.md` C2.

### 1.8 How far ahead Home looks
- **Question.** Should Home warn about a month below zero more than three months away?
- **Now.** Home checks the next three months and then names a later month below zero ("Later on: Jul 2027 ends below zero"). This may already answer it.
- **Choices.** A. Keep as now. B. "At this pace your bank goes below zero in Jul 2027."
- **Sources.** `qc_round5/money_accuracy.md` C5, `qc_round6/regression.md`.

### 1.9 Total and debt
- **Question.** Should Home's Total take off what you owe?
- **Now.** "Total $2,900" with "You owe $1,100" apart.
- **Choices.** A. Keep. B. "Total before debt $2,900" and "After debt $1,800".
- **Screens.** Home.
- **Sources.** `qc_round6/money_accuracy.md` 5, `qc_round7/money_accuracy.md` C1.

### 1.10 Setup split in whole percents, and the first goal
- **Question.** Should the setup sliders move in finer steps than 1%?
- **Now.** A slider shows 11% next to $325. Pay $4,040 gives $404, not $400. The short list says 10% while the sliders start at 11%. The first goal is always Emergency fund.
- **Choices.** A. Keep whole percents. B. Steps in money. C. Say "the usual shares, scaled to fit what your bills leave".
- **Screens.** Setup, Split the rest.
- **Sources.** `qc_round5/novice.md` C4, `qc_round5/qc_north_star_gate.md` 11, `LAUNCH_CHECKLIST.md` section Q (setup split row), `RESUME.md` section 0.

### 1.11 Goal amounts lose their cents
- **Question.** Your rule on whole amounts names plan boxes only. Should goal amounts keep cents?
- **Choices.** A. Round goal amounts too, as now. B. Keep cents.
- **Screens.** Plan Burrows, goal editor.
- **Sources.** `qc_round5/money_accuracy.md` polish 1, `RESUME.md` section 0 (21 Nov lists).

### 1.12 Pay of $0 next to real bills
- **Question.** With pay left at $0, should the app stop calling the numbers "Sample numbers"?
- **Now.** Someone who typed their own bills and receipts but no pay sees "Sample numbers" and "The sample numbers are made up".
- **Choices.** A. Drop the sample label once anything real is typed and only say pay is missing. B. Keep.
- **Sources.** `qc_round6/qc_numbers_gate.md` 6, `RESUME.md` section 0.

### 1.13 "1 year" is 13 payments
- **Question.** A goal "in 1 year" makes 13 payments while the More card says 12 months. Both counts are honest. Which should show?
- **Sources.** `RESUME.md` section 0 (21 Nov lists).

### 1.14 Six small number rules from round 5
- Equal amounts get different percents on one bar ($200 7% next to $200 6%). Choice: give equal amounts equal percents, or keep largest-remainder rounding.
- Home calls a figure "planned" that already takes off real overspending, while Plan calls another figure "planned". Choice: "expected", "with what you spent so far", or keep.
- The no-pay sentence leaves out $20 spent past the plan, so its sum does not add up as written. Choice: name the $20, or keep.
- Switching from euro to yen keeps cents (¥19.99). Choice: ask and round, or say the amounts were kept as typed.
- "Your plan doesn't need the borrow now" next to "Borrowed, pays for part of this plan". Choice: one sentence that says why.
- One list mixes "$7" and "$1.23". Choice: show cents on every row of a list that has any cents.
- **Sources.** `qc_round5/qc_numbers_gate.md` 3 to 8.

### 1.15 Running guided setup again over a saved plan
- **Question.** Guided setup over a saved plan resets the split. Keep the old split, or start fresh (with Undo, as now)?
- **Sources.** `RESUME.md` section 0 (21 Nov lists), data safety round 4.

### 1.16 Set all to zero vs Clear my plan
- **Question.** Two buttons side by side and nothing says the difference. Keep both with a line each, or keep one?
- **Screens.** Settings.
- **Sources.** `qc_round5/data_safety.md` C3, `qc_round6/wording.md` 9.

### 1.17 Goal amount vs long-term goal in setup
- **Question.** Setup says "$777 saved now, of $2,100" while Plan says "$777 of $3,900" for the same emergency fund. Name both, or show one?
- **Sources.** `qc_round5/data_safety.md` P3.

### 1.18 Cloud copy and backups: three flows
- **"Newer copy in the cloud" on Home** cannot say what the copy holds without loading it. Choice: keep the time and device only, or load it quietly first to say "3 more receipts".
- **Undo after a cloud load or restore.** The Undo bar now stays across tabs. Is that enough, or should Settings also have a lasting "Put back" button for the 3 days?
- **Restore after Choose file** shows the raw backup text and needs Load text twice. Choice: one "Load this file" button that says how old the backup is.
- **Sources.** `RESUME.md` section 0, `QC10_FIX_ROUND.md` rounds 2 and 3, `qc_round7/data_safety.md` C3, `qc_round5/data_safety.md` C2.

---

### 1.19 Start balance when no bank figure was typed
- **Now.** Once your own pay is typed, the sample start, minimum and cap stop counting. With no bank figure typed, the plan now starts from 0, not from the sample start.
- **Question.** Is 0 the right start, or should Home ask for the bank figure before showing the plan?
- **Choices.** A. Keep 0 and the bank question on Home, as now. B. Ask for the bank figure in setup before the plan shows.
- **Sources.** `qc_round8/money_accuracy.md` 2, commit 0d762a2.

### 1.20 A percent label that changes while its amount does not
- **Now.** On Plan > Month, a goal of 1,500 reads "1%", then "under 1%" after a large Free to spend receipt, then "1%" again. Each bar adds up; the label moves because the bar's total moves.
- **Choices.** A. Percent of pay, fixed for the month. B. Percent of what the bar shows, as now. (Linked to 1.14, equal amounts with different percents.)
- **Sources.** `qc_round8/qc_numbers_gate.md` should-fix 5.

### 1.21 Plan's verdict in a month covered by borrowing
- **Now.** Home says "Tight month" and the sheet lists pay and the borrow apart, but Plan's verdict still says "All pay is placed. $400 is borrowed from the emergency fund."
- **Question.** Should Plan's verdict also lead with the shortfall (bills more than pay), or is "all pay is placed" right for the Plan tab?
- **Sources.** `qc_round8/qc_north_star_gate.md` 1, commit 465a32b.

### 1.22 Sample numbers on: should Home's status name the places past the plan?
- **Now.** With sample numbers on, the message after logging names every place past the plan, but Home's status box only says the numbers are made up (by design: every verdict line is off in sample mode). Other's overspend is then named nowhere on Home.
- **Choices.** A. Keep the sample box as only the sample notice. B. Add the over list to it.
- **Sources.** `qc_round9/helper_sample_status.md`.

### 1.23 A bank that starts below zero, seen from setup, Home and Plan (QC round 10)
- **Now.** Setup with bank −5,000, pay 300,000, bills 130,000: setup says Free to spend ¥38,800 a month and Setup done says "On plan"; Home says ¥3,800, not safe to spend yet (the ¥35,000 gap is the ¥30,000 minimum from 1.6 plus the 5,000); Plan says "All of your pay has a place in Nov · Short". The red box and the Below zero card under it say the same thing twice. The month-end bar draws nothing for the bank below zero.
- **Suggested.** Home: "Your bank starts Nov ¥5,000 below zero, and you keep at least ¥30,000 in it (change this in Settings). To get there, spend only ¥3,800 of Free to spend this month." Setup done: "Your emergency fund is on plan. Your bank starts below zero, so wait for pay before you spend Free to spend." Plan: "Nov is short: your bank ends under your minimum." A red stub left of the bar for money below zero.
- **Also.** A first name of only digits ("250000") is accepted and greeted. Warn, or leave.
- **Sources.** `qc_round10/regression.md`.

### 1.24 New Undo words (QC round 10 data safety fixes)
- **Now.** Undo after a reload brings back only what the change changed and keeps everything done since. When something done since would have to go, the first tap asks: "Undo also removes what you did since: 1 receipt (¥4,000). Tap Undo again to go ahead." Each kept change keeps its own Undo until its own date; the bar adds "2 earlier changes can be undone after it." and Settings lists each with its own Undo. After a receipt edit: "Saved ¥5,000: Free to spend. Undo puts back ¥50,000."
- **Check on your run.** Are these words clear? Open notes: an in-visit Undo on Add money or the assistant still restores its fields as a whole (receipts stay); past 30 kept changes in 3 days the oldest is pushed out, and only line, burrow and card removals warn.
- **Sources.** `qc_round10/data_safety.md`, helper/r10-undo.

### 1.25 The balance box in Settings, and the cloud copy when it is behind (QC round 11)
- **Now.** Settings "Money today (bank plus cash)" says "Update it whenever you check your bank", but it is the plan's start figure. Typing today's balance there (after pay landed) counts pay twice: Total went from $2,435 to $5,435 and the Dec warning softened. Check your bank on Home is the right place (part of 1.1).
- **Suggested.** Rename it "Balance at the start of Nov, before pay" with a line saying not to type today's balance there, or show it read-only and point to Check your bank. The "Explain this tab" step "Your balance right now" to match.
- **Also (data safety, confusing).** While the cloud copy is behind, Home's top label still says "Saved in this browser" with a grey dot and the warning card is two screens down; Settings says "On. Last sent ..." next to "behind". Suggested: "Cloud copy behind since 8:40 AM" with an amber dot at the top; Settings "On, but behind". The welcome code box has no heading and no Back.
- **Also (novice).** Plan's only way back after a wrong amount is "Undo all"; a first-time user fears it wipes other edits. The currency step has ¥ chosen before anyone picks one.
- **Also (money accuracy).** Percents follow two rules: burrow fill is cut down (12.5% shows 12%), pay shares are rounded to add up to 100 (10.77% shows 11%). Pick one, or keep both and write it down.
- **Sources.** `qc_round11/qc_north_star_gate.md` B3, `qc_round11/data_safety.md`, `qc_round11/novice.md`, `qc_round11/money_accuracy.md`.

## 2. Words and glossary

Your earlier copy pass list still stands: `COPY_QC8_FOR_MAKO.md` has about 40 lines with a rewrite each. Say which ones you want. The questions below are the "one word per thing" choices on top of that.

### 2.1 One name for the bank figure
- **Now.** "In your bank now", "Money today (bank plus cash)", "Balance now", "the balance your plan starts Nov with". Settles with entry 1.1.
- **Choices.** "In your bank" everywhere, or "Bank today", or keep "Balance" in setup only.
- **Screens.** Home, Settings, setup.
- **Sources.** `qc_round5/wording.md` 5, `qc_round4/wording.md`, `COPY_QC8_FOR_MAKO.md`.

### 2.2 One word for "short"
- **Now.** "Short month", "Short by $600", "Plan exceeds pay", "Tight month", "Over pay by". On setup "short" means "spends more than pay"; on Plan it means "ends under the minimum".
- **Choices.** "Short" for one meaning and "Tight" for the other, or "Over pay by" and "Under your minimum".
- **Screens.** Setup done, Plan header, Home status.
- **Sources.** `QC10_FIX_ROUND.md` round 3, `qc_round4/*.md`, `qc_round5/money_accuracy.md` C4.

### 2.3 "Over plan" vs "past plan"
- **Now.** "Over plan", "spent over plan", "Spent past the plan", "Bills went past the plan", "Used for spending past plan".
- **Choices.** "Over plan" everywhere, or "past the plan" everywhere.
- **Screens.** Home, Plan month, Receipts.
- **Sources.** `qc_round7/wording.md` C3, `qc_round4/wording.md`, `RESUME.md` section 0.

### 2.4 "Saved" and "planned" each mean two figures
- **Saved.** Home "Saved $2,100" (burrows at month end) vs Burrows "Saved so far: $1,400". Choice: Home says "Burrows at month end".
- **Planned.** Home "Bank at month end $1,425 ... planned" vs Plan "$1,500 planned, less $75 spent over plan". Choice: Home says "if the rest of Nov goes to plan".
- **Sources.** `qc_round4/wording.md`, `RESUME.md` section 0.

### 2.5 Status words
- **Now.** For the same state: Plan "Not placed yet", Home "You are okay", Ask "Status On plan" with "Left over". Plan Details "Left". Home "Bills are covered" next to "not safe to spend yet".
- **Choices.** One status word per state, and "Your bills fit in your pay" instead of "Bills are covered".
- **Screens.** Home, Plan, Ask.
- **Sources.** `qc_round5/wording.md` 4, `qc_round6/wording.md` 1, `qc_round6/qc_north_star_gate.md` 2, `RESUME.md` section 0.

### 2.6 One word for "not placed yet"
- **Now.** "not placed yet", "not planned yet", "no place", Ask "Left over".
- **Choice.** "Not placed yet" everywhere, or another.
- **Sources.** `RESUME.md` section 0 (wording 4), `COPY_QC8_FOR_MAKO.md`.

### 2.7 One name for second pay
- **Now.** "Other pay", "Money in", "Second pay", "Side pay", "Pay in", "Pay and other money in", "Salary" next to "Monthly take-home pay".
- **Sources.** `qc_round5/wording.md` 6, `qc_round7/wording.md` polish.

### 2.8 Goal status "On track" vs "Filling"
- **Now.** Two goals at 6% with the same full month: one says "On track", one "Filling", no reason given.
- **Choices.** Say why, or use one word.
- **Screens.** Plan Burrows, Home.
- **Sources.** `qc_round5/wording.md` 10, `qc_round6/wording.md` 3, `COPY_QC8_FOR_MAKO.md`.

### 2.9 Settings Basics: "Your goals are in here" or "Your burrows are in here"
- **Why both.** Round 4 wording said Giving is a burrow too, so "goals" is right. Round 5 regression said the glossary word is burrows.
- **Sources.** `qc_round4/wording.md`, `qc_round5/regression.md` C1.

### 2.10 The month-end button names the goal
- **Now.** "Put it toward a goal" with a picker. Choice: name it, "Put it toward Trip".
- **Sources.** `qc_round5/wording.md` 8, `qc_round6/wording.md` 4.

### 2.11 "Cushion"
- **Now.** "Keep it as a cushion", "Building your cushion" (also when the bank ends below zero but the month adds to it). Never explained.
- **Choices.** "Keep it in the bank", or explain it once.
- **Sources.** `qc_round4/wording.md`, `RESUME.md` section 0 and section 5.

### 2.12 Small style choices
- Times and dates: "3:11 PM" vs "6:00 pm", "Nov 6" vs "21 Nov", "Jun 2027" vs "June 2027".
- App name: "the burrow" (welcome) vs "the Burrow" (cloud lines).
- The welcome line "Come back here when you're done or skip it, it's under Help too." (one long sentence; also ties to entry 3.4).
- "older copy ... takes this device back" on a phone that never had that copy.
- **Sources.** `qc_round7/wording.md` polish, `qc_round5/wording.md` 14 and 16, `QC10_FIX_ROUND.md` round 3.

---

## 3. Layout and look

### 3.1 What Home shows first (top 4)
- **Question.** What should the first screen of Home be?
- **Now.** At a normal phone size the first screen is the header, the tabs, "Your burrow" and the bank question. The pictures start at the bottom edge. Home shows "Bank $1,200 + burrows $1,170 = $2,370" but not the "They add up" line the checks were written for. The bar, the four boxes and that line show the same figures three ways.
- **Choices.**
  - Picture first, numbers under it.
  - Add the "They add up" line, or keep the single sum line (then the check briefs change).
  - Drop one of the three repeats (the four boxes or the sum line).
- **Screens.** Home.
- **Raised by.** Every reviewer in round 4; round 5 numbers and north star; round 6 wording and north star; round 7 money accuracy, wording and regression.
- **Sources.** `qc_round4/art_director.md` (waiting part), `qc_round5/qc_numbers_gate.md` 2, `qc_round7/wording.md`, `qc_round7/regression.md`, `LAUNCH_CHECKLIST.md` section Q, `DECISIONS.md` (20 Nov).

### 3.2 The bottom strip behind the "?" button
- **Question.** How tall should the dark strip at the bottom be, or should it be there at all?
- **Now.** 70px. At 320x568 to 360x640 the bank card's Save sits half under it on first view, so a tap on Save can land on the strip. It also cuts cards mid-line while scrolling. A helper made Home scroll a little by itself on first view; it was not used because the page moves on its own.
- **Choices.** A. Shorter (about 56px). B. A short fade. C. No strip, only bottom space. D. The auto scroll.
- **Screens.** Every tab, mostly Home at small phones.
- **Sources.** `qc_round5/layout_touch.md` 5, `qc_round6/layout_touch.md` 1, `qc_round7/layout_touch.md`, `qc_round7/qc_north_star_gate.md` 7, `RESUME.md` section 0.

### 3.3 Where messages show (the message band)
- **Question.** Where should "Card saved", "Logged" and other short messages sit?
- **Now.** They sit over page text: "Card saved" covers the burrow labels on Home, "Logged" covers "Add another card" at desktop size.
- **Choices.** A band of its own above the bottom strip, or in the header, or keep and shorten the time.
- **Sources.** `qc_round7/novice.md` P3, `qc_round7/qc_north_star_gate.md` 7, `RESUME.md` section 0.

### 3.4 Help inside setup and on the burrow screen
- **Question.** Should the "?" button show during setup and on an open burrow?
- **Now.** The words were fixed to say where the button is. The button itself is not there in setup or on the burrow scene.
- **Choices.** A. Show it there. B. Keep it off so the scene stays clean.
- **Sources.** `qc_round5/novice.md` B3, `qc_round6/novice.md` B3, `qc_round7/novice.md` B1.

### 3.5 The burrow tile for money with no goal
- **Question.** A burrow that holds money but has no goal amount now shows on Home as a small fixed coin pile with "(no goal yet)". Is that the look you want?
- **Sources.** `qc_round7/money_accuracy.md` blocker 1, `RESUME.md` section 0 (top entry).

### 3.6 A cloud mark in the header
- **Question.** Should the header show a small cloud (a tick when up to date, a clock when behind) instead of "Saved in this browser"?
- **Sources.** `qc_round4/data_safety.md`, `qc_round5/data_safety.md` P1, `qc_round6/data_safety.md` polish 2, `qc_round7/data_safety.md`.

### 3.7 The Help menu panel
- **Question.** The Help menu is 90% solid and page text shows through. Make it fully solid?
- **Sources.** `qc_round5/layout_touch.md` polish 1.

### 3.8 Narrow phones (320 wide)
- Plan "pay, by place": names wrap to 3 to 6 lines while the amount and % columns have room. Choice: give names the width, or put the grey line under the amount.
- Home's four boxes: captions run 4 to 6 lines. Choice: one column below about 360 wide.
- Plan at 320: top dock plus bottom strip take about a quarter of the screen. Choice: one-line dock, or let it scroll away.
- Desktop Plan: one narrow column with wide empty sides.
- **Sources.** `qc_round5/layout_touch.md` 1 and 2, `qc_round6/layout_touch.md` 2, 7 and 8, `qc_round7/layout_touch.md` polish 4.

### 3.9 The tour on small phones
- **Question.** The setup tour puts fields and text straight on the dimmed forest with no panel; labels show through behind Back. Add a solid panel?
- **Sources.** `qc_round5/layout_touch.md` 6, `qc_round6/layout_touch.md` 4, `qc_round7/layout_touch.md` polish 5.

### 3.10 Receipts opens on the scan block
- **Question.** Receipts opens on Scan receipts and a list of AI apps; the receipts list is fourth, about 2,600px down. Put Log spend and the list first?
- **Sources.** `qc_round6/novice.md` C4, `qc_round6/qc_north_star_gate.md` 5, `qc_round7/novice.md` P2, `qc_round7/qc_north_star_gate.md` 5, `LAUNCH_CHECKLIST.md` section Q.

### 3.11 Walls of text in Settings
- **Question.** Settings "Saved data" and "On your phone" and the recovery code paragraph are long. Shorten, or fold under a "More" line?
- **Sources.** `qc_round6/wording.md` polish, `qc_round7/qc_north_star_gate.md` 5.

### 3.12 Explain this tab order on Home
- **Question.** The status step comes after the four boxes because that is where the card sits. Keep the screen order, or explain the status first?
- **Sources.** `RESUME.md` section 0.

### 3.13 The borrowed row's percent on Plan
- **Question.** In a borrowed month, how should the borrowed row's percent sit next to places that already pass 100%?
- **Sources.** `QC10_FIX_ROUND.md` (first table and "after round 3"), `qc_round4/*.md`.

### 3.14 Picture ideas (visual first)
Each is "build it or not":
- Not safe to spend as a picture: bank coins vs a bills plus Free to spend pile, or a locked chest with "Wait for pay".
- The bank figure and the card line on Home as a coin pile.
- All months as a picture (a small pile or bar per month) instead of a 24-row table.
- Unplaced pay as loose coins on the pay bar.
- Debt with its own picture on Home.
- Receipts plan vs spend as bars that spill over.
- Plan Burrows with the mound above the bar.
- Education, Investing and Giving with a fill on Home.
- **Sources.** `qc_round7/novice.md` P1, `qc_round7/regression.md` polish 1, `qc_round6/novice.md` P2, `qc_round6/money_accuracy.md` 9, `qc_round6/qc_north_star_gate.md` 6, `qc_round5/wording.md`, `qc_round4/layout_touch.md` 3, `qc_round4/novice.md` P6, `qc_round4/art_director.md` 7, `qc_round6/art_director.md` 9.

---

## 4. Art

The art list waits for you as a whole. Nothing on it has been started (apart from putting back the vines and wisteria that went missing, which you had asked to keep). The newest full list is `qc_round7/art_director.md`; older detail is in the same file for rounds 4, 5 and 6.

### 4.1 Where the purple wisteria hangs (top 5)
- **Question.** The wisteria is back over the Burrows card on Home, but it hangs across the middle of the top edge with both ends in open space, its lowest flowers about 7px from "Burrows".
- **Choices.** A. Start it at a top corner, run it a short way along the top and down the side, flowers at least 24px from the heading. B. Leave it "as it is", as your note on the old Goals card said.
- **Same question, smaller.** The vine on "Your burrow" sits 10 to 12px from the text; the corner leaves on Home sit near the "Sample numbers" pill; the ivy vine belongs to a Home card that is always hidden now, so it shows nowhere.
- **Sources.** `qc_round7/art_director.md` 1 and 11, `qc_round7/layout_touch.md` polish 3, `ART_GUIDE.md` rule 00, `RESUME.md` section 0.

### 4.2 The rest of the art list, in short
- Setup done screen: a smooth drawn tree and house, not pixel art; thin line plants on two tour panels.
- Desktop forest: soft blurred glows around the lanterns; the colour check passes a sky it should not.
- Education, Investing, Giving and Bills use one brown frame each; they need their own mound on the ground.
- Goal mounds look alike, with loose pixels under each.
- Door coins do not match the money held.
- Checker shading over the hill and the frog on the burrow screen.
- Welcome at phone size shows almost no picture.
- The tour's "Months of bills to cover" as three number tiles, not a burrow filling deeper.
- Vines all one mint green; fern and bramble need work.
- Light mode: pictures in dark boxes on light cards, dark footer pills.
- Free to spend chest open on the tour, closed on Home.
- Older polish from rounds 4 and 5: mixed pixel sizes on the forest mound, mirrored fungus and tree trunks, flat grey Add money chips, the "from Mako" arrow pointing at nothing, the pink "over" mark that reads like a sparkle.
- And the 3D world (`WORLD_3D.md`), which waits for its design talk with you.
- **Sources.** `qc_round7/art_director.md`, `qc_round6/art_director.md`, `qc_round5/art_director.md`, `qc_round4/art_director.md`.

---

## 5. Server change that needs a deploy

### 5.1 The cloud copy refuses an out-of-date send
- **What.** The server part of the cloud copy now refuses a send that was based on an older copy than the one it holds, and the app then asks which copy to keep. This stops one phone quietly overwriting the other.
- **Why it waits.** It only works on the live site after a deploy, and nothing deploys without you.
- **Choice.** Deploy it together with the page when you say go (the team's advice), or leave the old server part for now.
- **Sources.** The file is `functions/api/vault/[id].js`. `LAUNCH_CHECKLIST.md` section Q (server change row), `RESUME.md` section 0 (21 Nov lists).
