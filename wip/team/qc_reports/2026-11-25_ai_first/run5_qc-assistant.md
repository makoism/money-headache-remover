VERDICT: PASS (confirming run 5, against qc-assistant.md run 4. The run 4 blocker is gone in the real page, and the places the changes touched still work.)
Tested with the made-up AI only (fake_ai_page.js). Marks and the grid are carried over from run 4 and run 3 (now in git history as qc-assistant.md run 4 and run3_qc-assistant.md); only what is listed below was walked again.

CHECK: check3.txt ends
```
[x] Setup, short (setup3) ... (tests/e3_setup.js: PASS)
[x] The layout holds at 320, 390, 412 and 1300 wide ... (tests/e3_layout.js: PASS)

(full level, 3 at a time, 788 s in all)
ALL GOOD
```

OWNER'S WORDS: carried over (M1, M2, M4, M5, M6, M7, M17 MET; uploads, M3 in part, M9, M10 NOT BUILT, IN SCOPE FILE; M8, M11, M12 COULD NOT TELL). Walked again: M2 and M6 MET.

COUNT: carried over: jobs 7 DONE, 1 STUCK (job 5 on the upload only, in scope). Grid 17 YES, 23 NO, 0 BROKEN, 2 not tried. Questions setup never asked: 11. This run: 9 checks, 9 passed, 1 new confusing thing, no blocker.

WHAT I CHECKED (phone 390x844, today 24 Nov 2026, new phone each time, no page errors)
1. Run 4 blocker, chat then screens: the chat sets Sora Bank 250,000. "Set up on the screens instead", change to 260000, Save: "Saved". Back: "Your answers so far" reads "Sora Bank: ¥260,000 on 24 Nov". Finish in the chat, fill: Home "Bank today: Sora Bank ¥260,000", "¥260,000 (Sora Bank today) − ¥7,400 (Power 26 Nov) − ¥72,000 (Rent 27 Nov) − ¥5,200 (Internet 27 Nov) = ¥175,400". Same after a reload. GONE.
2. Screens then chat: save 260,000 on the screens (answers show ¥260,000), then the chat says 250,000: answers ¥250,000, the boxes 250000 with "Filled in from the chat, not saved yet: Your bank", Home ¥250,000. Newest wins both ways.
3. Undo with setup open: after Save 260000, Undo: box back to 250000, "Undone", the chat's answers ¥250,000.
4. Pay typed by hand (240,000) and saved: answers show "Pay: ¥240,000 after tax, on day 25 ...". The run 4 wording fault ("Filled in from the chat" for a pay the chat never gave) did not show.
5. Undo with setup closed: the pay's Undo tapped from the chat screen: the pay leaves the answers, "Undone". After a reload the boxes are Sora Bank 250000 and an empty pay.
6. A cents currency: the chat sets US dollars and $1,234.56; changed on the screens to "1,300.25": answers "$1,300.25", Home "Sora Bank $1,300.25".
7. Setup on the screens only, "See my money", reload: Home kept, the assistant panel has no "Your answers so far" and no setup link. No stale draft.
8. Assistant off: "The assistant is off right now. You can still finish everything:", a sent line comes back ("Your message is back in the box"), setup on the screens finishes; "See my money" without a pay says "Type how much Pay is".
9. Setup by chat end to end (cases 1, 2, 6) still fills and Home holds after a reload.

BLOCKERS
None.

CONFUSING
- A stale Undo on Home after the chat fills. Steps: chat gives the bank, "Set up on the screens instead", change the bank, Save, Back, finish in the chat, "yes fill it in". Home's foot still shows "Your bank: saved" with "Undo". Tap it: it says "Undone" and nothing on Home changes (still ¥260,000, also after a reload). A person reads that their bank change was undone when it was not. Clear a setup section's note when the app is filled, or make it the fill's own Undo ("Filled in from the chat. Undo").
- After a screens Save mid-chat, a reload opens the setup screens ("What you saved before is back below") rather than the chat the person was in. Nothing is lost (Back shows the whole chat), but the way in should stay the chat (M1).

POLISH
- None new.

NOT CHECKED
- Jobs 1, 3, 4, 6, 8, the grid and the settings list: carried over from run 3 and run 4, not walked again.
- The two setup links at 320 wide and desktop.
- The cloud copy's "Delete the cloud copy asks first" (7df448a3) and the number fixes (statement refund, Receipts Moved, Home after the cards, late pay): not assistant doors; left to the reviewers of those lines.
- A real AI.

Scripts: /tmp/qc/qc-assistant/a3.js to a10.js.
