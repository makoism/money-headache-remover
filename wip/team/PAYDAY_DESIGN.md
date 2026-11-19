# Pay day: design (side lane, no code)

Launch checklist Q6. Branch side/payday-design, started from wip-38.31.
This is a design on paper. Nothing here is built. All names and numbers below are made up.

## 0. In one breath
Today the app's month always runs from the 1st to the last day. Most people's money month runs from one pay to the next.
Recommended: ask one question in setup, "What day does your pay land?", answered by tapping a day on a small calendar.
Save it as a list of days, so two pay days and "no fixed day" fit later without moving anyone's data.
If nobody answers, the app works exactly as it does today.

## 1. How it works today (where in the code)
All in `wip/team/` on wip-38.31.

- `model.js`, top line: `START = '2026-11'`, `END = '2028-10'`, and `PAYDAY = 15`. That 15 is fixed in the code. Nobody can change it. It is used in one place only: `readyBy()` (model.js:152), which decides if a goal due on a given day must be full by that month or the month before.
- `model.js`, `receiptsFor()` and `receiptStats()` (about line 538): a receipt belongs to a month by its calendar month, `r.d.slice(0, 7)`. The same rule is in `calcAll()` around line 762.
- `model.js`, `viewOf(S, C, ym, today)` (about line 608): `dim` is the days in the calendar month, `dayN` is today's date number, `daysLeft = dim - dayN + 1`. From those:
  - `play.perWeek` = Free to spend left, spread over the days left, shown only when 4 or more days are left.
  - `cells.perWeek` and `cells.perDay` = the safe Free to spend a week and a day for the days left.
  - `play.dayFrac` and `pace` decide if spending is "ahead" of the month.
- `ui0.js`, `weekOf()` (line 55): the one weekly figure used across the app is the month's plan divided by (days in the calendar month / 7).
- `ui0.js`, `todayStr()`: today, kept inside START to END.
- `ui6.js` (about line 380) shows "X a week to stay inside it for the N days left" and "About X a day" on Home. `ui7.js` (about line 304) shows the same in the month details. `ui4a.js` line 58 feeds the same to the assistant.
- `ui7.js`, `openPay()` and `PAYF`: the "Work out your monthly pay" window asks how often you are paid (once, twice a month, every two weeks, every week) and turns it into one monthly number. It never asks which day.
- `model.js`, `cleanCards()`: each card already has its own `payDay` (1 to 31). So the app knows when a card is paid, but not when pay lands.
- `model.js`, `cleanCfg()` and `CFG_KNOWN` (about line 911): settings the page does not know are kept untouched. This matters for old builds reading new backups (see 3A).

So: there is no pay day field anywhere a person can reach. The month, days left and every weekly figure follow the calendar.

## 2. What is wrong today (made-up examples)

**Ana, paid on the 10th.** Pay lands on 10 March. On 28 March the app says "4 days left, about X a week". But Ana's money has to last until 10 April, 13 days away. The weekly figure is about three times too big. She spends it, and is short in early April. Then on 1 April the app starts a fresh month and shows the whole Free to spend again, though no pay has come in yet. A receipt from 5 April counts against April's money, which really belongs to the pay of 10 March.

**Ben, paid on the 15th and the 30th.** On the 29th the app says "3 days left" and hides the weekly figure. Ben really has one day until the next pay and a full half month after it. On the 2nd the app says a whole month lies ahead, but half his pay for that month has not landed yet. He cannot see which bills belong to which half.

**Cris, paid per project, no fixed day.** A project pays on the 22nd. The app counts 9 days left and spreads the money over those 9 days, as if more comes on the 1st. Nothing may come for six weeks. The weekly figure tells Cris to spend money that has to last much longer.

The north star says a person sees "what is safe to spend" and feels safe "because nothing is unknown". A weekly figure on the wrong window is the opposite: a confident number that is wrong.

## 3. Options, smallest to fullest

### 3A. One pay day number (smallest)

**Setup (one screen, one question).** "What day does your pay land?" A small month grid, tap the day. Under it, two plain buttons: "Twice a month" and "It changes, or I'm paid per job". Today's pay amount screen stays as it is.
- Tap a day: saved. Next screen.
- "Twice a month" or "It changes": saved as that answer, the month follows the calendar for now, and a short line says so ("For now your month runs 1st to last. You can change this later in Settings.").
- Skip: the month follows the calendar, exactly like today.

**Home.** The Free to spend card shows a strip of the days from this pay to the next, with today marked and the pay day as a small coin at the right end. The days already gone are filled in. Under it: "13 days to pay day. About X a week." The number sits under the picture.

**Settings.** One row: "Pay day: the 10th". Tap to change it on the same calendar.

**The numbers.**
- A pay month starts on the pay day and ends the day before the next one. It is named by the month it starts in: pay on 10 March starts "March".
- A receipt dated 1 to 9 April counts in March. One small function decides this for every place that today uses `r.d.slice(0, 7)`.
- `dim` becomes the length of the pay month (28 to 31 days), `dayN` the day number inside it, `daysLeft` the days until the next pay day. `perWeek`, `perDay`, `pace`, `dayFrac` and `weekOf()` all follow, with no other change to their sums.
- Pay day 29, 30 or 31 in a shorter month: the pay lands on that month's last day.
- `readyBy()` uses the person's pay day instead of the fixed 15.
- The plan amounts per month do not change. "March's plan" now means "the money from the pay on 10 March".

**Code it touches.** `model.js`: a new `payMonthOf(date, S)` and `payWindow(ym, S)`, used in `receiptsFor`, `receiptStats`, `calcAll` (the receipt loop) and `viewOf`; `readyBy`; `cleanCfg` and `CFG_KNOWN` for the new setting. `ui0.js`: `weekOf`, and which month Home opens on (today's pay month, not today's calendar month). `ui6.js`: the day strip and the "to pay day" line; the month-end card that shows "in the first days of a month" must follow the pay day. `ui7.js` line 304: the label. The setup steps in `ui2.js`. `ui4a.js`: the assistant's line.

**Saved data.** One new setting, `S.cfg.payDays`, a list of day numbers. One pay day: `[10]`. Missing or empty: the calendar month, as today.
- No migration. Receipts keep their real dates; only how they are grouped changes. Nothing is rewritten.
- Old backups load as before: no `payDays`, calendar month, every number the same as today.
- A new backup loaded in the 38.31 build: `cleanCfg` keeps unknown settings untouched, so the field survives a round trip. A test must prove this, not trust the comment.
- The ledger design (LEDGER_DESIGN.md) already says "a month runs from one pay day to the next". Same rule, so B1 can read the same field.

**Changing the pay day later moves receipts between months.** Before saving, show what moves: "4 receipts from 1 to 9 April will count in March. March's Free to spend left goes from X to Y." Buttons: "Change it" and "Keep the 1st". Undo afterwards, like every other change.

**The first month.** The app starts at START (November 2026). Days before the first pay day in November have no month before them. They count in the first month, which is then a little longer. The strip shows it.

**Tests it needs.**
- Old backups and the golden files give the same numbers with no pay day set. This is the most important test.
- `payMonthOf` on the day before pay, on pay day, the day after, the 1st and the 31st.
- Pay day 31 in February (normal and leap year), April, June.
- `daysLeft` is the full window on pay day and 1 on the day before.
- `perWeek` hidden under 4 days left, as now; `perDay` never divides by zero.
- Receipts grouped right on both sides of the pay day, including in `calcAll` and the month table.
- Changing the pay day: the preview figures match the figures after saving; Undo gives back the exact numbers before.
- Round trip: a backup with `payDays` loaded in the 38.31 build and saved again still has `payDays`.
- The first month before the first pay day.
- `readyBy` with pay days 1, 10 and 28.
- qc-numbers walks for Ana and Ben, plus Lito and Carlo in PERSONA_WALKS.md.

**Risks.**
- Every screen that names a month ("November") now means a pay month. A beginner may be confused when a receipt from 3 December shows in November. Fix: under the month name, show the dates in small type, "10 Nov to 9 Dec".
- Missing one of the places that groups by calendar month, so two screens disagree. Fix: one function, and a search for `slice(0, 7)` on receipt dates in the review.
- Pay that lands early (a weekend or a holiday) still counts from the set day. A receipt on the early pay day lands in the old month. Small, and fixed in 3B by "pay came early".

### 3B. Two pay days (middle)

Everything in 3A, plus:

**Setup.** After "Twice a month": "Tap both days", the same calendar, two taps (for example the 15th and the 30th). Then "About how much each time?" with two boxes. The monthly pay is their sum. This also fixes the walk where a person types one half and thinks it is the month (PERSONA_WALKS, Carlo T1).

**Home.** The day strip has two coins, one for each pay. "6 days to the next pay." The weekly figure counts to the next pay, using the money from this pay only.

**The numbers.**
- The pay month starts on the first pay day of the pair and runs to the day before the next first pay day. Grouping and plan stay monthly, as in 3A.
- Inside the month, a "half" runs from one pay to the next. Free to spend for the half = Free to spend for the month times this pay's share of the month's pay. The weekly figure uses the half's money left and the half's days left.
- Bills get an optional "paid from which pay" (first or second). Default: the pay before the bill's due day. This lets Home say "Bills before your next pay: X".
- "Pay came early": a button on Home on the 2 days before a pay day. It marks the pay as landed today for this month only.

**Code it touches.** All of 3A, plus `viewOf` (half window, half money), the bill lines (an optional field), the pay window in `ui7.js` (two amounts), Home's strip with two coins, and a new "pay came early" record per month.

**Saved data.** `payDays: [15, 30]`, same field as 3A. Optional `payShare` per pay day (default: equal halves). An optional field on bill lines. A per-month list of early pays. All new and optional; old backups load with none of them.

**Tests.** All of 3A, plus: the half switch on the second pay day; shares that do not add to one; the second pay day after the month's last day (the 30th in February); a bill due between the pays; "pay came early" then Undo; the persona walks for Carlo and for Jun and Tess (three pay days: only the first two used, a clear note for the third).

**Risks.** More sums and more screens. Splitting a month's Free to spend into halves is a new rule the ledger must agree with. Three pay days in a couple (Jun and Tess) still do not fit.

### 3C. "I get paid when work comes in" (fullest)

Everything in 3B, plus a mode with no pay day at all.

**Setup.** After "It changes, or I'm paid per job": "How long should money last when it comes in?" Choices: "Until it's spent", "About a month", "About two months". Default: about a month.

**Home.** No pay day coin. The picture is the pile of coins in Free to spend and a strip that shows how many weeks it lasts at the planned rate. "This lasts about 5 weeks at X a week." When pay comes in ("Money came in", the ledger's "Waiting" place), the pile grows and the strip gets longer.

**The numbers.** No pay month at all for this person. The weekly figure is money in hand (Free to spend now) divided by the weeks it must last, counted from the last money in, not from a date. A zero month is not a failure: the strip just gets shorter, in amber, with no blame (PERSONAS_PH, Bea, point 7).

**Code it touches.** This needs the ledger (step B1): money in as dated events, "Waiting", Free to spend from events, not from a monthly plan. Before B1 it would be a second set of sums beside the plan, which is the kind of split the ledger exists to remove.

**Saved data.** `payDays: []` plus `payMode: 'whenever'` and `lastFor` (weeks). No migration; it is read from ledger events.

**Tests.** The ledger's own event lists, plus: money in after a long gap; two payments in one week; nothing in for 8 weeks; switching from this mode to a fixed pay day and back with no data lost.

**Risks.** The biggest change, and it depends on B1. Built too early, two sums would disagree.

## 4. Recommended default: 3A now, with the 3B field shape; 3C after the ledger

Build 3A for the team test. Save it as a list (`payDays`) from day one, so 3B adds a second day with no migration. Build 3B next if Carlo-shaped people are in the team test. Build 3C with or after ledger step B1.

Why, against the north star:
- **It fixes the real gap for Mako first.** Pay on the 10th, cards paid the 10th and 11th (DECISIONS, "Mako's own money"). With 3A the month runs 10th to 9th, the days left are real, and the weekly figure is safe. That is the "what is safe to spend" promise.
- **Visual first.** The day strip with a coin on pay day shows "how far to pay" before any number. A kid can read it: the filled days are gone, the coin is when money comes.
- **A beginner is never stuck.** One question, one tap on a calendar, and a skip that changes nothing. "Twice a month" and "It changes" are offered as buttons, so nobody has to force their life into one number. Until 3B and 3C exist, those answers fall back to today's month and say so in one line.
- **Nobody loses data.** No receipt is rewritten. Old backups give exactly today's numbers. The field survives the older build. A change of pay day shows what moves before it moves, with Undo.
- **Small and checkable.** One setting, one grouping function, one window. The golden files prove nothing changed for anyone who does not set it.

What it does not fix yet: Ben's halves, Cris's no-date pay, and pay that lands early. Those are 3B and 3C, and each is written above so it can be picked up without a new design.

## 5. Choices for Mako (each has a default if he says nothing)

1. **Which month name?** Pay on 10 March to 9 April: is that "March" or "April"?
   Default: **March**, the month the pay lands in. Dates shown under it in small type.

2. **Ask in setup, or only in Settings?**
   Default: **in setup**, one screen right after the pay amount, with a Skip.

3. **If pay day is the 31st and the month is shorter?**
   Default: **the last day of that month.**

4. **Pay lands early on a weekend or holiday. Move the day by itself?**
   Default: **no.** The app keeps the day you set. A "pay came early" button comes with 3B.

5. **Changing the pay day moves some receipts to another month. Show a preview first?**
   Default: **yes**, with the before and after figures, and Undo afterwards.

6. **Two pay days and "paid per job": build next, or wait?**
   Default: **two pay days next (3B) if a teammate is paid twice a month; "paid per job" (3C) waits for the ledger.**

7. **Which words?** "Pay day", "days to pay day", "your pay month".
   Default: **"pay day"** and **"X days to pay day"**. Avoid "pay month" on screens; show the dates instead. The copy pass with Mako decides the final words.
