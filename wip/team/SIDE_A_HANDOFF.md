# Side A handoff: script checks (cost rule 3)

Branch `side/script-checks`, made from wip-38.31 at 53c7a31. Only new files; no app file and no existing test was changed.

## What is new (all in wip/team)

- `tests/qc/script_lib.js`: shared helper. Opens a 390-wide phone page with a made-up plan in dollars with cents, sets light or dark, and walks every screen: Home with More open, Receipts, Plan Month, Plan Goals, Plan All months, Settings. Extra made-up states: overspent, all zero, blank, tenths.
- `tests/qc/script_words.js`: no em dash or retired word (jar, Necessities, Financial Freedom, play money, income, allocation, unassigned) in page text, aria-label, title, placeholder, tooltip or alt, on the first screen, every screen and the Help menu. About 20 s.
- `tests/qc/script_bad_numbers.js`: no NaN, undefined, null, Infinity, [object, minus zero or "$−" anywhere, in four made-up months. About 30 s.
- `tests/qc/script_two_ways.js`: no amount written two ways on one screen (whole beside cents of the same amount; pace hints excepted) and every amount by the money rule (two decimals or none, never .00, commas). About 20 s.
- `tests/qc/script_percents.js`: Plan percents add to 100 and match their amounts, the rows add to the pay, "Bills and basics are N%" and "Goals get ..." match, goal "N% full" and "most full", Home bank plus burrows equals Total, "$A + $B = $C", Settings guide adds to 100. About 30 s.
- `tests/qc/script_tap44.js`: every visible control at least 44 x 44 at 390 and 320 wide, including the first screen and the Help menu. About 27 s.
- `tests/qc/script_contrast.js`: text contrast 4.5:1 (3:1 for large text, WCAG AA) in light and dark, gradients at their worst stop, text over pictures counted as skipped. About 27 s.
- `tests/qc/script_run.sh`: runs all six one at a time (about 2.5 to 3 minutes), prints known failures as KNOWN, fails on anything else.
- `tests/qc/script_known.txt`: the known failures, one pattern per line. Remove a line when the app is fixed.
- `SIDE_A_FINDINGS.md`: three real findings (controls under 44px on Home, light-theme contrast, Plan percents adding to 81%).

The text scripts carry a self-test line that plants a bad case, so a broken pattern cannot pass quietly. Each script was run at least three times with the same results.

## Add to verify.sh (one line, run from wip/team)

```
sed -i '/^echo; \[ \$BAD -eq 0 \] && echo "VERIFY OK"/i say "script checks (findings that came back, cost rule 3)"; OUT=$(bash tests/qc/script_run.sh 2>\&1) || BAD=1; echo "$OUT" | grep -v "^\\[agent"' tests/verify.sh
```

Note: this makes verify.sh about 3 minutes longer (it is 2 to 3 minutes now). If that is too slow for every edit, put the same line in check.sh instead, or run `bash tests/qc/script_run.sh` before each commit. `SCRIPT_WAIT` (default 300 ms) sets the wait after each tab tap.

## Limits

- The contrast check cannot measure text over the scene art, a canvas or an image; it prints how many it skipped (16 of about 900).
- A known pattern matches by check name, so a second contrast problem on an already-known screen would be hidden until the first is fixed.
- Screens covered: the tabs, Plan views, Home with More open, Settings, Help menu, first screen. Not covered: the setup steps after the first, sheets and editors (goal editor, burrow pages), Ask.
