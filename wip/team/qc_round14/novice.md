(QC round 14 novice, on the build staged from c45f8d0. Copied from the reviewer's reply.)

FAIL

verify.txt (last ten lines):
== screens do no money maths
screen maths: 0 open (amounts 0, percents 0), 4 allowed with a reason, 63 files read
PASS screens only show what the model worked out
within the limit (0 of 0). The limit only ever goes down; the goal is 0.

== golden screens against tests/qc/golden/3831zg.json
golden screens: 14 plans, 0 screens differ
PASS no screen changed

VERIFY OK

(The tool blocked writing /tmp/qc/novice/REPORT.md: subagents may not write report files. This text is the full report; save it if you need it. I did not read MAKO_RUN.md, because my brief forbids reading other files.)

Jobs (390x844, real browser, screens only):
1 DONE. Pay $3,000, balance $1,500, rent $1,200, food $400. Home: "Bills and basics $1,600 left to pay".
2 DONE. "$325 left, not safe to spend yet". The reason is only inside "How is this worked out?": "It becomes safe to spend when your pay lands".
3 DONE. "$1,800 / Balance you entered on 22 Nov" (see CONFUSING 2).
4 DONE. "Bank after the cards are paid: $1,600".
5 DONE. Logged in about 10 s. Receipts shows "$15" once, and Free to spend went from $325 to $310 (see CONFUSING 5).
6 DONE. Logged $500, tapped Undo, saw "Your numbers are back.", and every figure on Home matched what it was before.
7 DONE. "Trip to Lisbon $100, 8% full" on Home. Free to spend stayed $325. Home: "Tight month / Plans $100 more than your pay."
8 STUCK on two screens. Help opened from Home, Receipts, Plan, Plan > Edit goal and Settings. There is no Help in setup (the only buttons are "Music on", "Sound on", "Finish later", "Back" and "Next") or in the open burrow scene (only "Add money" and "BACK HOME"). Screenshots: /tmp/qc/novice/j8-nohelp-setup-currency.png, /tmp/qc/novice/j8-open-burrow-home.png

BLOCKERS
1. Home, 390, after setup with a $1,500 bank, then logging a $500 Free to spend spend. The status card says "Over Free to spend / Bills are covered and burrows are planned for. Free to spend is $175 over." The same screen shows "In your bank now $1,500" and "Bills and basics $1,600 left to pay". The warning "Your bank is less than your bills still to pay..." was under the bank before the spend and is gone after it. Overspending removed the only warning that the bills are not covered. I repeated this twice and got the same result. Screenshot: /tmp/qc/novice/j6-overspend-home.png. Fix: keep the bank warning, and start with "Your bank does not cover your bills yet, and Free to spend is $175 over."
2. Job 8: there is no Help inside setup or in the open burrow scene (above).

CONFUSING
1. Home bank card: "so Free to spend is planned, not safe to spend yet." It does not say what to do. Add: "Wait for pay day, then tap Check your bank."
2. Home after Check your bank shows $1,800, but further down it still says "Bank $1,500 + burrows $1,075 = $2,575". Two different figures are both called "Bank". Change it to "Bank at month end $1,500 + ...".
3. Add a burrow, Date step: "No date, so the plan assumes 12 months... Lower another place, or pick a later date." It does not say which place or how to lower it. Replace with: "No date means 12 months. Pick 2 years to save less each month, or lower Free to spend on Plan."
4. Pack 390-dollar-plan-3: a red "Over plan" badge sits on top of "$792 of pay not placed yet". To a beginner, "over" means overspent. Use "Some pay has no place yet" for this case.
5. Receipts, Edit: the Amount field keeps "12" when I tap it, so typing 15 saved "$1,215" and showed "$890 over". The Check your bank field selects its old value when you tap it; this field should do the same.
6. Receipts tab: the first thing on it is "Scan receipts / Send your receipts to an AI app..." with six AI links. The simple "Log spend" form is below that. Put the form first.
7. Currency step: "Yen or yuan" is already selected for a Dollar user. Preselect nothing, or follow the browser locale.
8. Pack All months: the "Not placed" column and the status "Not placed yet" repeat with no next step. Add "Tap a month to give it a place."

POLISH
1. The "Badge: First burrow." toast covers "This month" on the first Home after setup (/tmp/qc/novice/j1-home-top.png).
2. The bank card says "Your bank after the cards is less than...", but the status card says "your bank is less than...". Use one wording.
3. Burrow wizard: "No date" appears twice, once as the field value and once as a chip.

Visual first: Home shows bank and burrows as a bar, burrow art and a chest. When Free to spend goes over or the month is tight, only words and a small icon say so. Show the chest empty or cracked.

Screenshots are in /tmp/qc/novice/
