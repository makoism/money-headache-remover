(QC round 14 layout touch, on the build staged from c45f8d0. Copied from the reviewer's reply.)

PASS (Layout and touch, QC round 14, /tmp/qc_build/build.html)

I found no blockers: 2 things are confusing and 5 are polish. The report is saved at /tmp/qc/layout-touch/REPORT.md. My screenshots and scripts are in /tmp/qc/layout/.

verify.txt, last ten lines:
== screens do no money maths
screen maths: 0 open (amounts 0, percents 0), 4 allowed with a reason, 63 files read
PASS screens only show what the model worked out
within the limit (0 of 0). The limit only ever goes down; the goal is 0.

== golden screens against tests/qc/golden/3831zg.json
golden screens: 14 plans, 0 screens differ
PASS no screen changed

VERIFY OK

Checked: Home, Receipts and Plan at 320, 390 and 1300, dark and light (the app's Light button), plus Welcome, Help, Ask and the burrow screen at 320. No horizontal overflow, no visible control under 44px, no console errors. The "?" pill has its own solid bar, so the last item on each tab scrolls clear of it. Panel text contrast passes in both themes. Focus rings show on every control; tabs move with the arrow keys.

BLOCKERS
None.

CONFUSING
1. Burrow screen, Add to Emergency fund, 320 and 390 dark: the quick amounts "¥5,000", "¥10,000", "¥20,000" are flat neutral grey (rgb 107,107,107). They look disabled, though tapping one works. "Add" is almost see-through (rgba 150,230,185,0.1), weaker than the chips. Replace: give the chips the normal chip style used for "Claude"/"ChatGPT" on Receipts, and make "Add" the solid green button. Screenshot /tmp/qc/layout/f-320-burrow-add.png.
2. Ask panel, 412 (pack 412-panel-23-ask-open.png): the suggestion row ends in a chip cut at the panel edge, "Where". The row scrolls sideways, but its scrollbar is hidden. On desktop with a mouse there is no visible way to reach the rest. Replace: let the row wrap (the base rule already has flex-wrap: wrap), or add a fade with an arrow.

POLISH
3. Intro text squeezed to the width of the heading, all sizes. On Receipts at 320, "Send your receipts to / an AI app and paste / its reply here." is 160px wide in a 244px column. "Log as you spend, / or all at once later." is 148 of 244, and "Pick a schedule, then / a calendar." is 160 of 244. At 390 the same text is 230 of 314. Same under "Burrows" on desktop Home. The .head grid column takes the heading's width. Let the paragraph use the full column, as "Your burrow" already does. /tmp/qc/layout/rec0-crop.png
4. Decoration close to text (Mako: "decoration must not get close to text"). In light Home at 412, the flowered vine over "Burrows" hangs to about 6px above the "planned" pill (/tmp/qc/layout/crop-light-burrows.png). On Plan at 320, the vine's stem rises level with "Bills and basics are 55% of pay, about / the usual share.", about 16px from the text (/tmp/qc/layout/plan3-crop.png). On Receipts at 320, the vine touches the right end of "Scan receipts". Keep at least one line of space, or shorten the vine at narrow widths.
5. Plan, "¥200,000 pay, by place", 320: the name column wraps "Bills / and / basics" onto three lines and "Free to / spend" onto two, while the percent column keeps about 50px of empty space. Narrow the percent column, or put the percent under the amount below 360px. /tmp/qc/layout/s-320-dark-Plan-2.png
6. Visual first: in the same table at 320, the place percents ("55%", "10%", "5%") are plain numbers, although the coloured bar above them already shows each share. Add a small bar segment to each row.
7. 320 Home: the bottom bar that holds the "?" pill is about 70px of a 640px screen (11%), and it is empty apart from the pill. A floating pill with bottom padding would give that space back.
