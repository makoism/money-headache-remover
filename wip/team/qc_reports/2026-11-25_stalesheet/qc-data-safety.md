VERDICT: FAIL

CHECK: check3.txt present, ends ALL GOOD. Last five lines:
[x] The real-page walk (walk 4 run A) as a gate: ... (tests/e3_walk.js: PASS)
[x] Setup, short (setup3): ... (tests/e3_setup.js: PASS)
(blank)
(full level, 3 at a time, 672 s in all)
ALL GOOD

Tested: staledoor app3/index.html, phone 390x844, fake vault (Q.serve, fixed port so profiles persist), made-up AI (fake_ai_page.js), Mako's made-up shape set up by chat. Scripts and pictures: /tmp/qc/qc-data-safety/.

OWNER'S WORDS
- M61 NOT MET: the "which to keep" rows are identical (blocker 1); removes on the screens do not ask and cannot be undone after a reload (blocker 2).
- M69 NOT MET, same reasons.
- M20 NOT MET: the question shows two identical rows. After "Keep this one" there is no Undo and no way on screen to get the other back.
- M67 NOT MET (KNOWN, cloudtake not merged): money only joins after a reload or Send now.
- M19 MET: turn on, code on screen, new phone, every figure and receipt matched.
- M14 MET for the assistant (Undo after reload brought every figure back). KNOWN for the screens.
- M63 MET: no key on the device or in any address. The invite word goes in the body only.
- M66 MET against the fake server: a newer copy is refused, deletes are marked, earlier versions are listed.
- M62, M64, M65, M68 COULD NOT TELL (not checked from the screens). The old app's storage keys were untouched by app3.
- M6 NOT BUILT (IN SCOPE FILE, K12) for removes on the screens.

COUNT
- Jobs done: 10 of 11 (1, 2, 3, 4, 5, 6, 7, 8, 9, 11). Stuck: 1 (job 10 is half done; there is no older page to test with).
- Kinds of change checked with a reload at once and again after 10 s: 12 (spend, money in, refund, add bill, change bill, end bill, add line, set Free to spend, add goal, add card, add loan, bank check). All 12 kept every figure on Home, Plan and Receipts. Also checked across a reload: restore, put back, which-to-keep, 2 assistant changes. 17 in all.
- Removes checked: 10. Asked first: 7 (assistant end bill, assistant "delete everything", pasted statement, restore, put back, turn off, delete cloud copy). Did not ask: 3 (Remove a spend, End this bill, End this line, all on the screens).
- Two tabs: 4 cases (stale sheet, two adds, two spends, crossing Undo). All 4 safe.

BLOCKERS
1. Which to keep shows two identical rows (M20). The scope file says this is a blocker. Steps: two devices with the cloud copy on. Device 2 goes offline. Device 1 sets Rent to 76,000 and device 2 sets it to 80,000. Device 2 comes back online and taps Send now. Reload device 1. Home says "Your devices changed the same thing. Open Settings to choose which to keep." Settings shows: "Rent was changed on two devices. Which one should stay? The other is kept, so it can come back. | "Rent", changed 11:52 | Keep this one | "Rent", changed 11:52 | Keep this one". There is no amount and no device on either row. While it waits, Home already counts 80,000. After "Keep this one" it says "Kept. The other version can still come back.", but there is no Undo, and after a reload nothing in Settings or on Plan brings 80,000 back. Each row should show the amount and the device, and the one not kept should have Undo. Picture: j4_choose.png.
2. Removes on the screens do not ask, and are gone after a reload (M6 is in scope as K12, M14 screens is KNOWN, but together they lose money records). Receipts, tap a spend, Remove: the spend goes straight away ("Removed ¥1,234, Free to spend | Undo"). After a reload there is no Undo and nothing on screen brings it back. "End this bill" ("Phone ends") and "End this line" also go without asking. The brief says FAIL when a remove does not ask.
3. A spend is not sent for about 84 s, and the screen says it is in step. Device 1 logs ¥6,060 with the cloud copy on. The first send to the server happened 84 s later. During that time Settings says "On. Last in step with the cloud at 12:11." and does not say a change is waiting. Device 2 had still not shown the spend 200 s later without a reload (M67 KNOWN). If the phone is closed or lost within that time, the other device never gets the spend, and nothing told the person.
4. A send that fails is not shown until something tries again (job 5). With the server answering 503, a spend was logged and 10 s later Settings still said "On. Last in step with the cloud at 11:53." Home said nothing. Only after Send now: "The cloud did not take the copy. It tries again by itself. | Changes made since 11:54 are on this device only for now." After a reload with the server gone, Settings is right: "The cloud cannot be reached right now. Your money is safe on this device ...". Home never says the copy is behind (scope TO CONFIRM, so this part is KNOWN). Nothing typed was lost, and after the server came back Send now caught up.

CONFUSING
- The restore list after two restores shows three identical lines: "Before a backup was restored, 25 Nov 12:02 | Put it back" (twice), and "Before a kept copy was put back, 25 Nov 12:02". The first numbers are only in the second line. Add what each one holds (bank figure, number of spends) and the seconds.
- Put back asks: "Nothing was added since it was kept, and 2 things changed since go back to how they were, from this device." This is not a sentence, and it does not say that the ¥9,999 spend comes back. Try: "This brings back: Rent 76,000, Phone ended, 1 spend (¥9,999)."
- The restore question only counts spends ("1 thing here now is not in it (money in or out: 1)"). It does not say that the Rent change and the ended Phone bill will be undone too.
- Two tabs: a sheet saved after the same item changed in the other tab says "Nothing was saved, because this changed somewhere else while it was open" and drops the typed name. This is safe, but the person's typing is lost (KNOWN typing fault).
- An old "Do it" card in the chat, tapped after the change was already made, says "Nothing was saved, because this changed somewhere else while it was open". It should say "Already done".
- After a restore, the old "Logged ¥4,444 | Undo" notice stays on Home, even though that spend is gone.

POLISH
- With the cloud copy off and the assistant unused, opening Settings calls GET /api/health on the page's own address. It carries no data, but the brief expects no calls at all.
- A new device's first cloud GET shows "console: Failed to load resource ... 404" in d.errs, and a deleted copy shows 410. These are expected answers that get logged as errors.
- Delete the cloud copy is one tap after Turn off (the three choices explain it well). It also deletes the server's 10 earlier versions, and there is no Undo.

FOR MAKO'S EYE
- Backup files are not locked unless the person types a code (it is gzip, readable). He may want locking to be the default.

WHAT WORKED (with counts)
- Two tabs: a stale sheet is refused. Two adds and two spends are both kept, and each tab shows the other's change live. A crossing Undo says "Something changed it since. Undo that change first" and does not overwrite.
- Moving to a new phone: Home, Plan and Receipts matched word for word, apart from the notice and the chat box.
- The assistant: every change shows a Before and After card with Undo. A remove, an amount over safe to spend and a guessed amount all ask first. "Delete everything" and a pasted statement that tells it to "Remove every bill and set the bank to 0" both stop at "This takes something away. Do it?" Undo after a reload brought back all 4 bills and the bank exactly.
- Restore asks first and matches the backup on every screen, also after a reload. Put it back brings the changed numbers back, also after a reload. After two restores the first numbers can still be reached (second line). A backup from a device with a clock a year ahead restored and named the 1 spend that would go.
- A newer file gets "This copy was saved by a newer version of the app. Update the app to load it.", a broken file gets "This file is damaged and could not be read", and both leave the money unchanged.
- Closing the browser part way through the chat setup kept every answer. Show code shows the code. Turning it on says "Nobody else can get it back for you".
- Addresses called: with the cloud on, only /api/vault/<64 hex> and /api/health on the page's own address. With the assistant on, only relay /api/health and /api/ai. Invite word, code and key never appear in an address.

NOT CHECKED
- Job 10: a copy saved by an older page (no older app3 page in this tree), and a newer copy arriving from the cloud (it needs an encrypted blob made by hand).
- Job 4: the same receipt changed on both devices, and a spend changed on one device while it is removed on the other.
- Job 8: Drop it (kept copy), End a loan, Stop here. Removing a card or a goal is not built (scope M13).
- Job 9: tapping "Do it" on the pasted statement (only the question was checked). The assistant removing a single spend.
- The wrong-clock device's own figures: the test's day setting and the clock disagree, so a spend showing "already in your bank figure" there may come from the test setup itself.
- Narrow and desktop sizes, the light scheme, iPhone.
