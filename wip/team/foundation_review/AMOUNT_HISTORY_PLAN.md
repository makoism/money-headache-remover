# Amount history: an amount corrected after a bank check (plan, LANE G, 26 Nov 2026)

Read wip/team/MAKO_SAYS.md first. Ruled by coordinator 15 (26 Nov): (c) ship CHECKGAP with this case KNOWN, then (a) this plan as its own small slice, qc-foundation on the plan before building, LANE E told before act3.js is touched.

Lines served: M36 (the picture adds up), M44 (one dataset worked out from real dates), M45 (no coin counted twice), M61 (nobody loses data), M14 (Undo everywhere), M98 (walked as a person). Lines touched: M6 (an edit is still change then Undo), M20 (two devices).

## The person and the moment (M98)
Mako logged a 700 lunch on 20 Dec. His weekly bank check on 29 Dec matched. Pay landed on 10 Jan, a new period started. On 12 Jan he sees the receipt: it was 7,000, not 700, and corrects it. Today (CHECKGAP as shipped) the 7,000 counts in the closed period (it grows by 6,300) and the 29 Dec check's gap shrinks by 6,300 in that check's period; when that period is the one running, safe to spend goes UP 6,300 for a lunch he paid weeks ago. What he expects: the closed period stays as it closed (or shows the correction plainly), and nothing he can spend today goes up because he found a bigger old receipt. What else could be true: he corrects a typo the same day before any check (nothing special should happen); he corrects it twice; he corrects it on his phone while the desktop is offline; he undoes the correction; the record is a refund or a transfer, not a spend.

## The rule (one sentence)
A record's amount as it stood at the first check that holds it counts in the record's own period; any change to the amount after that check counts in that check's period, where it only explains part of the check's gap (CHECKGAP's added-later rule is the same rule with an amount of 0 at the check).

## Saved data (SCHEMA_V3 section 6.1, one optional field)
- `was: [ { a, a2?, until } ]` on an event: each entry is an amount the record had and the moment (`until`, the hybrid clock of the edit that changed it) it stopped being its amount. Written only by the write door (act3 `edit`) when `a` or `a2` changes; never by a reader; oldest first.
- The amount as of a moment m: the `a` of the first entry whose `until` is after m; with none, the record's own `a`.
- Absent on every record never corrected, so old copies and pages that do not know it read the same. A page that does not know `was` and edits the amount writes no entry: that record falls back to today's behaviour (named in scope).
- Two devices: `was` travels inside the record, which joins by its `at` as every record does; two devices correcting one amount get the "which to keep" question as today, each version with its own history.
- Undo: the edit's journal entry keeps `before.was`, so Undo puts the list back with the amount. Nothing new in the journal.

## Engine (engine/lookahead.js, one place)
- bankInfo already finds, for each record, the first check whose figure holds it (the isIn walk). CHECKGAP's `lateDay` becomes `heldAt`: record id -> { day, key } of that check.
- In leftOf's spend and refund sums: a record with `heldAt` counts `amountAt(e, heldAt.key)` on its own day and `e.a - amountAt(e, heldAt.key)` on the check's day. Told after the check: amountAt is 0 (today's CHECKGAP rule, unchanged).
- Card checks: the same, through the card loop's own first holding check.
- Nothing else reads `was`: the bank today, the gaps and what each statement owes still use the record's amount now.

## Tests first (hand-worked, made-up yen, Mako's shape)
1. 700 on 20 Dec, matched check 29 Dec, pay 10 Jan, corrected to 7,000 on 12 Jan with the check on 29 Dec in the CLOSED period: the closed period's spent and safe to spend today do not move; the 29 Dec check's gap shrinks by 6,300 and that closed period nets the same.
2. The same with the check in the RUNNING period (pay landed 25 Dec): safe to spend does not move (+6,300 corrected, gap -6,300, both in the check's period).
3. Corrected before any check holds it: counts whole on its own day, as today.
4. Two corrections (700 to 900 before the check, 900 to 7,000 after): 900 in its own period, 6,100 in the check's.
5. Undo of the correction: back to the figures before it, `was` back as it was.
6. The correction made on the phone, joined into the desktop in every record order: the same figures.
7. A refund corrected; a card spend corrected after a card check; a cents currency.
8. The reviewer's two-account case shape: safe to spend 46,063 never becomes 48,013.

## Not in this slice (named for scope.txt)
- A CHECK's own figure corrected later moves the next check's gap (scenario g2p-05's note): the same kind of fault, its own case; asked of the coordinator after this slice.
- The date of a record changed after a check (moved across a period start): kept as today unless qc-foundation finds it is the same rule.
