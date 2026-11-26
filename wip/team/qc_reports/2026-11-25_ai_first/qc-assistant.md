VERDICT: PASS (confirming run 6, per confirm2_qc-assistant.txt, against qc-assistant.md run 5, now run5_qc-assistant.md. Code at 6a748918; HEAD 9da988dc changes no app file.)
Tested with the made-up AI only (fake_ai_page.js). Marks, jobs and grid carried over from run 5 (and runs 3 and 4); only the bank and card figure change was walked.

CHECK: check3.txt ends
```
[x] Setup, short (setup3) ... (tests/e3_setup.js: PASS)
[x] The layout holds at 320, 390, 412 and 1300 wide ... (tests/e3_layout.js: PASS)

(full level, 3 at a time, 857 s in all)
ALL GOOD
```

OWNER'S WORDS: carried over from run 5. Walked again: M4 MET, M6 MET, M14 MET (for the assistant's figure cards).

COUNT: carried over: jobs 7 DONE, 1 STUCK (upload, in scope). Grid 17 YES, 23 NO, 0 BROKEN, 2 not tried. Setup questions never asked: 11. This run: 7 checks, 7 passed, 0 blockers, 2 confusing, 2 polish.

WHAT I CHECKED (phone 390x844, the made-up setup filled on 24 Nov, then opened on a later day; no page errors)
1. 28 Nov, "my bank shows 204,000": card "Already through, so ticked: Rent 27 Nov ¥72,000, Power 26 Nov ¥7,400, Internet 27 Nov ¥5,200", Do it / Not now. Done: safe to spend ¥201,400 to ¥204,000.
2. "rent has not gone yet": new card "ticked: Power, Internet. Not through yet, still expected: Rent 27 Nov ¥72,000". Done: Home "¥276,000 (Main bank today) − ¥72,000 (Rent 27 Nov, late) = ¥204,000".
3. Card figures: Card A 61,000 on 28 Nov and 9,000 on 11 Dec: changed at once, "Safe to spend stays the same: Card A is paid from your bank on or after your next pay"; no ask (the card's payment is a Main bank item, as on the screens).
4. Nothing expected (24 Nov, bank 285,000): changed at once, as before.
5. Undo from the card for cases 1 and 2: every figure back (¥201,400, three bills late again).
6. Undo after a reload, from the chat, for cases 1, 3 and 4: every figure back, and still back after a second reload.
7. The screens' Check your bank, same day, same figures: 204,000 gives ¥204,000; 276,000 with Rent unticked gives ¥204,000 with Rent late. Same as the assistant.

BLOCKERS
None.

CONFUSING
- The first card stays live after a corrected one. Steps: case 1 with 276,000, then "rent has not gone yet". Two cards both show "Do it". Tapping the first (the one ticking Rent) saves it: safe to spend ¥276,000, Home "Main bank shows ¥74,600 more than the app had: was that figure right". Its card offers Undo. If the new card is tapped first, the old one then says "Nothing was saved, because this changed somewhere else while it was open", which is untrue: it was replaced in this chat. The old card should read "Replaced by the one below", with no buttons.
- KNOWN (in scope.txt LATER), worse here: the only question on the figure card is "This is more than safe to spend. Do it?". The ask is about the ticks: "Have these gone through?". As written, a person is not told what they agree to.

POLISH
- The assistant's card never names the gap. The screens say "Bank checked. ¥2,600 more came into your bank than you logged"; the chat card shows only before and after.
- What the AI is sent on 28 Nov says "Due and not ticked off yet: Power 26 Nov ¥7,400" only. Home lists Rent and Internet as late too.

NOT CHECKED
- Everything outside this change (carried over). The desktop and 320 widths for the figure cards. A real AI.

Scripts: /tmp/qc/qc-assistant/c1.js to c10.js.
