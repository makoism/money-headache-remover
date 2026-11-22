# QC round 10, Money accuracy: FAIL (2 blockers)

Saved by MAIN 13 from the agent's reply. VERIFY OK, golden 0 differ vs 3831zc. Every amount in the pack's three situations recomputed by hand: all match.

## Blockers
1. Home stops adding up once Free to spend is cut for the minimum balance. Setup at 390: pay $1,000.10, balance $0.01, rent $333.33, food $333.33. Plan > Month "Free to spend $73.44"; Home "Free to spend $0 / planned: left to spend in Nov" and "Bank $0.01 + burrows $260 = $260.01"; "How is this worked out?" counts the $73.44 as spent ("Free to spend, Education, Investing, Giving −$253.44"). $0.01 + $1,000.10 − $666.66 − $260 − $0 leaves $73.44 that appears nowhere on Home. Either the bank shows $73.45, or the tile says "$73.44 planned, $0 safe to spend". Seen twice. /tmp/qc/money/a11-home-min-balance.png
2. A debt burrow: "Total owed" says "What you still owe in total", then "Already paid off". Typed ¥50,000 and ¥10,000; Home "You owe ¥36,600 at the end of Nov" (read literally, ¥46,600). Use "Total of the debt (before any payments)" or drop "Already paid off". The toast says "Goal added. Laptop: full Oct 2027." It should say "paid off Oct 2027".

## Confusing
1. After Check your bank (plan start ¥300,000, typed ¥150,000), Home still says "Bank at month end ¥300,000", "¥30,000 safe to spend", Plan "On plan"; the gap is never named (MAKO_RUN 1.1).
2. Status disagrees across screens when the bank is below zero today: Home "Bank below zero", Plan chip "All of your pay has a place in Nov · On plan"; yen overdrawn Home "Not safe to spend yet" vs All months "Not placed yet".
3. Two percent rules side by side (percent full floored, pay split largest remainder): "¥80,000 28%" (28.57%) next to "¥30,000 11%" (10.71%) (MAKO_RUN 1.14, 1.20).
4. A minimum balance nobody typed drives Short and safe to spend $0 (MAKO_RUN 1.6).
5. Pay 0 with real bills still says "Sample numbers" and hides the typed ¥100,000 balance (MAKO_RUN 1.12).
6. Sample goal "Yearly cost" stops after "Full May 2027"; from Jun 2027 its ¥2,900 shows as Not placed yet. "On track" vs "Filling" with the same full date.
7. The toast "This is yours to spend." while Free to spend reads $0.

## Polish
1. Home "¥21,311 a week ... for the 9 days left" vs Plan "about ¥7,000 a week": two weekly figures, no label.
2. Tour split: same usual share, different amounts ("Goal burrows ¥30,000" vs "Education ¥27,500").
3. Visual first: "In your bank now" is a bare number.
Files: /tmp/qc/money/.
