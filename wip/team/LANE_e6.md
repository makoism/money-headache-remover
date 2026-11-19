# Lane E6: the month window is a view only, nothing is trimmed

Side lane J, 2026-11-19. Branch `side/e6-window-test`. No app file was changed. This note is for the main session: the fix, written out, and the test that proves it.

## In one paragraph

Today the app knows 24 fixed months, Nov 2026 to Oct 2028 (`model.js` line 3). When a saved copy loads, anything dated outside those months is deleted, and the next save writes the smaller copy over the full one. Nobody is hurt yet, because the screens only let a person type inside those months. The day the window moves (PLAN.md step 11), every month that leaves it would be deleted on the next load. One loss is live today: importing statements or receipt photos drops every row dated before Nov 2026, so three months of bank statements uploaded this week lose all rows from August to October.

## The test

`tests/qc/e6_window.js`. Pure node, no browser, no setup, about 0.1 seconds. Made-up numbers only.

```
node tests/qc/e6_window.js
```

It loads the real `model.js` and `stmt.js`, and cuts the real load code out of `ui0.js` by name (`normalize`, `upgradeLegacy`, `todayStr`) and the real import check out of `ui46.js` (`askClean`). Nothing is copied by hand, so it follows the app. Each loss prints as `LOSS <function>: <what> [<which plan>]`. It ends with `E6 WINDOW PASS` or `E6 WINDOW FAIL n`.

| Part | What it proves | Today |
|---|---|---|
| A | One load keeps months, one-time costs, repeating items, receipts, goal dates and loan ends outside the window | FAIL, 10 losses |
| B | Load, save, reload three times keeps the same; the saved text settles | first check FAIL, second passes |
| C | Two copies shaped like older versions keep the same. If `tests/next/fixtures` is in the checkout, side C's 19 real old-build copies run too | FAIL |
| D | The device clock jumps forward two years, the page saves, the clock goes back: nothing lost, every month the same to the cent, the saved text the same | 4 of 5 FAIL |
| E | A plan that already runs past Oct 2028 keeps everything | FAIL |
| F | Import keeps every row whatever its date; the statement setup too | first FAIL, two pass |
| G | Repeating spending never skips a due date for good | FAIL |
| H | Keeping the outside months changes no figure and no receipt total inside the window | passes (guards the fix) |

Today: 47 losses printed, 10 checks fail, 9 pass. With the fix below applied to a scratch copy: 0 losses, 19 of 19 pass (20 of 20 with side C's fixtures in place).

Moving the window: the test uses `setToday(ymd)` in `model.js` if it exists (the hook side C named in `tests/next/lib.js`). Until then it rewrites the `START` and `END` line in memory only. If that line changes shape and there is no `setToday`, the test stops with a plain message naming `WINDOW_LINE`.

To try a fix before it goes into the app: `E6_MODEL=/path/model.js E6_UI46=/path/ui46.js node tests/qc/e6_window.js`.

### Built on side C, not written twice

Side C's `tests/next/window_fuzz.js` (branch `side/after-v1-tests`) is the random half: 300 random plans over a moving window, and it needs the window to be built (`setToday`). It also checks that today's month is always shown, which E6 does not. This test is the fixed, named half: it runs today, without the window, and names the function for each loss. It reuses side C's fixtures by name when they are present and side C's hook name. Branch `side/ledger-design` does not exist on the remote yet, so nothing was read from it.

## Every place that trims

Line numbers are for `wip-38.31` at `dca351d`.

### Part 1. Trimmed on load or import. The test fails on each of these.

| # | Where | What it drops | Smallest fix |
|---|---|---|---|
| 1 | `model.js:875` `cleanOnce` | every amount typed for a month outside the window | `if (!YM_FORM.test(ym) \|\| !isMap(raw[ym])) return;` |
| 2 | `model.js:884` `cleanItems` | every one-time cost in a month outside the window | `if (!YM_FORM.test(ym) \|\| !Array.isArray(raw[ym])) return;` |
| 3 | `model.js:972` `cleanRecurring` | rewrites a start date before the window to the window's first day, on every load | `const from = r.from;` (the next line already rejects a bad date) |
| 4 | `model.js:1079` `applyRecurring` | skips a due date outside the window, then marks the item as done up to that date, so it is never logged | drop the window test: `ds.forEach(d => { if (addReceipt(S, d, r.a, r.c, r.n)) n++; });` |
| 5 | `ui46.js:220` `askClean` (import from files and photos, also used by the scan in `ui49.js:229`) | every statement row or receipt dated outside the window. Live today for anything before Nov 2026 | delete the line. `out.outside` stays 0, so the three "dated outside" messages (`ui46.js:288`, `ui46.js:355`, `ui49.js:127`, `ui49.js:231`) simply never show |
| 6 | `model.js:936` `cleanPlan`, through `validDue` (`model.js:260`) | a goal's date outside the window becomes no date | in `cleanPlan` only: `due: validDate(g.due) ? g.due : ''`. Leave `validDue` as it is for typing (`updateGoal`, `model.js:276`) |
| 7 | `model.js:928` `cleanPlan` | a bill's last payment month outside the window; the loan then never ends | `if (typeof l.ends === 'string' && YM_FORM.test(l.ends)) {` |

`YM_FORM` (`model.js:857`) already exists and `cleanSteps` already uses it, which is why amounts that run "from this month on" are not trimmed. Receipts are not trimmed either (`cleanReceipts` checks the date is real, not that it is in the window). Both are checked and pass.

Seven one-line changes, six in `model.js` and one in `ui46.js`. No saved field changes shape, so there is no migration and a rollback loses nothing.

### Part 2. Same family, not in the test. For B1, or the main session's call.

| Where | What happens | Suggested |
|---|---|---|
| `model.js:905` `cleanCfg`, `model.js:80` `basePlan` | `loanLast` (the pre-25 setting for the loan end) is dropped when outside the window | same as fix 7 if a pre-25 copy matters (side C question M6) |
| `ui4.js:80`, `ui6.js:680` | typing a receipt with a date outside the window is refused with a message | not a silent loss; the person sees why. Opens up with the window |
| `ui45u.js:62` | a loan end date read from a statement is dropped when outside the window | keep with the window work |
| `ui4a.js:93`, `ui4a.js:103` | a goal date from the assistant is dropped or ignored when outside | keep with the window work |
| `model.js:255` `updateLine`, `model.js:1023` `addExtraMoney`, `actions.js:87`, `actions.js:96` | an edit for a month outside the window is refused | correct while the window is fixed |
| `ui0.js:72` `todayStr`, `ui6.js:5` `nowYm`, `ui5.js:243` `initialMonth`, `ui46.js:130` `fromYm` | today is pushed inside the window. After Oct 2028 the app would sit on 1 Oct 2028 forever | this is the rolling window itself (H6), not E6 |
| `stmt.js:34` `stmtCleanRows` | a statement row dated more than a month after the device's date is dropped as a misread. With the clock set back, real rows go | leave; it guards against misread years. Worth a line on screen saying how many were set aside |

### Part 3. Not the window, but the same promise ("the app is for life"). Found on the way.

- `model.js:984` `cleanReceipts`: `raw.slice(0, 5000)` keeps the first 5,000 receipts and drops the rest on load. Receipts are stored oldest first, so the newest ones go. At five a day that is under three years. This is a real loss for a lifelong app and deserves its own line on the checklist.
- `model.js:886` at most 60 one-time costs a month; `model.js:876` at most 150 amounts a month; `model.js:966` at most 20 repeating items; `ui0.js:139` the last 160 check-in weeks. Each cuts silently. Fine as guards against a damaged file, but none tells the person.

## What could go wrong with the fix

1. **A damaged or hostile backup with thousands of months.** Fixes 1 and 2 accept any month from 2000 to 2199. Add a cap that a person can never reach by living: `Object.keys(raw).slice(0, 2400)`. The test does not need it.
2. **Fixes 1 to 5 change no number inside the window.** Part H proves it, and `proof_fuzz.js 800 21` and `fuzz_debts.js` pass against the scratch copy. `calcAll` only walks `MONTHS`, and `receiptStats` only counts the month asked for.
3. **Fixes 6 and 7 can change numbers, and that is the point.** No copy saved by any build so far can hold a goal date or loan end outside the window (the screens only offer window months, and `START` has never moved), so nothing changes for anyone today. Once the window moves:
   - a goal whose date has passed out of the window saves nothing more (today it would lose its date and start taking money again);
   - a goal dated after the last month spreads what is missing over all the months to that date, so each month is smaller;
   - a loan that ended before the window stays ended (today it would come back as a bill forever).
   `calcAll` gives finite numbers in all three cases (probed). **Not checked: the screens.** `ui6.js:101`, `ui6.js:108` and `ui6.js:415` use `MONTHS.indexOf(...)` on a goal's date or the month it fills, which is `-1` outside the window. They need one look with a goal dated after Oct 2028 before 6 and 7 ship. If that look is not affordable right now, ship 1 to 5 first: parts A, B, C, D and E then still fail, on the goal date and loan end lines only.
4. **Fix 3 and 4 together can back-fill.** A repeating item whose saved start is before the window and that was never applied would log up to 60 receipts dated before the window on the next visit. No screen can make such an item today (it starts on the day it is made, and is applied at once). The test leaves this open on purpose: it only fails when a due date is skipped and marked done.
5. **Fix 5 logs receipts no screen shows.** A statement row from September 2026 becomes a receipt, is kept in the saved copy and in backups, and counts in no month (there is no September on screen). The review step should say so in one line, for example "3 are from before November 2026. They are kept and will show in Look back when it reaches that far." Wording is the main session's. Check the receipts list does not choke on them; the model does not (`addReceipt` has never checked the window, and the statement setup in `ui45v.js:246` already logs such rows).
6. **`presetIsUntouched` and `planIsSample` (`ui0.js:164`, `ui0.js:175`)** compare a normalized copy with the sample. Kept outside months make a plan count as touched. That is right: the person typed something.
7. **Two tabs or a rollback.** A tab still running 38.31 that loads a copy with outside months trims it again and may save. Same as any old tab; the existing `storedIsNewer` rule and the service worker update cover it no better and no worse than today.

## The check.sh line

Add it together with the fix (before the fix it turns `check.sh` red). It belongs in the fast part, after the proof step, because it takes a tenth of a second and guards saved data:

```bash
step "E6: the month window is a view only (nothing trimmed on load, save or import)"; OUT=$(node tests/qc/e6_window.js 2>&1); echo "$OUT" | grep "^LOSS\|^FAIL" | head -8 | cut -c1-220; echo "$OUT" | tail -1; echo "$OUT" | grep -q "E6 WINDOW PASS" || BAD=1
```

If it should only run in `./check.sh full`, add `qc tests/qc/e6_window.js;` to the long `qc` line instead. Its output fits that helper (`^FAIL` lines and a non-zero exit).

## Expected to fail until the fix lands

Only this one file, and nothing that runs in `check.sh` today:

- `tests/qc/e6_window.js`: 10 of 19 checks (A first, B first, C, D second to fifth, E, F first, G).
- Side C's `tests/next/window_fuzz.js` keeps failing after the E6 fix, on purpose: it also needs the moving window itself (`NOT BUILT` until `setToday` exists).

No existing test was changed or loosened. One thing seen while checking, not caused by this lane: `node tests/qc/fuzz_model.js 3000 11` prints `FUZZ FAIL 1944` on plain `wip-38.31` in a fresh container ("percents sum" lines), the same count with and without the fix. It may need `tests/setup_env.sh`; the main session will know.

## Order of work for the main session

1. Apply fixes 1 to 5 (and 6, 7 after one look at the three `ui6.js` lines).
2. `node tests/qc/e6_window.js` until `E6 WINDOW PASS`.
3. Add the `check.sh` line. Run `./check.sh full`.
4. Tick E6 in LAUNCH_CHECKLIST.md with the commit.
