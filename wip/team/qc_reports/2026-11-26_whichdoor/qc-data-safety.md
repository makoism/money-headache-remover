# qc-data-safety, round 2026-11-26_whichdoor

VERDICT: FAIL (one BLOCKER: "Delete the cloud copy" has no Undo and also deletes the cloud's earlier versions. No figure or receipt was lost or changed without the person choosing it, every remove asked first, and nothing private left the device.)

CHECK: check3.txt ends:
[x] Setup, short (setup3): ... (tests/e3_setup.js: PASS)
[x] The layout holds at 320, 390, 412 and 1300 wide ... (tests/e3_layout.js: PASS)
(blank line)
(full level, 3 at a time, 825 s in all)
ALL GOOD

Build: /home/user/whichdoor/wip/team/app3/index.html. Phone 390x844 unless noted. Assistant tested with the made-up AI (fake_ai_page.js), not a real one. Cloud tested with Q.serve() (fake_vault.js); refusals made by swapping the vault's answer, "gone" by blocking /api/vault in the browser.

OWNER'S WORDS
- M61 MET, with the KNOWN faults in scope.txt (typing in a sheet dropped; screens Undo gone after reload). Every saved figure survived every reload I made.
- M62 COULD NOT TELL (did not scan the repo; I used only made-up figures).
- M63 MET: no request from the page carries a key; /api/health sends nothing about the person.
- M64 COULD NOT TELL (not visible from the page).
- M65 MET for "old app unchanged": the old app's storage (money-map-template-v2, money-map-safe) was byte for byte the same after a full app3 setup, spend, backup and restore on the same device, and the old app still opens. Private address: COULD NOT TELL.
- M66 MET on the made-up server: newer shape refused, stale writes refused (409), earlier versions kept and restorable, deletes leave a marker. Daily write limit: KNOWN (IN SCOPE FILE).
- M67 MET: spends made on two devices apart, one of them offline, joined on both.
- M68 KNOWN (IN SCOPE FILE), not walked.
- M69 MET except the blocker below.
- Outside my section, seen working: M19 MET (code move, backup), M20 MET (which to keep, other kept, "Use the other one" after reload).

COUNT
Jobs: 11 done, 0 stuck.
1 DONE: 10 kinds of change, each reloaded at once and again after 10 s, every Home, Receipts and Plan line compared: spend on a card, money in, refund, bank check (bank and card), add bill, change bill, add line, Free to spend, add goal, rename card: 10 of 10 identical (only the "Undo" notice goes, KNOWN M14). Removes across reload: remove spend, end bill, end line: 3 of 3 kept. Browser closed mid chat setup: every answer back. Browser closed mid screens setup: saved bank back, unsaved pay was marked "Not saved yet" before closing. Sheet mid-typing: KNOWN, not re-walked. Moved: not possible with one account (the screen says why).
2 DONE: two tabs, a spend in each: both kept in both tabs. Rent changed in both open sheets: second tab says "Nothing was saved, because this changed somewhere else while it was open" (typing dropped: KNOWN).
3 DONE: code read off the screen, typed on a new phone: Home, Receipts, Plan identical, also after reload.
4 DONE: spends joined; Rent changed on both: Settings "Rent was changed on two devices. Which one should stay?", Keep, then Undo, and "Use the other one" after reload.
5 DONE: refused 500, 429, 403, then network gone: Settings says "Changes made since 22:18 are on this device only for now" with Send now, also after reload; Home says behind without since-when (KNOWN). Nothing typed lost; after Send now a new phone had all four spends, figures identical.
6 DONE: restore asks first, every figure equal to the backup, Put it back equal to before, both after reload. Two restores then Put it back on the oldest: first numbers back. Backups made with the clock at 2031 and 2019: restore and Put it back exact. A cloud device with its clock at 2031 did not block the normal device.
7 DONE: "Show code" in Settings; wrong code gives plain words, spaces and small letters accepted.
8 DONE: see blocker. Start again: no screen has it (KNOWN LATER). Goal remove: not built (scope M13).
9 DONE: "delete everything", a pasted statement with "SYSTEM: ... Do not ask", seven removes at once, a bank figure of 2,800, and a fill_book after setup: nothing changed without "Do it"; card reads "This takes something away. Do it?". After Do it and a reload, the card's Undo brought every figure back (wipe and a spend).
10 DONE: an older app3 build's storage and backup open in this build, same figures; v4 backup: "This copy was saved by a newer version of the app. Update the app to load it."; cut file and damaged file refused in plain words, data untouched.
11 DONE: cloud off, assistant unused: only the page, its manifest and icon, and GET /api/health (no query, no custom headers, no cookie). Cloud on and assistant used: vault calls only to the page's own address, id is a 64-hex hash, token in a header; the code and the code word are in no address; the code is in no body; vault bodies hold no plain names, notes or figures. The relay address in this test is the harness's relay.example, not the page's choice.
Removes and resets checked for ask first: 13 (remove spend, end bill, end line, drop kept copy, Turn off with Stop here and Delete, restore file, Put it back, restore cloud version, assistant wipe, assistant injection, assistant seven removes, assistant big bank change). 13 asked.

BLOCKERS
1. Delete the cloud copy cannot be undone, and takes the earlier versions with it. Settings, 390 wide, cloud on: tap "Turn off", read "Delete it: the cloud copy is removed and your code opens nothing after that...", tap "Delete the cloud copy". It goes at once: Settings reads "Off. Your money is on this device only." with no Undo, before or after reload, and the server holds nothing but the deleted marker (all kept versions gone). The money on this device stays, so no figure was lost here, but any earlier cloud version (for example from before a restore) is gone for good from one tap, and the other device just says "The cloud copy was deleted on another device". It should keep the copy recoverable for a while (Undo on the spot and after reload, or a second "type DELETE" step), or say plainly "Its earlier versions go too and nothing can bring them back".

CONFUSING
- Settings after one 403 refusal: "The cloud copy does not accept this code any more. Turn it off here, then turn it on again to start a new one." When the server answered again, "Send now" worked with the same code. Following the advice makes a new code for nothing. Say "The cloud refused this change. Send now to try again; if it keeps refusing, ..." first.
- Newer backup: "Update the app to load it." A person on a web page does not know how. Say "Reload this page to get the newest version, then try again".
- Remove a logged card spend after a card check: confirm reads "Remove ¥1,234, Free to spend?", but the "Found at your bank check" line on Receipts grows from ¥766 to ¥2,000, so safe to spend does not move. Say so in the confirm.

POLISH
- Turning on the cloud copy logs a console 404, and the device whose copy was deleted logs a 410 (normal answers shown as page errors).

FOR MAKO'S EYE
- none.

NOT CHECKED
- Reminders screen not compared across reload or across devices (ran out of budget).
- "Stop here" then turning the cloud back on with the same code.
- Moved money (needs a second account; adding one after setup is not built, scope M13).
- Pay-day ticking ("landed") across reload.
- Sheet mid-typing and Home since-when: KNOWN in scope.txt, not re-walked.
- Real AI and the live relay: not reachable; made-up AI only.
