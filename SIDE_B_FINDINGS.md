# Side B findings: cards and loans in the independent oracle

Branch `side/oracle-debts`, from `wip-38.31` at 53c7a31, 2026-11-19. The app code was not changed.

## What was done

- `tests/regression/v25/oracle.js` now recounts cards and loans (`S.plan.debts`) from the plain rules, in whole numbers, with none of the app's code:
  each month's interest, extra, payment, balance, start, minimum part and percent paid off, the month totals (`debtPay`, `debtInterest`, `debtOwed`, `debtStart`, `debtMin`, `debtExtra`),
  the payments inside Bills and basics (and so in money out, left, the bank and the percents) but not in `billsTotal`, and for each debt the pay-off month,
  "never paid off", total interest, total paid, done, and which one to pay first (`debtRows`).
- `randomState({ debts: true })` gives about 60% of plans 1 to 4 cards or loans with made-up numbers (rates with two decimals, balances up to 1e9, minimums that do not beat the interest, extra changes for one month or from a month on).
  Without the option nothing changes, so the plans other tests draw (and the golden screens) stay the same. The oracle's own run uses the option.
- `wip/team/tests/qc/home_map.js` no longer takes card and loan payments from the model. The map's bank is checked against the oracle's bank alone.

## Result

- `N=3000 node tests/regression/v25/oracle.js` (seed 1): `random plans 3000 | comparisons 7504378 | mismatches 17`. All 17 are finding 2 below.
  Seeds 2 to 4 also show finding 1 (seed 4: 110 mismatches, seed 2: 7, seed 3: 7).
- Proof that nothing else disagrees: a scratch copy of model.js with only the two roundings below made exact (not committed, the app is not touched) gives `mismatches 0` on seeds 1 to 6, 3000 plans each.
- `node tests/qc/home_map.js 24 7` (as in check.sh): `plans 24 | map checks 288 | mismatches 0`, bank fully independent.
- Because `check.sh` and `verify.sh` run the oracle at N=1500 on seed 1, they will say the oracle disagrees with the app until finding 2 is fixed in the app (finding 1 too on other seeds). That is the oracle doing its job.

## Finding 1: a month's interest that is exactly half rounds down (app wrong)

- Rule (model.js comment and ARCHITECTURE 38.26): interest is added to what is owed, whole amounts only; the app's own rounding is to the nearest whole amount, a half rounding up.
- Inputs: one debt, balance 20000, yearly rate 90.21, minimum 0, extra 0 (oracle seed 4, plan #124, debt d0).
- Expected: 20000 x 90.21 / 12 / 100 = 1503.5 exactly, so interest 1504, owed 21504 at the end of Nov 2026.
- App: interest 1503, owed 21503. It works out 20000 * 90.21 / 1200 in floating point, gets 1503.4999999999998, and rounds that down.
- The 1 carries on into every later month (owed 2 lower by Dec, and so on), and into the pay-off totals.
  A second case: seed 2, plan #2241, debt d1 (balance 857460063, rate 68.88, minimum 49218208): total interest app 10850928423 vs 10850931577, total paid app 11708388486 vs 11708391640 (a half somewhere in the 20 years of the projection).
- Where: `debtStep` in model.js. Counting the rate in hundredths of a percent as a whole number and rounding owed x that / 120000 gives the exact half.

## Finding 2: percent paid off that is exactly half rounds down (app wrong)

- Rule: how much of the first balance is paid off by the end of the month, as a whole percent, a half rounding up.
- Inputs: one debt, first balance 40000, owed 36200 at the end of Nov 2026 (oracle seed 1, plan #96, debt d2). Also first balance 40, owed 37, 31, 27, 17 (plan #970).
- Expected: (40000 - 36200) / 40000 = 9.5%, so 10%. (37 of 40 owed: 7.5% so 8%; 22.5% so 23%; 32.5% so 33%; 57.5% so 58%.)
- App: 9% (and 7, 22, 32, 57). It works out 1 - 36200 / 40000 = 0.09499999999999997, then x 100 rounds down.
- Where it shows: `paidPctWhole` in model.js calcAll, read by ui7.js line 28, the screen reader label "... 9% paid by the end of ...". The bar width uses the unrounded share, so the picture is right.
- Working it out as 100 x (first balance - owed) / first balance, then rounding, gives the exact half.

## Seen, not looked into

- `node tests/qc/home_map.js 45 21`: plans #24 (CHF, 2027-01-28) and #28 (£, 2027-02-10) say "the map is not on Home". The same two show with the old home_map.js and the old oracle, so this comes from before this branch. It is outside check.sh's seed (24 plans, seed 7).
