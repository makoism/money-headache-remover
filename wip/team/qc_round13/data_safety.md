PASS

verify.sh (last ten lines, /tmp/qc_build/verify.txt):
== screens do no money maths
screen maths: 0 open (amounts 0, percents 0), 4 allowed with a reason, 63 files read
PASS screens only show what the model worked out
within the limit (0 of 0). The limit only ever goes down; the goal is 0.

== golden screens against tests/qc/golden/3831zf.json
golden screens: 14 plans, 0 screens differ
PASS no screen changed

VERIFY OK

cloud_move.js: CLOUD MOVE PASS / cloud_fail.js: CLOUD FAIL PASS

Jobs (412x915 phones, made-up server, screens only):
1. Move to another phone: DONE. Home, Plan (Month, Burrows, All months) and Receipts on B match A, including bank 123,456, rent 41,000 and 3 receipts.
2. Welcome gone: DONE. Settings, "I have a code", "Found your copy", Load. The figures match.
3. B already has numbers: DONE. "Careful: this cloud copy is older than the numbers on this device (last changed 22 Nov, 6:04 PM)." After a reload: "You can undo until 25 Nov 2026." Undo gave back rent 39,000 and bank 77,777.
4. Backup and restore: DONE. "Tap again: replaces your numbers and 2 receipts here with the backup from 22 Nov, which has 1 receipt." The figures match the backup. Undo gave back the changes.
5. Lost code: DONE. "Any phone or browser that has your numbers shows it again under Settings, Cloud copy, Show code. If you lose the code and every device, nobody can open the cloud copy, and only a backup file brings your numbers back."
6. Send failed (500 and no signal): DONE. Home and Settings say "Changes made since 22 Nov, 6:06 PM are on this device only." and show Send now, also after a reload. When the server is back, the line goes away.
7. Reset: DONE for "Set all to zero" and "Restore samples". It asked first ("clears pay, bills, goals, saved amounts and your balance. Receipts stay."). After a reload: "Your numbers were set to zero. You can undo until 25 Nov 2026." Undo gave back every figure.

BLOCKERS
None.

CONFUSING
1. Settings, Cloud copy, 412: "Turn off" asks only "Tap again: delete the cloud copy". It does not say what is lost. Replace with: "Tap again: deletes the cloud copy. Your other phones stop getting changes and your code stops working. The numbers on this phone stay." (turnoff.png)
2. The header still says "Saved in this browser" when the cloud copy is on and when it is behind (pack 412-panel-10, -11, -14). Use a small cloud picture: with a check when sent, with a warning mark when behind. Words: "Saved here and in your cloud copy" / "Cloud copy behind".
3. Welcome, 412: after you tap "Enter your recovery code" that line disappears. Only a box showing "MHR-XXXX-XXXX-XXXX-XXXX-XXXX" is left. Keep a label: "Your recovery code (on your other phone: Settings, Cloud copy, Show code)". (j1_B_found.png)
4. Settings, Restore: you choose a file, then have to tap "Load text". Rename it "Load backup". "Restore samples" sits next to it, where a person looking for their backup will tap. Move it to "Reset and setup".
5. Home, 412: after you type your own bank and rent, it still says "Your burrow Sample numbers" and "These numbers are made up". That reads as if your numbers were not kept. Say "Some numbers are still samples".

POLISH
1. The backup file is called "mhr2000-2026-11-22.json". Name it "burrow-backup-2026-11-22.json".
2. "Show code" on a device that already saved its code repeats "So save it now ... then tap I saved it".
3. Visual first: "On. Last sent 22 Nov, 6:06 PM." and the "behind" card use words only. A cloud with a coin going up (sent) or stuck (behind) would show the state at a glance.

Test note (not about the build): on file:// with real.js, storage is gone after a reload, even a key set by hand. Jobs 4 and 7 were redone on the local server, where it is kept.

Files: /tmp/qc/data/ (job123.log, job6.log, job4_http.log, job7_http.log, j3_warning.png, turnoff.png, j1_B_found.png).
