# Data safety, QC round 4, 38.31 (/tmp/qc_build/build.html)

The task named no role, so I took Data safety (the qc-data-safety brief) because no other reviewer had it. Before choosing, I had read the tops of RESUME.md and HANDOFF.md, so I am not fully fresh. Writing /tmp/qc/data-safety-unassigned/REPORT.md was refused by the tool, so this reply is the only copy of the report. Scripts are in /tmp/qc/data-safety-unassigned/ and screenshots in /tmp/qc/data-safety-unassigned/shots/ (412x915, dpr 2).

verify.txt, last ten lines:
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

## Jobs
1. Move numbers to another phone (welcome screen): DONE. Home, Receipts, Plan Month, Burrows and All months matched A figure by figure, also after a reload.
2. Welcome screen gone (Settings, I have a code): STUCK. The figures matched after Load and were gone after reopening (blocker 1).
3. Second phone already has numbers: the warning is DONE ("Careful: this cloud copy is older than the numbers on this device..."). Undo right away is DONE. Undo after a reload is STUCK, because after the reload the loaded copy is already gone (blocker 1).
4. Backup and restore: DONE. It asked first, every figure matched the backup and Undo worked after a reload.
5. Lost recovery code: DONE (Show code). See confusing 2.
6. Send failed (500 and no signal): DONE. Home and Settings both say "The cloud copy is behind. Changes made since 20 Nov, 7:03 PM are on this device only", it is still there after a reload, Send now is offered, and the line goes away once the send works.
7. Reset by mistake (Set all to zero, Restore samples): DONE. Both ask first, say what is lost and say "Receipts stay", and Undo works after a reload.

cloud_move.js: `CLOUD MOVE PASS`. cloud_fail.js: `CLOUD FAIL PASS`.

Also checked:
- Upgrade from the live 38.28 file (public/index.html) to this build at the same address: pay, bills, the burrow's saved amount, both receipts and the bank all kept.
- Back, and closing mid-setup: the typed values are kept.
- Two tabs: both receipts kept ("Updated from another tab.").
- Deleting a receipt, Reset month, Remove goal and Guided setup: each asks first, and Undo works after a reload.
- No API key or secret in the build or the tracked files.

## BLOCKERS
1. A cloud copy loaded from Settings onto a device that already has a saved plan is lost when the app is opened again. That device's old plan then overwrites the cloud copy. Repeated in 6 runs, with both a sample plan and the person's own plan.
   - Steps on B: tap Finish later (or have your own plan). Then Settings, Cloud copy, I have a code, type A's code, Find my copy. It says "This device has no numbers of its own yet, so nothing is replaced." Tap Load: it says "Done. Your numbers are on this device", and Home shows A's "$1,250.40".
   - Reload B 8 or 30 seconds later: Home shows "Your burrow Sample numbers" with "¥110,000" (or B's own "$700"). Settings still says "On. Last sent 20 Nov, 6:35 PM."
   - B has sent that plan to the cloud. A third phone that enters the code reads "has 0 receipts in it"; A's copy had 2. A's Home then offers "Newer copy in the cloud ... Tap Load it".
   - If phone A is the lost phone, the numbers are gone for good.
   - The welcome-screen path on an empty phone and Home's "Load it" both kept their figures after a reload. Only this path fails, and Settings' iPhone text sends Home Screen app users down exactly this path.
   - Screenshots: shots/job2b-loaded.png, job2b-B-after-reload.png, job3b-B-home-after-reload.png, job2d-A-reopen-top.png.

## CONFUSING
1. Home, "Newer copy in the cloud. Saved from another device on 20 Nov, 6:40 PM. Tap Load it..." does not say what the copy holds. Suggested: "Newer copy in the cloud, saved on another device 20 Nov, 6:40 PM: 0 receipts. This device: 2 receipts."
2. Settings, recovery code: "It cannot be looked up again if you lose it and lose this device." It does not say what that means. Add: "Then nobody can open the cloud copy, and only a backup file brings your numbers back."
3. Plan, Burrows, Edit goal, Remove goal: "Tap again: removes Emergency fund and its $835 saved." The same card says "Saved so far: $500. Plan adds $335 in Nov." Suggested: "removes Emergency fund, $500 saved and $335 planned this month."
4. Settings, Guided setup over a saved plan: tapping only Next changed the plan. Education went from $200 back to $330, and "$130 not placed yet" disappeared. It asked first and Undo works, but the Split step starts "at the usual shares", not at the person's split. Start from the current split, or say "Next puts the usual shares in place of yours."
5. After reopening, the bar "A backup replaced your numbers. You can undo until 23 Nov 2026." goes away after about 25 seconds, and nothing offers Undo until the next open. Put Undo in Settings next to "kept for 3 days".

## POLISH
1. The header says "Saved in this browser" even when the cloud copy is on, and also when it is behind. Visual first: show a small cloud there with a tick, or a clock when it is behind.
2. Setup's balance box shows "1250.4" after Back for a typed "1250.40".
3. tests/wrangler.invite.toml in the public repo has `INVITE_CODES = "local-test-invite,fam"`. Confirm "fam" is not a live code.

## Waiting for Mako's full run (not failures)
Q1 (Home has no "they add up" line), Q4 (Home's first screen is text), whether Check your bank should change the figure the plan starts from, counting a card in the month it is paid, how short-month fixes should work across months, one word for "short", the borrowed row's percent beside places past 100. None of these are on my list.

VERDICT: FAIL