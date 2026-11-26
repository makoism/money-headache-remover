VERDICT: FAIL (qc-foundation, build lane/ai-join 8be688e, code 51b29011; saved by MAIN 24 from the reviewer's reply, which said its role has the caller save it)

CHECK: check3.txt ends "(full level, 3 at a time, 857 s in all)" / "ALL GOOD".

FOUNDATIONAL
F1. A bank or card figure given to the assistant makes every expected item before it "not landed" for good.
Who: Mako, or anyone who sets up and then mostly talks to the assistant (M1, M4).
The moment: 30 Nov. Rent of 72,000 really left the bank on 27 Nov, and about 10,000 was spent. They tell the assistant "my bank shows 204,000".
What the build does: bank_figure writes a check-in with figures only and nothing ticked (chat3_core.js:588-594), while the Check your bank screen ticks every expected item by default (checkin3.js:93-100). The assistant never mentions rent; its ask card says only "82,000 less than it had". The engine reads the whole 82,000 gap as everyday spending and keeps rent expected: Free to spend left -50,000, safe to spend 0. Next day "rent came out on the 27th": checkin.js:75-90 (landedFrom, BI1) puts any tick on or after the day after the last check on that account, so rent is written on 1 Dec, after the figure. Home shows Main 132,000 while the bank shows 204,000, and Free to spend reads 50,000 overspent when 50,000 is really left. Asking with the date 27 Nov is refused. The same for a weekly earner back after three weeks (three wages can only land after the figure; the bank will read 2,400 too high). Undo of the figure card, then the tick, then the figure again recovers it; nobody would know to.
Why it is in the base: checkin.js:83-87 assumes every saved check was made with the list of expected items shown. The saved check-in records settled and unticked (imports only); it cannot say "no list was shown". AI first makes figure-without-list the normal case, and a statement or screenshot reader will do the same later.
What the base needs: (a) the check-in records the items it listed (listed: [occ]) and landedFrom applies only to items a check-in listed; (b) the assistant's bank_figure and card_figure carry the expected items for that account like the screen (ask about each first, or put them on the card ticked) and write them in the same checkIn (ci.ticked). A test chaining a figure by chat with the tick on the next day. Cost: about half a day now, plus one line in SCHEMA_V3 7.2.
Known and not counted again: cards plan F1 (no dated "no play amount", lane/cashplan).

OWNER'S WORDS
A: M1, M5, M17 MET. M2 MET for typed answers; uploads NOT BUILT (scope). M3 partly MET (21 named actions; F1 makes one write a wrong figure). M4 MET for spends and ticks; receipts by photo NOT BUILT (scope). M6 MET as built (not settled 1). M7, M12 NOT MET (F1). M9 NOT BUILT (scope). M10 silent. M11 MET.
B: M13 partly MET (gaps in scope). M23 partly MET (cash and e-wallet by the assistant only; pay-later stage 2). M14, M15, M16, M19, M20, M22 MET. M18, M24 NOT BUILT (scope). M21 not tested (scope). M25 silent.
C: M26 to M32, M34, M35 MET (card payment on 10 Dec is 57,400: everything owed with close day not sure, spend and refund included). M30, M40 MET apart from M90 (KNOWN). M33 silent.
D: M36, M37, M44, M45 NOT MET (F1). M38 MET (15th and last day with the holiday shift; weekly; every two weeks; a second earner whose pay starts no period; no fixed pay KNOWN). M39, M41, M42, M43, M48, M50 MET. M46 NOT BUILT (scope). M47, M49 silent. M51 KNOWN.
F: M61 to M65, M67, M69 MET. M66, M68 need the server confirmations below.

COUNT: lives walked through chained days by a node harness on chat3_core's real turn and handle with fake AI tool calls (real fill, door, checkin.js, lookahead; realistic ids): Mako's shape; twice a month in the Philippines with cash and an e-wallet, three weeks away; weekly pay set up mid-week, three weeks away; every two weeks set up on pay day; freelance; a couple into one joint bank. No browser.
GRID (17 kinds by add, change, remove or end, Undo; screens and assistant: 136 cells): 93 covered, 6 not applicable, 37 empty. Empty (S screens, A assistant): change a spend, refund, money in or a move: A (4); tick change and remove S and A (4); bank or card figure change and remove S and A (4); pay add on S after setup, end on S and A (3); Free to spend stop S and A (2, cards plan F1); goal change and remove on A, remove on S (3); take money out of a goal A (1); card change and close on A, close on S (3); bank, cash or e-wallet add, rename and close on S, close on A (4); loan close on S, and add, change, close, Undo on A (5); Keep at least change and remove on S (2); country or currency change S and A (2). Only cards plan F1 needs the base.

FOR THE BUILDER (no base change)
1. landed without a date ticks the latest occurrence (chat3_core.js:577): back after three weeks, "I got paid" ticks only the newest wage and merges three periods. Tick each landed occurrence oldest first and say how many.
2. bank_figure has no date: "it showed 204,000 yesterday" is stamped today (M37).
3. On Sat 5 Dec "rent came out" is refused as "nothing expected now" because rent lands Mon 7 Dec: a real early debit cannot be recorded.
4. A card payment made early or in part has no door on either side.

WATCH
Couples: owner null on every account and pay; people unused. Mixed builds: CASH_PLAN adds pct, each, holds, home.way; bump the format or make older builds keep unknown fields before cashplan ships. Reading files (M99): a batch should be one door step; F1 applies to any figure a file reader writes. Server settings to show Mako: the API key (on since 24 Nov); the D1 binding for the relay cap (/api/health "vault": true); the live write limit (device 1,200, assumes 1,500); the Anthropic monthly spend limit (never confirmed); no session has run the real AI.

CHECKED AND SOUND: the dated startsPeriod and the saved Undo journal are merged; the fill refuses until every required answer is in; the Philippine holiday shift; figures for twice a month, weekly, every two weeks on pay day, freelance and the couple right to the minor unit; moves by chat only between own accounts; an ATM withdrawal leaves safe to spend unchanged; a wallet check gap comes off Free to spend (M95); a refund onto a card lowers what is owed; a card figure gap comes off Free to spend; stale refs refused.

NOT CHECKED: the page in a browser. Scripts: MAIN 24's scratchpad fw/ (h.js, l1.js to l5.js).

Worked example confirmed by MAIN 24 (l4.js, 26 Nov): Main 286,000, rent 72,000 out 27 Nov, 10,000 spent; "my bank shows 204,000" on 30 Nov: Main 204,000, free left -50,000, rent still expected; "rent came out" on 1 Dec: Main 132,000 (should stay 204,000), free left -50,000 (should be 50,000).
