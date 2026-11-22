PASS (Novice, round 13, /tmp/qc_build/build.html, 390x844 dpr 2)

verify.txt, last ten lines:
== screens do no money maths
screen maths: 0 open (amounts 0, percents 0), 4 allowed with a reason, 63 files read
PASS screens only show what the model worked out
within the limit (0 of 0). The limit only ever goes down; the goal is 0.

== golden screens against tests/qc/golden/3831zf.json
golden screens: 14 plans, 0 screens differ
PASS no screen changed

VERIFY OK

JOBS
1 DONE. Dollar, pay 2400, balance 1500, rent 900, food 300. Home: "Bills and basics $1,200", "In your bank now $1,500", no "Sample numbers".
2 DONE. "Free to spend $265 safe to spend": pay minus bills ($1,200) minus the burrows' shares, nothing logged yet. Sheet: "Per day $29".
3 DONE, with a contradiction (C1). "$1,420 / Balance you entered on 22 Nov".
4 DONE. Visa $300, day 5: "Bank after the cards are paid: $1,120".
5 DONE (about 2 s, form is on Home). $12 then Edit to $15: Receipts "$15 / Free to spend / 22 Nov 2026" once; Home "Free to spend $250".
6 DONE. Logged $500, Undo: Home text identical to before, Receipts "No receipts this month."
7 DONE. Bali trip $1,200: Home shows "Bali trip $100, 8% full"; Free to spend stays $265, the $100 comes from the bank ("Bank at month end $1,400").
8 DONE, two screens have no Help: setup (all steps; only "Music on / Sound on / Finish later") and an open burrow (Emergency fund screen: only "Add money" and "Back home"; #helpBtn is 0x0, checked twice). Home, Receipts, Plan, Settings: "? Help" visible.

BLOCKERS
None.

CONFUSING
C1. Home after Check your bank 1,420: "Bank at month end $1,500" and "Bank $1,500 + burrows $935" sit under "In your bank now $1,420", explained only by "so the two can differ". Which is true? Say: "Your plan started Nov at $1,500; your bank shows $1,420 today, $80 less."
C2. Same screen: "Free to spend $265 left, not safe to spend yet". No next step, and nothing asks whether my pay has arrived. Add what to do: "Wait for pay day before spending this" or ask the pay day.
C3. Add a burrow, Date step: "the plan would spend more than your pay. Lower another place, or pick a later date." Which place, where? Home then shows "Free to spend $265 safe to spend" and "Tight month: Plans $100 more than your pay ... Dec is tight, Jan is tight, Feb is tight". Safe or tight? Say: "This goal needs $100 a month. It comes out of your bank unless you take it from Free to spend", with a button for each.
C4. No Help in setup or an open burrow (job 8). Add the "?" to both.
C5. Receipts opens with "Scan receipts ... Send your receipts to an AI app" and "Photos can't be read here" above my receipts. Put my receipts first; rename "Read receipts with an AI app".
C6. Free to spend sheet "Per week for the 9 days left $206" vs Plan "about $60 a week across the whole of Nov". Say "Spread over the 9 days left: $206 a week".
C7. Setup: "Leave it blank and add it later on Home." vs Setup done "go to Plan, then Month, Details, Money in and Salary". Pick one.

POLISH
P1 (visual first). "Bank after the cards are paid: $1,120" is a sentence; show a coin pile with the card part greyed.
P2 (visual first). "not safe to spend yet" is text; show the chest locked.
P3. Split the rest: "All of this 50% is placed" then rows "11%". Say "11% of pay".

Screenshots: /tmp/qc/novice/j4-top.png, j2-fts.png, j5-receipts.png, j5-edit.png, j7-home.png, j8-setup-money.png, j8-burrow-open.png
