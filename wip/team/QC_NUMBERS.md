# The number-logic QC agent (second final gate, Mako 2026-11-17, every release from now on)

Rule from Mako: a separate agent whose only job is that every number the app shows is correct, in every situation. It runs at the same time as the north-star QC agent (QC_AGENT.md) on every release and on every step. Neither sees the builder's reasoning. A fail from either is fixed or brought to Mako, then both run again on a fresh agent before shipping.

## What it is given
1. NORTH_STAR.md (so it knows what the numbers are for).
2. The finished build (one html file) and the screenshot/puppeteer helpers.
3. The plain money rules below. Nothing else: no plan, changelog or test results.

## Money rules every number must obey
- Every coin is in exactly one place. Bank + burrows (goals, Education, Investing, Giving) = the total shown. Parts add up to the pay.
- A figure shown in two places is the same figure everywhere (Home, Plan > Month, Plan > All months, Receipts, toasts, status line, chip, dock strip, Pay day overlay, forecast, Goals).
- Spending past a plan comes out of the bank and stays out in later months. Nothing is ever shown as "safe to spend" if the bank cannot cover it.
- Planned and actual are never mixed up or mislabelled. Pay not placed is shown as not placed, never dropped. A plan bigger than the pay says so.
- Percentages add up to 100. Rounding never makes a total differ from its parts by more than the rounding unit.
- Dates and months: the right month gets the number (receipts dated in another month, month ends, leap years, future dates, the first and last month of the plan).
- Currency and format: the symbol, thousands, decimals and the minus sign are consistent. No NaN, undefined, Infinity, -0, or empty where a number belongs.

## Scenarios it must try (at least)
Normal use; no pay entered; zero everywhere; Zero all then add one thing; a receipt of 0, negative, 1 yen, 999,999,999, with many decimals, with a letter, pasted with commas; a typo like an extra zero; the same receipt entered twice; a receipt on the 31st, on 29 Feb, in a past or future month; overspending Free to spend, Bills, Education, Giving, Investing, each alone and all together; overspending until the bank is negative and below the minimum; deleting or editing a receipt and checking every figure goes back; editing a plan amount after receipts exist; goals full, over target, due date passed, target 0; changing currency; Restore, Undo, Reset month, Re-split pay; two tabs; reload mid-way; very small and very large pay; pay lower than bills; leaving things blank.
Added after the 38.30 gates (PLAN step 4): answer the month-end question (bank and goal), then log receipts in that month until the answered money is used up, and read the answer card each time; spend past the plan by less than, and by more than, the pay with no place, and read every "not placed" figure on Plan including the tooltip on the Left piece of the bar; say yes to the longer emergency goal and compare every "to go" (Home goal card, the month-end card, Plan > Goals).

## How it checks
Drive the real app with puppeteer (/tmp/v39/real.js), read the numbers from the page, and recompute them independently from the inputs it entered. Compare every screen. Report only what is wrong, not what is fine.

## Output
`VERDICT: PASS` or `VERDICT: FAIL`, then a list: severity (BLOCKER = a wrong or contradicting number, a crash, NaN, or lost money data; SHOULD-FIX = unclear label or rounding), the scenario (exact steps and inputs), what the screen showed, what it should show and why, and the screen and width. No praise.

## Added in 38.31: the four hard gates (run these first, in this order)

You are the number-logic agent. Before you judge anything by eye, run these. Each has one pass line. If any does not pass, your answer is FAIL and you stop there. Do not explain a failure away.

| # | Run (from `wip/team`) | Passes only if the output has |
| --- | --- | --- |
| 1 | `N=3000 node /tmp/v25/oracle.js` | `mismatches 0` on the first line |
| 2 | `node tests/qc/proof_fuzz.js 1500 21` | `PROOF PASS` |
| 3 | `node tests/qc/display_math.js` | an open count no higher than the number in `tests/qc/display_math.max` |
| 4 | `node tests/qc/home_dom.js 40 13` | `mismatches 0` |

If `/tmp/v25/oracle.js` is missing, run `bash tests/setup_env.sh` first. Never skip a gate because a file is missing.

Then check by hand, on the built page, with at least these six situations. For each one write the numbers you saw and whether they agree.

1. A month spent past plan in Free to spend, in a bill, and in "Other".
2. A month where money is borrowed from the emergency fund and the plan uses it. The split must read: places + not placed = 100 + the Borrowed percent.
3. A month where Education or Giving is spent past its pile.
4. A past month whose unspent Free to spend was answered "keep in the bank", and one answered "put toward a goal" where the goal had less room than the amount.
5. A currency with cents (not yen): a receipt of 0.01 and one of 19.99.
6. No pay entered, and bills logged anyway.

In every situation these must hold:

- The same amount is written the same way everywhere on the screen. 26,535 in one card and 26,534.51 in another is a FAIL.
- Home's line "Bank X + burrows Y = Z" is followed by "Checked: ..." and the page does not say "These numbers do not add up".
- A set of percents shown together adds up to what the screen says it adds up to.
- No amount on a screen was worked out by the screen. If you find one the scanner missed, that is a FAIL and the scanner must be taught to catch it.
- A wrong or missing input (blank box, a typo of one extra zero, a receipt in a month with no plan) never produces NaN, undefined, a negative zero, or a number that contradicts another one.

Your report: the four gate results, the six situations with the numbers you read, then one line: PASS or FAIL.
