VERDICT: PASS. Confirming run on lane/controls-6 at 30e19f71 (engine fix 55851e46; check3 full ALL GOOD in this folder). Saved by LANE N from the reviewer's reply (qc-foundation has no Write tool).

OWNER'S WORDS: M7, M36, M45 (BROKEN in finding 1) now MET. Rest as the earlier report: MET M1 M3 M4 M5 M6 M13 (still owed) M14 M37 M44 M61 M67 M69 M91 M97 M98. NOT BUILT (IN SCOPE FILE): a usual payment that changes from a set date, interest set after setup, M23 loan statements. KNOWN: Undo on the screens after a reload.

FINDINGS: none.

Finding 1 fixed: engine/lookahead.js loanInfo (about 784 to 821): each live check on the loan starts its own walk; a payment day takes what was owed then from the check (or the opening) just before it; the latest check's walk gives what is owed now; the items loop and minPay get the right figure.

How tested: every case through the real write door (ACT3 with plan3_write addLoan and checkLoan; No answers through loanCheckArgs with sameIsNothing false, as Check your bank writes them), each case twice: plainly and with the book reloaded from JSON and a fresh ACT3 at every step; both gave the same figures. Probe: LANE N scratchpad p1.js (not kept in the repo).

Earlier probe (qc-foundation_probe.js): after the second check answered No, 27 Jan asks 25,000 (was 30,000). That probe ticks a hard-coded 30,000, so owed -5,000 is a true overpayment; ticked with the 25,000 asked, owed ends at 0 (engine test loan_check.test.js, 11 passed).

Three or more checks (200,000, 30,000 on the 27th, 27 Nov and 27 Dec ticked), by hand = engine at every step:
- before any check, 5 Jan: 140,000
- check 1, 5 Jan, 120,000 (paid extra): 27 Jan asks 30,000
- check 2, 3 Feb, 120,000, No for 27 Jan: owed 120,000; 27 Jan overdue 30,000; 27 Feb next 30,000
- 27 Jan ticked 5 Feb: 90,000
- check 3, 3 Mar, 60,000, Yes for 27 Feb: owed 60,000; 27 Mar next 30,000
- check 4, 10 Mar, 50,000: owed 50,000; 27 Mar 30,000
- 27 Mar ticked (separate run): 27 Apr asks 20,000

Removed checks (A.remove): check 4 removed: back to check 3, 60,000, 27 Mar 30,000. Check 3 removed too (its Yes tick stays): chain back to check 2: 120,000 less 27 Jan and 27 Feb ticks = 60,000. Then 27 Mar and 27 Apr ticked: 0, nothing next. Undo of check 3 (its Yes tick goes with it): 90,000, 27 Feb overdue 30,000. All equal.

A check dated on a payment day (27 Jan after check 1 of 120,000): No: owed 120,000, 27 Jan asks 30,000 from check 1's walk, ticked next day 90,000. Yes with 90,000: owed 90,000, next 27 Feb 30,000. A payment on a check's own day belongs to the walk before it (rule 2b).

2% minimum (opening 100,000; 2,000 and 1,960 ticked), by hand = engine: check 1 50,000: 27 Jan asks 1,000; check 2 50,000 No: 27 Jan overdue 1,000, 27 Feb next 980; 27 Jan ticked: 49,000, 27 Feb asks 980; check 3 40,000 Yes: 27 Mar asks 800.

A loan with no checks after setup is unchanged: 200,000 with only 27 Nov ticked reads 170,000 on 3 Feb, 27 Dec and 27 Jan overdue 30,000 each; with one check (the opening's) the chain is one walk to the end, the old code. Old engine 68010ff9 against 30e19f71: 146 books, 8 days each, 1,168 runs, 0 differences (none has two or more loan checks).

GRID: unchanged: 17 covered, 3 n/a, 0 empty.

WATCH: as the earlier report, plus (builder, not foundational): on Plan a check of the same figure the app already shows, answered No, is refused as "Nothing changed"; Check your bank takes it. Numbers not hurt (the payment already counts as unpaid), but the lender's say cannot be recorded from Plan.

SOUND: the chain fix (about 15 lines, no saved-data change); order of checks (day, told, position); remove, Undo and reload in any order; interest from each check's own day (by reading); one write door (ACT3 through CK.checkIn); the earlier probe's scenario.
