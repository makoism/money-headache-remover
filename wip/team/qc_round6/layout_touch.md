# QC round 6, Layout and touch: PASS (no blockers)

Saved by MAIN 12 from the agent's reply. Covered Home, More, Settings, Receipts, Plan at 320x640, 390x844, 1300x900, dark and light; sheets, menus, Tab order, focus rings, long names, over-limit amount. No sideways scroll, no console errors, focus rings everywhere, tabs use arrow keys.
**MAIN 12 note:** item 1 has a clear part: at 320x640 a tap on the centre of Save on Home's first view lands on the bottom strip (`.help-row::before`, 70px, solid). Same strip as the round 5 notes. Whether to fade or shrink it is a look choice (For Mako), but a control must not sit half under it on first view. Item 3 (42px button) has one right answer: 44px.

## Confusing
1. 320x640 Home first view after Finish later: the 70px solid strip behind "?" (`.help-row::before`, rgb(6,19,13), from y=570) slices the bank input (y547 to 591) and Save (y543 to 595); a tap at Save's centre hits `.help-row`. Fine at 390x844 and 375x667. The strip also cuts cards mid-line while scrolling at every phone size. Suggest a short fade or no strip, relying on the bottom padding.
2. Plan at 320x640: top dock (y0 to 83) plus the 70px bottom strip take about 24% of the screen. Suggest a one-line dock at 320 or let it scroll away.

## Polish
3. Plan > Details > Monthly bills open: "Rename, remove or add lines" is 182x42 at 390 and 1300 (under 44).
4. Text on scenery: Home "More: Free to spend, goals, cards, streak" on a 10% tint; tour Welcome at 320 has no panel.
5. Home at 320: "Sample numbers" badge indent; "Saved in this browser" wraps.
6. Home > More at 320: "Emergency ..." cut to 14 characters while "21 months" has room; let it wrap.
7. Visual first: Home's four boxes at 320 with 4 to 6 line captions.
8. Desktop Plan: one 420px column, wide empty sides, small Month/Burrows/All months pill.
