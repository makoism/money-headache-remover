VERDICT: FAIL (confirming run 3 against run2_qc-data-safety.md, run 2 PASS; one new blocker: setup open in two tabs, a section that said "Saved" is silently lost)
(Saved by MAIN 21 from the reviewer's reply: the reviewer did not write the file so as not to overwrite run 2's.)

CHECK: (full level, 3 at a time, 788 s in all) / ALL GOOD

OWNER'S WORDS: M61 NOT MET (blocker 1). M69 NOT MET (same). M66, M67 MET again on the made-up server. M62 to M65, M68 carried over from run 2, not walked again.

COUNT: 5 confirm checks: 1 STUCK (nothing lost when two saves happen at once), 4 DONE (setup Save/Undo/See my money; Delete the cloud copy; Keep it; run-2 items spot-checked: reload, two tabs, new phone, refused send, backup and restore, End a bill). Kinds of change across reload: 6. Removes: 3, all ask first.

BLOCKERS
1. Setup in two tabs: Save in one tab silently wipes what the other tab saved (repeated 4 times). 390 wide, new device: tap "Set up on the screens instead" in tab 1 and tab 2. Tab 1: bank 286,000, Save ("Saved", "Your bank: saved"). Tab 2: pay 240,000, Save ("Your pay: saved"). Reload either tab: the bank box is empty. Both Saves at the same moment: the bank stays, pay and Free to spend are gone. Nothing says anything was replaced. Should keep both sections, or refuse the stale save in plain words. Script /tmp/qc/qc-data-safety/r2.js (node r2.js same|seq|one).

What held: setup Save then Undo gives 240,000 back on the screens and in the chat's answers, at once, after a reload and after 10 s; saves on the screens show in the chat card; See my money without Save lists what is "Not saved yet", with Save fills the book and survives a reload; three quick spends then an instant reload all kept and sent; two tabs logging a spend at once both kept; new phone by code: Home, Receipts, Plan match; server refusing: Home and Settings say so, also after a reload, Send now worked; Delete the cloud copy asks first ("Delete the cloud copy for good? The earlier saved versions on the server go too ..."); Keep it and Keep it on made no server call; Delete it for good sent one DELETE, the money on the device stayed after a reload; Restore asked first with counts and matched; Put it back brought newer money back after a reload; End this bill asks first.

CONFUSING
1. After setup is finished on the screens, the chat still shows "Your answers so far" with Free to spend and Keep at least empty and "Still needed: How much for food ...". Carrying on in the chat, every draft step and the fill are refused ("Setup is done ..." / "Not filled in: There is already a book on this device"); nothing damaged, but the made-up AI said "Done. Here's Home" and the cards and bills typed in the chat were never added. Fix: clear or close the setup card when setup ends.
2. A spend shows "A change is waiting to go to the cloud copy" for about 8 s before it is sent; scope.txt says a spend is sent at once. Not lost, but not at once.

POLISH: Save under Your pay also keeps the typed Free to spend and Keep at least across a reload while both read "Not saved yet". d.errs: a 404 on the first cloud read, 500s during the refusal test (the reviewer's own).

FOR MAKO'S EYE: none.

NOT CHECKED: the rest of run 2 carried over (assistant wipes, old and newer copies, addresses called, two devices changed apart, a backup from a wrong clock, restoring twice); the chat in one tab with the screens in another; a cloud save at the same moment as a setup draft save; the five number fixes beyond Home. Made-up AI and made-up server.
