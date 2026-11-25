FAIL

Plan: wip/team/foundation_review/CASH_PLAN.md (lane/cashplan 77e89276), sections 11 and 12 read as winning. MAKO_SAYS.md to M99. The way in stays right: the assistant asks and does, pay day is a scripted card, screens behind it. Section 12 answers most of review 1. The FAIL is three saved-shape points, each cheap now.

## Review 1, finding by finding
- F1: PART. No new kind any more, and a line's share is a counted move, not `once`. But the id is per destination, so two different answers never meet (N1).
- F2: MET. Extra is this period's new money, and "Kept in the bank" is a named place.
- F3: PART. The `lt:` record and the rule are met. `cm:<occ>:<account>` allows only one withdrawal (N1).
- F4: PART. Per pay period and `res.overPay` are met, but it writes the line-wide `per` (N2).
- Review 1's owner lines: M3, M13, M36, M49, M51, M89 now met. M20, M45, M61, M67 still at risk. M16, M18, M42, M48, M50 still silent.

## OWNER'S WORDS
A. M1 to M8 met, M10 and M11 met, M9 silent (fine: nothing here reads statements), M12 at risk until N1 is fixed.
B. M13 met (slice 6b doors) apart from the empty cells below. M14 met (take back on a later day is refused with words). M17, M19, M22, M23, M24 met. M16 silent (does each new setup question save on its own?). M18 silent. M20 at risk (N1).
C. M26 to M31 met. M27 and M28 have no test of his own life for extra money (N4).
D. M36 to M40, M43, M44, M46, M47, M49, M51 met. M45 broken until N1 is fixed. M42, M48 and M50 silent.
E (served). M88 met once N2 is fixed. M89 met. M90 met if Mako hears R5 as a question: his words are "every card spend comes off it", and R5 takes grocery card spends off Groceries instead. M91 met. M92 half met ("once a month", see WATCH). M93 to M98 met. M99 deferred, and the plan says so.
F. M61, M67 and M69 at risk (N1). M68 met.

## GRID
10 kinds: line percent, play percent, goal `each`, `holds`, `home.way`, `ex:` moves, the "Kept in the bank" place, `cm:` transfers, `gp:` moves, `lt:` records. Each is checked for add, change, end and undo, on the screens and through the assistant, on a later day: 80 cells.
Covered 68, not applicable 6 (end of `home.way`; change and end of `lt:`), empty 6.
Empty:
- `cm:` a second withdrawal for the same envelope in the same period, both doors (2). FOUNDATIONAL, N1.
- `ex:` a second answer in the same period to the same burrow (after a bonus), both doors (2). FOUNDATIONAL, N1.
- Goal `each`: end it (back to none) is not named in 6b, both doors (2). Builder.

## FOUNDATIONAL
N1. The new built ids name the wrong moment.
Who: Aki, cash way, paid on the 10th. Ben and his partner, one book on two phones. A freelancer.
- Aki is short at the ATM and takes out 20,000 of the 31,900 for Groceries. Section 11 item 4 leaves "still to take out 11,900" on Home. On the 14th Aki takes it out and taps Done. That writes `cm:<occ>:groceries` again, and act3.js:113 throws "That is there already". The withdrawal cannot be recorded, and the bank figure is 11,900 too high (M36). On two devices (his partner took out the rest) the same id meets with different content: the "which to keep" door keeps one, and one real withdrawal is lost (M61).
- Ben splits 30,000 of the extra to Savings on the 10th. A 50,000 bonus lands on the 20th and E4 offers extra again, Split to Savings. Same id `ex:<occ>:savings`: refused on one device, and only one of the two kept across two.
- Ben taps Split 40,000 to Savings on his phone while offline. His partner taps "Keep it in the bank" on hers. The ids are `ex:<occ>:savings` and `ex:<occ>:bank`, so both join: 80,000 placed from 40,000 extra. These moves have no source `place`, so the after-sync check never sees them (sync.js:490 to 513 judges only a place's own outs). Review 1 F1 asked for one record per answer for this reason.
- A freelancer has no pay occurrence to name the month, so these ids have no `<occ>` (ENDPERIOD_PLAN watch says the same).
- Also: none of `ex: cm: gp: lt:` is in ids.js `built` or in sync.js:76 `BUILT`, so `idOk` and `periodOcc` reject or ignore them.
Needs, written in the plan before slice 4:
(a) An extra-money answer is named by the money it answers: `ex:<occ of the income that made it>`. That is one record or one group per answer, holding all its moves, and a second device answering the same offer differently meets it on that one id.
(b) The cash moment names each withdrawal `cm:<occ>:<account>:<n>`, the way `close:<acct>:<n>` does. Or it treats a later Done as an edit that adds to the record, and says which, with a two-device test.
(c) A month name for no fixed pay.
(d) The prefixes added to ids.js, sync BUILT and periodOcc, with realistic-ids tests.
Cost: an id rule now. Later: doubled or lost money in real books.

N2. A percentage step under a line-level `per`.
Who: Ramil, paid every two weeks. Food is "40,000 a month" (per month). On the 20th he changes it to 15% from the next period.
What the engine holds: `per` belongs to the whole line (lookahead.js:857), and section 12 F4 sets it to 'pay' at the write door. The 40,000 step still in force this period, and every past period read for end of period leftovers (lookahead.js:1073, `past ? perPeriod(...)`), would then be read as 40,000 a pay instead of 40,000 a month shared over the pays. Food's left this period would jump, and past leftovers would be rewritten. Free to spend does not have this problem, because each share entry carries its own `per` (lookahead.js:853 to 854).
Needs: leave the line's `per` alone. Either a `pct` step means "per pay period" by itself and perPeriod is skipped for that step only, or the step carries its own `per`. Add a test of a monthly amount changed to a percent mid-life, for a two-weekly life with a three-pay month.
Cost: a reading rule now. Later: a migration of saved `per` on every line that was ever switched.

N3. A goal's `each` is one plain field.
Who: Ben raises Savings from 30,000 to 50,000 a pay on the 20th.
What the engine holds: `places[].each` has no `from`. The walk "holds it like a plan line for the period", so the change takes 20,000 off the headline today, and it re-reads this period's extra after Ben already answered it. Lines and shares change from the next period (T watch). A goal would be the one thing that changes at once.
Needs: `each` saved as steps `[{ from, amount | pct, at }]`, read by stepAmount and merged entry by entry (AI2).
Cost: a field shape now. Later: turning a plain field into an entry list on every saved goal.

## Builder findings (not in the base)
- N4. Extra money and card payments. For Mako, pay and both card payments fall on the 10th and 11th (M27, M28). With E3, those payments settle spending that last period already took off. Say plainly that card payments due in the period are not "this period's plan", and add Mako's life to extra_money.test.js (M77).
- N5. The setup period. Aki is set up on the 20th with pay already in the bank. Say whether extra is offered for the opening period. Recommendation: no, the bank today is the start (M37), or else it offers stock again.
- N6. P is "pays landing on the period's first day". A couple whose two employers both pay on the 25th, and one shifts to Friday 24th for a weekend: half the pay drops out of P, percentages halve, and the other half is shown as "extra money". Count every regular pay whose due day starts the period.
- Goal `each` end door, and M16 save per setup question.

## WATCH
- M92 says "once a month". For people paid weekly or every two weeks the cash list comes each pay (section 6). Offer "once a month" as a choice (M91). The rule "less moved since the period started" asks again the next week after a monthly withdrawal, so "fill up to the amount" may be the better rule. This is engine only, so it is cheap later, but it needs Mako's view.
- R5 changes M90's literal words. Bring it to Mako with an example (a grocery card spend does not lower the headline).
- The plan's own watch list (section 12) stands.
- The cards plan (E3) has no review yet: keep slice 1 behind one.
- Second currency: refuse at the door a burrow `held` in an account of another currency.

## Outside pieces
None new. Pay day makes no AI call. The vault stores the book whole. No new event kind is left.

## Checked and sound
- Moving cash is never spending (W1). A wallet check gap lands on the burrow the wallet `holds`.
- A grocery card spend from a cash-envelope burrow: Food left falls, the envelope's surplus rises by the same amount, and the card comes off at once. Counted once.
- "Kept in the bank" is a place, so it leaves noJob and is not offered again. The new fields are optional, and restore and the cloud copy carry them. Over 100% is held on the safe side.
- When building: the counted move into a line, widened from lookahead.js:1068, must not need the `placed` link that line reads today.
