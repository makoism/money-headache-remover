# QC round 6, Art director: FAIL

Saved by MAIN 12 from the agent's reply. artcheck.sh ART CHECK PASS (sky 589 colours, 93.9% on palette). Round 5 blocker 1 (dots over Amount) is fixed.
**MAIN 12 note:** blocker 1 is a regression of existing art Mako asked to keep (ART_GUIDE 00: "The purple wisteria on Goals stays as it is"), not new art: restoring it has one right answer and may go ahead; the rest waits for Mako.

## Blockers
1. No vines on Home and the purple wisteria on Goals is gone (390x844 and 1280x900, Finish later, scroll Home: 0 `.gv` canvases). Receipts and Plan still have theirs. Cause (agent's trace): the vine plan is keyed to `hHero`, `hGoals`, `hBuckets`, which measure 0x0 now; Home draws as one card `hMap` with no plan entry. Fix: give the new Home cards the old plan entries, wisteria on the Burrows section.
2. "Setup done" (412 panel 36) shows a smooth vector tree and house (anti-aliased lines, gradient ground, rotated soft leaves); thin line-art plants on panels 34 and 35. Breaks ART_GUIDE 2, 5, 10, 0. (Waits for Mako: art.)
3. Still open: round 5 item 2 (blurred halos on the 1280 forest; artcheck passes a 93.9% sky).

## Confusing (still open from round 5, wait for Mako)
4. Education, Investing, Giving, Bills frames. 5. Goal mounds clones and fringe. 6. Door coins do not match the money. 7. Dither over hill and frog. 8. Welcome at 390 almost no picture.
9. Visual first: Plan Burrows shows Trip and Emergency fund as bar and numbers only; put the mound above. 10. Tour "Months of bills to cover" is three number tiles; a burrow filling deeper for 1, 3, 6 months.

## Polish
11. Vines all one mint green; fern on Scan receipts a noisy blob with a 1px hairline stem; bramble three flower colours, no thorns or berries.
12. Light mode: pictures in dark teal boxes on light cards; footer pills dark.
13. Free to spend chest open with coins on the tour, closed on Home.
14. Still open round 5 items 8 to 12.
15. Screen pack captures paint the fixed Help bar over the This month card (capture, not app).
