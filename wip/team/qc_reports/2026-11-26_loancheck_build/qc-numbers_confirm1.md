VERDICT: FAIL (blocker 1's wrong figure comes back when a check of 0 sits between two checks)

Confirming run. Build: worktree c6, lane/controls-6 at d4a7db73, app3/index.html, phone 390x844, Asia/Tokyo. check3.txt: full level, ALL GOOD. Book: Kenji from my earlier run (Main, pay 300,000 on the 25th, Car loan 900,000 at 30,000 on day 27, ticked to 840,000, bank 1,027,655 checked 29 Dec, 27 Jan payment unticked), a copy of the saved phone at 3 Feb. Marks for lines not walked again are carried over from qc-numbers.md.

EARLIER BLOCKERS
1. FIXED on the earlier steps. 3 Feb Plan 812,400 "No, not yet". 5 Feb Check your bank, Pay and Car loan ticked, Main 1,297,655. By hand 812,400 - 30,000 = 782,400. Screen: Plan and Home 782,400. Bank 1,027,655 + 300,000 - 30,000 = 1,297,655, shown 1,297,655. But see new blocker 1.
2. FIXED. 3 Feb Plan 10,000 "No": asks "That is ¥830,000 less than expected. Is ¥10,000 right?" (840,000 - 10,000, right). Yes: overdue 10,000, Home 1,027,655 - 10,000 = 1,017,655, shown 1,017,655. With 0: asks "¥840,000 less", Yes, owed 0, nothing overdue, safe 1,027,655. 4 Feb Check your bank offers no loan tick, expected 1,327,655 (1,027,655 + 300,000), right; saved, owed 0, "Close this loan" asks and closes. No minus anywhere.

NEW BLOCKER
1. Three checks, No, then 0, then a check with no question: a payment ticked later never comes off.
- 3 Feb: Plan > Car loan > 812,400 > No, not yet > Save. Owed 812,400, 27 Jan overdue. Right.
- 4 Feb: Plan > Car loan > 0 > No, not yet > Save > Yes (far question "¥812,400 less", right). Owed 0. Right.
- 6 Feb: Plan > Car loan > 812,400 > Save > Yes (far question "¥812,400 more"). The question "Has the 27 Jan payment left your bank?" is NOT asked. Screen: owed 812,400, "¥30,000 due 27 Jan has not been seen", Home 1,027,655 - 30,000 = 997,655.
- 7 Feb: Check your bank, Pay and Car loan ticked, Main 1,297,655, loan box blank, Save.
- Screen: Plan and Home "Car loan ¥812,400". Same after a reload. Receipts lists "Car loan payment 27 Jan, Main, ticked at Check your bank ¥30,000".
- By hand: on 6 Feb the app itself said the 27 Jan payment had not been seen, and the person had said No twice. The 812,400 was before it. It has gone now: 812,400 - 30,000 = 782,400.
- Control, same book without the 0 check: on 6 Feb the question is asked; No, then the same 7 Feb tick gives 782,400. So the same facts give 812,400 or 782,400 depending on a check in between (M44, M36). Either ask the payment question on 6 Feb as without the 0 check, or count the earlier No.
- Every later figure carries 30,000 too much owed.

WRONG FIGURE, SAME CAUSE AS KNOWN (b)
- 2 Mar (book of blocker 1 after the fix, owed 782,400): Check your bank, 1 Mar Car loan ticked, Main 1,567,655, loan box 100. The far question says "That is ¥782,300 less than expected". With the tick the app expects 752,400, so 752,300. The saved figures are right: owed 100, "¥100 comes out on 29 Mar", Main 1,567,655, safe 1,567,655. The question compares to the figure before the ticks, the same cause as the KNOWN "The app has" words, but here it is a stated amount that is 30,000 off. The coordinator rules whether it joins KNOWN (b).

THE BUILT ITEMS AS A PERSON MEETS THEM
- (a) One date: MET. 27 Feb 2027 is a Saturday. Plan's question "Has the 1 Mar payment of ¥30,000 left your bank?", Home and Plan "¥30,000 due 1 Mar is late", Check your bank "Car loan 1 Mar, Main". Next one "29 Mar" (27 Mar is a Saturday). All one date.
- (c) Far figure asks first: MET on Plan's loan sheet (four times, each difference right by hand) and on Check your bank's loan box (asked, Yes saves, see the wrong 782,300 above). Not walked through the assistant this run.
- (d) Receipts: MET. The 27 Jan tick shows as "Car loan payment, 27 Jan, Main, ticked at Check your bank, ¥30,000" in its stretch.
- (e) How fresh: MET. Plan and Home show "checked 3 Feb", "checked 4 Feb", "checked 6 Feb", "checked 2 Mar" under the loan, the day of the last loan check. After a tick the derived figure 782,400 still says "checked 3 Feb", which is the right day of the last lender figure.
- Reload: figures unchanged after a reload (812,400 above, Main 1,297,655).

COUNT
- Lives walked: 1 (Kenji, five branches: blocker 1, blocker 2 at 10,000, at 0, the three-check chain, the 2 Mar check). Steps compared: 18. Figures tied by hand: 41. Wrong: 2 (812,400 for 782,400; 782,300 for 752,300). Unexplained: 0. Page errors: none.

OWNER'S WORDS
- M13 M40 (loan still owed): NOT MET, new blocker 1. M36, M44: NOT MET, new blocker 1. M45, M47, M51: MET on what was walked. Others carried over from qc-numbers.md.

Probes: /tmp/claude-0/-home-user-money-headache-remover/d23cab7b-8f1a-54b4-bb56-18a364522b9b/scratchpad/qcn2/ (c1 is the three-check book, c2 the control).
