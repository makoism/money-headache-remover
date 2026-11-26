# Short gap plan (lane/shortgap, LANE L, 26 Nov 2026)

Serves: M7 (see at a glance what is safe to spend), M12 (clarity), M23 (several banks), M36 (the picture adds up), M40 (the bank after the cards), M45 (no coin counted twice), M47 (bank below zero, plain line), M98 (walk it as a person). Touches: the safe to spend headline (D), Home's move line (E wording, one line).

## The ruling (coordinator 16, 26 Nov)
A second bank or cash that will be short has its gap come off safe to spend in the period its bill falls in, as a move out of the paying bank by that day.

## The person and the month (M98)
Mako's setup (main bank, pay 240,000 on 10 Dec, two cards, Rent, Power, Internet), plus a second bank, Beta Bank, with 32,000 in it. Card A (54,000 owed, paid 10 Dec) is paid from Beta. Today is 1 Dec, the main bank shows 201,400. Later he moves Rent (72,000) and then Power (7,400), both due 28 Dec, to be paid from Beta.

What he does: opens Home to see how much he can spend before pay. What he needs to know: (1) how much is safe to spend until 10 Dec; (2) that Beta will not cover Card A, by how much, and from where to move it; (3) when he moves Rent and Power to Beta, that nothing about this period changed (the money still comes from the same pay), and that he will need to move more into Beta by 28 Dec.

What the app should say:
- Safe to spend before pay: 179,400, before the moves and after both (moving which bank pays a bill does not make money appear or vanish; Rent and Power fall after pay, in the next period).
- Home's move line: move 22,000 from the main bank to Beta Bank by 10 Dec, and the rest (79,400) by 28 Dec.

What it says today: 107,400, then 100,000 after both moves. Cause: engine/lookahead.js, the `shortfalls` sum near line 1337 takes the whole of every account's negative headroom (its lowest point over the whole look ahead, months long, with no pay of its own) off this period's headline at once, whatever day the bill falls on.

What else could be true (M98):
- Beta is itself a bank he spends from (spendFrom true): the same rule; it is covered by the other bank.
- Two banks he spends from could cover: the one with the most room covers (the same choice Home's move line already makes in screens/status.js moveText); the engine names it, the screen reads it, so the two never disagree.
- No bank can cover (every one is short): no move; the gap stays on the headline as today, with the short line.
- The gap falls today or is already there this morning: the move is dated today.
- Another currency: never covered (as today, warned).
- Cash (a wallet) short: the same rule (a move out of the paying bank is a cash withdrawal).
- A goal kept in Beta or plan lines for Beta: the cover is worked from Beta's full walk (the one that decides what can be spared), so goal money in Beta is not spent by the cover.

## The rule (engine)
1. Walk every home currency account as today.
2. For each account whose full walk goes under its minimum, list the covering moves: on each day its running balance (end of day) reaches a new low under the minimum, a move of the new part (22,000 on 10 Dec; 79,400 on 28 Dec). The days follow the bills, never the horizon end.
3. The paying bank: among the other accounts with spendFrom in the same currency, the one with the most headroom (the same rule as moveText). If none, no cover (step 5 as today).
4. Walk the paying bank again with the covering moves as its own steps (order 1, after a pay the same day, as a bill), in both its walks (full and real). Its headroom now takes each gap in the period its day falls in, exactly as if the bill were its own.
5. `shortfalls` counts only accounts left uncovered. A covered account adds 0.
6. walk() takes a covers map, so every call (the full walk, the real walk, the warnings, realWalks used by canSetAside) sees the payer's covering moves. Covers are worked from the short account's full walk for the full walk, and from its real walk for the payer's real walk (planned money never shows the main bank below zero, BM2). Partial cover: the payer covers what it can spare and the rest stays a shortfall. Ties: most headroom, then the lower id.
7. A covered account does not set safeToSpend.short (one verdict on Home: never "Short by" beside a headline that already took the move off); its below_minimum warning carries covered: { from } and the screens show the move line instead.
8. Output: res.accounts[id].cover = { from, moves: [{ day, amount }] } on the short account; the paying bank's `why` lists "Move to Beta Bank by 10 Dec" lines. The short account's own walks, firstUnder and warnings stay as they are (Beta still says it goes under on 10 Dec).
9. One rule, no order dependence: the result does not depend on the order accounts or records arrive in.

## Screens
- Home's move line (screens/status.js moveText) reads res.accounts[id].cover: "Move 22,000 from Main bank to Beta Bank by 10 Dec, and 79,400 more by 28 Dec" (wording to qc-voice; one line). It no longer picks the bank itself.
- The change card's short-by row (LANE J builds it on top of this commit).

## Review points taken in (qc-foundation on the plan, FAIL, qc_reports/2026-11-26_shortgap_plan/qc-foundation.md)
- F1 the cover's day against a pay the same day: RULING ASKED of coordinator 18 (recommended: due the day before the bill).
- F2 one verdict: rule 7. F3 M90 is not built: the tests pin res.canSpare and the cover moves, and the headline only where no card is left (M90 joins later without taking a card twice).
- F4 (a move made in the bank app and only the main bank checked counts as spending): WATCH, the check-in offering "moved to Beta" is the controls lane's; named in scope.
- Assistant (M1, M3, M4): the summary sent to it names each cover (from, amount, day), so it can say it; its move_money step already exists.

## Tests (failing first, these numbers)
- engine/test/shortgap.test.js: the book above on 1 Dec: headline 179,400; Beta cover from main, moves [22,000 on 10 Dec]; after Rent to Beta: 179,400, moves [22,000 on 10 Dec, 72,000 on 28 Dec]; after Power too: 179,400, moves [22,000, 79,400 on 28 Dec]. Plus: no bank can cover (headline as today); a partial cover; two spendFrom banks (the one with most room, tie by id); a gap today; a bill on pay day and the day after pay; a covered account sets no short; record orders (nine orders, the same result).
- app3/tests/e3_shortgap.js: the repro walk (LANE J's repro.js, Beta 32,000) on the real page: Home shows 179,400 before and after, the move line names both amounts and days.

## Not in this slice (scope)
- The person choosing which bank covers (today the one with most room).
- Moves dated other than by the bill's day.
