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

## How it checks
Drive the real app with puppeteer (/tmp/v39/real.js), read the numbers from the page, and recompute them independently from the inputs it entered. Compare every screen. Report only what is wrong, not what is fine.

## Output
`VERDICT: PASS` or `VERDICT: FAIL`, then a list: severity (BLOCKER = a wrong or contradicting number, a crash, NaN, or lost money data; SHOULD-FIX = unclear label or rounding), the scenario (exact steps and inputs), what the screen showed, what it should show and why, and the screen and width. No praise.
