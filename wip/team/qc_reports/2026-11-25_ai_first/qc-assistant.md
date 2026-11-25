VERDICT: FAIL (a confirming run. Both things I was sent to check hold: the run 3 blocker is gone and both ways of setting up still finish. I fail it on one new fault found next to the change, blocker 1 below. If the coordinator rules that fault out of this round, the confirming checks alone are a PASS.)
Tested with the made-up AI only. Lines and jobs I did not walk again are carried over from the run 3 report (same file name, now run3_qc-assistant.md).

CHECK: check3.txt ends
```
[x] Setup, short (setup3) ... (tests/e3_setup.js: PASS)
[x] The layout holds at 320, 390, 412 and 1300 wide ... (tests/e3_layout.js: PASS)

(full level, 3 at a time, 791 s in all)
ALL GOOD
```

OWNER'S WORDS: carried over from run 3 unchanged (M1, M2, M4, M5, M6, M7, M17 MET; uploads, M3 in part, M9, M10 NOT BUILT, IN SCOPE FILE; M8, M11, M12 COULD NOT TELL). Walked again here: M1 and M2 MET.

COUNT: carried over: jobs 6 DONE, 2 STUCK (job 5 on the upload only, in scope; job 7 on the run 3 blocker, now gone, so job 7 is DONE on what I walked). Grid 17 YES, 23 NO, 0 BROKEN, 2 not tried. Questions never asked: 11. This run: 7 checks, 6 passed, 1 new fault.

WHAT I CHECKED (phone 390x844, today 24 Nov 2026)
1. Run 3 blocker: GONE. Country and Sora Bank 250,000 given in the chat, then the AI fails. "Set up on the screens" and "Set up on the screens instead" both open "Its name" = Sora Bank and 250000, with "Filled in from the chat, not saved yet: Your bank. Press Save under each".
2. Same with the whole talk (bank, pay, two cards, three bills, two already out, Free to spend): both links fill the same 35 boxes, compared box by box. Link, Back, the other link: same boxes.
3. After a reload mid-chat the foot link still fills the boxes.
4. Setup finished on the screens from the chat's answers: six "Saved", "See my money", Home "¥250,000 (Sora Bank today) − ¥80,000 (Rent 27 Nov) = ¥170,000", held after a reload.
5. Setup by chat end to end: "Your answers so far", "Fill in my Burrow", Home ¥201,400 and ¥286,000, held after a reload.
6. Assistant off, new phone: "The assistant is off right now. You can still finish everything", both links open empty boxes, an empty "See my money" says "Type what Main bank shows today", setup finishes, Home ¥170,000. A message sent after it: "Your message is back in the box", and it was.
No page errors beyond the made-up 502.

BLOCKERS
1. A figure corrected and saved on the screens is replaced by the chat's older one, without a word. Steps: new phone, tell the chat "Sora Bank 250,000". Tap "Set up on the screens instead". Change "What does your bank show today?" to 260000, press Save: "Saved". Tap Back. The chat's "Your answers so far" still reads "Sora Bank: ¥250,000 on 24 Nov". Carry on in the chat and fill: Home shows "Bank today: Sora Bank ¥250,000" and safe to spend ¥250,000. Run twice, same result. The 260,000 is gone. The chat did show 250,000 before the fill, which softens it, but the person's last word was "Saved" at 260,000. The door opens one way only: chat to screens. A save on the screens should also change "Your answers so far". I cannot tell whether run 3's build did the same.

CONFUSING
- On the setup screen, type a pay amount by hand and save only the bank: the notice becomes "Filled in from the chat, not saved yet: Your pay". The chat never gave a pay. Say "Not saved yet: Your pay".
- Still there, KNOWN: after a failed call "Send it again" with an empty box.

NOT CHECKED
- Everything in run 3 outside the above: jobs 3, 4, 5, 6, 8, the grid, the settings list. Carried over.
- The two links at desktop size and 320 wide.
- The reverse case in full: boxes saved on the screens first, then the chat answers a different part.
- A real AI.
