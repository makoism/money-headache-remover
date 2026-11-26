VERDICT: PASS
No figure or receipt was lost or changed unless I chose it. Every money remove asked first. Nothing private left the device. Still open, none of them data loss: Home's behind line, a missing Start again, and one call made with everything off (jobs 5, 8, 11).

CHECK: (full level, 3 at a time, 784 s in all) / ALL GOOD. The check ends ALL GOOD.

OWNER'S WORDS
- M61 MET. Across 16 kinds of change, two tabs, two phones, refused and lost sends, restores and assistant wipes, no figure was lost. KNOWN (IN SCOPE FILE): typing in a sheet is lost when you leave it.
- M62 COULD NOT TELL. I did not look through the repo.
- M63 MET from the page's side. No key appears in any request.
- M64 COULD NOT TELL. It cannot be seen from the build.
- M65 MET for data. The old app's saved data (public/index.html, same device) was not touched by app3.
- M66 MET on the made-up server. A stale write is refused and says so, dated versions are kept and offered, and a delete is marked and the other phone is told. KNOWN (IN SCOPE FILE): the write limit.
- M67 MET. Spends made on two phones apart both joined up.
- M68 COULD NOT TELL. It lives on the server.
- M69 MET.
- Outside my section: M19 MET, M20 MET. M14 (screens) KNOWN (IN SCOPE FILE): "Undo can bring it back until you reload".

COUNT: 8 jobs DONE (1, 2, 3, 4, 6, 7, 9, 10) and 3 STUCK in part (5, 8, 11). 16 kinds of change checked across a reload at once and after 10 s, all 16 the same. Moved could not be tried: it needs a second account. 14 removes and replaces checked. 12 asked first. "Use the other one" is one tap and shows Undo. "Clear" on the error log holds no money.

BLOCKERS: none.

CONFUSING
1. Job 5. Home never says since when and has no way to retry. Steps: cloud copy on, the server refuses (500, 429) or is gone, log a spend. Home, 390 wide, says only "A change is waiting to go to the cloud copy" and later "The cloud copy did not take your last change - it tries again by itself". It has no time and nothing to tap. Settings does say "Changes made since 18:04 are on this device only for now" and offers "Send now". Both screens say it again after a reload. All 4 spends reached the other phone once the server was back. Replace with: "Not in the cloud since 18:04. It tries again by itself" and a Send now button on Home.
2. Job 5. The Settings words lag behind. For about 15 s after a refusal it still says "On. A change made here is waiting to be sent". After a 403, then a 429, it still showed "busy". After the network was cut it still said "does not accept this code any more" until a reload.
3. Job 8. Start again is not on any screen. A person cannot wipe the device and set up fresh.
4. Job 11. With the cloud copy off and the assistant never used, the page still calls GET /api/health at its own address. Nothing private is sent, but the job asks for no calls at all.
5. Job 6. After two restores, Settings lists two kept copies with the same words: "Before a backup was restored, 25 Nov 18:08" and "... 18:08. Kept until you drop it". You cannot tell which is the first numbers. Putting back the older one did bring the first numbers back, also after a reload. Add what each copy holds, for example "3 spends, bank ¥286,000".
6. Job 2. In two tabs, a stale save closes the sheet and throws away what was typed: "Nothing was saved, because this changed somewhere else while it was open". It should stay open with the typed amount and show the new value.
7. Phone B's day is earlier than the day phone A checked the bank. Home on B reads "checked -1 days ago, on 25 Nov". Steps: phone A on 25 Nov, cloud copy on; phone B joins with ?today=2026-11-24.
8. Job 7. The new phone screen, "Type the cloud code from your other device, or restore a backup file", never says where to find the code ("Settings, Cloud copy, Show code"). It also never says what happens when both are gone. That is said once, at turn on: "It is the only way to open the cloud copy ... Nobody else can get it back for you."
9. The restore preview says "2 things here now are not in it (money in or out: 1, other: 1)". It does not count a bill that was changed after the backup (Rent 72,000 to 80,000). The restore does set it back.

POLISH
- Close this loan asks "Close LoanR? It leaves your plan". After Yes it says "LoanR still owes money. Tick its last payment at Check your bank first". It should check first, then ask.
- The assistant was told "delete everything" and also tried to remove the pay. The card leaves that step out and says nothing about it.
- Old unanswered "Do it" cards stay tappable after a reload. One I tapped late was refused in plain words ("Not changed ... changed somewhere else"). That is safe.
- d.errs: "console: Failed to load resource: ... 404" each time the cloud copy is turned on (the first read finds nothing).
- Earlier versions shows only "Sent 24 Nov, 16:00" for each one, with no hint of what is in it.

FOR MAKO'S EYE: Delete the cloud copy is one tap on the Turn off sheet. That sheet explains it well, and the money on the device stays.

What passed: closing the browser mid-setup kept everything, chat and screens alike, and unsaved parts said "Not saved yet". Moving to a new phone by code matched every figure, also after a reload. "Which to keep" kept the other version, and "Use the other one" worked after a reload on both phones. Restore asked first with counts, matched the backup line for line, and Put it back worked after a reload. A backup from a phone whose clock ran 4 months fast restored exactly, and later edits held. Newer, damaged, wrong-format and non-backup files were each refused in plain words with nothing changed. Assistant removes, a spend over safe to spend, a bank set to 0 and a pasted statement carrying instructions each waited for "Do it". Undo after a reload brought every figure back. Requests with everything on went only to the page's address and the assistant's (made-up) relay. No code, invite word or key was in any address. The cloud body was encrypted.

Tested with the made-up AI (fake_ai_page.js) and the made-up server (fake_vault.js), not the real ones.

NOT CHECKED
- A cloud copy saved by a newer page: I could not make an encrypted one without the code's internals. Only files were tried.
- Typing lost when leaving a sheet: KNOWN, not walked again.
- The daily write limit, and the AI cap on the server.
- iPhone browser.
- Moved between accounts: it needs a second account, which cannot be added after setup (scope).
- Remove of a goal or card: not built (scope).
- Phones more than one day apart while both are syncing.
