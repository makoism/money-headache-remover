VERDICT: FAIL

CHECK: no check3.txt (round README: "this is the published page from main 6740469, the build Mako used on 24 Nov"). Not a green check.

Build judged: /tmp/qc/live/index.html, phone 390x844 unless said, made-up numbers, today moved with `today`. Assistant: no AI reachable from a file copy or the made-up server (health says ai: false), so only the "can't be reached" door was tested, not the made-up AI and not the real one.

OWNER'S WORDS
A. M1 NOT MET: Ask is a 32px underlined text link in the header; before setup it says "Set up first". M2 NOT MET: setup is one long form (bank, pay, everyday spending, cards, bills, keep at least, one Save), no chat. M3 COULD NOT TELL. M4 COULD NOT TELL. M5 MET. M6 MET for spends and bills (change, then one-tap Undo); COULD NOT TELL for the assistant. M7 MET. M8 COULD NOT TELL. M9 NOT MET: setup takes no uploads, every figure is typed. M10 NOT MET: Home is seven stacked text cards, no picture. M11, M12 COULD NOT TELL.
B. M13 NOT MET: no way to add, rename or remove a bank; no remove on a card (setup or Plan); no remove on a second income in setup; "Keep at least" cannot be changed after setup. M14 NOT MET: setup has no Undo and Back drops everything typed. M15 NOT MET (see blocker 1). M16 NOT MET: one "Save and see my money" at the end, no section saves. M17 NOT MET at first open ("Set up first"), MET after. M18 NOT MET in setup (no "?" anywhere), MET on Home. M19 MET. M20 COULD NOT TELL. M21 COULD NOT TELL. M22 NOT MET: doors are "Log a spend", "Check your bank", "Spend / Refund / Moved"; no "Money came in". M23 NOT BUILT: one bank only, no e-wallet, cash or pay-later. M24 COULD NOT TELL. M25 MET.
C. M26 MET. M27 MET. M28 MET. M29 COULD NOT TELL. M30 MET. M31 MET. M32 MET. M33 COULD NOT TELL. M34 MET. M35 MET.
D. M36 MET. M37 MET. M38 MET. M39 NOT MET: setup asks "How much lands" but never before or after tax. M40 MET. M41 MET. M42 MET in setup (box empty) but cannot be changed later (M13). M43 MET (goal sheet offers both). M44 COULD NOT TELL. M45 MET in every sum checked. M46 COULD NOT TELL. M47 NOT MET (blocker 5). M48 MET. M49, M50 COULD NOT TELL. M51 NOT MET: "Everyday spending" heading says "This is Free to spend"; "Bank today" shows ¥297,500 under "¥300,000 checked 1 Dec".
E. M52 NOT MET (no pictures). M53 NOT MET (wall form). M54 COULD NOT TELL. M55 MET. M56 NOT MET: setup still says "Everyday spending". M57 COULD NOT TELL (art later). M58 MET. M59 MET. M60 COULD NOT TELL.
F. M61 NOT MET (blocker 1). M62 MET. M63 to M66 COULD NOT TELL. M67 MET (one case). M68 COULD NOT TELL. M69 NOT MET.

COUNT: owner's lines A to F (M1 to M69): MET 27, NOT MET 19, NOT BUILT 1, COULD NOT TELL 22 (M42 counted MET, its gap is under M13). Jobs 8 of 8 tried: 5 DONE (3, 5, 6, 7, 8), 3 STUCK (1, 2, 4).
1 STUCK: the way in is a form, not the assistant (section A). On the screens alone it finishes only if every added row is filled.
2 STUCK: pay DONE (Plan sheet), bill DONE ("End this bill", stays listed "ended"), bank STUCK, card STUCK (no remove), keep at least STUCK.
3 DONE: typed ¥287,500, Home shows it "checked today, on 1 Dec", same after reload.
4 STUCK: add and "after your cards are paid" figure fine; cannot remove the card.
5 DONE: logged with an amount, a note and one tap on Receipts (well under 60 seconds), search found it, typo fixed, Remove, Undo brought it back.
6 DONE: 12 Dec, Home says "Pay not in yet", counts the late Phone and card; confusing (below).
7 DONE: second device with the code shows the same figures.
8 DONE: backup, change, "Restore it", "Put it back" returns the change.

BLOCKERS
1. Empty bill traps; the only exit loses everything. Setup, phone: tap "Add a bill", type a name, leave Amount empty, "Save and see my money": "Type the amount of Bill". No Remove on the row. "Back" goes to the welcome card and the bank, pay and cards typed are gone (box empty on return), no question, no Undo. Same for an added card ("Type what is on Card now, or 0") and second income. This is the exact thing the owner hit.
2. No bank can be added, renamed or removed anywhere (setup, Plan, Settings, Check your bank).
3. No card can be removed. Plan, tap "Card": sheet has Name, paid day, close day, "Save", "Back" only.
4. "Keep at least" exists only in setup. Home, Plan, Receipts, Settings have no way to change it.
5. Below zero is red. Setup bank 10,000, bill 50,000 on day 5: Home safe to spend card shows "Short by ¥40,000 before the pay on 10 Dec, below zero from 7 Dec" in pink on a red box. Owner: amber, never red. The same card prints "¥10,000 (Main bank today) − ¥50,000 (Rent 7 Dec) = −¥40,000" twice.
6. Two figures for next pay. Made-up book, 10 Dec: "Safe to spend until next pay on 12 Jan 2027" and, one card below, "Next pay 10 Dec, today" and "10 Nov to today's pay".
7. Two figures after a restore. Settings, restore a backup, "Done", Receipts: "Safe to spend ¥246,300" with the spends that were just replaced still listed; Home shows ¥286,300. Leaving and coming back fixes it. Seen twice.
8. Assistant is not the way in (M1, M2, M79): first open meets a welcome card with three buttons; Ask says "Set up first".

CONFUSING
- 12 Dec Home lists the same ¥40,000 card three times ("Still owed", "Card and loan payments overdue", "May still go through") and says "After your cards are paid on 12 Dec" for a card due 11 Dec. One card, one place: "Card ¥40,000 was due 11 Dec. Tick it at Check your bank once it has gone".
- "Due before next pay: Nothing is due before next pay" while the safe to spend sum takes off "Rent 27 Nov, late". Put late bills inside "Due before next pay".
- Ask on this copy: "The AI can't be reached from this copy of the page. Open it from its own address, or inside Claude." A stranger does not know what "its own address" is.
- Setup: "This is Free to spend. Safe to spend leaves room for it" uses three names in two lines.

POLISH
- "?" buttons are 28x28; others are 44 high.
- Settings after joining the cloud copy still says "The currency is chosen in setup."
- Device A logged "console: Failed to load resource: ... 404" on the made-up server.
- Backup lock checkbox has no visible label in the tap list.

FOR MAKO'S EYE
- Bills ended stay on Plan as "ended 1 Dec"; whether that reads as removed is taste.
- Header text links (Settings, Reminders, Ask) versus buttons.

PICTURE FIRST
Every Home card is a number or a sentence. Safe to spend is explained by a long sum written out ("¥286,000 (Main bank today) + ¥180,000 ... = ¥275,000"); a picture of money in, out and left would do this job. Where the money is, cards owed and "after cards are paid" are all text.

NOT CHECKED
- The assistant with the made-up AI (window.claude stand-in) and the real one: not wired on this copy.
- Pay period rollover with budget lines and "Decide later" (M24, M46), two devices editing one plan item (M20), goal fill and percents (M49).
- Light scheme. Desktop and 320 checked for sideways scroll and cut text only (none found), not by eye on every sheet.
