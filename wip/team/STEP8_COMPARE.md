# What changes for someone already using 38.28 (for Mako, before any deploy)

Written 2026-11-18 for PLAN step 8; run again 2026-11-19 on the v1 candidate, and once more after the QC run fixes (COMPARE PASS, same result: every bank difference is spending past the plan, to the yen). Run again 2026-11-21 (about 19:45 JST) on b34490a, after the QC round 5 and 6 fixes: COMPARE PASS, the same table to the yen, and every goal balance the same. Made-up numbers only. Run it yourself: `node tests/qc/compare_3828.js` from `wip/team`.

## How it was checked

A plan was made and saved with the live 38.28 code itself (`tests/fixtures/model_3828.js`, taken from `main`): yen, pay 285,000, rent 92,000, food 38,000, Free to spend 30,000, a 15,000 dentist bill in January, and eight receipts (159,800 in all). That saved copy was then loaded into 38.31 the way the page loads it, and every month's bank figure was compared.

The explanation is recounted from the plain rule in the test file, not with 38.31's own code, so 38.31 cannot explain itself.

## What it found

| Month | Bank in 38.28 | Bank in 38.31 | Difference | Why |
| --- | --- | --- | --- | --- |
| Nov 2026 | 175,000 | 175,000 | 0 | nothing went past the plan |
| Dec 2026 | 170,000 | 159,500 | -10,500 | Free to spend: 40,500 logged against 30,000 planned |
| Jan 2027 | 150,000 | 130,500 | -19,500 | the 10,500 from December stays out, plus food 6,000 past its 38,000 and Other 3,000 past the 15,000 dentist bill |
| Feb to Jun 2027 | | | -19,500 each | the same 19,500 stays out; nothing new went past the plan |

- Every difference is exactly "spending past the plan so far", to the yen. Nothing else changed.
- Every goal balance is the same in both versions, every month.
- Every typed amount, one-month change, one-time cost and receipt loads unchanged.

## The rule behind it

38.30 made spending past the plan real money: it comes out of the bank in the month it happens and stays out in later months. 38.28 ignored receipts for the bank, so its bank figure was the plan only. So for anyone who logged more than they planned, **the bank figure in 38.31 is lower than in 38.28, by exactly what they spent past the plan.** It is the truer number.

## Other things a 38.28 user will see on first open

- If last month's Free to spend was not all logged as spent, Home asks where it goes (count it in the bank, put it toward a goal, or decide later). The bank does not change until they answer.
- Home is now version one: the picture, four numbers (Total, Free to spend, Bills left, Saved) and one next action. Everything else is under More.
- If a month ends below zero, Home says so in one amber line with the cause.
- Home starts with **In your bank now**: the balance they typed and the day they typed it, and a "Check your bank" button that asks what the bank app shows today. Every other figure on Home is labelled **planned** (LAUNCH_CHECKLIST A1).
- A **"Pay off a debt"** burrow is no longer counted as savings: money put toward it is paid away, so it is left out of Saved and Total (A3). Anyone with such a burrow will see Saved and Total lower than in 38.28, by what that burrow holds. The burrow itself still shows what is paid off and what is still owed.
- When there are cards, loans or debt burrows, Home has one line **"You owe X"** at the end of the month (A4).
- Loading the cloud copy keeps the numbers that were on the device first, with Undo for 3 days (E1).

## What I need from you

Nothing has been deployed. If this reads right, say so and I carry on with the release checks (RESUME.md section 6). If you want me to try it on your own saved copy, export a backup from the live site and load it in the 38.31 build on your computer; your real numbers never need to go into the repo.
