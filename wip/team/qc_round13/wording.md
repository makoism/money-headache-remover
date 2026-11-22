PASS (no blockers)

verify.txt, last ten lines:
== screens do no money maths
screen maths: 0 open (amounts 0, percents 0), 4 allowed with a reason, 63 files read
PASS screens only show what the model worked out
within the limit (0 of 0). The limit only ever goes down; the goal is 0.

== golden screens against tests/qc/golden/3831zf.json
golden screens: 14 plans, 0 screens differ
PASS no screen changed

VERIFY OK

BLOCKERS
None. No banned words or em dashes in the pack. Live errors at 390 ("Type an amount", "Paste the reply first.") say what to do.

CONFUSING
1. Receipts, 390 and 1280: "Scan receipts" over "Photos can't be read here. Use an AI app below." Settings says "reading a statement or a receipt photo sends that file to Claude"; Ask says "The paperclip adds receipts or statements to read". Replace with: "To read photos here, open Ask and tap the paperclip. Or use your own AI app below."
2. Home with a card (412 panel 22, 1280 panel 54): "Your bank now is ¥412,000, ¥393,600 after the cards are paid, so the two can differ." Both are ¥412,000. Replace: "Cards take ¥18,400 of this when they are paid."
3. Home first open, 390: the bank box shows "¥ 0", yet "Bank at month end is planned from ¥85,500". Replace: "Bank at month end starts from the sample balance, ¥85,500."
4. Home dollar, 390: "$1,150 left to pay, $62.75 over". Replace: "$1,150 left to pay. Food and groceries is $62.75 over."
5. Plan Month dollar, 390: "Used for spending past plan / came out of pay with no place". Replace: "Spent over plan". Details "Left $854.75" sits beside "$792 of pay not placed yet" unexplained.
6. Month end, 412 panel 48: "¥20,000 of Free to spend isn't logged as spent" then "The plan counted it as spent." Replace: "Nov: ¥20,000 of Free to spend was not spent. Keep it in the bank or put it toward a goal."
7. Burrows, 390 first open: "Home or move ... On track ... Full Feb 2028" and "Trip ... Filling ... Full Feb 2028". Same date, two words, no explanation. Use one word.
8. Home overdrawn, 390: "Your bank starts the month below zero ... your plan starts from a bank below zero (−¥15,000)" says it twice. Replace: "Your bank starts Nov at −¥15,000. Keep the ¥80,000 not placed yet in the bank, and wait for pay before spending the ¥30,000 in Free to spend."
9. Settings Restore, all sizes: buttons read "Load text", "Choose file", but the steps say "Tap Choose file ... Then tap Load text". Put "Choose file" first.

POLISH
- Home, every scenario: "Emergency fund is the most full". Say "fullest", and drop the line when there is only one goal (overdrawn, 390).
- Header strip: "Free to spend: ¥20,000 safe to spend, Nov". Replace: "Nov: ¥20,000 safe to spend".
- One weekly line, two phrasings: "Planned: about ¥4,700 a week across the whole of Nov." (first open) and "Planned $300 in Nov, about $70 a week." (dollar).
- Receipts dollar: "$204.00 safe to spend" but "$204" everywhere else. Import review dates "Nov 6"; elsewhere "12 Nov 2026".
- Forecast axis "Nov 26" reads as a day; use "Nov 2026".

VISUAL FIRST
- Home: under the stacked bar, four number cards (Total, Free to spend, Bills left, Saved) and "Bank ¥85,500 + burrows ¥210,000 = ¥295,500" repeat the bar and the chests in words.
- Streak: eight text rows "Week of 2 Nov 2026: nothing". A row of eight dots says it at a glance.
- All months: 24 rows of "Not placed yet". A small bank line would show it.

Screenshots: /tmp/qc/wording/ (fo_home_top.png, fo_home_mid.png, check_empty.png)
