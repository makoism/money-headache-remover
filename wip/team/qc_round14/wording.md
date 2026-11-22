(QC round 14 wording, on the build staged from c45f8d0. Copied from the reviewer's reply.)

PASS (Wording editor, QC round 14, /tmp/qc_build/build.html). No wording blockers. 8 confusing items, 4 polish items, 1 visual-first item. Also saved to /tmp/qc/wording/REPORT.md.

verify.txt, last ten lines:
== screens do no money maths
screen maths: 0 open (amounts 0, percents 0), 4 allowed with a reason, 63 files read
PASS screens only show what the model worked out
within the limit (0 of 0). The limit only ever goes down; the goal is 0.

== golden screens against tests/qc/golden/3831zg.json
golden screens: 14 plans, 0 screens differ
PASS no screen changed

VERIFY OK

BLOCKERS
None.

CONFUSING
1. Settings, Saved data (412, all situations): "reading a statement or a receipt photo sends that file to Claude." Receipts, same build: "Photos can't be read here. Use an AI app below." The privacy line describes something the Receipts screen says it does not do. Replace with: "Ask sends them with your question while the box is ticked. A statement or photo you attach in Ask goes to Claude too."
2. Settings, Restore (412): "Tap Choose file and pick your backup. Then tap Load text". The button you tap after picking a file is named "Load text". Rename the button "Load backup", or say "Then tap Load".
3. Settings, Reset and setup (412 dollar-plan): the buttons "Set all to zero" and "Clear my plan" sit side by side, and no line says how they differ. Add one line under each, or keep one.
4. Plan, Month (412 dollar-plan): the top says "$792 of your pay not placed yet", Details says "Left $854.75", and the row "Used for spending past plan / came out of pay with no place" sits between them. Two words and two amounts for one idea. Replace "Left" with "Not placed yet" and the row with "Spent past plan, taken from pay not placed yet".
5. Plan, Burrows (412 first-open): "Home or move ... 6% full ... On track" and "Trip ... 6% full ... Filling", both "Full Feb 2028". Nothing says how On track differs from Filling. Explain it in one line on the tab.
6. Home, Free to spend (412 first-open and dollar-plan, bank now empty): "¥20,000 safe to spend". Explain this tab, step 5 says: "Safe to spend means your bank has the money now too." No bank balance was entered. Say "planned" until a bank balance exists.
7. Home, under the bar (412 panel 38): "Your bank now is ¥412,000, ¥393,600 after the cards are paid, so the two can differ." Both numbers it compares are ¥412,000, so "differ" reads wrong. Say "Your bank today may differ from where the plan started."
8. Home, overdrawn notice (412 yen-overdrawn): "Your bank starts the month below zero. ... ¥30,000 is left in Free to spend, not safe to spend yet: your plan starts from a bank below zero (−¥15,000)." It says the bank is below zero twice in three sentences. Replace with: "Your bank starts Nov at −¥15,000. Keep the ¥80,000 not placed yet in the bank and wait for pay before spending Free to spend."

POLISH
1. Plan, Explain this tab, step 1 (390): "The big number is this month's Free to spend and it's yours to spend on whatever you want" has no full stop.
2. Plan, Free to spend: first-open says "Planned: about ¥4,700 a week across the whole of Nov." dollar-plan says "Planned $300 in Nov, about $70 a week." Use the second form everywhere.
3. Receipts, Use your own AI: "The reply gets checked and listed for you to go through the same way." "The same way" points at nothing on the screen. Cut it.
4. Setup, Done (412 panel 36): "upload each month's statement" on the Receipts tab, but Receipts has no upload. Say "paste a reply from your AI app".

Visual first
Plan, All months (412 dollar-plan, /tmp/qc_build/screens/412-dollar-plan-5-plan-all-months.png): 24 rows of numbers, and each row's status is only an icon with no word. A small growing bank pile or a line over the months would show the same thing at a glance, with the table under it.

Files are in /tmp/qc/wording/:
- REPORT.md
- help-Home-1.png
- help-Receipts-1.png
- help-Plan-1.png
- home-dollar-crop.png
- plan-dollar-crop.png

The report section is 573 words, plus the required verify.sh lines.
