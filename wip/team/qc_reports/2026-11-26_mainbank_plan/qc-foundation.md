FAIL as written; PASS WITH CHANGES once F1 and F2 are in the plan, before building.

qc-foundation on wip/team/app3/MAINBANK_PLAN.md (lane/controls-13, 66e61ceb). Saved by LANE P from the reviewer's reply, 26 Nov about 16:30 JST.

## Findings

F1. FOUNDATIONAL (high). Moving "spending money" to the new bank rewrites the past and the current period.
- Kenji switches on the 20th. This period's pay landed in his old bank, so this period's food money is in the old bank.
- A line's account is one undated field: `lineAcct = l => l.acct || mainAcct` (engine/lookahead.js:87), read for past windows (:987, :1068) and each account's opening split (openingShares, :1011). Free to spend takes its account only from the first entry: `acct: shares[0].acct` (:847), though plan.shares entries are dated by `from`.
- What a person would see: with "spending money" ticked, today's leftover reservation jumps to the new bank; the new bank shows short (amber), the old bank shows unreserved money and can raise the M89 extra-money notice: the same food money counted twice (M45). Past windows are recomputed on the new bank. A new dated share entry is ignored by the engine; editing shares[0] moves all history. The plan's "a closed period's numbers unchanged" test with all ticked would fail.
- Change (section 1): spending money follows the new bank from the next period start, never today. The base needs: (a) setMain writes a plan.shares entry `{ from: next period start, acct: new }` and the engine reads `acct` from the entry in force on the day, as freePerOn (:845) reads `per`; (b) budget lines: optional `acct` on `steps[]` entries (`{ from, amount, acct }`), the engine reads the step in force for the window, missing means the line's own acct (no migration); (c) written into SCHEMA_V3 as a new item.
- Cost now: about one engine function and two writes. Later: recomputing figures people have seen.

F2. FOUNDATIONAL in the write door (high). Unticked past occurrences take the new account.
- Mako has not opened the app for three weeks; his card payment of the 10th and a bill are not ticked. He switches on the 12th with everything ticked.
- Schedule `acct` and card `payFrom` are undated (lookahead.js:753). Unsettled items (:1416), posting-window "still expected" items and Check your bank's tick would put old-bank payments on the new bank. Both banks' figures wrong.
- The plan's "past occurrences are settled by records" is true only once they are settled.
- Change (sections 1 and 2): refuse setMain and closing the main bank while any moved link has an occurrence gone by and not ticked, same words and door as owedTicked (plan3_write.js:618): "tick it at Check your bank, then try again". Or the step ticks them on the old bank first with typed amounts. Add a test to section 4.

F3. Medium. Goals kept in the bank block the one-step close (person 3).
- M43 makes "goal money stays in the bank" the default, so almost anyone with a goal hits the section 2 refusal.
- Change: when `to` is one of their own accounts, the close writes `keptIn.acct = to` for each goal kept in the old bank (the money moves with the transfer already written). Refuse only when `to` is "spent" and a goal holds money. Also say plainly that goals kept in the bank with no `keptIn.acct` are pinned to the old bank by setMain.

F4. Medium. Keep at least goes against AO5 and M42.
- Section 1 offers the old amount, ticked by default. AO5: the new main bank brings its own minBank or none. M42: the box starts empty, never set for the person.
- Change: the box shows the new bank's own minBank or is empty, unticked by default; the old amount shown as text only ("<old> kept at least X").

F5. Low. Lines and Free to spend are written with no account.
- New lines (plan3_write.js:54) and the setup share (build_book.js:179) carry no acct, so they follow whichever bank is main when read.
- Two devices: the phone pins a line to the old bank while the desktop edits its amount; keeping the desktop version at the M20 question loses the pin and the line silently moves bank.
- The plan's sync test assumes the desktop's new record carries an acct: true for bills (:125), false for lines.
- Change (sections 1 and 4): from this slice on every write of a line or share stores acct explicitly; setMain pins existing ones; the test uses a line, not a bill.

## The four questions
1. Pinning misses past-day readers in two places: lines and Free to spend in past windows and each account's opening split (F1); occurrences not yet ticked (F2). Others are fine: period-end answers hold their own moves (SCHEMA 7.4); the per-account short line and minimumOf (:93) are today only, correct after AO5; statement matching uses src.acct (AS4); move.js:583 reads the main bank only on a moved copy; the card "bank after the cards" for a past period follows payFrom, which is pinned.
2. Acceptable for a truly new record. With F5 done no new record arrives without an account, so the join never guesses. Do not add a pin to the join (M67).
3. Agree, a bank only for setMain and newMain (card payFrom is bank only, setup3.js:54; main bank from ans.banks, build_book.js:59-61). WATCH: a person whose pay lands in an e-wallet and who has no bank: stage 2 must decide what "main" means.
4. No dated main bank. Do F1(a) and (b) now plus explicit accounts on every new write (F5). Then home.main means only "default for new things, and Keep at least", and no past day reads it.

## The people
- Kenji: sound after F1 and F2. Pay, bills, cards follow from the switch; spending money from the next period. The 40,000 stays in the old bank with the "move some?" card.
- Aiko: pinning keeps her past figures. Spending money from the next period is right; if she wants it from today, offer "it was always this one" as a label fix that edits without dating (a screen choice, no base change).
- Mako (person 3): blocked by F3 when he has goals in the bank.
- Mako's own shape (M26 to M31): card payments and pay move together, sound; a switch on the 11th with the 10th card payment not ticked hits F2; spending money moved mid-period hits F1.

## Grid (main bank and its links)
Main bank: add n/a; change, close, undo planned. Keep at least: change and undo exist. Links (line acct, share acct, card payFrom, schedule acct, goal keptIn): change and undo planned; change from a later date EMPTY for lines and the Free share (F1, foundational). 11 covered, 1 n/a, 1 empty.

## MAKO_SAYS lines (covered by the plan)
M1, M3, M6, M14, M23, M47, M90, M91, M98 MET. M13 MET in intent, NOT MET for the close with goals (F3). M26, M27, M30, M40 MET for cards and pay, NOT MET for the not-ticked case (F2). M31, M38 NOT MET (F1). M36, M45 NOT MET until F1 and F2. M42 NOT MET (F4). M43 NOT MET in the close (F3). M46, M89 NOT MET (false extra-money notice, F1). M61, M67 MET after F5.
