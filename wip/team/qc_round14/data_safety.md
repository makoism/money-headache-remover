(QC round 14 data safety, on the build staged from c45f8d0. Copied from the reviewer's reply.)

PASS

verify.txt, last ten lines:
== screens do no money maths
screen maths: 0 open (amounts 0, percents 0), 4 allowed with a reason, 63 files read
PASS screens only show what the model worked out
within the limit (0 of 0). The limit only ever goes down; the goal is 0.

== golden screens against tests/qc/golden/3831zg.json
golden screens: 14 plans, 0 screens differ
PASS no screen changed

VERIFY OK

Jobs (real browser, screens only, 412x915, made-up local server):
1. Move to another phone: DONE. On phone A I changed the balance (¥91,234) and logged receipts (¥1,234, ¥777), walked the four steps and read the code off the screen. Phone B: "Enter your recovery code", "Find my copy", "Load". Every figure on Home, Plan and Receipts was the same on both phones.
2. Welcome gone: DONE. Settings, "I have a code". Same figures, also after reload.
3. Second phone has numbers: DONE. B warned "Careful: this cloud copy is older than the numbers on this device (last changed 22 Nov, 9:45:56 PM)". After "Load the older copy anyway" and a reload: "The cloud copy replaced the numbers on this device. You can undo until 25 Nov 2026." Undo brought back every B figure, also after reload.
4. Backup and restore: DONE. It asked "Tap again: replaces your numbers and 4 receipts here with the backup from 22 Nov, which has 3 receipts." The figures matched the backup. Undo after reload brought back the changed numbers.
5. Lost code: DONE. Settings, Cloud copy, "Show code" shows the same code after reload. The screen says "If you lose the code and every device, nobody can open the cloud copy, and only a backup file brings your numbers back."
6. Send failed: DONE (server set to '500' and to 'drop'). Home and Settings both said "The cloud copy is behind" and "Changes made since 22 Nov, 9:47 PM are on this device only.", also after reload, with "Send now" on screen. With the server back, Send now cleared both.
7. Reset: DONE for "Set all to zero" and "Restore samples". Both warn first ("Tap again: clears pay, bills, goals, saved amounts and your balance. Receipts stay. You can undo for 3 days."). Undo after reload brought back every figure.
cloud_move.js: "CLOUD MOVE PASS". cloud_fail.js: "CLOUD FAIL PASS".

BLOCKERS
None.

CONFUSING
1. Home, 412x915, cloud copy behind (checked twice, also after reload): the header at the top, which is always on screen, still says "Saved in this browser". The "The cloud copy is behind" card is 1697 px down, about two screens below the top, after "Sample numbers". Replace the header text in that state with "Cloud copy behind, tap to send", and move the card above "This month".
2. Settings, Restore, after picking a file with "Choose file": the next button is "Load text". The person picked a file, not text. Rename the button "Load backup" and change the list line to "Tap Choose file and pick your backup. Then tap Load backup, and tap it again to confirm."
3. Home, phone B after loading an older copy: "Undo also stops sharing the cloud copy on this device." does not say whether the cloud copy changes. Replace with "Undo puts your old numbers back here. The cloud copy stays as it is, and this device stops using it."

POLISH
1. Settings, "Set all to zero" and "Restore samples": the 19-word "Tap again" text goes back to the plain label after 3 to 4 seconds, with no sign (still armed at 3000 ms, plain at 4000 ms). Keep it armed for 8 seconds, or show a shrinking bar.
2. Visual first: the cloud copy state ("On. Last sent 22 Nov, 9:43 PM.", "The cloud copy is behind") is words only. A small cloud with a tick next to the header status, or with a waiting dot when behind, would show it at a glance.
3. Visual first: "Found your copy" says only "has 2 receipts in it". A small picture of the copy's pay, bank and burrow piles before "Load" would show the person it is theirs.

Screenshots: /tmp/qc/data/j3-B-found-warning.png, /tmp/qc/data/j6-home-behind.png, /tmp/qc/data/j6-home-behind-notice.png, /tmp/qc/data/j4-load1.png, /tmp/qc/data/j7-Set_all_to_zero-confirm.png, /tmp/qc/data/j5-show-code.png.

Report file: /tmp/qc/data-safety/REPORT.md. My working screenshots are at deviceScaleFactor 1, not 2. The test runs tried to reach the live relay host money-headache-remover.mako-162.workers.dev, and the proxy refused it. The build contains that address as RELAY_URL. No numbers left the machine.
