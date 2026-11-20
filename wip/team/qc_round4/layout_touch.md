# QC round 4, 38.31: Layout and touch

verify.sh, last ten lines (/tmp/qc_build/verify.txt):
```
MISSING plan #9 $ 2027-01-03
MISSING plan #10 CHF 2027-06-10
MISSING plan #11 ¥ 2027-01-22
MISSING plan #12 ¥ 2027-01-22
MISSING plan #13 ¥ 2027-01-28
golden screens: 14 plans, 19 screens differ
FAIL the screens changed
(screens differ: every difference must be one you meant)

VERIFY OK
```

Role note: the task did not name my role. Other folders already covered north-star, numbers, money and data safety, so I took Layout and touch (`.claude/agents/qc-layout-touch.md`). Before I found my role I had read more than this brief allows: the top of RESUME.md, QC_AGENT.md, QC_NUMBERS.md and all of QC_ROLES.md. My findings come only from driving the build. The harness refused to let me write /tmp/qc/layout-touch-unassigned/REPORT.md, so this message is the report. Scripts and screenshots are in /tmp/qc/layout-touch-unassigned/.

## BLOCKERS

1. **Burrow screen, 412x915, 414x896 and 430x932 (light and dark): the page dots sit on top of the "Back home" sign, and a tap on a dot goes home instead.** The dot buttons span y791..835 and the sign spans y804..900, so they overlap by 31px. The sign wins the tap. Tapping the centre of the "Trip" dot (184,813) closed the burrow screen and showed Home. The dot pill is also drawn over the top of the word "BACK". At 390x844 the two touch (2px overlap) and the tap still works. Fix: place the dots by the sign's real top, at least 8px above it, at every width. Or scale the sign down when the screen is wider than 400px. Evidence: /tmp/qc/layout-touch-unassigned/B1-burrow-pager-over-back-home-412x915.png and /tmp/qc/layout-touch-unassigned/B1-burrow-screen-412x915-full.png.

## CONFUSING

1. **Home, "Where your money sits", at 320: a long amount breaks in the middle of the number.** With a burrow named "Something elsEmergency deposit for the new apartment near th", the amount reads "¥987," then "654,3" then "21" over three lines. Fix: keep each amount on one line and let only the name wrap. Evidence: /tmp/qc/layout-touch-unassigned/C1-home-legend-number-split-320.png.
2. **Plan > All months at 320: the event pill breaks words in the middle.** The sample name already does it in the staged pack (320-dollar-plan-5-plan-all-months): "Emerg / ency / fund / full". A long name turns into a 13-line column ("Somet / hing / elsEm…"). Fix: put the pill on its own line under the month, full row width, and never break inside a word. Evidence: /tmp/qc/layout-touch-unassigned/C2-all-months-emergency-fund-full-split-320.png.
3. **Plan > All months at 320 with cents: the status column is cut off.** The table area is 244px wide but the rows need 279px, so the ✓ and ⚠ status column sits past the right edge until you swipe sideways. Nothing on screen says the table moves. The staged 320-dollar-plan-5 shot shows no status icons at all. Fix: let the "Not placed" and "Bank, month end" headers wrap and tighten the columns under 360px, or show a visible sideways cue. Evidence: /tmp/qc/layout-touch-unassigned/C3-all-months-status-column-cut-320.png.

## POLISH

1. **Keyboard focus lands under the fixed strips at 390 and 320.** Desktop has no strip and is fine. On Home, Tab puts "Your pay in Nov, and where it goes" at y800..844 and "More: Free to spend, goals, cards, streak" at y763..807. Both sit under the Help strip, which covers y774..844. On Plan, "Change", "Log spend", the "Free to spend" row and its amount box land under the same strip. Going back up with Shift+Tab, "One-time costs" lands at y0..55 under Plan's top summary strip (y0..63). Fix: `scroll-padding-bottom: 80px` on the page, and `scroll-padding-top: 72px` while the Plan strip shows.
2. **Controls under 44px:**
   - `select.inp.sm` sets `min-height: 34px`. The month-end "Which goal" picker ("Trip") is about 150x34 in 412-panel-48. Evidence: /tmp/qc/layout-touch-unassigned/P2-month-end-goal-picker-34px-412.png.
   - The burrow "Add money" chips "¥5,000", "¥10,000" and "¥20,000" are 42px tall at every size.
   - The goal editor close "×" is 40x40.
   - The setup link "Use the longer setup" is 131x42.
   - The Plan "pay, by place" bar pieces are 16px tall ("Giving" is 15x16 at 390 and 11x16 at 320). They are still tap and Tab targets, which adds six extra Tab stops for numbers already listed in the rows below. Make them inert, or give them a 44px hit area.
3. Visual first: All months at 320 is a wall of figures. A small coin pile or bar per month would read faster and remove the column squeeze.

Checked and passing:
- No horizontal page scroll at 320, 390, 412, 768, 1024 or 1300 on any tab, More, Settings, the burrow screen, Help, Ask or setup.
- No page or console errors in any run.
- After scrolling, the Help strip never hides content: the bottom padding is enough.
- Caption and tab text contrast is 6.65:1 in light and 9.48:1 in dark.
- A 3px focus ring shows on every control, including the bank box.
- The main tabs move with the arrow keys.
- Every setup step at 320x568 scrolls clear of Back and Next.

## Waiting for Mako's full run (not failures)
- Q1: Home has no "they add up" line. Seen: "Bank ¥85,500 + burrows ¥210,000 = ¥295,500 at the end of Nov." with no line after it.
- Q4: Home's first screen is text.
- Whether Check your bank should change the figure the plan starts from.
- Counting a card in the month it is paid.
- How short-month fixes should work across months.
- One word for "short".
- The borrowed row's percent beside places past 100.

VERDICT: FAIL