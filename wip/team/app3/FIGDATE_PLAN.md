# FIGDATE: a bank or card figure the person saw on an earlier day (MAIN 24, 26 Nov 2026)

Read wip/team/MAKO_SAYS.md first. Serves M37 (the bank figure is the bank on its day), M36, M45, M4 (day to day he talks to the assistant). From qc-foundation run 1 on the AI-first candidate, FOR THE BUILDER 2; coordinator 18 gave it to MAIN 24 for wip-38.31 after the candidate. Builds on F1 (the assistant's figure lists and ticks what was expected, asked first).

## A person's moment
In the evening he remembers: "my bank showed 204,000 yesterday". Today the figure would be stamped today, so any spend logged since is counted as if it happened before the figure, and items expected between yesterday and today are ticked when they had not come out by then.

## What changes (no engine or saved-data change)
- bank_figure and card_figure take an optional date. The check-in writer already takes the check-in day (engine/checkin.js `day`); the step passes it.
- What is listed and ticked is what was expected on that account on or before that day (coordinator 18's rule for F1).
- A day after today is refused; a day before that account's last figure is refused with the day of the last figure, so a dated figure never sits under a later one.
- The change card says "Main showed ¥204,000 on 30 Nov".

## Tests
tests/chatfig.test.js case 4: written on 30 Nov, Rent (27 Nov) ticked, Main 204,000; 5 Dec refused; 25 Nov (before the last figure on 30 Nov) refused, nothing written.

## Question for qc-foundation
Does a check dated yesterday but told today, with a spend dated today already in the book, read right everywhere the engine looks at "the last check" (landedFrom, the gap, the period)?
