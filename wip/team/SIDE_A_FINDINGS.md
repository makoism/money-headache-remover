# Side A findings (script checks, 2026-11-19)

Found by the new `tests/qc/script_*.js` checks on the wip-38.31 build (commit 53c7a31). The app was not changed and the scripts were not weakened. Each failing check is listed in `tests/qc/script_known.txt`, so `script_run.sh` prints it as KNOWN and stays green; remove the line once the app is fixed and the script then guards it. All numbers are made up (see `tests/qc/script_lib.js`).

## 1. Controls under 44px on Home (layout, rounds 1 to 4 said "every control 44px")

`script_tap44.js`, at 390 and at 320 wide, both themes, made-up plan with cents and two receipts.
`layout_round4.js` passes because it only looks at Home with More closed and the sample plan, where the quick log card has no "Date, note".

| Control | Size (w x h) | Where |
|---|---|---|
| "Date, note" summary | 68 x 32 | Home, quick Log spend card (`#hQuick details.hmore summary`). Shows with More closed too. |
| "How is this worked out?" link button | 152 x 42 | Home, More open: under "You are okay" (`#hStatus .hs-more button.link`) and in Free to spend (`#hSpend`) |
| "Extra money came in?" link button | 138 x 42 | Home, More open, Free to spend card (`#hSpend .hs-more button.link`) |
| "Forecast" summary | 56 x 36 | Home, More open, main goal card (`#hHero details.hw-more summary`) |
| "See every goal on one graph" summary | 188 x 36 | Home, More open, Burrows card (`#ggWrap summary`) |

## 2. Text contrast under 4.5:1 in the light theme (layout and art, rounds 1 to 4)

`script_contrast.js`, light theme, 390 wide. The dark theme (the default) passes everywhere. Ratios are against the stacked background under the text; for a gradient, its worst stop.

| Text | Ratio | Where | Colours |
|---|---|---|---|
| "You are okay" (16px) | 3.85:1 | Home, More open, status chip (`#hStatus span.chip.good`) | text rgb(31,122,82) on about rgb(207,224,214) |
| "The next 3 months look fine." (15px) | 4.48:1 | Home, More open (`#hStatus p.hst-w`) | rgb(31,122,82) on rgb(231,238,233) |
| "Log spend" button (16px) | 4.35:1 | Receipts (`#rcSave.btn.solid`) | white on rgb(39,137,93) |
| "Not placed yet" (16px) | 3.48:1 | Plan, Month, the amber chip (`#chip.chip.tight`) | rgb(154,106,0) on rgb(222,222,205) |
| "Not placed yet" (14px) | 3.93:1 | Plan, All months, every month's status (`span.st.tight span.stw`) | rgb(154,106,0) on rgb(229,236,230) |
| "Trip full" (12px) | 1.84:1 | Plan, All months, the goal-full mark in a month row (`span.mt-g`) | rgb(217,154,18) on rgb(227,224,201) |

## 3. Plan percents add to 81% when spending past plan used pay (numbers, percent rule, rounds 3 and 4)

`script_percents.js`, state "tenths": pay $997.30, every place about a tenth of pay, and $187.65 of pay already used for spending past plan (receipts over Free to spend). Plan, Month, "$997.30 pay, by place":

Bills and basics $199.85 20%, Goals $210.60 21%, Free to spend $99.95 10%, Education $99.65 10%, Investing $99.85 10%, Giving $99.75 10%, Used for spending past plan $187.65 (no percent).

The amounts add to the pay ($997.30) but the percents a person sees add to 81%. The row "Used for spending past plan" (18.8% of pay) has none (`paintLegend` in ui2.js passes `''` for it). Either give that row its percent (19%, so the column adds to 100) or hide the percents whenever a row has none. This belongs with Mako's open percent-rule decision.

## Checked and clean

No em dash or retired word (`script_words.js`), no NaN, undefined, null, Infinity or minus zero in four made-up months including all-zero and blank (`script_bad_numbers.js`), no amount written two ways and every amount by the money rule (`script_two_ways.js`). Goal "N% full", "most full", Home bank plus burrows equals Total, Saved, the "$A + $B = $C" sentence and the Settings guide all agree (`script_percents.js`).
