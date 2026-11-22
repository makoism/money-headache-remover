FAIL (QC round 13 layout and touch. The reviewer could not write a file, so its reply is summarised here. Screenshots are in /tmp/qc/layout/.)

1 BLOCKER. At 320 wide, the Receipts month table breaks amounts across two lines ("$420.7" / "5", "¥123,4" / "56 over"). Seen in the pack and reproduced twice. Fix: nowrap on the amount cells, with "over" on its own line.
2. At 320, the All months status chip breaks mid-word ("Emergenc" / "y fund full").
3. At 320x640, just after Log spend, the toast covers Category, the undo bar covers Note, and the bottom bar covers the Log spend button.
4 (polish). A solid 70px band at the bottom of the screen holds only the Help pill (MAKO_RUN 1.25).
5. A 50-letter goal name with no spaces makes Home 347px wide at 320; the goal band cuts it with no ellipsis.
6. Plan > Month at 320 squeezes names to one or two words per line.
7. At 320, the vine on Your burrow and Scan receipts hangs close to the heading.
8. The tour panel is 76% see-through.
9. Visual first: the Receipts month table is numbers only; bars would show "over" at a glance.
Clean: no overflow with normal data, every tap target is at least 44px, focus is visible, Ask and Help never cover the last content, no console errors.
